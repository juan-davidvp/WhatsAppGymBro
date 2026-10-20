import { PARAMETERS } from '../config/parameters.js';
import { proposeWeightGoal, validateWeightGoal, type GoalType } from '../goals/goals.js';
import type { ExperienceLevel } from '../plan/plan.js';

/**
 * Onboarding (SPEC-001, flujos-de-usuario F1): orden de los pasos y qué paso
 * sigue según lo que la persona ya respondió. Puro: el servidor guarda el paso y
 * las respuestas; aquí solo se decide.
 */

/** Pasos en el orden de F1. `privacy` muestra la bienvenida y el aviso (ON-01, ON-02). */
export const ONBOARDING_STEPS = [
  'privacy',
  'age',
  'goal',
  'level',
  'days',
  'time',
  'place',
  'minutes',
  'equipment',
  'pre_activity_screening',
  'food_body_screening',
  'weight',
  'height',
  'goal_proposal',
  'message_intensity',
  'quiet_hours',
  'summary',
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** Categorías de datos con autorización propia (modelo de datos, `consents`). */
export const CONSENT_CATEGORIES = [
  'health_data',
  'body_measurements',
  'screening',
  'ai_processing',
  'analytics',
] as const;
export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];

export type TrainingPlace = 'gym' | 'home' | 'both';

/** Lo que el flujo necesita saber para elegir el siguiente paso. */
export interface OnboardingContext {
  /** null = aún no respondió el aviso de privacidad. */
  readonly consentGiven: boolean | null;
  readonly place: TrainingPlace | null;
  /** El tipo de objetivo usa una meta de peso (perder grasa, ganar músculo…). */
  readonly goalUsesWeight: boolean;
  readonly weightKg: number | null;
  /** RN-OBJ-005: sin estatura no se puede comprobar el IMC de una meta de peso. */
  readonly heightCm: number | null;
  /** RN-SEG-003: en modo sin números no se pide peso ni se propone meta de peso. */
  readonly numberFreeMode: boolean;
}

/**
 * RN-DAT-001: autorización explícita, granular y voluntaria. Aceptar el aviso
 * (ON-02, que nombra cada uso) autoriza las categorías que el aviso describe; no
 * aceptar no autoriza ninguna y el bot se usa sin datos sensibles (HU-009-1).
 */
export function consentDecision(accepted: boolean): {
  granted: readonly ConsentCategory[];
  declined: readonly ConsentCategory[];
} {
  return accepted
    ? { granted: CONSENT_CATEGORIES, declined: [] }
    : { granted: [], declined: CONSENT_CATEGORIES };
}

/** RN-DAT-001: solo se pide un dato sensible de una categoría autorizada. */
export function mayAskFor(category: ConsentCategory, granted: readonly ConsentCategory[]): boolean {
  return granted.includes(category);
}

/** ¿Se hace este paso con lo que se sabe? Los que no aplican se saltan. */
export function stepApplies(step: OnboardingStep, context: OnboardingContext): boolean {
  const sensitive = context.consentGiven === true;
  switch (step) {
    // HU-009-1: sin autorización el objetivo es `consistency` (ser constante), sin preguntar.
    case 'goal':
      return context.consentGiven !== false;
    // Equipamiento de casa: solo si entrena en casa (versión B, RN-PLAN-003).
    case 'equipment':
      return context.place === 'home' || context.place === 'both';
    // HU-009-1: sin autorización no hay tamizaje de comida.
    case 'food_body_screening':
      return sensitive;
    // HU-009-1 y RN-SEG-003: peso solo con autorización y fuera del modo sin números.
    case 'weight':
      return sensitive && !context.numberFreeMode;
    // RN-OBJ-005: la estatura solo hace falta para validar una meta de peso.
    case 'height':
      return (
        sensitive && !context.numberFreeMode && context.goalUsesWeight && context.weightKg !== null
      );
    // HU-001-2: sin peso, sin estatura o con un objetivo sin meta de peso, no hay meta que proponer.
    case 'goal_proposal':
      return (
        sensitive &&
        !context.numberFreeMode &&
        context.goalUsesWeight &&
        context.weightKg !== null &&
        context.heightCm !== null
      );
    default:
      return true;
  }
}

/** Paso siguiente a `current`, saltando los que no aplican; null = terminado. */
export function nextOnboardingStep(
  current: OnboardingStep,
  context: OnboardingContext,
): OnboardingStep | null {
  const index = ONBOARDING_STEPS.indexOf(current);
  return ONBOARDING_STEPS.slice(index + 1).find((step) => stepApplies(step, context)) ?? null;
}

