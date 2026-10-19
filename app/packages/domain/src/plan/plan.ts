import { PARAMETERS } from '../config/parameters.js';
import type { DayType } from '../day/day.js';
import type { SessionVariant } from '../gamification/xp.js';
import type { GoalType } from '../goals/goals.js';
import { planReadyAt, usualStartTime, weeklySummaryAt } from '../messaging/engine.js';
import type { MovementPattern } from '../training/training.js';
import { addDays, weekdayOf, type LocalDate, type LocalTime, type Weekday } from '../time/zoned.js';

/**
 * Generador del plan semanal (RN-PLAN-001 a 010, FR-002-01): función pura de nivel,
 * días, minutos, objetivo, equipamiento, catálogo y posición en la rotación.
 * Parámetros P-013 a P-018 y P-074 a P-079; composición de sesiones en
 * `catalogo-de-ejercicios-base.md` §5 (`[VALIDAR-PROFESIONAL]` `[inferencia]`).
 */

export type ExperienceLevel = 'novice' | 'intermediate';

export const WEEK_DAYS: readonly Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

/** Ejercicio del catálogo (`EXERCISES` de `@gymbro/content` cumple esta forma). */
export interface CatalogExercise {
  readonly code: string;
  readonly pattern: MovementPattern;
  readonly variants: readonly SessionVariant[];
  readonly level: ExperienceLevel;
  readonly equipment: string;
}

/** Excepción exprés del catálogo (RN-PLAN-010). */
export interface ExpressException {
  readonly pattern: MovementPattern;
  readonly compensatedBy: MovementPattern | null;
}

export type SessionTemplate =
  'FULL_A' | 'FULL_B' | 'FULL_C' | 'UPPER' | 'LOWER' | 'PUSH' | 'PULL' | 'LEGS';

/** Composición de cada sesión (catálogo de ejercicios §5; una prueba la compara con la bóveda). */
export const SESSION_PATTERNS: Readonly<Record<SessionTemplate, readonly MovementPattern[]>> = {
  FULL_A: ['SQUAT', 'PUSH_H', 'PULL_V', 'CORE'],
  FULL_B: ['HINGE', 'PUSH_V', 'PULL_H', 'SINGLE_LEG'],
  FULL_C: ['SQUAT', 'PUSH_H', 'PULL_H', 'ARMS'],
  UPPER: ['PUSH_H', 'PULL_H', 'PUSH_V', 'PULL_V', 'ARMS'],
  LOWER: ['SQUAT', 'HINGE', 'SINGLE_LEG', 'CORE'],
  PUSH: ['PUSH_H', 'PUSH_V', 'ARMS'],
  PULL: ['PULL_H', 'PULL_V', 'ARMS'],
  LEGS: ['SQUAT', 'HINGE', 'SINGLE_LEG', 'CORE'],
};

/** Patrones multiarticulares ("básicos") para P-016 y P-078 en el objetivo de fuerza. */
const COMPOUND_PATTERNS: ReadonlySet<MovementPattern> = new Set([
  'SQUAT',
  'HINGE',
  'PUSH_H',
  'PUSH_V',
  'PULL_H',
  'PULL_V',
]);

export interface PlanInputs {
  readonly level: ExperienceLevel;
  /** Días que el usuario puede entrenar (RN-PLAN-001, P-074). */
  readonly availableDays: readonly Weekday[];
  /** Minutos por sesión (RN-PLAN-001, P-075). */
  readonly sessionMinutes: number;
  readonly goal: GoalType;
  /** Equipamiento de casa, con los nombres del catálogo ("Mancuernas", "Banda elástica"…). */
  readonly homeEquipment: readonly string[];
  /** Lunes de la semana (P-070). */
  readonly weekStart: LocalDate;
  /** Posición en la rotación de sesiones con la que empieza la semana (RN-PLAN-007). */
  readonly rotationStart: number;
  /** FR-002-08 / RN-SEG-002: tamizaje positivo sin autorización → intensidad baja. */
  readonly lowIntensity?: boolean;
  readonly catalog: readonly CatalogExercise[];
  readonly expressExceptions: readonly ExpressException[];
  /** Carga sugerida por ejercicio desde la progresión (FR-002-04, RN-ENT-002). */
  readonly suggestedLoads?: Readonly<Record<string, number>>;
}

export interface PlannedExercise {
  readonly exerciseCode: string;
  readonly pattern: MovementPattern;
  readonly sets: number;
  readonly reps: { readonly min: number; readonly max: number };
  /** Repeticiones precargadas (RN-ENT-001): el inicio del rango, para la progresión doble. */
  readonly targetReps: number;
  readonly loadKg: number;
  readonly restSeconds: number;
}

