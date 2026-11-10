import {
  FOODS,
  FREQUENT_MEAL_TEMPLATES,
  proteinBar,
  renderTemplate,
  templateById,
} from '@gymbro/content';
import { PARAMETERS, dailyProteinGoal, proteinTarget } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { CALLBACK_DATA_MAX_BYTES, encodeCallbackData } from '../bot/callback-data.js';
import { ONBOARDED_GYM_LXV, runFlow, type FlowStep } from '../testing/onboarding.js';
import { callbackUpdate, tapData } from '../testing/telegram.js';
import { encodeDraft } from './draft.js';

const N = PARAMETERS.nutrition;
const [MINUS_PALM, PLUS_PALM, , PLUS_HAND, , , MINUS_THUMB] = templateById('CM-03').buttons;

/** Bot con onboarding hecho (sin peso declarado) y reloj movible; lunes 10:00 en Bogotá. */
async function withClock(iso = '2026-10-19T15:00:00Z', steps: readonly FlowStep[] = []) {
  let now = new Date(iso);
  const flow = await runFlow([...ONBOARDED_GYM_LXV, ...steps], { clock: () => now });
  let messageId = 100;
  /** Toca un botón como si estuviera en un mensaje nuevo (otro `message_id`). */
  const tapIn = async (label: string, id = messageId++) =>
    flow.bot.handleUpdate(callbackUpdate(tapData(flow.calls, label), flow.nextUpdateId(), id));
  const toast = () =>
    flow.calls.filter((c) => c.method === 'answerCallbackQuery').at(-1)?.payload['text'];
  return {
    ...flow,
    tapIn,
    toast,
    userId: () => flow.user()?.id ?? '',
    goTo: (next: string) => {
      now = new Date(next);
    },
  };
}

const goal = dailyProteinGoal(null);

function summary(proteinG: number, half: boolean) {
  return renderTemplate(half ? 'CM-05' : 'CM-04', {
    barra: proteinBar(proteinG / goal.grams),
    proteina: proteinG,
    meta: goal.grams,
    palmas: String(Math.floor(proteinG / N.proteinGPerPalm / 0.5) * 0.5).replace('.', ','),
    meta_palmas: String(goal.palms).replace('.', ','),
  });
}

/** `🍽️ Comida` → [Porciones] → `palms` palmas → [Guardar]. */
async function logPalms(flow: Awaited<ReturnType<typeof withClock>>, palms: number) {
  await flow.act({ text: '🍽️ Comida' });
  await flow.act('Porciones');
  for (let i = 0; i < palms / N.palmStep; i++) await flow.act(PLUS_PALM ?? '');
  await flow.tapIn('Guardar');
}

