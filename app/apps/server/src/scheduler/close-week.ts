import {
  addDays,
  compareWithOwnHistory,
  evaluateWeek,
  overuseSignal,
  pauseTouchesWeek,
  weekStartOf,
  type LocalDate,
  type WeekAchieved,
  type WeekResult,
} from '@gymbro/domain';
import { unlockAchievement } from '../days/achievements.js';
import { hadRiskSignal } from '../days/risk.js';
import { grantXp, type XpDeps } from '../days/xp.js';
import { plannedWeekDays } from '../plans/weekly-plan.js';
import type {
  DaysRepository,
  GoalsRepository,
  MessageStatsRepository,
  PlansRepository,
  UserRecord,
  WeekRecord,
  WeeksRepository,
  WorkoutSessionsRepository,
} from '../ports/repositories.js';

/**
 * Semana cumplida (T-062, HU-005-5, RN-GAM-004). Al cerrar el último día de la
 * semana (domingo, P-070) se evalúa: sesiones completadas frente al compromiso.
 * Cumplida suma XP (P-038), extiende la racha de semanas y deja SM-01 para la
 * próxima interacción. No cumplida no dice nada (constitución I).
 */

export interface CloseWeekDeps extends XpDeps {
  days: DaysRepository;
  plans: PlansRepository;
  workouts: WorkoutSessionsRepository;
  weeks: WeeksRepository;
  /** RN-MSJ-013: la semana que toca una `/pausa` no se evalúa. */
  messageStats: MessageStatsRepository;
  /** RN-MAN-002: en mantenimiento la semana se cumple con P-010 sesiones. */
  goals: GoalsRepository;
}

export interface ClosedWeek {
  readonly record: WeekRecord;
  readonly result: WeekResult;
}

const WEEK_LENGTH = 7;

/** RN-GAM-004: evalúa la semana si `date` es su último día; si no, null. */
export async function evaluateClosedWeek(
  user: UserRecord,
  date: LocalDate,
  deps: CloseWeekDeps,
): Promise<ClosedWeek | null> {
  const weekStart = weekStartOf(date);
  if (addDays(weekStart, WEEK_LENGTH - 1) !== date) return null;
  const days = await plannedWeekDays(user, weekStart, deps);
  const planned = days.filter((d) => d.type === 'TRAINING').length;
  const achieved = await weekAchieved(user, weekStart, date, deps);
  // RN-SEG-008: en cuántos descansos del plan se completó una sesión.
  const restDays = days.filter((d) => d.type === 'REST').map((d) => d.date);
  let restDaysTrained = 0;
  for (const rest of restDays) {
    const sessions = await deps.workouts.onDate(user.id, rest);
    if (sessions.some((s) => s.status === 'completed')) restDaysTrained += 1;
  }
  // RN-MSJ-013 (PO, 2026-11-11): la semana que toca una /pausa no se evalúa.
  const { pausedAt, pausedUntil } = await deps.messageStats.get(user.id);
  const pause = pausedAt && pausedUntil ? { from: pausedAt, until: pausedUntil } : null;
  const paused = pauseTouchesWeek(pause, weekStart, user.timezone);
  const maintenance = (await deps.goals.active(user.id))?.type === 'maintain';
  const result = evaluateWeek({ planned, completed: achieved.sessions, paused, maintenance });
  return {
    record: {
      weekStart,
      planned,
      completed: achieved.sessions,
      commitment: result.evaluated ? result.commitment : 0,
      fulfilled: result.evaluated && result.fulfilled,
      countedDays: achieved.countedDays,
      nutritionHalfDays: achieved.nutritionHalfDays,
      restDaysPlanned: restDays.length,
      restDaysTrained,
    },
    result,
  };
}

/**
 * Lo logrado en la semana de `weekStart` hasta `until` (incluido): sesiones
 * completadas, días con la mitad de comida y días que cuentan (RN-GAM-004/008).
 */
export async function weekAchieved(
  user: UserRecord,
  weekStart: LocalDate,
  until: LocalDate,
  deps: Pick<CloseWeekDeps, 'days' | 'workouts'>,
): Promise<WeekAchieved> {
  const dates = Array.from({ length: WEEK_LENGTH }, (_, i) => addDays(weekStart, i)).filter(
    (d) => d <= until,
  );
  let sessions = 0;
  for (const day of dates) {
    const done = await deps.workouts.onDate(user.id, day);
    sessions += done.filter((s) => s.status === 'completed').length;
  }
  const week = (await deps.days.history(user.id)).filter((d) => dates.includes(d.date));
  return {
    sessions,
    nutritionHalfDays: week.filter((d) => d.nutritionHalf).length,
    countedDays: week.filter((d) => d.counted).length,
  };
}

