import type { MessagePurpose } from '@gymbro/domain';
import { ObjectId, type Db } from 'mongodb';
import {
  EMPTY_MESSAGE_STATS,
  type MessageStatsRecord,
  type MessageStatsRepository,
  type OutboxMessage,
  type OutboxOutcome,
  type OutboxRepository,
  type OutboxStatus,
} from '../../ports/repositories.js';
import { insertIfAbsent } from './repositories.js';

/**
 * Bandeja de salida (`proactive_messages`, FR-007-02) y estado de los mensajes
 * de cada usuario (`message_stats`), SPEC-007.
 */

interface OutboxDocument {
  _id: ObjectId;
  userId: string;
  key: string;
  purpose: MessagePurpose;
  scheduledFor: Date;
  notAfter: Date | null;
  reactivation: boolean;
  status: OutboxStatus;
  suppressedReason: string | null;
  templateId: string | null;
  sentAt: Date | null;
  telegramMessageId: number | null;
  actionedAt: Date | null;
  outcome?: OutboxOutcome | null;
  createdAt: Date;
}

function toOutboxMessage(doc: OutboxDocument): OutboxMessage {
  return {
    id: doc._id.toHexString(),
    userId: doc.userId,
    key: doc.key,
    purpose: doc.purpose,
    scheduledFor: doc.scheduledFor,
    notAfter: doc.notAfter,
    reactivation: doc.reactivation,
    status: doc.status,
    suppressedReason: doc.suppressedReason,
    templateId: doc.templateId,
    sentAt: doc.sentAt,
    telegramMessageId: doc.telegramMessageId,
    actionedAt: doc.actionedAt,
    outcome: doc.outcome ?? null,
  };
}

export function outboxRepository(db: Db): OutboxRepository {
  const collection = db.collection<OutboxDocument>('proactive_messages');
  const pendingById = (id: string) => ({ _id: new ObjectId(id), status: 'pending' as const });
  return {
    async schedule(message, at) {
      const { inserted } = await insertIfAbsent(() =>
        collection.insertOne({
          _id: new ObjectId(),
          ...message,
          status: 'pending',
          suppressedReason: null,
          templateId: null,
          sentAt: null,
          telegramMessageId: null,
          actionedAt: null,
          outcome: null,
          createdAt: at,
        }),
      );
      return { created: inserted };
    },
    async due(now) {
      const docs = await collection
        .find({ status: 'pending', scheduledFor: { $lte: now } })
        .sort({ scheduledFor: 1, _id: 1 })
        .toArray();
      return docs.map(toOutboxMessage);
    },
    async markSent(id, sent) {
      const result = await collection.updateOne(pendingById(id), {
        $set: { status: 'sent', ...sent },
      });
      return result.modifiedCount === 1;
    },
    async markSuppressed(id, reason) {
      const result = await collection.updateOne(pendingById(id), {
        $set: { status: 'suppressed', suppressedReason: reason },
      });
      return result.modifiedCount === 1;
    },
    async cancelPending(userId) {
      const result = await collection.updateMany(
        { userId, status: 'pending' },
        { $set: { status: 'cancelled' } },
      );
      return result.modifiedCount;
    },
    async sentSince(userId, since) {
      const docs = await collection
        .find({ userId, status: 'sent', sentAt: { $gte: since } })
        .sort({ sentAt: 1 })
        .toArray();
      return docs.map((d) => ({
        purpose: d.purpose,
        templateId: d.templateId ?? '',
        sentAt: d.sentAt ?? since,
      }));
    },
    async byTelegramMessage(userId, telegramMessageId) {
      const doc = await collection.findOne({ userId, telegramMessageId, status: 'sent' });
      return doc ? toOutboxMessage(doc) : null;
    },
    async markActioned(id, at) {
      const result = await collection.updateOne(
        { _id: new ObjectId(id), status: 'sent', actionedAt: null },
        { $set: { actionedAt: at } },
      );
      return result.modifiedCount === 1;
    },
    async awaitingOutcome(sentBefore) {
      const docs = await collection
        .find({ status: 'sent', outcome: null, sentAt: { $lte: sentBefore } })
        .sort({ sentAt: 1, _id: 1 })
        .toArray();
      return docs.map(toOutboxMessage);
    },
    async setOutcome(id, outcome) {
      const result = await collection.updateOne(
        { _id: new ObjectId(id), status: 'sent', outcome: null },
        { $set: { outcome } },
      );
      return result.modifiedCount === 1;
    },
    async purposeStats(userId, purpose) {
      const sent = await collection.countDocuments({ userId, purpose, status: 'sent' });
      const actioned = await collection.countDocuments({
        userId,
        purpose,
        status: 'sent',
        actionedAt: { $ne: null },
      });
      return { sent, actioned };
    },
  };
}

interface MessageStatsDocument extends MessageStatsRecord {
  userId: string;
}

export function messageStatsRepository(db: Db): MessageStatsRepository {
  const collection = db.collection<MessageStatsDocument>('message_stats');
  return {
    async get(userId) {
      const doc = await collection.findOne({ userId }, { projection: { _id: 0, userId: 0 } });
      return { ...EMPTY_MESSAGE_STATS, ...(doc ?? {}) };
    },
    async update(userId, changes) {
      await collection.updateOne(
        { userId },
        { $set: changes, $setOnInsert: { userId } },
        { upsert: true },
      );
    },
  };
}
