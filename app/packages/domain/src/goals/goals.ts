import { PARAMETERS } from '../config/parameters.js';
import { addDays, daysBetween, type LocalDate } from '../time/zoned.js';

/** Objetivos: metas seguras, media móvil, progreso, cumplimiento y cierres (RN-OBJ-001 a 013). */

/** `GoalType` del glosario. */
export type GoalType =
  'gain_muscle' | 'lose_fat' | 'gain_strength' | 'recomposition' | 'consistency' | 'maintain';

export type GoalMetric = 'weight_kg' | 'e1rm_kg' | 'fulfilled_weeks' | 'waist_cm';

/** RN-OBJ-007 y RN-OBJ-008: `cambiado` y `completado_parcial` en la bóveda. */
export type GoalStatus = 'active' | 'completed' | 'partially_completed' | 'changed';

/** RN-OBJ-002: métrica principal, valor inicial, meta, fecha de inicio y horizonte. */
export interface Goal {
  readonly type: GoalType;
  readonly metric: GoalMetric;
  readonly startValue: number;
  readonly targetValue: number;
  readonly startDate: LocalDate;
  readonly horizonWeeks: number;
  readonly status: GoalStatus;
}

const EPSILON = 1e-9;

function assertComplete(goal: Goal): void {
  const complete =
    goal.startDate !== '' &&
    Number.isFinite(goal.startValue) &&
    Number.isFinite(goal.targetValue) &&
    Number.isInteger(goal.horizonWeeks) &&
    goal.horizonWeeks > 0;
  if (!complete) throw new Error('RN-OBJ-002: objetivo incompleto');
}

/**
 * RN-OBJ-001 y RN-OBJ-007: el nuevo objetivo queda activo y el activo anterior se
 * cierra como `changed`; el historial completo se conserva.
 */
export function changeGoal(history: readonly Goal[], next: Goal): readonly Goal[] {
  assertComplete(next);
  const closed = history.map((g) =>
    g.status === 'active' ? { ...g, status: 'changed' as const } : g,
  );
  return [...closed, { ...next, status: 'active' }];
}

// ── Metas de peso seguras ───────────────────────────────────────────────────

export interface WeightGoalRequest {
  readonly currentKg: number;
  readonly targetKg: number;
  readonly horizonWeeks: number;
  readonly heightM: number;
}

export type WeightGoalCheck =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reasons: readonly ('horizon_out_of_range' | 'rate_too_fast' | 'bmi_below_minimum')[];
      /** Meta segura más cercana con el mismo horizonte (RN-OBJ-004/005). */
      readonly saferTargetKg: number;
      /** Horizonte que haría segura la meta pedida, o null si ni P-003 alcanza. */
      readonly longerHorizonWeeks: number | null;
    };

function maxWeeklyFraction(losing: boolean): number {
  return (losing ? PARAMETERS.goal.maxWeeklyLossPct : PARAMETERS.goal.maxWeeklyGainPct) / 100;
}

function minSafeWeightKg(heightM: number): number {
  return PARAMETERS.goal.minTargetBmi * heightM ** 2;
}

function clampHorizon(weeks: number): number {
  return Math.min(
    PARAMETERS.goal.horizonWeeksMax,
    Math.max(PARAMETERS.goal.horizonWeeksMin, weeks),
  );
}

/**
 * RN-OBJ-003, RN-OBJ-004 y RN-OBJ-005: valida una meta de peso. Si no es segura,
 * no se guarda y se devuelven alternativas: la meta segura máxima con el mismo
 * horizonte y, si existe, un horizonte mayor dentro de P-003.
 */
export function validateWeightGoal(request: WeightGoalRequest): WeightGoalCheck {
  const { currentKg, targetKg, horizonWeeks, heightM } = request;
  const losing = targetKg < currentKg;
  const fraction = maxWeeklyFraction(losing);
  const reasons: ('horizon_out_of_range' | 'rate_too_fast' | 'bmi_below_minimum')[] = [];

  if (
    horizonWeeks < PARAMETERS.goal.horizonWeeksMin ||
    horizonWeeks > PARAMETERS.goal.horizonWeeksMax
  ) {
    reasons.push('horizon_out_of_range');
  }
  const weeklyFraction = Math.abs(targetKg - currentKg) / currentKg / horizonWeeks;
  if (weeklyFraction > fraction + EPSILON) reasons.push('rate_too_fast');
  const minSafe = minSafeWeightKg(heightM);
  if (losing && targetKg < minSafe - EPSILON) reasons.push('bmi_below_minimum');

  if (reasons.length === 0) return { ok: true };

  const horizon = clampHorizon(horizonWeeks);
  const maxChange = currentKg * fraction * horizon;
  const saferTargetKg = losing
    ? Math.min(currentKg, Math.max(currentKg - maxChange, minSafe, targetKg))
    : Math.min(currentKg + maxChange, targetKg);
  const neededWeeks = Math.ceil(Math.abs(targetKg - currentKg) / (currentKg * fraction) - EPSILON);
  const longerHorizonWeeks =
    !reasons.includes('bmi_below_minimum') &&
    neededWeeks > horizonWeeks &&
    neededWeeks <= PARAMETERS.goal.horizonWeeksMax
      ? Math.max(neededWeeks, PARAMETERS.goal.horizonWeeksMin)
      : null;
  return { ok: false, reasons, saferTargetKg, longerHorizonWeeks };
}

/**
 * RN-OBJ-003 y RN-OBJ-004: meta de peso propuesta para ganar músculo o perder grasa,
 * en el horizonte por defecto P-001 y al ritmo máximo seguro (el usuario puede
 * pedir una más conservadora). Para perder, nunca por debajo del IMC P-006.
 */
