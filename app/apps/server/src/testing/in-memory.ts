import { PARAMETERS, type ConsentCategory } from '@gymbro/domain';
import type { BotDependencies } from '../bot/create-bot.js';
import type { EventEmitter, EventProps, EventSubject } from '../events/emitter.js';
import type { EventName } from '../events/catalog.js';
import type { UserRecord } from '../ports/repositories.js';

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

export function inMemoryDependencies(options: InMemoryOptions = {}) {
  const processed = new Set<number>();
  const users = new Map<number, UserRecord>();
  const riskSignals: { userId: string; category: string; at: Date }[] = [];
  const events: EmittedEvent[] = [];
  const consents: {
    userId: string;
    category: ConsentCategory;
    granted: boolean;
    at: Date;
    policyVersion: string;
  }[] = [];

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
          settings: {
            intensity: 'NORMAL',
            quietHours: PARAMETERS.messages.quietHours,
            gamificationEnabled: true,
            numberFreeMode: false,
          },
          onboarding: { step: 'privacy', completedAt: options.onboardingCompleted ? now : null },
          createdAt: now,
        };
        users.set(telegramUserId, user);
        return Promise.resolve(user);
      },
      setOnboardingStep(userId, step) {
        for (const [key, user] of users) {
          if (user.id === userId)
            users.set(key, { ...user, onboarding: { ...user.onboarding, step } });
        }
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
    riskSignals: {
      record(userId, category, at) {
        if (options.failRiskSignals) return Promise.reject(new Error('mongo caído'));
        riskSignals.push({ userId, category, at });
        return Promise.resolve();
      },
    },
    events: emitter,
  };

  return { deps, users, riskSignals, events, consents };
}
