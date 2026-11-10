import { z } from 'zod';

/**
 * Esquemas del contenido versionado (T-003). Cada catálogo se valida al cargarse:
 * un catálogo mal transcrito rompe el arranque y las pruebas, no el bot en producción.
 * Nombres según `vault/output/sdd/glosario.md`.
 */

// ── Mensajes ────────────────────────────────────────────────────────────────

/** RN-MSJ-001: catálogo cerrado de propósitos (valores tal como se guardan en la base). */
export const MESSAGE_PURPOSES = [
  'plan_listo',
  'recordatorio_contextual',
  'cierre_del_dia',
  'reconocimiento',
  'resumen_semanal',
  'regreso',
  'mantenimiento',
] as const;
export const messagePurposeSchema = z.enum(MESSAGE_PURPOSES);
export type MessagePurpose = z.infer<typeof messagePurposeSchema>;

/** Sección de `plantillas-de-mensajes.md` a la que pertenece la plantilla. */
export const templateKindSchema = z.enum(['proactive', 'response', 'onboarding', 'care']);
export type TemplateKind = z.infer<typeof templateKindSchema>;

const templateBase = {
  /** `PL-01`, `SE-02`, `CU-07`… */
  id: z.string().regex(/^[A-Z]{2}-\d{2}$/),
  /** Texto tal como está en la bóveda; variables entre `{llaves}`. */
  text: z.string().min(1),
  /** Botones de 1 toque, en orden. */
  buttons: z.array(z.string().min(1)),
  /** Condición o disparador de la bóveda (columna "Condición", "Disparador", "Momento" o "Categoría"). */
  when: z.string().min(1).optional(),
};

export const messageTemplateSchema = z.discriminatedUnion('kind', [
  z.object({ ...templateBase, kind: z.literal('proactive'), purpose: messagePurposeSchema }),
  z.object({ ...templateBase, kind: z.enum(['response', 'onboarding', 'care']) }),
]);
export type MessageTemplate = z.infer<typeof messageTemplateSchema>;

// ── Niveles y logros ────────────────────────────────────────────────────────

export const levelSchema = z.object({
  number: z.number().int().min(1),
  code: z.string().regex(/^L\d+$/),
  name: z.string().min(1),
  /** XP acumulado para entrar al nivel; debe coincidir con P-040. */
  xpThreshold: z.number().int().min(0),
});
export type Level = z.infer<typeof levelSchema>;

export const achievementSchema = z.object({
  code: z.string().regex(/^[A-Z0-9_]+$/),
  name: z.string().min(1),
  condition: z.string().min(1),
  /** Qué se guarda en la bitácora junto al logro (RN-GAM-011). */
  storedData: z.string().min(1),
});
export type Achievement = z.infer<typeof achievementSchema>;

// ── Ejercicios ──────────────────────────────────────────────────────────────

export const MOVEMENT_PATTERNS = [
  'SQUAT',
  'HINGE',
  'PUSH_H',
  'PUSH_V',
  'PULL_H',
  'PULL_V',
  'SINGLE_LEG',
  'CORE',
  'ARMS',
] as const;
export const movementPatternSchema = z.enum(MOVEMENT_PATTERNS);
export type MovementPattern = z.infer<typeof movementPatternSchema>;

/** Versión A (gym) · B (casa) · C (exprés): `SessionVariant` del glosario. */
export const SESSION_VARIANTS = ['GYM', 'HOME', 'EXPRESS'] as const;
export const sessionVariantSchema = z.enum(SESSION_VARIANTS);
export type SessionVariant = z.infer<typeof sessionVariantSchema>;

export const exerciseSchema = z.object({
  code: z.string().regex(/^[A-Z0-9_]+$/),
  name: z.string().min(1),
  pattern: movementPatternSchema,
  variants: z.array(sessionVariantSchema).min(1),
  equipment: z.string().min(1),
  level: z.enum(['novice', 'intermediate']),
  safetyNote: z.string().min(1).nullable(),
});
export type Exercise = z.infer<typeof exerciseSchema>;

/**
 * Patrones sin ejercicio en la versión exprés, tal como los documenta el catálogo
 * (§3 "Equivalencias por patrón"). `compensatedBy`: patrón que lo cubre, o null.
 */
export const expressExceptionSchema = z.object({
  pattern: movementPatternSchema,
  compensatedBy: movementPatternSchema.nullable(),
});
export type ExpressException = z.infer<typeof expressExceptionSchema>;

// ── Alimentos ───────────────────────────────────────────────────────────────

/** Porciones con la mano (RN-NUT-001): `HandPortion` del glosario. */
export const HAND_PORTIONS = ['PALM', 'CUPPED_HAND', 'FIST', 'THUMB'] as const;
export const handPortionSchema = z.enum(HAND_PORTIONS);
export type HandPortion = z.infer<typeof handPortionSchema>;

const range = z
  .object({ min: z.number().min(0), max: z.number().min(0) })
  .refine((r) => r.min <= r.max, 'min debe ser ≤ max');
const amount = z.union([z.number().positive(), range]);
export type Amount = z.infer<typeof amount>;

/** Equivalencia en manos: solo las porciones presentes. */
export const handEquivalenceSchema = z.partialRecord(handPortionSchema, amount);
export type HandEquivalence = z.infer<typeof handEquivalenceSchema>;

export const foodSchema = z.object({
  code: z.string().regex(/^[A-Z0-9_]+$/),
  name: z.string().min(1),
  /** RN-NUT-008: porción de referencia. */
  referencePortion: z.string().min(1),
  handEquivalence: handEquivalenceSchema,
  /** RN-NUT-008: proteína aproximada en g por porción de referencia. */
  proteinG: z.number().min(0),
  /** Fuentes de proteína (§1) cuentan para la meta; el resto (§2), no. */
  countsForProtein: z.boolean(),
  /** `[supuesto]`: solo en fuentes de proteína. */
  relativeCost: z.enum(['$', '$$']).nullable(),
});
export type Food = z.infer<typeof foodSchema>;

export const frequentMealTemplateSchema = z.object({
  code: z.string().regex(/^[A-Z0-9_]+$/),
  name: z.string().min(1),
  /** Texto del botón y nombre de la frecuente que se guarda desde la plantilla (T-051). */
  shortName: z.string().min(1),
  portions: handEquivalenceSchema,
  proteinG: range,
});
export type FrequentMealTemplate = z.infer<typeof frequentMealTemplateSchema>;

// ── Expresiones de alerta (RN-SEG-007) ──────────────────────────────────────

/** En orden de prioridad: si coinciden varias, gana la primera (expresiones-de-alerta.md §2). */
export const ALERT_CATEGORIES = [
  'distress',
  'cardiac_warning',
  'purge',
  'extreme_restriction',
  'substances',
  'pain',
] as const;
export const alertCategorySchema = z.enum(ALERT_CATEGORIES);
export type AlertCategory = z.infer<typeof alertCategorySchema>;

export const alertCategoryEntrySchema = z.object({
  category: alertCategorySchema,
  /** Respuesta de cuidado `CU-…` de esa categoría. */
  careResponseId: z.string().regex(/^CU-\d{2}$/),
  /** Expresiones que disparan la categoría; `{n}` = cifra de calorías ≤ P-071. */
  expressions: z.array(z.string().min(1)).min(1),
  /** Texto de `{recurso_local}` para su plantilla, o null si la plantilla no lo usa. */
  helpResource: z.string().min(1).nullable(),
});
export type AlertCategoryEntry = z.infer<typeof alertCategoryEntrySchema>;
