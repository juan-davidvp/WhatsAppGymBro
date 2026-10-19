import { evaluateDay, type DayInputs } from '@gymbro/domain';
import { MongoClient, type Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mealIdempotencyKey } from './idempotency.js';
import { ensureIndexes } from './indexes.js';
import {
  daysRepository,
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
