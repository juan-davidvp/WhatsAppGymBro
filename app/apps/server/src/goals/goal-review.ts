import { renderTemplate } from '@gymbro/content';
import {
  PARAMETERS,
  addDays,
  daysBetween,
  enterMaintenance,
  goalProgress,
  isGoalAchieved,
  isPhaseReviewDue,
  maintenanceDecision,
  messageIntensityOnMaintenance,
  operationalDate,
  reviewPhase,
  weightMovingAverage,
  type Goal,
  type LocalDate,
  type MaintenanceBand,
} from '@gymbro/domain';
import type { AchievementDeps } from '../days/achievements.js';
import type { Reply } from '../onboarding/replies.js';
import { formatKg } from '../progress/progress-screen.js';
import type {
  BodyMeasurementsRepository,
  GoalRecord,
  GoalsRepository,
  PersonalRecordsRepository,
  StreakStatesRepository,
  UserRecord,
  UsersRepository,
} from '../ports/repositories.js';

/**
 * Objetivo cumplido, plazo cumplido y revisión de fase (T-082, HU-006-4 a 6,
 * RN-OBJ-006, 008, 013, RN-MAN-001, 002, 005). Se revisa una vez por día cerrado.
 * Los mensajes llegan como aviso en la próxima interacción (PO, 2026-11-10): GO-01
 * con [Mantener] [Nueva meta], GO-02 con [Extender] [Ajustar] y GO-03 con opciones.
 * Sin respuesta en P-009 días tras cumplirlo, entra en mantenimiento.
 */

export interface GoalDeps extends AchievementDeps {
  goals: GoalsRepository;
  bodyMeasurements: BodyMeasurementsRepository;
  users: UsersRepository;
  records: PersonalRecordsRepository;
  streaks: StreakStatesRepository;
}

const WEEK_LENGTH = 7;
const COMPLETE_PCT = 100;
const GOAL_DONE = 'GOAL_DONE';

const subjectOf = (user: UserRecord) => ({ userId: user.id, timezone: user.timezone });

/** El objetivo con meta como lo pide el dominio; null si todavía no tiene valores. */
function withTarget(goal: GoalRecord): Goal | null {
  if (goal.startValue === null || goal.targetValue === null) return null;
  return {
    type: goal.type,
    metric: goal.metric,
    startValue: goal.startValue,
    targetValue: goal.targetValue,
    startDate: goal.startDate,
    horizonWeeks: goal.horizonWeeks,
    status: 'active',
  };
}

/** RN-OBJ-010: media móvil de cada día de `from` a `to` (los días sin media no salen). */
async function dailyAverages(
  user: UserRecord,
  from: LocalDate,
  to: LocalDate,
  deps: Pick<GoalDeps, 'bodyMeasurements'>,
) {
  const window = PARAMETERS.goal.movingAverageDays.days;
  const weights = await deps.bodyMeasurements.weightsSince(user.id, addDays(from, -(window - 1)));
  const averages: { date: LocalDate; movingAvgKg: number }[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) {
    const avg = weightMovingAverage(weights, date);
    if (avg !== null) averages.push({ date, movingAvgKg: avg });
  }
  return averages;
}

export async function averageOn(
  user: UserRecord,
  date: LocalDate,
  deps: Pick<GoalDeps, 'bodyMeasurements'>,
): Promise<number | null> {
  return (await dailyAverages(user, date, date, deps))[0]?.movingAvgKg ?? null;
}

/** Revisión diaria del objetivo al cerrar `date` (idempotente: avisos con clave). */
export async function reviewGoalDay(
  user: UserRecord,
  date: LocalDate,
  deps: GoalDeps,
  /** Días que cuentan con `date` ya cerrado (el estado se guarda después). */
  countedTotal?: number,
): Promise<void> {
  const active = await deps.goals.active(user.id);
  if (!active) return autoMaintenance(user, date, deps);
  const goal = withTarget(active);
  // En la Fase 0 solo los objetivos de peso tienen meta; el mantenimiento se vigila aparte.
  if (!goal || goal.metric !== 'weight_kg' || goal.type === 'maintain') return;
  const sustainDays = PARAMETERS.goal.weeksToSustainTarget * WEEK_LENGTH;
  const averages = await dailyAverages(user, addDays(date, -(sustainDays - 1)), date, deps);
  if (isGoalAchieved(goal, { today: date, dailyMovingAverages: averages })) {
    return completeGoal(user, goal, date, deps, countedTotal);
  }
  if (date >= addDays(goal.startDate, goal.horizonWeeks * WEEK_LENGTH)) {
    const current = await lastAverageSince(user, goal.startDate, date, deps);
    return closeAtHorizon(user, goal, current, deps);
  }
  if (isPhaseReviewDue(goal.startDate, date)) {
    const current = averages.at(-1)?.movingAvgKg ?? null;
    if (current === null) return;
    const weeksElapsed = daysBetween(goal.startDate, date) / WEEK_LENGTH;
    const { withinLimits } = reviewPhase({ goal, currentValue: current, weeksElapsed });
    await deps.events.emit('phase_reviewed', subjectOf(user), { withinLimits });
    if (!withinLimits) {
      await notice(user, `goal:${goal.startDate}:review:${date}`, 'GO-03', {}, deps);
    }
  }
}

async function notice(
  user: UserRecord,
  key: string,
  templateId: string,
  variables: Readonly<Record<string, string | number>>,
  deps: GoalDeps,
): Promise<void> {
  await deps.notices.add(user.id, { key, templateId, variables, createdAt: deps.clock() });
}

