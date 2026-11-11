import { EXERCISES, EXPRESS_EXCEPTIONS } from '@gymbro/content';
import {
  closePlayerDay,
  evaluateDay,
  generateWeeklyPlan,
  initialPlayerState,
  startProgress,
  type DayInputs,
} from '@gymbro/domain';
import { MongoClient, type Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mealIdempotencyKey } from './idempotency.js';
import { ensureIndexes } from './indexes.js';
import {
  workoutSessionsRepository,
  plansRepository,
  personalRecordsRepository,
  achievementsRepository,
  painFlagsRepository,
  exerciseAdjustmentsRepository,
  favoriteMealsRepository,
  bodyMeasurementsRepository,
  goalsRepository,
  trainingHabitsRepository,
  consentsRepository,
  screeningsRepository,
  userDataEraser,
  daysRepository,
  eventsRepository,
  mealsRepository,
  noticesRepository,
  processedUpdatesRepository,
  riskSignalsRepository,
  setEntriesRepository,
  streakStatesRepository,
  usersRepository,
} from './repositories.js';
import { messageStatsRepository, outboxRepository } from './messaging-repositories.js';
import { COLLECTIONS } from './schema.js';

/** T-020 · repositorios contra una base MongoDB 8.0 en memoria. */

let server: MongoMemoryServer;
let client: MongoClient;
let db: Db;
const now = new Date('2026-10-19T15:00:00Z');

beforeAll(async () => {
  server = await MongoMemoryServer.create({ binary: { version: '8.0.4' } });
  client = await MongoClient.connect(server.getUri());
  db = client.db('gymbro_test');
  await ensureIndexes(db);
}, 180_000);

afterAll(async () => {
  await client?.close();
  await server?.stop();
});

beforeEach(async () => {
  for (const name of Object.keys(COLLECTIONS)) await db.collection(name).deleteMany({});
});

describe('T-020 · índices', () => {
  it('crea todos los índices del modelo de datos y es idempotente', async () => {
    await ensureIndexes(db);
    const indexes = await db.collection('set_entries').indexes();
    expect(indexes.some((i) => i.key['idempotencyKey'] === 1 && i.unique)).toBe(true);
    const ttl = (await db.collection('processed_updates').indexes()).find((i) => i.key['at'] === 1);
    expect(ttl?.expireAfterSeconds).toBeGreaterThan(0);
  });

  it('T-063 · un índice que cambió de opciones en una base existente se recrea sin fallar', async () => {
    const quests = db.collection('quests');
    await quests.dropIndex('userId_1_weekStart_1').catch(() => undefined);
    await quests.createIndex({ userId: 1, weekStart: 1 }); // como antes de T-063: no único
    await ensureIndexes(db);
    const index = (await quests.indexes()).find((i) => i.name === 'userId_1_weekStart_1');
    expect(index?.unique).toBe(true);
  });
});

