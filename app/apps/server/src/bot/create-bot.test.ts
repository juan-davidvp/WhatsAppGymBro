import { templateById } from '@gymbro/content';
import type { Update, UserFromGetMe } from 'grammy/types';
import { describe, expect, it } from 'vitest';
import { createLogger } from '../logger.js';
import { inMemoryDependencies } from '../testing/in-memory.js';
import { createBot } from './create-bot.js';

const TOKEN = '123456789:AAFakeTokenForTestsOnly_abcdefghijklmn';

const BOT_INFO: UserFromGetMe = {
  id: 123456789,
  is_bot: true,
  first_name: 'Gym Bro',
  username: 'gymbro_test_bot',
  can_join_groups: false,
  can_read_all_group_messages: false,
  supports_inline_queries: false,
  can_connect_to_business: false,
  has_main_web_app: false,
  has_topics_enabled: false,
  allows_users_to_create_topics: false,
  can_manage_bots: false,
  supports_join_request_queries: false,
};

interface ApiCall {
  method: string;
  payload: Record<string, unknown>;
}

/** Bot sin red: `botInfo` evita getMe y un transformador responde a cada llamada a la API. */
function setup(options: { failWith?: Error } = {}) {
  const lines: string[] = [];
  const logger = createLogger({ level: 'debug', secrets: [TOKEN], write: (l) => lines.push(l) });
  const { deps } = inMemoryDependencies();
  const bot = createBot({ token: TOKEN, logger, deps, botInfo: BOT_INFO });
  const calls: ApiCall[] = [];
  bot.api.config.use(async (_prev, method, payload) => {
    calls.push({ method, payload: payload as Record<string, unknown> });
    if (options.failWith) throw options.failWith;
    return {
      ok: true,
      result: { message_id: 1, date: 0, chat: { id: 42, type: 'private' } },
    } as never;
  });
  return { bot, calls, lines };
}

function textUpdate(text: string, updateId = 1): Update {
  const isCommand = text.startsWith('/');
  return {
    update_id: updateId,
    message: {
      message_id: 10,
      date: 1_760_000_000,
      chat: { id: 42, type: 'private', first_name: 'Juan' },
      from: { id: 42, is_bot: false, first_name: 'Juan', username: 'juan' },
      text,
      ...(isCommand
        ? {
            entities: [
              { type: 'bot_command', offset: 0, length: (text.split(' ')[0] ?? '').length },
            ],
          }
        : {}),
    },
  };
}

describe('T-004 · el bot responde /start', () => {
  it('responde con la plantilla ON-01 al mismo chat', async () => {
    const { bot, calls } = setup();
    await bot.handleUpdate(textUpdate('/start'));
    expect(calls).toHaveLength(1);
    expect(calls[0]?.method).toBe('sendMessage');
    expect(calls[0]?.payload).toMatchObject({ chat_id: 42, text: templateById('ON-01').text });
  });
});

describe('NFR-07 · el registro de un update no contiene texto libre del usuario', () => {
  it('registra id, tipo y comando, pero no el texto ni el nombre', async () => {
    const { bot, lines } = setup();
    await bot.handleUpdate(textUpdate('/start hola me llamo Juan Pérez'));
    await bot.handleUpdate(textUpdate('quiero dejar de comer', 2));
    const output = lines.join('\n');
    expect(output).toContain('"command":"start"');
    expect(output).toContain('"updateType":"message"');
    for (const value of ['hola me llamo', 'Pérez', 'dejar de comer', 'Juan', '"juan"']) {
      expect(output).not.toContain(value);
    }
  });
});

describe('RN-DAT-006 · un error de Telegram se registra sin el token', () => {
  it('el error queda en el registro, redactado, y el bot no se cae', async () => {
    const { bot, lines } = setup({
      failWith: new Error(
        `Network request to https://api.telegram.org/bot${TOKEN}/sendMessage failed`,
      ),
    });
    await bot.handleUpdate(textUpdate('/start'));
    const output = lines.join('\n');
    expect(output).toContain('"event":"bot_error"');
    expect(output).not.toContain(TOKEN);
  });
});
