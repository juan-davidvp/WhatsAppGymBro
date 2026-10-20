import { ALERT_CATEGORIES_CATALOG, renderCareResponse } from '@gymbro/content';
import { routeFreeText } from '@gymbro/domain';
import type { Context, MiddlewareFn } from 'grammy';
import type { EventEmitter } from '../events/emitter.js';
import type { Logger } from '../logger.js';
import type {
  ProcessedUpdatesRepository,
  RiskSignalsRepository,
  UserRecord,
  UsersRepository,
} from '../ports/repositories.js';

/**
 * Cadena de cada update (plan técnico §5, T-021):
 * deduplicación → usuario → detector de riesgo → enrutador.
 * Cada paso corta la cadena (no llama a `next`) cuando el update no debe seguir.
 */

export type BotContext = Context & { user?: UserRecord };

/** 1. Un `update_id` ya procesado se descarta (NFR-03, SC-003-2). */
export function deduplicate(
  processedUpdates: ProcessedUpdatesRepository,
  clock: () => Date,
  logger: Logger,
): MiddlewareFn<BotContext> {
  return async (ctx, next) => {
    const updateId = ctx.update.update_id;
    if (!(await processedUpdates.markIfNew(updateId, clock()))) {
      logger.info('update_duplicate', { updateId });
      return;
    }
    await next();
  };
}

/**
 * 2. Carga (o crea) el usuario. El bot solo atiende chats privados con una
 * persona: grupos, canales y otros bots se ignoran.
 */
export function loadUser(users: UsersRepository, clock: () => Date): MiddlewareFn<BotContext> {
  return async (ctx, next) => {
    const from = ctx.from;
    if (!from || from.is_bot) return;
    if (ctx.chat && ctx.chat.type !== 'private') return;
    ctx.user = await users.findOrCreate({
      telegramUserId: from.id,
      chatId: ctx.chat?.id ?? from.id,
      now: clock(),
    });
    await next();
  };
}

/** Texto libre del update: texto o pie de foto de un mensaje (nuevo o editado). */
export function freeTextOf(ctx: Context): string | undefined {
  return ctx.msg?.text ?? ctx.msg?.caption;
}

/**
 * 3. RN-SEG-007: todo texto libre (también el que acompaña a un comando o a una
 * foto) se revisa contra las expresiones de alerta antes de cualquier otra ruta.
 * Si coincide: respuesta de cuidado de su categoría y fin; nada más se procesa.
 * La respuesta va primero: si guardar la señal o el evento falla, la persona ya
 * recibió el cuidado. Se guarda solo la categoría (RN-DAT-005); el registro de la
 * señal es lo que pausa las mecánicas de juego ese día.
 */
export function riskGuard(deps: {
  riskSignals: RiskSignalsRepository;
  events: EventEmitter;
  clock: () => Date;
  logger: Logger;
}): MiddlewareFn<BotContext> {
  return async (ctx, next) => {
    const text = freeTextOf(ctx);
    const route = text === undefined ? null : routeFreeText(text, ALERT_CATEGORIES_CATALOG);
    if (route?.route !== 'care') {
      await next();
      return;
    }
    const { category } = route;
    const careResponseId = ALERT_CATEGORIES_CATALOG.find(
      (entry) => entry.category === category,
    )?.careResponseId;
    await ctx.reply(renderCareResponse(category));

    const user = ctx.user;
    if (!user) return;
    const subject = { userId: user.id, timezone: user.timezone };
    try {
      await deps.riskSignals.record(user.id, category, deps.clock());
    } catch (error) {
      deps.logger.error('risk_signal_store_failed', { category, error });
    }
    await deps.events.emit('risk_signal_detected', subject, { category });
    await deps.events.emit('care_response_sent', subject, {
      category,
      templateId: careResponseId,
    });
  };
}