const BEST_WEEK = 'BEST_WEEK';

/**
 * T-064 · liga personal (HU-005-8, RN-GAM-009): la semana solo se compara con
 * las anteriores del mismo usuario. Si supera su mejor semana en días que
 * cuentan (y hay al menos una anterior), RE-03; la primera vez, además, el logro
 * "Mejor semana" queda en la bitácora. No existe comparación entre usuarios.
 */
async function announceBestWeek(
  user: UserRecord,
  date: LocalDate,
  current: WeekRecord,
  earlier: readonly WeekRecord[],
  deps: CloseWeekDeps,
): Promise<void> {
  const previous = earlier.find((w) => w.weekStart === addDays(current.weekStart, -WEEK_LENGTH));
  if (earlier.length === 0) return;
  const { isNewBest } = compareWithOwnHistory({
    current: current.countedDays,
    previous: previous?.countedDays ?? null,
    best: Math.max(...earlier.map((w) => w.countedDays)),
  });
  if (!isNewBest) return;
  const announcement = { templateId: 'RE-03', variables: { dqc: current.countedDays } };
  const first = await unlockAchievement(
    user,
    BEST_WEEK,
    date,
    current.countedDays,
    deps,
    announcement,
  );
  if (first || !user.settings.gamificationEnabled || (await hadRiskSignal(user, date, deps))) {
    return;
  }
  await deps.notices.add(user.id, {
    key: `RE-03:${current.weekStart}`,
    ...announcement,
    createdAt: deps.clock(),
  });
}

/**
 * T-065 · RN-SEG-008 (HU-009-5): si en las últimas P-064 semanas entrenó en
 * todos sus descansos, CU-06 en la próxima interacción y `overuse_signal`. Es una
 * respuesta de cuidado: no depende de que el juego esté activo.
 */
async function checkRestOveruse(
  user: UserRecord,
  current: WeekRecord,
  earlier: readonly WeekRecord[],
  deps: CloseWeekDeps,
): Promise<void> {
  const recentWeeks = [...earlier, current].map((w) => ({
    restDaysPlanned: w.restDaysPlanned,
    restDaysTrained: w.restDaysTrained,
  }));
  if (!overuseSignal({ sessionsToday: 0, recentWeeks })) return;
  await deps.events.emit(
    'overuse_signal',
    { userId: user.id, timezone: user.timezone },
    { reason: 'rest_days' },
  );
  await deps.notices.add(user.id, {
    key: `CU-06:${current.weekStart}`,
    templateId: 'CU-06',
    variables: {},
    createdAt: deps.clock(),
  });
}

/** Guarda la semana, emite `week_closed` y, si se cumplió, su XP y SM-01. */
export async function announceWeek(
  user: UserRecord,
  date: LocalDate,
  week: ClosedWeek,
  riskPaused: boolean,
  deps: CloseWeekDeps,
): Promise<void> {
  const earlier = (await deps.weeks.list(user.id)).filter(
    (w) => w.weekStart < week.record.weekStart,
  );
  await deps.weeks.save(user.id, week.record);
  await announceBestWeek(user, date, week.record, earlier, deps);
  await checkRestOveruse(user, week.record, earlier, deps);
  if (!week.result.evaluated) return;
  const { record } = week;
  await deps.events.emit(
    'week_closed',
    { userId: user.id, timezone: user.timezone },
    { fulfilled: record.fulfilled, sessions: record.completed, commitment: record.commitment },
  );
  if (!record.fulfilled) return;
  await grantXp(user, date, { type: 'FULFILLED_WEEK' }, `week:${record.weekStart}`, deps);
  if (!user.settings.gamificationEnabled || riskPaused) return;
  await deps.notices.add(user.id, {
    key: `SM-01:${record.weekStart}`,
    templateId: 'SM-01',
    variables: { sesiones: record.completed, compromiso: record.commitment },
    createdAt: deps.clock(),
  });
}
