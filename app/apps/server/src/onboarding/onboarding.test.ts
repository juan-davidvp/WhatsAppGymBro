import { PRIVACY_POLICY_VERSION, renderTemplate, templateById } from '@gymbro/content';
import { CONSENT_CATEGORIES, PARAMETERS } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { encodeCallbackData, parseCallbackData } from '../bot/callback-data.js';
import { callbackUpdate, setupTestBot, textUpdate, type ApiCall } from '../testing/telegram.js';

interface Sent {
  text: string;
  buttons: { text: string; callback_data: string }[];
}

function sent(calls: ApiCall[]): Sent[] {
  return calls
    .filter((c) => c.method === 'sendMessage')
    .map((c) => ({
      text: String(c.payload['text']),
      buttons: (
        (
          c.payload['reply_markup'] as
            { inline_keyboard: { text: string; callback_data: string }[][] } | undefined
        )?.inline_keyboard ?? []
      ).flat(),
    }));
}

/** Toca el botón con ese texto del último mensaje que lo tenga. */
function tapData(calls: ApiCall[], label: string): string {
  const button = sent(calls)
    .flatMap((m) => m.buttons)
    .findLast((b) => b.text === label);
  if (!button) throw new Error(`No hay botón ${label}`);
  return button.callback_data;
}

async function startAnd(...labels: string[]) {
  const setup = setupTestBot();
  let updateId = 1;
  await setup.bot.handleUpdate(textUpdate('/start', updateId++));
  for (const label of labels) {
    await setup.bot.handleUpdate(callbackUpdate(tapData(setup.calls, label), updateId++));
  }
  return { ...setup, nextUpdateId: () => updateId++ };
}

const policyText = renderTemplate('PV-01', { horas_borrado: PARAMETERS.data.deletionMaxHours });

describe('HU-009-1 · RN-DAT-002 · T-030 · aviso de privacidad al empezar', () => {
  it('/start → bienvenida y aviso con [Acepto] [Ver política] [No acepto]', async () => {
    const { calls, events } = await startAnd();
    const messages = sent(calls);
    expect(messages.map((m) => m.text)).toEqual([
      templateById('ON-01').text,
      templateById('ON-02').text,
    ]);
    expect(messages[1]?.buttons.map((b) => b.text)).toEqual([
      'Acepto',
      'Ver política',
      'No acepto',
    ]);
    expect(events.map((e) => e.name)).toEqual(['onboarding_started']);
  });

  it('el aviso cabe en ≤ 5 líneas (HU-009-1, escenario 1)', () => {
    expect(templateById('ON-02').text.split('\n').length).toBeLessThanOrEqual(5);
  });

  it('[Ver política] → política provisional con el plazo de borrado P-065; sigue en privacidad', async () => {
    const { calls, users } = await startAnd('Ver política');
    const policy = sent(calls).at(-1);
    expect(policy?.text).toBe(policyText);
    expect(policy?.buttons.map((b) => b.text)).toEqual(['Acepto', 'No acepto']);
    expect([...users.values()][0]?.onboarding.step).toBe('privacy');
  });

  it('desde la política también se puede aceptar', async () => {
    const { consents, users } = await startAnd('Ver política', 'Acepto');
    expect(consents.filter((c) => c.granted)).toHaveLength(CONSENT_CATEGORIES.length);
    expect([...users.values()][0]?.onboarding.step).toBe('age');
  });
});

describe('RN-DAT-001 · T-030 · aceptar', () => {
  it('guarda la autorización de cada categoría con la versión de la política y pregunta la edad', async () => {
    const { calls, consents, events, users } = await startAnd('Acepto');
    expect(consents.map((c) => [c.category, c.granted, c.policyVersion])).toEqual(
      CONSENT_CATEGORIES.map((category) => [category, true, PRIVACY_POLICY_VERSION]),
    );
    expect(sent(calls).at(-1)?.text).toBe(templateById('ON-03').text);
    expect([...users.values()][0]?.onboarding.step).toBe('age');
    expect(events.map((e) => [e.name, e.props])).toEqual([
      ['onboarding_started', {}],
      ['consent_given', { categories: [...CONSENT_CATEGORIES] }],
      ['onboarding_step_completed', { step: 'privacy' }],
    ]);
  });
});

