import { renderTemplate, templateById } from '@gymbro/content';
import {
  PARAMETERS,
  byPurposePriority,
  evaluateProactive,
  fadedPurposes,
  pickTemplate,
  type LocalDate,
  type MessagePurpose,
  type SuppressionReason,
  type UserMessagingState,
  type WallCell,
} from '@gymbro/domain';
import type { Logger } from '../logger.js';
import type {
  MessageStatsRecord,
  MessageStatsRepository,
  OutboxMessage,
  OutboxRepository,
  UserRecord,
  UsersRepository,
} from '../ports/repositories.js';
import { proactiveButtons, type ComposeDeps, type CompositionEffect } from './compose.js';
import { COMPOSERS } from './composers.js';
import { BotBlockedError, type MessageSender } from './sender.js';

/**
 * Envío de la bandeja de salida (T-070, FR-007-03, plan técnico §6). En cada
 * ciclo toma las salidas vencidas y las vuelve a evaluar con el motor y el estado
 * del momento (¿ya entrenó?, ¿pausó?). El motor evalúa la hora real de envío, no
 * la programada: una salida atrasada nunca cae en silencio, fuera de presupuesto
 * ni sin separación (G06). Si pasa, se elige plantilla (RN-MSJ-010) y se envía; si
 * no, queda suprimida con su motivo (FR-007-07). Un error con una salida se
 * registra y no detiene a las demás.
 */

export interface DispatchDeps extends ComposeDeps {
  users: UsersRepository;
  outbox: OutboxRepository;
  messageStats: MessageStatsRepository;
  sender: MessageSender;
  /** T-080: PNG del muro de constancia (en producción, `adapters/images/wall.ts`). */
  renderWall?: (grid: readonly (readonly WallCell[])[]) => Uint8Array;
  /** Fuente de aleatoriedad de la rotación (en pruebas, fija). */
  random?: () => number;
  logger?: Logger;
}

const DAY_MS = 86_400_000;
const WEEK_DAYS_COUNT = 7;
/** Historial que necesita el motor: la semana del presupuesto y la espera de P-058. */
const HISTORY_DAYS = Math.max(WEEK_DAYS_COUNT, PARAMETERS.messages.templateCooldownDays);

/** Estado de mensajería del usuario para el motor (RN-MSJ-002 a 014). */
export function messagingState(
  user: UserRecord,
  stats: MessageStatsRecord,
  disabledPurposes: readonly MessagePurpose[] = [],
): UserMessagingState {
  return {
    timeZone: user.timezone,
    intensity: user.settings.intensity,
    quietHours: user.settings.quietHours,
    pausedUntil: stats.pausedUntil,
    inactivityPaused: stats.inactivityPausedAt !== null,
    blocked: user.status === 'blocked' || stats.blockedAt !== null,
    backoffUntil: stats.backoffUntil,
    disabledPurposes,
  };
}

