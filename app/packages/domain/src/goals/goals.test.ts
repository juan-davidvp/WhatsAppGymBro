import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { PARAMETERS } from '../config/parameters.js';
import { addDays } from '../time/zoned.js';
import {
  changeGoal,
  closeAtHorizonEnd,
  goalProgress,
  isGoalAchieved,
  isPhaseReviewDue,
  progressLayers,
  proposeWeightGoal,
  reviewPhase,
  validateWeightGoal,
  weightMovingAverage,
  type Goal,
} from './goals.js';

const G = PARAMETERS.goal;
const START = '2026-10-05';

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    type: 'gain_muscle',
    metric: 'weight_kg',
    startValue: 68,
    targetValue: 71,
    startDate: START,
    horizonWeeks: G.horizonWeeksDefault,
    status: 'active',
    ...overrides,
  };
}

describe('RN-OBJ-001 · un solo objetivo activo', () => {
  it('al crear uno nuevo, el anterior deja de estar activo', () => {
    const history = changeGoal(
      [goal()],
      goal({ type: 'consistency', metric: 'fulfilled_weeks', startValue: 0, targetValue: 8 }),
    );
    expect(history.filter((g) => g.status === 'active')).toHaveLength(1);
  });

  it('propiedad: tras cualquier secuencia de cambios hay exactamente un objetivo activo', () => {
    const types = [
      'gain_muscle',
      'lose_fat',
      'gain_strength',
      'recomposition',
      'consistency',
      'maintain',
    ] as const;
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...types), { minLength: 1, maxLength: 10 }),
        (sequence) => {
          let history: readonly Goal[] = [];
          for (const type of sequence) history = changeGoal(history, goal({ type }));
          expect(history.filter((g) => g.status === 'active')).toHaveLength(1);
          expect(history).toHaveLength(sequence.length);
        },
      ),
    );
  });
});

describe('RN-OBJ-002 · todo objetivo tiene métrica, inicial, meta, inicio y horizonte', () => {
  it('rechaza un objetivo incompleto', () => {
    expect(() => changeGoal([], { ...goal(), startDate: '' })).toThrow('RN-OBJ-002');
    expect(() => changeGoal([], { ...goal(), targetValue: Number.NaN })).toThrow('RN-OBJ-002');
  });
});

describe('RN-OBJ-003 · horizonte entre P-002 y P-003 semanas, P-001 por defecto', () => {
  it('la propuesta usa el horizonte por defecto', () => {
    expect(
      proposeWeightGoal({ type: 'gain_muscle', weightKg: 68, heightM: 1.75 }).horizonWeeks,
    ).toBe(G.horizonWeeksDefault);
  });

  it('rechaza horizontes fuera del rango', () => {
    const base = { currentKg: 80, targetKg: 79, heightM: 1.8 };
    expect(validateWeightGoal({ ...base, horizonWeeks: G.horizonWeeksMin - 1 }).ok).toBe(false);
    expect(validateWeightGoal({ ...base, horizonWeeks: G.horizonWeeksMax + 1 }).ok).toBe(false);
    expect(validateWeightGoal({ ...base, horizonWeeks: G.horizonWeeksMin }).ok).toBe(true);
  });
});

