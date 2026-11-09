import { renderWeekLine } from '@gymbro/content';
import {
  PARAMETERS,
  addDays,
  evaluateDay,
  liveCountedDays,
  operationalDate,
  operationalDayStart,
  repairStreak,
  weekMarks,
  weekStartOf,
  type DayStatus,
  type DayType,
  type LocalDate,
} from '@gymbro/domain';
import type { EventEmitter } from '../events/emitter.js';
import type { Reply } from '../onboarding/replies.js';
import type {
  DaysRepository,
  NoticesRepository,
  RiskSignalsRepository,
  StreakStatesRepository,
  UserRecord,
  WorkoutSessionsRepository,
} from '../ports/repositories.js';

/**
 * Registro del día mientras está abierto. Cada actividad se guarda como fuente
 * del día (`session:<id>` completada, `mobility`, `nutrition_half`), el dominio
 * evalúa el día (RN-DQC-002/003) y se calculan el total y la racha en vivo
 * (RN-GAM-001, RN-DQC-007) sobre lo que ya guardó el cierre programado (T-060).
 */

export const MOBILITY_SOURCE = 'mobility';
/** RN-NUT-003: la mitad de comida del día se cumplió (T-050). */
export const NUTRITION_HALF_SOURCE = 'nutrition_half';
export const sessionSource = (sessionId: string) => `session:${sessionId}`;

export interface DayResult {
  readonly status: DayStatus;
  /** N.º del día que cuenta (total con hoy) y racha en vivo. */
  readonly total: number;
  readonly streak: number;
  /** HU-005-1: la semana del día en una línea (DC-03). */
  readonly weekLine: string;
}

type HistoryDay = Awaited<ReturnType<DaysRepository['history']>>[number];

/** HU-005-1 y RN-DQC-002 a 005: DC-03 de la semana de `date`, vista en `now`. */
function weekLineOf(
  history: readonly HistoryDay[],
  date: LocalDate,
  now: Date,
  timeZone: string,
): string {
  const today = operationalDate(now, timeZone);
  return renderWeekLine(weekMarks(weekStartOf(date), history, today, now, timeZone));
}

/** DC-03 de la semana de hoy (🏋️ Hoy). */
export async function weekLineFor(
  user: UserRecord,
  deps: { days: DaysRepository; clock: () => Date },
): Promise<string> {
  const now = deps.clock();
  const history = await deps.days.history(user.id);
  return weekLineOf(history, operationalDate(now, user.timezone), now, user.timezone);
}

/** Respuesta de "día que cuenta" con la semana en una línea en su propio renglón. */
export function withWeekLine(reply: Reply, result: Pick<DayResult, 'weekLine'>): Reply {
  return { ...reply, text: `${reply.text}\n${result.weekLine}` };
}

/** RN-DQC-002 y RN-DQC-003: entradas del día a partir de sus fuentes. */
export function dayInputsFrom(type: DayType, sources: readonly string[]) {
  return {
    type,
    sessionsCompleted: sources.filter((s) => s.startsWith('session:')).length,
    importedActivityMinutes: [],
    nutritionHalf: sources.includes(NUTRITION_HALF_SOURCE),
    importedSteps: 0,
    mobilityMinutes: sources.includes(MOBILITY_SOURCE) ? PARAMETERS.day.restMobilityMinutes : 0,
  };
}

/** Lo que necesita el registro del día en vivo (T-060, T-061). */
export interface DayDeps {
  days: DaysRepository;
  streaks: StreakStatesRepository;
  notices: NoticesRepository;
  workouts: WorkoutSessionsRepository;
  riskSignals: RiskSignalsRepository;
  events: EventEmitter;
  clock: () => Date;
}

/**
 * Añade una actividad al día, lo evalúa y guarda su estado. Si hay una
 * reparación abierta y el día ya tiene la misión de regreso, repara la racha
 * (RN-GAM-003). El total y la racha en vivo parten de lo ya cerrado (T-061).
 */
export async function recordDayActivity(
  user: UserRecord,
  date: LocalDate,
  type: DayType,
  source: string,
  deps: DayDeps,
): Promise<DayResult> {
  const sources = await deps.days.addSource(user.id, date, type, source);
  const status = evaluateDay(dayInputsFrom(type, sources));
  await deps.days.saveStatus(user.id, date, type, status);
  await attemptRepair(user, date, sources, deps);
  const history = await deps.days.history(user.id);
  const stored = await deps.streaks.get(user.id);
  const closed = stored ? { total: stored.state.counted.total, streak: stored.state.streak } : null;
  const live = liveCountedDays(history, date, user.timezone, closed);
  return {
    status,
    total: live.total,
    streak: live.current,
    weekLine: weekLineOf(history, date, deps.clock(), user.timezone),
  };
}

/** RN-SEG-007 y FR-005-07: ¿hubo una señal de riesgo en el día operativo `date`? */
export async function hadRiskSignal(
  user: UserRecord,
  date: LocalDate,
  deps: { riskSignals: RiskSignalsRepository },
): Promise<boolean> {
  const from = operationalDayStart(date, user.timezone);
  const to = operationalDayStart(addDays(date, 1), user.timezone);
  return (await deps.riskSignals.instantsBetween(user.id, from, to)).length > 0;
}

/**
 * RN-GAM-003 (HU-005-2): la misión de regreso es una sesión completada (la exprés
 * basta) y la mitad de comida, el mismo día y dentro del plazo de P-035 horas. Con
 * una señal de riesgo ese día no se repara (FR-005-07): la oferta sigue mientras dure el plazo.
 */
async function attemptRepair(
  user: UserRecord,
  date: LocalDate,
  sources: readonly string[],
  deps: DayDeps,
): Promise<void> {
  const stored = await deps.streaks.get(user.id);
  if (!stored?.state.streak.repair) return;
  if (await hadRiskSignal(user, date, deps)) return;
  const now = deps.clock();
  const sessions = await deps.workouts.onDate(user.id, date);
  const result = repairStreak(stored.state.streak, {
    date,
    at: now,
    sessionCompleted: sessions.some((s) => s.status === 'completed'),
    nutritionHalf: sources.includes(NUTRITION_HALF_SOURCE),
  });
  if (!result.repaired) return;
  const saved = await deps.streaks.save(user.id, stored.rev, {
    ...stored.state,
    streak: result.state,
  });
  if (!saved) return;
  await deps.events.emit(
    'streak_repaired',
    { userId: user.id, timezone: user.timezone },
    { streak: result.state.current },
  );
  if (user.settings.gamificationEnabled) {
    await deps.notices.add(user.id, {
      key: `streak_repaired:${date}`,
      templateId: 'RA-03',
      variables: {},
      createdAt: now,
    });
  }
}

/** ¿El día ya cuenta? (para no ofrecer otra vez lo que ya se hizo). */
export async function dayCounts(
  user: UserRecord,
  date: LocalDate,
  deps: { days: DaysRepository },
): Promise<boolean> {
  return (await deps.days.history(user.id)).some((d) => d.date === date && d.counted);
}
