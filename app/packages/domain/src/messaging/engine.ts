import { PARAMETERS } from '../config/parameters.js';
import { operationalDate, type DayType } from '../day/day.js';
import type { Intensity } from '../goals/maintenance.js';
import { weekStartOf } from '../gamification/weekly.js';
import {
  addDays,
  localParts,
  minutesOfDay,
  weekdayOf,
  zonedTimeToInstant,
  type LocalDate,
  type LocalTime,
} from '../time/zoned.js';

/**
 * Motor de política de mensajes proactivos (RN-MSJ-001 a 017). Puro: decide y
 * explica; el planificador ejecuta (`.claude/rules/mensajes-y-planificador.md`).
 * RN-MSJ-015: es el único que aprueba un mensaje proactivo.
 */

/** RN-MSJ-001: catálogo cerrado de propósitos (valores tal como se guardan). */
export const MESSAGE_PURPOSES = [
  'plan_listo',
  'recordatorio_contextual',
  'cierre_del_dia',
  'reconocimiento',
  'resumen_semanal',
  'regreso',
  'mantenimiento',
] as const;
export type MessagePurpose = (typeof MESSAGE_PURPOSES)[number];

/**
 * Prioridad cuando dos propósitos compiten por el mismo hueco (SPEC-007 §8 y
 * `.claude/rules/mensajes-y-planificador.md`); `resumen_semanal` tiene su hueco el domingo.
 */
const PURPOSE_PRIORITY: readonly MessagePurpose[] = [
  'regreso',
  'plan_listo',
  'cierre_del_dia',
  'reconocimiento',
  'recordatorio_contextual',
  'mantenimiento',
  'resumen_semanal',
];

/** Ordena candidatos por prioridad de propósito (el primero se evalúa antes). */
export function byPurposePriority<T extends { readonly purpose: MessagePurpose }>(
  candidates: readonly T[],
): T[] {
  return [...candidates].sort(
    (a, b) => PURPOSE_PRIORITY.indexOf(a.purpose) - PURPOSE_PRIORITY.indexOf(b.purpose),
  );
}

/** FR-007-07: motivos de supresión (más `blocked`, RN-MSJ-014, y `no_action`, RN-MSJ-012). */
export type SuppressionReason =
  | 'blocked'
  | 'paused'
  | 'inactive'
  | 'disabled_purpose'
  | 'stale'
  | 'quiet_hours'
  | 'day_already_counts'
  | 'not_doable'
  | 'no_action'
  | 'min_gap'
  | 'budget'
  | 'cooldown';

export interface SentMessage {
  readonly purpose: MessagePurpose;
  readonly templateId: string;
  readonly sentAt: Date;
}

export interface QuietHours {
  readonly start: LocalTime;
  readonly end: LocalTime;
}

export interface UserMessagingState {
  readonly timeZone: string;
  readonly intensity: Intensity;
  /** P-047 por defecto; el usuario puede cambiarlas (RN-MSJ-004). */
  readonly quietHours: QuietHours;
  /** RN-MSJ-013: `/pausa`. */
  readonly pausedUntil: Date | null;
  /** RN-MSJ-008: pausa por inactividad. */
  readonly inactivityPaused: boolean;
  /** RN-MSJ-014. */
  readonly blocked: boolean;
  /** RN-MSJ-007: presupuesto semanal a la mitad hasta esta fecha. */
  readonly backoffUntil: Date | null;
  readonly disabledPurposes: readonly MessagePurpose[];
}

export interface ProactiveCandidate {
  readonly purpose: MessagePurpose;
  readonly scheduledFor: Date;
  /** RN-MSJ-012: botones de 1 toque del mensaje. */
  readonly buttons: number;
  /** Momento después del cual el mensaje ya no tiene sentido (SPEC-007 §8). */
  readonly notAfter?: Date;
  /** RN-MSJ-008: mensaje de reactivación permitido aunque haya pausa por inactividad. */
  readonly reactivation?: boolean;
}

/** Estado del día operativo al que pertenece el envío. */
export interface DayContext {
  readonly dayType: DayType;
  readonly dayCounts: boolean;
  /** RN-MSJ-005: la sesión del día ya empezó. */
  readonly sessionStarted: boolean;
  /** RN-MSJ-016: toques que costaría la acción que falta (null si no se puede hacer en toques). */
  readonly missingActionTaps: number | null;
}

export type Decision =
  { readonly send: true } | { readonly send: false; readonly reason: SuppressionReason };

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/** RN-MSJ-004: ¿cae el instante en horas de silencio? (la franja puede cruzar la medianoche). */
export function isInQuietHours(instant: Date, quietHours: QuietHours, timeZone: string): boolean {
  const p = localParts(instant, timeZone);
  const minute = p.hour * 60 + p.minute;
  const start = minutesOfDay(quietHours.start);
  const end = minutesOfDay(quietHours.end);
  return start <= end ? minute >= start && minute < end : minute >= start || minute < end;
}

