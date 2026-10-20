import type { Update, UserFromGetMe } from 'grammy/types';
import { createBot } from '../bot/create-bot.js';
import { createLogger } from '../logger.js';
import { inMemoryDependencies, type InMemoryOptions } from './in-memory.js';

/** Bot sin red para pruebas: `botInfo` evita getMe y un transformador responde cada llamada. */

export const TEST_TOKEN = '123456789:AAFakeTokenForTestsOnly_abcdefghijklmn';

export const TEST_BOT_INFO: UserFromGetMe = {
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

export interface ApiCall {
  method: string;
  payload: Record<string, unknown>;
}

export function setupTestBot(options: InMemoryOptions = {}) {
  const lines: string[] = [];
  const logger = createLogger({
    level: 'debug',
    secrets: [TEST_TOKEN],
    write: (l) => lines.push(l),
  });
  const memory = inMemoryDependencies(options);
  const bot = createBot({
    token: TEST_TOKEN,
    logger,
    deps: memory.deps,
    clock: options.clock ?? (() => new Date('2026-10-19T15:00:00Z')),
    botInfo: TEST_BOT_INFO,
  });
  const calls: ApiCall[] = [];
  bot.api.config.use(async (_prev, method, payload) => {
    calls.push({ method, payload: payload as Record<string, unknown> });
    const result =
      method === 'answerCallbackQuery'
        ? true
        : { message_id: 1, date: 0, chat: { id: 42, type: 'private' } };
    return { ok: true, result } as never;
  });
  return { bot, calls, lines, ...memory };
}

const PERSON = { id: 42, is_bot: false, first_name: 'Juan', username: 'juan' };
const PRIVATE_CHAT = { id: 42, type: 'private' as const, first_name: 'Juan' };

type IncomingMessage = NonNullable<Update['message']>;

function baseMessage(fields: Record<string, unknown>): IncomingMessage {
  return {
    message_id: 10,
    date: 1_760_000_000,
    chat: PRIVATE_CHAT,
    from: PERSON,
    ...fields,
  } as IncomingMessage;
}

export function textMessage(text: string): IncomingMessage {
  const isCommand = text.startsWith('/');
  return baseMessage({
    text,
    ...(isCommand
      ? {
          entities: [{ type: 'bot_command', offset: 0, length: (text.split(' ')[0] ?? '').length }],
        }
      : {}),
  });
}

export function textUpdate(text: string, updateId = 1): Update {
  return { update_id: updateId, message: textMessage(text) };
}

export function editedTextUpdate(text: string, updateId = 1): Update {
  return { update_id: updateId, edited_message: { ...textMessage(text), edit_date: 1 } as never };
}

export function photoUpdate(caption: string | undefined, updateId = 1): Update {
  return {
    update_id: updateId,
    message: baseMessage({
      photo: [{ file_id: 'f', file_unique_id: 'u', width: 1, height: 1 }],
      ...(caption === undefined ? {} : { caption }),
    }),
  };
}

export function callbackUpdate(data: string, updateId = 1): Update {
  return {
    update_id: updateId,
    callback_query: {
      id: 'cb1',
      from: PERSON,
      chat_instance: 'ci',
      data,
      message: baseMessage({ text: 'x' }) as never,
    },
  };
}

export function groupTextUpdate(text: string, updateId = 1): Update {
  return {
    update_id: updateId,
    message: baseMessage({ text, chat: { id: -100, type: 'group', title: 'Gym' } }),
  };
}

export function botAuthorUpdate(text: string, updateId = 1): Update {
  return {
    update_id: updateId,
    message: baseMessage({ text, from: { id: 7, is_bot: true, first_name: 'otro' } }),
  };
}

// ── Ayudantes para recorrer el onboarding ─────────────────────────────────────

export interface Sent {
  text: string;
  buttons: { text: string; callback_data: string }[];
}

export function sent(calls: ApiCall[]): Sent[] {
  return calls
    .filter((c) => c.method === 'sendMessage' || c.method === 'editMessageText')
    .map((c) => ({
      text: String(c.payload['text']),
      buttons: (
        (
          c.payload['reply_markup'] as
            { inline_keyboard: { text: string; callback_data: string }[][] } | undefined
        )?.inline_keyboard ?? []
      ).flat(),
    }));
}

/** Toca el botón con ese texto del último mensaje que lo tenga. */
export function tapData(calls: ApiCall[], label: string): string {
  const button = sent(calls)
    .flatMap((m) => m.buttons)
    .findLast((b) => b.text === label);
  if (!button) throw new Error(`No hay botón ${label}`);
  return button.callback_data;
}

export async function startAnd(...labels: string[]) {
  const setup = setupTestBot();
  let updateId = 1;
  await setup.bot.handleUpdate(textUpdate('/start', updateId++));
  for (const label of labels) {
    await setup.bot.handleUpdate(callbackUpdate(tapData(setup.calls, label), updateId++));
  }
  return { ...setup, nextUpdateId: () => updateId++ };
}
