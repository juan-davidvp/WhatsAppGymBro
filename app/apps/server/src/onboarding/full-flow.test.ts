import { renderTemplate, templateById } from '@gymbro/content';
import { PARAMETERS, isSafeWeightGoal, weightGoalOffers } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { encodeCallbackData, parseCallbackData } from '../bot/callback-data.js';
import { callbackUpdate, sent, startAnd, tapData, textUpdate } from '../testing/telegram.js';
import { formatKg } from './profile-steps.js';

/**
 * T-032 · onboarding completo por el bot (SPEC-001 HU-001-1 a 5, SC-001-1).
 * El reloj de las pruebas es lunes 2026-10-19, 10:00 en Bogotá.
 */

type Step = string | { text: string };

async function onboard(...steps: Step[]) {
  const setup = await startAnd();
  const act = async (step: Step) => {
    const update =
      typeof step === 'string'
        ? callbackUpdate(tapData(setup.calls, step), setup.nextUpdateId())
        : textUpdate(step.text, setup.nextUpdateId());
    await setup.bot.handleUpdate(update);
  };
  for (const step of steps) await act(step);
  const user = () => [...setup.users.values()][0];
  const last = () => sent(setup.calls).at(-1);
  return { ...setup, act, user, last };
}

/** Camino feliz: autoriza, gana músculo, novato, L-X-V, mañana, gym, 45 min, tamizajes negativos. */
const HAPPY_UNTIL_WEIGHT: Step[] = [
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
];

describe('HU-001-1 · SC-001-1 · T-032 · onboarding completo', () => {
  it('de /start al resumen con plan, hábito, meta y ajustes guardados, en ≤ 25 interacciones', async () => {
    const flow = await onboard(
      ...HAPPY_UNTIL_WEIGHT,
      { text: '68' },
      { text: '175' },
      'Me sirve',
      'Normal',
      'Me sirve',
    );
    const user = flow.user();
    expect(user?.onboarding.completedAt).toBeInstanceOf(Date);
    expect(user?.profile).toMatchObject({
      goalType: 'gain_muscle',
      level: 'novice',
      availableDays: ['monday', 'wednesday', 'friday'],
      timeSlot: 'morning',
      place: 'gym',
      sessionMinutes: 45,
      heightCm: 175,
    });
    expect(flow.habits).toEqual([
      {
        userId: user?.id,
        days: ['monday', 'wednesday', 'friday'].map((weekday) => ({
          weekday,
          declaredStart: PARAMETERS.habit.timeSlotStarts.morning,
          learnedStart: null,
          location: 'gym',
        })),
      },
    ]);
    const proposal = weightGoalOffers({
      type: 'gain_muscle',
      weightKg: 68,
      heightCm: 175,
    }).proposal;
    expect(flow.goals).toMatchObject([
      {
        type: 'gain_muscle',
        metric: 'weight_kg',
        startValue: 68,
        targetValue: proposal.targetKg,
        horizonWeeks: PARAMETERS.goal.horizonWeeksDefault,
        status: 'active',
      },
    ]);
    expect(flow.weights.map((w) => w.weightKg)).toEqual([68]);

    // El resumen va antes del mensaje del teclado persistente (KB-01, FR-001-11).
    const summary = sent(flow.calls).at(-2);
    expect(flow.last()?.text).toBe(templateById('KB-01').text);
    const keyboard = flow.calls.filter((c) => c.method === 'sendMessage').at(-1)?.payload[
      'reply_markup'
    ] as { keyboard?: { text: string }[][]; is_persistent?: boolean } | undefined;
    expect(keyboard?.keyboard?.flat().map((k) => k.text)).toEqual([
      '🏋️ Hoy',
      '🍽️ Comida',
      '📈 Progreso',
    ]);
    expect(keyboard?.is_persistent).toBe(true);
    expect(summary?.text).toBe(
      renderTemplate('ON-24', {
        objetivo: 'Ganar músculo',
        meta: ` · meta ${formatKg(proposal.targetKg)} en ${proposal.horizonWeeks} semanas`,
        dias: 'lunes, miércoles y viernes',
        franja: 'mañana',
        primera_sesion: 'hoy · Cuerpo completo A',
      }),
    );
    expect(summary?.buttons.map((b) => parseCallbackData(b.callback_data))).toEqual([
      { action: 'nav', target: 'today' },
      { action: 'nav', target: 'plan' },
    ]);

    const completed = flow.events.find((e) => e.name === 'onboarding_completed');
    expect(completed?.props['taps']).toBeLessThanOrEqual(25);
    for (const name of ['onboarding_started', 'consent_given', 'goal_set', 'habit_declared']) {
      expect(flow.events.map((e) => e.name)).toContain(name);
    }
  });

  it('después del onboarding, el texto libre recibe CU-07 y /start no lo reinicia', async () => {
    const flow = await onboard(...HAPPY_UNTIL_WEIGHT, 'Prefiero no decirlo', 'Normal', 'Me sirve');
    expect(flow.user()?.onboarding.completedAt).toBeInstanceOf(Date);
    await flow.act({ text: 'hola' });
    expect(flow.last()?.text).toBe(templateById('CU-07').text);
    await flow.act({ text: '/start' });
    expect(flow.last()?.text).toBe(templateById('CU-07').text);
  });
});

