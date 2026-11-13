import { EXERCISES, LEVELS, proteinBar, renderTemplate, templateById } from '@gymbro/content';
import {
  PARAMETERS,
  addDays,
  goalProgress,
  levelForXp,
  mayAskFor,
  operationalDate,
  strengthHighlights,
  weightMovingAverage,
  type ExerciseLog,
  type LocalDate,
} from '@gymbro/domain';
import type { CallbackAction } from '../bot/callback-data.js';
import type { EventEmitter } from '../events/emitter.js';
import { button, type Reply } from '../onboarding/replies.js';
import type {
  AchievementsRepository,
  BodyMeasurementsRepository,
  ConsentsRepository,
  GoalRecord,
  GoalsRepository,
  PersonalRecordsRepository,
  SetEntriesRepository,
  StreakStatesRepository,
  UserRecord,
  WeeksRepository,
  XpLedgerRepository,
} from '../ports/repositories.js';
import { exerciseName } from '../sessions/card.js';

/**
 * `/progreso` y `📈 Progreso` (T-081, HU-006-2, RN-OBJ-010, RN-OBJ-011): días que
 * cuentan, racha y nivel; la barra del objetivo si tiene meta; el Reto 66; la media
 * móvil del peso; y el 1RM estimado por patrón. En el modo sin números no hay peso
 * ni barra de un objetivo de peso (FR-006-05).
 */

export interface ProgressDeps {
  streaks: StreakStatesRepository;
  xp: XpLedgerRepository;
  goals: GoalsRepository;
  weeks: WeeksRepository;
  bodyMeasurements: BodyMeasurementsRepository;
  consents: ConsentsRepository;
  setEntries: SetEntriesRepository;
  records: PersonalRecordsRepository;
  achievements: AchievementsRepository;
  events: EventEmitter;
  clock: () => Date;
}

export const pg = (value: string): CallbackAction => ({ action: 'pg', value });

/** "72,5": una cifra decimal con coma (PG-06, PG-09, PG-11). */
export function formatKg(kg: number): string {
  return kg.toFixed(1).replace('.', ',');
}

/** RN-DAT-001 y FR-006-05: se puede pedir y mostrar el peso. */
export async function showsWeight(user: UserRecord, deps: ProgressDeps): Promise<boolean> {
  if (user.settings.numberFreeMode) return false;
  return mayAskFor('body_measurements', await deps.consents.grantedCategories(user.id));
}

/** RN-OBJ-010: media móvil del peso de hoy (null con menos de los registros mínimos). */
export async function movingAverageToday(
  user: UserRecord,
  today: LocalDate,
  deps: ProgressDeps,
): Promise<number | null> {
  const from = addDays(today, -(PARAMETERS.goal.movingAverageDays.days - 1));
  const weights = await deps.bodyMeasurements.weightsSince(user.id, from);
  return weightMovingAverage(weights, today);
}

/** RN-OBJ-011: línea del objetivo, solo si tiene meta (y sin peso en el modo sin números). */
async function goalLine(
  user: UserRecord,
  goal: GoalRecord | null,
  today: LocalDate,
  withWeight: boolean,
  deps: ProgressDeps,
): Promise<string | null> {
  // En mantenimiento no hay meta que avanzar (la zona se muestra en GO-04/GO-10).
  if (!goal || goal.type === 'maintain') return null;
  if (goal.startValue === null || goal.targetValue === null) return null;
  const { startValue, targetValue } = goal;
  if (goal.metric === 'fulfilled_weeks') {
    const fulfilled = (await deps.weeks.list(user.id)).filter(
      (w) => w.fulfilled && w.weekStart >= goal.startDate,
    ).length;
    const pct = goalProgress({ startValue, targetValue, currentValue: fulfilled }) ?? 0;
    return renderTemplate('PG-03', {
      barra: proteinBar(pct / 100),
      semanas: fulfilled,
      meta: targetValue,
    });
  }
  if (goal.metric !== 'weight_kg' || !withWeight) return null;
  const current = await movingAverageToday(user, today, deps);
  const pct = goalProgress({ startValue, targetValue, currentValue: current });
  if (pct === null) return null;
  return renderTemplate('PG-02', { barra: proteinBar(pct / 100), porcentaje: Math.round(pct) });
}

/** RN-OBJ-010: media móvil o "datos insuficientes" (SPEC-006 §8). */
async function weightLine(user: UserRecord, today: LocalDate, deps: ProgressDeps): Promise<string> {
  const { days, minEntries } = PARAMETERS.goal.movingAverageDays;
  const average = await movingAverageToday(user, today, deps);
  return average === null
    ? renderTemplate('PG-07', { minimo: minEntries, dias: days })
    : renderTemplate('PG-06', { dias: days, peso: formatKg(average) });
}

/** HU-006-2 (PO, 2026-11-11): un ejercicio por patrón con su mejor 1RM estimado. */
async function strengthLine(user: UserRecord, deps: ProgressDeps): Promise<string | null> {
  const codes = Object.keys(await deps.setEntries.lastLoads(user.id));
  const logs: ExerciseLog[] = [];
  for (const code of codes) {
    const pattern = EXERCISES.find((e) => e.code === code)?.pattern;
    if (!pattern) continue;
    logs.push({ code, pattern, sets: await deps.setEntries.exerciseHistory(user.id, code) });
  }
  const highlights = strengthHighlights(logs);
  if (highlights.length === 0) return null;
  const lista = highlights
    .map((h) => `${exerciseName(h.code)} ${Math.round(h.e1rmKg)} kg`)
    .join(' · ');
  return renderTemplate('PG-08', { lista });
}

/** PG-01 con sus líneas, en el orden de la nota de §2.7. */
export async function progressScreen(
  user: UserRecord,
  deps: ProgressDeps,
  edit = false,
): Promise<Reply> {
  const today = operationalDate(deps.clock(), user.timezone);
  const state = (await deps.streaks.get(user.id))?.state;
  const total = state?.counted.total ?? 0;
  const level = levelForXp(await deps.xp.total(user.id));
  const withWeight = await showsWeight(user, deps);
  const challengeDays = PARAMETERS.challenge66.chapters.at(-1) ?? 0;

  const lines = [
    renderTemplate('PG-01', {
      dias_que_cuentan: total,
      racha: state?.streak.current ?? 0,
      nivel: level,
      nombre_nivel: LEVELS[level - 1]?.name ?? '',
    }),
    await goalLine(user, await deps.goals.active(user.id), today, withWeight, deps),
    total >= challengeDays
      ? renderTemplate('PG-05')
      : renderTemplate('PG-04', { dias: total, meta: challengeDays }),
    withWeight ? await weightLine(user, today, deps) : null,
    await strengthLine(user, deps),
  ].filter((line): line is string => line !== null);

  const [register = '', logbook = ''] = templateById('PG-01').buttons;
  await deps.events.emit('progress_viewed', { userId: user.id, timezone: user.timezone }, {});
  return {
    text: lines.join('\n'),
    buttons: [...(withWeight ? [button(register, pg('w'))] : []), button(logbook, pg('log'))],
    rowSize: 2,
    ...(edit ? { edit } : {}),
  };
}
