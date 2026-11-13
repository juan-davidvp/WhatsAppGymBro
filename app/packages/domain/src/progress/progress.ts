import { PARAMETERS } from '../config/parameters.js';
import { weekStartOf } from '../gamification/weekly.js';
import { addDays, type LocalDate } from '../time/zoned.js';
import { estimated1RM, type MovementPattern } from '../training/training.js';

/**
 * Progreso (SPEC-006, T-081): lo que `/progreso` calcula a partir de lo
 * registrado. Puro: recibe las series y devuelve qué mostrar.
 */

/** Patrones de fuerza que muestra `/progreso` (decisión del PO, 2026-11-11). */
export type StrengthGroup = 'SQUAT' | 'HINGE' | 'PUSH' | 'PULL';

export const STRENGTH_GROUPS: readonly StrengthGroup[] = ['SQUAT', 'HINGE', 'PUSH', 'PULL'];

const GROUP_OF: Readonly<Partial<Record<MovementPattern, StrengthGroup>>> = {
  SQUAT: 'SQUAT',
  HINGE: 'HINGE',
  PUSH_H: 'PUSH',
  PUSH_V: 'PUSH',
  PULL_H: 'PULL',
  PULL_V: 'PULL',
};

export interface ExerciseLog {
  readonly code: string;
  readonly pattern: MovementPattern;
  readonly sets: readonly { readonly loadKg: number; readonly reps: number }[];
}

export interface StrengthHighlight {
  readonly group: StrengthGroup;
  readonly code: string;
  readonly e1rmKg: number;
}

/**
 * HU-006-2 · RN-ENT-005: por cada patrón (sentadilla, bisagra, empuje y tirón),
 * el ejercicio con más series y su mejor 1RM estimado. Solo cuentan las series
 * con un 1RM estimado (con carga y pocas repeticiones); un patrón sin ellas no sale.
 */
export function strengthHighlights(logs: readonly ExerciseLog[]): StrengthHighlight[] {
  return STRENGTH_GROUPS.flatMap((group) => {
    const candidates = logs
      .filter((log) => GROUP_OF[log.pattern] === group)
      .map((log) => {
        const e1rms = log.sets
          .map((s) => estimated1RM(s.loadKg, s.reps))
          .filter((v): v is number => v !== null);
        return { code: log.code, sets: e1rms.length, best: Math.max(...e1rms) };
      })
      .filter((c) => c.sets > 0)
      .sort((a, b) => b.sets - a.sets || b.best - a.best);
    const top = candidates[0];
    return top ? [{ group, code: top.code, e1rmKg: top.best }] : [];
  });
}

/**
 * HU-006-2 (decisión del PO, 2026-11-11): el peso se registra con botones desde
 * el último, sumando o restando los pasos de P-100; se redondea al paso menor.
 */
export function stepWeight(kg: number, deltaKg: number): number {
  const unit = Math.min(...PARAMETERS.progress.weightStepsKg);
  const decimals = Math.max(0, -Math.floor(Math.log10(unit)));
  return Number((Math.round((kg + deltaKg) / unit) * unit).toFixed(decimals));
}

/** Estado de un día en el muro de constancia (HU-006-1). */
export type WallCell = 'complete' | 'counted' | 'none' | 'future';

const WEEK_LENGTH = 7;

/**
 * HU-006-1 (decisión del PO, 2026-11-11): muro de las últimas P-102 semanas, de
 * la más vieja a la actual, cada una de lunes a domingo. Un día es completo, cuenta
 * o no; los días después de `today` todavía no pasaron. Solo días y estados, sin
 * datos sensibles (FR-006-01).
 */
export function wallGrid(
  history: readonly {
    readonly date: LocalDate;
    readonly counted: boolean;
    readonly complete: boolean;
  }[],
  today: LocalDate,
  weeks: number = PARAMETERS.progress.wallWeeks,
): WallCell[][] {
  const byDate = new Map(history.map((d) => [d.date, d]));
  const firstMonday = addDays(weekStartOf(today), -WEEK_LENGTH * (weeks - 1));
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: WEEK_LENGTH }, (_, d): WallCell => {
      const date = addDays(firstMonday, w * WEEK_LENGTH + d);
      if (date > today) return 'future';
      const day = byDate.get(date);
      if (day?.complete) return 'complete';
      return day?.counted ? 'counted' : 'none';
    }),
  );
}
