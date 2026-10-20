import { PARAMETERS } from '../config/parameters.js';
import type { SessionVariant } from '../gamification/xp.js';
import type { GoalType } from '../goals/goals.js';
import {
  repRangeFor,
  type CatalogExercise,
  type PlannedExercise,
  type SessionVersionPlan,
  type WeeklyPlan,
} from '../plan/plan.js';
import type { LocalDate } from '../time/zoned.js';
import { estimated1RM, type MovementPattern } from './training.js';

/**
 * RN-ENT-003 (`[VALIDAR-PROFESIONAL]`): estrategias ante un estancamiento y su
 * efecto en el plan de la semana siguiente. Puro: el servidor guarda la estrategia
 * elegida y la aplica al generar cada semana.
 */

export type PlateauStrategy = 'variant' | 'range' | 'deload';

export interface ExerciseAdjustment {
  readonly exerciseCode: string;
  readonly strategy: PlateauStrategy;
  /** Lunes desde el que aplica (la semana siguiente a la elección). */
  readonly fromWeek: LocalDate;
  /** Ejercicio que reemplaza al estancado (`variant`). */
  readonly replacementCode: string | null;
}

/**
 * RN-ENT-003 y RN-ENT-005: mejor marca de una sesión para seguir el progreso:
 * el mayor e1RM; sin carga (o con muchas repeticiones), las repeticiones máximas.
 */
export function bestOfSession(sets: readonly { reps: number; loadKg: number }[]): number {
  const e1rms = sets.map((s) => estimated1RM(s.loadKg, s.reps) ?? 0);
  const best = Math.max(0, ...e1rms);
  return best > 0 ? best : Math.max(0, ...sets.map((s) => s.reps));
}

/** Otro ejercicio del mismo patrón y versión, que no esté en `exclude` (variante). */
export function alternativeExercise(
  pattern: MovementPattern,
  variant: SessionVariant,
  exclude: readonly string[],
  catalog: readonly CatalogExercise[],
): string | null {
  return (
    catalog.find(
      (e) => e.pattern === pattern && e.variants.includes(variant) && !exclude.includes(e.code),
    )?.code ?? null
  );
}

/** RN-ENT-003: objetivo cuyo rango se usa al alternar: fuerza ↔ músculo (P-016). */
export function alternateGoal(goal: GoalType): GoalType {
  return goal === 'gain_strength' ? 'gain_muscle' : 'gain_strength';
}

/**
 * RN-ENT-003: aplica las estrategias vigentes a una semana del plan.
 * - variante: cambia el ejercicio por su reemplazo, en todas las semanas siguientes;
 * - rango: usa el rango del otro objetivo (fuerza ↔ músculo), en todas las siguientes;
 * - descarga: P-091 series menos (mínimo 1), solo en la primera semana.
 */
export function applyAdjustments(
  plan: WeeklyPlan,
  adjustments: readonly ExerciseAdjustment[],
  goal: GoalType,
  /** Últimas cargas conocidas: el reemplazo usa la suya (o 0), no la del estancado. */
  loads: Readonly<Record<string, number>> = {},
): WeeklyPlan {
  const active = adjustments.filter((a) => a.fromWeek <= plan.weekStart);
  if (active.length === 0) return plan;
  const adjust = (exercise: PlannedExercise, variant: SessionVariant): PlannedExercise => {
    let next = exercise;
    for (const a of active.filter((x) => x.exerciseCode === exercise.exerciseCode)) {
      if (a.strategy === 'variant' && a.replacementCode) {
        next = {
          ...next,
          exerciseCode: a.replacementCode,
          loadKg: loads[a.replacementCode] ?? 0,
        };
      } else if (a.strategy === 'range') {
        const reps = repRangeFor(alternateGoal(goal), next.pattern, variant);
        next = { ...next, reps, targetReps: reps.min };
      } else if (a.strategy === 'deload' && a.fromWeek === plan.weekStart) {
        next = { ...next, sets: Math.max(1, next.sets - PARAMETERS.training.deloadSetReduction) };
      }
    }
    return next;
  };
  const version = (plan: SessionVersionPlan): SessionVersionPlan => ({
    ...plan,
    exercises: plan.exercises.map((e) => adjust(e, plan.variant)),
  });
  return {
    ...plan,
    days: plan.days.map((day) =>
      day.session
        ? {
            ...day,
            session: {
              ...day.session,
              versions: {
                GYM: version(day.session.versions.GYM),
                HOME: version(day.session.versions.HOME),
                EXPRESS: version(day.session.versions.EXPRESS),
              },
            },
          }
        : day,
    ),
  };
}