describe('RN-OBJ-004 · el ritmo semanal no supera P-004 (pérdida) ni P-005 (ganancia)', () => {
  it('ganar músculo con 68 kg: la propuesta queda dentro de P-005 (HU-001)', () => {
    const proposal = proposeWeightGoal({ type: 'gain_muscle', weightKg: 68, heightM: 1.75 });
    expect(
      validateWeightGoal({
        currentKg: 68,
        targetKg: proposal.targetKg,
        horizonWeeks: proposal.horizonWeeks,
        heightM: 1.75,
      }).ok,
    ).toBe(true);
    expect(proposal.targetKg).toBeGreaterThan(68);
  });

  it('una meta demasiado rápida no se guarda y se ofrecen un horizonte mayor y la meta segura', () => {
    const result = validateWeightGoal({
      currentKg: 90,
      targetKg: 80,
      horizonWeeks: 4,
      heightM: 1.8,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reasons).toContain('rate_too_fast');
    const safeTarget = 90 * (1 - (G.maxWeeklyLossPct / 100) * 4);
    expect(result.saferTargetKg).toBeCloseTo(safeTarget, 6);
    expect(result.longerHorizonWeeks).toBeGreaterThan(4);
    // Las alternativas propuestas sí son seguras.
    expect(
      validateWeightGoal({
        currentKg: 90,
        targetKg: result.saferTargetKg,
        horizonWeeks: 4,
        heightM: 1.8,
      }).ok,
    ).toBe(true);
    if (result.longerHorizonWeeks !== null) {
      expect(
        validateWeightGoal({
          currentKg: 90,
          targetKg: 80,
          horizonWeeks: result.longerHorizonWeeks,
          heightM: 1.8,
        }).ok,
      ).toBe(true);
    }
  });

  it('si ni el horizonte máximo alcanza, no se ofrece horizonte mayor', () => {
    const result = validateWeightGoal({
      currentKg: 100,
      targetKg: 60,
      horizonWeeks: 12,
      heightM: 1.9,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.longerHorizonWeeks).toBeNull();
  });

  it('ganar peso también tiene límite (P-005)', () => {
    const tooFast = 70 * (1 + (G.maxWeeklyGainPct / 100) * 4) + 0.5;
    expect(
      validateWeightGoal({ currentKg: 70, targetKg: tooFast, horizonWeeks: 4, heightM: 1.75 }).ok,
    ).toBe(false);
  });

  it('propiedad: ninguna meta aceptada viola el ritmo ni el IMC', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 50, max: 140, noNaN: true }),
        fc.double({ min: 40, max: 160, noNaN: true }),
        fc.integer({ min: G.horizonWeeksMin, max: G.horizonWeeksMax }),
        fc.double({ min: 1.5, max: 2.05, noNaN: true }),
        (currentKg, targetKg, horizonWeeks, heightM) => {
          const result = validateWeightGoal({ currentKg, targetKg, horizonWeeks, heightM });
          if (!result.ok) return;
          const weeklyPct = (Math.abs(targetKg - currentKg) / currentKg / horizonWeeks) * 100;
          const limit = targetKg < currentKg ? G.maxWeeklyLossPct : G.maxWeeklyGainPct;
          expect(weeklyPct).toBeLessThanOrEqual(limit + 1e-9);
          if (targetKg < currentKg)
            expect(targetKg / heightM ** 2).toBeGreaterThanOrEqual(G.minTargetBmi - 1e-9);
        },
      ),
    );
  });
});

