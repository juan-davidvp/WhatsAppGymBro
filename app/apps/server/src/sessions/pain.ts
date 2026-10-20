import { EXERCISES, renderTemplate, templateById } from '@gymbro/content';
import {
  alternativeExercise,
  painOutcome,
  replaceCurrentExercise,
  skipExercise,
} from '@gymbro/domain';
import { button, type Button } from '../onboarding/replies.js';
import type { UserRecord, WorkoutSessionRecord } from '../ports/repositories.js';
import { renderCard } from './card.js';
import type { ExtraOperation } from './card-actions.js';
import type { TrainingDeps } from './deps.js';

/**
 * [⚠️ Dolor] de la tarjeta (T-044, HU-003-6, RN-SEG-006): zona (DL-01) → se
 * guarda el dolor, se detiene la progresión de ese ejercicio y se ofrece una
 * variante (CU-04); si el dolor se repite en P-062 sesiones, CU-09 recomienda
 * consulta profesional. Las respuestas de cuidado son plantillas fijas.
 */

/** Zona de cada botón de DL-01, en orden; la operación es `z` + letra. */
const ZONE_KEYS = ['shoulder', 'elbow', 'wrist', 'back', 'hip', 'knee', 'ankle', 'other'] as const;
const zoneOperation = (index: number) => `z${String.fromCharCode(97 + index)}`;

function sessionButton(session: WorkoutSessionRecord, label: string, operation: string): Button {
  return button(label, {
    action: 'ss',
    sessionId: session.id,
    value: `${operation}_${session.rev}`,
  });
}

function currentExerciseCode(session: WorkoutSessionRecord): string | null {
  const cursor = session.progress.cursor;
  return cursor ? (session.progress.exercises[cursor.exercise]?.exerciseCode ?? null) : null;
}

/** DL-01: elegir la zona (edita la tarjeta). */
const askZone: ExtraOperation = (session) => {
  const labels = templateById('DL-01').buttons;
  return Promise.resolve([
    {
      text: renderTemplate('DL-01'),
      buttons: labels.map((label, i) => sessionButton(session, label, zoneOperation(i))),
      rowSize: 2,
      edit: true,
    },
  ]);
};

function zoneHandler(index: number): ExtraOperation {
  return async (session: WorkoutSessionRecord, user: UserRecord, deps: TrainingDeps) => {
    const code = currentExerciseCode(session);
    const zone = ZONE_KEYS[index];
    if (!code || !zone) return [renderCard(session, deps.clock(), true)];
    await deps.painFlags.record({
      userId: user.id,
      exerciseCode: code,
      zone,
      date: session.date,
      sessionId: session.id,
    });
    await deps.events.emit('pain_flagged', { userId: user.id, timezone: user.timezone }, { zone });
    const outcome = painOutcome(await deps.painFlags.sessionsWithPain(user.id, code));
    const careId = outcome.recommendProfessional ? 'CU-09' : 'CU-04';
    const [variantLabel] = templateById(careId).buttons;
    const [, , , , , skipLabel] = templateById('SC-01').buttons;
    return [
      {
        text: renderTemplate(careId),
        buttons: [
          sessionButton(session, variantLabel ?? '', 'alt'),
          sessionButton(session, skipLabel ?? '', 'skip'),
        ],
        edit: true,
      },
    ];
  };
}

/** [Ver variante]: otro ejercicio del mismo patrón y versión; si no hay, el siguiente (DL-02). */
const useVariant: ExtraOperation = async (session, user, deps) => {
  const cursor = session.progress.cursor;
  const current = cursor ? session.progress.exercises[cursor.exercise] : undefined;
  const now = deps.clock();
  if (!current) return [renderCard(session, now, true)];
  const used = session.progress.exercises.map((e) => e.exerciseCode);
  const alternative = alternativeExercise(current.pattern, session.variant, used, EXERCISES);
  const lastLoads = await deps.setEntries.lastLoads(user.id);
  const progress = alternative
    ? replaceCurrentExercise(session.progress, alternative, lastLoads[alternative] ?? 0)
    : skipExercise(session.progress);
  const updated = await deps.workouts.update(session.id, session.rev, { progress });
  if (!updated) return [];
  return [
    renderCard(updated, now, true),
    ...(alternative ? [] : [{ text: renderTemplate('DL-02'), buttons: [], toast: true }]),
  ];
};

export const PAIN_OPERATIONS: Readonly<Record<string, ExtraOperation>> = {
  pain: askZone,
  alt: useVariant,
  ...Object.fromEntries(ZONE_KEYS.map((_, i) => [zoneOperation(i), zoneHandler(i)])),
};

export const PAIN_ZONES = ZONE_KEYS;
