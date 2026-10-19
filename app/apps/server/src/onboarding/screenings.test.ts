import {
  PARQ_FORM_URL,
  renderFoodBodyPositive,
  renderPreActivityPrompt,
  templateById,
} from '@gymbro/content';
import type { OnboardingStep } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { encodeCallbackData } from '../bot/callback-data.js';
import { callbackUpdate, sent, startAnd, tapData, textUpdate } from '../testing/telegram.js';

/** Onboarding con la privacidad ya decidida y el usuario puesto en `step`. */
async function atStep(step: OnboardingStep, privacy: 'Acepto' | 'No acepto' = 'Acepto') {
  const setup = await startAnd(privacy, 'Sí');
  const user = () => [...setup.users.values()][0];
  await setup.deps.users.setOnboardingStep(user()?.id ?? '', step);
  await setup.bot.handleUpdate(textUpdate('/start', setup.nextUpdateId()));
  const tap = (label: string) =>
    setup.bot.handleUpdate(callbackUpdate(tapData(setup.calls, label), setup.nextUpdateId()));
  return { ...setup, user, tap };
}

/** Responde las 5 preguntas del SCOFF en orden. */
async function answerScoff(tap: (label: string) => Promise<void>, answers: ('Sí' | 'No')[]) {
  for (const answer of answers) await tap(answer);
}

describe('RN-SEG-001 · HU-009-2 · T-031 · mayoría de edad', () => {
  it('Sí: confirma la mayoría de edad (sin fecha de nacimiento) y sigue', async () => {
    const { users, events } = await startAnd('Acepto', 'Sí');
    const user = [...users.values()][0];
    expect(user?.isAdultConfirmedAt).toBeInstanceOf(Date);
    expect(user?.onboarding.step).toBe('goal');
    expect(events.map((e) => e.props)).toContainEqual({ step: 'age' });
  });

  it('No: cierre amable, no se crea el perfil y el evento queda sin seudónimo', async () => {
    const { calls, users, consents, events } = await startAnd('Acepto', 'No');
    expect(sent(calls).at(-1)?.text).toBe(templateById('ON-04').text);
    expect(users.size).toBe(0);
    expect(consents).toEqual([]);
    expect(events.find((e) => e.name === 'age_gate_failed')?.subject).toBeNull();
    expect(events.every((e) => e.subject === null)).toBe(true);
  });
});

describe('RN-SEG-002 · HU-009-2 · T-031 · tamizaje previo a la actividad (PAR-Q+ por enlace)', () => {
  it('la pregunta enlaza al PAR-Q+ oficial y no copia sus preguntas (F97)', async () => {
    const { calls } = await atStep('pre_activity_screening');
    const last = sent(calls).at(-1);
    expect(last?.text).toBe(renderPreActivityPrompt());
    expect(last?.text).toContain(PARQ_FORM_URL);
    expect(last?.buttons.map((b) => b.text)).toEqual(['Todo NO', 'Algún SÍ', 'No lo hice']);
  });

  it('Todo NO: plan normal, se guarda clear y sigue al tamizaje de comida', async () => {
    const { tap, user, screenings, calls } = await atStep('pre_activity_screening');
    await tap('Todo NO');
    expect(user()?.settings.lowIntensityStart).toBe(false);
    expect(screenings.map((s) => [s.type, s.result])).toEqual([['pre_activity', 'clear']]);
    expect(user()?.onboarding.step).toBe('food_body_screening');
    expect(sent(calls).at(-2)?.text).toBe(templateById('TZ-05').text);
  });

  it('Algún SÍ: recomienda consulta, arranca suave y ofrece [Ya tengo autorización]', async () => {
    const { tap, user, screenings, calls } = await atStep('pre_activity_screening');
    await tap('Algún SÍ');
    expect(user()?.settings.lowIntensityStart).toBe(true);
    expect(screenings.map((s) => s.result)).toEqual(['flag']);
    expect(sent(calls).some((m) => m.text === templateById('TZ-02').text)).toBe(true);
  });

  it('[Ya tengo autorización] quita el arranque suave, también después del paso', async () => {
    const { tap, user, calls } = await atStep('pre_activity_screening');
    await tap('Algún SÍ');
    await tap('Ya tengo autorización');
    expect(user()?.settings.lowIntensityStart).toBe(false);
    expect(sent(calls).at(-1)?.text).toBe(templateById('TZ-04').text);
  });

  it('No lo hice: arranca suave sin guardar resultado; puede contarlo después', async () => {
    const { tap, user, screenings, events } = await atStep('pre_activity_screening');
    await tap('No lo hice');
    expect(user()?.settings.lowIntensityStart).toBe(true);
    expect(screenings).toEqual([]);
    expect(events.at(-2)?.props).toEqual({ type: 'pre_activity', result: 'not_done' });
    await tap('Todo NO');
    expect(user()?.settings.lowIntensityStart).toBe(false);
    expect(screenings.map((s) => s.result)).toEqual(['clear']);
  });
});

