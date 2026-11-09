import {
  addDays,
  evaluateWeek,
  weekStartOf,
  type LocalDate,
  type WeekResult,
} from '@gymbro/domain';
import { grantXp, type XpDeps } from '../days/xp.js';
import { plannedWeekDays } from '../plans/weekly-plan.js';
import type {
  DaysRepository,
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
  const dates = Array.from({ length: WEEK_LENGTH }, (_, i) => addDays(weekStart, i));
  const planned = (await plannedWeekDays(user, weekStart, deps)).filter(
    (d) => d.type === 'TRAINING',
  ).length;
  let completed = 0;
  for (const day of dates) {
    const sessions = await deps.workouts.onDate(user.id, day);
    completed += sessions.filter((s) => s.status === 'completed').length;
  }
  const countedDays = (await deps.days.history(user.id)).filter(
    (d) => d.counted && dates.includes(d.date),
  ).length;
  // Solo se cierran días de usuarios activos: un usuario en pausa no llega aquí (T-073).
  const result = evaluateWeek({ planned, completed, paused: false });
  return {
    record: {
      weekStart,
      planned,
      completed,
      commitment: result.evaluated ? result.commitment : 0,
      fulfilled: result.evaluated && result.fulfilled,
      countedDays,
    },
    result,
  };
}

/** Guarda la semana, emite `week_closed` y, si se cumplió, su XP y SM-01. */
export async function announceWeek(
  user: UserRecord,
  date: LocalDate,
  week: ClosedWeek,
  riskPaused: boolean,
  deps: CloseWeekDeps,
): Promise<void> {
  await deps.weeks.save(user.id, week.record);
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
