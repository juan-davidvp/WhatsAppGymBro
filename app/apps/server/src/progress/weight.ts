import { renderTemplate, templateById, weightStepLabel } from '@gymbro/content';
import { PARAMETERS, isPlausibleWeightKg, operationalDate, stepWeight } from '@gymbro/domain';
import { parseNumber } from '../onboarding/profile-steps.js';
import { button, type Reply } from '../onboarding/replies.js';
import type { UserRecord } from '../ports/repositories.js';
import { formatKg, pg, progressScreen, showsWeight, type ProgressDeps } from './progress-screen.js';

/**
 * Registrar el peso desde `/progreso` (T-081, HU-006-2, RN-OBJ-010, RN-OBJ-012).
 * Decisión del PO (2026-11-11, constitución II): con botones desde el último peso
 * (pasos de P-100); solo el primero se escribe, respondiendo a PG-10. El peso
 * viaja en el botón en unidades del paso menor, así que no hay estado guardado.
 * Guardar recalcula la media móvil y la meta de proteína (que leen el último peso).
 */

const STEPS = PARAMETERS.progress.weightStepsKg;
const UNIT = Math.min(...STEPS);
const WEIGHT_VALUE = /^[ws](\d{1,5})$/;

const toUnits = (kg: number) => Math.round(kg / UNIT);
const fromUnits = (units: number) => stepWeight(units * UNIT, 0);

/** PG-09: el peso actual con [−0,5] [−0,1] [+0,1] [+0,5] y [Guardar]. */
function stepper(kg: number, edit: boolean): Reply {
  const deltas = [
    ...STEPS.map((s) => -s).sort((a, b) => a - b),
    ...[...STEPS].sort((a, b) => a - b),
  ];
  const [save = ''] = templateById('PG-09').buttons;
  return {
    text: renderTemplate('PG-09', { peso: formatKg(kg) }),
    buttons: [
      ...deltas.map((d) => button(weightStepLabel(d), pg(`w${toUnits(stepWeight(kg, d))}`))),
      button(save, pg(`s${toUnits(kg)}`)),
    ],
    layout: [deltas.length, 1],
    ...(edit ? { edit } : {}),
  };
}

/** PG-10: sin ningún peso todavía, se escribe respondiendo a este mensaje. */
const askForWeight = (): Reply => ({
  text: renderTemplate('PG-10'),
  buttons: [],
  forceReply: true,
});

/** [Registrar peso]: el teclado desde el último peso, o PG-10 si no hay ninguno. */
export async function weightPrompt(user: UserRecord, deps: ProgressDeps): Promise<Reply[]> {
  if (!(await showsWeight(user, deps))) return [await progressScreen(user, deps, true)];
  const latest = await deps.bodyMeasurements.latestWeightKg(user.id);
  return [latest === null ? askForWeight() : stepper(latest, true)];
}

async function save(user: UserRecord, kg: number, deps: ProgressDeps): Promise<void> {
  const date = operationalDate(deps.clock(), user.timezone);
  await deps.bodyMeasurements.recordWeight(user.id, date, kg);
  await deps.events.emit(
    'weight_logged',
    { userId: user.id, timezone: user.timezone },
    { source: 'progress' },
  );
}

/** Botones de PG-09: `w<unidades>` mueve el peso; `s<unidades>` lo guarda. */
export async function answerWeightButton(
  user: UserRecord,
  value: string,
  deps: ProgressDeps,
): Promise<Reply[]> {
  const match = WEIGHT_VALUE.exec(value);
  const kg = match ? fromUnits(Number(match[1])) : NaN;
  if (!(await showsWeight(user, deps)) || !isPlausibleWeightKg(kg)) {
    return [await progressScreen(user, deps, true)];
  }
  if (value.startsWith('w')) return [stepper(kg, true)];
  await save(user, kg, deps);
  return [
    { text: renderTemplate('PG-11', { peso: formatKg(kg) }), buttons: [], toast: true },
    await progressScreen(user, deps, true),
  ];
}

/** Respuesta escrita a PG-10 (o a PG-12): un peso válido se guarda; si no, PG-12. */
export async function answerWeightText(
  user: UserRecord,
  text: string,
  deps: ProgressDeps,
): Promise<Reply[]> {
  if (!(await showsWeight(user, deps))) return [await progressScreen(user, deps)];
  const kg = parseNumber(text);
  if (kg === null || !isPlausibleWeightKg(kg)) {
    return [{ text: renderTemplate('PG-12'), buttons: [], forceReply: true }];
  }
  await save(user, kg, deps);
  return [
    { text: renderTemplate('PG-11', { peso: formatKg(kg) }), buttons: [] },
    await progressScreen(user, deps),
  ];
}

/** ¿Es este mensaje del bot el que pide escribir el peso (PG-10 o PG-12)? */
export function isWeightRequest(botText: string | undefined): boolean {
  return botText === renderTemplate('PG-10') || botText === renderTemplate('PG-12');
}
