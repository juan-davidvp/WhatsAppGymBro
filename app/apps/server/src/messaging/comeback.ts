import { PARAMETERS, addDays, operationalDate, type LocalDate } from '@gymbro/domain';
import { plannedDayType } from '../plans/weekly-plan.js';
import type { UserRecord } from '../ports/repositories.js';
import type { ComposeDeps } from './compose.js';

/**
 * Entradas de RN-MSJ-008 (`comebackAction`) a partir de lo guardado. Actividad
 * = un día que contó o que tuvo la mitad de comida. Solo se mira la ventana de
 * P-053 días (más allá aplica el `regreso` final) y nunca antes del alta.
 */

export interface ComebackInputs {
  readonly missedPlannedTrainingDays: number;
  readonly daysWithoutActivity: number;
  readonly comebackAlreadySent: boolean;
}

const DAY_MS = 86_400_000;

export async function comebackInputs(
  user: UserRecord,
  today: LocalDate,
  deps: ComposeDeps,
): Promise<ComebackInputs> {
  const window = PARAMETERS.messages.inactivityPauseDays;
  const joined = operationalDate(user.createdAt, user.timezone);
  const windowStart = addDays(today, -window);
  const from = joined > windowStart ? joined : windowStart;

  const active = (await deps.days.history(user.id))
    .filter((d) => (d.counted || d.nutritionHalf) && d.date <= today)
    .map((d) => d.date)
    .sort();
  const lastActivity = active.at(-1) ?? null;
  // Días anteriores a hoy, desde la última actividad (o el alta) y dentro de la ventana.
  const since = lastActivity !== null && lastActivity >= from ? addDays(lastActivity, 1) : from;
  const quietDays: LocalDate[] = [];
  for (let d = since; d < today; d = addDays(d, 1)) quietDays.push(d);

  let missedPlannedTrainingDays = 0;
  for (const day of quietDays) {
    if ((await plannedDayType(user, day, deps)) === 'TRAINING') missedPlannedTrainingDays += 1;
  }
  const sent = await deps.outbox.sentSince(
    user.id,
    new Date(deps.clock().getTime() - window * DAY_MS),
  );
  const comebackAlreadySent = sent.some(
    (m) =>
      m.purpose === 'regreso' &&
      (lastActivity === null || operationalDate(m.sentAt, user.timezone) > lastActivity),
  );
  return { missedPlannedTrainingDays, daysWithoutActivity: quietDays.length, comebackAlreadySent };
}

/** Disparador único de `recordatorio_contextual` (PO, 2026-11-10): ayer entreno sin contar, hoy descanso. */
export async function contextualReminderApplies(
  user: UserRecord,
  today: LocalDate,
  deps: ComposeDeps,
): Promise<boolean> {
  const yesterday = addDays(today, -1);
  if (yesterday < operationalDate(user.createdAt, user.timezone)) return false;
  if ((await plannedDayType(user, today, deps)) !== 'REST') return false;
  if ((await plannedDayType(user, yesterday, deps)) !== 'TRAINING') return false;
  const history = await deps.days.history(user.id);
  return !history.some((d) => d.date === yesterday && d.counted);
}
