import { PARAMETERS } from '@gymbro/domain';
import { GrammyError, HttpError, InputFile, type Api } from 'grammy';
import { telegramPayload } from '../bot/create-bot.js';
import type { Reply } from '../onboarding/replies.js';

/**
 * Envío de mensajes proactivos a Telegram (T-070, FR-007-08). Reintenta ante el
 * límite de tasa (429, con el `retry_after` de Telegram) o un fallo temporal
 * (5xx, red) hasta P-097 intentos, con espera exponencial desde P-098 segundos.
 * Un 403 significa que el usuario bloqueó el bot (RN-MSJ-014): no se reintenta.
 */

export interface MessageSender {
  send(chatId: number, reply: Reply): Promise<{ messageId: number }>;
}

/** RN-MSJ-014: el usuario bloqueó el bot (o desactivó la cuenta). */
export class BotBlockedError extends Error {
  constructor() {
    super('El usuario bloqueó el bot');
    this.name = 'BotBlockedError';
  }
}

const MS_PER_SECOND = 1000;
const WALL_FILE_NAME = 'muro.png';
const FORBIDDEN = 403;
const TOO_MANY_REQUESTS = 429;
const SERVER_ERROR = 500;

function isRetryable(error: unknown): boolean {
  if (error instanceof HttpError) return true;
  return (
    error instanceof GrammyError &&
    (error.error_code === TOO_MANY_REQUESTS || error.error_code >= SERVER_ERROR)
  );
}

/** Espera antes del intento siguiente: la que pide Telegram o la exponencial. */
export function retryDelayMs(error: unknown, attempt: number): number {
  const retryAfter = error instanceof GrammyError ? error.parameters.retry_after : undefined;
  if (retryAfter !== undefined) return retryAfter * MS_PER_SECOND;
  return PARAMETERS.messages.sendRetryBaseSeconds * MS_PER_SECOND * 2 ** (attempt - 1);
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function telegramSender(
  api: Pick<Api, 'sendMessage' | 'sendPhoto'>,
  sleep: (ms: number) => Promise<void> = wait,
): MessageSender {
  return {
    async send(chatId, reply) {
      const { text, options } = telegramPayload(reply);
      for (let attempt = 1; ; attempt += 1) {
        try {
          // T-080: con imagen, el texto va como pie de la foto.
          const message = reply.photo
            ? await api.sendPhoto(chatId, new InputFile(reply.photo, WALL_FILE_NAME), {
                ...options,
                caption: text,
              })
            : await api.sendMessage(chatId, text, options);
          return { messageId: message.message_id };
        } catch (error) {
          if (error instanceof GrammyError && error.error_code === FORBIDDEN) {
            throw new BotBlockedError();
          }
          if (!isRetryable(error) || attempt >= PARAMETERS.messages.sendMaxAttempts) throw error;
          await sleep(retryDelayMs(error, attempt));
        }
      }
    },
  };
}
