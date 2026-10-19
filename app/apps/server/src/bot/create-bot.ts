import { templateById } from '@gymbro/content';
import { Bot, type Context, type MiddlewareFn } from 'grammy';
import type { UserFromGetMe } from 'grammy/types';
import type { Logger } from '../logger.js';

/**
 * Adaptador de Telegram (grammY). Delgado: traduce el update y responde con
 * plantillas del paquete `content`; la lógica de negocio llegará en los casos de uso.
 */

export interface CreateBotOptions {
  token: string;
  logger: Logger;
  /** Solo en pruebas: evita la llamada a getMe. */
  botInfo?: UserFromGetMe;
}

export function createBot({ token, logger, botInfo }: CreateBotOptions): Bot {
  const bot = new Bot(token, botInfo ? { botInfo } : {});

  bot.use(logUpdate(logger));

  // Un error en un update se registra y no tumba el proceso ni bloquea los demás.
  const handlers = bot.errorBoundary((error) => {
    logger.error('bot_error', { updateId: error.ctx.update.update_id, error: error.error });
  });

  handlers.command('start', async (ctx) => {
    await ctx.reply(templateById('ON-01').text);
  });

  // Red de seguridad para errores fuera de la frontera anterior (long polling).
  bot.catch((error) => {
    logger.error('bot_error', { updateId: error.ctx.update.update_id, error: error.error });
  });

  return bot;
}

/**
 * NFR-07: del update solo se registran identificadores y categorías:
 * id, tipo, chat y, si es un comando, su nombre (sin argumentos).
 */
function logUpdate(logger: Logger): MiddlewareFn<Context> {
  return async (ctx, next) => {
    const started = Date.now();
    const updateType = Object.keys(ctx.update).find((key) => key !== 'update_id');
    const command = ctx.message?.text?.startsWith('/')
      ? ctx.message.text.slice(1).split(/[\s@]/)[0]
      : undefined;
    await next();
    logger.info('update_handled', {
      updateId: ctx.update.update_id,
      updateType,
      chatId: ctx.chat?.id,
      command,
      durationMs: Date.now() - started,
    });
  };
}