// ── Respuestas del onboarding (T-032) ───────────────────────────────────────

/** HU-001-2: objetivos con meta de peso en el onboarding. */
export function goalUsesWeight(type: GoalType | null): boolean {
  return type === 'lose_fat' || type === 'gain_muscle';
}

export type TrainingExperience = 'never' | 'under_6_months' | 'six_months_plus';

/** RN-PLAN-004 (flujos F1): nunca o menos de 6 meses = novato; más = intermedio. */
export function experienceLevelFor(answer: TrainingExperience): ExperienceLevel {
  return answer === 'six_months_plus' ? 'intermediate' : 'novice';
}

/** SPEC-001 §8: un peso fuera de P-087 o una estatura fuera de P-085 se confirman. */
export function isPlausibleWeightKg(kg: number): boolean {
  const { min, max } = PARAMETERS.goal.plausibleWeightKg;
  return kg >= min && kg <= max;
}

export function isPlausibleHeightCm(cm: number): boolean {
  const { min, max } = PARAMETERS.goal.plausibleHeightCm;
  return cm >= min && cm <= max;
}

/** ON-06 y ON-07 muestran la meta con una cifra decimal (plantillas de mensajes §3). */
const GOAL_DECIMALS = 1;

/** Redondea hacia el peso actual: así el redondeo nunca acelera el ritmo ni baja el IMC. */
function roundTowardCurrent(targetKg: number, currentKg: number): number {
  const factor = 10 ** GOAL_DECIMALS;
  return targetKg < currentKg
    ? Math.ceil(targetKg * factor - 1e-9) / factor
    : Math.floor(targetKg * factor + 1e-9) / factor;
}

export interface WeightGoalOffer {
  readonly targetKg: number;
  readonly horizonWeeks: number;
}

/**
 * HU-001-2 (RN-OBJ-003 a RN-OBJ-005): meta propuesta y sus dos variantes.
 * - propuesta: la de `proposeWeightGoal` (P-001 al ritmo por defecto P-088 o P-089);
 * - más conservadora: la misma meta en el horizonte máximo P-003 (ritmo menor);
 * - más ambiciosa: la misma meta en el horizonte mínimo P-002, que se valida; si
 *   no es segura, se ofrecen la meta segura en ese horizonte o la misma meta en
 *   un horizonte mayor (ON-07). Nunca se ofrece una meta insegura.
 */
export function weightGoalOffers(input: {
  readonly type: 'lose_fat' | 'gain_muscle';
  readonly weightKg: number;
  readonly heightCm: number;
}): {
  proposal: WeightGoalOffer;
  conservative: WeightGoalOffer;
  ambitious: { safe: WeightGoalOffer } | { saferTarget: WeightGoalOffer; longer: WeightGoalOffer };
} {
  const heightM = input.heightCm / 100;
  const raw = proposeWeightGoal({ type: input.type, weightKg: input.weightKg, heightM });
  const proposal = { ...raw, targetKg: roundTowardCurrent(raw.targetKg, input.weightKg) };
  const conservative = {
    targetKg: proposal.targetKg,
    horizonWeeks: PARAMETERS.goal.horizonWeeksMax,
  };
  const fast = { targetKg: proposal.targetKg, horizonWeeks: PARAMETERS.goal.horizonWeeksMin };
  const check = validateWeightGoal({ currentKg: input.weightKg, heightM, ...fast });
  if (check.ok) return { proposal, conservative, ambitious: { safe: fast } };
  return {
    proposal,
    conservative,
    ambitious: {
      saferTarget: {
        targetKg: roundTowardCurrent(check.saferTargetKg, input.weightKg),
        horizonWeeks: fast.horizonWeeks,
      },
      longer: {
        targetKg: proposal.targetKg,
        horizonWeeks: check.longerHorizonWeeks ?? proposal.horizonWeeks,
      },
    },
  };
}

/** RN-OBJ-004 y RN-OBJ-005: una meta elegida en el onboarding se guarda solo si es segura. */
export function isSafeWeightGoal(input: {
  readonly weightKg: number;
  readonly heightCm: number;
  readonly targetKg: number;
  readonly horizonWeeks: number;
}): boolean {
  return validateWeightGoal({
    currentKg: input.weightKg,
    targetKg: input.targetKg,
    horizonWeeks: input.horizonWeeks,
    heightM: input.heightCm / 100,
  }).ok;
}
