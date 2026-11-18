import {
  WEEKDAY_BUTTON_LABELS,
  WEEKDAY_NAMES,
  renderTemplate,
  templateById,
} from '@gymbro/content';
import {
  PARAMETERS,
  WEEK_DAYS,
  addDays,
  operationalDate,
  weekStartOf,
  weekdayOf,
  type LocalDate,
  type Weekday,
} from '@gymbro/domain';
import type { CallbackAction } from '../bot/callback-data.js';
import { settingsMenu } from '../messaging/message-settings.js';
import { joinSpanish } from '../onboarding/profile-steps.js';
import { button, plain, type Reply } from '../onboarding/replies.js';
import type {
  TrainingHabitsRepository,
  UserRecord,
  UsersRepository,
  WorkoutSessionsRepository,
} from '../ports/repositories.js';
import { discardWeekIfUnused, ensureWeek, type PlanDeps } from './weekly-plan.js';

/**
 * Días de entreno desde `/ajustes` (T-045, HU-002-4, RN-PLAN-001, RN-PLAN-004). La
 * semana en curso queda como está y el plan nuevo empieza el lunes siguiente.
 */

export interface TrainingDaysDeps extends PlanDeps {
  users: UsersRepository;
  habits: TrainingHabitsRepository;
  workouts: WorkoutSessionsRepository;
}

const aj = (value: string): CallbackAction => ({ action: 'aj', value });
const OPEN = 'days';
/** `dt<máscara>_<índice>` alterna un día; `ds<máscara>` guarda. La selección viaja en el botón. */
const TOGGLE = /^dt(\d{1,3})_(\d)$/;
const SAVE = /^ds(\d{1,3})$/;
const MASK_LIMIT = 1 << WEEK_DAYS.length;
const range = PARAMETERS.plan.availableDaysRange;
const rangeVariables = { min_dias: range.min, max_dias: range.max };

const maskOf = (days: readonly Weekday[]): number =>
  WEEK_DAYS.reduce((mask, day, i) => (days.includes(day) ? mask | (1 << i) : mask), 0);
const daysOf = (mask: number): Weekday[] => WEEK_DAYS.filter((_, i) => mask & (1 << i));
const nameOf = (date: LocalDate): string =>
  WEEKDAY_NAMES[WEEK_DAYS.indexOf(weekdayOf(date))] ?? date;

/** Si el valor es de esta pantalla, dentro de los botones de `/ajustes`. */
export function isTrainingDaysValue(value: string): boolean {
  return value === OPEN || TOGGLE.test(value) || SAVE.test(value);
}

function screen(mask: number, edit: boolean): Reply {
  const [done = ''] = templateById('AJ-02').buttons;
  return {
    text: renderTemplate('ON-10', rangeVariables),
    buttons: [
      ...WEEKDAY_BUTTON_LABELS.map((label, i) =>
        button(mask & (1 << i) ? `✅ ${label}` : label, aj(`dt${mask}_${i}`)),
      ),
      button(done, aj(`ds${mask}`)),
    ],
    rowSize: WEEKDAY_BUTTON_LABELS.length,
    edit,
  };
}

/** ON-10 con los días actuales marcados. */
export function trainingDaysScreen(user: UserRecord, edit = true): Reply {
  return screen(maskOf(user.profile.availableDays), edit);
}

/** RN-PLAN-002: el hábito sigue a los días; los que se quedan conservan su hora aprendida. */
async function saveHabit(
  user: UserRecord,
  days: readonly Weekday[],
  deps: TrainingDaysDeps,
): Promise<void> {
  const habit = await deps.habits.get(user.id);
  const reference = habit?.days[0];
  const slot = user.profile.timeSlot ?? 'morning';
  await deps.habits.save({
    userId: user.id,
    days: days.map(
      (weekday) =>
        habit?.days.find((d) => d.weekday === weekday) ?? {
          weekday,
          declaredStart: reference?.declaredStart ?? PARAMETERS.habit.timeSlotStarts[slot],
          learnedStart: null,
          location: reference?.location ?? user.profile.place ?? 'gym',
        },
    ),
  });
}

async function saveDays(
  user: UserRecord,
  days: readonly Weekday[],
  deps: TrainingDaysDeps,
): Promise<Reply[]> {
  const previous = user.profile.availableDays;
  if (maskOf(days) === maskOf(previous)) return [settingsMenu(true)];

  const monday = weekStartOf(operationalDate(deps.clock(), user.timezone));
  const nextMonday = addDays(monday, WEEK_DAYS.length);
  // HU-002-4: si la semana en curso aún no se guardó, se guarda con los días de antes.
  await ensureWeek(user, monday, deps);
  await deps.users.updateProfile(user.id, { availableDays: days });
  await saveHabit(user, days, deps);
  await discardWeekIfUnused(user.id, nextMonday, deps);
  const updated = { ...user, profile: { ...user.profile, availableDays: days } };
  const plan = await ensureWeek(updated, nextMonday, deps);
  const training = (plan?.days ?? []).filter((d) => d.session !== null).map((d) => d.date);

  await deps.events.emit(
    'plan_days_changed',
    { userId: user.id, timezone: user.timezone },
    { previousDays: previous.length, days: days.length, trainingDays: training.length },
  );
  const confirmation: Reply = {
    text: renderTemplate('AJ-05', {
      fecha: `${nameOf(nextMonday)} ${Number(nextMonday.slice(-2))}`,
      dias: joinSpanish(training.map(nameOf)),
    }),
    buttons: [],
    edit: true,
  };
  // RN-PLAN-004: si el plan usa menos días de los marcados, se explica.
  return training.length < days.length
    ? [confirmation, plain('ON-12', { dias_entreno: training.length })]
    : [confirmation];
}

/** Botones de ON-10 dentro de `/ajustes`. */
export async function answerTrainingDays(
  user: UserRecord,
  value: string,
  deps: TrainingDaysDeps,
): Promise<Reply[]> {
  if (!user.onboarding.completedAt) return [];
  const toggle = TOGGLE.exec(value);
  const index = Number(toggle?.[2]);
  const toggled = Number(toggle?.[1]);
  if (toggle && toggled < MASK_LIMIT && index < WEEK_DAYS.length) {
    return [screen(toggled ^ (1 << index), true)];
  }
  const mask = Number(SAVE.exec(value)?.[1] ?? MASK_LIMIT);
  if (mask >= MASK_LIMIT) return [trainingDaysScreen(user)];
  const days = daysOf(mask);
  // RN-PLAN-001 (P-074): entre el mínimo y el máximo de días disponibles.
  if (days.length < range.min || days.length > range.max) {
    return [plain('ON-11', rangeVariables)];
  }
  return saveDays(user, days, deps);
}
