import { PARAMETERS } from '@gymbro/domain';
import { z } from 'zod';
import { LOG_LEVELS, type LogLevel } from './logger.js';

/**
 * Configuración del servidor desde variables de entorno (plan técnico §10).
 * Secretos solo por entorno (RN-DAT-006); los errores nombran la variable,
 * nunca repiten su valor. Las demás variables de §10 se añaden con su tarea
 * (MONGODB_URI en T-005/T-020, webhook, IA, ingesta…).
 */

function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

const envSchema = z.object({
  // Formato de BotFather: <id numérico>:<35 caracteres aprox.>
  TELEGRAM_BOT_TOKEN: z.string().regex(/^\d+:[\w-]{30,}$/, 'formato de token inválido'),
  DEFAULT_TZ: z
    .string()
    .refine(isValidTimezone, 'zona horaria IANA desconocida')
    .default(PARAMETERS.user.defaultTimezone),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
});

export interface Config {
  telegramBotToken: string;
  defaultTimezone: string;
  logLevel: LogLevel;
  /** Valores que el registrador debe redactar dondequiera que aparezcan. */
  secrets: string[];
}

export function loadConfig(env: Record<string, string | undefined>): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    // Solo la variable y el motivo; jamás el valor recibido.
    const problems = parsed.error.issues.map((issue) => {
      const name = issue.path.join('.');
      return `${name}: ${env[name] === undefined ? 'falta' : issue.message}`;
    });
    throw new Error(`Configuración inválida → ${problems.join('; ')}`);
  }
  const { TELEGRAM_BOT_TOKEN, DEFAULT_TZ, LOG_LEVEL } = parsed.data;
  return {
    telegramBotToken: TELEGRAM_BOT_TOKEN,
    defaultTimezone: DEFAULT_TZ,
    logLevel: LOG_LEVEL,
    secrets: [TELEGRAM_BOT_TOKEN],
  };
}
