import {
  EMPTY_MESSAGE_STATS,
  type MessageStatsRecord,
  type MessageStatsRepository,
  type OutboxMessage,
  type OutboxRepository,
} from '../ports/repositories.js';

/** Dobles en memoria de la bandeja de salida y de `message_stats` (SPEC-007). */

export type OutboxRow = OutboxMessage & { createdAt: Date };

export function inMemoryMessaging() {
  const outbox: OutboxRow[] = [];
  const stats = new Map<string, MessageStatsRecord>();
  let nextId = 1;

  const update = (id: string, when: (m: OutboxRow) => boolean, changes: Partial<OutboxRow>) => {
    const index = outbox.findIndex((m) => m.id === id && when(m));
    const current = outbox[index];
    if (!current) return false;
    outbox[index] = { ...current, ...changes };
    return true;
  };

  const outboxRepository: OutboxRepository = {
    schedule(message, at) {
      if (outbox.some((m) => m.userId === message.userId && m.key === message.key)) {
        return Promise.resolve({ created: false });
      }
      outbox.push({
        ...message,
        id: (nextId++).toString(16).padStart(24, '0'),
        status: 'pending',
        suppressedReason: null,
        templateId: null,
        sentAt: null,
        telegramMessageId: null,
        actionedAt: null,
        outcome: null,
        createdAt: at,
      });
      return Promise.resolve({ created: true });
    },
    due(now) {
      return Promise.resolve(
        outbox
          .filter((m) => m.status === 'pending' && m.scheduledFor <= now)
          .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime()),
      );
    },
    claim(id) {
      return Promise.resolve(update(id, (m) => m.status === 'pending', { status: 'sending' }));
    },
    markSent(id, sent) {
      return Promise.resolve(
        update(id, (m) => m.status === 'sending', { status: 'sent', ...sent }),
      );
    },
    markFailed(id) {
      return Promise.resolve(update(id, (m) => m.status === 'sending', { status: 'failed' }));
    },
    markSuppressed(id, reason) {
      return Promise.resolve(
        update(id, (m) => m.status === 'pending', {
          status: 'suppressed',
          suppressedReason: reason,
        }),
      );
    },
    cancelPending(userId) {
      let count = 0;
      outbox.forEach((m, i) => {
        if (m.userId === userId && (m.status === 'pending' || m.status === 'sending')) {
          outbox[i] = { ...m, status: 'cancelled' };
          count += 1;
        }
      });
      return Promise.resolve(count);
    },
    sentSince(userId, since) {
      return Promise.resolve(
        outbox
          .filter(
            (m) => m.userId === userId && m.status === 'sent' && m.sentAt && m.sentAt >= since,
          )
          .map((m) => ({
            purpose: m.purpose,
            templateId: m.templateId ?? '',
            sentAt: m.sentAt ?? since,
          })),
      );
    },
    byTelegramMessage(userId, telegramMessageId) {
      return Promise.resolve(
        outbox.find(
          (m) =>
            m.userId === userId && m.status === 'sent' && m.telegramMessageId === telegramMessageId,
        ) ?? null,
      );
    },
    markActioned(id, at) {
      return Promise.resolve(
        update(id, (m) => m.status === 'sent' && m.actionedAt === null, { actionedAt: at }),
      );
    },
    awaitingOutcome(sentBefore) {
      return Promise.resolve(
        outbox
          .filter(
            (m) => m.status === 'sent' && m.outcome === null && m.sentAt && m.sentAt <= sentBefore,
          )
          .sort((a, b) => (a.sentAt?.getTime() ?? 0) - (b.sentAt?.getTime() ?? 0)),
      );
    },
    setOutcome(id, outcome) {
      return Promise.resolve(
        update(id, (m) => m.status === 'sent' && m.outcome === null, { outcome }),
      );
    },
    purposeStats(userId, purpose) {
      const settled = outbox.filter(
        (m) =>
          m.userId === userId && m.purpose === purpose && m.status === 'sent' && m.outcome !== null,
      );
      return Promise.resolve({
        sent: settled.length,
        actioned: settled.filter((m) => m.outcome === 'actioned').length,
      });
    },
  };

  const messageStatsRepository: MessageStatsRepository = {
    get(userId) {
      return Promise.resolve(stats.get(userId) ?? EMPTY_MESSAGE_STATS);
    },
    update(userId, changes) {
      stats.set(userId, { ...(stats.get(userId) ?? EMPTY_MESSAGE_STATS), ...changes });
      return Promise.resolve();
    },
  };

  const erase = (userId: string) => {
    for (let i = outbox.length - 1; i >= 0; i -= 1) {
      if (outbox[i]?.userId === userId) outbox.splice(i, 1);
    }
    stats.delete(userId);
  };

  return { outbox, stats, outboxRepository, messageStatsRepository, erase };
}