describe('HU-009-1 · T-032 · sin autorización', () => {
  it('objetivo ser constante sin preguntarlo, sin tamizaje de comida, peso ni meta', async () => {
    const flow = await onboard(
      'No acepto',
      'Sí',
      'Nunca',
      'L',
      'J',
      'Listo',
      'Noche',
      'Gym',
      '30 min',
      'Todo NO',
      'Poco',
      'Me sirve',
    );
    expect(flow.user()?.onboarding.completedAt).toBeInstanceOf(Date);
    expect(flow.goals).toMatchObject([
      { type: 'consistency', metric: 'fulfilled_weeks', targetValue: null },
    ]);
    expect(flow.weights).toEqual([]);
    expect(flow.user()?.settings.intensity).toBe('LOW');
    expect(sent(flow.calls).at(-2)?.text).toContain('Objetivo: Ser constante.');
  });
});

describe('HU-001-3 · T-032 · días, lugar y equipamiento', () => {
  it('los días se marcan editando el mismo mensaje y fuera de P-074 no se aceptan', async () => {
    const flow = await onboard('Acepto', 'Sí', 'Ganar fuerza', '6 meses o más', 'L', 'Listo');
    expect(flow.calls.filter((c) => c.method === 'editMessageText')).toHaveLength(1);
    expect(flow.last()?.text).toBe(
      renderTemplate('ON-11', {
        min_dias: PARAMETERS.plan.availableDaysRange.min,
        max_dias: PARAMETERS.plan.availableDaysRange.max,
      }),
    );
    expect(flow.user()?.onboarding.step).toBe('days');
  });

  it('RN-PLAN-004 · un novato que marca 6 días recibe la explicación de ON-12', async () => {
    const flow = await onboard(
      'Acepto',
      'Sí',
      'Ganar fuerza',
      'Nunca',
      'L',
      'M',
      'X',
      'J',
      'V',
      'S',
      'Listo',
    );
    expect(sent(flow.calls).some((m) => m.text.startsWith('Como estás empezando'))).toBe(true);
    expect(flow.user()?.profile.availableDays).toHaveLength(6);
  });

  it('en casa: el equipamiento marcado se guarda y la versión B lo usa', async () => {
    const flow = await onboard(
      'Acepto',
      'Sí',
      'Ser constante',
      'Nunca',
      'M',
      'J',
      'Listo',
      'Tarde',
      'Casa',
      '30 min',
      'Mancuernas',
      'Banda elástica',
      'Listo',
    );
    expect(flow.user()?.profile).toMatchObject({
      place: 'home',
      homeEquipment: ['Mancuernas', 'Banda elástica'],
    });
    expect(flow.user()?.onboarding.step).toBe('pre_activity_screening');
  });

  it('en gym no se pregunta el equipamiento de casa', async () => {
    const flow = await onboard(
      'Acepto',
      'Sí',
      'Ser constante',
      'Nunca',
      'M',
      'J',
      'Listo',
      'Tarde',
      'Gym',
      '30 min',
    );
    expect(flow.user()?.onboarding.step).toBe('pre_activity_screening');
  });
});

describe('SPEC-001 §8 · T-032 · peso y estatura escritos', () => {
  it('un número que no se entiende pide repetirlo; fuera de P-087 se confirma', async () => {
    const flow = await onboard(...HAPPY_UNTIL_WEIGHT, { text: 'setenta' });
    expect(flow.last()?.text).toBe(renderTemplate('ON-20', { ejemplo: '72,5' }));
    await flow.act({ text: '30' });
    expect(flow.last()?.text).toBe(renderTemplate('ON-19', { valor: '30 kg' }));
    expect(flow.weights).toEqual([]);
    await flow.act('Sí, es correcto');
    expect(flow.weights.map((w) => w.weightKg)).toEqual([30]);
    expect(flow.user()?.onboarding.step).toBe('height');
  });

  it('"72,5 kg" con coma decimal se guarda', async () => {
    const flow = await onboard(...HAPPY_UNTIL_WEIGHT, { text: '72,5 kg' });
    expect(flow.weights.map((w) => w.weightKg)).toEqual([72.5]);
  });

  it('una alerta escrita en el paso del peso recibe la respuesta de cuidado, no se toma como peso', async () => {
    const flow = await onboard(...HAPPY_UNTIL_WEIGHT, { text: 'dame una dieta de 600 calorías' });
    expect(flow.weights).toEqual([]);
    expect(flow.riskSignals.map((r) => r.category)).toEqual(['extreme_restriction']);
  });

  it('sin estatura no se propone meta de peso (RN-OBJ-005) y el objetivo queda sin meta', async () => {
    const flow = await onboard(
      ...HAPPY_UNTIL_WEIGHT,
      { text: '68' },
      'Prefiero no decirlo',
      'Normal',
      'Me sirve',
    );
    expect(sent(flow.calls).some((m) => m.text.startsWith('Te propongo'))).toBe(false);
    expect(flow.goals).toMatchObject([{ type: 'gain_muscle', targetValue: null }]);
  });
});

