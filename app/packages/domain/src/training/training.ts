import { PARAMETERS } from '../config/parameters.js';
import type { SessionVariant } from '../gamification/xp.js';

/** Registro de entrenamiento: series, progresión, estancamiento, sesión completada y récords (RN-ENT-001 a 006). */

/** `MovementPattern` del catálogo de ejercicios (packages/content lo comprueba). */
export type MovementPattern =
  'SQUAT' | 'HINGE' | 'PUSH_H' | 'PUSH_V' | 'PULL_H' | 'PULL_V' | 'SINGLE_LEG' | 'CORE' | 'ARMS';

/** RN-ENT-002: región corporal de cada patrón (decide P-020 o P-021). */
export const BODY_REGION_BY_PATTERN: Readonly<Record<MovementPattern, 'upper' | 'lower'>> = {
  SQUAT: 'lower',
  HINGE: 'lower',
  SINGLE_LEG: 'lower',
  PUSH_H: 'upper',
  PUSH_V: 'upper',
  PULL_H: 'upper',
  PULL_V: 'upper',
  ARMS: 'upper',
  CORE: 'upper',
};

export interface PlannedSet {
  readonly exerciseCode: string;
  readonly setIndex: number;
  readonly reps: number;
  readonly loadKg: number;
}

/** `SetEntry` del glosario. */
export interface LoggedSet extends PlannedSet {
  readonly edited: boolean;
}

/** RN-ENT-001: confirmar la serie precargada la registra tal cual (1 toque). */
export function confirmSet(planned: PlannedSet): LoggedSet {
  return { ...planned, edited: false };
}

/** RN-ENT-001: corregir modifica solo los valores cambiados. */
export function correctSet(
  planned: PlannedSet,
  changes: { readonly reps?: number; readonly loadKg?: number },
): LoggedSet {
  return {
    ...planned,
    ...(changes.reps !== undefined ? { reps: changes.reps } : {}),
    ...(changes.loadKg !== undefined ? { loadKg: changes.loadKg } : {}),
    edited: true,
  };
}

/** RN-ENT-001: `logSessionAsPlanned` — "La hice tal cual" registra todas las series en 1 toque. */
export function logSessionAsPlanned(sets: readonly PlannedSet[]): LoggedSet[] {
  return sets.map(confirmSet);
}

export type ProgressionSuggestion =
  | { readonly type: 'keep' }
  | { readonly type: 'increase_load'; readonly loadKg: number }
  | { readonly type: 'harder_variant_or_more_reps' };

/**
 * RN-ENT-002 (`[VALIDAR-PROFESIONAL]`): progresión doble. Si en las últimas P-019
 * sesiones todas las series llegaron al tope del rango, el gym sube P-020 (tren
 * superior) o P-021 (tren inferior); en casa o exprés, variante más difícil o más
 * repeticiones. RN-ENT-006: solo cuentan sesiones registradas, no actividades importadas.
 */
export function suggestProgression(input: {
  readonly recentSessions: readonly (readonly LoggedSet[])[];
  readonly repRange: { readonly min: number; readonly max: number };
  readonly pattern: MovementPattern;
  readonly variant: SessionVariant;
  readonly currentLoadKg: number;
}): ProgressionSuggestion {
  const needed = PARAMETERS.training.sessionsAtTopToProgress;
  const last = input.recentSessions.slice(-needed);
  const allAtTop =
    last.length === needed &&
    last.every((sets) => sets.length > 0 && sets.every((set) => set.reps >= input.repRange.max));
  if (!allAtTop) return { type: 'keep' };
  if (input.variant !== 'GYM') return { type: 'harder_variant_or_more_reps' };
  const increment =
    BODY_REGION_BY_PATTERN[input.pattern] === 'lower'
      ? PARAMETERS.training.lowerBodyIncrementKg
      : PARAMETERS.training.upperBodyIncrementKg;
  return { type: 'increase_load', loadKg: input.currentLoadKg + increment };
}

export type PlateauOption = 'change_rep_range' | 'change_variant' | 'deload_week';

/**
 * RN-ENT-003: `bestBySession` es la mejor marca de cada sesión del ejercicio
 * (e1RM, o repeticiones si es peso corporal), en orden. Si las últimas P-022 no
 * superan el máximo anterior, devuelve las estrategias (botones de ES-01). No toca
 * XP ni racha.
 */
export function plateauStrategy(bestBySession: readonly number[]): PlateauOption[] | null {
  const n = PARAMETERS.training.plateauSessions;
  if (bestBySession.length <= n) return null;
  const before = Math.max(...bestBySession.slice(0, -n));
  const recent = Math.max(...bestBySession.slice(-n));
  return recent > before ? null : ['change_rep_range', 'change_variant', 'deload_week'];
}

/**
 * RN-ENT-004: completada con al menos P-023 de las series de su versión; la
 * versión C (exprés) debe completarse entera.
 */
export function isSessionCompleted(session: {
  readonly variant: SessionVariant;
  readonly plannedSets: number;
  readonly loggedSets: number;
}): boolean {
  if (session.plannedSets <= 0) return false;
  if (session.variant === 'EXPRESS') return session.loggedSets >= session.plannedSets;
  return session.loggedSets / session.plannedSets >= PARAMETERS.training.minSetFractionCompleted;
}

/**
 * RN-ENT-005: 1RM estimado de Epley, peso × (1 + repeticiones ÷ 30), solo con
 * ≤ P-024 repeticiones y con carga; si no, null.
 */
export function estimated1RM(loadKg: number, reps: number): number | null {
  if (loadKg <= 0 || reps <= 0 || reps > PARAMETERS.training.e1rmMaxReps) return null;
  return loadKg * (1 + reps / 30);
}

/**
 * RN-ENT-005: récord si el e1RM supera el máximo previo del ejercicio, o si con el
 * mismo peso (o peso corporal, carga 0) se superan las repeticiones previas.
 * Sin historial no hay récord: no hay máximo previo que superar.
 */
export function detectPersonalRecord(
  set: { readonly reps: number; readonly loadKg: number },
  history: readonly { readonly reps: number; readonly loadKg: number }[],
): { kind: 'e1rm' | 'reps' } | null {
  if (history.length === 0) return null;
  const e1rm = estimated1RM(set.loadKg, set.reps);
  const previousE1rm = Math.max(0, ...history.map((h) => estimated1RM(h.loadKg, h.reps) ?? 0));
  if (e1rm !== null && previousE1rm > 0 && e1rm > previousE1rm) return { kind: 'e1rm' };
  const sameLoad = history.filter((h) => h.loadKg === set.loadKg);
  if (sameLoad.length > 0 && set.reps > Math.max(...sameLoad.map((h) => h.reps))) {
    return { kind: 'reps' };
  }
  return null;
}

/** RN-ENT-006: una actividad importada cuenta si dura al menos P-025 minutos. */
export function isImportedActivityValid(minutes: number): boolean {
  return minutes >= PARAMETERS.training.importedActivityMinMinutes;
}
