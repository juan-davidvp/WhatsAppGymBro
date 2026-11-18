import { PARAMETERS } from '../config/parameters.js';
import { operationalDate } from '../day/day.js';
import { weekStartOf } from '../gamification/weekly.js';
import type { Intensity } from '../goals/maintenance.js';
import type { LocalDate } from '../time/zoned.js';
import { isInQuietHours, messageBudget, type QuietHours, type SentMessage } from './engine.js';

/**
 * Métricas de `/lab` (T-102, plan de medición §3 y §6): M01, M03, M04 y G06 de la
 * semana en curso, calculadas sin E/S a partir de los eventos y los envíos.
 */

export interface LabEvent {
  readonly name: string;
  readonly props: Readonly<Record<string, unknown>>;
}

export interface LabMetrics {
  /** M01: días cerrados de la semana que contaron. */
  readonly countedDays: number;
  readonly sentMessages: number;
  /** M03: acciones dentro de la ventana P-067. */
  readonly actionedMessages: number;
  readonly actionRatePct: number | null;
  /** M04: mediana de toques por serie. */
  readonly medianSetTaps: number | null;
  /** M04: mediana de segundos por comida, por método. */
  readonly medianMealSeconds: Readonly<Record<string, number>>;
}

const MINUTES_PER_HOUR = 60;
const MS_PER_HOUR = 3_600_000;
const MS_PER_SECOND = 1000;
const PERCENT = 100;

export function median(values: readonly number[]): number | null {
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  const high = ordered[middle];
  if (high === undefined) return null;
  return ordered.length % 2 === 1 ? high : ((ordered[middle - 1] ?? high) + high) / 2;
}

const named = (events: readonly LabEvent[], name: string) => events.filter((e) => e.name === name);

const numbers = (events: readonly LabEvent[], key: string): number[] =>
  events.map((e) => e.props[key]).filter((v): v is number => typeof v === 'number');

function medianMealSeconds(events: readonly LabEvent[]): Record<string, number> {
  const meals = named(events, 'meal_logged');
  const methods = [...new Set(meals.map((m) => String(m.props['method'])))].sort();
  return Object.fromEntries(
    methods.map((method) => {
      const durations = numbers(
        meals.filter((m) => m.props['method'] === method),
        'durationMs',
      );
      return [method, Math.round((median(durations) ?? 0) / MS_PER_SECOND)];
    }),
  );
}

/** M01, M03 y M04 de la semana que empieza en `weekStart`. */
export function labMetrics(events: readonly LabEvent[], weekStart: LocalDate): LabMetrics {
  const windowMinutes = PARAMETERS.metrics.actionWindowHours * MINUTES_PER_HOUR;
  const sentMessages = named(events, 'message_sent').length;
  const actionedMessages = numbers(named(events, 'message_actioned'), 'minutes').filter(
    (minutes) => minutes <= windowMinutes,
  ).length;
  return {
    countedDays: named(events, 'day_closed').filter(
      (e) => e.props['counted'] === true && String(e.props['date']) >= weekStart,
    ).length,
    sentMessages,
    actionedMessages,
    actionRatePct:
      sentMessages === 0 ? null : Math.round((actionedMessages / sentMessages) * PERCENT),
    medianSetTaps: median(numbers(named(events, 'set_confirmed'), 'taps')),
    medianMealSeconds: medianMealSeconds(events),
  };
}

/**
 * G06: envíos desde `from` fuera del silencio, de la separación o del presupuesto,
 * con los ajustes actuales. Los envíos anteriores a `from` solo sirven para medir
 * la separación del primero.
 */
export function engineViolations(input: {
  readonly sent: readonly SentMessage[];
  readonly from: Date;
  readonly quietHours: QuietHours;
  readonly timeZone: string;
  readonly intensity: Intensity;
}): number {
  const { from, quietHours, timeZone, intensity } = input;
  const ordered = [...input.sent].sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
  const dates = ordered.map((m) => operationalDate(m.sentAt, timeZone));
  const { perDay, perWeek } = messageBudget(intensity, 'TRAINING', false);
  const minGapMs = PARAMETERS.messages.minGapHours * MS_PER_HOUR;

  return ordered.filter((message, i) => {
    if (message.sentAt.getTime() < from.getTime()) return false;
    const date = dates[i] ?? '';
    const previous = ordered[i - 1];
    const upToHere = dates.slice(0, i + 1);
    const tooSoon =
      previous !== undefined && message.sentAt.getTime() - previous.sentAt.getTime() < minGapMs;
    return (
      isInQuietHours(message.sentAt, quietHours, timeZone) ||
      tooSoon ||
      upToHere.filter((d) => d === date).length > perDay ||
      upToHere.filter((d) => weekStartOf(d) === weekStartOf(date)).length > perWeek
    );
  }).length;
}
