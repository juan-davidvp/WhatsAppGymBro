import { describe, expect, it } from 'vitest';
import { createLogger, type LogLevel } from './logger.js';

const TOKEN = '123456789:AAFakeTokenForTestsOnly_abcdefghijklmn';

function capture(level: LogLevel = 'debug') {
  const lines: string[] = [];
  const logger = createLogger({
    level,
    secrets: [TOKEN],
    write: (line) => lines.push(line),
    now: () => new Date('2026-10-19T12:00:00Z'),
  });
  const entries = () => lines.map((line) => JSON.parse(line) as Record<string, unknown>);
  return { logger, lines, entries };
}

describe('T-004 · registros JSON estructurados', () => {
  it('escribe una línea JSON con hora, nivel, evento y campos', () => {
    const { logger, entries } = capture();
    logger.info('bot_started', { mode: 'long_polling' });
    expect(entries()).toEqual([
      {
        time: '2026-10-19T12:00:00.000Z',
        level: 'info',
        event: 'bot_started',
        mode: 'long_polling',
      },
    ]);
  });

  it('respeta el nivel mínimo', () => {
    const { logger, lines } = capture('warn');
    logger.debug('x');
    logger.info('x');
    logger.warn('x');
    logger.error('x');
    expect(lines).toHaveLength(2);
  });
});

describe('RN-DAT-006 · los registros redactan los secretos', () => {
  it('reemplaza el valor del token en cualquier texto, aunque esté dentro de otro', () => {
    const { logger, lines } = capture();
    logger.error('telegram_error', {
      error: `Request to https://api.telegram.org/bot${TOKEN}/getMe failed`,
      nested: { url: `bot${TOKEN}`, list: [TOKEN] },
    });
    expect(lines.join('\n')).not.toContain(TOKEN);
    expect(lines.join('\n')).toContain('[REDACTED]');
  });

  it('redacta campos cuyo nombre indica un secreto', () => {
    const { logger, entries } = capture();
    logger.info('config', { telegramBotToken: 'otro', mongodbUri: 'mongodb://u:p@h', apiKey: 'k' });
    expect(entries()[0]).toMatchObject({
      telegramBotToken: '[REDACTED]',
      mongodbUri: '[REDACTED]',
      apiKey: '[REDACTED]',
    });
  });

  it('redacta el secreto también en el mensaje y la pila de un Error', () => {
    const { logger, lines } = capture();
    logger.error('crash', { error: new Error(`fallo con ${TOKEN}`) });
    expect(lines.join('\n')).not.toContain(TOKEN);
  });
});

describe('NFR-07 · los registros no contienen texto libre del usuario', () => {
  it('omite los campos de texto libre y de identidad, a cualquier profundidad', () => {
    const { logger, lines, entries } = capture();
    logger.info('update', {
      text: 'me siento fatal',
      message: { caption: 'foto de mi cena', from: { first_name: 'Juan', username: 'juan' } },
    });
    const output = lines.join('\n');
    for (const value of ['me siento fatal', 'foto de mi cena', 'Juan', '"juan"']) {
      expect(output).not.toContain(value);
    }
    expect(entries()[0]).toMatchObject({ text: '[OMITTED]' });
  });
});