/** Envía o suprime las salidas vencidas; devuelve cuántas envió. */
export async function dispatchDue(deps: DispatchDeps): Promise<number> {
  const now = deps.clock();
  const users = new Map((await deps.users.listActive()).map((u) => [u.id, u]));
  // Por hora y, a la misma hora, por prioridad de propósito (SPEC-007 §8).
  const due = byPurposePriority(await deps.outbox.due(now)).sort(
    (a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime(),
  );
  let sent = 0;
  for (const message of due) {
    try {
      if (await dispatchOne(message, users.get(message.userId), now, deps)) sent += 1;
    } catch (error) {
      deps.logger?.error('message_dispatch_failed', { userId: message.userId, error });
    }
  }
  return sent;
}

async function dispatchOne(
  message: OutboxMessage,
  user: UserRecord | undefined,
  now: Date,
  deps: DispatchDeps,
): Promise<boolean> {
  // Un usuario que ya no está activo (en pausa, bloqueado o borrado) no recibe nada.
  if (!user) return suppress(message, null, 'paused', deps);
  const composer = COMPOSERS[message.purpose];
  if (!composer) return suppress(message, user, 'disabled_purpose', deps);
  // La fecha de la clave: `plan_listo` de la víspera habla del día siguiente.
  const date = message.key.slice(message.key.indexOf(':') + 1) as LocalDate;
  const composition = await composer(user, date, deps);
  const first = composition.options[0];
  if (!first) return suppress(message, user, 'not_doable', deps);

  const history = await deps.outbox.sentSince(
    user.id,
    new Date(now.getTime() - HISTORY_DAYS * DAY_MS),
  );
  const stats = await deps.messageStats.get(user.id);
  const disabled = [...userDisabledPurposes(user), ...(await fadedFor(user, deps))];
  const decision = evaluateProactive({
    candidate: {
      purpose: message.purpose,
      scheduledFor: now,
      buttons: templateById(first.templateId).buttons.length,
      ...(message.notAfter ? { notAfter: message.notAfter } : {}),
      reactivation: message.reactivation,
    },
    user: messagingState(user, stats, disabled),
    history,
    day: composition.day,
    now,
  });
  if (!decision.send) return suppress(message, user, decision.reason, deps);

  // T-080: la imagen se genera al enviar; si falla, sale el texto sin las opciones que la necesitan.
  const photo = composition.wall ? renderPhoto(composition.wall, user, deps) : null;
  const options = composition.options.filter((o) => photo !== null || !o.needsImage);
  const templateId = pickTemplate(
    options.map((o) => o.templateId),
    history,
    now,
    user.timezone,
    deps.random ?? Math.random,
  );
  const option = options.find((o) => o.templateId === templateId);
  if (!templateId || !option) return suppress(message, user, 'cooldown', deps);

  // Como mucho una vez: si el proceso cae entre el envío y el registro, la salida
  // queda reclamada y no se vuelve a enviar al reiniciar.
  if (!(await deps.outbox.claim(message.id))) return false;
  let messageId: number;
  try {
    ({ messageId } = await deps.sender.send(user.chatId, {
      text: renderTemplate(templateId, option.variables),
      buttons: proactiveButtons(templateId, message.purpose),
      ...(photo ? { photo } : {}),
    }));
  } catch (error) {
    if (error instanceof BotBlockedError) {
      await markBlocked(user, deps);
      return false;
    }
    await deps.outbox.markFailed(message.id);
    throw error;
  }
  await deps.outbox.markSent(message.id, { templateId, sentAt: now, telegramMessageId: messageId });
  await deps.events.emit(
    'message_sent',
    { userId: user.id, timezone: user.timezone },
    { purpose: message.purpose, templateId },
  );
  if (message.purpose === 'resumen_semanal') {
    await deps.events.emit(
      'weekly_summary_sent',
      { userId: user.id, timezone: user.timezone },
      { withImage: photo !== null },
    );
  }
  if (composition.effect) await applyEffect(composition.effect, user, date, stats, deps);
  return true;
}

/** PNG del muro; null si no hay generador o falla (se registra y sale el texto). */
function renderPhoto(
  grid: readonly (readonly WallCell[])[],
  user: UserRecord,
  deps: DispatchDeps,
): Uint8Array | null {
  if (!deps.renderWall) return null;
  try {
    return deps.renderWall(grid);
  } catch (error) {
    deps.logger?.error('wall_render_failed', { userId: user.id, error });
    return null;
  }
}

/** `/ajustes`: propósitos que el usuario apagó (RN-MSJ-001: los demás, encendidos). */
export function userDisabledPurposes(user: UserRecord): MessagePurpose[] {
  const enabled = user.settings.purposesEnabled ?? {};
  return (Object.keys(enabled) as MessagePurpose[]).filter((p) => enabled[p] === false);
}

/**
 * RN-MSJ-014: el usuario bloqueó el bot. Se cancelan las pendientes (también la
 * de este envío), se marca y se registra `bot_blocked`; no se le escribe más.
 */
async function markBlocked(user: UserRecord, deps: DispatchDeps): Promise<void> {
  await deps.outbox.cancelPending(user.id);
  await deps.messageStats.update(user.id, { blockedAt: deps.clock() });
  await deps.users.setStatus(user.id, 'blocked');
  await deps.events.emit('bot_blocked', { userId: user.id, timezone: user.timezone }, {});
}

/**
 * RN-MSJ-009: tras P-055 semanas cumplidas seguidas, `recordatorio_contextual` se
 * apaga y `plan_listo` también si su tasa de acción no llega a P-056.
 */
async function fadedFor(user: UserRecord, deps: DispatchDeps): Promise<MessagePurpose[]> {
  const weekStreak = (await deps.streaks.get(user.id))?.state.weekStreak ?? 0;
  if (weekStreak < PARAMETERS.messages.fadingAfterFulfilledWeeks) return [];
  const { sent, actioned } = await deps.outbox.purposeStats(user.id, 'plan_listo');
  return fadedPurposes({
    fulfilledWeeksStreak: weekStreak,
    planReadyActionRate: sent > 0 ? actioned / sent : null,
  });
}

/** RN-MSJ-008: el `regreso` final pausa los proactivos; la reactivación se cuenta. */
async function applyEffect(
  effect: CompositionEffect,
  user: UserRecord,
  date: LocalDate,
  stats: MessageStatsRecord,
  deps: DispatchDeps,
): Promise<void> {
  const subject = { userId: user.id, timezone: user.timezone };
  if (effect.kind === 'inactivity_pause') {
    await deps.messageStats.update(user.id, {
      inactivityPausedAt: deps.clock(),
      reactivationsUsed: 0,
    });
    await deps.events.emit('inactivity_pause_started', subject, {
      inactiveDays: effect.inactiveDays,
    });
    return;
  }
  const count = stats.reactivationsUsed + 1;
  await deps.messageStats.update(user.id, { reactivationsUsed: count, lastReactivationDate: date });
  await deps.events.emit('reactivation_sent', subject, { count });
}

async function suppress(
  message: OutboxMessage,
  user: UserRecord | null,
  reason: SuppressionReason,
  deps: DispatchDeps,
): Promise<false> {
  if (await deps.outbox.markSuppressed(message.id, reason)) {
    await deps.events.emit(
      'message_suppressed',
      user ? { userId: user.id, timezone: user.timezone } : null,
      { purpose: message.purpose, reason },
    );
  }
  return false;
}
