import { describe, expect, it } from 'vitest';
import { PARAMETERS } from '../config/parameters.js';
import type { CatalogExercise, PlannedExercise, WeeklyPlan } from '../plan/plan.js';
import {
  alternativeExercise,
  applyAdjustments,
  bestOfSession,
  type ExerciseAdjustment,
} from './exercise-adjustments.js';

const squat: PlannedExercise = {
  exerciseCode: 'BACK_SQUAT',
  pattern: 'SQUAT',
  sets: 3,
  reps: { min: 6, max: 15 },
  targetReps: 6,
  loadKg: 60,
  restSeconds: 90,
};

function planFor(weekStart: string): WeeklyPlan {
  const version = (variant: 'GYM' | 'HOME' | 'EXPRESS') => ({
    variant,
    exercises: [squat],
    estimatedMinutes: 30,
  });
  return {
    weekStart,
    nextRotationStart: 1,
    intensity: 'normal',
    days: [
      {
        date: weekStart,
        type: 'TRAINING',
        session: {
          template: 'FULL_A',
          versions: { GYM: version('GYM'), HOME: version('HOME'), EXPRESS: version('EXPRESS') },
        },
      },
    ],
  };
}

const adjustment = (strategy: ExerciseAdjustment['strategy'], fromWeek = '2026-10-26') => ({
  exerciseCode: 'BACK_SQUAT',
  strategy,
  fromWeek,
  replacementCode: strategy === 'variant' ? 'LEG_PRESS' : null,
});

const gym = (plan: WeeklyPlan) => plan.days[0]?.session?.versions.GYM.exercises[0];

describe('RN-ENT-003 · estrategias ante un estancamiento', () => {
  it('variante: cambia el ejercicio desde la semana siguiente, y sigue después', () => {
    expect(
      gym(applyAdjustments(planFor('2026-10-19'), [adjustment('variant')], 'gain_muscle'))
        ?.exerciseCode,
    ).toBe('BACK_SQUAT');
    expect(
      gym(applyAdjustments(planFor('2026-10-26'), [adjustment('variant')], 'gain_muscle'))
        ?.exerciseCode,
    ).toBe('LEG_PRESS');
    expect(
      gym(applyAdjustments(planFor('2026-11-02'), [adjustment('variant')], 'gain_muscle'))
        ?.exerciseCode,
    ).toBe('LEG_PRESS');
  });

  it('variante: el reemplazo usa su propia última carga, no la del ejercicio estancado', () => {
    const plan = applyAdjustments(planFor('2026-10-26'), [adjustment('variant')], 'gain_muscle', {
      LEG_PRESS: 120,
    });
    expect(gym(plan)?.loadKg).toBe(120);
    expect(
      gym(applyAdjustments(planFor('2026-10-26'), [adjustment('variant')], 'gain_muscle'))?.loadKg,
    ).toBe(0);
  });

  it('rango: alterna entre fuerza y músculo de P-016', () => {
    const toStrength = gym(
      applyAdjustments(planFor('2026-10-26'), [adjustment('range')], 'gain_muscle'),
    );
    expect(toStrength?.reps).toEqual(PARAMETERS.plan.repRangesByGoal.strength.compound);
    expect(toStrength?.targetReps).toBe(PARAMETERS.plan.repRangesByGoal.strength.compound.min);
    const toMuscle = gym(
      applyAdjustments(planFor('2026-10-26'), [adjustment('range')], 'gain_strength'),
    );
    expect(toMuscle?.reps).toEqual(PARAMETERS.plan.repRangesByGoal.muscleFatLossRecomposition);
  });

  it('descarga: P-091 series menos solo la semana siguiente, nunca menos de 1', () => {
    const next = gym(
      applyAdjustments(planFor('2026-10-26'), [adjustment('deload')], 'gain_muscle'),
    );
    expect(next?.sets).toBe(squat.sets - PARAMETERS.training.deloadSetReduction);
    const after = gym(
      applyAdjustments(planFor('2026-11-02'), [adjustment('deload')], 'gain_muscle'),
    );
    expect(after?.sets).toBe(squat.sets);
  });

  it('el estancamiento no toca otros ejercicios', () => {
    const other = { ...adjustment('variant'), exerciseCode: 'OTRO' };
    expect(gym(applyAdjustments(planFor('2026-10-26'), [other], 'gain_muscle'))).toEqual(squat);
  });
});

describe('RN-ENT-003 · RN-ENT-005 · mejor marca de una sesión', () => {
  it('con carga, el mayor e1RM; sin carga, las repeticiones máximas', () => {
    expect(
      bestOfSession([
        { reps: 5, loadKg: 100 },
        { reps: 8, loadKg: 80 },
      ]),
    ).toBeCloseTo(100 * (1 + 5 / 30));
    expect(
      bestOfSession([
        { reps: 15, loadKg: 0 },
        { reps: 12, loadKg: 0 },
      ]),
    ).toBe(15);
  });
});

describe('RN-ENT-003 · RN-SEG-006 · variante del mismo patrón y versión', () => {
  const catalog: CatalogExercise[] = [
    {
      code: 'BACK_SQUAT',
      pattern: 'SQUAT',
      variants: ['GYM'],
      equipment: 'Barra, rack',
      level: 'novice',
    },
    {
      code: 'LEG_PRESS',
      pattern: 'SQUAT',
      variants: ['GYM'],
      equipment: 'Máquina',
      level: 'novice',
    },
    {
      code: 'AIR_SQUAT',
      pattern: 'SQUAT',
      variants: ['HOME', 'EXPRESS'],
      equipment: 'Ninguno',
      level: 'novice',
    },
  ] as CatalogExercise[];
  it('elige otro ejercicio del patrón en esa versión, o null si no hay', () => {
    expect(alternativeExercise('SQUAT', 'GYM', ['BACK_SQUAT'], catalog)).toBe('LEG_PRESS');
    expect(alternativeExercise('SQUAT', 'HOME', ['AIR_SQUAT'], catalog)).toBeNull();
  });
});
