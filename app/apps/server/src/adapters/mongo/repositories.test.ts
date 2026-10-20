import { EXERCISES, EXPRESS_EXCEPTIONS } from '@gymbro/content';
import { evaluateDay, generateWeeklyPlan, startProgress, type DayInputs } from '@gymbro/domain';
import { MongoClient, type Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mealIdempotencyKey } from './idempotency.js';
import { ensureIndexes } from './indexes.js';
import {
  workoutSessionsRepository,
  plansRepository,
  bodyMeasurementsRepository,
  goalsRepository,
  trainingHabitsRepository,
  consentsRepository,
  screeningsRepository,
  userDataEraser,
  daysRepository,
  eventsRepository,
  mealsRepository,
  processedUpdatesRepository,
  riskSignalsRepository,
  setEntriesRepository,
  streakStatesRepository,
  usersRepository,
} from './repositories.js';
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
    const closes = await Promise.all([
      days.close('u1', '2026-10-19', now),
      days.close('u1', '2026-10-19', now),
    ]);
    expect(closes.filter((c) => c.closedNow)).toHaveLength(1);
    await streaks.applyDayClose('u1', { date: '2026-10-19', counted: true });
    const again = await streaks.applyDayClose('u1', { date: '2026-10-19', counted: true });
    expect(again.totalCountedDays).toBe(1);
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
    await days.close('u1', '2026-10-19', now);
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

describe('RN-DQC-007 · el total acumulado nunca baja en la base', () => {
  it('un día que no cuenta no resta y un día anterior no cambia el total', async () => {
    const streaks = streakStatesRepository(db);
    await streaks.applyDayClose('u2', { date: '2026-10-19', counted: true });
    await streaks.applyDayClose('u2', { date: '2026-10-20', counted: false });
    expect(
      (await streaks.applyDayClose('u2', { date: '2026-10-18', counted: true })).totalCountedDays,
    ).toBe(1);
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
    await days.close('u13', '2026-10-20', now);
    expect(await days.addSource('u13', '2026-10-20', 'REST', 'session:x')).toEqual(['mobility']);
    expect(await days.history('u13')).toEqual([{ date: '2026-10-20', counted: false }]);
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
});