/** RN-MSJ-002 y RN-MSJ-007: presupuestos de día y de semana para la intensidad. */
export function messageBudget(
  intensity: Intensity,
  dayType: DayType,
  backoffActive: boolean,
): { perDay: number; perWeek: number } {
  const budget = PARAMETERS.messages.budget;
  const perDay =
    intensity === 'NORMAL'
      ? dayType === 'TRAINING'
        ? budget.NORMAL.perTrainingDay
        : budget.NORMAL.perRestDay
      : budget[intensity].perDay;
  const perWeek = budget[intensity].perWeek;
  // RN-MSJ-007: a la mitad del presupuesto semanal (redondeo hacia abajo).
  return { perDay, perWeek: backoffActive ? Math.floor(perWeek / 2) : perWeek };
}

/**
 * RN-MSJ-001 a RN-MSJ-005, 007, 008, 012, 013, 014, 016 y RN-MSJ-002 (resumen
 * incluido): decide si un candidato se envía o por qué se suprime.
 */
export function evaluateProactive(input: {
  readonly candidate: ProactiveCandidate;
  readonly user: UserMessagingState;
  readonly history: readonly SentMessage[];
  readonly day: DayContext;
  readonly now: Date;
}): Decision {
  const { candidate, user, history, day, now } = input;
  if (!MESSAGE_PURPOSES.includes(candidate.purpose)) {
    throw new Error(`RN-MSJ-001: propósito fuera del catálogo: ${candidate.purpose}`);
  }
  const at = candidate.scheduledFor;
  const suppress = (reason: SuppressionReason): Decision => ({ send: false, reason });

  if (user.blocked) return suppress('blocked');
  if (user.pausedUntil && at.getTime() < user.pausedUntil.getTime()) return suppress('paused');
  if (user.inactivityPaused && !candidate.reactivation) return suppress('inactive');
  if (user.disabledPurposes.includes(candidate.purpose)) return suppress('disabled_purpose');
  if (candidate.buttons < 1) return suppress('no_action');
  if (candidate.notAfter && now.getTime() > candidate.notAfter.getTime()) return suppress('stale');
  if (isInQuietHours(at, user.quietHours, user.timeZone)) return suppress('quiet_hours');

  if (candidate.purpose === 'plan_listo' && (day.sessionStarted || day.dayCounts)) {
    return suppress('day_already_counts');
  }
  if (candidate.purpose === 'cierre_del_dia') {
    if (day.dayCounts) return suppress('day_already_counts');
    if (
      day.missingActionTaps === null ||
      day.missingActionTaps > PARAMETERS.messages.dayClosingMaxTaps
    ) {
      return suppress('not_doable');
    }
  }

  const last = history.reduce<Date | null>(
    (latest, m) => (latest === null || m.sentAt > latest ? m.sentAt : latest),
    null,
  );
  if (last && at.getTime() - last.getTime() < PARAMETERS.messages.minGapHours * HOUR_MS) {
    return suppress('min_gap');
  }

  const date = operationalDate(at, user.timeZone);
  const weekStart = weekStartOf(date);
  const backoffActive = user.backoffUntil !== null && at.getTime() < user.backoffUntil.getTime();
  const { perDay, perWeek } = messageBudget(user.intensity, day.dayType, backoffActive);
  const sentDates = history.map((m) => operationalDate(m.sentAt, user.timeZone));
  const sentToday = sentDates.filter((d) => d === date).length;
  const sentThisWeek = sentDates.filter((d) => weekStartOf(d) === weekStart).length;
  if (sentToday >= perDay || sentThisWeek >= perWeek) return suppress('budget');

  return { send: true };
}

/**
 * RN-MSJ-010: elige una plantilla del propósito que no se haya enviado en P-058
 * días; `random` (0–1) se recibe para rotar sin E/S. Null si todas están en espera.
 */
export function pickTemplate(
  templateIds: readonly string[],
  history: readonly SentMessage[],
  now: Date,
  random: () => number,
): string | null {
  const since = now.getTime() - PARAMETERS.messages.templateCooldownDays * DAY_MS;
  const recent = new Set(
    history.filter((m) => m.sentAt.getTime() > since).map((m) => m.templateId),
  );
  const available = templateIds.filter((id) => !recent.has(id));
  if (available.length === 0) return null;
  return available[Math.min(available.length - 1, Math.floor(random() * available.length))] ?? null;
}

/** RN-MSJ-005: `plan_listo` sale P-048 minutos antes de la hora habitual. */
export function planReadyAt(date: LocalDate, usualStart: LocalTime, timeZone: string): Date {
  const start = zonedTimeToInstant(date, usualStart, timeZone);
  return new Date(start.getTime() - PARAMETERS.messages.planReadyLeadMinutes * 60_000);
}

/**
 * RN-MSJ-006: hora habitual = mediana de la hora de inicio de las últimas P-049
 * sesiones de ese día de la semana; con menos datos, la declarada.
 */
