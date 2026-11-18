import { LAB_MEAL_METHOD_NAMES, LAB_NO_DATA, renderTemplate } from '@gymbro/content';
import {
  PARAMETERS,
  engineViolations,
  labMetrics,
  operationalDate,
  operationalDayStart,
  weekStartOf,
} from '@gymbro/domain';
import type { Reply } from '../onboarding/replies.js';
import type { EventLogReader, OutboxRepository, UserRecord } from '../ports/repositories.js';

/**
 * `/lab` (T-102, plan de medición §6): panel oculto del fundador con M01, M03, M04
 * y G06 de la semana en curso. Solo lee; no guarda ni envía nada más.
 */

export interface LabDeps {
  eventLog: EventLogReader;
  outbox: OutboxRepository;
  clock: () => Date;
}

const MS_PER_HOUR = 3_600_000;

const decimal = (value: number): string => String(value).replace('.', ',');

function mealLine(seconds: Readonly<Record<string, number>>): string {
  const entries = Object.entries(seconds).map(
    ([method, value]) => `${LAB_MEAL_METHOD_NAMES[method] ?? method} ${value} s`,
  );
  return entries.length > 0 ? entries.join(', ') : LAB_NO_DATA;
}

export async function labCommand(user: UserRecord, deps: LabDeps): Promise<Reply[]> {
  const timeZone = user.timezone;
  const weekStart = weekStartOf(operationalDate(deps.clock(), timeZone));
  const from = operationalDayStart(weekStart, timeZone);
  const gapMs = PARAMETERS.messages.minGapHours * MS_PER_HOUR;
  const [events, sent] = await Promise.all([
    deps.eventLog.since(user.id, from),
    deps.outbox.sentSince(user.id, new Date(from.getTime() - gapMs)),
  ]);
  const metrics = labMetrics(events, weekStart);
  const violations = engineViolations({
    sent,
    from,
    quietHours: user.settings.quietHours,
    timeZone,
    intensity: user.settings.intensity,
  });
  const lines = [
    renderTemplate('LB-01', { fecha: weekStart }),
    renderTemplate('LB-02', { dias: metrics.countedDays }),
    renderTemplate('LB-03', {
      tasa: metrics.actionRatePct === null ? LAB_NO_DATA : `${metrics.actionRatePct} %`,
      accionados: metrics.actionedMessages,
      enviados: metrics.sentMessages,
    }),
    renderTemplate('LB-04', {
      toques: metrics.medianSetTaps === null ? LAB_NO_DATA : decimal(metrics.medianSetTaps),
      comida: mealLine(metrics.medianMealSeconds),
    }),
    renderTemplate('LB-05', { violaciones: violations }),
  ];
  return [{ text: lines.join('\n'), buttons: [] }];
}
