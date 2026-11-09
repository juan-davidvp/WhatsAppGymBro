import {
  addDays,
  evaluateDay,
  lastClosableDate,
  operationalDate,
  type DayStatus,
  type DayType,
  type LocalDate,
} from '@gymbro/domain';
import { MOBILITY_SOURCE, NUTRITION_HALF_SOURCE, dayInputsFrom } from '../days/day-status.js';
import type { EventEmitter } from '../events/emitter.js';
import type { DaySource } from '../events/schema.js';
import { plannedDayType } from '../plans/weekly-plan.js';
import type {
  DaysRepository,
  PlansRepository,
  StreakStatesRepository,
  UserRecord,
  UsersRepository,
} from '../ports/repositories.js';

/**
 * Cierre programado del día (T-060, FR-005-02). Cada ciclo cierra, en orden, los
 * días de cada usuario cuya gracia terminó (RN-DQC-005): evalúa el día con lo
 * registrado, lo guarda cerrado y lo suma al total (RN-DQC-007). Es idempotente:
 * el estado guarda el último día cerrado y cerrar otra vez no cambia nada.
 * Un día sin registros también se cierra: no cuenta, pero no resta.
 */

export interface CloseDaysDeps {
  users: UsersRepository;
  days: DaysRepository;
  streaks: StreakStatesRepository;
  plans: PlansRepository;
  events: EventEmitter;
  clock: () => Date;
}

/** Cierra los días vencidos de todos los usuarios activos; devuelve cuántos cerró. */
export async function closeDueDays(deps: CloseDaysDeps): Promise<number> {
  const now = deps.clock();
  let closed = 0;
  for (const user of await deps.users.listActive()) {
    closed += await closeUserDays(user, now, deps);
  }
  return closed;
}

/** Días por cerrar: desde el siguiente al último cerrado (o el día del onboarding) hasta el último vencido. */
export async function closeUserDays(
  user: UserRecord,
  now: Date,
  deps: CloseDaysDeps,
): Promise<number> {
  const completedAt = user.onboarding.completedAt;
  if (!completedAt) return 0;
  const lastClosed = await deps.streaks.lastClosedDate(user.id);
  const first = lastClosed ? addDays(lastClosed, 1) : operationalDate(completedAt, user.timezone);
  const until = lastClosableDate(now, user.timezone);
  let closed = 0;
  for (let date = first; date <= until; date = addDays(date, 1)) {
    if (await closeOneDay(user, date, now, deps)) closed += 1;
  }
  return closed;
}

async function closeOneDay(
  user: UserRecord,
  date: LocalDate,
  now: Date,
  deps: CloseDaysDeps,
): Promise<boolean> {
  // El tipo con el que se registró manda (lo que vio el usuario); si no hay registro, el del plan.
  const type: DayType =
    (await deps.days.dayType(user.id, date)) ?? (await plannedDayType(user, date, deps));
  const sources = await deps.days.sources(user.id, date);
  const status = evaluateDay(dayInputsFrom(type, sources));
  await deps.days.close(user.id, date, type, status, now);
  const { applied } = await deps.streaks.applyDayClose(user.id, { date, counted: status.counts });
  if (!applied) return false;
  await deps.events.emit(
    'day_closed',
    { userId: user.id, timezone: user.timezone },
    {
      date,
      dayType: type,
      counted: status.counts,
      complete: status.complete,
      source: countingSource(status, sources),
    },
  );
  return true;
}

/** Qué hizo contar el día, para `day_closed.source` (RN-DQC-002, RN-DQC-003). */
function countingSource(status: DayStatus, sources: readonly string[]): DaySource {
  if (!status.counts) return 'none';
  if (status.trainingHalf) return 'session';
  if (sources.includes(NUTRITION_HALF_SOURCE)) return 'nutrition';
  if (sources.includes(MOBILITY_SOURCE)) return 'mobility';
  return 'none';
}