describe('RN-OBJ-005 · ninguna meta de peso implica un IMC menor que P-006', () => {
  it('rechaza la meta y propone la mínima segura', () => {
    const heightM = 1.8;
    const minSafe = G.minTargetBmi * heightM ** 2;
    const result = validateWeightGoal({
      currentKg: 62,
      targetKg: minSafe - 1,
      horizonWeeks: 24,
      heightM,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reasons).toContain('bmi_below_minimum');
    expect(result.saferTargetKg).toBeGreaterThanOrEqual(minSafe - 1e-9);
  });
});

describe('RN-OBJ-005 · caso límite', () => {
  it('si ya está bajo el IMC mínimo, la meta segura es no bajar más (nunca subir la meta propuesta)', () => {
    const result = validateWeightGoal({
      currentKg: 55,
      targetKg: 52,
      horizonWeeks: 12,
      heightM: 1.8,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.saferTargetKg).toBe(55);
  });
});

describe('RN-OBJ-006 · cumplimiento del objetivo', () => {
  it('peso: la media móvil alcanza la meta y se sostiene P-007 semanas', () => {
    const days = G.weeksToSustainTarget * 7;
    const today = addDays(START, 60);
    const sustained = Array.from({ length: days }, (_, i) => ({
      date: addDays(today, -i),
      movingAvgKg: 71.2,
    }));
    expect(isGoalAchieved(goal(), { today, dailyMovingAverages: sustained })).toBe(true);
    const short = sustained.slice(0, days - 1);
    expect(isGoalAchieved(goal(), { today, dailyMovingAverages: short })).toBe(false);
    const dip = sustained.map((d, i) => (i === 3 ? { ...d, movingAvgKg: 70.5 } : d));
    expect(isGoalAchieved(goal(), { today, dailyMovingAverages: dip })).toBe(false);
  });

  it('pérdida: la media debe quedar en la meta o por debajo', () => {
    const lose = goal({ type: 'lose_fat', startValue: 85, targetValue: 80 });
    const today = addDays(START, 80);
    const days = Array.from({ length: G.weeksToSustainTarget * 7 }, (_, i) => ({
      date: addDays(today, -i),
      movingAvgKg: 79.8,
    }));
    expect(isGoalAchieved(lose, { today, dailyMovingAverages: days })).toBe(true);
  });

  it('fuerza: una sesión válida registra el e1RM meta', () => {
    const strength = goal({
      type: 'gain_strength',
      metric: 'e1rm_kg',
      startValue: 80,
      targetValue: 100,
    });
    expect(isGoalAchieved(strength, { bestE1rmKg: 100 })).toBe(true);
    expect(isGoalAchieved(strength, { bestE1rmKg: 99.5 })).toBe(false);
  });

  it('ser constante: se alcanzan las semanas cumplidas meta', () => {
    const consistency = goal({
      type: 'consistency',
      metric: 'fulfilled_weeks',
      startValue: 0,
      targetValue: 8,
    });
    expect(isGoalAchieved(consistency, { fulfilledWeeks: 8 })).toBe(true);
    expect(isGoalAchieved(consistency, { fulfilledWeeks: 7 })).toBe(false);
  });
});

describe('RN-OBJ-007 · cambiar de objetivo cierra el actual como cambiado y conserva el historial', () => {
  it('el anterior queda "changed" con sus datos intactos', () => {
    const first = goal();
    const history = changeGoal(
      [first],
      goal({ type: 'lose_fat', startValue: 71, targetValue: 69 }),
    );
    expect(history[0]).toEqual({ ...first, status: 'changed' });
    expect(history[1]?.status).toBe('active');
  });
});

describe('RN-OBJ-008 · fin del horizonte sin la meta: completado parcial, sin lenguaje de fracaso', () => {
  it('se cierra con el % alcanzado y las opciones extender o ajustar', () => {
    const closed = closeAtHorizonEnd(goal(), 69.5);
    expect(closed.goal.status).toBe('partially_completed');
    expect(closed.progressPct).toBe(50);
    expect(closed.options).toEqual(['extend', 'adjust']);
    expect(JSON.stringify(closed).toLowerCase()).not.toMatch(/fail|fracas/);
  });
});

describe('RN-OBJ-009 · progreso en tres capas', () => {
  it('proceso diario, rendimiento semanal y resultado en cada revisión de fase', () => {
    expect(progressLayers()).toEqual({
      process: 'daily',
      performance: 'weekly',
      outcome: { everyWeeks: G.phaseReviewWeeks },
    });
  });

  it('la revisión de fase toca cada P-057 semanas desde el inicio', () => {
    expect(isPhaseReviewDue(START, addDays(START, G.phaseReviewWeeks * 7))).toBe(true);
    expect(isPhaseReviewDue(START, addDays(START, G.phaseReviewWeeks * 7 - 1))).toBe(false);
    expect(isPhaseReviewDue(START, START)).toBe(false);
  });
});

describe('RN-OBJ-010 · media móvil de P-008 días con al menos 3 registros', () => {
  const today = '2026-10-19';

  it('promedia los registros de los últimos días', () => {
    const entries = [
      { date: today, kg: 70 },
      { date: addDays(today, -2), kg: 71 },
      { date: addDays(today, -6), kg: 72 },
      { date: addDays(today, -7), kg: 90 }, // fuera de la ventana
    ];
    expect(weightMovingAverage(entries, today)).toBe(71);
  });

  it('con menos de 3 registros no hay media', () => {
    expect(
      weightMovingAverage(
        [
          { date: today, kg: 70 },
          { date: addDays(today, -1), kg: 71 },
        ],
        today,
      ),
    ).toBeNull();
  });
});

describe('RN-OBJ-011 · progreso = (actual − inicial) ÷ (meta − inicial), entre 0 y 100 %', () => {
  it('calcula y acota', () => {
    expect(goalProgress({ startValue: 68, targetValue: 71, currentValue: 69.5 })).toBe(50);
    expect(goalProgress({ startValue: 68, targetValue: 71, currentValue: 66 })).toBe(0);
    expect(goalProgress({ startValue: 85, targetValue: 80, currentValue: 78 })).toBe(100);
  });

  it('propiedad: siempre entre 0 y 100', () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true, min: -1e3, max: 1e3 }),
        fc.double({ noNaN: true, min: -1e3, max: 1e3 }),
        fc.double({ noNaN: true, min: -1e3, max: 1e3 }),
        (startValue, targetValue, currentValue) => {
          const p = goalProgress({ startValue, targetValue, currentValue });
          expect(p).toBeGreaterThanOrEqual(0);
          expect(p).toBeLessThanOrEqual(100);
        },
      ),
    );
  });
});

describe('RN-OBJ-012 · las mediciones corporales son opcionales', () => {
  it('sin registros de peso no hay media ni progreso de peso, y no falla', () => {
    expect(weightMovingAverage([], '2026-10-19')).toBeNull();
    expect(goalProgress({ startValue: 68, targetValue: 71, currentValue: null })).toBeNull();
  });

  it('un objetivo de constancia no pide medidas corporales', () => {
    expect(() =>
      changeGoal(
        [],
        goal({ type: 'consistency', metric: 'fulfilled_weeks', startValue: 0, targetValue: 8 }),
      ),
    ).not.toThrow();
  });
});

describe('RN-OBJ-013 · revisión de fase con propuestas, sin alarma', () => {
  it('si el ritmo real supera el límite, propone ajustes con opciones', () => {
    const review = reviewPhase({
      goal: goal({ type: 'lose_fat', startValue: 90, targetValue: 85 }),
      currentValue: 86,
      weeksElapsed: 4,
    });
    expect(review).toEqual({
      withinLimits: false,
      options: ['extend_horizon', 'adjust_target', 'keep'],
    });
  });

  it('dentro de los límites no propone nada', () => {
    expect(reviewPhase({ goal: goal(), currentValue: 69, weeksElapsed: 4 })).toEqual({
      withinLimits: true,
      options: [],
    });
  });
});
