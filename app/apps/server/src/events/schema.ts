import { alertCategorySchema } from '@gymbro/content';
import {
  CONSENT_CATEGORIES,
  MESSAGE_PURPOSES,
  ONBOARDING_STEPS,
  WEEK_DAYS,
  XP_EVENT_TYPES,
} from '@gymbro/domain';
import { z } from 'zod';
import { EVENT_NAMES, STUDY_PHASES, type EventName } from './catalog.js';

/** Qué hizo contar el día cerrado (`day_closed.source`). */
export const DAY_SOURCES = ['session', 'nutrition', 'mobility', 'none'] as const;
export type DaySource = (typeof DAY_SOURCES)[number];

/**
 * Esquemas de los eventos de medición (RN-DAT-005, SC-009-3): un evento solo
 * lleva categorías, identificadores y métricas. Se valida cada evento antes de
 * guardarlo; lo que no cumple no se guarda.
 *
 * - Valor de texto = ficha corta sin espacios (`distress`, `CU-05`, `2026-10-19`):
 *   una frase escrita por el usuario no cabe.
 * - Claves en camelCase y sin nombres que sugieran texto libre (`text`, `name`…).
 * - Los eventos que ya emite el código tienen además su esquema propio y estricto.
 */

/** Ficha: identificador o categoría (ASCII, sin espacios, ≤ 64 caracteres). */
export const TOKEN = /^[A-Za-z0-9_:.-]{1,64}$/;

/** Claves que indicarían texto libre o contenido de mensajes. */
const FORBIDDEN_KEY = /text|caption|name|message|answer|comment|note|description|query|input/i;

const tokenSchema = z.string().regex(TOKEN, 'valor de texto no es una ficha');
const scalarSchema = z.union([tokenSchema, z.number().finite(), z.boolean(), z.null()]);
const valueSchema = z.union([scalarSchema, z.array(scalarSchema).max(20)]);

/** ID de plantilla de `plantillas-de-mensajes.md` (`PL-01`). */
const templateIdSchema = z.string().regex(/^[A-Z]{2}-\d{2}$/);

const propKeySchema = z
  .string()
  .regex(/^[a-z][A-Za-z0-9]{0,39}$/, 'clave no es camelCase')
  .refine((key) => !FORBIDDEN_KEY.test(key), 'clave de texto libre');

/** Propiedades genéricas: para eventos cuyo esquema propio llega con su tarea. */
export const genericPropsSchema = z.record(propKeySchema, valueSchema);

