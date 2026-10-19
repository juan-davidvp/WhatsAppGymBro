import { PARAMETERS } from '@gymbro/domain';

/**
 * Colecciones e índices de `vault/output/sdd/plan/modelo-de-datos.md` §2.
 * `schema.test.ts` compara esta lista con la tabla de la bóveda: si se añade una
 * colección o un índice, primero va en el modelo de datos.
 */

export interface IndexSpec {
  /** Campos en orden (todos ascendentes). */
  readonly keys: readonly string[];
  readonly unique?: boolean;
  /** Caducidad en segundos (índice TTL sobre un campo de fecha). */
  readonly expireAfterSeconds?: number;
}

const DAY_SECONDS = 86_400;

export const COLLECTIONS = {
  users: [{ keys: ['telegramUserId'], unique: true }],
  consents: [{ keys: ['userId', 'category'] }],
  screenings: [{ keys: ['userId'] }],
  goals: [{ keys: ['userId', 'status'] }],
  training_habits: [{ keys: ['userId'], unique: true }],
  weekly_plans: [{ keys: ['userId', 'weekStart'], unique: true }],
  planned_sessions: [{ keys: ['userId', 'date'] }],
  workout_sessions: [{ keys: ['userId', 'date'] }],
  set_entries: [{ keys: ['idempotencyKey'], unique: true }],
  personal_records: [{ keys: ['userId', 'exerciseCode', 'type'] }],
  pain_flags: [{ keys: ['userId', 'exerciseCode'] }],
  meals: [{ keys: ['userId', 'date'] }, { keys: ['idempotencyKey'], unique: true }],
  favorite_meals: [{ keys: ['userId'] }],
  body_measurements: [{ keys: ['userId', 'date'] }],
  days: [{ keys: ['userId', 'date'], unique: true }],
  streak_states: [{ keys: ['userId'], unique: true }],
  xp_ledger: [{ keys: ['userId', 'at'] }],
  achievements: [{ keys: ['userId', 'code', 'at'] }],
  weeks: [{ keys: ['userId', 'weekStart'], unique: true }],
  quests: [{ keys: ['userId', 'weekStart'] }],
  seasons: [{ keys: ['userId', 'startDate'] }],
  proactive_messages: [{ keys: ['status', 'scheduledFor'] }, { keys: ['userId', 'sentAt'] }],
  message_stats: [{ keys: ['userId'], unique: true }],
  imported_activities: [{ keys: ['userId', 'start'] }],
  ingestion_tokens: [{ keys: ['tokenHash'], unique: true }],
  risk_signals: [{ keys: ['userId', 'at'] }],
  events: [{ keys: ['name', 'at'] }, { keys: ['userRef', 'at'] }],
  processed_updates: [
    { keys: ['updateId'], unique: true },
    // P-080: un update procesado se recuerda unos días y luego caduca.
    { keys: ['at'], expireAfterSeconds: PARAMETERS.data.processedUpdatesTtlDays * DAY_SECONDS },
  ],
} as const satisfies Record<string, readonly IndexSpec[]>;

export type CollectionName = keyof typeof COLLECTIONS;
