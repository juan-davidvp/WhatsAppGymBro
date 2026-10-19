import { PARAMETERS, type ConsentCategory } from '@gymbro/domain';
import type { BotDependencies } from '../bot/create-bot.js';
import type { EventEmitter, EventProps, EventSubject } from '../events/emitter.js';
import type { EventName } from '../events/catalog.js';
import type { ScreeningType, UserRecord } from '../ports/repositories.js';

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

  /** Reemplaza el usuario con ese id aplicando `change`. */
  function updateUser(userId: string, change: (user: UserRecord) => UserRecord): void {
    for (const [key, user] of users) if (user.id === userId) users.set(key, change(user));
  }

  /** Quita del arreglo las filas de ese usuario (sin cambiar la referencia). */
  function removeRows<T extends { userId: string }>(rows: T[], userId: string): void {
    for (let i = rows.length - 1; i >= 0; i--) if (rows[i]?.userId === userId) rows.splice(i, 1);
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
          onboarding: { step: 'privacy', completedAt: options.onboardingCompleted ? now : null },
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
        for (const [key, user] of users) if (user.id === userId) users.delete(key);
        removeRows(consents, userId);
        removeRows(screenings, userId);
        removeRows(riskSignals, userId);
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
    },
    events: emitter,
  };

  return { deps, users, riskSignals, events, consents, screenings };
}