/** Esquemas propios de los eventos que ya se emiten (estrictos: ninguna clave extra). */
export const EVENT_PROPS_SCHEMAS = {
  risk_signal_detected: z.strictObject({ category: alertCategorySchema }),
  care_response_sent: z.strictObject({
    category: alertCategorySchema,
    templateId: z.string().regex(/^CU-\d{2}$/),
  }),
  onboarding_started: z.strictObject({}),
  onboarding_step_completed: z.strictObject({ step: z.enum(ONBOARDING_STEPS) }),
  consent_given: z.strictObject({ categories: z.array(z.enum(CONSENT_CATEGORIES)).min(1) }),
  consent_declined: z.strictObject({ categories: z.array(z.enum(CONSENT_CATEGORIES)).min(1) }),
  age_gate_failed: z.strictObject({}),
  screening_completed: z.strictObject({
    type: z.enum(['pre_activity', 'food_body']),
    result: z.enum(['clear', 'flag', 'not_done']),
  }),
  number_free_mode_enabled: z.strictObject({}),
  deletion_requested: z.strictObject({}),
  deletion_completed: z.strictObject({}),
  weight_logged: z.strictObject({ source: z.enum(['onboarding', 'progress']) }),
  goal_set: z.strictObject({
    type: z.enum([
      'gain_muscle',
      'lose_fat',
      'gain_strength',
      'recomposition',
      'consistency',
      'maintain',
    ]),
    horizonWeeks: z.number().int().positive(),
    withTarget: z.boolean(),
  }),
  goal_adjusted: z.strictObject({
    direction: z.enum(['conservative', 'ambitious']),
    limited: z.boolean(),
  }),
  habit_declared: z.strictObject({
    days: z.array(z.enum(WEEK_DAYS as readonly [string, ...string[]])).min(1),
    slot: z.enum(['morning', 'midday', 'afternoon', 'evening']),
  }),
  plan_generated: z.strictObject({
    trainingDays: z.number().int().nonnegative(),
    intensity: z.enum(['low', 'normal']),
  }),
  plan_viewed: z.strictObject({}),
  progression_suggested: z.strictObject({ exercises: z.number().int().positive() }),
  session_variant_chosen: z.strictObject({ variant: z.enum(['GYM', 'HOME', 'EXPRESS']) }),
  session_started: z.strictObject({ variant: z.enum(['GYM', 'HOME', 'EXPRESS']) }),
  cant_today_selected: z.strictObject({ option: z.enum(['express', 'move', 'rest']) }),
  session_rescheduled: z.strictObject({}),
  set_confirmed: z.strictObject({
    taps: z.number().int().positive(),
    edited: z.boolean(),
  }),
  set_undone: z.strictObject({}),
  plateau_detected: z.strictObject({}),
  meal_logged: z.strictObject({
    method: z.enum(['portions', 'favorite', 'repeat', 'photo', 'text']),
    durationMs: z.number().int().nonnegative(),
    taps: z.number().int().nonnegative(),
    proteinG: z.number().nonnegative(),
  }),
  favorite_meal_saved: z.strictObject({ fromTemplate: z.boolean() }),
  meal_repeated: z.strictObject({ meals: z.number().int().positive() }),
  nutrition_half_completed: z.strictObject({ mode: z.enum(['numbers', 'number_free']) }),
  pain_flagged: z.strictObject({
    zone: z.enum(['shoulder', 'elbow', 'wrist', 'back', 'hip', 'knee', 'ankle', 'other']),
  }),
  pr_detected: z.strictObject({
    exerciseCode: z.string().regex(/^[A-Z0-9_]{1,40}$/),
    kind: z.enum(['e1rm', 'reps']),
  }),
  session_completed: z.strictObject({
    variant: z.enum(['GYM', 'HOME', 'EXPRESS']),
    sets: z.number().int().nonnegative(),
    durationMin: z.number().int().nonnegative(),
  }),
  session_partial: z.strictObject({
    variant: z.enum(['GYM', 'HOME', 'EXPRESS']),
    sets: z.number().int().nonnegative(),
  }),
  session_logged_as_planned: z.strictObject({
    variant: z.enum(['GYM', 'HOME', 'EXPRESS']),
    sets: z.number().int().nonnegative(),
  }),
  onboarding_completed: z.strictObject({
    durationMs: z.number().int().nonnegative(),
    taps: z.number().int().nonnegative(),
  }),
  /** SPEC-005 §7: tipo, cuenta, completo y fuente del día cerrado (T-060). */
  day_closed: z.strictObject({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dayType: z.enum(['TRAINING', 'REST']),
    counted: z.boolean(),
    complete: z.boolean(),
    source: z.enum(DAY_SOURCES),
  }),
  /** SPEC-005 §7 (T-061): racha, comodines y reparación; solo números. */
  streak_extended: z.strictObject({ streak: z.number().int().positive() }),
  freeze_earned: z.strictObject({ freezes: z.number().int().positive() }),
  freeze_used: z.strictObject({
    freezes: z.number().int().nonnegative(),
    streak: z.number().int().nonnegative(),
  }),
  streak_reset: z.strictObject({}),
  streak_repair_offered: z.strictObject({}),
  streak_repaired: z.strictObject({ streak: z.number().int().positive() }),
  /** SPEC-005 §7 (T-062): XP, niveles, semanas y logros; solo códigos y números. */
  xp_awarded: z.strictObject({
    event: z.enum(XP_EVENT_TYPES),
    amount: z.number().int().positive(),
  }),
  level_up: z.strictObject({ level: z.number().int().min(2) }),
  week_closed: z.strictObject({
    fulfilled: z.boolean(),
    sessions: z.number().int().nonnegative(),
    commitment: z.number().int().nonnegative(),
  }),
  achievement_unlocked: z.strictObject({ code: z.string().regex(/^[A-Z][A-Z0-9_]{1,31}$/) }),
  /** SPEC-005 §7 (T-063): metas de las 3 misiones y misión cumplida. */
  quest_generated: z.strictObject({
    training: z.number().int().positive(),
    nutrition: z.number().int().positive(),
    consistency: z.number().int().positive(),
  }),
  quest_completed: z.strictObject({ kind: z.enum(['TRAINING', 'NUTRITION', 'CONSISTENCY']) }),
  /** SPEC-007 §7 (T-070): propósito, plantilla y motivo; nunca el texto enviado. */
  message_scheduled: z.strictObject({ purpose: z.enum(MESSAGE_PURPOSES) }),
  message_suppressed: z.strictObject({ purpose: z.enum(MESSAGE_PURPOSES), reason: tokenSchema }),
  message_sent: z.strictObject({ purpose: z.enum(MESSAGE_PURPOSES), templateId: templateIdSchema }),
  /** T-072 (RN-MSJ-007, M03): minutos desde el envío hasta el toque. */
  message_actioned: z.strictObject({
    purpose: z.enum(MESSAGE_PURPOSES),
    templateId: templateIdSchema,
    minutes: z.number().int().nonnegative(),
  }),
  message_ignored: z.strictObject({
    purpose: z.enum(MESSAGE_PURPOSES),
    templateId: templateIdSchema,
  }),
  backoff_applied: z.strictObject({ days: z.number().int().positive() }),
  inactivity_pause_started: z.strictObject({ inactiveDays: z.number().int().nonnegative() }),
  reactivation_sent: z.strictObject({ count: z.number().int().positive() }),
  /** T-082 (HU-006-4 a 6). */
  goal_completed: z.strictObject({
    type: z.enum([
      'gain_muscle',
      'lose_fat',
      'gain_strength',
      'recomposition',
      'consistency',
      'maintain',
    ]),
  }),
  goal_partially_completed: z.strictObject({
    /** null si no había datos de peso (RN-OBJ-012). */
    progressPct: z.number().int().min(0).max(100).nullable(),
  }),
  maintenance_entered: z.strictObject({ source: z.enum(['choice', 'timeout']) }),
  maintenance_band_exited: z.strictObject({}),
  phase_reviewed: z.strictObject({ withinLimits: z.boolean() }),
  /** T-080 (HU-006-1): si salió con la imagen del muro. */
  weekly_summary_sent: z.strictObject({ withImage: z.boolean() }),
  /** T-081 (HU-006-2, HU-006-3): vistas, sin datos. */
  progress_viewed: z.strictObject({}),
  achievement_log_viewed: z.strictObject({}),
  /** T-073 (RN-MSJ-013, RN-MSJ-014, HU-007-4). */
  pause_set: z.strictObject({ days: z.number().int().positive() }),
  message_settings_changed: z.strictObject({
    field: z.enum(['intensity', 'quiet_hours', 'purpose']),
  }),
  bot_blocked: z.strictObject({}),
  /** SPEC-009 (T-065, RN-SEG-008): qué disparó la señal de sobreuso. */
  overuse_signal: z.strictObject({ reason: z.enum(['sessions_per_day', 'rest_days']) }),
} satisfies Partial<Record<EventName, z.ZodType>>;