describe('HU-004-1 · RN-NUT-001 · T-050 · registrar por porciones con la mano', () => {
  it('`🍽️ Comida` muestra CM-01 con [Porciones] y [Plantillas]', async () => {
    const flow = await withClock();
    await flow.act({ text: '🍽️ Comida' });
    expect(flow.last()?.text).toBe(templateById('CM-01').text);
    const labels = flow.last()?.buttons.map((b) => b.text);
    expect(labels?.slice(0, 2)).toEqual(['Porciones', 'Plantillas']);
    expect(labels).not.toContain('Repetir ayer');
    expect(labels).not.toContain('Editar frecuentes');
  });

  it('[Porciones] edita el mensaje con el teclado de palma, mano ahuecada, puño y pulgar', async () => {
    const flow = await withClock();
    await flow.act({ text: '🍽️ Comida' });
    await flow.act('Porciones');
    expect(flow.calls.filter((c) => c.method !== 'answerCallbackQuery').at(-1)?.method).toBe(
      'editMessageText',
    );
    expect(flow.last()?.text).toBe(
      renderTemplate('CM-03', { palma: 0, mano: 0, puno: 0, pulgar: 0 }),
    );
    expect(flow.last()?.buttons.map((b) => b.text)).toEqual(templateById('CM-03').buttons);
  });

  it('FR-004-02 · 1 palma en 5 toques: guarda, suma P-027 g y muestra la barra en el mismo mensaje', async () => {
    const flow = await withClock();
    await flow.act({ text: '🍽️ Comida' });
    await flow.act('Porciones');
    await flow.act(PLUS_PALM ?? '');
    expect(flow.last()?.text).toBe(
      renderTemplate('CM-03', { palma: '0,5', mano: 0, puno: 0, pulgar: 0 }),
    );
    await flow.act(PLUS_PALM ?? '');
    await flow.act(PLUS_HAND ?? '');
    await flow.act('Guardar');
    expect(flow.meals).toMatchObject([
      {
        date: '2026-10-19',
        method: 'portions',
        portions: { palm: 1, cuppedHand: 1, fist: 0, thumb: 0 },
        proteinG: N.proteinGPerPalm,
      },
    ]);
    expect(flow.last()?.text).toBe(summary(N.proteinGPerPalm, false));
    expect(flow.calls.at(-1)?.method).toBe('editMessageText');
    const event = flow.events.find((e) => e.name === 'meal_logged');
    // [Porciones], +🖐️, +🖐️, +🤲, [Guardar]; con el toque en `🍽️ Comida`, 6 ≤ presupuesto.
    expect(event?.props).toMatchObject({
      method: 'portions',
      taps: 5,
      proteinG: N.proteinGPerPalm,
    });
  });

  it('nunca baja de 0 y no se guarda una comida vacía (CM-14 como aviso)', async () => {
    const flow = await withClock();
    await flow.act({ text: '🍽️ Comida' });
    await flow.act('Porciones');
    await flow.act(MINUS_PALM ?? '');
    await flow.act(MINUS_THUMB ?? '');
    expect(flow.last()?.text).toBe(
      renderTemplate('CM-03', { palma: 0, mano: 0, puno: 0, pulgar: 0 }),
    );
    await flow.act('Guardar');
    expect(flow.toast()).toBe(templateById('CM-14').text);
    expect(flow.meals).toEqual([]);
  });

  it('SC-003-2 · tocar [Guardar] dos veces en el mismo mensaje registra una comida', async () => {
    const flow = await withClock();
    await flow.act({ text: '🍽️ Comida' });
    await flow.act('Porciones');
    await flow.act(PLUS_PALM ?? '');
    const save = tapData(flow.calls, 'Guardar');
    await flow.bot.handleUpdate(callbackUpdate(save, flow.nextUpdateId()));
    await flow.bot.handleUpdate(callbackUpdate(save, flow.nextUpdateId()));
    expect(flow.meals).toHaveLength(1);
    expect(flow.events.filter((e) => e.name === 'meal_logged')).toHaveLength(1);
  });

  it('RN-NUT-007 · ningún texto de comida habla de calorías', async () => {
    const flow = await withClock();
    await logPalms(flow, 1);
    expect(flow.calls.map((c) => String(c.payload['text'] ?? '')).join(' ')).not.toMatch(
      /calor|kcal/i,
    );
  });
});

describe('HU-004-3 · RN-NUT-002/003 · T-050 · proteína del día', () => {
  it('sin peso: meta de P-092 palmas; la barra acumula las comidas del día', async () => {
    const flow = await withClock();
    await logPalms(flow, 1);
    await logPalms(flow, 1);
    expect(flow.last()?.text).toBe(summary(2 * N.proteinGPerPalm, false));
  });

  it('con peso: meta = peso × P-026 (RN-NUT-002)', async () => {
    const flow = await withClock();
    await flow.deps.bodyMeasurements.recordWeight(flow.userId(), '2026-10-19', 80);
    await logPalms(flow, 1);
    const target = proteinTarget(80);
    expect(flow.last()?.text).toContain(`/${String(Math.round(target.grams))} g`);
    expect(flow.last()?.text).toContain(`/${String(target.palms)} palmas`);
  });

  it('al llegar a P-028 % de la meta: CM-05, evento y fuente del día; un día de entreno no cuenta solo con comida', async () => {
    const flow = await withClock();
    await logPalms(flow, goal.palms);
    expect(flow.last()?.text).toBe(summary(goal.grams, true));
    expect(flow.events.filter((e) => e.name === 'nutrition_half_completed')).toHaveLength(1);
    expect(flow.days.find((d) => d.date === '2026-10-19')?.sources).toContain('nutrition_half');
    expect(flow.days.filter((d) => d.counted)).toEqual([]);
    await logPalms(flow, 1);
    expect(flow.events.filter((e) => e.name === 'nutrition_half_completed')).toHaveLength(1);
  });

  it('modo sin números: solo "Comida registrada ✅", sin gramos ni palmas', async () => {
    const flow = await withClock();
    await flow.deps.users.updateSettings(flow.userId(), { numberFreeMode: true });
    await logPalms(flow, 1);
    expect(flow.last()?.text).toBe(templateById('CM-06').text);
  });

  it(`modo sin números: P-072 comidas con proteína cumplen la mitad (CM-07)`, async () => {
    const flow = await withClock();
    await flow.deps.users.updateSettings(flow.userId(), { numberFreeMode: true });
    for (let i = 0; i < N.numberFreeMealsWithProtein; i++) await logPalms(flow, 1);
    expect(flow.last()?.text).toBe(templateById('CM-07').text);
  });
});

