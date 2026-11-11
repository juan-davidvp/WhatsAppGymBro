import {
  PARAMETERS,
  addDays,
  comebackAction,
  dayClosingAt,
  isInQuietHours,
  operationalDate,
  planReadyAt,
  planReadySendAt,
  weekdayOf,
  weeklySummaryAt,
  zonedTimeToInstant,
  type LocalDate,
  type LocalTime,
  type MessagePurpose,
} from '@gymbro/domain';
import type { Logger } from '../logger.js';
import { plannedDayType } from '../plans/weekly-plan.js';
import type {
  NewOutboxMessage,
  OutboxRepository,
  TrainingHabitsRepository,
  UserRecord,
  UsersRepository,
} from '../ports/repositories.js';
import { comebackInputs, contextualReminderApplies } from './comeback.js';
import type { ComposeDeps } from './compose.js';

/**
 * Programación de candidatos (T-070, T-071, FR-007-02): en cada ciclo, por usuario
 * activo, se ponen en la bandeja las salidas del día operativo (y el `plan_listo`
 * de mañana si sale esta noche). La clave (propósito + día al que se refiere) hace
 * que programar otra vez no duplique nada. Aquí no se decide si se envían: eso lo
 * hace el motor al enviar, con el estado de ese momento (`dispatch.ts`).
 */

export interface ScheduleDeps extends ComposeDeps {
  users: UsersRepository;
  outbox: OutboxRepository;
  habits: TrainingHabitsRepository;
  logger?: Logger;
}

/** Programa los candidatos de todos los usuarios activos; devuelve cuántos creó. */
export async function scheduleCandidates(deps: ScheduleDeps): Promise<number> {
  const now = deps.clock();
  let created = 0;
  for (const user of await deps.users.listActive()) {
    try {
      const today = operationalDate(now, user.timezone);
      for (const candidate of await candidatesFor(user, today, deps)) {
        if (candidate.notAfter && now.getTime() > candidate.notAfter.getTime()) continue;
        if (await schedule(user, candidate, now, deps)) created += 1;
      }
    } catch (error) {
      deps.logger?.error('message_schedule_failed', { userId: user.id, error });
    }
  }
  return created;
}

async function candidatesFor(
  user: UserRecord,
  today: LocalDate,
  deps: ScheduleDeps,
): Promise<NewOutboxMessage[]> {
  return [
    ...(await planReadyCandidate(user, today, deps)),
    ...(await planReadyCandidate(user, addDays(today, 1), deps)),
    ...(await comebackCandidate(user, today, deps)),
    ...(await contextualReminderCandidate(user, today, deps)),
    dayClosingCandidate(user, today),
    ...weeklySummaryCandidate(user, today),
  ];
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

/** Clave de una salida: un propósito por día operativo al que se refiere el mensaje. */
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

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

/** El siguiente comienzo de las horas de silencio después de `at`: hasta ahí vale una salida. */
function nextQuietStart(user: UserRecord, date: LocalDate, at: Date): Date {
  const start = zonedTimeToInstant(date, user.settings.quietHours.start, user.timezone);
  return start.getTime() > at.getTime() ? start : new Date(start.getTime() + DAY_MS);
}

/** Si `at` cae en silencio, el final del silencio (RN-MSJ-004: no se envía en esa franja). */
function outOfQuietHours(user: UserRecord, date: LocalDate, at: Date): Date {
  if (!isInQuietHours(at, user.settings.quietHours, user.timezone)) return at;
  const end = zonedTimeToInstant(date, user.settings.quietHours.end, user.timezone);
  return end.getTime() > at.getTime() ? end : new Date(end.getTime() + DAY_MS);
}

function candidate(
  user: UserRecord,
  purpose: MessagePurpose,
  date: LocalDate,
  scheduledFor: Date,
  notAfter: Date,
): NewOutboxMessage {
  return {
    userId: user.id,
    key: outboxKey(purpose, date),
    purpose,
    scheduledFor,
    notAfter,
    reactivation: false,
  };
}

/**
 * RN-MSJ-005 · `plan_listo` de `date`: P-048 minutos antes de la hora habitual y
 * válido hasta esa hora; si eso cae en silencio, la noche anterior un minuto antes
 * del silencio y válido hasta que empieza. El tipo de día se lee sin guardar el
 * plan (el de mañana puede ser de la semana siguiente); el compositor lo genera.
 */
async function planReadyCandidate(
  user: UserRecord,
  date: LocalDate,
  deps: ScheduleDeps,
): Promise<NewOutboxMessage[]> {
  if ((await plannedDayType(user, date, deps)) !== 'TRAINING') return [];
  const start = await usualStart(user, date, deps);
  if (!start) return [];
  const { at, eve } = planReadySendAt(date, start, user.settings.quietHours, user.timezone);
  const notAfter = eve
    ? new Date(at.getTime() + MINUTE_MS)
    : zonedTimeToInstant(date, start, user.timezone);
  return [candidate(user, 'plan_listo', date, at, notAfter)];
}

/** Hora de los mensajes del día sin hora propia: la de `plan_listo`, fuera del silencio. */
async function habitMoment(user: UserRecord, today: LocalDate, deps: ScheduleDeps): Promise<Date> {
  const start = await usualStart(user, today, deps);
  const at = start
    ? planReadyAt(today, start, user.timezone)
    : zonedTimeToInstant(today, user.settings.quietHours.end, user.timezone);
  return outOfQuietHours(user, today, at);
}

/** RN-MSJ-008 · 1 `regreso` cuando hay P-052 días de entreno planificados sin actividad. */
async function comebackCandidate(
  user: UserRecord,
  today: LocalDate,
  deps: ScheduleDeps,
): Promise<NewOutboxMessage[]> {
  const stats = await deps.messageStats.get(user.id);
  const action = comebackAction({
    today,
    ...(await comebackInputs(user, today, deps)),
    inactivityPaused: stats.inactivityPausedAt !== null,
    reactivationsUsed: stats.reactivationsUsed,
    lastReactivationDate: stats.lastReactivationDate,
  });
  if (action !== 'send_comeback') return [];
  const at = await habitMoment(user, today, deps);
  return [candidate(user, 'regreso', today, at, nextQuietStart(user, today, at))];
}

/** `recordatorio_contextual`: ayer entreno sin contar y hoy descanso (PO, 2026-11-10). */
async function contextualReminderCandidate(
  user: UserRecord,
  today: LocalDate,
  deps: ScheduleDeps,
): Promise<NewOutboxMessage[]> {
  if (!(await contextualReminderApplies(user, today, deps))) return [];
  const at = await habitMoment(user, today, deps);
  return [candidate(user, 'recordatorio_contextual', today, at, nextQuietStart(user, today, at))];
}

/** RN-MSJ-016 · `cierre_del_dia` a la hora P-066; el compositor decide si sirve. */
function dayClosingCandidate(user: UserRecord, today: LocalDate): NewOutboxMessage {
  const at = dayClosingAt(today, user.timezone);
  return candidate(user, 'cierre_del_dia', today, at, nextQuietStart(user, today, at));
}

/** RN-MSJ-017 · `resumen_semanal` solo el día y a la hora de P-060. */
function weeklySummaryCandidate(user: UserRecord, today: LocalDate): NewOutboxMessage[] {
  const at = weeklySummaryAt(today, user.timezone);
  if (operationalDate(at, user.timezone) !== today) return [];
  return [candidate(user, 'resumen_semanal', today, at, nextQuietStart(user, today, at))];
}
