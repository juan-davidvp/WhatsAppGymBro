import { EXERCISES, SESSION_NAMES, renderTemplate, templateById } from '@gymbro/content';
import { PARAMETERS, plannedSetCount } from '@gymbro/domain';
import type { CallbackAction } from '../bot/callback-data.js';
import { button, type Button, type Reply } from '../onboarding/replies.js';
import type { WorkoutSessionRecord } from '../ports/repositories.js';

/**
 * Tarjeta de sesión (SPEC-003 HU-003-1, FR-003-01): un solo mensaje que se edita
 * en cada toque. Cada botón lleva el id de la sesión y la versión del estado
 * (`<operación>_<rev>`): un toque de una tarjeta vieja no cambia nada.
 */

/** Operaciones de la tarjeta, por el texto del botón en SC-01, SC-02 y la nota de §2.4. */
const OPERATION_BY_LABEL: Readonly<Record<string, string>> = {
  '✅ Hecha': 'done',
  '−1 rep': 'rm',
  '+1 rep': 'rp',
  '−kg': 'lm',
  '+kg': 'lp',
  '⏭️ Siguiente ejercicio': 'skip',
  '⚠️ Dolor': 'pain',
  '🏁 Terminar': 'finish',
};
const UNDO_LABEL = '↩️ Deshacer';
const AS_PLANNED_LABEL = 'La hice tal cual';

export function exerciseName(code: string): string {
  return EXERCISES.find((e) => e.code === code)?.name ?? code;
}

/** "42,5 kg" o "peso corporal". */
export function formatLoad(loadKg: number): string {
  return loadKg > 0 ? `${String(loadKg).replace('.', ',')} kg` : 'peso corporal';
}

function sessionButton(session: WorkoutSessionRecord, label: string, operation: string): Button {
  const action: CallbackAction = {
    action: 'ss',
    sessionId: session.id,
    value: `${operation}_${session.rev}`,
  };
  return button(label, action);
}

/** ¿Se puede deshacer todavía la última serie? (FR-003-04, P-090) */
export function canUndo(session: WorkoutSessionRecord, now: Date): boolean {
  if (!session.lastConfirmedAt || session.progress.logged.length === 0) return false;
  const elapsed = now.getTime() - session.lastConfirmedAt.getTime();
  return elapsed <= PARAMETERS.training.undoWindowSeconds * 1000;
}

export function renderCard(session: WorkoutSessionRecord, now: Date, edit = false): Reply {
  const { progress } = session;
  const done = progress.logged.length;
  const undo = canUndo(session, now) ? [sessionButton(session, UNDO_LABEL, 'undo')] : [];

  if (!progress.cursor) {
    const [finish] = templateById('SC-02').buttons;
    return {
      text: renderTemplate('SC-02', { hechas: done, sesion: SESSION_NAMES[session.template] }),
      buttons: [...undo, sessionButton(session, finish ?? '', 'finish')],
      edit,
    };
  }

  const exercise = progress.exercises[progress.cursor.exercise];
  const hasLoad = (exercise?.loadKg ?? 0) > 0 || progress.pending.loadKg > 0;
  const labels = templateById('SC-01').buttons.filter(
    (label) => hasLoad || (label !== '−kg' && label !== '+kg'),
  );
  const cardButtons = labels.map((label) =>
    sessionButton(session, label, OPERATION_BY_LABEL[label] ?? ''),
  );
  const [doneButton, ...rest] = cardButtons;
  const asPlanned = done === 0 ? [sessionButton(session, AS_PLANNED_LABEL, 'asis')] : [];
  const adjustments = rest.slice(0, hasLoad ? 4 : 2);
  const others = rest.slice(hasLoad ? 4 : 2);
  return {
    text: renderTemplate('SC-01', {
      ejercicio: exerciseName(exercise?.exerciseCode ?? ''),
      serie: progress.cursor.set + 1,
      series: exercise?.sets ?? 0,
      reps: progress.pending.reps,
      carga: formatLoad(progress.pending.loadKg),
      hechas: done,
      total: plannedSetCount(progress),
    }),
    buttons: [
      ...(doneButton ? [doneButton] : []),
      ...undo,
      ...adjustments,
      ...others,
      ...asPlanned,
    ],
    layout: [
      1 + undo.length,
      ...(hasLoad ? [2, 2] : [2]),
      ...others.map(() => 1),
      ...asPlanned.map(() => 1),
    ],
    edit,
  };
}
