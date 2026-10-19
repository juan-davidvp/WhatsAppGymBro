/**
 * Registrador JSON de una línea por entrada (plan técnico §11).
 *
 * - RN-DAT-006: redacta los secretos por valor (aunque estén dentro de una URL o
 *   de un mensaje de error) y los campos cuyo nombre indica un secreto.
 * - NFR-07 / RN-DAT-005: omite los campos de texto libre y de identidad del
 *   usuario a cualquier profundidad. Quien registra debe preferir identificadores
 *   y categorías; esta capa es la red de seguridad.
 */

export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export type LogFields = Record<string, unknown>;

export interface Logger {
  debug(event: string, fields?: LogFields): void;
  info(event: string, fields?: LogFields): void;
  warn(event: string, fields?: LogFields): void;
  error(event: string, fields?: LogFields): void;
}

export interface LoggerOptions {
  level: LogLevel;
  secrets: readonly string[];
  write?: (line: string) => void;
  now?: () => Date;
}

const REDACTED = '[REDACTED]';
const OMITTED = '[OMITTED]';

/** Nombres de campo que guardan secretos. */
const SECRET_KEY = /token|secret|password|passwd|api_?key|uri|pepper|authorization/i;

/** Campos de Telegram con texto libre o datos de identidad del usuario. */
const FREE_TEXT_KEYS = new Set([
  'text',
  'caption',
  'first_name',
  'last_name',
  'username',
  'phone_number',
  'contact',
  'location',
  'bio',
]);

const MAX_DEPTH = 6;

export function createLogger(options: LoggerOptions): Logger {
  const write = options.write ?? ((line: string) => process.stdout.write(`${line}\n`));
  const now = options.now ?? (() => new Date());
  const secrets = options.secrets.filter((secret) => secret.length >= 8);
  const minimum = LOG_LEVELS.indexOf(options.level);

  const scrubString = (value: string): string =>
    secrets.reduce((text, secret) => text.replaceAll(secret, REDACTED), value);

  const sanitize = (value: unknown, depth: number): unknown => {
    if (typeof value === 'string') return scrubString(value);
    if (value instanceof Error) {
      return {
        name: value.name,
        message: scrubString(value.message),
        stack: scrubString(value.stack ?? ''),
      };
    }
    if (value === null || typeof value !== 'object') return value;
    if (depth >= MAX_DEPTH) return '[TRUNCATED]';
    if (Array.isArray(value)) return value.map((item) => sanitize(item, depth + 1));
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        if (FREE_TEXT_KEYS.has(key)) return [key, OMITTED];
        if (SECRET_KEY.test(key) && item !== undefined) return [key, REDACTED];
        return [key, sanitize(item, depth + 1)];
      }),
    );
  };

  const log =
    (level: LogLevel) =>
    (event: string, fields: LogFields = {}) => {
      if (LOG_LEVELS.indexOf(level) < minimum) return;
      const entry = {
        time: now().toISOString(),
        level,
        event,
        ...(sanitize(fields, 0) as LogFields),
      };
      write(JSON.stringify(entry));
    };

  return { debug: log('debug'), info: log('info'), warn: log('warn'), error: log('error') };
}
