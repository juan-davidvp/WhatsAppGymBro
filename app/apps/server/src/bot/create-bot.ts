import { MAIN_KEYBOARD, templateById } from '@gymbro/content';
import { Bot, GrammyError, InlineKeyboard, Keyboard, type MiddlewareFn } from 'grammy';
import type { UserFromGetMe } from 'grammy/types';
import type { EventEmitter } from '../events/emitter.js';
import type { Logger } from '../logger.js';
import {
  answerOnboarding,
  answerPrivacy,
  answerScreening,
  isOnboardingComplete,
  privacyCommand,
  answerOnboardingText,
  answerResume,
  onboardingPrompt,
  startOnboarding,
  type Reply,
} from '../onboarding/onboarding.js';
import type {
  BodyMeasurementsRepository,
  GoalsRepository,
  DaysRepository,
  WorkoutSessionsRepository,
  PlansRepository,
  SetEntriesRepository,
  TrainingHabitsRepository,
  ConsentsRepository,
  ProcessedUpdatesRepository,
  RiskSignalsRepository,
  ScreeningsRepository,
  UserDataEraser,
  UsersRepository,
} from '../ports/repositories.js';
import { plain } from '../onboarding/replies.js';
import { planView } from '../plans/plan-view.js';
import { answerToday, todayScreen } from '../today/today.js';
import { answerDeletion, deleteDataCommand } from '../privacy/deletion.js';
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
  screenings: ScreeningsRepository;
  eraser: UserDataEraser;
  bodyMeasurements: BodyMeasurementsRepository;
  habits: TrainingHabitsRepository;
  goals: GoalsRepository;
  plans: PlansRepository;
  setEntries: SetEntriesRepository;
  days: DaysRepository;
  workouts: WorkoutSessionsRepository;
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
/** Negritas `**así**` de las plantillas → HTML de Telegram (el resto se escapa). */
export function toTelegramHtml(text: string): string {
  const escaped = text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return escaped.replaceAll(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}

/**
 * Envía las respuestas en orden. Una respuesta marcada `edit` reemplaza el mensaje
 * del botón tocado (selección múltiple); las demás son mensajes nuevos.
 */
function inlineKeyboard(reply: Reply): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  const rows = reply.layout ?? reply.buttons.map(() => reply.rowSize ?? 1);
  let index = 0;
  for (const size of rows) {
    const row = reply.buttons.slice(index, index + size);
    for (const b of row) keyboard.text(b.label, b.data);
    if (row.length > 0) keyboard.row();
    index += size;
    if (index >= reply.buttons.length) break;
  }
  // Por si el diseño no cubre todos los botones: uno por fila.
  for (const b of reply.buttons.slice(index)) keyboard.text(b.label, b.data).row();
  return keyboard;
}

/** FR-001-11: teclado persistente con 🏋️ Hoy · 🍽️ Comida · 📈 Progreso. */
function mainKeyboard(): Keyboard {
  return new Keyboard()
    .add(...MAIN_KEYBOARD.map((label) => Keyboard.text(label)))
    .resized()
    .persistent();
}

/**
 * Envía las respuestas en orden. Una respuesta marcada `edit` reemplaza el mensaje
 * del botón tocado (tarjeta de sesión, selección múltiple); las demás son nuevas.
 */