/** RN-OBJ-010: la última media móvil desde `from` (el peso es opcional, RN-OBJ-012). */
async function lastAverageSince(
  user: UserRecord,
  from: LocalDate,
  to: LocalDate,
  deps: Pick<GoalDeps, 'bodyMeasurements'>,
): Promise<number | null> {
  return (await dailyAverages(user, from, to, deps)).at(-1)?.movingAvgKg ?? null;
}

/**
 * RN-OBJ-006 y RN-MAN-001: GO-01 con el resumen del capítulo y el logro GOAL_DONE.
 * Los efectos con clave van antes del cierre: si algo falla, el día se repite y
 * el objetivo sigue activo para volver a intentarlo.
 */
async function completeGoal(
  user: UserRecord,
  goal: Goal,
  date: LocalDate,
  deps: GoalDeps,
  countedTotal?: number,
): Promise<void> {
  const records = (await deps.records.list(user.id)).filter((r) => r.date >= goal.startDate);
  const total = countedTotal ?? (await deps.streaks.get(user.id))?.state.counted.total ?? 0;
  await notice(
    user,
    `goal:${goal.startDate}:done`,
    'GO-01',
    {
      semanas: Math.max(1, Math.round(daysBetween(goal.startDate, date) / WEEK_LENGTH)),
      dias_que_cuentan: total,
      records: records.length,
    },
    deps,
  );
  const { added } = await deps.achievements.appendOnce({
    userId: user.id,
    code: GOAL_DONE,
    at: deps.clock(),
    value: goal.type,
    context: date,
  });
  if (added) {
    await deps.events.emit('achievement_unlocked', subjectOf(user), { code: GOAL_DONE });
  }
  if (!(await deps.goals.close(user.id, 'completed', deps.clock(), COMPLETE_PCT))) return;
  await deps.events.emit('goal_completed', subjectOf(user), { type: goal.type });
}

/** RN-OBJ-008: plazo cumplido sin la meta, con el % alcanzado; nunca lenguaje de fracaso. */
async function closeAtHorizon(
  user: UserRecord,
  goal: Goal,
  current: number | null,
  deps: GoalDeps,
): Promise<void> {
  const progress = goalProgress({ ...goal, currentValue: current });
  const pct = progress === null ? null : Math.round(progress);
  // La clave lleva el plazo: tras [Extender], el nuevo fin del plazo avisa otra vez.
  const key = `goal:${goal.startDate}:${goal.horizonWeeks}:partial`;
  if (pct === null) await notice(user, key, 'GO-11', {}, deps);
  else await notice(user, key, 'GO-02', { porcentaje: pct }, deps);
  if (!(await deps.goals.close(user.id, 'partially_completed', deps.clock(), pct))) return;
  await deps.events.emit('goal_partially_completed', subjectOf(user), { progressPct: pct });
}

/** RN-MAN-001: sin elegir en P-009 días tras cumplir el objetivo, entra en mantenimiento. */
async function autoMaintenance(user: UserRecord, date: LocalDate, deps: GoalDeps): Promise<void> {
  const latest = await deps.goals.latest(user.id);
  if (latest?.status !== 'completed' || !latest.closedAt) return;
  const achievedOn = operationalDate(latest.closedAt, user.timezone);
  if (maintenanceDecision({ achievedOn, today: date, choice: null }) !== 'maintenance') return;
  const reply = await enterMaintenanceMode(user, date, 'timeout', deps);
  await notice(user, `maintenance:${date}`, reply.templateId, reply.variables, deps);
}

/** RN-MAN-002: zona de ± P-011 % alrededor del peso de entrada. */
export function maintenanceBand(entryKg: number): MaintenanceBand {
  return enterMaintenance({ entryMovingAvgKg: entryKg, proteinTargetG: 0 }).band;
}

/**
 * RN-MAN-002 y RN-MAN-005 (FR-006-04): el mantenimiento es un objetivo `maintain`
 * con el peso de entrada (la media móvil o, si no hay, el último); la semana se
 * cumple con P-010 sesiones (`close-week.ts`) y la intensidad pasa a Baja.
 */
export async function enterMaintenanceMode(
  user: UserRecord,
  date: LocalDate,
  source: 'choice' | 'timeout',
  deps: GoalDeps,
): Promise<{ templateId: string; variables: Record<string, string | number> }> {
  const entry =
    (await averageOn(user, date, deps)) ?? (await deps.bodyMeasurements.latestWeightKg(user.id));
  await deps.goals.activate({
    userId: user.id,
    type: 'maintain',
    metric: 'weight_kg',
    startValue: entry,
    targetValue: entry,
    startDate: date,
    horizonWeeks: PARAMETERS.goal.horizonWeeksDefault,
  });
  await deps.users.updateProfile(user.id, { goalType: 'maintain' });
  await deps.users.updateSettings(user.id, { intensity: messageIntensityOnMaintenance(null) });
  await deps.events.emit('maintenance_entered', subjectOf(user), { source });
  const sesiones = PARAMETERS.maintenance.minWeeklySessions;
  if (entry === null || user.settings.numberFreeMode) {
    return { templateId: 'GO-05', variables: { sesiones } };
  }
  const band = maintenanceBand(entry);
  return {
    templateId: 'GO-04',
    variables: { sesiones, bajo: formatKg(band.lowKg), alto: formatKg(band.highKg) },
  };
}

/** Respuesta con GO-04/GO-05 (al elegir [Mantener]). */
export function maintenanceReply(entered: {
  templateId: string;
  variables: Record<string, string | number>;
}): Reply {
  return { text: renderTemplate(entered.templateId, entered.variables), buttons: [], edit: true };
}
