import {
  PARAMETERS,
  WEEK_DAYS,
  localParts,
  usualStartTime,
  weekdayOf,
  type LocalTime,
} from '@gymbro/domain';
import type {
  TrainingHabitRecord,
  TrainingHabitsRepository,
  UserRecord,
  WorkoutSessionsRepository,
} from '../ports/repositories.js';

/**
 * RN-MSJ-006 · hora habitual aprendida: con P-049 sesiones de ese día de la semana,
 * la mediana de sus horas de inicio; con menos, null y se usa la declarada. Se
 * guarda en `training_habits.learnedStart` solo cuando cambia.
 */

const pad = (n: number) => String(n).padStart(2, '0');

function localTimeOf(instant: Date, timeZone: string): LocalTime {
  const p = localParts(instant, timeZone);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

export async function refreshLearnedStarts(
  user: UserRecord,
  deps: { habits: TrainingHabitsRepository; workouts: WorkoutSessionsRepository },
): Promise<TrainingHabitRecord | null> {
  const habit = await deps.habits.get(user.id);
  if (!habit) return null;
  const needed = PARAMETERS.messages.usualTimeSessions;
  // En el peor caso entrena todos los días: P-049 semanas de sesiones.
  const recent = await deps.workouts.recentStarted(user.id, needed * WEEK_DAYS.length);
  const days = habit.days.map((day) => {
    const starts = recent
      .filter((s) => weekdayOf(s.date) === day.weekday)
      .slice(0, needed)
      .reverse()
      .map((s) => localTimeOf(s.startedAt, user.timezone));
    const learnedStart = starts.length < needed ? null : usualStartTime(starts, day.declaredStart);
    return learnedStart === day.learnedStart ? day : { ...day, learnedStart };
  });
  if (days.every((d, i) => d === habit.days[i])) return habit;
  const updated = { ...habit, days };
  await deps.habits.save(updated);
  return updated;
}
