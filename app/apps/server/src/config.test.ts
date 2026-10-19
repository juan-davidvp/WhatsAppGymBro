import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

const TOKEN = '123456789:AAFakeTokenForTestsOnly_abcdefghijklmn';
const DB_PASSWORD = 'clave-de-prueba-xyz';
const MONGODB_URI = `mongodb://gymbro_app:${DB_PASSWORD}@localhost:27017/gymbro?authSource=gymbro`;
const BASE = { TELEGRAM_BOT_TOKEN: TOKEN, MONGODB_URI };

describe('T-004 · configuración por variables de entorno', () => {
  it('lee el token y usa los valores por defecto', () => {
    const config = loadConfig(BASE);
    expect(config.telegramBotToken).toBe(TOKEN);
    expect(config.defaultTimezone).toBe('America/Bogota');
    expect(config.logLevel).toBe('info');
  });

  it('acepta DEFAULT_TZ y LOG_LEVEL', () => {
    const config = loadConfig({ ...BASE, DEFAULT_TZ: 'UTC', LOG_LEVEL: 'debug' });
    expect(config.defaultTimezone).toBe('UTC');
    expect(config.logLevel).toBe('debug');
  });

  it('T-021 · lee la base de datos y la fase del estudio, con valores por defecto', () => {
    const config = loadConfig(BASE);
    expect([config.mongodbUri, config.mongoDatabase, config.studyPhase]).toEqual([
      MONGODB_URI,
      'gymbro',
      'n1_B',
    ]);
    expect(loadConfig({ ...BASE, STUDY_PHASE: 'alpha' }).studyPhase).toBe('alpha');
    expect(() => loadConfig({ ...BASE, STUDY_PHASE: 'beta' })).toThrow('STUDY_PHASE');
  });

  it('falla si falta MONGODB_URI', () => {
    expect(() => loadConfig({ TELEGRAM_BOT_TOKEN: TOKEN })).toThrow('MONGODB_URI: falta');
  });

  it('falla si falta el token', () => {
    expect(() => loadConfig({})).toThrow('TELEGRAM_BOT_TOKEN: falta');
  });

  it('falla con una zona horaria que no existe', () => {
    expect(() => loadConfig({ ...BASE, DEFAULT_TZ: 'Marte/Olympus' })).toThrow(
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
    expect(loadConfig(BASE).secrets).toEqual([TOKEN, MONGODB_URI, DB_PASSWORD]);
  });

  it('el error por una URI de MongoDB mal formada no repite el valor', () => {
    const badUri = `postgres://u:${DB_PASSWORD}@x`;
    expect(() => loadConfig({ ...BASE, MONGODB_URI: badUri })).toThrow(
      'MONGODB_URI: no es una URI de MongoDB',
    );
    try {
      loadConfig({ ...BASE, MONGODB_URI: badUri });
    } catch (error) {
      expect(String(error)).not.toContain(DB_PASSWORD);
    }
  });
});
