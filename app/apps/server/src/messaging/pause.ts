import { WEEKDAY_NAMES, pauseOptionLabel, renderTemplate, templateById } from '@gymbro/content';
import {
  PARAMETERS,
  WEEK_DAYS,
  localParts,
  pauseUntil,
  toLocalDate,
  weekdayOf,
} from '@gymbro/domain';
import type { CallbackAction } from '../bot/callback-data.js';
import type { EventEmitter } from '../events/emitter.js';
import { button, type Reply } from '../onboarding/replies.js';
import type { MessageStatsRepository, UserRecord } from '../ports/repositories.js';

/**
 * `/pausa` (T-073, HU-007-4, RN-MSJ-013): sin proactivos durante 1 a P-059 días
 * (opciones P-099); los comandos siguen funcionando y se puede reanudar antes. La
 * semana que toca la pausa no se evalúa (`close-week.ts`, PO 2026-11-11).
 */

export interface PauseDeps {
  messageStats: MessageStatsRepository;
  events: EventEmitter;
  clock: () => Date;
}

const ps = (value: string): CallbackAction => ({ action: 'ps', value });
const DAYS_VALUE = /^d(\d{1,2})$/;
const PAUSE_OPTIONS: readonly number[] = PARAMETERS.messages.pauseOptionsDays;

/** `{fecha}` de PA-02 y PA-03: día de la semana y número del día ("jueves 12"). */
function endLabel(until: Date, timeZone: string): string {
  const p = localParts(until, timeZone);
  const weekday = WEEKDAY_NAMES[WEEK_DAYS.indexOf(weekdayOf(toLocalDate(p.year, p.month, p.day)))];
  return `${weekday ?? ''} ${p.day}`;
}

function optionsReply(edit: boolean): Reply {
  return {
    text: renderTemplate('PA-01'),
    buttons: PAUSE_OPTIONS.map((days) => button(pauseOptionLabel(days), ps(`d${days}`))),
    rowSize: PAUSE_OPTIONS.length,
    ...(edit ? { edit } : {}),
  };
}

function pausedReply(user: UserRecord, until: Date): Reply {
  const [resume = '', change = ''] = templateById('PA-03').buttons;
  return {
    text: renderTemplate('PA-03', { fecha: endLabel(until, user.timezone) }),
    buttons: [button(resume, ps('resume')), button(change, ps('change'))],
    rowSize: 2,
  };
}

/** `/pausa`: las opciones, o hasta cuándo va la pausa en curso con [Reanudar]. */
export async function pauseCommand(user: UserRecord, deps: PauseDeps): Promise<Reply[]> {
  const { pausedUntil } = await deps.messageStats.get(user.id);
  if (pausedUntil && pausedUntil > deps.clock()) return [pausedReply(user, pausedUntil)];
  return [optionsReply(false)];
}

/** Botones de PA-01 y PA-03. */
export async function answerPause(
  user: UserRecord,
  value: string,
  deps: PauseDeps,
): Promise<Reply[]> {
  const now = deps.clock();
  if (value === 'change') return [optionsReply(true)];
  if (value === 'resume') {
    // Un [Reanudar] viejo con la pausa ya terminada no alarga la pausa guardada.
    const { pausedUntil } = await deps.messageStats.get(user.id);
    if (pausedUntil && pausedUntil > now) {
      await deps.messageStats.update(user.id, { pausedUntil: now });
    }
    return [{ text: renderTemplate('PA-04'), buttons: [], edit: true }];
  }
  const days = Number(DAYS_VALUE.exec(value)?.[1]);
  if (!PAUSE_OPTIONS.includes(days)) return pauseCommand(user, deps);
  const until = pauseUntil(now, days);
  await deps.messageStats.update(user.id, { pausedAt: now, pausedUntil: until });
  await deps.events.emit('pause_set', { userId: user.id, timezone: user.timezone }, { days });
  return [
    {
      text: renderTemplate('PA-02', { fecha: endLabel(until, user.timezone) }),
      buttons: [],
      edit: true,
    },
  ];
}
