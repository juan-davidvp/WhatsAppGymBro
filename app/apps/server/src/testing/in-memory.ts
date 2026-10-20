import { PARAMETERS, type ConsentCategory } from '@gymbro/domain';
import type { BotDependencies } from '../bot/create-bot.js';
import type { EventEmitter, EventProps, EventSubject } from '../events/emitter.js';
import type { EventName } from '../events/catalog.js';
import {
  EMPTY_PROFILE,
  type GoalRecord,
  type ScreeningType,
  type TrainingHabitRecord,
  type UserRecord,
} from '../ports/repositories.js';

/**
 * Dobles en memoria de los puertos del bot, solo para pruebas de los adaptadores.
 * Los repositorios reales se prueban contra MongoDB en `adapters/mongo`.
 */

export interface EmittedEvent {
  name: EventName;
  subject: EventSubject | null;
  props: EventProps;
}

export interface InMemoryOptions {
  failRiskSignals?: boolean;
  /** Crea los usuarios con el onboarding ya terminado. */
  onboardingCompleted?: boolean;
  failErase?: boolean;
}

export interface ConsentRow {
  userId: string;
  category: ConsentCategory;
  granted: boolean;
  at: Date;
  policyVersion: string;
}

export interface ScreeningRow {
  userId: string;
  type: ScreeningType;
  result: 'clear' | 'flag';
  at: Date;
}

