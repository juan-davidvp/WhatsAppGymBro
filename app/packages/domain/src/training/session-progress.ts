import { PARAMETERS } from '../config/parameters.js';
import { BODY_REGION_BY_PATTERN, type MovementPattern } from './training.js';

/**
 * Avance de una sesión en la tarjeta (SPEC-003 HU-003-1): qué serie toca, con
 * qué repeticiones y carga, y qué se registró. Puro: el servidor guarda el estado
 * y ejecuta los efectos (RN-ENT-001: confirmar la serie precargada = 1 toque).
 */

export interface SessionExercise {
  readonly exerciseCode: string;
  readonly pattern: MovementPattern;
  readonly sets: number;
  readonly targetReps: number;
  readonly loadKg: number;
}

export interface LoggedEntry {
  readonly exerciseIndex: number;
  readonly setIndex: number;
  readonly exerciseCode: string;
  readonly reps: number;
  readonly loadKg: number;
  /** RN-ENT-001: true si se cambió lo precargado. */
  readonly edited: boolean;
}

export interface SessionProgress {
  readonly exercises: readonly SessionExercise[];
  /** Serie que toca; null cuando no quedan series. */
  readonly cursor: { readonly exercise: number; readonly set: number } | null;
  /** Valores de la serie que toca, con los ajustes del usuario. */
  readonly pending: { readonly reps: number; readonly loadKg: number };
  readonly logged: readonly LoggedEntry[];
}

/** Siguiente posición después de (exercise, set); null si no quedan series. */
function nextCursor(
  exercises: readonly SessionExercise[],
  exercise: number,
  set: number,
): { exercise: number; set: number } | null {
  if (set + 1 < (exercises[exercise]?.sets ?? 0)) return { exercise, set: set + 1 };
  for (let e = exercise + 1; e < exercises.length; e++) {
    if ((exercises[e]?.sets ?? 0) > 0) return { exercise: e, set: 0 };
  }
  return null;
}

function plannedValues(exercises: readonly SessionExercise[], exercise: number) {
  const current = exercises[exercise];
  return { reps: current?.targetReps ?? 0, loadKg: current?.loadKg ?? 0 };
}

export function startProgress(exercises: readonly SessionExercise[]): SessionProgress {
  const first = exercises.findIndex((e) => e.sets > 0);
  return {
    exercises,
    cursor: first >= 0 ? { exercise: first, set: 0 } : null,
    pending: plannedValues(exercises, Math.max(first, 0)),
    logged: [],
  };
}

/** RN-ENT-002: paso de carga en la tarjeta = incremento de su región (P-020 o P-021). */
export function loadStepFor(pattern: MovementPattern): number {
  return BODY_REGION_BY_PATTERN[pattern] === 'lower'
    ? PARAMETERS.training.lowerBodyIncrementKg
    : PARAMETERS.training.upperBodyIncrementKg;
}

/** HU-003-1: [−1 rep] [+1 rep] [−kg] [+kg]; nunca por debajo de 0. */
export function adjustPending(
  progress: SessionProgress,
  change: { readonly reps?: -1 | 1; readonly load?: -1 | 1 },
): SessionProgress {
  const exercise = progress.cursor ? progress.exercises[progress.cursor.exercise] : undefined;
  if (!exercise) return progress;
  const reps = Math.max(0, progress.pending.reps + (change.reps ?? 0));
  const step = loadStepFor(exercise.pattern);
  const loadKg = Math.max(0, progress.pending.loadKg + (change.load ?? 0) * step);
  return { ...progress, pending: { reps, loadKg } };
}

/**
 * RN-ENT-001: confirma la serie que toca con los valores pendientes. La carga
 * ajustada se mantiene para las series siguientes del mismo ejercicio.
 */
export function confirmCurrent(progress: SessionProgress): {
  progress: SessionProgress;
  entry: LoggedEntry | null;
} {
  const { cursor } = progress;
  const exercise = cursor ? progress.exercises[cursor.exercise] : undefined;
  if (!cursor || !exercise) return { progress, entry: null };
  const planned = plannedValues(progress.exercises, cursor.exercise);
  const entry: LoggedEntry = {
    exerciseIndex: cursor.exercise,
    setIndex: cursor.set,
    exerciseCode: exercise.exerciseCode,
    reps: progress.pending.reps,
    loadKg: progress.pending.loadKg,
    edited: progress.pending.reps !== planned.reps || progress.pending.loadKg !== planned.loadKg,
  };
  const next = nextCursor(progress.exercises, cursor.exercise, cursor.set);
  const sameExercise = next?.exercise === cursor.exercise;
  const pending = next
    ? sameExercise
      ? { reps: planned.reps, loadKg: progress.pending.loadKg }
      : plannedValues(progress.exercises, next.exercise)
    : progress.pending;
  return {
    progress: { ...progress, cursor: next, pending, logged: [...progress.logged, entry] },
    entry,
  };
}

/** HU-003-1: [⏭️ Siguiente ejercicio] salta las series que quedan del actual. */
export function skipExercise(progress: SessionProgress): SessionProgress {
  const { cursor } = progress;
  if (!cursor) return progress;
  const lastSet = (progress.exercises[cursor.exercise]?.sets ?? 1) - 1;
  const next = nextCursor(progress.exercises, cursor.exercise, lastSet);
  return {
    ...progress,
    cursor: next,
    pending: next ? plannedValues(progress.exercises, next.exercise) : progress.pending,
  };
}

/** FR-003-04: deshace la última serie y vuelve a ella con sus valores. */
export function undoLast(progress: SessionProgress): {
  progress: SessionProgress;
  removed: LoggedEntry | null;
} {
  const removed = progress.logged.at(-1);
  if (!removed) return { progress, removed: null };
  return {
    progress: {
      ...progress,
      cursor: { exercise: removed.exerciseIndex, set: removed.setIndex },
      pending: { reps: removed.reps, loadKg: removed.loadKg },
      logged: progress.logged.slice(0, -1),
    },
    removed,
  };
}

export function plannedSetCount(progress: SessionProgress): number {
  return progress.exercises.reduce((sum, e) => sum + e.sets, 0);
}
