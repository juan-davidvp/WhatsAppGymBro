import { LAB_NO_DATA, labDecimal, labMealEntry, labPercent, renderTemplate } from '@gymbro/content';
import {
  PARAMETERS,
  engineViolations,
  labMetrics,
  operationalDate,
  operationalDayStart,
  weekStartOf,
  type DayType,
  type LocalDate,
} from '@gymbro/domain';
import type { Reply } from '../onboarding/replies.js';
import { plannedDayType } from '../plans/weekly-plan.js';
import type {
  EventLogReader,
  MessageStatsRepository,
  OutboxRepository,
  PlansRepository,
  UserRecord,
} from '../ports/repositories.js';

/**
 * `/lab` (T-102, plan de medición §6): panel oculto del fundador con M01, M03, M04
 * y G06 de la semana en curso. Solo lee; no guarda ni envía nada más.
 */

export interface LabDeps {
  eventLog: EventLogReader;
  outbox: OutboxRepository;
  messageStats: MessageStatsRepository;
  plans: PlansRepository;
  clock: () => Date;
}

const MS_PER_HOUR = 3_600_000;

function mealLine(seconds: Readonly<Record<string, number>>): string {
  const entries = Object.entries(seconds).map(([method, value]) => labMealEntry(method, value));
  return entries.length > 0 ? entries.join(', ') : LAB_NO_DATA;
}

export async function labCommand(user: UserRecord, deps: LabDeps): Promise<Reply[]> {
  const timeZone = user.timezone;
  const weekStart = weekStartOf(operationalDate(deps.clock(), timeZone));
  const from = operationalDayStart(weekStart, timeZone);
  const gapMs = PARAMETERS.messages.minGapHours * MS_PER_HOUR;
  const [events, sent, stats] = await Promise.all([
    deps.eventLog.since(user.id, from),
    deps.outbox.sentSince(user.id, new Date(from.getTime() - gapMs)),
    deps.messageStats.get(user.id),
  ]);
  const dates = [...new Set(sent.map((m) => operationalDate(m.sentAt, timeZone)))];
  const dayTypes: Record<LocalDate, DayType> = Object.fromEntries(
    await Promise.all(
      dates.map(async (date) => [date, await plannedDayType(user, date, deps)] as const),
    ),
  );
  const metrics = labMetrics(events, weekStart);
  const violations = engineViolations({
    sent,
    from,
    quietHours: user.settings.quietHours,
    timeZone,
    intensity: user.settings.intensity,
    dayTypes,
    backoffUntil: stats.backoffUntil,
  });
  const lines = [
    renderTemplate('LB-01', { fecha: weekStart }),
    renderTemplate('LB-02', { dias: metrics.countedDays }),
    renderTemplate('LB-03', {
      tasa: metrics.actionRatePct === null ? LAB_NO_DATA : labPercent(metrics.actionRatePct),
      accionados: metrics.actionedMessages,
      enviados: metrics.sentMessages,
    }),
    renderTemplate('LB-04', {
      toques: metrics.medianSetTaps === null ? LAB_NO_DATA : labDecimal(metrics.medianSetTaps),
      comida: mealLine(metrics.medianMealSeconds),
    }),
    renderTemplate('LB-05', { violaciones: violations }),
  ];
  return [{ text: lines.join('\n'), buttons: [] }];
}