export function inMemoryDependencies(options: InMemoryOptions = {}) {
  const processed = new Set<number>();
  const users = new Map<number, UserRecord>();
  const riskSignals: { userId: string; category: string; at: Date }[] = [];
  const events: EmittedEvent[] = [];
  const consents: ConsentRow[] = [];
  const screenings: ScreeningRow[] = [];
  const weights: { userId: string; date: string; weightKg: number }[] = [];
  const habits: TrainingHabitRecord[] = [];
  const goals: (GoalRecord & { status: 'active' | 'changed' })[] = [];

  /** Reemplaza el usuario con ese id aplicando `change`. */
  function updateUser(userId: string, change: (user: UserRecord) => UserRecord): void {
    for (const [key, user] of users) if (user.id === userId) users.set(key, change(user));
  }

  /** Quita del arreglo las filas de ese usuario (sin cambiar la referencia). */
  function removeRows<T extends { userId: string }>(
    rows: T[],
    userId: string,
    also: (row: T) => boolean = () => true,
  ): void {
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];
      if (row?.userId === userId && also(row)) rows.splice(i, 1);
    }
  }

  const emitter: EventEmitter = {
    emit(name, subject, props = {}) {
      events.push({ name, subject, props });
      return Promise.resolve();
    },
  };

  const deps: BotDependencies = {
    processedUpdates: {
      markIfNew(updateId) {
        if (processed.has(updateId)) return Promise.resolve(false);
        processed.add(updateId);
        return Promise.resolve(true);
      },
    },
    users: {
      findOrCreate({ telegramUserId, chatId, now }) {
        const existing = users.get(telegramUserId);
        if (existing) return Promise.resolve(existing);
        const user: UserRecord = {
          id: telegramUserId.toString(16).padStart(24, '0'),
          telegramUserId,
          chatId,
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
          onboarding: {
            step: 'privacy',
            startedAt: null,
            interactions: 0,
            completedAt: options.onboardingCompleted ? now : null,
          },
          createdAt: now,
        };
        users.set(telegramUserId, user);
        return Promise.resolve(user);
      },
      setOnboardingStep(userId, step) {
        updateUser(userId, (user) => ({ ...user, onboarding: { ...user.onboarding, step } }));
        return Promise.resolve();
      },
      confirmAdult(userId, at) {
        updateUser(userId, (user) => ({ ...user, isAdultConfirmedAt: at }));
        return Promise.resolve();
      },
      updateSettings(userId, settings) {
        updateUser(userId, (user) => ({ ...user, settings: { ...user.settings, ...settings } }));
        return Promise.resolve();
      },
      updateProfile(userId, profile) {
        updateUser(userId, (user) => ({ ...user, profile: { ...user.profile, ...profile } }));
        return Promise.resolve();
      },
      recordOnboardingInteraction(userId, at) {
        updateUser(userId, (user) => ({
          ...user,
          onboarding: {
            ...user.onboarding,
            interactions: user.onboarding.interactions + 1,
            startedAt: user.onboarding.startedAt ?? at,
          },
        }));
        return Promise.resolve();
      },
      completeOnboarding(userId, at) {
        updateUser(userId, (user) => ({
          ...user,
          onboarding: { ...user.onboarding, completedAt: at, step: 'summary' },
        }));
        return Promise.resolve();
      },
      restartOnboarding(userId, step) {
        updateUser(userId, (user) => ({
          ...user,
          profile: EMPTY_PROFILE,
          onboarding: { ...user.onboarding, step },
        }));
        return Promise.resolve();
      },
    },
    bodyMeasurements: {
      recordWeight(userId, date, weightKg) {
        removeRows(weights, userId, (row) => row.date === date);
        weights.push({ userId, date, weightKg });
        return Promise.resolve();
      },
      latestWeightKg(userId) {
        const mine = weights
          .filter((w) => w.userId === userId)
          .sort((a, b) => (a.date < b.date ? 1 : -1));
        return Promise.resolve(mine[0]?.weightKg ?? null);
      },
    },
    habits: {
      save(habit) {
        removeRows(habits, habit.userId);
        habits.push(habit);
        return Promise.resolve();
      },
    },
    goals: {
      activate(goal) {
        for (const g of goals)
          if (g.userId === goal.userId && g.status === 'active') g.status = 'changed';
        goals.push({ ...goal, status: 'active' });
        return Promise.resolve();
      },
      active(userId) {
        const found = goals.find((g) => g.userId === userId && g.status === 'active');
        if (!found) return Promise.resolve(null);
        const {
          userId: id,
          type,
          metric,
          startValue,
          targetValue,
          startDate,
          horizonWeeks,
        } = found;
        return Promise.resolve({
          userId: id,
          type,
          metric,
          startValue,
          targetValue,
          startDate,
          horizonWeeks,
        });
      },
    },
    consents: {
      record({ userId, granted, declined, at, policyVersion }) {
        for (const category of granted)
          consents.push({ userId, category, granted: true, at, policyVersion });
        for (const category of declined)
          consents.push({ userId, category, granted: false, at, policyVersion });
        return Promise.resolve();
      },
      grantedCategories(userId) {
        const latest = new Map<ConsentCategory, boolean>();
        for (const c of consents.filter((c) => c.userId === userId))
          latest.set(c.category, c.granted);
        return Promise.resolve(
          [...latest].filter(([, granted]) => granted).map(([category]) => category),
        );
      },
      hasDecided(userId) {
        return Promise.resolve(consents.some((c) => c.userId === userId));
      },
    },
    screenings: {
      record(row) {
        screenings.push(row);
        return Promise.resolve();
      },
    },
    eraser: {
      eraseUser(userId) {
        if (options.failErase) return Promise.reject(new Error('mongo caído'));
        for (const [key, user] of users) if (user.id === userId) users.delete(key);
        removeRows(consents, userId);
        removeRows(screenings, userId);
        removeRows(riskSignals, userId);
        removeRows(weights, userId);
        removeRows(habits, userId);
        removeRows(goals, userId);
        for (const event of events) if (event.subject?.userId === userId) event.subject = null;
        return Promise.resolve();
      },
    },
    riskSignals: {
      record(userId, category, at) {
        if (options.failRiskSignals) return Promise.reject(new Error('mongo caído'));
        riskSignals.push({ userId, category, at });
        return Promise.resolve();
      },
      instantsBetween(userId, from, to) {
        return Promise.resolve(
          riskSignals
            .filter((r) => r.userId === userId && r.at >= from && r.at < to)
            .map((r) => r.at),
        );
      },
    },
    events: emitter,
  };

  return { deps, users, riskSignals, events, consents, screenings, weights, habits, goals };
}