describe('HU-009-1 · escenario 2 · T-030 · no aceptar', () => {
  it('queda registrado, se explica que sigue sin datos sensibles y continúa con la edad', async () => {
    const { calls, consents, events } = await startAnd('No acepto');
    expect(consents.every((c) => !c.granted)).toBe(true);
    expect(consents).toHaveLength(CONSENT_CATEGORIES.length);
    expect(
      sent(calls)
        .slice(-2)
        .map((m) => m.text),
    ).toEqual([templateById('ON-08').text, templateById('ON-03').text]);
    expect(events.map((e) => e.name)).toContain('consent_declined');
  });
});

describe('FR-001-02 · T-030 · no se salta el aviso', () => {
  it('un botón de la edad antes de decidir sobre la privacidad repite el aviso', async () => {
    const { bot, calls, consents } = await startAnd();
    await bot.handleUpdate(
      callbackUpdate(encodeCallbackData({ action: 'ob', step: 'age', value: 'yes' }), 50),
    );
    expect(sent(calls).at(-1)?.text).toBe(templateById('ON-02').text);
    expect(consents).toEqual([]);
  });

  it('tocar [Acepto] otra vez (botón viejo) no duplica la autorización y repite la pregunta actual', async () => {
    const { bot, calls, consents, nextUpdateId } = await startAnd('Acepto');
    await bot.handleUpdate(callbackUpdate(tapData(calls, 'Acepto'), nextUpdateId()));
    expect(consents).toHaveLength(CONSENT_CATEGORIES.length);
    expect(sent(calls).at(-1)?.text).toBe(templateById('ON-03').text);
  });

  it('texto en lugar de botón: repite la pregunta con sus botones (SPEC-001 §8)', async () => {
    const { bot, calls, nextUpdateId } = await startAnd();
    await bot.handleUpdate(textUpdate('ok dale', nextUpdateId()));
    const last = sent(calls).at(-1);
    expect(last?.text).toBe(templateById('ON-02').text);
    expect(last?.buttons).toHaveLength(3);
  });

  it('un segundo /start retoma el paso sin volver a contar el inicio', async () => {
    const { bot, calls, events, nextUpdateId } = await startAnd('Acepto');
    await bot.handleUpdate(textUpdate('/start', nextUpdateId()));
    expect(sent(calls).at(-1)?.text).toBe(templateById('ON-03').text);
    expect(events.filter((e) => e.name === 'onboarding_started')).toHaveLength(1);
  });
});

describe('T-030 · /privacidad', () => {
  it('durante el aviso, la política usa los botones del onboarding', async () => {
    const { bot, calls, nextUpdateId } = await startAnd();
    await bot.handleUpdate(textUpdate('/privacidad', nextUpdateId()));
    const last = sent(calls).at(-1);
    expect(last?.text).toBe(policyText);
    expect(last?.buttons.map((b) => parseCallbackData(b.callback_data)?.action)).toEqual([
      'ob',
      'ob',
    ]);
  });

  it('después, permite retirar la autorización: queda la más reciente y se confirma con PV-03', async () => {
    const { bot, calls, consents, deps, users, nextUpdateId } = await startAnd('Acepto');
    await bot.handleUpdate(textUpdate('/privacidad', nextUpdateId()));
    await bot.handleUpdate(callbackUpdate(tapData(calls, 'No acepto'), nextUpdateId()));
    expect(sent(calls).at(-1)?.text).toBe(templateById('PV-03').text);
    const userId = [...users.values()][0]?.id ?? '';
    expect(await deps.consents.grantedCategories(userId)).toEqual([]);
    expect(consents).toHaveLength(CONSENT_CATEGORIES.length * 2);
  });

  it('y volver a darla, con PV-02', async () => {
    const { bot, calls, deps, users, nextUpdateId } = await startAnd('No acepto');
    await bot.handleUpdate(textUpdate('/privacidad', nextUpdateId()));
    await bot.handleUpdate(callbackUpdate(tapData(calls, 'Acepto'), nextUpdateId()));
    expect(sent(calls).at(-1)?.text).toBe(templateById('PV-02').text);
    const userId = [...users.values()][0]?.id ?? '';
    expect(await deps.consents.grantedCategories(userId)).toEqual([...CONSENT_CATEGORIES]);
  });
});
