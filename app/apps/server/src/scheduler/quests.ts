import { QUEST_LABELS } from '@gymbro/content';
import {
  addDays,
  generateWeeklyQuests,
  questsReached,
  weekStartOf,
  type LocalDate,
  type WeeklyQuest,
} from '@gymbro/domain';
import { hadRiskSignal } from '../days/risk.js';
import { grantXp } from '../days/xp.js';
import type { QuestsRepository, UserRecord } from '../ports/repositories.js';
import { weekAchieved, type CloseWeekDeps } from './close-week.js';

/**
 * Misiones semanales (T-063, HU-005-6, RN-GAM-008). Al cerrar un día se asegura
 * que la semana del día siguiente tenga sus 3 misiones (la primera semana, con
 * el mínimo; después, P-041 × lo logrado la semana anterior) y se revisan las de
 * la semana del día cerrado. Avisos: MI-01 al generarlas y MI-02 al cumplir una
 * (decisión del PO, 2026-11-09), en la próxima interacción.
 */

export interface QuestDeps extends CloseWeekDeps {
  quests: QuestsRepository;
}

const WEEK_LENGTH = 7;

/**
 * Genera las misiones de la semana `weekStart` si todavía no existen y deja MI-01.
 * Si el aviso falló antes, se vuelve a intentar: su clave evita duplicarlo.
 */
export async function ensureWeekQuests(
  user: UserRecord,
  weekStart: LocalDate,
  deps: QuestDeps,
): Promise<void> {
  const quests = (await deps.quests.get(user.id, weekStart)) ?? (await createQuests());
  const target = (kind: string) => quests.find((q) => q.kind === kind)?.target ?? 0;
  if (!user.settings.gamificationEnabled) return;
  await deps.notices.add(user.id, {
    key: `MI-01:${weekStart}`,
    templateId: 'MI-01',
    variables: {
      entreno: target('TRAINING'),
      comida: target('NUTRITION'),
      constancia: target('CONSISTENCY'),
    },
    createdAt: deps.clock(),
  });

  async function createQuests(): Promise<readonly WeeklyQuest[]> {
    const previousStart = addDays(weekStart, -WEEK_LENGTH);
    const previous = (await deps.weeks.list(user.id)).find((w) => w.weekStart === previousStart);
    const generated = generateWeeklyQuests(
      previous
        ? {
            sessions: previous.completed,
            nutritionHalfDays: previous.nutritionHalfDays,
            countedDays: previous.countedDays,
          }
        : null,
    );
    const { created } = await deps.quests.create(user.id, weekStart, generated);
    if (created) {
      const of = (kind: string) => generated.find((q) => q.kind === kind)?.target ?? 0;
      await deps.events.emit(
        'quest_generated',
        { userId: user.id, timezone: user.timezone },
        { training: of('TRAINING'), nutrition: of('NUTRITION'), consistency: of('CONSISTENCY') },
      );
    }
    return generated;
  }
}

/**
 * Marca cumplidas las misiones de la semana de `date` que ya alcanzaron su meta.
 * Un día con señal de riesgo no las evalúa (FR-005-07): se cumplen con el cierre
 * de un día siguiente, sin perder su XP. El XP y el aviso van antes de marcarla:
 * si algo falla, el ciclo siguiente lo repite y las claves evitan duplicados.
 */
export async function evaluateQuests(
  user: UserRecord,
  date: LocalDate,
  deps: QuestDeps,
): Promise<void> {
  if (await hadRiskSignal(user, date, deps)) return;
  const weekStart = weekStartOf(date);
  const quests = await deps.quests.get(user.id, weekStart);
  if (!quests) return;
  const pending = quests.filter((q) => !q.done);
  const achieved = await weekAchieved(user, weekStart, date, deps);
  for (const kind of questsReached(pending, achieved)) {
    await grantXp(user, date, { type: 'WEEKLY_QUEST' }, `quest:${weekStart}:${kind}`, deps);
    if (user.settings.gamificationEnabled) {
      await deps.notices.add(user.id, {
        key: `MI-02:${weekStart}:${kind}`,
        templateId: 'MI-02',
        variables: {
          mision: QUEST_LABELS[kind],
          meta: pending.find((q) => q.kind === kind)?.target ?? 0,
        },
        createdAt: deps.clock(),
      });
    }
    if (await deps.quests.markDone(user.id, weekStart, kind)) {
      await deps.events.emit(
        'quest_completed',
        { userId: user.id, timezone: user.timezone },
        { kind },
      );
    }
  }
}
