import { PARAMETERS, registerMessageOutcome } from '@gymbro/domain';
import type { EventEmitter } from '../events/emitter.js';
import type { Logger } from '../logger.js';
import type {
  MessageStatsRecord,
  MessageStatsRepository,
  OutboxMessage,
  OutboxRepository,
  UserRecord,
  UsersRepository,
} from '../ports/repositories.js';

/**
 * Respuesta del usuario a los mensajes proactivos (T-072, RN-MSJ-007, RN-MSJ-008,
 * FR-007-06). Una interacción (toque o comando) reinicia los ignorados y saca de
 * la pausa por inactividad con las reactivaciones de nuevo en cero (PO,
 * 2026-11-11). Un toque en un botón de una enviada es su acción (M03). Cerrada la
 * ventana P-067, una enviada sin ninguna interacción del usuario queda ignorada
 * (PO, 2026-11-11); P-050 seguidas aplican el retroceso.
 */

export interface EngagementDeps {
  users: UsersRepository;
  outbox: OutboxRepository;
  messageStats: MessageStatsRepository;
  events: EventEmitter;
  clock: () => Date;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;

/** FR-007-06: registra un toque o comando; `telegramMessageId` si fue un botón. */
export async function recordInteraction(
  user: UserRecord,
  telegramMessageId: number | null,
  deps: EngagementDeps,
): Promise<void> {
  const now = deps.clock();
  const stats = await deps.messageStats.get(user.id);
  const { consecutiveIgnored } = registerMessageOutcome(stats, { interacted: true, at: now });
  const leavesInactivityPause: Partial<MessageStatsRecord> = stats.inactivityPausedAt
    ? { inactivityPausedAt: null, reactivationsUsed: 0 }
    : {};
  // RN-MSJ-014 [supuesto]: si escribe, desbloqueó el bot y se le puede volver a escribir.
  const unblocks = user.status === 'blocked' || stats.blockedAt !== null;
  await deps.messageStats.update(user.id, {
    lastInteractionAt: now,
    consecutiveIgnored,
    ...leavesInactivityPause,
    ...(unblocks ? { blockedAt: null } : {}),
  });
  if (user.status === 'blocked') await deps.users.setStatus(user.id, 'active');
  if (telegramMessageId !== null) await recordAction(user, telegramMessageId, now, deps);
}

async function recordAction(
  user: UserRecord,
  telegramMessageId: number,
  now: Date,
  deps: EngagementDeps,
): Promise<void> {
  const message = await deps.outbox.byTelegramMessage(user.id, telegramMessageId);
  if (!message?.sentAt || !message.templateId) return;
  if (!(await deps.outbox.markActioned(message.id, now))) return;
  await deps.events.emit(
    'message_actioned',
    { userId: user.id, timezone: user.timezone },
    {
      purpose: message.purpose,
      templateId: message.templateId,
      minutes: Math.max(0, Math.round((now.getTime() - message.sentAt.getTime()) / MINUTE_MS)),
    },
  );
}

export interface SettleDeps extends EngagementDeps {
  logger?: Logger;
}

/** RN-MSJ-007: cierra las enviadas cuya ventana P-067 terminó; devuelve cuántas ignoradas. */
export async function settleOutcomes(deps: SettleDeps): Promise<number> {
  const now = deps.clock();
  const windowEnd = new Date(now.getTime() - PARAMETERS.metrics.actionWindowHours * HOUR_MS);
  const users = new Map((await deps.users.listActive()).map((u) => [u.id, u]));
  let ignored = 0;
  for (const message of await deps.outbox.awaitingOutcome(windowEnd)) {
    try {
      if (await settleOne(message, users.get(message.userId) ?? null, now, deps)) ignored += 1;
    } catch (error) {
      deps.logger?.error('message_outcome_failed', { userId: message.userId, error });
    }
  }
  return ignored;
}

async function settleOne(
  message: OutboxMessage,
  user: UserRecord | null,
  now: Date,
  deps: SettleDeps,
): Promise<boolean> {
  const stats = await deps.messageStats.get(message.userId);
  const sentAt = message.sentAt?.getTime() ?? 0;
  const interacted = (stats.lastInteractionAt?.getTime() ?? -1) >= sentAt;
  const outcome = message.actionedAt ? 'actioned' : interacted ? 'interacted' : 'ignored';
  if (!(await deps.outbox.setOutcome(message.id, outcome)) || outcome !== 'ignored') return false;

  const subject = user ? { userId: user.id, timezone: user.timezone } : null;
  await deps.events.emit('message_ignored', subject, {
    purpose: message.purpose,
    templateId: message.templateId ?? '',
  });
  const next = registerMessageOutcome(stats, { interacted: false, at: now });
  await deps.messageStats.update(message.userId, next);
  if (next.backoffUntil !== stats.backoffUntil) {
    await deps.events.emit('backoff_applied', subject, { days: PARAMETERS.messages.backoffDays });
  }
  return true;
}
