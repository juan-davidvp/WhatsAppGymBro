import { EXERCISES, EXPRESS_EXCEPTIONS } from '@gymbro/content';
import {
  WEEK_DAYS,
  addDays,
  generateWeeklyPlan,
  operationalDate,
  weekStartOf,
  type LocalDate,
  type PlanInputs,
} from '@gymbro/domain';
import type { EventEmitter } from '../events/emitter.js';
import type {
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

/** Devuelve la semana guardada; si no existe, la genera, la guarda y emite `plan_generated`. */
export async function ensureWeek(
  user: UserRecord,
  weekStart: LocalDate,
  deps: PlanDeps,
): Promise<StoredWeeklyPlan | null> {
  const existing = await deps.plans.week(user.id, weekStart);
  if (existing) return existing;
  const previous = await deps.plans.week(user.id, addDays(weekStart, -WEEK_DAYS.length));
  const inputs = planInputsFor(
    user,
    weekStart,
    previous?.nextRotationStart ?? 0,
    await deps.setEntries.lastLoads(user.id),
  );
  if (!inputs) return null;
  const stored = await deps.plans.saveWeek(user.id, generateWeeklyPlan(inputs));
  await deps.events.emit(
    'plan_generated',
    { userId: user.id, timezone: user.timezone },
    {
      trainingDays: stored.days.filter((d) => d.session !== null).length,
      intensity: stored.intensity,
    },
  );
  return stored;
}

/** Semana actual (según el día operativo del usuario). */
export async function currentWeek(
  user: UserRecord,
  deps: PlanDeps,
): Promise<StoredWeeklyPlan | null> {
  return ensureWeek(user, weekOf(operationalDate(deps.clock(), user.timezone)), deps);
}
