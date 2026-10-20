import { EXERCISES, EXPRESS_EXCEPTIONS } from '@gymbro/content';
import {
  PARAMETERS,
  WEEK_DAYS,
  addDays,
  applyAdjustments,
  generateWeeklyPlan,
  repRangeFor,
  suggestProgression,
  type GoalType,
  type LoggedSet,
  operationalDate,
  weekStartOf,
  type LocalDate,
  type PlanInputs,
} from '@gymbro/domain';
import type { EventEmitter } from '../events/emitter.js';
import type {
  ExerciseAdjustmentsRepository,
  PainFlagsRepository,
  PlansRepository,
  SetEntriesRepository,
  StoredWeeklyPlan,
  UserRecord,
} from '../ports/repositories.js';

/**
 * Plan semanal guardado (T-040, HU-002-1). El dominio lo genera (FR-002-01); aquí
 * se arma la entrada desde el perfil, se guarda una sola vez por semana y se
 * continúa la rotación de la semana anterior (RN-PLAN-007).
 */

export interface PlanDeps {
  plans: PlansRepository;
  setEntries: SetEntriesRepository;
  adjustments: ExerciseAdjustmentsRepository;
  painFlags: PainFlagsRepository;
  events: EventEmitter;
  clock: () => Date;
}

/** Entradas del generador desde el perfil del onboarding; null si falta algo esencial. */
export function planInputsFor(
  user: UserRecord,
  weekStart: LocalDate,
  rotationStart: number,
  suggestedLoads: Readonly<Record<string, number>>,
): PlanInputs | null {
  const { profile } = user;
  if (!profile.level || profile.availableDays.length === 0 || profile.sessionMinutes === null) {
    return null;
  }
  return {
    level: profile.level,
    availableDays: profile.availableDays,
    sessionMinutes: profile.sessionMinutes,
    goal: profile.goalType ?? 'consistency',
    homeEquipment: profile.homeEquipment,
    weekStart,
    rotationStart,
    lowIntensity: user.settings.lowIntensityStart,
    catalog: EXERCISES,
    expressExceptions: EXPRESS_EXCEPTIONS,
    suggestedLoads,
  };
}

/** Semana que contiene `date` (lunes, P-070). */
export function weekOf(date: LocalDate): LocalDate {
  return weekStartOf(date);
}

/**
 * FR-002-04 y RN-ENT-002: carga sugerida de cada ejercicio. Parte de la última
 * registrada y sube el incremento mínimo si en las últimas P-019 sesiones todas
 * las series llegaron al tope del rango. RN-SEG-006: si hubo dolor en alguna de
 * esas sesiones, la progresión de ese ejercicio se detiene.
 */
export async function suggestedLoadsFor(
  userId: string,
  goal: GoalType,
  deps: PlanDeps,
): Promise<{ loads: Record<string, number>; increased: number }> {
  const last = await deps.setEntries.lastLoads(userId);
  const loads = { ...last };
  let increased = 0;
  for (const [code, currentLoadKg] of Object.entries(last)) {
    const exercise = EXERCISES.find((e) => e.code === code);
    if (!exercise) continue;
    const bySession = new Map<string, LoggedSet[]>();
    for (const set of await deps.setEntries.exerciseHistory(userId, code)) {
      bySession.set(set.sessionId, [
        ...(bySession.get(set.sessionId) ?? []),
        {
          exerciseCode: code,
          setIndex: set.setIndex,
          reps: set.reps,
          loadKg: set.loadKg,
          edited: set.edited,
        },
      ]);
    }
    const recentIds = [...bySession.keys()].slice(-PARAMETERS.training.sessionsAtTopToProgress);
    const painful = await deps.painFlags.sessionsWithPain(userId, code);
    if (recentIds.some((id) => painful.includes(id))) continue;
    const suggestion = suggestProgression({
      recentSessions: recentIds.map((id) => bySession.get(id) ?? []),
      repRange: repRangeFor(goal, exercise.pattern, 'GYM'),
      pattern: exercise.pattern,
      variant: 'GYM',
      currentLoadKg,
    });
    if (suggestion.type === 'increase_load') {
      loads[code] = suggestion.loadKg;
      increased += 1;
    }
  }
  return { loads, increased };
}

/** Devuelve la semana guardada; si no existe, la genera, la guarda y emite `plan_generated`. */
export async function ensureWeek(
  user: UserRecord,
  weekStart: LocalDate,
  deps: PlanDeps,
): Promise<StoredWeeklyPlan | null> {
  const existing = await deps.plans.week(user.id, weekStart);
  if (existing) return existing;
  const previous = await deps.plans.week(user.id, addDays(weekStart, -WEEK_DAYS.length));
  const goal = user.profile.goalType ?? 'consistency';
  const { loads, increased } = await suggestedLoadsFor(user.id, goal, deps);
  const inputs = planInputsFor(user, weekStart, previous?.nextRotationStart ?? 0, loads);
  if (!inputs) return null;
  // RN-ENT-003: estrategias elegidas ante un estancamiento.
  const plan = applyAdjustments(
    generateWeeklyPlan(inputs),
    await deps.adjustments.list(user.id),
    goal,
    loads,
  );
  const stored = await deps.plans.saveWeek(user.id, plan);
  const subject = { userId: user.id, timezone: user.timezone };
  await deps.events.emit('plan_generated', subject, {
    trainingDays: stored.days.filter((d) => d.session !== null).length,
    intensity: stored.intensity,
  });
  if (increased > 0) {
    await deps.events.emit('progression_suggested', subject, { exercises: increased });
  }
  return stored;
}

/** Semana actual (según el día operativo del usuario). */
export async function currentWeek(
  user: UserRecord,
  deps: PlanDeps,
): Promise<StoredWeeklyPlan | null> {
  return ensureWeek(user, weekOf(operationalDate(deps.clock(), user.timezone)), deps);
}