/** Propiedades comunes (plan de medición §1). */
const commonSchema = z.strictObject({
  localDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  appVersion: tokenSchema,
  phase: z.enum(STUDY_PHASES),
});

export const analyticsEventSchema = z.strictObject({
  /** Seudónimo: el id interno del usuario, nunca el de Telegram. */
  userRef: z
    .string()
    .regex(/^[a-f0-9]{24}$/)
    .nullable(),
  name: z.enum(EVENT_NAMES as readonly [EventName, ...EventName[]]),
  at: z.date(),
  common: commonSchema,
  props: genericPropsSchema,
});

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

/** Valida un evento completo; devuelve los motivos sin repetir los valores recibidos. */
export function validateEvent(
  event: unknown,
): { ok: true; event: AnalyticsEvent } | { ok: false; problems: string[] } {
  const parsed = analyticsEventSchema.safeParse(event);
  if (!parsed.success) return { ok: false, problems: describe(parsed.error) };
  const specific = (EVENT_PROPS_SCHEMAS as Partial<Record<EventName, z.ZodType>>)[parsed.data.name];
  if (specific) {
    const props = specific.safeParse(parsed.data.props);
    if (!props.success) return { ok: false, problems: describe(props.error, 'props') };
  }
  return { ok: true, event: parsed.data };
}

function describe(error: z.ZodError, prefix?: string): string[] {
  return error.issues.map((issue) => {
    const path = [prefix, ...issue.path.map(String)].filter(Boolean).join('.');
    return `${path || '(raíz)'}: ${issue.message}`;
  });
}