export interface SessionVersionPlan {
  readonly variant: SessionVariant;
  readonly exercises: readonly PlannedExercise[];
  /** RN-PLAN-006: duración estimada en minutos. */
  readonly estimatedMinutes: number;
}

export interface PlannedSession {
  readonly template: SessionTemplate;
  /** RN-PLAN-003: tres versiones equivalentes; cualquiera cuenta para el día. */
  readonly versions: Readonly<Record<SessionVariant, SessionVersionPlan>>;
}

export interface PlannedDay {
  readonly date: LocalDate;
  readonly type: DayType;
  readonly session: PlannedSession | null;
}

export interface WeeklyPlan {
  readonly weekStart: LocalDate;
  readonly days: readonly PlannedDay[];
  readonly nextRotationStart: number;
  readonly intensity: 'low' | 'normal';
}

// ── RN-PLAN-001 ─────────────────────────────────────────────────────────────

/** RN-PLAN-001: valida las entradas del generador contra P-074 y P-075. */
export function validatePlanInputs(inputs: PlanInputs): void {
  const days = new Set(inputs.availableDays);
  const { availableDaysRange, sessionMinutesRange } = PARAMETERS.plan;
  if (days.size < availableDaysRange.min || days.size > availableDaysRange.max) {
    throw new Error(
      `RN-PLAN-001: días disponibles fuera de ${availableDaysRange.min}–${availableDaysRange.max}`,
    );
  }
  if (
    inputs.sessionMinutes < sessionMinutesRange.min ||
    inputs.sessionMinutes > sessionMinutesRange.max
  ) {
    throw new Error(
      `RN-PLAN-001: minutos por sesión fuera de ${sessionMinutesRange.min}–${sessionMinutesRange.max}`,
    );
  }
  if (weekdayOf(inputs.weekStart) !== PARAMETERS.week.startDay) {
    throw new Error('RN-PLAN-001: la semana del plan empieza en lunes (P-070)');
  }
}

// ── RN-PLAN-004 y RN-PLAN-008: cuántos días y cuáles ───────────────────────

/** RN-PLAN-004: 5–6 días solo para intermedios; un novato entrena como máximo el mayor número permitido. */
export function trainingDaysFor(level: ExperienceLevel, available: number): number {
  const { intermediateOnlyDays } = PARAMETERS.plan.splitByDays;
  let days = Math.min(available, 7 - PARAMETERS.plan.minRestDaysPerWeek);
  if (level === 'novice') {
    while ((intermediateOnlyDays as readonly number[]).includes(days)) days -= 1;
  }
  return days;
}

