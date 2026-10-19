import { PARAMETERS } from '@gymbro/domain';
import { z } from 'zod';
import { STUDY_PHASES, type StudyPhase } from './events/catalog.js';
import { LOG_LEVELS, type LogLevel } from './logger.js';

/**
 * Configuración del servidor desde variables de entorno (plan técnico §10).
 * Secretos solo por entorno (RN-DAT-006); los errores nombran la variable,
 * nunca repiten su valor. Las demás variables de §10 se añaden con su tarea
 * (webhook, IA, ingesta…).
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
  MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\/\S+$/, 'no es una URI de MongoDB'),
  MONGO_DATABASE: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,63}$/, 'nombre de base inválido')
    .default('gymbro'),
  /** Fase del protocolo de medición que llevan los eventos (plan de medición §1). */
  STUDY_PHASE: z.enum(STUDY_PHASES).default('n1_B'),
});

export interface Config {
  telegramBotToken: string;
  defaultTimezone: string;
  logLevel: LogLevel;
  mongodbUri: string;
  mongoDatabase: string;
  studyPhase: StudyPhase;
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
  const { TELEGRAM_BOT_TOKEN, DEFAULT_TZ, LOG_LEVEL, MONGODB_URI, MONGO_DATABASE, STUDY_PHASE } =
    parsed.data;
  return {
    telegramBotToken: TELEGRAM_BOT_TOKEN,
    defaultTimezone: DEFAULT_TZ,
    logLevel: LOG_LEVEL,
    mongodbUri: MONGODB_URI,
    mongoDatabase: MONGO_DATABASE,
    studyPhase: STUDY_PHASE,
    // La URI lleva la contraseña de la base: se redacta completa y también la contraseña sola.
    secrets: [TELEGRAM_BOT_TOKEN, MONGODB_URI, ...uriPassword(MONGODB_URI)],
  };
}

/** Contraseña incluida en la URI, si la hay (para redactarla también suelta). */
function uriPassword(uri: string): string[] {
  try {
    const password = decodeURIComponent(new URL(uri).password);
    return password ? [password] : [];
  } catch {
    return [];
  }
}