describe('RN-DQC-003/004 · T-050 · la comida hace contar o completa el día, en vivo', () => {
  const TUESDAY = '2026-10-20T15:00:00Z'; // día de descanso en el plan L-X-V

  it('día de descanso: la mitad de comida hace que cuente (DC-01)', async () => {
    const flow = await withClock(TUESDAY);
    await logPalms(flow, goal.palms);
    const texts = flow.calls
      .filter((c) => c.method === 'sendMessage' || c.method === 'editMessageText')
      .map((c) => String(c.payload['text']));
    expect(texts.at(-2)).toBe(summary(goal.grams, true));
    expect(texts.at(-1)).toBe(renderTemplate('DC-01', { n: 1, racha: 1 }));
    expect(flow.days).toMatchObject([{ date: '2026-10-20', counted: true }]);
  });

  it('día de descanso con movilidad: la comida lo completa (DC-02) sin repetir DC-01', async () => {
    const flow = await withClock(TUESDAY);
    await flow.act({ text: '🏋️ Hoy' });
    await flow.act('Hice la movilidad');
    await logPalms(flow, goal.palms);
    expect(flow.last()?.text).toBe(templateById('DC-02').text);
    expect(flow.calls.map((c) => String(c.payload['text'] ?? ''))).not.toContain(
      renderTemplate('DC-01', { n: 1, racha: 1 }),
    );
  });

  it('día de entreno con la sesión hecha: la comida lo completa (DC-02)', async () => {
    const flow = await withClock();
    await flow.act({ text: '🏋️ Hoy' });
    await flow.act('Gym');
    await flow.act('La hice tal cual');
    await logPalms(flow, goal.palms);
    expect(flow.last()?.text).toBe(templateById('DC-02').text);
  });

  it('[Registrar comida] desde Hoy en descanso abre CM-01 (HU-004-6 escenario 2)', async () => {
    const flow = await withClock(TUESDAY);
    await flow.act({ text: '🏋️ Hoy' });
    expect(flow.last()?.text).toBe(
      renderTemplate('HY-01', { minutos: PARAMETERS.day.restMobilityMinutes }),
    );
    await flow.act('Registrar comida');
    expect(flow.last()?.text).toBe(templateById('CM-01').text);
  });
});

describe('FR-004-07 · RN-DQC-005 · T-050 · comida de ayer durante la gracia', () => {
  it('[Era de ayer] → CM-02 y la comida queda en ayer', async () => {
    const flow = await withClock();
    await flow.act({ text: '🍽️ Comida' });
    await flow.act('Era de ayer');
    expect(flow.last()?.text).toBe(templateById('CM-02').text);
    await flow.act('Porciones');
    await flow.act(PLUS_PALM ?? '');
    await flow.act('Guardar');
    expect(flow.meals.map((m) => m.date)).toEqual(['2026-10-18']);
  });

  it('[Era de hoy] vuelve a CM-01', async () => {
    const flow = await withClock();
    await flow.act({ text: '🍽️ Comida' });
    await flow.act('Era de ayer');
    await flow.act('Era de hoy');
    expect(flow.last()?.text).toBe(templateById('CM-01').text);
  });

  it('pasada la gracia (P-030) ya no se ofrece', async () => {
    const flow = await withClock('2026-10-19T17:30:00Z'); // 12:30 en Bogotá
    await flow.act({ text: '🍽️ Comida' });
    expect(flow.last()?.buttons.map((b) => b.text)).not.toContain('Era de ayer');
  });
});

