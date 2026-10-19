import { renderCareResponse } from '@gymbro/content';
import { MongoClient, type Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ensureIndexes } from '../adapters/mongo/indexes.js';
import {
  consentsRepository,
  eventsRepository,
  processedUpdatesRepository,
  riskSignalsRepository,
  usersRepository,
} from '../adapters/mongo/repositories.js';
import { createEventEmitter } from '../events/emitter.js';
import { createLogger } from '../logger.js';
import { TEST_BOT_INFO, TEST_TOKEN, textUpdate } from '../testing/telegram.js';
import { createBot } from './create-bot.js';

/** T-021 · la cadena completa del bot con los repositorios MongoDB reales. */

let server: MongoMemoryServer;
let client: MongoClient;
let db: Db;
const clock = () => new Date('2026-10-19T15:00:00Z');

beforeAll(async () => {
  server = await MongoMemoryServer.create({ binary: { version: '8.0.4' } });
  client = await MongoClient.connect(server.getUri());
  db = client.db('gymbro_bot_test');
  await ensureIndexes(db);
}, 180_000);

afterAll(async () => {
  await client?.close();
  await server?.stop();
});

function realBot() {
  const logger = createLogger({ level: 'error', secrets: [TEST_TOKEN], write: () => undefined });
  const bot = createBot({
    token: TEST_TOKEN,
    logger,
    clock,
    botInfo: TEST_BOT_INFO,
    deps: {
      processedUpdates: processedUpdatesRepository(db),
      users: usersRepository(db),
      riskSignals: riskSignalsRepository(db),
      consents: consentsRepository(db),
      events: createEventEmitter({
        repository: eventsRepository(db),
        logger,
        appVersion: '0.0.0',
        phase: 'n1_B',
        clock,
      }),
    },
  });
  const sent: string[] = [];
  bot.api.config.use(async (_prev, method, payload) => {
    if (method === 'sendMessage') sent.push(String((payload as { text: string }).text));
    return {
      ok: true,
      result: { message_id: 1, date: 0, chat: { id: 42, type: 'private' } },
    } as never;
  });
  return { bot, sent };
}

describe('RN-SEG-007 · RN-DAT-005 · T-021 con MongoDB', () => {
  it('alerta → cuidado; en la base: usuario, señal y eventos sin texto; reintento sin duplicados', async () => {
    const { bot, sent } = realBot();
    const update = textUpdate('me lesioné el hombro en press militar', 501);
    await bot.handleUpdate(update);
    await bot.handleUpdate(update);

    expect(sent).toEqual([renderCareResponse('pain')]);
    expect(await db.collection('users').countDocuments({ telegramUserId: 42 })).toBe(1);
    expect(await db.collection('risk_signals').countDocuments({ category: 'pain' })).toBe(1);

    const events = await db
      .collection('events')
      .find({}, { projection: { _id: 0 } })
      .toArray();
    expect(events.map((e) => e['name'])).toEqual(['risk_signal_detected', 'care_response_sent']);
    const stored = JSON.stringify(
      await Promise.all(
        ['users', 'risk_signals', 'events', 'processed_updates'].map((name) =>
          db.collection(name).find().toArray(),
        ),
      ),
    );
    for (const word of ['lesion', 'hombro', 'press', 'Juan']) expect(stored).not.toContain(word);
  });
});
