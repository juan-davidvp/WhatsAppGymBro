import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { PARAMETERS } from '../config/parameters.js';
import {
  adjustPortion,
  confirmProposal,
  dailyProteinGoal,
  hasPortions,
  palmsFromProtein,
  rotatingPick,
  DEFAULT_MEAL_METHOD,
  isCalorieCountingEnabled,
  isNutritionHalfMet,
  logFavoriteMeal,
  proteinFromCatalogFood,
  proteinFromPortions,
  proteinFocus,
  proteinTarget,
  repeatYesterday,
  type HandPortion,
  type Meal,
  type Portions,
  type PortionProposal,
} from './nutrition.js';

const N = PARAMETERS.nutrition;

describe('RN-NUT-001 · el registro por defecto son las porciones con la mano', () => {
  it('el método por defecto es "portions" con palma, mano ahuecada, puño y pulgar', () => {
    expect(DEFAULT_MEAL_METHOD).toBe('portions');
  });

  it('la proteína de las porciones sale de las palmas (P-027 g por palma)', () => {
    expect(proteinFromPortions({ PALM: 2, CUPPED_HAND: 3, FIST: 1, THUMB: 1 })).toBe(
      2 * N.proteinGPerPalm,
    );
    expect(proteinFromPortions({ CUPPED_HAND: 2 })).toBe(0);
  });

  it('rechaza porciones negativas', () => {
    expect(() => proteinFromPortions({ PALM: -1 })).toThrow('RN-NUT-001');
  });
});

describe('RN-NUT-002 · meta de proteína = peso × P-026, en palmas de P-027 redondeadas a 0,5', () => {
  it('80 kg → 128 g → 5 palmas', () => {
    const target = proteinTarget(80);
    expect(target.grams).toBeCloseTo(80 * N.proteinGPerKg, 9);
    expect(target.palms).toBe(Math.round(((80 * N.proteinGPerKg) / N.proteinGPerPalm) * 2) / 2);
  });

  it('propiedad: las palmas siempre son múltiplo de 0,5 y están a ≤ 0,25 del valor exacto', () => {
    fc.assert(
      fc.property(fc.double({ min: 40, max: 160, noNaN: true }), (weight) => {
        const { grams, palms } = proteinTarget(weight);
        expect((palms * 2) % 1).toBe(0);
        expect(Math.abs(palms - grams / N.proteinGPerPalm)).toBeLessThanOrEqual(0.25 + 1e-9);
      }),
    );
  });
});

describe('RN-NUT-003 · mitad de comida', () => {
  it(`se cumple con al menos P-028 (${N.halfThresholdPct} %) de la meta`, () => {
    const targetG = 100;
    expect(
      isNutritionHalfMet({
        mode: 'numbers',
        proteinG: (targetG * N.halfThresholdPct) / 100,
        targetG,
      }),
    ).toBe(true);
    expect(
      isNutritionHalfMet({
        mode: 'numbers',
        proteinG: (targetG * N.halfThresholdPct) / 100 - 1,
        targetG,
      }),
    ).toBe(false);
  });

  it(`en modo sin números: P-072 (${N.numberFreeMealsWithProtein}) comidas con al menos una palma`, () => {
    const meal = (palms: number) => ({ PALM: palms });
    const enough = Array.from({ length: N.numberFreeMealsWithProtein }, () => meal(1));
    expect(isNutritionHalfMet({ mode: 'number_free', meals: enough })).toBe(true);
    expect(isNutritionHalfMet({ mode: 'number_free', meals: [...enough.slice(1), meal(0)] })).toBe(
      false,
    );
  });
});

describe('RN-NUT-004 · comidas frecuentes en 1 toque y "repetir ayer"', () => {
  const favorite = {
    id: 'fav-1',
    name: 'Corrientazo',
    portions: { PALM: 1, CUPPED_HAND: 2, FIST: 1, THUMB: 1 },
  };

  it('una frecuente se registra con una sola operación', () => {
    const meal = logFavoriteMeal(favorite, '2026-10-19');
    expect(meal).toEqual({
      date: '2026-10-19',
      method: 'favorite',
      favoriteMealId: 'fav-1',
      portions: favorite.portions,
      proteinG: N.proteinGPerPalm,
    });
  });

  it('"repetir ayer" propone las comidas de ayer para confirmar, sin registrarlas', () => {
    const yesterday: Meal[] = [logFavoriteMeal(favorite, '2026-10-18')];
    const proposals = repeatYesterday(yesterday);
    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({
      source: 'repeat',
      portions: favorite.portions,
      confirmed: false,
    });
  });
});

