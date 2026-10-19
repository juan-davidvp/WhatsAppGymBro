import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

const TOKEN = '123456789:AAFakeTokenForTestsOnly_abcdefghijklmn';

describe('T-004 · configuración por variables de entorno', () => {
  it('lee el token y usa los valores por defecto', () => {
    const config = loadConfig({ TELEGRAM_BOT_TOKEN: TOKEN });
    expect(config.telegramBotToken).toBe(TOKEN);
    expect(config.defaultTimezone).toBe('America/Bogota');
    expect(config.logLevel).toBe('info');
  });

  it('acepta DEFAULT_TZ y LOG_LEVEL', () => {
    const config = loadConfig({ TELEGRAM_BOT_TOKEN: TOKEN, DEFAULT_TZ: 'UTC', LOG_LEVEL: 'debug' });
    expect(config.defaultTimezone).toBe('UTC');
    expect(config.logLevel).toBe('debug');
  });

  it('falla si falta el token', () => {
    expect(() => loadConfig({})).toThrow('TELEGRAM_BOT_TOKEN: falta');
  });

  it('falla con una zona horaria que no existe', () => {
    expect(() => loadConfig({ TELEGRAM_BOT_TOKEN: TOKEN, DEFAULT_TZ: 'Marte/Olympus' })).toThrow(
      'DEFAULT_TZ: zona horaria IANA desconocida',
    );
  });
});

describe('RN-DAT-006 · la configuración no expone secretos', () => {
  it('el error por un token mal formado no repite el valor recibido', () => {
    const badToken = 'no-es-un-token-pero-es-secreto-123';
    let message = '';
    try {
      loadConfig({ TELEGRAM_BOT_TOKEN: badToken });
    } catch (error) {
      message = String(error);
    }
    expect(message).toContain('TELEGRAM_BOT_TOKEN: formato de token inválido');
    expect(message).not.toContain(badToken);
  });

  it('la configuración expone la lista de secretos para que el registrador los redacte', () => {
    expect(loadConfig({ TELEGRAM_BOT_TOKEN: TOKEN }).secrets).toEqual([TOKEN]);
  });
});
