import { createBot } from './bot/create-bot.js';
import { loadConfig } from './config.js';
import { createLogger } from './logger.js';

/**
 * Proceso único del servidor (plan técnico §3). En local: long polling.
 * Variables de entorno en `app/infra/.env` (ver `app/infra/.env.example`).
 */
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
  const bot = createBot({ token: config.telegramBotToken, logger });

  const stop = (signal: string) => {
    logger.info('bot_stopping', { signal });
    void bot.stop();
  };
  process.once('SIGINT', () => stop('SIGINT'));
  process.once('SIGTERM', () => stop('SIGTERM'));

  try {
    await bot.start({
      drop_pending_updates: false,
      onStart: (info) =>
        logger.info('bot_started', { mode: 'long_polling', botUsername: info.username }),
    });
    logger.info('bot_stopped');
  } catch (error) {
    logger.error('bot_start_failed', { error });
    process.exitCode = 1;
  }
}

void main();
