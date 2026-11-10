import {
  PARAMETERS,
  operationalDate,
  planReadyAt,
  weekStartOf,
  weekdayOf,
  zonedTimeToInstant,
  type LocalDate,
  type LocalTime,
  type MessagePurpose,
} from '@gymbro/domain';
import { ensureWeek } from '../plans/weekly-plan.js';
import type {
  NewOutboxMessage,
  OutboxRepository,
  TrainingHabitsRepository,
  UserRecord,
  UsersRepository,
} from '../ports/repositories.js';
import type { ComposeDeps } from './compose.js';

/**
 * Programación de candidatos (T-070, T-071, FR-007-02): en cada ciclo, por usuario
 * activo, se ponen en la bandeja las salidas del día operativo. La clave
 * (propósito + día) hace que programar otra vez no duplique nada. Aquí no se
 * decide si se envían: eso lo hace el motor al enviar (`dispatch.ts`).
 */

export interface ScheduleDeps extends ComposeDeps {
  users: UsersRepository;
  outbox: OutboxRepository;
  habits: TrainingHabitsRepository;
}

/** Programa los candidatos de hoy de todos los usuarios activos; devuelve cuántos creó. */
export async function scheduleCandidates(deps: ScheduleDeps): Promise<number> {
  const now = deps.clock();
  let created = 0;
  for (const user of await deps.users.listActive()) {
    const today = operationalDate(now, user.timezone);
    const candidates = await planReadyCandidate(user, today, deps);
    for (const candidate of candidates) {
      if (candidate.notAfter && now.getTime() > candidate.notAfter.getTime()) continue;
      if (await schedule(user, candidate, now, deps)) created += 1;
    }
  }
  return created;
}

async function schedule(
  user: UserRecord,
  candidate: NewOutboxMessage,
  now: Date,
  deps: ScheduleDeps,
): Promise<boolean> {
  const { created } = await deps.outbox.schedule(candidate, now);
  if (created) {
    await deps.events.emit(
      'message_scheduled',
      { userId: user.id, timezone: user.timezone },
      { purpose: candidate.purpose },
    );
  }
  return created;
}

/** Clave de una salida: un propósito por día operativo. */
export const outboxKey = (purpose: MessagePurpose, date: LocalDate) => `${purpose}:${date}`;

/**
 * RN-MSJ-005: hora habitual del día de la semana (la declarada en el hábito; si
 * ese día no estaba en el hábito, la de su franja, P-083).
 */
export async function usualStart(
  user: UserRecord,
  date: LocalDate,
  deps: { habits: TrainingHabitsRepository },
): Promise<LocalTime | null> {
  const habit = await deps.habits.get(user.id);
  const day = habit?.days.find((d) => d.weekday === weekdayOf(date));
  if (day) return day.declaredStart;
  const slot = user.profile.timeSlot;
  return slot ? PARAMETERS.habit.timeSlotStarts[slot] : null;
}

/** RN-MSJ-005 · `plan_listo`: P-048 minutos antes de la hora habitual; vale hasta esa hora. */
async function planReadyCandidate(
  user: UserRecord,
  today: LocalDate,
  deps: ScheduleDeps,
): Promise<NewOutboxMessage[]> {
  const week = await ensureWeek(user, weekStartOf(today), deps);
  if (!week?.days.find((d) => d.date === today)?.session) return [];
  const start = await usualStart(user, today, deps);
  if (!start) return [];
  return [
    {
      userId: user.id,
      key: outboxKey('plan_listo', today),
      purpose: 'plan_listo',
      scheduledFor: planReadyAt(today, start, user.timezone),
      notAfter: zonedTimeToInstant(today, start, user.timezone),
      reactivation: false,
    },
  ];
}