describe('HU-004-2 · RN-NUT-004 · T-051 · frecuentes, plantillas y repetir ayer', () => {
  it('[Guardar como frecuente] registra, guarda la frecuente (CM-17) y avisa con CM-08', async () => {
    const flow = await withClock();
    await flow.act({ text: '🍽️ Comida' });
    await flow.act('Porciones');
    await flow.act(PLUS_PALM ?? '');
    await flow.act(PLUS_PALM ?? '');
    await flow.act(PLUS_HAND ?? '');
    await flow.act('Guardar como frecuente');
    const name = renderTemplate('CM-17', { palma: 1, mano: 1, puno: 0, pulgar: 0 });
    expect(flow.favorites).toMatchObject([
      { name, portions: { palm: 1, cuppedHand: 1, fist: 0, thumb: 0 } },
    ]);
    expect(flow.meals).toHaveLength(1);
    expect(flow.toast()).toBe(renderTemplate('CM-08', { nombre: name }));
    expect(flow.events.find((e) => e.name === 'favorite_meal_saved')?.props).toEqual({
      fromTemplate: false,
    });
  });

  it('una frecuente aparece como botón en CM-01 y se registra con 1 toque', async () => {
    const flow = await withClock();
    await flow.act({ text: '🍽️ Comida' });
    await flow.act('Porciones');
    await flow.act(PLUS_PALM ?? '');
    await flow.act(PLUS_PALM ?? '');
    await flow.act('Guardar como frecuente');
    const name = flow.favorites[0]?.name ?? '';
    await flow.act({ text: '🍽️ Comida' });
    expect(flow.last()?.buttons[0]?.text).toBe(name);
    await flow.tapIn(name);
    expect(flow.meals.at(-1)).toMatchObject({
      method: 'favorite',
      favoriteMealId: flow.favorites[0]?.id,
    });
    expect(flow.events.filter((e) => e.name === 'meal_logged').at(-1)?.props).toMatchObject({
      method: 'favorite',
      taps: 1,
    });
    expect(flow.last()?.text).toBe(summary(2 * N.proteinGPerPalm, false));
  });

  it(`CM-01 muestra como máximo P-094 frecuentes`, async () => {
    const flow = await withClock();
    for (let i = 0; i <= N.maxFavoriteButtons; i++) {
      await flow.deps.favorites.create({
        userId: flow.userId(),
        name: `f${String(i)}`,
        portions: { palm: 1, cuppedHand: 0, fist: 0, thumb: 0 },
        foodCodes: [],
      });
    }
    await flow.act({ text: '🍽️ Comida' });
    const labels = flow.last()?.buttons.map((b) => b.text) ?? [];
    expect(labels.filter((l) => /^f\d+$/.test(l))).toHaveLength(N.maxFavoriteButtons);
  });

  it('[Plantillas] abre el teclado con el valor bajo de la plantilla y la guarda con su nombre corto', async () => {
    const flow = await withClock();
    await flow.act({ text: '🍽️ Comida' });
    await flow.act('Plantillas');
    expect(flow.last()?.text).toBe(templateById('CM-09').text);
    expect(flow.last()?.buttons.map((b) => b.text)).toEqual(
      FREQUENT_MEAL_TEMPLATES.map((t) => t.shortName),
    );
    await flow.act('Arepa con huevo');
    expect(flow.last()?.text).toBe(
      renderTemplate('CM-03', { palma: '0,75', mano: 1, puno: 0, pulgar: 1 }),
    );
    await flow.act('Guardar como frecuente');
    expect(flow.favorites).toMatchObject([
      { name: 'Arepa con huevo', foodCodes: ['DESAYUNO_AREPA_HUEVO'] },
    ]);
    // FR-004-04: la proteína es palmas × P-027, no la referencia del catálogo.
    expect(flow.meals[0]?.proteinG).toBe(0.75 * N.proteinGPerPalm);
    expect(flow.events.find((e) => e.name === 'favorite_meal_saved')?.props).toEqual({
      fromTemplate: true,
    });
  });

  it('FR-004-03 · ✏️ ajusta las porciones de la frecuente y 🗑️ la borra', async () => {
    const flow = await withClock();
    const favorite = await flow.deps.favorites.create({
      userId: flow.userId(),
      name: 'Almuerzo',
      portions: { palm: 1, cuppedHand: 2, fist: 0, thumb: 0 },
      foodCodes: [],
    });
    await flow.act({ text: '🍽️ Comida' });
    await flow.act('Editar frecuentes');
    expect(flow.last()?.text).toBe(templateById('CM-12').text);
    await flow.act('✏️ Almuerzo');
    expect(flow.last()?.text).toBe(
      renderTemplate('CM-03', { palma: 1, mano: 2, puno: 0, pulgar: 0 }),
    );
    await flow.act(PLUS_PALM ?? '');
    await flow.act('Guardar como frecuente');
    expect(flow.favorites).toEqual([
      { ...favorite, portions: { palm: 1.5, cuppedHand: 2, fist: 0, thumb: 0 } },
    ]);
    await flow.act({ text: '🍽️ Comida' });
    await flow.act('Editar frecuentes');
    await flow.act('🗑️ Almuerzo');
    expect(flow.last()?.text).toBe(renderTemplate('CM-13', { nombre: 'Almuerzo' }));
    expect(flow.favorites).toEqual([]);
  });

  it('[Repetir ayer] propone las comidas de ayer y [Registrar] las suma hoy con 1 toque', async () => {
    const flow = await withClock();
    for (const [i, palm] of [1, 2].entries()) {
      await flow.deps.meals.record({
        userId: flow.userId(),
        date: '2026-10-18',
        loggedAt: new Date('2026-10-18T15:00:00Z'),
        method: 'portions',
        portions: { palm, cuppedHand: 1, fist: 0, thumb: 0 },
        proteinG: palm * N.proteinGPerPalm,
        favoriteMealId: null,
        durationMs: 0,
        taps: 1,
        idempotencyKey: `seed:${String(i)}`,
      });
    }
    await flow.act({ text: '🍽️ Comida' });
    await flow.act('Repetir ayer');
    const names = [1, 2].map((palm) =>
      renderTemplate('CM-17', { palma: palm, mano: 1, puno: 0, pulgar: 0 }),
    );
    expect(flow.last()?.text).toBe(renderTemplate('CM-10', { lista: names.join(' · ') }));
    expect(flow.meals.filter((m) => m.date === '2026-10-19')).toEqual([]);
    await flow.act('Registrar');
    expect(
      flow.meals.filter((m) => m.date === '2026-10-19').map((m) => [m.method, m.proteinG]),
    ).toEqual([
      ['repeat', N.proteinGPerPalm],
      ['repeat', 2 * N.proteinGPerPalm],
    ]);
    expect(flow.events.find((e) => e.name === 'meal_repeated')?.props).toEqual({ meals: 2 });
  });

  it('[Cancelar] no registra nada y vuelve al menú', async () => {
    const flow = await withClock();
    await flow.deps.meals.record({
      userId: flow.userId(),
      date: '2026-10-18',
      loggedAt: new Date('2026-10-18T15:00:00Z'),
      method: 'portions',
      portions: { palm: 1, cuppedHand: 0, fist: 0, thumb: 0 },
      proteinG: N.proteinGPerPalm,
      favoriteMealId: null,
      durationMs: 0,
      taps: 1,
      idempotencyKey: 'seed',
    });
    await flow.act({ text: '🍽️ Comida' });
    await flow.act('Repetir ayer');
    await flow.act('Cancelar');
    expect(flow.toast()).toBe(templateById('CM-16').text);
    expect(flow.last()?.text).toBe(templateById('CM-01').text);
    expect(flow.meals).toHaveLength(1);
  });
});

