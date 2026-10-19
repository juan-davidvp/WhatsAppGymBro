import { readFileSync } from 'node:fs';
import { MongoClient } from 'mongodb';
import { ensureIndexes } from './adapters/mongo/indexes.js';
import {
  consentsRepository,
  screeningsRepository,
  userDataEraser,
  eventsRepository,
  processedUpdatesRepository,
  riskSignalsRepository,
  usersRepository,
} from './adapters/mongo/repositories.js';
import { createBot } from './bot/create-bot.js';
import { loadConfig } from './config.js';
import { createEventEmitter } from './events/emitter.js';
import { createLogger } from './logger.js';

/**
 * Proceso único del servidor (plan técnico §3). En local: long polling y MongoDB
 * en Docker. Variables de entorno en `app/infra/.env` (ver `app/infra/.env.example`).
 */

const APP_VERSION = (
  JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
    version: string;
  }
).version;

async function main(): Promise<void> {
  let config;
  try {
    config = loadConfig(process.env);
  } catch (error) {
    // Aún no hay secretos cargados que redactar: el mensaje solo nombra variables.
    createLogger({ level: 'error', secrets: [] }).error('config_invalid', { error });
    process.exitCode = 1;
    return;
  }

  const logger = createLogger({ level: config.logLevel, secrets: config.secrets });
  const clock = () => new Date();

  let client: MongoClient | undefined;
  try {
    client = await MongoClient.connect(config.mongodbUri);
    const db = client.db(config.mongoDatabase);
    await ensureIndexes(db);
    logger.info('db_connected', { database: config.mongoDatabase });

    const bot = createBot({
      token: config.telegramBotToken,
      logger,
      clock,
      deps: {
        processedUpdates: processedUpdatesRepository(db),
        users: usersRepository(db),
        riskSignals: riskSignalsRepository(db),
        consents: consentsRepository(db),
        screenings: screeningsRepository(db),
        eraser: userDataEraser(db),
        events: createEventEmitter({
          repository: eventsRepository(db),
          logger,
          appVersion: APP_VERSION,
          phase: config.studyPhase,
          clock,
        }),
      },
    });

    const stop = (signal: string) => {
      logger.info('bot_stopping', { signal });
      void bot.stop();
    };
    process.once('SIGINT', () => stop('SIGINT'));
    process.once('SIGTERM', () => stop('SIGTERM'));

    await bot.start({
      drop_pending_updates: false,
      onStart: (info) =>
        logger.info('bot_started', { mode: 'long_polling', botUsername: info.username }),
    });
    logger.info('bot_stopped');
  } catch (error) {
    logger.error('server_start_failed', { error });
    process.exitCode = 1;
  } finally {
    await client?.close();
  }
}

void main();