describe('T-020 · cada update de Telegram se procesa una vez', () => {
  it('el mismo update_id solo es nuevo la primera vez, también en paralelo', async () => {
    const repo = processedUpdatesRepository(db);
    const results = await Promise.all([
      repo.markIfNew(1, now),
      repo.markIfNew(1, now),
      repo.markIfNew(1, now),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await repo.markIfNew(2, now)).toBe(true);
  });
});

describe('T-020 · usuarios', () => {
  it('crea el usuario la primera vez con los valores por defecto y lo reutiliza después', async () => {
    const repo = usersRepository(db);
    const [a, b] = await Promise.all([
      repo.findOrCreate({ telegramUserId: 42, chatId: 42, now }),
      repo.findOrCreate({ telegramUserId: 42, chatId: 42, now }),
    ]);
    expect(a.id).toBe(b.id);
    expect(a.timezone).toBe('America/Bogota');
    expect(a.settings.intensity).toBe('NORMAL');
    expect(await db.collection('users').countDocuments()).toBe(1);
  });
});

describe('SC-003-2 · un toque repetido no duplica una serie, una comida ni un día que cuenta', () => {
  it('la misma serie confirmada dos veces se guarda una vez', async () => {
    const repo = setEntriesRepository(db);
    const entry = {
      userId: 'u1',
      sessionId: 's1',
      exerciseCode: 'SQ_BB',
      setIndex: 0,
      reps: 8,
      loadKg: 60,
      edited: false,
      confirmedAt: now,
    };
    const results = await Promise.all([repo.record(entry), repo.record(entry)]);
    expect(results.map((r) => r.inserted).sort()).toEqual([false, true]);
    expect(await db.collection('set_entries').countDocuments()).toBe(1);
    expect((await repo.record({ ...entry, setIndex: 1 })).inserted).toBe(true);
  });

  it('el mismo botón de comida tocado dos veces registra una comida', async () => {
    const repo = mealsRepository(db);
    const meal = {
      userId: 'u1',
      date: '2026-10-19',
      loggedAt: now,
      method: 'favorite' as const,
      portions: { palm: 1, cuppedHand: 2, fist: 1, thumb: 1 },
      proteinG: 25,
      favoriteMealId: 'fav-1',
      durationMs: 1200,
      taps: 1,
      idempotencyKey: mealIdempotencyKey(42, 100, 'v1:fav:fav-1'),
    };
    await repo.record(meal);
    expect((await repo.record(meal)).inserted).toBe(false);
    expect(
      (await repo.record({ ...meal, idempotencyKey: mealIdempotencyKey(42, 101, 'v1:fav:fav-1') }))
        .inserted,
    ).toBe(true);
    expect(await db.collection('meals').countDocuments()).toBe(2);
  });

  it('RN-DQC-007 · cerrar dos veces un día que cuenta lo suma una sola vez al total', async () => {
    const days = daysRepository(db);
    const streaks = streakStatesRepository(db);
    const inputs: DayInputs = {
      type: 'TRAINING',
      sessionsCompleted: 1,
      importedActivityMinutes: [],
      nutritionHalf: false,
      importedSteps: 0,
      mobilityMinutes: 0,
    };
    await days.saveStatus('u1', '2026-10-19', 'TRAINING', evaluateDay(inputs));
    const status = evaluateDay(inputs);
    const closes = await Promise.all([
      days.close('u1', '2026-10-19', 'TRAINING', status, now),
      days.close('u1', '2026-10-19', 'TRAINING', status, now),
    ]);
    expect(closes.filter((c) => c.closedNow)).toHaveLength(1);
    const day = {
      date: '2026-10-19',
      type: 'TRAINING' as const,
      counted: true,
      closedAt: now,
      riskPaused: false,
    };
    const next = closePlayerDay(initialPlayerState(), day).state;
    // Dos procesos con la misma versión: solo uno guarda.
    const saves = await Promise.all([streaks.save('u1', 0, next), streaks.save('u1', 0, next)]);
    expect(saves.filter(Boolean)).toHaveLength(1);
    const stored = await streaks.get('u1');
    expect(stored?.rev).toBe(1);
    expect(stored?.state).toEqual(next);
    // Repetir el cierre sobre lo guardado no cambia nada.
    expect(closePlayerDay(stored?.state ?? initialPlayerState(), day).applied).toBe(false);
  });

  it('un día cerrado ya no cambia aunque llegue un registro tarde', async () => {
    const days = daysRepository(db);
    const off: DayInputs = {
      type: 'TRAINING',
      sessionsCompleted: 0,
      importedActivityMinutes: [],
      nutritionHalf: false,
      importedSteps: 0,
      mobilityMinutes: 0,
    };
    await days.saveStatus('u1', '2026-10-19', 'TRAINING', evaluateDay(off));
    await days.close('u1', '2026-10-19', 'TRAINING', evaluateDay(off), now);
    await days.saveStatus(
      'u1',
      '2026-10-19',
      'TRAINING',
      evaluateDay({ ...off, sessionsCompleted: 1 }),
    );
    expect(
      (await db.collection('days').findOne({ userId: 'u1', date: '2026-10-19' }))?.['counted'],
    ).toBe(false);
  });
});

describe('RN-DQC-007 · T-061 · el estado del juego se guarda completo y por versión', () => {
  it('ida y vuelta de racha, comodines, reparación y regreso; una versión vieja no guarda', async () => {
    const streaks = streakStatesRepository(db);
    const state = {
      counted: { total: 12, lastClosedDate: '2026-10-20' },
      streak: {
        current: 0,
        longest: 9,
        countedRun: 0,
        freezes: 1,
        repair: { offeredUntil: '2026-10-23T17:00:00.000Z', restoreTo: 9 },
        lastRepairDate: null,
        lastClosedDate: '2026-10-20',
      },
      comeback: { pending: true },
      weekStreak: 2,
    };
    expect(await streaks.save('u2', 0, state)).toBe(true);
    expect(await streaks.get('u2')).toEqual({ state, rev: 1 });
    const later = { ...state, counted: { total: 13, lastClosedDate: '2026-10-21' } };
    expect(await streaks.save('u2', 0, later)).toBe(false);
    expect(await streaks.save('u2', 1, later)).toBe(true);
    expect((await streaks.get('u2'))?.state.counted.total).toBe(13);
  });

  it('un documento de T-060 (solo total y último día) se lee y se actualiza como versión 0', async () => {
    await db
      .collection('streak_states')
      .insertOne({ userId: 'u2b', totalCountedDays: 4, lastClosedDate: '2026-10-19' });
    const streaks = streakStatesRepository(db);
    const stored = await streaks.get('u2b');
    expect(stored?.rev).toBe(0);
    expect(stored?.state.counted).toEqual({ total: 4, lastClosedDate: '2026-10-19' });
    expect(stored?.state.streak.current).toBe(0);
    expect(await streaks.save('u2b', 0, stored?.state ?? initialPlayerState())).toBe(true);
    expect((await streaks.get('u2b'))?.rev).toBe(1);
  });
});

describe('FR-007-02 · T-070 · bandeja de salida', () => {
  it('una salida por clave, se envía una sola vez y la acción se registra una vez', async () => {
    const outbox = outboxRepository(db);
    const at = new Date('2026-10-21T21:00:00Z');
    const message = {
      userId: 'u70',
      key: 'plan_listo:2026-10-21',
      purpose: 'plan_listo' as const,
      scheduledFor: new Date('2026-10-21T22:00:00Z'),
      notAfter: new Date('2026-10-21T23:00:00Z'),
      reactivation: false,
    };
    expect(await outbox.schedule(message, at)).toEqual({ created: true });
    expect(await outbox.schedule(message, at)).toEqual({ created: false });
    expect(await outbox.due(at)).toEqual([]);
    const [due] = await outbox.due(new Date('2026-10-21T22:00:00Z'));
    expect(due).toMatchObject({ key: message.key, status: 'pending' });
    const sent = {
      templateId: 'PL-01',
      sentAt: new Date('2026-10-21T22:00:00Z'),
      telegramMessageId: 9,
    };
    expect(await outbox.markSent(due?.id ?? '', sent)).toBe(true);
    expect(await outbox.markSent(due?.id ?? '', sent)).toBe(false);
    expect(await outbox.sentSince('u70', at)).toEqual([
      { purpose: 'plan_listo', templateId: 'PL-01', sentAt: sent.sentAt },
    ]);
    const found = await outbox.byTelegramMessage('u70', 9);
    expect(await outbox.markActioned(found?.id ?? '', sent.sentAt)).toBe(true);
    expect(await outbox.markActioned(found?.id ?? '', sent.sentAt)).toBe(false);
    expect(await outbox.purposeStats('u70', 'plan_listo')).toEqual({ sent: 1, actioned: 1 });
  });

  it('RN-MSJ-014 · cancela las pendientes; las suprimidas guardan su motivo', async () => {
    const outbox = outboxRepository(db);
    const at = new Date('2026-10-21T10:00:00Z');
    const base = {
      userId: 'u71',
      purpose: 'plan_listo' as const,
      scheduledFor: at,
      notAfter: null,
      reactivation: false,
    };
    await outbox.schedule({ ...base, key: 'a' }, at);
    await outbox.schedule({ ...base, key: 'b' }, at);
    const [first] = await outbox.due(at);
    expect(await outbox.markSuppressed(first?.id ?? '', 'quiet_hours')).toBe(true);
    expect(await outbox.cancelPending('u71')).toBe(1);
    expect(await outbox.due(at)).toEqual([]);
  });

  it('message_stats parte de cero y guarda los cambios', async () => {
    const stats = messageStatsRepository(db);
    expect((await stats.get('u72')).consecutiveIgnored).toBe(0);
    const until = new Date('2026-10-25T00:00:00Z');
    await stats.update('u72', { pausedUntil: until });
    expect((await stats.get('u72')).pausedUntil).toEqual(until);
    await stats.update('u72', { lastInteractionAt: until });
    expect(await stats.get('u72')).toMatchObject({ pausedUntil: until, lastInteractionAt: until });
  });

  it('RN-MSJ-007 · T-072 · las enviadas esperan su resultado y lo fijan una sola vez', async () => {
    const outbox = outboxRepository(db);
    const at = new Date('2026-10-22T10:00:00Z');
    await outbox.schedule(
      {
        userId: 'u73',
        key: 'regreso:2026-10-22',
        purpose: 'regreso',
        scheduledFor: at,
        notAfter: null,
        reactivation: false,
      },
      at,
    );
    const [due] = await outbox.due(at);
    await outbox.markSent(due?.id ?? '', { templateId: 'RG-01', sentAt: at, telegramMessageId: 5 });
    expect(await outbox.awaitingOutcome(new Date('2026-10-22T09:59:00Z'))).toEqual([]);
    const [waiting] = await outbox.awaitingOutcome(new Date('2026-10-22T12:00:00Z'));
    expect(waiting).toMatchObject({ key: 'regreso:2026-10-22', outcome: null });
    expect(await outbox.setOutcome(waiting?.id ?? '', 'ignored')).toBe(true);
    expect(await outbox.setOutcome(waiting?.id ?? '', 'interacted')).toBe(false);
    expect(await outbox.awaitingOutcome(new Date('2026-10-22T12:00:00Z'))).toEqual([]);
  });
});

describe('T-061 · avisos para la próxima interacción', () => {
  it('se guardan una vez por clave y se entregan una sola vez, en orden', async () => {
    const notices = noticesRepository(db);
    const at = (minute: number) => new Date(`2026-10-21T17:0${minute}:00Z`);
    await notices.add('u3n', {
      key: 'RA-01:a',
      templateId: 'RA-01',
      variables: {},
      createdAt: at(1),
    });
    await notices.add('u3n', {
      key: 'RA-01:a',
      templateId: 'RA-01',
      variables: {},
      createdAt: at(1),
    });
    await notices.add('u3n', {
      key: 'RA-02:b',
      templateId: 'RA-02',
      variables: { total: 3 },
      createdAt: at(2),
    });
    const taken = await notices.takePending('u3n', at(5));
    expect(taken.map((n) => n.key)).toEqual(['RA-01:a', 'RA-02:b']);
    expect(taken[1]?.variables).toEqual({ total: 3 });
    expect(await notices.takePending('u3n', at(6))).toEqual([]);
  });
});

describe('RN-DAT-005 · las señales de riesgo guardan solo la categoría', () => {
  it('el documento no tiene texto del usuario', async () => {
    await riskSignalsRepository(db).record('u1', 'distress', now);
    const doc = await db.collection('risk_signals').findOne({}, { projection: { _id: 0 } });
    expect(Object.keys(doc ?? {}).sort()).toEqual(['at', 'category', 'userId']);
  });
});

describe('RN-DAT-005 · los eventos se guardan con su forma validada', () => {
  it('guarda seudónimo, nombre, instante, propiedades comunes y propias', async () => {
    await eventsRepository(db).insert({
      userRef: '65f0a1b2c3d4e5f6a7b8c9d0',
      name: 'care_response_sent',
      at: now,
      common: { localDate: '2026-10-19', appVersion: '0.0.0', phase: 'n1_B' },
      props: { category: 'distress', templateId: 'CU-05' },
    });
    const doc = await db.collection('events').findOne({}, { projection: { _id: 0 } });
    expect(Object.keys(doc ?? {}).sort()).toEqual(['at', 'common', 'name', 'props', 'userRef']);
  });
});

describe('RN-DAT-001 · autorizaciones: historial completo y vale la más reciente', () => {
  it('aceptar y luego retirar en el mismo instante deja todo sin autorizar', async () => {
    const consents = consentsRepository(db);
    expect(await consents.hasDecided('u9')).toBe(false);
    const base = { userId: 'u9', at: now, policyVersion: 'PV-01@test' };
    await consents.record({ ...base, granted: ['health_data', 'analytics'], declined: [] });
    await consents.record({ ...base, granted: [], declined: ['health_data'] });
    expect(await consents.grantedCategories('u9')).toEqual(['analytics']);
    expect(await consents.hasDecided('u9')).toBe(true);
    expect(await db.collection('consents').countDocuments({ userId: 'u9' })).toBe(3);
  });
});

describe('FR-001-01 · el paso del onboarding se guarda', () => {
  it('un usuario nuevo empieza en privacidad y su paso se actualiza', async () => {
    const users = usersRepository(db);
    const user = await users.findOrCreate({ telegramUserId: 77, chatId: 77, now });
    expect(user.onboarding.step).toBe('privacy');
    await users.setOnboardingStep(user.id, 'age');
    expect(
      (await users.findOrCreate({ telegramUserId: 77, chatId: 77, now })).onboarding.step,
    ).toBe('age');
  });
});

describe('RN-SEG-001 · RN-SEG-002 · ajustes de seguridad del usuario', () => {
  it('confirma la mayoría de edad y guarda las consecuencias de los tamizajes', async () => {
    const users = usersRepository(db);
    const user = await users.findOrCreate({ telegramUserId: 88, chatId: 88, now });
    expect(user.isAdultConfirmedAt).toBeNull();
    await users.confirmAdult(user.id, now);
    await users.updateSettings(user.id, { lowIntensityStart: true, numberFreeMode: true });
    const after = await users.findOrCreate({ telegramUserId: 88, chatId: 88, now });
    expect(after.isAdultConfirmedAt).toEqual(now);
    expect(after.settings).toMatchObject({
      lowIntensityStart: true,
      numberFreeMode: true,
      intensity: 'NORMAL',
    });
  });

  it('un tamizaje guarda solo tipo, resultado y fecha', async () => {
    await screeningsRepository(db).record({
      userId: 'u3',
      type: 'food_body',
      result: 'flag',
      at: now,
    });
    const doc = await db.collection('screenings').findOne({}, { projection: { _id: 0 } });
    expect(Object.keys(doc ?? {}).sort()).toEqual(['at', 'result', 'type', 'userId']);
  });
});

describe('RN-DAT-003 · RN-SEG-001 · borrar a un usuario no deja rastros', () => {
  it('borra sus documentos en todas las colecciones, desvincula sus eventos y no toca a otros', async () => {
    const users = usersRepository(db);
    const target = await users.findOrCreate({ telegramUserId: 501, chatId: 501, now });
    const other = await users.findOrCreate({ telegramUserId: 502, chatId: 502, now });
    const perUser = Object.keys(COLLECTIONS).filter(
      (name) => !['users', 'events', 'processed_updates'].includes(name),
    );
    for (const name of perUser) {
      // Cada campo de índice con un valor propio, para no chocar con los índices únicos.
      const keys = (COLLECTIONS[name as keyof typeof COLLECTIONS] ?? []).flatMap((i) => i.keys);
      const doc = (userId: string, side: string) => ({
        ...Object.fromEntries(keys.map((key) => [key, `${name}-${side}-${key}`])),
        userId,
      });
      await db.collection(name).insertMany([doc(target.id, 'a'), doc(other.id, 'b')]);
    }
    await db.collection('events').insertMany([
      { userRef: target.id, name: 'meal_logged', at: now },
      { userRef: other.id, name: 'meal_logged', at: now },
    ]);

    await userDataEraser(db).eraseUser(target.id);

    const leftovers: string[] = [];
    for (const name of Object.keys(COLLECTIONS)) {
      const text = JSON.stringify(await db.collection(name).find().toArray());
      if (text.includes(target.id)) leftovers.push(name);
    }
    expect(leftovers).toEqual([]);
    expect(await db.collection('events').countDocuments({ userRef: null })).toBe(1);
    for (const name of perUser) {
      expect(await db.collection(name).countDocuments({ userId: other.id })).toBe(1);
    }
    expect(await db.collection('users').countDocuments({ telegramUserId: 502 })).toBe(1);
  });
});

describe('RN-SEG-007 · señales de riesgo por intervalo (pausa del juego)', () => {
  it('devuelve solo los instantes del usuario dentro de [from, to)', async () => {
    const signals = riskSignalsRepository(db);
    const at = (iso: string) => new Date(iso);
    await signals.record('u5', 'pain', at('2026-10-19T12:00:00Z'));
    await signals.record('u5', 'pain', at('2026-10-20T08:00:00Z'));
    await signals.record('u6', 'pain', at('2026-10-19T12:00:00Z'));
    expect(
      await signals.instantsBetween('u5', at('2026-10-19T08:00:00Z'), at('2026-10-20T08:00:00Z')),
    ).toEqual([at('2026-10-19T12:00:00Z')]);
  });
});

describe('T-032 · perfil y onboarding del usuario', () => {
  it('guarda el perfil, cuenta interacciones, termina y reinicia', async () => {
    const users = usersRepository(db);
    const user = await users.findOrCreate({ telegramUserId: 601, chatId: 601, now });
    expect(user.profile.goalType).toBeNull();
    await users.updateProfile(user.id, { goalType: 'gain_strength', availableDays: ['monday'] });
    await users.recordOnboardingInteraction(user.id, now);
    await users.recordOnboardingInteraction(user.id, new Date(now.getTime() + 60_000));
    let after = await users.findOrCreate({ telegramUserId: 601, chatId: 601, now });
    expect(after.profile).toMatchObject({ goalType: 'gain_strength', availableDays: ['monday'] });
    expect(after.onboarding).toMatchObject({ startedAt: now, interactions: 2 });
    await users.restartOnboarding(user.id, 'goal');
    after = await users.findOrCreate({ telegramUserId: 601, chatId: 601, now });
    expect(after.profile.goalType).toBeNull();
    expect(after.onboarding.step).toBe('goal');
    await users.completeOnboarding(user.id, now);
    after = await users.findOrCreate({ telegramUserId: 601, chatId: 601, now });
    expect(after.onboarding.completedAt).toEqual(now);
  });

  it('un usuario guardado antes de T-032 (sin perfil) se lee con valores por defecto', async () => {
    await db.collection('users').insertOne({
      telegramUserId: 602,
      chatId: 602,
      onboarding: { step: 'age', completedAt: null },
    });
    const user = await usersRepository(db).findOrCreate({ telegramUserId: 602, chatId: 602, now });
    expect(user.profile.availableDays).toEqual([]);
    expect(user.onboarding).toMatchObject({ step: 'age', interactions: 0, startedAt: null });
  });
});

describe('RN-OBJ-012 · peso opcional, uno por día', () => {
  it('el último registro del día gana y se lee el más reciente', async () => {
    const weights = bodyMeasurementsRepository(db);
    expect(await weights.latestWeightKg('u7')).toBeNull();
    await weights.recordWeight('u7', '2026-10-18', 70);
    await weights.recordWeight('u7', '2026-10-19', 71);
    await weights.recordWeight('u7', '2026-10-19', 71.5);
    expect(await weights.latestWeightKg('u7')).toBe(71.5);
    expect(await db.collection('body_measurements').countDocuments({ userId: 'u7' })).toBe(2);
  });
});

describe('RN-PLAN-002 · RN-OBJ-001 · hábito y objetivo activo', () => {
  it('un hábito por usuario; un solo objetivo activo y el anterior queda changed (RN-OBJ-007)', async () => {
    const habits = trainingHabitsRepository(db);
    const day = {
      weekday: 'monday' as const,
      declaredStart: '06:00',
      learnedStart: null,
      location: 'gym' as const,
    };
    await habits.save({ userId: 'u8', days: [day] });
    await habits.save({ userId: 'u8', days: [day, { ...day, weekday: 'friday' as const }] });
    expect(await db.collection('training_habits').countDocuments({ userId: 'u8' })).toBe(1);

    const goals = goalsRepository(db);
    const base = {
      userId: 'u8',
      metric: 'weight_kg' as const,
      startValue: 70,
      targetValue: 72,
      startDate: '2026-10-19',
      horizonWeeks: 12,
    };
    await goals.activate({ ...base, type: 'gain_muscle' });
    await goals.activate({ ...base, type: 'maintain', targetValue: null });
    expect((await goals.active('u8'))?.type).toBe('maintain');
    expect(
      (await db.collection('goals').find({ userId: 'u8' }).sort({ _id: 1 }).toArray()).map(
        (g) => g['status'],
      ),
    ).toEqual(['changed', 'active']);
  });
});

describe('RN-PLAN-001 · RN-PLAN-007 · T-040 · planes en MongoDB', () => {
  const plan = generateWeeklyPlan({
    level: 'novice',
    availableDays: ['monday', 'wednesday', 'friday'],
    sessionMinutes: 45,
    goal: 'gain_muscle',
    homeEquipment: [],
    weekStart: '2026-10-19',
    rotationStart: 0,
    catalog: EXERCISES,
    expressExceptions: EXPRESS_EXCEPTIONS,
  });

  it('guarda la semana una sola vez y la reconstruye igual', async () => {
    const plans = plansRepository(db);
    const first = await plans.saveWeek('u10', plan);
    const second = await plans.saveWeek('u10', plan);
    expect(second).toEqual(first);
    expect(await db.collection('weekly_plans').countDocuments({ userId: 'u10' })).toBe(1);
    expect(await db.collection('planned_sessions').countDocuments({ userId: 'u10' })).toBe(3);
    const loaded = await plans.week('u10', '2026-10-19');
    expect(loaded?.days.map((d) => d.session?.template ?? null)).toEqual(
      plan.days.map((d) => d.session?.template ?? null),
    );
    expect(loaded?.days[0]?.session?.versions).toEqual(plan.days[0]?.session?.versions);
  });

  it('mover una sesión cambia el día y la fecha de la sesión, sin duplicarla', async () => {
    const plans = plansRepository(db);
    await plans.saveWeek('u11', plan);
    await plans.moveSession('u11', '2026-10-19', '2026-10-19', '2026-10-20');
    const week = await plans.week('u11', '2026-10-19');
    expect(week?.days.map((d) => d.type).slice(0, 2)).toEqual(['REST', 'TRAINING']);
    expect(
      await db.collection('planned_sessions').countDocuments({ userId: 'u11', date: '2026-10-20' }),
    ).toBe(1);
  });

  it('FR-002-04 · la última carga de cada ejercicio', async () => {
    const sets = setEntriesRepository(db);
    const base = { userId: 'u12', sessionId: 's', setIndex: 0, reps: 8, edited: false };
    await sets.record({
      ...base,
      exerciseCode: 'A',
      loadKg: 40,
      confirmedAt: new Date('2026-10-18T10:00:00Z'),
    });
    await sets.record({
      ...base,
      exerciseCode: 'A',
      setIndex: 1,
      loadKg: 42.5,
      confirmedAt: new Date('2026-10-19T10:00:00Z'),
    });
    await sets.record({ ...base, exerciseCode: 'B', loadKg: 10, confirmedAt: now });
    expect(await sets.lastLoads('u12')).toEqual({ A: 42.5, B: 10 });
  });
});

describe('RN-DQC-005 · T-041 · fuentes del día abierto', () => {
  it('añade fuentes sin repetirlas y un día cerrado no cambia', async () => {
    const days = daysRepository(db);
    expect(await days.addSource('u13', '2026-10-20', 'REST', 'mobility')).toEqual(['mobility']);
    expect(await days.addSource('u13', '2026-10-20', 'REST', 'mobility')).toEqual(['mobility']);
    const rest: DayInputs = {
      type: 'REST',
      sessionsCompleted: 0,
      importedActivityMinutes: [],
      nutritionHalf: false,
      importedSteps: 0,
      mobilityMinutes: 0,
    };
    await days.close('u13', '2026-10-20', 'REST', evaluateDay(rest), now);
    expect(await days.addSource('u13', '2026-10-20', 'REST', 'session:x')).toEqual(['mobility']);
    expect(await days.history('u13')).toEqual([
      { date: '2026-10-20', counted: false, complete: false, nutritionHalf: false },
    ]);
    expect(await days.dayType('u13', '2026-10-20')).toBe('REST');
  });

  it('T-060 · cerrar un día sin registros lo crea cerrado y no se puede abrir de nuevo', async () => {
    const days = daysRepository(db);
    const off: DayInputs = {
      type: 'TRAINING',
      sessionsCompleted: 0,
      importedActivityMinutes: [],
      nutritionHalf: false,
      importedSteps: 0,
      mobilityMinutes: 0,
    };
    expect(await days.close('u13', '2026-10-21', 'TRAINING', evaluateDay(off), now)).toEqual({
      closedNow: true,
    });
    expect(await days.close('u13', '2026-10-21', 'TRAINING', evaluateDay(off), now)).toEqual({
      closedNow: false,
    });
    expect(await days.addSource('u13', '2026-10-21', 'TRAINING', 'session:y')).toEqual([]);
    expect(await days.dayType('u13', '2026-10-22')).toBeNull();
  });
});

describe('FR-003-03 · T-041 · sesiones de entreno con versión de estado', () => {
  it('crea, lee la activa y solo actualiza si la versión no cambió', async () => {
    const workouts = workoutSessionsRepository(db);
    const created = await workouts.create({
      userId: 'u14',
      date: '2026-10-19',
      plannedSessionId: 'p1',
      template: 'FULL_A',
      variant: 'GYM',
      status: 'active',
      startedAt: now,
      endedAt: null,
      loggedAsPlanned: false,
      progress: startProgress([
        { exerciseCode: 'SQ', pattern: 'SQUAT', sets: 2, targetReps: 10, loadKg: 60 },
      ]),
      lastConfirmedAt: null,
      pendingTaps: 0,
    });
    expect((await workouts.activeOn('u14', '2026-10-19'))?.id).toBe(created.id);
    const updated = await workouts.update(created.id, 0, { status: 'completed' });
    expect(updated?.rev).toBe(1);
    expect(await workouts.update(created.id, 0, { status: 'partial' })).toBeNull();
    expect((await workouts.byId(created.id))?.status).toBe('completed');
    expect(await workouts.activeOn('u14', '2026-10-19')).toBeNull();
    expect(await workouts.byId('no-es-un-id')).toBeNull();
  });

  it('RN-MSJ-006 · T-072 · las últimas sesiones completas o parciales, de la más reciente a la más vieja', async () => {
    const workouts = workoutSessionsRepository(db);
    const base = {
      userId: 'u14b',
      plannedSessionId: 'p1',
      template: 'FULL_A' as const,
      variant: 'GYM' as const,
      endedAt: null,
      loggedAsPlanned: false,
      progress: startProgress([
        { exerciseCode: 'SQ', pattern: 'SQUAT', sets: 1, targetReps: 10, loadKg: 60 },
      ]),
      lastConfirmedAt: null,
      pendingTaps: 0,
    };
    const day = (d: number) => `2026-10-${String(d).padStart(2, '0')}`;
    for (const [d, status] of [
      [5, 'completed'],
      [7, 'abandoned'],
      [9, 'partial'],
      [12, 'completed'],
    ] as const) {
      await workouts.create({
        ...base,
        date: day(d),
        status,
        startedAt: new Date(`${day(d)}T23:00:00Z`),
      });
    }
    const recent = await workouts.recentStarted('u14b', 2);
    expect(recent.map((s) => s.date)).toEqual(['2026-10-12', '2026-10-09']);
  });
});

describe('RN-ENT-003 · T-044 · descartar una semana sin usar', () => {
  it('borra la semana y sus sesiones planeadas; otra semana no cambia', async () => {
    const plan = generateWeeklyPlan({
      level: 'novice',
      availableDays: ['monday', 'wednesday', 'friday'],
      sessionMinutes: 45,
      goal: 'gain_muscle',
      homeEquipment: [],
      weekStart: '2026-10-26',
      rotationStart: 0,
      catalog: EXERCISES,
      expressExceptions: EXPRESS_EXCEPTIONS,
    });
    const plans = plansRepository(db);
    await plans.saveWeek('u20', plan);
    await plans.saveWeek('u21', plan);
    await plans.discardWeek('u20', '2026-10-26');
    expect(await plans.week('u20', '2026-10-26')).toBeNull();
    expect(await db.collection('planned_sessions').countDocuments({ userId: 'u20' })).toBe(0);
    expect(await plans.week('u21', '2026-10-26')).not.toBeNull();
    await plans.discardWeek('u20', '2026-10-26');
  });
});

describe('RN-ENT-005 · T-044 · historia de un ejercicio, récords y bitácora', () => {
  it('la historia sale en orden y deshacer quita la serie', async () => {
    const sets = setEntriesRepository(db);
    const base = { userId: 'u22', exerciseCode: 'A', reps: 8, loadKg: 40, edited: false };
    await sets.record({ ...base, sessionId: 's2', setIndex: 0, confirmedAt: now });
    await sets.record({
      ...base,
      sessionId: 's1',
      setIndex: 0,
      confirmedAt: new Date('2026-10-12T15:00:00Z'),
    });
    await sets.record({ ...base, sessionId: 's2', setIndex: 1, confirmedAt: now });
    expect((await sets.exerciseHistory('u22', 'A')).map((h) => [h.sessionId, h.setIndex])).toEqual([
      ['s1', 0],
      ['s2', 0],
      ['s2', 1],
    ]);
    await sets.remove('s2', 'A', 1);
    expect(await sets.exerciseHistory('u22', 'A')).toHaveLength(2);
  });

  it('un récord por serie (setKey único) y se cuentan por usuario y por sesión', async () => {
    const records = personalRecordsRepository(db);
    const record = {
      userId: 'u23',
      exerciseCode: 'A',
      type: 'reps' as const,
      value: 9,
      date: '2026-10-19',
      setKey: 'set:abc:A:0',
    };
    expect(await records.record(record)).toEqual({ inserted: true });
    expect(await records.record(record)).toEqual({ inserted: false });
    await records.record({ ...record, setKey: 'set:def:A:0' });
    expect(await records.count('u23')).toBe(2);
    expect(await records.countForSession('u23', 'abc')).toBe(1);
  });

  it('RN-GAM-011 · cada logro se anota una sola vez', async () => {
    const achievements = achievementsRepository(db);
    const entry = { userId: 'u24', code: 'FIRST_PR', at: now, value: 'A', context: 'reps' };
    expect(await achievements.appendOnce(entry)).toEqual({ added: true });
    expect(await achievements.appendOnce({ ...entry, value: 'B' })).toEqual({ added: false });
    expect(await db.collection('achievements').countDocuments({ userId: 'u24' })).toBe(1);
  });
});

describe('RN-SEG-006 · T-044 · dolor y ajustes por estancamiento', () => {
  it('cuenta sesiones distintas con dolor en un ejercicio', async () => {
    const pain = painFlagsRepository(db);
    const base = { userId: 'u25', exerciseCode: 'A', zone: 'knee', date: '2026-10-19' };
    await pain.record({ ...base, sessionId: 's1' });
    await pain.record({ ...base, sessionId: 's1', zone: 'hip' });
    await pain.record({ ...base, sessionId: 's2' });
    await pain.record({ ...base, exerciseCode: 'B', sessionId: 's3' });
    expect((await pain.sessionsWithPain('u25', 'A')).sort()).toEqual(['s1', 's2']);
  });

  it('RN-ENT-003 · guarda y lista los ajustes del usuario', async () => {
    const adjustments = exerciseAdjustmentsRepository(db);
    const adjustment = {
      exerciseCode: 'A',
      strategy: 'variant' as const,
      fromWeek: '2026-10-26',
      replacementCode: 'B',
    };
    await adjustments.save('u26', adjustment);
    expect(await adjustments.list('u26')).toEqual([adjustment]);
    expect(await adjustments.list('otro')).toEqual([]);
  });
});

describe('RN-NUT-004 · T-051 · comidas del día y frecuentes', () => {
  it('lee las comidas de un día en orden', async () => {
    const meals = mealsRepository(db);
    const base = {
      userId: 'u30',
      method: 'portions' as const,
      portions: { palm: 1, cuppedHand: 0, fist: 0, thumb: 0 },
      proteinG: 25,
      favoriteMealId: null,
      durationMs: 0,
      taps: 1,
    };
    await meals.record({ ...base, date: '2026-10-19', loggedAt: now, idempotencyKey: 'b' });
    await meals.record({
      ...base,
      date: '2026-10-19',
      loggedAt: new Date('2026-10-19T12:00:00Z'),
      idempotencyKey: 'a',
    });
    await meals.record({ ...base, date: '2026-10-18', loggedAt: now, idempotencyKey: 'c' });
    expect((await meals.onDate('u30', '2026-10-19')).map((m) => m.idempotencyKey)).toEqual([
      'a',
      'b',
    ]);
  });

  it('crea, lista, ajusta y borra frecuentes solo del usuario', async () => {
    const favorites = favoriteMealsRepository(db);
    const created = await favorites.create({
      userId: 'u31',
      name: 'Almuerzo',
      portions: { palm: 1, cuppedHand: 2, fist: 1, thumb: 0 },
      foodCodes: ['CORRIENTAZO'],
    });
    expect(await favorites.list('u31')).toEqual([created]);
    expect(await favorites.byId('otro', created.id)).toBeNull();
    expect(await favorites.byId('u31', 'no-es-un-id')).toBeNull();
    await favorites.updatePortions('u31', created.id, {
      palm: 2,
      cuppedHand: 2,
      fist: 1,
      thumb: 0,
    });
    expect((await favorites.byId('u31', created.id))?.portions.palm).toBe(2);
    await favorites.remove('otro', created.id);
    expect(await favorites.list('u31')).toHaveLength(1);
    await favorites.remove('u31', created.id);
    expect(await favorites.list('u31')).toEqual([]);
  });
});