export function proposeWeightGoal(input: {
  readonly type: 'gain_muscle' | 'lose_fat';
  readonly weightKg: number;
  readonly heightM: number;
}): { targetKg: number; horizonWeeks: number } {
  const horizonWeeks = PARAMETERS.goal.horizonWeeksDefault;
  const losing = input.type === 'lose_fat';
  const change = input.weightKg * maxWeeklyFraction(losing) * horizonWeeks;
  const targetKg = losing
    ? Math.max(input.weightKg - change, Math.min(input.weightKg, minSafeWeightKg(input.heightM)))
    : input.weightKg + change;
  return { targetKg, horizonWeeks };
}

// ── Peso, progreso y cumplimiento ───────────────────────────────────────────

/**
 * RN-OBJ-010: media de los pesos registrados en los últimos P-008 días (incluido
 * `date`), con al menos el mínimo de registros; si no, null (RN-OBJ-012).
 */
export function weightMovingAverage(
  entries: readonly { readonly date: LocalDate; readonly kg: number }[],
  date: LocalDate,
): number | null {
  const { days, minEntries } = PARAMETERS.goal.movingAverageDays;
  const from = addDays(date, -(days - 1));
  const window = entries.filter((e) => e.date >= from && e.date <= date);
  if (window.length < minEntries) return null;
  return window.reduce((sum, e) => sum + e.kg, 0) / window.length;
}

/** RN-OBJ-011: (actual − inicial) ÷ (meta − inicial), acotado a 0–100 %; null sin dato. */
export function goalProgress(values: {
  readonly startValue: number;
  readonly targetValue: number;
  readonly currentValue: number | null;
}): number | null {
  const { startValue, targetValue, currentValue } = values;
  if (currentValue === null) return null;
  const span = targetValue - startValue;
  if (span === 0) return currentValue === targetValue ? 100 : 0;
  const ratio = ((currentValue - startValue) / span) * 100;
  return Math.min(100, Math.max(0, Number.isFinite(ratio) ? ratio : 0));
}

export interface AchievementEvidence {
  readonly today?: LocalDate;
  /** Media móvil diaria (RN-OBJ-010) de los días recientes. */
  readonly dailyMovingAverages?: readonly {
    readonly date: LocalDate;
    readonly movingAvgKg: number;
  }[];
  readonly bestE1rmKg?: number;
  readonly fulfilledWeeks?: number;
}

/**
 * RN-OBJ-006: peso — la media móvil alcanza la meta y se sostiene P-007 semanas
 * (todos los días de la ventana con media en la meta o más allá); fuerza — una
 * sesión válida con el e1RM meta; constancia — semanas cumplidas meta.
 */
export function isGoalAchieved(goal: Goal, evidence: AchievementEvidence): boolean {
  const reached = (value: number) =>
    goal.targetValue >= goal.startValue ? value >= goal.targetValue : value <= goal.targetValue;

  switch (goal.metric) {
    case 'weight_kg': {
      const { today, dailyMovingAverages } = evidence;
      if (!today || !dailyMovingAverages) return false;
      const days = PARAMETERS.goal.weeksToSustainTarget * 7;
      const byDate = new Map(dailyMovingAverages.map((d) => [d.date, d.movingAvgKg]));
      return Array.from({ length: days }, (_, i) => byDate.get(addDays(today, -i))).every(
        (value) => value !== undefined && reached(value),
      );
    }
    case 'e1rm_kg':
      return evidence.bestE1rmKg !== undefined && reached(evidence.bestE1rmKg);
    case 'fulfilled_weeks':
      return evidence.fulfilledWeeks !== undefined && reached(evidence.fulfilledWeeks);
    case 'waist_cm':
      return false;
  }
}

/**
 * RN-OBJ-008: al terminar el horizonte sin la meta, el objetivo queda como
 * completado parcial con el % alcanzado y se ofrece extender o ajustar.
 */
export function closeAtHorizonEnd(
  goal: Goal,
  currentValue: number | null,
): { goal: Goal; progressPct: number | null; options: readonly ['extend', 'adjust'] } {
  return {
    goal: { ...goal, status: 'partially_completed' },
    progressPct: goalProgress({ ...goal, currentValue }),
    options: ['extend', 'adjust'],
  };
}

/** RN-OBJ-009: capas de progreso. */
export function progressLayers() {
  return {
    process: 'daily',
    performance: 'weekly',
    outcome: { everyWeeks: PARAMETERS.goal.phaseReviewWeeks },
  } as const;
}

/** RN-OBJ-009 y RN-OBJ-013: la revisión de fase toca cada P-057 semanas desde el inicio. */
export function isPhaseReviewDue(startDate: LocalDate, today: LocalDate): boolean {
  const days = daysBetween(startDate, today);
  return days > 0 && days % (PARAMETERS.goal.phaseReviewWeeks * 7) === 0;
}

/**
 * RN-OBJ-013: si el ritmo real de peso está fuera de los límites P-004/P-005, se
 * proponen ajustes con opciones (sin alarma); si no, nada.
 */
export function reviewPhase(input: {
  readonly goal: Goal;
  readonly currentValue: number;
  readonly weeksElapsed: number;
}): { withinLimits: boolean; options: readonly string[] } {
  const { goal, currentValue, weeksElapsed } = input;
  if (goal.metric !== 'weight_kg' || weeksElapsed <= 0) return { withinLimits: true, options: [] };
  const losing = currentValue < goal.startValue;
  const weeklyFraction = Math.abs(currentValue - goal.startValue) / goal.startValue / weeksElapsed;
  return weeklyFraction > maxWeeklyFraction(losing) + EPSILON
    ? { withinLimits: false, options: ['extend_horizon', 'adjust_target', 'keep'] }
    : { withinLimits: true, options: [] };
}
