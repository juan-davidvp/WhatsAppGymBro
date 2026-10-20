import { EXERCISES, renderTemplate, templateById } from '@gymbro/content';
import {
  PARAMETERS,
  WEEK_DAYS,
  addDays,
  alternateGoal,
  alternativeExercise,
  bestOfSession,
  plateauStrategy,
  repRangeFor,
  weekStartOf,
  type PlateauStrategy,
} from '@gymbro/domain';
import { button, plain, type Reply } from '../onboarding/replies.js';
import type { UserRecord, WorkoutSessionRecord } from '../ports/repositories.js';
import { exerciseName } from './card.js';
import type { TrainingDeps } from './deps.js';

/**
 * Estancamiento (T-044, HU-003-5 escenario 2, RN-ENT-003 `[VALIDAR-PROFESIONAL]`):
 * al terminar una sesión, si un ejercicio lleva P-022 sesiones sin mejorar su
 * marca, ES-01 propone variante, rango o semana suave. La elección se aplica desde
 * el plan de la semana siguiente; nunca resta XP ni toca la racha.
 */

const STRATEGY_BY_LETTER: Readonly<Record<string, PlateauStrategy>> = {
  r: 'range',
  v: 'variant',
  d: 'deload',
};
/** Botones de ES-01, por su texto en la bóveda. */
const LETTER_BY_LABEL: Readonly<Record<string, string>> = {
  'Cambiar rango': 'r',
  'Cambiar variante': 'v',
  'Semana suave': 'd',
};

const nextWeekOf = (session: WorkoutSessionRecord) =>
  addDays(weekStartOf(session.date), WEEK_DAYS.length);

async function isStalled(userId: string, code: string, deps: TrainingDeps): Promise<boolean> {
  const bySession = new Map<string, { reps: number; loadKg: number }[]>();
  for (const set of await deps.setEntries.exerciseHistory(userId, code)) {
    bySession.set(set.sessionId, [...(bySession.get(set.sessionId) ?? []), set]);
  }
  return plateauStrategy([...bySession.values()].map(bestOfSession)) !== null;
}

/** ES-01 para el primer ejercicio estancado de la sesión que no tenga ya una estrategia. */
export async function plateauPrompt(
  sessionId: string,
  user: UserRecord,
  deps: TrainingDeps,
): Promise<Reply[]> {
  const session = await deps.workouts.byId(sessionId);
  if (!session) return [];
  const chosen = new Set((await deps.adjustments.list(user.id)).map((a) => a.exerciseCode));
  for (const [index, exercise] of session.progress.exercises.entries()) {
    if (chosen.has(exercise.exerciseCode)) continue;
    if (!(await isStalled(user.id, exercise.exerciseCode, deps))) continue;
    await deps.events.emit('plateau_detected', { userId: user.id, timezone: user.timezone }, {});
    return [
      {
        text: renderTemplate('ES-01', {
          ejercicio: exerciseName(exercise.exerciseCode),
          sesiones: PARAMETERS.training.plateauSessions,
        }),
        buttons: templateById('ES-01').buttons.map((label) =>
          button(label, {
            action: 'pt',
            sessionId: session.id,
            value: `${LETTER_BY_LABEL[label] ?? ''}${index}`,
          }),
        ),
      },
    ];
  }
  return [];
}

/** Estrategia elegida en ES-01: se guarda y se confirma (ES-02 a ES-05). */
export async function answerPlateau(
  user: UserRecord,
  sessionId: string,
  value: string,
  deps: TrainingDeps,
): Promise<Reply[]> {
  const match = /^([rvd])(\d+)$/.exec(value);
  const session = await deps.workouts.byId(sessionId);
  const exercise = match ? session?.progress.exercises[Number(match[2])] : undefined;
  const strategy = match ? STRATEGY_BY_LETTER[match[1] ?? ''] : undefined;
  if (!session || session.userId !== user.id || !exercise || !strategy) return [];
  const name = exerciseName(exercise.exerciseCode);
  const fromWeek = nextWeekOf(session);
  const goal = user.profile.goalType ?? 'consistency';

  let replacementCode: string | null = null;
  let reply: Reply;
  if (strategy === 'variant') {
    replacementCode = alternativeExercise(
      exercise.pattern,
      session.variant,
      [exercise.exerciseCode],
      EXERCISES,
    );
    if (!replacementCode) return [plain('ES-05', { ejercicio: name })];
    reply = plain('ES-02', { ejercicio: name, nuevo: exerciseName(replacementCode) });
  } else if (strategy === 'range') {
    const range = repRangeFor(alternateGoal(goal), exercise.pattern, session.variant);
    reply = plain('ES-03', { ejercicio: name, min: range.min, max: range.max });
  } else {
    const sets = Math.max(1, exercise.sets - PARAMETERS.training.deloadSetReduction);
    reply = plain('ES-04', { ejercicio: name, series: sets });
  }

  const existing = await deps.adjustments.list(user.id);
  if (!existing.some((a) => a.exerciseCode === exercise.exerciseCode && a.fromWeek === fromWeek)) {
    await deps.adjustments.save(user.id, {
      exerciseCode: exercise.exerciseCode,
      strategy,
      fromWeek,
      replacementCode,
    });
    // La semana siguiente, si ya estaba generada y sin usar, se rehace con la estrategia.
    const usedNextWeek = (
      await Promise.all(
        WEEK_DAYS.map((_, i) => deps.workouts.onDate(user.id, addDays(fromWeek, i))),
      )
    ).some((list) => list.length > 0);
    if (!usedNextWeek) await deps.plans.discardWeek(user.id, fromWeek);
  }
  return [reply];
}
