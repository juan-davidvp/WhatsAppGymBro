import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { PARAMETERS } from '../config/parameters.js';
import { validateWeightGoal } from '../goals/goals.js';
import {
  CONSENT_CATEGORIES,
  ONBOARDING_STEPS,
  consentDecision,
  experienceLevelFor,
  goalUsesWeight,
  isPlausibleHeightCm,
  isPlausibleWeightKg,
  isSafeWeightGoal,
  weightGoalOffers,
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
  heightCm: 175,
  numberFreeMode: false,
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
  it('con autorización, en gym, con peso y estatura: todos los pasos salvo el equipamiento de casa', () => {
    expect(walk(ACCEPTED)).toEqual(ONBOARDING_STEPS.filter((s) => s !== 'equipment'));
  });

  it('privacidad primero y edad justo después (RN-SEG-001 antes de crear el perfil)', () => {
    expect(walk(ACCEPTED).slice(0, 2)).toEqual(['privacy', 'age']);
  });

  it('sin autorización: sin objetivo (queda ser constante), sin tamizaje de comida, sin peso ni meta', () => {
    const steps = walk({ ...ACCEPTED, consentGiven: false });
    for (const skipped of [
      'goal',
      'food_body_screening',
      'weight',
      'height',
      'goal_proposal',
    ] as const) {
      expect(steps).not.toContain(skipped);
    }
    // El tamizaje previo a la actividad es una medida de seguridad y se mantiene (RN-SEG-002).
    expect(steps).toContain('pre_activity_screening');
  });

  it('equipamiento solo si entrena en casa o en ambos', () => {
    expect(walk({ ...ACCEPTED, place: 'home' })).toContain('equipment');
    expect(walk({ ...ACCEPTED, place: 'both' })).toContain('equipment');
  });

  it('sin peso, sin estatura o con un objetivo sin meta de peso no se propone meta', () => {
    expect(walk({ ...ACCEPTED, weightKg: null })).not.toContain('goal_proposal');
    expect(walk({ ...ACCEPTED, heightCm: null })).not.toContain('goal_proposal');
    expect(walk({ ...ACCEPTED, goalUsesWeight: false })).not.toContain('goal_proposal');
  });

  it('la estatura solo se pide si hay meta de peso y peso (RN-OBJ-005)', () => {
    expect(walk({ ...ACCEPTED, goalUsesWeight: false })).not.toContain('height');
    expect(walk({ ...ACCEPTED, weightKg: null })).not.toContain('height');
    expect(walk(ACCEPTED)).toContain('height');
  });

  it('RN-SEG-003 · modo sin números: sin peso, estatura ni meta', () => {
    const steps = walk({ ...ACCEPTED, numberFreeMode: true });
    for (const skipped of ['weight', 'height', 'goal_proposal'] as const) {
      expect(steps).not.toContain(skipped);
    }
  });

  it('propiedad: el flujo avanza siempre hacia adelante y termina en el resumen', () => {
    const context = fc.record({
      consentGiven: fc.constantFrom(true, false, null),
      place: fc.constantFrom('gym' as const, 'home' as const, 'both' as const, null),
      goalUsesWeight: fc.boolean(),
      weightKg: fc.option(fc.integer({ min: 35, max: 250 }), { nil: null }),
      heightCm: fc.option(fc.integer({ min: 140, max: 220 }), { nil: null }),
      numberFreeMode: fc.boolean(),
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

describe('RN-PLAN-004 · T-032 · nivel según el tiempo entrenando', () => {
  it('nunca o menos de 6 meses = novato; 6 meses o más = intermedio', () => {
    expect(experienceLevelFor('never')).toBe('novice');
    expect(experienceLevelFor('under_6_months')).toBe('novice');
    expect(experienceLevelFor('six_months_plus')).toBe('intermediate');
  });
});

describe('HU-001-2 · T-032 · objetivos con meta de peso', () => {
  it('solo perder grasa y ganar músculo', () => {
    expect(goalUsesWeight('lose_fat')).toBe(true);
    expect(goalUsesWeight('gain_muscle')).toBe(true);
    for (const type of ['gain_strength', 'recomposition', 'consistency', 'maintain'] as const) {
      expect(goalUsesWeight(type)).toBe(false);
    }
  });
});

describe('SPEC-001 §8 · peso y estatura plausibles (P-087, P-085)', () => {
  it('fuera del rango se pide confirmar', () => {
    const w = PARAMETERS.goal.plausibleWeightKg;
    const h = PARAMETERS.goal.plausibleHeightCm;
    expect(isPlausibleWeightKg(w.min)).toBe(true);
    expect(isPlausibleWeightKg(w.min - 1)).toBe(false);
    expect(isPlausibleWeightKg(w.max + 1)).toBe(false);
    expect(isPlausibleHeightCm(h.max)).toBe(true);
    expect(isPlausibleHeightCm(h.min - 1)).toBe(false);
  });
});

describe('RN-OBJ-004 · RN-OBJ-005 · T-032 · ofertas de meta del onboarding', () => {
  it('propiedad: toda meta que se ofrece es segura, también después del redondeo', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('lose_fat' as const, 'gain_muscle' as const),
        fc.integer({ min: 450, max: 1500 }).map((n) => n / 10),
        fc.integer({ min: 150, max: 210 }),
        (type, weightKg, heightCm) => {
          const offers = weightGoalOffers({ type, weightKg, heightCm });
          const all = [
            offers.proposal,
            offers.conservative,
            ...('safe' in offers.ambitious
              ? [offers.ambitious.safe]
              : [offers.ambitious.saferTarget, offers.ambitious.longer]),
          ];
          for (const offer of all) {
            expect(isSafeWeightGoal({ weightKg, heightCm, ...offer })).toBe(true);
            expect(Math.round(offer.targetKg * 10)).toBeCloseTo(offer.targetKg * 10, 6);
          }
        },
      ),
    );
  });

  it('la conservadora es la misma meta con más semanas; la ambiciosa insegura ofrece dos salidas', () => {
    const offers = weightGoalOffers({ type: 'lose_fat', weightKg: 90, heightCm: 180 });
    expect(offers.conservative.targetKg).toBe(offers.proposal.targetKg);
    expect(offers.conservative.horizonWeeks).toBe(PARAMETERS.goal.horizonWeeksMax);
    expect('saferTarget' in offers.ambitious).toBe(true);
  });

  it('una meta fabricada fuera de los límites no es segura', () => {
    expect(isSafeWeightGoal({ weightKg: 90, heightCm: 180, targetKg: 70, horizonWeeks: 4 })).toBe(
      false,
    );
    expect(
      validateWeightGoal({ currentKg: 90, targetKg: 70, horizonWeeks: 4, heightM: 1.8 }).ok,
    ).toBe(false);
  });
});
