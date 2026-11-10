import { PARAMETERS } from '@gymbro/domain';
import { GrammyError } from 'grammy';
import { describe, expect, it } from 'vitest';
import { BotBlockedError, retryDelayMs, telegramSender } from './sender.js';

/** T-070 · FR-007-08 · envío a Telegram con reintentos y espera exponencial. */

const apiError = (code: number, retryAfter?: number) =>
  new GrammyError(
    'falló',
    {
      ok: false,
      error_code: code,
      description: code === 403 ? 'Forbidden: bot was blocked by the user' : 'Error',
      ...(retryAfter !== undefined ? { parameters: { retry_after: retryAfter } } : {}),
    },
    'sendMessage',
    {},
  );

function fakeApi(failures: unknown[]) {
  const calls: { chatId: number | string; text: string }[] = [];
  return {
    calls,
    api: {
      sendMessage: (chatId: number | string, text: string) => {
        calls.push({ chatId, text });
        const failure = failures.shift();
        if (failure) return Promise.reject(failure);
        return Promise.resolve({ message_id: 77 } as never);
      },
    },
  };
}

const reply = { text: 'Hola', buttons: [] };

describe('FR-007-08 · T-070 · envío con reintentos', () => {
  it('ante 429 espera el retry_after de Telegram y vuelve a intentar', async () => {
    const { api, calls } = fakeApi([apiError(429, 3)]);
    const waits: number[] = [];
    const sender = telegramSender(api, (ms) => {
      waits.push(ms);
      return Promise.resolve();
    });
    expect(await sender.send(42, reply)).toEqual({ messageId: 77 });
    expect(calls).toHaveLength(2);
    expect(waits).toEqual([3000]);
  });

  it('ante fallos del servidor la espera crece (P-098 × 2^intento) y se rinde tras P-097 intentos', async () => {
    const attempts = PARAMETERS.messages.sendMaxAttempts;
    const { api, calls } = fakeApi(Array.from({ length: attempts }, () => apiError(502)));
    const waits: number[] = [];
    const sender = telegramSender(api, (ms) => {
      waits.push(ms);
      return Promise.resolve();
    });
    await expect(sender.send(42, reply)).rejects.toBeInstanceOf(GrammyError);
    expect(calls).toHaveLength(attempts);
    const base = PARAMETERS.messages.sendRetryBaseSeconds * 1000;
    expect(waits).toEqual(Array.from({ length: attempts - 1 }, (_, i) => base * 2 ** i));
    expect(retryDelayMs(apiError(502), 1)).toBe(base);
  });

  it('RN-MSJ-014 · un 403 (bot bloqueado) no se reintenta', async () => {
    const { api, calls } = fakeApi([apiError(403)]);
    const sender = telegramSender(api, () => Promise.resolve());
    await expect(sender.send(42, reply)).rejects.toBeInstanceOf(BotBlockedError);
    expect(calls).toHaveLength(1);
  });

  it('un error que no es temporal (400) no se reintenta', async () => {
    const { api, calls } = fakeApi([apiError(400)]);
    const sender = telegramSender(api, () => Promise.resolve());
    await expect(sender.send(42, reply)).rejects.toBeInstanceOf(GrammyError);
    expect(calls).toHaveLength(1);
  });
});