/** Racha máxima de días de entreno seguidos, contando que la semana sigue en la siguiente. */
export function maxConsecutiveTrainingDays(training: readonly boolean[]): number {
  if (training.every(Boolean)) return training.length;
  let best = 0;
  let run = 0;
  for (let i = 0; i < training.length * 2; i++) {
    run = training[i % training.length] ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return Math.min(best, training.length);
}

function combinations<T>(items: readonly T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  const [first, ...rest] = items as [T, ...T[]];
  return [
    ...combinations(rest, size - 1).map((combo) => [first, ...combo]),
    ...combinations(rest, size),
  ];
}

/**
 * RN-PLAN-004 y RN-PLAN-008: elige los días de entreno entre los disponibles: al
 * menos P-017 de descanso y, para novatos, no más de P-018 seguidos.
 */
export function chooseTrainingDays(
  level: ExperienceLevel,
  availableDays: readonly Weekday[],
): Weekday[] {
  const available = WEEK_DAYS.filter((day) => availableDays.includes(day));
  for (let count = trainingDaysFor(level, available.length); count > 0; count--) {
    const valid = combinations(available, count).find((combo) => {
      const pattern = WEEK_DAYS.map((day) => combo.includes(day));
      const restDays = pattern.filter((t) => !t).length;
      return (
        restDays >= PARAMETERS.plan.minRestDaysPerWeek &&
        (level !== 'novice' ||
          maxConsecutiveTrainingDays(pattern) <= PARAMETERS.plan.noviceMaxConsecutiveDays)
      );
    });
    if (valid) return valid;
  }
  return [];
}

/** RN-PLAN-004: ciclo de sesiones de la división de P-014 para ese número de días. */
export function sessionCycleFor(days: number): SessionTemplate[] {
  const entry = PARAMETERS.plan.splitByDays.splits.find((s) => s.days === days);
  if (!entry) throw new Error(`RN-PLAN-004: no hay división para ${days} días`);
  switch (entry.split) {
    case 'full_body':
      return 'sessions' in entry && entry.sessions.length === 3
        ? ['FULL_A', 'FULL_B', 'FULL_C']
        : ['FULL_A', 'FULL_B'];
    case 'upper_lower':
      return ['UPPER', 'LOWER'];
    case 'upper_lower_plus_full_body':
      return ['UPPER', 'LOWER', 'UPPER', 'LOWER', 'FULL_A'];
    case 'push_pull_legs':
      return ['PUSH', 'PULL', 'LEGS'];
  }
}

// ── RN-PLAN-005, 006 y 010: armar cada versión ──────────────────────────────

function levelAllows(user: ExperienceLevel, exercise: CatalogExercise): boolean {
  return user === 'intermediate' || exercise.level === 'novice';
}

/** RN-PLAN-005 (P-016): rango de repeticiones por objetivo, patrón y versión. */
export function repRangeFor(goal: GoalType, pattern: MovementPattern, variant: SessionVariant) {
  const ranges = PARAMETERS.plan.repRangesByGoal;
  if (variant !== 'GYM') return ranges.home.reps;
  if (goal === 'gain_strength') {
    return COMPOUND_PATTERNS.has(pattern) ? ranges.strength.compound : ranges.strength.accessory;
  }
  return ranges.muscleFatLossRecomposition;
}

/** RN-PLAN-006 (P-078): descanso entre series. */
export function restSecondsFor(
  goal: GoalType,
  pattern: MovementPattern,
  variant: SessionVariant,
): number {
  const rest = PARAMETERS.plan.restSecondsByGoal;
  return variant === 'GYM' && goal === 'gain_strength' && COMPOUND_PATTERNS.has(pattern)
    ? rest.strengthCompound
    : rest.hypertrophyAndAccessory;
}

/** RN-PLAN-006: calentamiento + Σ series × (tiempo de serie + descanso), en minutos. */
export function estimateStrengthMinutes(exercises: readonly PlannedExercise[]): number {
  const seconds =
    PARAMETERS.plan.warmupMinutes * 60 +
    exercises.reduce((sum, e) => sum + e.sets * (PARAMETERS.plan.setSeconds + e.restSeconds), 0);
  return seconds / 60;
}

/** RN-PLAN-006 (P-079): duración del circuito exprés con `rounds` rondas, en minutos. */
export function estimateExpressMinutes(exerciseCount: number, rounds: number): number {
  const c = PARAMETERS.plan.expressCircuit;
  if (exerciseCount === 0 || rounds === 0) return 0;
  const seconds =
    rounds * exerciseCount * (c.workSeconds + c.restSeconds) +
    (rounds - 1) * c.restBetweenRoundsSeconds;
  return seconds / 60;
}

/** RN-PLAN-006: recorta series (y, si hace falta, ejercicios) hasta caber en los minutos. */
function fitToMinutes(exercises: PlannedExercise[], minutes: number): PlannedExercise[] {
  let result = [...exercises];
  while (estimateStrengthMinutes(result) > minutes) {
    const maxSets = Math.max(...result.map((e) => e.sets));
    if (maxSets > 1) {
      const index = result.map((e) => e.sets).lastIndexOf(maxSets);
      result = result.map((e, i) => (i === index ? { ...e, sets: e.sets - 1 } : e));
    } else if (result.length > 1) {
      result = result.slice(0, -1);
    } else {
      break;
    }
  }
  return result;
}

function pickGym(pattern: MovementPattern, inputs: PlanInputs): CatalogExercise | undefined {
  return inputs.catalog.find(
    (e) => e.pattern === pattern && e.variants.includes('GYM') && levelAllows(inputs.level, e),
  );
}

/** Minúsculas y sin "s" final: "Mancuernas" coincide con "Mancuerna, kettlebell o mochila". */
function equipmentStem(item: string): string {
  return item.trim().toLowerCase().replace(/s$/, '');
}

/** ¿El usuario tiene el equipo del ejercicio? Peso corporal ("Ninguno") siempre. */
function hasEquipment(exercise: CatalogExercise, homeEquipment: readonly string[]): boolean {
  if (exercise.equipment === 'Ninguno') return true;
  const text = exercise.equipment.toLowerCase();
  return homeEquipment.some((item) => text.includes(equipmentStem(item)));
}

/**
 * RN-PLAN-003 y RN-PLAN-010: versión B con el equipamiento de casa del usuario.
 * Prefiere un ejercicio con su equipo, luego peso corporal; si el patrón no tiene
 * ninguno posible, usa la compensación exprés del catálogo (p. ej. PULL_V → PULL_H);
 * solo como último recurso, el primero de casa del patrón.
 */
function pickHome(pattern: MovementPattern, inputs: PlanInputs): CatalogExercise | undefined {
  const homeOf = (p: MovementPattern) =>
    inputs.catalog.filter(
      (e) => e.pattern === p && e.variants.includes('HOME') && levelAllows(inputs.level, e),
    );
  const usable = (p: MovementPattern) => {
    const options = homeOf(p).filter((e) => hasEquipment(e, inputs.homeEquipment));
    return options.find((e) => e.equipment !== 'Ninguno') ?? options[0];
  };
  const compensation = inputs.expressExceptions.find((x) => x.pattern === pattern)?.compensatedBy;
  return usable(pattern) ?? (compensation ? usable(compensation) : undefined) ?? homeOf(pattern)[0];
}

/** RN-PLAN-010: versión C del patrón o su compensación del catálogo; null si se omite. */
function pickExpress(pattern: MovementPattern, inputs: PlanInputs): CatalogExercise | null {
  const express = (p: MovementPattern) =>
    inputs.catalog.find(
      (e) => e.pattern === p && e.variants.includes('EXPRESS') && levelAllows(inputs.level, e),
    );
  const own = express(pattern);
  if (own) return own;
  const exception = inputs.expressExceptions.find((x) => x.pattern === pattern);
  return exception?.compensatedBy ? (express(exception.compensatedBy) ?? null) : null;
}

/** RN-PLAN-005 (P-015): series semanales objetivo por grupo (patrón). */
function weeklySetsTarget(inputs: PlanInputs): number {
  const volume = PARAMETERS.plan.weeklySetsPerMuscle;
  return inputs.lowIntensity || inputs.level === 'novice'
    ? volume.novice.min
    : volume.intermediate.min;
}

function buildSession(
  template: SessionTemplate,
  occurrences: ReadonlyMap<MovementPattern, number>,
  inputs: PlanInputs,
): PlannedSession {
  const patterns = SESSION_PATTERNS[template];
  const target = weeklySetsTarget(inputs);

  const strengthVersion = (variant: 'GYM' | 'HOME'): SessionVersionPlan => {
    const exercises = patterns.flatMap((pattern): PlannedExercise[] => {
      const exercise = variant === 'GYM' ? pickGym(pattern, inputs) : pickHome(pattern, inputs);
      if (!exercise) return [];
      const reps = repRangeFor(inputs.goal, pattern, variant);
      return [
        {
          exerciseCode: exercise.code,
          pattern,
          sets: Math.ceil(target / (occurrences.get(pattern) ?? 1)),
          reps,
          targetReps: reps.min,
          loadKg: inputs.suggestedLoads?.[exercise.code] ?? 0,
          restSeconds: restSecondsFor(inputs.goal, pattern, variant),
        },
      ];
    });
    const unique = exercises.filter(
      (e, i) => exercises.findIndex((x) => x.exerciseCode === e.exerciseCode) === i,
    );
    const fitted = fitToMinutes(unique, inputs.sessionMinutes);
    return { variant, exercises: fitted, estimatedMinutes: estimateStrengthMinutes(fitted) };
  };

  const expressVersion = (): SessionVersionPlan => {
    const circuit = PARAMETERS.plan.expressCircuit;
    const picked = patterns
      .map((pattern) => pickExpress(pattern, inputs))
      .filter((e): e is CatalogExercise => e !== null)
      .filter((e, i, all) => all.findIndex((x) => x.code === e.code) === i);
    let rounds: number = circuit.rounds;
    // RN-PLAN-003: la versión C dura como máximo P-013 minutos (y nunca más que la sesión).
    const limit = Math.min(inputs.sessionMinutes, PARAMETERS.plan.expressMinutes);
    while (rounds > 1 && estimateExpressMinutes(picked.length, rounds) > limit) rounds -= 1;
    const reps = PARAMETERS.plan.repRangesByGoal.home.reps;
    const exercises = picked.map((e) => ({
      exerciseCode: e.code,
      pattern: e.pattern,
      sets: rounds,
      reps,
      targetReps: reps.min,
      loadKg: 0,
      restSeconds: circuit.restSeconds,
    }));
    return {
      variant: 'EXPRESS',
      exercises,
      estimatedMinutes: estimateExpressMinutes(exercises.length, rounds),
    };
  };

  return {
    template,
    versions: {
      GYM: strengthVersion('GYM'),
      HOME: strengthVersion('HOME'),
      EXPRESS: expressVersion(),
    },
  };
}

/**
 * RN-PLAN-001 a RN-PLAN-008 y RN-PLAN-010: plan de la semana. RN-PLAN-007: no
 * recibe lo realizado: una sesión no hecha no se suma a la siguiente; la rotación
 * avanza por día planificado.
 */
export function generateWeeklyPlan(inputs: PlanInputs): WeeklyPlan {
  validatePlanInputs(inputs);
  const trainingDays = chooseTrainingDays(inputs.level, inputs.availableDays);
  const cycle = sessionCycleFor(trainingDays.length);
  const templates = trainingDays.map(
    (_, i) => cycle[(inputs.rotationStart + i) % cycle.length] ?? cycle[0] ?? 'FULL_A',
  );

  const occurrences = new Map<MovementPattern, number>();
  for (const template of templates) {
    for (const pattern of SESSION_PATTERNS[template]) {
      occurrences.set(pattern, (occurrences.get(pattern) ?? 0) + 1);
    }
  }

  let next = 0;
  const days = WEEK_DAYS.map((weekday, i): PlannedDay => {
    const date = addDays(inputs.weekStart, i);
    if (!trainingDays.includes(weekday)) return { date, type: 'REST', session: null };
    const template = templates[next++] ?? 'FULL_A';
    return { date, type: 'TRAINING', session: buildSession(template, occurrences, inputs) };
  });

  return {
    weekStart: inputs.weekStart,
    days,
    nextRotationStart: (inputs.rotationStart + trainingDays.length) % cycle.length,
    intensity: inputs.lowIntensity ? 'low' : 'normal',
  };
}

// ── RN-PLAN-007: reprogramar sin deuda ──────────────────────────────────────

/**
 * RN-PLAN-007 y RN-PLAN-008: mueve la sesión de `from` a un día de descanso `to` de
 * la misma semana, sin volumen extra. Falla si rompe el descanso mínimo o, para
 * novatos, el máximo de días seguidos.
 */
export function rescheduleSession(
  plan: WeeklyPlan,
  from: LocalDate,
  to: LocalDate,
  level: ExperienceLevel,
): WeeklyPlan {
  const source = plan.days.find((d) => d.date === from);
  const target = plan.days.find((d) => d.date === to);
  if (!source?.session || !target || target.type !== 'REST') {
    throw new Error(
      'RN-PLAN-007: solo se mueve una sesión a un día de descanso de la misma semana',
    );
  }
  const days = plan.days.map((d): PlannedDay => {
    if (d.date === from) return { date: d.date, type: 'REST', session: null };
    if (d.date === to) return { date: d.date, type: 'TRAINING', session: source.session };
    return d;
  });
  const pattern = days.map((d) => d.type === 'TRAINING');
  const restDays = pattern.filter((t) => !t).length;
  if (
    restDays < PARAMETERS.plan.minRestDaysPerWeek ||
    (level === 'novice' &&
      maxConsecutiveTrainingDays(pattern) > PARAMETERS.plan.noviceMaxConsecutiveDays)
  ) {
    throw new Error('RN-PLAN-008: ese cambio rompe el descanso mínimo');
  }
  return { ...plan, days };
}

// ── RN-PLAN-002 y RN-PLAN-009 ───────────────────────────────────────────────

/** `TrainingHabit` del glosario (RN-PLAN-002). */
export interface TrainingHabit {
  readonly days: readonly Weekday[];
  readonly usualTimes: Readonly<Partial<Record<Weekday, LocalTime>>>;
  readonly place: 'gym' | 'home';
}

/** RN-PLAN-002 y RN-MSJ-006: la hora habitual declarada se actualiza con las sesiones reales. */
export function updateHabitTime(
  habit: TrainingHabit,
  weekday: Weekday,
  recentStarts: readonly LocalTime[],
  declared: LocalTime,
): TrainingHabit {
  return {
    ...habit,
    usualTimes: { ...habit.usualTimes, [weekday]: usualStartTime(recentStarts, declared) },
  };
}

/** RN-PLAN-009 y RN-MSJ-017: el plan de la semana sale con el resumen del domingo anterior. */
export function planPublishedAt(weekStart: LocalDate, timeZone: string): Date {
  return weeklySummaryAt(addDays(weekStart, -1), timeZone);
}

/** RN-PLAN-009 y RN-MSJ-005: la sesión del día está lista antes de la hora habitual. */
export function sessionReadyAt(date: LocalDate, usualStart: LocalTime, timeZone: string): Date {
  return planReadyAt(date, usualStart, timeZone);
}
