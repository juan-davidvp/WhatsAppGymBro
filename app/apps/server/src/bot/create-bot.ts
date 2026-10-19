import { templateById } from '@gymbro/content';
import { Bot, InlineKeyboard, type MiddlewareFn } from 'grammy';
import type { UserFromGetMe } from 'grammy/types';
import type { EventEmitter } from '../events/emitter.js';
import type { Logger } from '../logger.js';
import type {
  ProcessedUpdatesRepository,
  RiskSignalsRepository,
  UsersRepository,
} from '../ports/repositories.js';
import { encodeCallbackData, parseCallbackData, type NavTarget } from './callback-data.js';
import { deduplicate, loadUser, riskGuard, type BotContext } from './middleware.js';

/**
 * Adaptador de Telegram (grammY). Delgado: traduce el update a un caso de uso y
 * responde con plantillas del paquete `content`. Orden de cada update (plan
 * técnico §5): deduplicación → usuario → detector de riesgo → enrutador.
 */

export interface BotDependencies {
  processedUpdates: ProcessedUpdatesRepository;
  users: UsersRepository;
  riskSignals: RiskSignalsRepository;
  events: EventEmitter;
}

export interface CreateBotOptions {
  token: string;
  logger: Logger;
  deps: BotDependencies;
  clock?: () => Date;
  /** Solo en pruebas: evita la llamada a getMe. */
  botInfo?: UserFromGetMe;
}

/** Botones de CU-07, por su texto en la bóveda. */
const NAV_TARGET_BY_LABEL: Record<string, NavTarget> = {
  Hoy: 'today',
  Comida: 'food',
  Progreso: 'progress',
};

/** Teclado de una plantilla cuyos botones son de navegación. */
export function navKeyboard(templateId: string): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  for (const label of templateById(templateId).buttons) {
    const target = NAV_TARGET_BY_LABEL[label];
    if (!target) throw new Error(`Botón sin destino de navegación: ${templateId} · ${label}`);
    keyboard.text(label, encodeCallbackData({ action: 'nav', target }));
  }
  return keyboard;
}

export function createBot({
  token,
  logger,
  deps,
  clock = () => new Date(),
  botInfo,
}: CreateBotOptions): Bot<BotContext> {
  const bot = new Bot<BotContext>(token, botInfo ? { botInfo } : {});

  bot.use(logUpdate(logger));

  // Un error en un update se registra y no tumba el proceso ni bloquea los demás.
  const handlers = bot.errorBoundary((error) => {
    logger.error('bot_error', { updateId: error.ctx.update.update_id, error: error.error });
  });

  handlers.use(deduplicate(deps.processedUpdates, clock, logger));
  handlers.use(loadUser(deps.users, clock));
  handlers.use(riskGuard({ ...deps, clock, logger }));

  // ── Enrutador ──────────────────────────────────────────────────────────────
  handlers.command('start', async (ctx) => {
    await ctx.reply(templateById('ON-01').text);
  });

  handlers.on('callback_query:data', async (ctx) => {
    const action = parseCallbackData(ctx.callbackQuery.data);
    if (!action) logger.warn('callback_unknown', { updateId: ctx.update.update_id });
    // Las pantallas de Hoy, Comida y Progreso llegan con sus tareas (T-04x…);
    // por ahora el toque se confirma para que Telegram no deje el botón cargando.
    await ctx.answerCallbackQuery();
  });

  // Texto, foto u otro mensaje sin ruta: CU-07 con botones, nunca conversación.
  handlers.on('message', async (ctx) => {
    await ctx.reply(templateById('CU-07').text, { reply_markup: navKeyboard('CU-07') });
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
function logUpdate(logger: Logger): MiddlewareFn<BotContext> {
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
