import type { InMemoryOptions } from './in-memory.js';
import { callbackUpdate, sent, setupTestBot, tapData, textUpdate } from './telegram.js';

/** Paso de un recorrido de prueba: tocar un botón por su texto o escribir. */
export type FlowStep = string | { text: string };

/** Bot de prueba con un recorrido ya hecho; `act` sigue tocando o escribiendo. */
export async function runFlow(steps: readonly FlowStep[], options: InMemoryOptions = {}) {
  const setup = setupTestBot(options);
  let updateId = 1;
  const nextUpdateId = () => updateId++;
  const act = async (step: FlowStep) => {
    const update =
      typeof step === 'string'
        ? callbackUpdate(tapData(setup.calls, step), nextUpdateId())
        : textUpdate(step.text, nextUpdateId());
    await setup.bot.handleUpdate(update);
  };
  await act({ text: '/start' });
  for (const step of steps) await act(step);
  const user = () => [...setup.users.values()][0];
  const last = () => sent(setup.calls).at(-1);
  return { ...setup, act, user, last, nextUpdateId };
}

/**
 * Onboarding completo: autoriza, gana músculo, novato, L-X-V por la mañana, gym,
 * 45 min, tamizajes negativos, sin peso. El reloj de prueba es lunes 2026-10-19.
 */
export const ONBOARDED_GYM_LXV: readonly FlowStep[] = [
  'Acepto',
  'Sí',
  'Ganar músculo',
  'Nunca',
  'L',
  'X',
  'V',
  'Listo',
  'Mañana',
  'Gym',
  '45 min',
  'Todo NO',
  'No',
  'No',
  'No',
  'No',
  'No',
  'Prefiero no decirlo',
  'Normal',
  'Me sirve',
];
