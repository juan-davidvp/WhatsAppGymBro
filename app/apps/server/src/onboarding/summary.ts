import {
  EXERCISES,
  EXPRESS_EXCEPTIONS,
  SESSION_NAMES,
  WEEKDAY_NAMES,
  renderTemplate,
  templateById,
} from '@gymbro/content';
import {
  PARAMETERS,
  WEEK_DAYS,
  addDays,
  generateWeeklyPlan,
  operationalDate,
  weekStartOf,
  weekdayOf,
  type GoalMetric,
  type GoalType,
  type LocalDate,
  type WeeklyPlan,
} from '@gymbro/domain';
import type { TimeSlot, UserRecord } from '../ports/repositories.js';
import { reload, subjectOf, type OnboardingDeps } from './deps.js';
import { formatKg, joinSpanish } from './profile-steps.js';
import { GOAL_BY_LABEL, button, buttonValue, type Reply } from './replies.js';

/**
 * Cierre del onboarding (HU-001-1, FR-001-10): guarda el hábito y el objetivo,
 * genera el primer plan para mostrar la primera sesión (T-040 lo guarda y muestra
 * `/plan`), marca el onboarding como terminado y mide SC-001-1.
 */

/** Métrica principal de cada objetivo (objetivos-y-progreso §2). */
const METRIC_BY_GOAL: Readonly<Record<GoalType, GoalMetric>> = {
  gain_muscle: 'weight_kg',
  lose_fat: 'weight_kg',
  gain_strength: 'e1rm_kg',
  recomposition: 'waist_cm',
  consistency: 'fulfilled_weeks',
  maintain: 'weight_kg',
};

const SLOT_LABELS: Readonly<Record<TimeSlot, string>> = {
  morning: 'Mañana',
  midday: 'Mediodía',
  afternoon: 'Tarde',
  evening: 'Noche',
};

function goalLabel(type: GoalType): string {
  return Object.entries(GOAL_BY_LABEL).find(([, t]) => t === type)?.[0] ?? type;
}

function weekdayName(date: LocalDate): string {
  return WEEKDAY_NAMES[WEEK_DAYS.indexOf(weekdayOf(date))] ?? date;
}

/** Primer día con sesión desde hoy (esta semana o la siguiente). */
function firstSession(plans: readonly WeeklyPlan[], today: LocalDate) {
  for (const plan of plans) {
    const day = plan.days.find((d) => d.date >= today && d.session !== null);
    if (day?.session) return { date: day.date, template: day.session.template };
  }
  return null;
}

export async function completeOnboarding(user: UserRecord, deps: OnboardingDeps): Promise<Reply[]> {
  const fresh = await reload(user, deps);
  const { profile } = fresh;
  const now = deps.clock();
  const today = operationalDate(now, fresh.timezone);
  const goalType: GoalType = profile.goalType ?? 'consistency';
  const level = profile.level ?? 'novice';
  const slot = profile.timeSlot ?? 'morning';

  // RN-PLAN-002: hábito declarado (días, hora habitual por la franja P-083 y lugar).
  await deps.habits.save({
    userId: fresh.id,
    days: profile.availableDays.map((weekday) => ({
      weekday,
      declaredStart: PARAMETERS.habit.timeSlotStarts[slot],
      learnedStart: null,
      location: profile.place ?? 'gym',
    })),
  });
  await deps.events.emit('habit_declared', subjectOf(fresh), {
    days: [...profile.availableDays],
    slot,
  });

  // RN-OBJ-001: objetivo activo. Si no hubo meta de peso, se guarda sin valores hasta tener datos.
  let goal = await deps.goals.active(fresh.id);
  if (!goal) {
    goal = {
      userId: fresh.id,
      type: goalType,
      metric: METRIC_BY_GOAL[goalType],
      startValue: null,
      targetValue: null,
      startDate: today,
      horizonWeeks: PARAMETERS.goal.horizonWeeksDefault,
    };
    await deps.goals.activate(goal);
    await deps.events.emit('goal_set', subjectOf(fresh), {
      type: goalType,
      horizonWeeks: goal.horizonWeeks,
      withTarget: false,
    });
  }

  // FR-001-10: primer plan (esta semana y la siguiente, para la primera sesión).
  const inputs = {
    level,
    availableDays: profile.availableDays,
    sessionMinutes: profile.sessionMinutes ?? PARAMETERS.plan.sessionMinutesRange.max,
    goal: goalType,
    homeEquipment: profile.homeEquipment,
    rotationStart: 0,
    lowIntensity: fresh.settings.lowIntensityStart,
    catalog: EXERCISES,
    expressExceptions: EXPRESS_EXCEPTIONS,
  };
  const thisWeek = generateWeeklyPlan({ ...inputs, weekStart: weekStartOf(today) });
  const nextWeek = generateWeeklyPlan({
    ...inputs,
    weekStart: addDays(weekStartOf(today), 7),
    rotationStart: thisWeek.nextRotationStart,
  });
  const first = firstSession([thisWeek, nextWeek], today);
  const trainingDays = thisWeek.days
    .filter((d) => d.session !== null)
    .map((d) => weekdayName(d.date));

  await deps.users.completeOnboarding(fresh.id, now);
  const startedAt = fresh.onboarding.startedAt ?? now;
  await deps.events.emit('onboarding_step_completed', subjectOf(fresh), { step: 'summary' });
  await deps.events.emit('onboarding_completed', subjectOf(fresh), {
    durationMs: Math.max(0, now.getTime() - startedAt.getTime()),
    taps: fresh.onboarding.interactions,
  });

  const showTarget = goal.targetValue !== null && !fresh.settings.numberFreeMode;
  const text = renderTemplate('ON-24', {
    objetivo: goalLabel(goalType),
    meta: showTarget
      ? ` · meta ${formatKg(goal.targetValue ?? 0)} en ${goal.horizonWeeks} semanas`
      : '',
    dias: joinSpanish(trainingDays),
    franja: SLOT_LABELS[slot].toLowerCase(),
    primera_sesion: first
      ? `${first.date === today ? 'hoy' : weekdayName(first.date)} · ${SESSION_NAMES[first.template]}`
      : '—',
  });
  const buttons = templateById('ON-24').buttons.map((label) =>
    button(label, { action: 'nav', target: buttonValue('ON-24', label) as 'today' | 'plan' }),
  );
  return [{ text, buttons }];
}
