import type { LocalTime, Weekday } from '@gymbro/domain';
import { dispatchDue, type DispatchDeps } from '../messaging/dispatch.js';
import { scheduleCandidates, type ScheduleDeps } from '../messaging/schedule.js';
import type { MessageSender } from '../messaging/sender.js';
import type { Reply } from '../onboarding/replies.js';
import { ONBOARDED_GYM_LXV, runFlow } from './onboarding.js';

/**
 * Bot de prueba para los mensajes proactivos (M7): onboarding L-X-V terminado el
 * lunes 2026-10-19 a las 10:00 en Bogotá, reloj movible, envíos capturados y un
 * `tick` que hace lo mismo que el ciclo del planificador (programar y enviar).
 */

export interface SentProactive {
  readonly chatId: number;
  readonly reply: Reply;
  readonly at: Date;
}

export async function proactiveSetup() {
  let now = new Date('2026-10-19T15:00:00Z');
  const clock = () => now;
  const flow = await runFlow(ONBOARDED_GYM_LXV, { clock });
  const userId = flow.user()?.id ?? '';
  const sent: SentProactive[] = [];
  let nextMessageId = 1000;
  const sender: MessageSender = {
    send: (chatId, reply) => {
      sent.push({ chatId, reply, at: now });
      nextMessageId += 1;
      return Promise.resolve({ messageId: nextMessageId });
    },
  };
  const deps: DispatchDeps & ScheduleDeps = { ...flow.deps, clock, sender, random: () => 0 };
  return {
    ...flow,
    userId,
    deps,
    sent,
    goTo: (iso: string) => {
      now = new Date(iso);
    },
    /** Un ciclo del planificador: programar los candidatos del día y enviar los vencidos. */
    tick: async () => {
      await scheduleCandidates(deps);
      return dispatchDue(deps);
    },
    /** Hábito con la misma hora para los días L-X-V. */
    setHabitTime: (time: LocalTime) => {
      const days: Weekday[] = ['monday', 'wednesday', 'friday'];
      return deps.habits.save({
        userId,
        days: days.map((weekday) => ({
          weekday,
          declaredStart: time,
          learnedStart: null,
          location: 'gym',
        })),
      });
    },
    eventsNamed: (name: string) => flow.events.filter((e) => e.name === name).map((e) => e.props),
    /** Salidas de la bandeja de un propósito. */
    outboxOf: (purpose: string) => flow.outbox.filter((m) => m.purpose === purpose),
    /** Propósito y plantilla de cada envío, en orden. */
    sentTemplates: () =>
      flow.outbox
        .filter((m) => m.status === 'sent')
        .sort((a, b) => (a.sentAt?.getTime() ?? 0) - (b.sentAt?.getTime() ?? 0))
        .map((m) => `${m.purpose}:${m.templateId ?? ''}`),
  };
}
