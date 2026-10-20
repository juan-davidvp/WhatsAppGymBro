import { PARAMETERS, type ConsentCategory } from '@gymbro/domain';
import type { BotDependencies } from '../bot/create-bot.js';
import type { EventEmitter, EventProps, EventSubject } from '../events/emitter.js';
import type { EventName } from '../events/catalog.js';
import type { DayStatus, DayType, ExerciseAdjustment } from '@gymbro/domain';
import {
  EMPTY_PROFILE,
  type WorkoutSessionRecord,
  type SetEntryRecord,
  type StoredWeeklyPlan,
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
  /** Reloj de la prueba (por defecto, lunes 2026-10-19 10:00 en Bogotá). */
  clock?: () => Date;
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
  const weeks: (StoredWeeklyPlan & { userId: string })[] = [];
  const setEntries: (SetEntryRecord & { idempotencyKey: string })[] = [];
  const days: {
    userId: string;
    date: string;
    dayType: DayType;
    status: 'open' | 'closed';
    counted: boolean;
    sources: string[];
    dayStatus: DayStatus | null;
  }[] = [];
  const workouts: WorkoutSessionRecord[] = [];
  const records: {
    userId: string;
    exerciseCode: string;
    type: 'e1rm' | 'reps';
    value: number;
    date: string;
    setKey: string;
  }[] = [];
  const achievements: {
    userId: string;
    code: string;
    at: Date;
    value: unknown;
    context: unknown;
  }[] = [];
  const painFlags: {
    userId: string;
    exerciseCode: string;
    zone: string;
    date: string;
    sessionId: string;
  }[] = [];
  const adjustments: (ExerciseAdjustment & { userId: string })[] = [];
  let nextId = 1;
  const newId = () => (nextId++).toString(16).padStart(24, '0');

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
    plans: {
      saveWeek(userId, plan) {
        const existing = weeks.find((w) => w.userId === userId && w.weekStart === plan.weekStart);
        if (existing) return Promise.resolve(existing);
        const stored = {
          ...plan,
          userId,
          days: plan.days.map((d) => ({
            ...d,
            session: d.session ? { ...d.session, id: newId() } : null,
          })),
        };
        weeks.push(stored);
        return Promise.resolve(stored);
      },
      week(userId, weekStart) {
        return Promise.resolve(
          weeks.find((w) => w.userId === userId && w.weekStart === weekStart) ?? null,
        );
      },
      discardWeek(userId, weekStart) {
        const index = weeks.findIndex((w) => w.userId === userId && w.weekStart === weekStart);
        if (index >= 0) weeks.splice(index, 1);
        return Promise.resolve();
      },
      moveSession(userId, weekStart, from, to) {
        const index = weeks.findIndex((w) => w.userId === userId && w.weekStart === weekStart);
        const week = weeks[index];
        const source = week?.days.find((d) => d.date === from)?.session;
        if (!week || !source) return Promise.resolve();
        weeks[index] = {
          ...week,
          days: week.days.map((d) => {
            if (d.date === from) return { ...d, type: 'REST' as const, session: null };
            if (d.date === to) return { ...d, type: 'TRAINING' as const, session: source };
            return d;
          }),
        };
        return Promise.resolve();
      },
    },
    setEntries: {
      record(entry) {
        const idempotencyKey = `set:${entry.sessionId}:${entry.exerciseCode}:${entry.setIndex}`;
        if (setEntries.some((e) => e.idempotencyKey === idempotencyKey)) {
          return Promise.resolve({ inserted: false });
        }
        setEntries.push({ ...entry, idempotencyKey });
        return Promise.resolve({ inserted: true });
      },
      remove(sessionId, exerciseCode, setIndex) {
        const key = `set:${sessionId}:${exerciseCode}:${setIndex}`;
        const index = setEntries.findIndex((e) => e.idempotencyKey === key);
        if (index >= 0) setEntries.splice(index, 1);
        return Promise.resolve();
      },
      exerciseHistory(userId, exerciseCode) {
        return Promise.resolve(
          setEntries
            .filter((e) => e.userId === userId && e.exerciseCode === exerciseCode)
            .sort(
              (a, b) =>
                a.confirmedAt.getTime() - b.confirmedAt.getTime() || a.setIndex - b.setIndex,
            )
            .map(({ sessionId, setIndex, reps, loadKg, edited, confirmedAt }) => ({
              sessionId,
              setIndex,
              reps,
              loadKg,
              edited,
              confirmedAt,
            })),
        );
      },
      lastLoads(userId) {
        const loads: Record<string, number> = {};
        const mine = setEntries
          .filter((e) => e.userId === userId)
          .sort((a, b) => a.confirmedAt.getTime() - b.confirmedAt.getTime());
        for (const e of mine) loads[e.exerciseCode] = e.loadKg;
        return Promise.resolve(loads);
      },
    },
    days: {
      saveStatus(userId, date, dayType, status) {
        const day = days.find((d) => d.userId === userId && d.date === date);
        if (day?.status === 'closed') return Promise.resolve();
        if (day) {
          day.counted = status.counts;
          day.dayStatus = status;
        } else {
          days.push({
            userId,
            date,
            dayType,
            status: 'open',
            counted: status.counts,
            sources: [],
            dayStatus: status,
          });
        }
        return Promise.resolve();
      },
      close(userId, date) {
        const day = days.find((d) => d.userId === userId && d.date === date && d.status === 'open');
        if (day) day.status = 'closed';
        return Promise.resolve({ closedNow: day !== undefined });
      },
      addSource(userId, date, dayType, source) {
        let day = days.find((d) => d.userId === userId && d.date === date);
        if (!day) {
          day = {
            userId,
            date,
            dayType,
            status: 'open',
            counted: false,
            sources: [],
            dayStatus: null,
          };
          days.push(day);
        }
        if (day.status === 'open' && !day.sources.includes(source)) day.sources.push(source);
        return Promise.resolve([...day.sources]);
      },
      sources(userId, date) {
        return Promise.resolve([
          ...(days.find((d) => d.userId === userId && d.date === date)?.sources ?? []),
        ]);
      },
      history(userId) {
        return Promise.resolve(
          days
            .filter((d) => d.userId === userId)
            .map((d) => ({ date: d.date, counted: d.counted })),
        );
      },
    },
    workouts: {
      create(session) {
        const record = { ...session, id: newId(), rev: 0 };
        workouts.push(record);
        return Promise.resolve(record);
      },
      byId(id) {
        return Promise.resolve(workouts.find((w) => w.id === id) ?? null);
      },
      activeOn(userId, date) {
        return Promise.resolve(
          workouts.find((w) => w.userId === userId && w.date === date && w.status === 'active') ??
            null,
        );
      },
      onDate(userId, date) {
        return Promise.resolve(workouts.filter((w) => w.userId === userId && w.date === date));
      },
      update(id, rev, changes) {
        const index = workouts.findIndex((w) => w.id === id && w.rev === rev);
        const current = workouts[index];
        if (!current) return Promise.resolve(null);
        const next = { ...current, ...changes, rev: rev + 1 };
        workouts[index] = next;
        return Promise.resolve(next);
      },
    },
    records: {
      record(input) {
        if (records.some((r) => r.setKey === input.setKey))
          return Promise.resolve({ inserted: false });
        records.push(input);
        return Promise.resolve({ inserted: true });
      },
      count(userId) {
        return Promise.resolve(records.filter((r) => r.userId === userId).length);
      },
      countForSession(userId, sessionId) {
        return Promise.resolve(
          records.filter((r) => r.userId === userId && r.setKey.startsWith(`set:${sessionId}:`))
            .length,
        );
      },
    },
    achievements: {
      appendOnce(input) {
        if (achievements.some((a) => a.userId === input.userId && a.code === input.code)) {
          return Promise.resolve({ added: false });
        }
        achievements.push(input);
        return Promise.resolve({ added: true });
      },
    },
    painFlags: {
      record(input) {
        painFlags.push(input);
        return Promise.resolve();
      },
      sessionsWithPain(userId, exerciseCode) {
        return Promise.resolve([
          ...new Set(
            painFlags
              .filter((p) => p.userId === userId && p.exerciseCode === exerciseCode)
              .map((p) => p.sessionId),
          ),
        ]);
      },
    },
    adjustments: {
      save(userId, adjustment) {
        adjustments.push({ userId, ...adjustment });
        return Promise.resolve();
      },
      list(userId) {
        return Promise.resolve(
          adjustments
            .filter((a) => a.userId === userId)
            .map(({ exerciseCode, strategy, fromWeek, replacementCode }) => ({
              exerciseCode,
              strategy,
              fromWeek,
              replacementCode,
            })),
        );
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
        removeRows(weeks, userId);
        removeRows(setEntries, userId);
        removeRows(days, userId);
        removeRows(workouts, userId);
        removeRows(records, userId);
        removeRows(achievements, userId);
        removeRows(painFlags, userId);
        removeRows(adjustments, userId);
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

  return {
    deps,
    users,
    riskSignals,
    events,
    consents,
    screenings,
    weights,
    habits,
    goals,
    weeks,
    setEntries,
    days,
    workouts,
    records,
    achievements,
    painFlags,
    adjustments,
  };
}
