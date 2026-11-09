import { ACHIEVEMENTS } from '@gymbro/content';
import {
  PARAMETERS,
  challengeChaptersCrossed,
  daysBetween,
  addDays,
  type LocalDate,
  type PlayerState,
} from '@gymbro/domain';
import type { EventEmitter } from '../events/emitter.js';
import type {
  AchievementsRepository,
  DaysRepository,
  NoticesRepository,
  RiskSignalsRepository,
  UserRecord,
} from '../ports/repositories.js';
import { hadRiskSignal } from './risk.js';

/**
 * Logros del catálogo (T-063, RN-GAM-011, RN-GAM-012). Cada logro se guarda una
 * sola vez en la bitácora y se anuncia en la próxima interacción: LG-01 en
 * general (decisión del PO, 2026-11-09) y RE-01/RE-05 para el Reto 66. Con el
 * juego desactivado o una señal de riesgo ese día, se guarda sin anunciarlo:
 * un logro alcanzado no se pierde (constitución I).
 */

export interface AchievementDeps {
  achievements: AchievementsRepository;
  notices: NoticesRepository;
  riskSignals: RiskSignalsRepository;
  events: EventEmitter;
  clock: () => Date;
}

interface Announcement {
  readonly templateId: string;
  readonly variables: Readonly<Record<string, string | number>>;
}

/** Guarda el logro `code` del catálogo; devuelve true si es nuevo. */
export async function unlockAchievement(
  user: UserRecord,
  code: string,
  date: LocalDate,
  value: string | number | null,
  deps: AchievementDeps,
  announcement?: Announcement,
): Promise<boolean> {
  const entry = ACHIEVEMENTS.find((a) => a.code === code);
  if (!entry) return false;
  const now = deps.clock();
  const { added } = await deps.achievements.appendOnce({
    userId: user.id,
    code,
    at: now,
    value,
    context: date,
  });
  if (!added) return false;
  await deps.events.emit(
    'achievement_unlocked',
    { userId: user.id, timezone: user.timezone },
    { code },
  );
  if (!user.settings.gamificationEnabled || (await hadRiskSignal(user, date, deps))) return true;
  const { templateId, variables } = announcement ?? {
    templateId: 'LG-01',
    variables: { nombre: entry.name },
  };
  await deps.notices.add(user.id, {
    key: `achievement:${code}`,
    templateId,
    variables,
    createdAt: now,
  });
  return true;
}

/** Códigos del catálogo con número (`DQC_100` → 100, `WEEKS_4` → 4). */
function numberedCodes(prefix: string): { code: string; value: number }[] {
  const pattern = new RegExp(`^${prefix}_(\\d+)$`);
  return ACHIEVEMENTS.flatMap((a) => {
    const match = pattern.exec(a.code);
    return match ? [{ code: a.code, value: Number(match[1]) }] : [];
  });
}

/** Número de días de la condición del catálogo ("7 días seguidos…", "7+ días…"). */
function conditionDays(code: string): number | null {
  const match = /(\d+)\+? días/.exec(ACHIEVEMENTS.find((a) => a.code === code)?.condition ?? '');
  return match ? Number(match[1]) : null;
}

const PROTEIN_WEEK = 'PROTEIN_WEEK';
const COMEBACK = 'COMEBACK';
const FIRST_FULFILLED_WEEK = 'WEEK_1';

/**
 * Logros que se deciden al cerrar el día `date` (paso de `before` a `after`):
 * Reto 66 (P-043, P-044), días que cuentan acumulados, semanas cumplidas,
 * semana de proteína y regreso tras días sin actividad.
 */
export async function closeDayAchievements(
  user: UserRecord,
  date: LocalDate,
  before: PlayerState,
  after: PlayerState,
  deps: AchievementDeps & { days: DaysRepository },
): Promise<void> {
  const from = before.counted.total;
  const to = after.counted.total;
  const chapters: readonly number[] = PARAMETERS.challenge66.chapters;
  for (const chapter of challengeChaptersCrossed(from, to)) {
    const forged = chapter >= PARAMETERS.challenge66.days;
    await unlockAchievement(user, `CH66_${chapter}`, date, to, deps, {
      templateId: forged ? 'RE-05' : 'RE-01',
      variables: forged ? {} : { capitulo: chapters.indexOf(chapter) + 1, dias: chapter },
    });
  }
  for (const { code, value } of numberedCodes('DQC')) {
    if (from < value && value <= to) await unlockAchievement(user, code, date, to, deps);
  }
  if (after.weekStreak > before.weekStreak) {
    await unlockAchievement(user, FIRST_FULFILLED_WEEK, date, after.weekStreak, deps);
    for (const { code, value } of numberedCodes('WEEKS')) {
      if (before.weekStreak < value && value <= after.weekStreak) {
        await unlockAchievement(user, code, date, after.weekStreak, deps);
      }
    }
  }
  await historyAchievements(user, date, to > from, deps);
}

/** PROTEIN_WEEK y COMEBACK dependen de los días anteriores. */
async function historyAchievements(
  user: UserRecord,
  date: LocalDate,
  counted: boolean,
  deps: AchievementDeps & { days: DaysRepository },
): Promise<void> {
  const history = await deps.days.history(user.id);
  const proteinDays = conditionDays(PROTEIN_WEEK);
  if (proteinDays) {
    const window = Array.from({ length: proteinDays }, (_, i) => addDays(date, -i));
    const half = new Set(history.filter((d) => d.nutritionHalf).map((d) => d.date));
    if (window.every((d) => half.has(d))) {
      await unlockAchievement(user, PROTEIN_WEEK, date, proteinDays, deps);
    }
  }
  const pauseDays = conditionDays(COMEBACK);
  if (!counted || !pauseDays) return;
  const previous = history
    .filter((d) => d.counted && d.date < date)
    .map((d) => d.date)
    .sort()
    .at(-1);
  const gap = previous ? daysBetween(previous, date) - 1 : 0;
  if (gap >= pauseDays) await unlockAchievement(user, COMEBACK, date, gap, deps);
}