export function usualStartTime(recentStarts: readonly LocalTime[], declared: LocalTime): LocalTime {
  const n = PARAMETERS.messages.usualTimeSessions;
  if (recentStarts.length < n) return declared;
  const minutes = recentStarts
    .slice(-n)
    .map(minutesOfDay)
    .sort((a, b) => a - b);
  const mid = Math.floor(minutes.length / 2);
  const median =
    minutes.length % 2 === 1
      ? (minutes[mid] ?? 0)
      : Math.round(((minutes[mid - 1] ?? 0) + (minutes[mid] ?? 0)) / 2);
  const hh = String(Math.floor(median / 60)).padStart(2, '0');
  const mm = String(median % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export interface IgnoreState {
  readonly consecutiveIgnored: number;
  readonly backoffUntil: Date | null;
}

/**
 * RN-MSJ-007: tras P-050 proactivos seguidos sin interacción, el presupuesto
 * semanal queda a la mitad P-051 días. Una interacción reinicia la cuenta.
 */
export function registerMessageOutcome(
  state: IgnoreState,
  outcome: { readonly interacted: boolean; readonly at: Date },
): IgnoreState {
  if (outcome.interacted) return { ...state, consecutiveIgnored: 0 };
  const consecutiveIgnored = state.consecutiveIgnored + 1;
  if (consecutiveIgnored >= PARAMETERS.messages.backoffIgnoredCount) {
    return {
      consecutiveIgnored: 0,
      backoffUntil: new Date(outcome.at.getTime() + PARAMETERS.messages.backoffDays * DAY_MS),
    };
  }
  return { ...state, consecutiveIgnored };
}

export type ComebackAction =
  'none' | 'send_comeback' | 'send_final_and_pause' | 'send_reactivation';

/**
 * RN-MSJ-008: 1 `regreso` tras P-052 días de entreno planificados sin actividad;
 * `regreso` final y pausa tras P-053 días sin actividad; en pausa, solo 1 mensaje
 * de reactivación el siguiente lunes o día 1 del mes, como máximo P-054 veces.
 */
export function comebackAction(input: {
  readonly today: LocalDate;
  readonly missedPlannedTrainingDays: number;
  readonly daysWithoutActivity: number;
  readonly comebackAlreadySent: boolean;
  readonly inactivityPaused: boolean;
  readonly reactivationsUsed: number;
  readonly lastReactivationDate: LocalDate | null;
}): ComebackAction {
  const m = PARAMETERS.messages;
  if (input.inactivityPaused) {
    const isReactivationDay = weekdayOf(input.today) === 'monday' || input.today.endsWith('-01');
    const alreadyToday = input.lastReactivationDate === input.today;
    return isReactivationDay && !alreadyToday && input.reactivationsUsed < m.maxReactivations
      ? 'send_reactivation'
      : 'none';
  }
  if (input.daysWithoutActivity >= m.inactivityPauseDays) return 'send_final_and_pause';
  if (input.missedPlannedTrainingDays >= m.comebackAfterPlannedDays && !input.comebackAlreadySent) {
    return 'send_comeback';
  }
  return 'none';
}

/**
 * RN-MSJ-009: tras P-055 semanas cumplidas seguidas, `recordatorio_contextual` se
 * desactiva por defecto y `plan_listo` solo sigue si su tasa de acción ≥ P-056.
 */
export function fadedPurposes(input: {
  readonly fulfilledWeeksStreak: number;
  readonly planReadyActionRate: number | null;
}): MessagePurpose[] {
  const m = PARAMETERS.messages;
  if (input.fulfilledWeeksStreak < m.fadingAfterFulfilledWeeks) return [];
  const faded: MessagePurpose[] = ['recordatorio_contextual'];
  if (input.planReadyActionRate !== null && input.planReadyActionRate < m.planReadyMinActionRate) {
    faded.push('plan_listo');
  }
  return faded;
}

/** RN-MSJ-013: `/pausa` de 1 a P-059 días. */
export function pauseUntil(now: Date, days: number): Date {
  if (!Number.isInteger(days) || days < 1 || days > PARAMETERS.messages.maxPauseDays) {
    throw new Error(`RN-MSJ-013: la pausa va de 1 a ${PARAMETERS.messages.maxPauseDays} días`);
  }
  return new Date(now.getTime() + days * DAY_MS);
}

/** RN-MSJ-014: al bloquear el bot, se cancelan las salidas pendientes y se registra `bot_blocked`. */
export function handleBotBlocked<T extends { readonly status: string }>(
  outbox: readonly T[],
): { outbox: T[]; event: 'bot_blocked' } {
  return {
    outbox: outbox.map((m) => (m.status === 'pending' ? { ...m, status: 'cancelled' } : m)),
    event: 'bot_blocked',
  };
}

/** RN-MSJ-016: `cierre_del_dia` se evalúa a la hora P-066 del día. */
export function dayClosingAt(date: LocalDate, timeZone: string): Date {
  return zonedTimeToInstant(date, PARAMETERS.messages.dayClosingAt, timeZone);
}

/** RN-MSJ-017: `resumen_semanal` sale el domingo (P-060) de la semana de `date`. */
export function weeklySummaryAt(date: LocalDate, timeZone: string): Date {
  const { day, time } = PARAMETERS.messages.weeklySummaryAt;
  let current = weekStartOf(date);
  while (weekdayOf(current) !== day) current = addDays(current, 1);
  return zonedTimeToInstant(current, time, timeZone);
}
