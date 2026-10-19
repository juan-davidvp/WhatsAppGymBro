import {
  PARAMETERS,
  closeDay,
  type ConsentCategory,
  type DayStatus,
  type DayType,
  type LocalDate,
} from '@gymbro/domain';
import { MongoServerError, ObjectId, type Db } from 'mongodb';
import type {
  ConsentsRepository,
  DaysRepository,
  EventsRepository,
  MealRecord,
  MealsRepository,
  ProcessedUpdatesRepository,
  RiskSignalsRepository,
  SetEntriesRepository,
  SetEntryRecord,
  StreakStatesRepository,
  UserRecord,
  UsersRepository,
} from '../../ports/repositories.js';
import { setIdempotencyKey } from './idempotency.js';

/** Repositorios MongoDB (T-020). Idempotentes ante toques y updates repetidos. */

const DUPLICATE_KEY = 11000;

function isDuplicateKey(error: unknown): boolean {
  return error instanceof MongoServerError && error.code === DUPLICATE_KEY;
}

/** Inserta; si la clave única ya existe, no hace nada. */
async function insertIfAbsent(insert: () => Promise<unknown>): Promise<{ inserted: boolean }> {
  try {
    await insert();
    return { inserted: true };
  } catch (error) {
    if (isDuplicateKey(error)) return { inserted: false };
    throw error;
  }
}

export function processedUpdatesRepository(db: Db): ProcessedUpdatesRepository {
  const collection = db.collection('processed_updates');
  return {
    async markIfNew(updateId, at) {
      return (await insertIfAbsent(() => collection.insertOne({ updateId, at }))).inserted;
    },
  };
}

interface UserDocument extends Omit<UserRecord, 'id'> {
  _id: ObjectId;
}

export function usersRepository(db: Db): UsersRepository {
  const collection = db.collection<UserDocument>('users');
  return {
    async findOrCreate({ telegramUserId, chatId, now }) {
      const defaults: Omit<UserDocument, '_id' | 'telegramUserId' | 'chatId'> = {
        status: 'active',
        timezone: PARAMETERS.user.defaultTimezone,
        settings: {
          intensity: 'NORMAL',
          quietHours: PARAMETERS.messages.quietHours,
          gamificationEnabled: true,
          numberFreeMode: false,
        },
        onboarding: { step: 'privacy', completedAt: null },
        createdAt: now,
      };
      const run = () =>
        collection.findOneAndUpdate(
          { telegramUserId },
          { $setOnInsert: { _id: new ObjectId(), telegramUserId, ...defaults }, $set: { chatId } },
          { upsert: true, returnDocument: 'after' },
        );
      // Dos updates simultáneos del mismo usuario: el segundo upsert choca con el índice único y reintenta.
      let document = await run().catch((error: unknown) =>
        isDuplicateKey(error) ? run() : Promise.reject(error),
      );
      if (!document) document = await collection.findOne({ telegramUserId });
      if (!document) throw new Error('No se pudo crear el usuario');
      const { _id, ...rest } = document;
      return { id: _id.toHexString(), ...rest };
    },
    async setOnboardingStep(userId, step) {
      await collection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { 'onboarding.step': step } },
      );
    },
  };
}

export function setEntriesRepository(db: Db): SetEntriesRepository {
  const collection = db.collection('set_entries');
  return {
    async record(entry: SetEntryRecord) {
      const idempotencyKey = setIdempotencyKey(entry.sessionId, entry.exerciseCode, entry.setIndex);
      return insertIfAbsent(() => collection.insertOne({ ...entry, idempotencyKey }));
    },
  };
}

export function mealsRepository(db: Db): MealsRepository {
  const collection = db.collection('meals');
  return {
    async record(meal: MealRecord) {
      return insertIfAbsent(() => collection.insertOne({ ...meal }));
    },
  };
}

export function daysRepository(db: Db): DaysRepository {
  const collection = db.collection('days');
  return {
    async saveStatus(userId: string, date: LocalDate, dayType: DayType, status: DayStatus) {
      try {
        await collection.updateOne(
          { userId, date, status: { $ne: 'closed' } },
          {
            $set: {
              dayType,
              trainingHalf: status.trainingHalf,
              nutritionHalf: status.nutritionHalf,
              restMissionMet: status.nutritionHalf || status.activeRecovery,
              counted: status.counts,
              complete: status.complete,
            },
            $setOnInsert: { userId, date, status: 'open' },
          },
          { upsert: true },
        );
      } catch (error) {
        // Ya está cerrado: el upsert choca con el índice único y el día no cambia.
        if (!isDuplicateKey(error)) throw error;
      }
    },
    async close(userId: string, date: LocalDate, at: Date) {
      const result = await collection.updateOne(
        { userId, date, status: 'open' },
        { $set: { status: 'closed', closedAt: at } },
      );
      return { closedNow: result.modifiedCount === 1 };
    },
  };
}

interface StreakStateDocument {
  userId: string;
  totalCountedDays: number;
  lastClosedDate: LocalDate | null;
}

export function streakStatesRepository(db: Db): StreakStatesRepository {
  const collection = db.collection<StreakStateDocument>('streak_states');
  return {
    async applyDayClose(userId, day) {
      await insertIfAbsent(() =>
        collection.insertOne({ userId, totalCountedDays: 0, lastClosedDate: null }),
      );
      const current = await collection.findOne({ userId });
      const next = closeDay(
        { total: current?.totalCountedDays ?? 0, lastClosedDate: current?.lastClosedDate ?? null },
        day,
      );
      // Actualización condicional: si otro proceso cerró este día antes, no se suma dos veces.
      await collection.updateOne(
        { userId, lastClosedDate: current?.lastClosedDate ?? null },
        { $set: { totalCountedDays: next.total, lastClosedDate: next.lastClosedDate } },
      );
      const after = await collection.findOne({ userId });
      return { totalCountedDays: after?.totalCountedDays ?? 0 };
    },
  };
}

export function riskSignalsRepository(db: Db): RiskSignalsRepository {
  const collection = db.collection('risk_signals');
  return {
    async record(userId, category, at) {
      await collection.insertOne({ userId, category, at });
    },
  };
}

export function eventsRepository(db: Db): EventsRepository {
  const collection = db.collection('events');
  return {
    async insert(event) {
      await collection.insertOne({ ...event });
    },
  };
}

interface ConsentDocument {
  userId: string;
  category: ConsentCategory;
  granted: boolean;
  at: Date;
  policyVersion: string;
}

export function consentsRepository(db: Db): ConsentsRepository {
  const collection = db.collection<ConsentDocument>('consents');
  return {
    async record({ userId, granted, declined, at, policyVersion }) {
      const documents: ConsentDocument[] = [
        ...granted.map((category) => ({ userId, category, granted: true, at, policyVersion })),
        ...declined.map((category) => ({ userId, category, granted: false, at, policyVersion })),
      ];
      if (documents.length > 0) await collection.insertMany(documents);
    },
    async grantedCategories(userId) {
      const latest = await collection
        .aggregate<{ _id: ConsentCategory; granted: boolean }>([
          { $match: { userId } },
          { $sort: { at: -1, _id: -1 } },
          { $group: { _id: '$category', granted: { $first: '$granted' } } },
        ])
        .toArray();
      return latest.filter((c) => c.granted).map((c) => c._id);
    },
    async hasDecided(userId) {
      return (await collection.countDocuments({ userId }, { limit: 1 })) > 0;
    },
  };
}
