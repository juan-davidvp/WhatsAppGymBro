import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  CONSENT_CATEGORIES,
  ONBOARDING_STEPS,
  consentDecision,
  mayAskFor,
  nextOnboardingStep,
  type OnboardingContext,
  type OnboardingStep,
} from './onboarding.js';

const ACCEPTED: OnboardingContext = {
  consentGiven: true,
  place: 'gym',
  goalUsesWeight: true,
  weightKg: 72,
};

/** Recorre el flujo completo desde `privacy`. */
function walk(context: OnboardingContext): OnboardingStep[] {
  const steps: OnboardingStep[] = ['privacy'];
  let step: OnboardingStep | null = 'privacy';
  while ((step = nextOnboardingStep(step, context))) steps.push(step);
  return steps;
}

describe('RN-DAT-001 · autorización explícita y granular', () => {
  it('aceptar el aviso autoriza cada categoría que el aviso nombra', () => {
    expect(consentDecision(true)).toEqual({ granted: CONSENT_CATEGORIES, declined: [] });
  });
  it('no aceptar no autoriza ninguna y lo deja registrado por categoría', () => {
    expect(consentDecision(false)).toEqual({ granted: [], declined: CONSENT_CATEGORIES });
  });
  it('un dato sensible solo se pide con su categoría autorizada', () => {
    expect(mayAskFor('body_measurements', consentDecision(true).granted)).toBe(true);
    expect(mayAskFor('body_measurements', consentDecision(false).granted)).toBe(false);
  });
});

describe('HU-009-1 · T-030 · orden del onboarding', () => {
  it('con autorización, en gym y con peso: todos los pasos salvo el equipamiento de casa', () => {
    expect(walk(ACCEPTED)).toEqual(ONBOARDING_STEPS.filter((s) => s !== 'equipment'));
  });

  it('privacidad primero y edad justo después (RN-SEG-001 antes de crear el perfil)', () => {
    expect(walk(ACCEPTED).slice(0, 2)).toEqual(['privacy', 'age']);
  });

  it('sin autorización: sin objetivo (queda ser constante), sin tamizaje de comida, sin peso ni meta', () => {
    const steps = walk({ ...ACCEPTED, consentGiven: false });
    for (const skipped of ['goal', 'food_body_screening', 'weight', 'goal_proposal'] as const) {
      expect(steps).not.toContain(skipped);
    }
    // El tamizaje previo a la actividad es una medida de seguridad y se mantiene (RN-SEG-002).
    expect(steps).toContain('pre_activity_screening');
  });

  it('equipamiento solo si entrena en casa o en ambos', () => {
    expect(walk({ ...ACCEPTED, place: 'home' })).toContain('equipment');
    expect(walk({ ...ACCEPTED, place: 'both' })).toContain('equipment');
  });

  it('sin peso o con un objetivo sin meta de peso no se propone meta', () => {
    expect(walk({ ...ACCEPTED, weightKg: null })).not.toContain('goal_proposal');
    expect(walk({ ...ACCEPTED, goalUsesWeight: false })).not.toContain('goal_proposal');
  });

  it('propiedad: el flujo avanza siempre hacia adelante y termina en el resumen', () => {
    const context = fc.record({
      consentGiven: fc.constantFrom(true, false, null),
      place: fc.constantFrom('gym' as const, 'home' as const, 'both' as const, null),
      goalUsesWeight: fc.boolean(),
      weightKg: fc.option(fc.integer({ min: 35, max: 250 }), { nil: null }),
    });
    fc.assert(
      fc.property(context, (ctx) => {
        const steps = walk(ctx);
        const indexes = steps.map((s) => ONBOARDING_STEPS.indexOf(s));
        expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
        expect(new Set(steps).size).toBe(steps.length);
        expect(steps.at(-1)).toBe('summary');
      }),
    );
  });
});