describe('HU-001-2 · RN-OBJ-004 · T-032 · meta de peso', () => {
  const toProposal = [...HAPPY_UNTIL_WEIGHT, { text: '90' }, { text: '180' }] as Step[];

  it('más conservadora: la misma meta en P-003 semanas', async () => {
    const flow = await onboard(...toProposal, 'Más conservadora');
    expect(flow.last()?.text).toContain(`${PARAMETERS.goal.horizonWeeksMax} semanas`);
    await flow.act('Me sirve');
    expect(flow.goals[0]?.horizonWeeks).toBe(PARAMETERS.goal.horizonWeeksMax);
  });

  it('más ambiciosa que el límite: ON-07 con la meta segura o la misma meta en más semanas', async () => {
    const flow = await onboard(...toProposal, 'Más ambiciosa');
    expect(flow.last()?.text.startsWith('Esa meta va más rápido')).toBe(true);
    await flow.act('Opción 1');
    const goal = flow.goals[0];
    expect(goal).toBeDefined();
    expect(
      isSafeWeightGoal({
        weightKg: 90,
        heightCm: 180,
        targetKg: goal?.targetValue ?? 0,
        horizonWeeks: goal?.horizonWeeks ?? 0,
      }),
    ).toBe(true);
    expect(flow.events.find((e) => e.name === 'goal_adjusted')?.props).toEqual({
      direction: 'ambitious',
      limited: true,
    });
  });

  it('una meta insegura fabricada en el botón no se guarda (RN-SEG-004)', async () => {
    const flow = await onboard(...toProposal);
    await flow.bot.handleUpdate(
      callbackUpdate(
        encodeCallbackData({ action: 'ob', step: 'goal_proposal', value: 'ok_1500_4' }),
        flow.nextUpdateId(),
      ),
    );
    expect(flow.goals).toEqual([]);
    expect(flow.last()?.text.startsWith('Te propongo')).toBe(true);
  });

  it('las negritas de ON-06 llegan como HTML de Telegram', async () => {
    const flow = await onboard(...toProposal);
    const call = flow.calls.filter((c) => c.method === 'sendMessage').at(-1);
    expect(call?.payload['parse_mode']).toBe('HTML');
    expect(String(call?.payload['text'])).toMatch(/<b>.+ kg<\/b>/);
  });
});

describe('RN-SEG-003 · T-032 · SCOFF positivo', () => {
  it('con objetivo de perder grasa, pide otro objetivo sin esa opción y no pregunta el peso', async () => {
    const flow = await onboard(
      'Acepto',
      'Sí',
      'Perder grasa',
      'Nunca',
      'L',
      'X',
      'Listo',
      'Mañana',
      'Gym',
      '45 min',
      'Todo NO',
      'Sí',
      'Sí',
      'No',
      'No',
      'No',
    );
    const last = flow.last();
    expect(last?.text).toBe(renderTemplate('ON-21'));
    expect(last?.buttons.map((b) => b.text)).not.toContain('Perder grasa');
    await flow.act('Recomposición');
    expect(flow.user()?.profile.goalType).toBe('recomposition');
    expect(flow.user()?.onboarding.step).toBe('message_intensity');
  });
});

describe('SPEC-001 §8 · FR-001-01 · T-032 · retomar', () => {
  it('empezar de nuevo vuelve al objetivo, borra lo declarado y conserva privacidad y edad', async () => {
    const flow = await onboard('Acepto', 'Sí', 'Ganar fuerza', 'Nunca');
    await flow.act({ text: '/start' });
    await flow.act('Empezar de nuevo');
    expect(flow.user()?.onboarding.step).toBe('goal');
    expect(flow.user()?.profile.goalType).toBeNull();
    expect(flow.user()?.isAdultConfirmedAt).toBeInstanceOf(Date);
    expect(flow.last()?.text).toBe(templateById('ON-05').text);
  });

  it('las horas de silencio se pueden cambiar por una de P-086', async () => {
    const flow = await onboard(...HAPPY_UNTIL_WEIGHT, 'Prefiero no decirlo', 'Más');
    const [option] = PARAMETERS.messages.quietHoursOptions;
    await flow.act(`${option.start}–${option.end}`);
    expect(flow.user()?.settings).toMatchObject({ intensity: 'HIGH', quietHours: option });
  });
});
