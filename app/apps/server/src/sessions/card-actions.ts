import {
  adjustPending,
  confirmCurrent,
  skipExercise,
  undoLast,
  type SessionProgress,
} from '@gymbro/domain';
import { renderTemplate } from '@gymbro/content';
import type { Reply } from '../onboarding/replies.js';
import type { UserRecord, WorkoutSessionRecord } from '../ports/repositories.js';
import { canUndo, renderCard } from './card.js';
import { checkRecord } from './records.js';
import type { TrainingDeps } from './deps.js';

/**
 * Toques de la tarjeta de sesión (T-042, HU-003-1, FR-003-01 a 04). Cada botón trae
 * `<operación>_<rev>`: si la sesión cambió desde que se dibujó la tarjeta (doble
 * toque, botón viejo), no se registra nada y se vuelve a mostrar la tarjeta actual
 * (FR-003-03, SC-003-2).
 */

const ADJUSTMENTS: Readonly<Record<string, { reps?: -1 | 1; load?: -1 | 1 }>> = {
  rm: { reps: -1 },
  rp: { reps: 1 },
  lm: { load: -1 },
  lp: { load: 1 },
};

/** Operaciones que terminan o registran la sesión entera; las atienden T-043 y T-044. */
export type ExtraOperation = (
  session: WorkoutSessionRecord,
  user: UserRecord,
  deps: TrainingDeps,
) => Promise<Reply[]>;

export async function answerSessionCard(
  user: UserRecord,
  sessionId: string,
  value: string,
  deps: TrainingDeps,
  extra: Readonly<Record<string, ExtraOperation>> = {},
): Promise<Reply[]> {
  const match = /^([a-z]+)_(\d+)$/.exec(value);
  const session = await deps.workouts.byId(sessionId);
  if (!match || !session || session.userId !== user.id) return [];
  if (session.status !== 'active') {
    return [{ text: renderTemplate('SC-03'), buttons: [], toast: true }];
  }
  const [, operation = '', revText] = match;
  const now = deps.clock();
  // Tarjeta vieja o doble toque: se muestra la tarjeta actual sin cambiar nada.
  if (Number(revText) !== session.rev) return [renderCard(session, now, true)];

  const extraOperation = extra[operation];
  if (extraOperation) return extraOperation(session, user, deps);

  const subject = { userId: user.id, timezone: user.timezone };
  let progress: SessionProgress = session.progress;
  let changes: Partial<WorkoutSessionRecord> = {};
  const adjustment = ADJUSTMENTS[operation];

  if (adjustment) {
    progress = adjustPending(progress, adjustment);
    changes = { pendingTaps: session.pendingTaps + 1 };
  } else if (operation === 'done') {
    const confirmed = confirmCurrent(progress);
    if (!confirmed.entry) return [renderCard(session, now, true)];
    progress = confirmed.progress;
    changes = { lastConfirmedAt: now, pendingTaps: 0 };
    const updated = await deps.workouts.update(session.id, session.rev, { ...changes, progress });
    if (!updated) return [await latestCard(session.id, deps, now)];
    // RN-ENT-001: la serie se guarda con su clave estable; un reintento no la duplica.
    await deps.setEntries.record({
      userId: user.id,
      sessionId: session.id,
      exerciseCode: confirmed.entry.exerciseCode,
      setIndex: confirmed.entry.setIndex,
      reps: confirmed.entry.reps,
      loadKg: confirmed.entry.loadKg,
      edited: confirmed.entry.edited,
      confirmedAt: now,
    });
    await deps.events.emit('set_confirmed', subject, {
      taps: session.pendingTaps + 1,
      edited: confirmed.entry.edited,
    });
    // HU-003-4: si la serie es récord, se avisa sobre el botón (sin otro mensaje).
    const record = await checkRecord(user, updated, confirmed.entry, deps);
    return [renderCard(updated, now, true), ...(record ? [record] : [])];
  } else if (operation === 'skip') {
    progress = skipExercise(progress);
  } else if (operation === 'undo') {
    if (!canUndo(session, now)) return [renderCard(session, now, true)];
    const undone = undoLast(progress);
    if (!undone.removed) return [renderCard(session, now, true)];
    progress = undone.progress;
    changes = { lastConfirmedAt: null, pendingTaps: 0 };
    const updated = await deps.workouts.update(session.id, session.rev, { ...changes, progress });
    if (!updated) return [await latestCard(session.id, deps, now)];
    await deps.setEntries.remove(session.id, undone.removed.exerciseCode, undone.removed.setIndex);
    await deps.events.emit('set_undone', subject, {});
    return [renderCard(updated, now, true)];
  } else {
    return [renderCard(session, now, true)];
  }

  const updated = await deps.workouts.update(session.id, session.rev, { ...changes, progress });
  return [updated ? renderCard(updated, now, true) : await latestCard(session.id, deps, now)];
}

/** Otro toque ganó la carrera: se muestra el estado guardado. */
async function latestCard(sessionId: string, deps: TrainingDeps, now: Date): Promise<Reply> {
  const latest = await deps.workouts.byId(sessionId);
  return latest
    ? renderCard(latest, now, true)
    : { text: renderTemplate('SC-03'), buttons: [], toast: true };
}