describe('RN-SEG-003 · HU-009-3 · T-031 · SCOFF', () => {
  it('2 o más "sí" (P-082): modo sin números, recursos de ayuda y evento', async () => {
    const { tap, user, calls, screenings, events } = await atStep('food_body_screening');
    await answerScoff(tap, ['No', 'Sí', 'No', 'Sí', 'No']);
    expect(user()?.settings.numberFreeMode).toBe(true);
    expect(sent(calls).some((m) => m.text === renderFoodBodyPositive())).toBe(true);
    expect(screenings.map((s) => [s.type, s.result])).toEqual([['food_body', 'flag']]);
    expect(events.map((e) => e.name)).toContain('number_free_mode_enabled');
    expect(user()?.onboarding.step).not.toBe('food_body_screening');
  });

  it('1 "sí": negativo, sin modo sin números ni mensaje', async () => {
    const { tap, user, calls, screenings } = await atStep('food_body_screening');
    await answerScoff(tap, ['Sí', 'No', 'No', 'No', 'No']);
    expect(user()?.settings.numberFreeMode).toBe(false);
    expect(sent(calls).some((m) => m.text === renderFoodBodyPositive())).toBe(false);
    expect(screenings.map((s) => s.result)).toEqual(['clear']);
  });

  it('las 5 preguntas llegan en orden, 1 toque cada una', async () => {
    const { tap, calls } = await atStep('food_body_screening');
    await answerScoff(tap, ['No', 'No', 'No', 'No']);
    const texts = sent(calls).map((m) => m.text);
    for (const id of ['TZ-06', 'TZ-07', 'TZ-08', 'TZ-09', 'TZ-10']) {
      expect(texts).toContain(templateById(id).text);
    }
  });

  it('minimización: no se guardan las respuestas; los eventos solo llevan tipo y resultado', async () => {
    const { tap, screenings, events } = await atStep('food_body_screening');
    await answerScoff(tap, ['Sí', 'Sí', 'No', 'No', 'No']);
    expect(Object.keys(screenings[0] ?? {}).sort()).toEqual(['at', 'result', 'type', 'userId']);
    expect(events.find((e) => e.name === 'screening_completed')?.props).toEqual({
      type: 'food_body',
      result: 'flag',
    });
  });

  it('un botón alterado (más "sí" previos que preguntas) repite el tamizaje desde el inicio', async () => {
    const { bot, calls, user, nextUpdateId } = await atStep('food_body_screening');
    await bot.handleUpdate(
      callbackUpdate(
        encodeCallbackData({ action: 'ob', step: 'food_body_screening', value: 'q2_3_y' }),
        nextUpdateId(),
      ),
    );
    expect(sent(calls).at(-1)?.text).toBe(templateById('TZ-06').text);
    expect(user()?.settings.numberFreeMode).toBe(false);
  });
});

describe('RN-DAT-001 · T-031 · sin autorización', () => {
  it('el resultado del PAR-Q+ no se guarda, pero su consecuencia de seguridad sí', async () => {
    const { tap, user, screenings, events } = await atStep('pre_activity_screening', 'No acepto');
    await tap('Algún SÍ');
    expect(screenings).toEqual([]);
    expect(user()?.settings.lowIntensityStart).toBe(true);
    expect(events.map((e) => e.name)).toContain('screening_completed');
  });

  it('el tamizaje de comida se salta', async () => {
    const { tap, user } = await atStep('pre_activity_screening', 'No acepto');
    await tap('Todo NO');
    expect(user()?.onboarding.step).not.toBe('food_body_screening');
  });
});
