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
    // HU-009-1: sin autorización, ni tamizaje de comida ni peso.
    case 'food_body_screening':
    case 'weight':
      return sensitive;
    // HU-001-2: sin peso o con un objetivo sin meta de peso, no hay meta que proponer.
    case 'goal_proposal':
      return sensitive && context.goalUsesWeight && context.weightKg !== null;
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
