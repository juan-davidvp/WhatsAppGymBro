import { alertCategorySchema } from '@gymbro/content';
import { CONSENT_CATEGORIES, ONBOARDING_STEPS, WEEK_DAYS } from '@gymbro/domain';
import { z } from 'zod';
import { EVENT_NAMES, STUDY_PHASES, type EventName } from './catalog.js';

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
  session_variant_chosen: z.strictObject({ variant: z.enum(['GYM', 'HOME', 'EXPRESS']) }),
  session_started: z.strictObject({ variant: z.enum(['GYM', 'HOME', 'EXPRESS']) }),
  cant_today_selected: z.strictObject({ option: z.enum(['express', 'move', 'rest']) }),
  session_rescheduled: z.strictObject({}),
  onboarding_completed: z.strictObject({
    durationMs: z.number().int().nonnegative(),
    taps: z.number().int().nonnegative(),
  }),
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