describe('HU-004-6 · RN-NUT-006 · T-052 · sugerencia según el tipo de día', () => {
  const MONDAY_5AM = '2026-10-19T10:00:00Z'; // antes de las 06:00 (P-083, franja Mañana)

  it('día de entreno antes de la hora habitual: CM-15 con P-095 fuentes de proteína baratas', async () => {
    const flow = await withClock(MONDAY_5AM);
    await flow.act({ text: '🍽️ Comida' });
    const messages = flow.calls
      .filter((c) => c.method === 'sendMessage')
      .slice(-2)
      .map((c) => String(c.payload['text']));
    expect(messages[1]).toBe(templateById('CM-01').text);
    const cheap = FOODS.filter((f) => f.countsForProtein && f.relativeCost === '$').map((f) =>
      f.name.toLowerCase(),
    );
    const suggested = /como (.+)\.$/.exec(messages[0] ?? '')?.[1]?.split(', ') ?? [];
    expect(suggested).toHaveLength(N.suggestedFoods);
    expect(suggested.every((f) => cheap.includes(f.toLowerCase()))).toBe(true);
  });

  it('después de la hora habitual o en descanso, no hay sugerencia', async () => {
    for (const iso of ['2026-10-19T15:00:00Z', '2026-10-20T10:00:00Z']) {
      const flow = await withClock(iso);
      await flow.act({ text: '🍽️ Comida' });
      const texts = flow.calls.map((c) => String(c.payload['text'] ?? ''));
      expect(texts.some((t) => t.startsWith('Hoy entrenas'))).toBe(false);
      expect(flow.last()?.text).toBe(templateById('CM-01').text);
    }
  });
});

describe('T-050 · botones de comida', () => {
  it('el borrador más largo cabe en callback_data', () => {
    const data = encodeCallbackData({
      action: 'ml',
      op: 'kb',
      state: encodeDraft({
        portions: { PALM: 99.75, CUPPED_HAND: 999, FIST: 999, THUMB: 999 },
        yesterday: true,
        taps: 999,
        ref: `f${'a'.repeat(24)}`,
      }),
    });
    expect(new TextEncoder().encode(data).length).toBeLessThanOrEqual(CALLBACK_DATA_MAX_BYTES);
  });

  it('sin terminar el inicio, `🍽️ Comida` pide terminarlo (PN-04)', async () => {
    const flow = await runFlow(['Acepto', { text: '🍽️ Comida' }]);
    expect(flow.last()?.text).toBe(templateById('PN-04').text);
  });
});
