import { SESSION_NAMES, renderTemplate, templateById } from '@gymbro/content';
import {
  operationalDate,
  startProgress,
  type LocalDate,
  type SessionExercise,
  type SessionVariant,
} from '@gymbro/domain';
import { button, type Reply } from '../onboarding/replies.js';
import { currentWeek } from '../plans/weekly-plan.js';
import type { StoredPlanDay, UserRecord } from '../ports/repositories.js';
import { renderCard } from './card.js';
import type { TrainingDeps } from './deps.js';

/** Inicio de una sesión desde Hoy (HU-002-2): versión elegida → tarjeta de la primera serie. */

export const VARIANT_BY_VALUE: Readonly<Record<string, SessionVariant>> = {
  gym: 'GYM',
  home: 'HOME',
  express: 'EXPRESS',
};

export function today(user: UserRecord, deps: TrainingDeps): LocalDate {
  return operationalDate(deps.clock(), user.timezone);
}

/** Día de hoy en el plan guardado (null si no hay plan). */
export async function planDayToday(
  user: UserRecord,
  deps: TrainingDeps,
): Promise<StoredPlanDay | null> {
  const week = await currentWeek(user, deps);
  const date = today(user, deps);
  return week?.days.find((d) => d.date === date) ?? null;
}

/**
 * HU-002-2: abre la versión elegida. Si ya hay una sesión abierta hoy, pregunta
 * si continuar o abrir otra (SPEC-003 §8) salvo que `forceNew` venga de [Nueva].
 */
export async function startSession(
  user: UserRecord,
  variant: SessionVariant,
  deps: TrainingDeps,
  forceNew = false,
): Promise<Reply[]> {
  const date = today(user, deps);
  const active = await deps.workouts.activeOn(user.id, date);
  if (active && !forceNew) {
    const [resume, fresh] = templateById('SC-04').buttons;
    return [
      {
        text: renderTemplate('SC-04', { sesion: SESSION_NAMES[active.template] }),
        buttons: [
          button(resume ?? '', { action: 'td', value: 'resume' }),
          button(fresh ?? '', { action: 'td', value: `new_${variant.toLowerCase()}` }),
        ],
      },
    ];
  }
  const day = await planDayToday(user, deps);
  if (!day?.session) return [];
  if (active)
    await deps.workouts.update(active.id, active.rev, {
      status: 'abandoned',
      endedAt: deps.clock(),
    });

  const exercises: SessionExercise[] = day.session.versions[variant].exercises.map((e) => ({
    exerciseCode: e.exerciseCode,
    pattern: e.pattern,
    sets: e.sets,
    targetReps: e.targetReps,
    loadKg: e.loadKg,
  }));
  const session = await deps.workouts.create({
    userId: user.id,
    date,
    plannedSessionId: day.session.id,
    template: day.session.template,
    variant,
    status: 'active',
    startedAt: deps.clock(),
    endedAt: null,
    loggedAsPlanned: false,
    progress: startProgress(exercises),
    lastConfirmedAt: null,
    pendingTaps: 0,
  });
  const subject = { userId: user.id, timezone: user.timezone };
  await deps.events.emit('session_variant_chosen', subject, { variant });
  await deps.events.emit('session_started', subject, { variant });
  return [renderCard(session, deps.clock())];
}

/** Sesión abierta de hoy, para retomarla (Hoy o [Continuar la anterior]). */
export async function resumeSession(user: UserRecord, deps: TrainingDeps): Promise<Reply[]> {
  const active = await deps.workouts.activeOn(user.id, today(user, deps));
  return active ? [renderCard(active, deps.clock())] : [];
}
