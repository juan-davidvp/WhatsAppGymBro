import { templateById } from '@gymbro/content';
import { Bot, InlineKeyboard, type MiddlewareFn } from 'grammy';
import type { UserFromGetMe } from 'grammy/types';
import type { EventEmitter } from '../events/emitter.js';
import type { Logger } from '../logger.js';
import {
  answerOnboarding,
  answerPrivacy,
  isOnboardingComplete,
  privacyCommand,
  promptFor,
  startOnboarding,
  type Reply,
} from '../onboarding/onboarding.js';
import type {
  ConsentsRepository,
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
  consents: ConsentsRepository;
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

/** Envía las respuestas en orden, cada una con sus botones en una columna. */
async function sendAll(ctx: BotContext, replies: readonly Reply[]): Promise<void> {
  for (const reply of replies) {
    if (reply.buttons.length === 0) {
      await ctx.reply(reply.text);
      continue;
    }
    const keyboard = new InlineKeyboard();
    for (const button of reply.buttons) keyboard.text(button.label, button.data).row();
    await ctx.reply(reply.text, { reply_markup: keyboard });
  }
}

async function sendOutOfDomain(ctx: BotContext): Promise<void> {
  await ctx.reply(templateById('CU-07').text, { reply_markup: navKeyboard('CU-07') });
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

  const useCases = { ...deps, clock };

  // ── Enrutador ──────────────────────────────────────────────────────────────
  handlers.command('start', async (ctx) => {
    const user = ctx.user;
    if (!user) return;
    if (isOnboardingComplete(user)) return sendOutOfDomain(ctx);
    await sendAll(ctx, await startOnboarding(user, useCases));
  });

  handlers.command('privacidad', async (ctx) => {
    if (ctx.user) await sendAll(ctx, [privacyCommand(ctx.user)]);
  });

  handlers.on('callback_query:data', async (ctx) => {
    // El toque se confirma primero para que Telegram no deje el botón cargando.
    await ctx.answerCallbackQuery();
    const action = parseCallbackData(ctx.callbackQuery.data);
    const user = ctx.user;
    if (!action || !user) {
      logger.warn('callback_unknown', { updateId: ctx.update.update_id });
      return;
    }
    switch (action.action) {
      case 'ob':
        return sendAll(ctx, await answerOnboarding(user, action.step, action.value, useCases));
      case 'pv':
        return sendAll(ctx, await answerPrivacy(user, action.value, useCases));
      case 'nav':
        // Las pantallas de Hoy, Comida y Progreso llegan con sus tareas (T-04x…).
        return;
    }
  });

  // Texto, foto u otro mensaje sin ruta: durante el onboarding se repite la
  // pregunta con sus botones (SPEC-001 §8); después, CU-07. Nunca conversación.
  handlers.on('message', async (ctx) => {
    const user = ctx.user;
    const prompt = user && !isOnboardingComplete(user) ? promptFor(user.onboarding.step) : null;
    if (prompt) return sendAll(ctx, [prompt]);
    return sendOutOfDomain(ctx);
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
