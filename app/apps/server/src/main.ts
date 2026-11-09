import { readFileSync } from 'node:fs';
import { BOT_COMMANDS } from '@gymbro/content';
import { MongoClient } from 'mongodb';
import { ensureIndexes } from './adapters/mongo/indexes.js';
import {
  achievementsRepository,
  exerciseAdjustmentsRepository,
  favoriteMealsRepository,
  mealsRepository,
  noticesRepository,
  painFlagsRepository,
  personalRecordsRepository,
  daysRepository,
  workoutSessionsRepository,
  plansRepository,
  setEntriesRepository,
  bodyMeasurementsRepository,
  goalsRepository,
  trainingHabitsRepository,
  consentsRepository,
  screeningsRepository,
  userDataEraser,
  eventsRepository,
  processedUpdatesRepository,
  riskSignalsRepository,
  streakStatesRepository,
  usersRepository,
  questsRepository,
  weeksRepository,
  xpLedgerRepository,
} from './adapters/mongo/repositories.js';
import { closeDueDays } from './scheduler/close-days.js';
import { startScheduler } from './scheduler/loop.js';
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

    const events = createEventEmitter({
      repository: eventsRepository(db),
      logger,
      appVersion: APP_VERSION,
      phase: config.studyPhase,
      clock,
    });
    const users = usersRepository(db);
    const days = daysRepository(db);
    const streaks = streakStatesRepository(db);
    const notices = noticesRepository(db);
    const plans = plansRepository(db);
    const riskSignals = riskSignalsRepository(db);
    const workouts = workoutSessionsRepository(db);
    const achievements = achievementsRepository(db);
    const xp = xpLedgerRepository(db);
    const weeks = weeksRepository(db);
    const quests = questsRepository(db);

    const bot = createBot({
      token: config.telegramBotToken,
      logger,
      clock,
      deps: {
        processedUpdates: processedUpdatesRepository(db),
        users,
        riskSignals,
        consents: consentsRepository(db),
        screenings: screeningsRepository(db),
        eraser: userDataEraser(db),
        bodyMeasurements: bodyMeasurementsRepository(db),
        habits: trainingHabitsRepository(db),
        goals: goalsRepository(db),
        plans,
        setEntries: setEntriesRepository(db),
        days,
        streaks,
        notices,
        xp,
        weeks,
        quests,
        workouts,
        records: personalRecordsRepository(db),
        achievements,
        painFlags: painFlagsRepository(db),
        adjustments: exerciseAdjustmentsRepository(db),
        meals: mealsRepository(db),
        favorites: favoriteMealsRepository(db),
        events,
      },
    });

    // T-060 · cierre programado de los días (FR-005-02).
    const scheduler = startScheduler({
      logger,
      tick: async () => {
        const closed = await closeDueDays({
          users,
          days,
          streaks,
          notices,
          plans,
          riskSignals,
          workouts,
          achievements,
          xp,
          weeks,
          quests,
          events,
          clock,
          logger,
        });
        if (closed > 0) logger.info('days_closed', { count: closed });
      },
    });

    const stop = (signal: string) => {
      logger.info('bot_stopping', { signal });
      scheduler.stop();
      void bot.stop();
    };
    process.once('SIGINT', () => stop('SIGINT'));
    process.once('SIGTERM', () => stop('SIGTERM'));

    // FR-001-11: lista de comandos del menú (plantillas §2.3).
    await bot.api.setMyCommands(BOT_COMMANDS.map((c) => ({ ...c })));
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