async function sendAll(ctx: BotContext, replies: readonly Reply[]): Promise<void> {
  for (const reply of replies) {
    if (reply.toast) continue;
    const formatted = reply.text.includes('**')
      ? { text: toTelegramHtml(reply.text), parse_mode: 'HTML' as const }
      : { text: reply.text };
    const markup = reply.mainKeyboard
      ? { reply_markup: mainKeyboard() }
      : reply.buttons.length > 0
        ? { reply_markup: inlineKeyboard(reply) }
        : {};
    const options = {
      ...markup,
      ...(formatted.parse_mode ? { parse_mode: formatted.parse_mode } : {}),
    };
    if (reply.edit && ctx.callbackQuery?.message && !reply.mainKeyboard) {
      try {
        await ctx.editMessageText(
          formatted.text,
          options as Parameters<typeof ctx.editMessageText>[1],
        );
      } catch (error) {
        // Un toque repetido deja la tarjeta igual: Telegram responde "message is not modified".
        if (!(
          error instanceof GrammyError && error.description.includes('message is not modified')
        )) {
          throw error;
        }
      }
    } else {
      await ctx.reply(formatted.text, options);
    }
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

  const useCases = { ...deps, clock, logger };

  // ── Enrutador ──────────────────────────────────────────────────────────────
  handlers.command('start', async (ctx) => {
    const user = ctx.user;
    if (!user) return;
    if (isOnboardingComplete(user)) return sendOutOfDomain(ctx);
    await sendAll(ctx, await startOnboarding(user, useCases));
  });

  handlers.command('borrar_datos', async (ctx) => {
    if (ctx.user) await sendAll(ctx, await deleteDataCommand(ctx.user, useCases));
  });

  handlers.command('hoy', async (ctx) => {
    if (ctx.user) await sendAll(ctx, await todayScreen(ctx.user, useCases));
  });

  handlers.command('plan', async (ctx) => {
    if (ctx.user) await sendAll(ctx, await planView(ctx.user, useCases));
  });

  handlers.command('privacidad', async (ctx) => {
    if (ctx.user) await sendAll(ctx, [privacyCommand(ctx.user)]);
  });

  handlers.on('callback_query:data', async (ctx) => {
    let replies: Reply[] = [];
    try {
      replies = await routeCallback(ctx);
    } finally {
      // Se confirma siempre el toque (Telegram no deja el botón cargando), con aviso si lo hay.
      const toast = replies.find((r) => r.toast);
      await ctx.answerCallbackQuery(toast ? { text: toast.text } : undefined);
    }
    await sendAll(ctx, replies);
  });

  async function routeCallback(
    ctx: BotContext & { callbackQuery: { data: string } },
  ): Promise<Reply[]> {
    const action = parseCallbackData(ctx.callbackQuery.data);
    const user = ctx.user;
    if (!action || !user) {
      logger.warn('callback_unknown', { updateId: ctx.update.update_id });
      return [];
    }
    switch (action.action) {
      case 'ob':
        return answerOnboarding(user, action.step, action.value, useCases);
      case 'pv':
        return answerPrivacy(user, action.value, useCases);
      case 'sc':
        return answerScreening(user, action.value, useCases);
      case 'del':
        return answerDeletion(user, action.value, useCases);
      case 'rs':
        return answerResume(user, action.value, useCases);
      case 'td':
        return answerToday(user, action.value, useCases);
      case 'ss':
        // Las operaciones de la tarjeta llegan con T-042.
        return [];
      case 'nav':
        if (action.target === 'plan') return planView(user, useCases);
        if (action.target === 'today') return todayScreen(user, useCases);
        return [plain('KB-02')];
    }
  }

  // Texto, foto u otro mensaje sin ruta: durante el onboarding se repite la
  // pregunta con sus botones (SPEC-001 §8); después, CU-07. Nunca conversación.
  handlers.on('message', async (ctx) => {
    const user = ctx.user;
    // FR-001-11: botones del teclado persistente.
    const text = ctx.message.text;
    if (user && text === MAIN_KEYBOARD[0]) return sendAll(ctx, await todayScreen(user, useCases));
    if (user && text !== undefined && (MAIN_KEYBOARD as readonly string[]).includes(text)) {
      return sendAll(ctx, [plain('KB-02')]);
    }
    if (user && !isOnboardingComplete(user)) {
      const replies =
        text === undefined
          ? await onboardingPrompt(user, useCases)
          : await answerOnboardingText(user, text, useCases);
      if (replies.length > 0) return sendAll(ctx, replies);
    }
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