describe('RN-NUT-005 · las propuestas de la IA nunca se registran sin confirmación', () => {
  const proposal: PortionProposal = {
    source: 'photo',
    portions: { PALM: 1, CUPPED_HAND: 1 },
    confidence: 0.8,
    confirmed: false,
  };

  it('sin confirmación no se convierte en comida', () => {
    expect(() => confirmProposal(proposal, { date: '2026-10-19', confirmedByUser: false })).toThrow(
      'RN-NUT-005',
    );
  });

  it('confirmada se registra, con los ajustes del usuario si los hay', () => {
    expect(
      confirmProposal(proposal, {
        date: '2026-10-19',
        confirmedByUser: true,
        adjustedPortions: { PALM: 2 },
      }),
    ).toEqual({
      date: '2026-10-19',
      method: 'photo',
      portions: { PALM: 2 },
      proteinG: 2 * N.proteinGPerPalm,
    });
  });
});

describe('RN-NUT-006 · sugerencias según el tipo de día, priorizando la proteína total', () => {
  it('la prioridad es lo que falta de proteína del día, en cualquier horario', () => {
    expect(proteinFocus({ dayType: 'TRAINING', consumedG: 60, targetG: 128 })).toEqual({
      priority: 'daily_protein_total',
      remainingG: 68,
      context: 'training_day',
    });
    expect(proteinFocus({ dayType: 'REST', consumedG: 140, targetG: 128 })).toEqual({
      priority: 'daily_protein_total',
      remainingG: 0,
      context: 'rest_day',
    });
  });
});

describe('RN-NUT-007 · sin conteo de calorías en la Fase 0', () => {
  it('está desactivado siempre: no depende de lo que pida el usuario ni de una señal de riesgo', () => {
    expect(isCalorieCountingEnabled()).toBe(false);
    expect(isCalorieCountingEnabled.length).toBe(0);
  });

  it('ninguna comida registrada lleva calorías', () => {
    const meal = logFavoriteMeal({ id: 'x', name: 'x', portions: { PALM: 1 } }, '2026-10-19');
    expect(JSON.stringify(meal).toLowerCase()).not.toMatch(/calor|kcal/);
  });
});

describe('RN-NUT-008 · equivalencias del catálogo de alimentos', () => {
  it('la proteína de un alimento del catálogo sale de su proteína aproximada por porción', () => {
    expect(proteinFromCatalogFood({ proteinG: 6 }, 3)).toBe(18);
  });
});

describe('RN-NUT-002 · SPEC-004 §8 · meta del día con o sin peso', () => {
  it('con peso usa P-026; sin peso, P-092 palmas de P-027 g', () => {
    expect(dailyProteinGoal(80)).toEqual(proteinTarget(80));
    expect(dailyProteinGoal(null)).toEqual({
      grams: N.defaultProteinPalms * N.proteinGPerPalm,
      palms: N.defaultProteinPalms,
    });
  });

  it('la proteína en palmas se redondea hacia abajo a la media palma', () => {
    expect(palmsFromProtein(N.proteinGPerPalm * 3.3)).toBe(3);
    expect(palmsFromProtein(N.proteinGPerPalm * 3.5)).toBe(3.5);
    expect(palmsFromProtein(0)).toBe(0);
  });
});

describe('RN-NUT-001 · teclado de porciones', () => {
  it('la palma cambia de P-093 en P-093 y las demás de 1 en 1', () => {
    const once = adjustPortion({}, 'PALM', 1);
    expect(once.PALM).toBe(N.palmStep);
    expect(adjustPortion(once, 'FIST', 1).FIST).toBe(1);
  });

  it('ninguna porción baja de 0', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(
            fc.constantFrom('PALM', 'CUPPED_HAND', 'FIST', 'THUMB') as fc.Arbitrary<HandPortion>,
            fc.constantFrom(1, -1) as fc.Arbitrary<1 | -1>,
          ),
        ),
        (taps) => {
          const result = taps.reduce<Portions>((p, [hand, d]) => adjustPortion(p, hand, d), {});
          return Object.values(result).every((v) => v >= 0);
        },
      ),
    );
  });

  it('una comida sin porciones no se guarda', () => {
    expect(hasPortions({})).toBe(false);
    expect(hasPortions({ PALM: 0, FIST: 0 })).toBe(false);
    expect(hasPortions({ THUMB: 1 })).toBe(true);
  });
});

describe('RN-NUT-006 · sugerencias que rotan cada día', () => {
  it('P-095 elementos distintos, empezando en un lugar distinto cada día', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    expect(rotatingPick(items, 0)).toHaveLength(N.suggestedFoods);
    expect(new Set(rotatingPick(items, 3)).size).toBe(N.suggestedFoods);
    expect(rotatingPick(items, 1)[0]).toBe('b');
    expect(rotatingPick(items, 6)).toEqual(rotatingPick(items, 1));
    expect(rotatingPick([], 2)).toEqual([]);
  });
});
