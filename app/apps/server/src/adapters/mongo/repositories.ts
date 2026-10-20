import {
  PARAMETERS,
  closeDay,
  type ConsentCategory,
  type DayStatus,
  type DayType,
  type LocalDate,
} from '@gymbro/domain';
import { MongoServerError, ObjectId, type Db } from 'mongodb';
import {
  EMPTY_PROFILE,
  type BodyMeasurementsRepository,
  type GoalRecord,
  type GoalsRepository,
  type TrainingHabitsRepository,
  type ConsentsRepository,
  type ScreeningsRepository,
  type UserDataEraser,
  type DaysRepository,
  type EventsRepository,
  type MealRecord,
  type MealsRepository,
  type ProcessedUpdatesRepository,
  type RiskSignalsRepository,
  type SetEntriesRepository,
  type SetEntryRecord,
  type StreakStatesRepository,
  type UserProfile,
  type UserRecord,
  type UsersRepository,
} from '../../ports/repositories.js';
import { setIdempotencyKey } from './idempotency.js';
import { COLLECTIONS } from './schema.js';

/** Repositorios MongoDB (T-020). Idempotentes ante toques y updates repetidos. */

const DUPLICATE_KEY = 11000;

/** Contadores del onboarding para documentos anteriores a T-032. */
const ONBOARDING_COUNTERS = { startedAt: null, interactions: 0 };

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
  /** `$set` de los campos dados dentro de un subdocumento (`settings.x`, `profile.y`). */
  async function setNested(userId: string, field: string, values: object): Promise<void> {
    const $set = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [`${field}.${key}`, value]),
    );
    if (Object.keys($set).length > 0) {
      await collection.updateOne({ _id: new ObjectId(userId) }, { $set });
    }
  }
  return {
    async findOrCreate({ telegramUserId, chatId, now }) {
      const defaults: Omit<UserDocument, '_id' | 'telegramUserId' | 'chatId'> = {
        status: 'active',
        timezone: PARAMETERS.user.defaultTimezone,
        isAdultConfirmedAt: null,
        settings: {
          intensity: 'NORMAL',
          quietHours: PARAMETERS.messages.quietHours,
          gamificationEnabled: true,
          numberFreeMode: false,
          lowIntensityStart: false,
        },
        profile: EMPTY_PROFILE,
        onboarding: { step: 'privacy', startedAt: null, interactions: 0, completedAt: null },
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
      // Documentos anteriores a T-032 no tienen `profile` ni los contadores del onboarding.
      return {
        id: _id.toHexString(),
        ...rest,
        profile: { ...EMPTY_PROFILE, ...(rest.profile as Partial<UserProfile> | undefined) },
        onboarding: { ...ONBOARDING_COUNTERS, ...rest.onboarding },
      };
    },
    async confirmAdult(userId, at) {
      await collection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { isAdultConfirmedAt: at } },
      );
    },
    async updateSettings(userId, settings) {
      await setNested(userId, 'settings', settings);
    },
    async updateProfile(userId, profile) {
      await setNested(userId, 'profile', profile);
    },
    async recordOnboardingInteraction(userId, at) {
      const _id = new ObjectId(userId);
      await collection.updateOne({ _id }, { $inc: { 'onboarding.interactions': 1 } });
      await collection.updateOne(
        { _id, 'onboarding.startedAt': null },
        { $set: { 'onboarding.startedAt': at } },
      );
    },
    async completeOnboarding(userId, at) {
      await collection.updateOne(
        { _id: new ObjectId(userId), 'onboarding.completedAt': null },
        { $set: { 'onboarding.completedAt': at, 'onboarding.step': 'summary' } },
      );
    },
    async restartOnboarding(userId, step) {
      await collection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { profile: EMPTY_PROFILE, 'onboarding.step': step } },
      );
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
    async instantsBetween(userId, from, to) {
      const docs = await collection
        .find({ userId, at: { $gte: from, $lt: to } }, { projection: { _id: 0, at: 1 } })
        .toArray();
      return docs.map((doc) => doc['at'] as Date);
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

export function screeningsRepository(db: Db): ScreeningsRepository {
  const collection = db.collection('screenings');
  return {
    async record({ userId, type, result, at }) {
      await collection.insertOne({ userId, type, result, at });
    },
  };
}

/** Colecciones sin datos de un usuario concreto. */
const NOT_PER_USER = new Set(['users', 'events', 'processed_updates']);

export function userDataEraser(db: Db): UserDataEraser {
  return {
    async eraseUser(userId) {
      for (const name of Object.keys(COLLECTIONS)) {
        if (!NOT_PER_USER.has(name)) await db.collection(name).deleteMany({ userId });
      }
      await db.collection('events').updateMany({ userRef: userId }, { $set: { userRef: null } });
      await db.collection('users').deleteOne({ _id: new ObjectId(userId) });
    },
  };
}

export function bodyMeasurementsRepository(db: Db): BodyMeasurementsRepository {
  const collection = db.collection('body_measurements');
  return {
    async recordWeight(userId, date, weightKg) {
      await collection.updateOne({ userId, date }, { $set: { weightKg } }, { upsert: true });
    },
    async latestWeightKg(userId) {
      const doc = await collection.findOne(
        { userId, weightKg: { $type: 'number' } },
        { sort: { date: -1 } },
      );
      return (doc?.['weightKg'] as number | undefined) ?? null;
    },
  };
}

export function trainingHabitsRepository(db: Db): TrainingHabitsRepository {
  const collection = db.collection('training_habits');
  return {
    async save(habit) {
      await collection.replaceOne({ userId: habit.userId }, { ...habit }, { upsert: true });
    },
  };
}

export function goalsRepository(db: Db): GoalsRepository {
  const collection = db.collection('goals');
  return {
    async activate(goal) {
      await collection.updateMany(
        { userId: goal.userId, status: 'active' },
        { $set: { status: 'changed' } },
      );
      await collection.insertOne({
        ...goal,
        status: 'active',
        closedAt: null,
        progressPct: null,
      });
    },
    async active(userId) {
      const doc = await collection.findOne({ userId, status: 'active' });
      if (!doc) return null;
      const {
        userId: id,
        type,
        metric,
        startValue,
        targetValue,
        startDate,
        horizonWeeks,
      } = doc as unknown as GoalRecord;
      return { userId: id, type, metric, startValue, targetValue, startDate, horizonWeeks };
    },
  };
}
