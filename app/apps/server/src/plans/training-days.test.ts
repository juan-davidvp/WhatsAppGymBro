import { renderTemplate, templateById } from '@gymbro/content';
import { PARAMETERS } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { ONBOARDED_GYM_LXV, runFlow } from '../testing/onboarding.js';
import { callbackUpdate } from '../testing/telegram.js';

/** T-045 · ajustar los días disponibles desde `/ajustes` (HU-002-4). */

const THIS_MONDAY = '2026-10-19';
const NEXT_MONDAY = '2026-10-26';
const { min, max } = PARAMETERS.plan.availableDaysRange;
const RANGE = { min_dias: min, max_dias: max };

const onboarded = () => runFlow(ONBOARDED_GYM_LXV);
type Flow = Awaited<ReturnType<typeof onboarded>>;

const userId = (t: Flow) => t.user()?.id ?? '';
const trainingDates = async (t: Flow, weekStart: string) =>
  ((await t.deps.plans.week(userId(t), weekStart))?.days ?? [])
    .filter((d) => d.session !== null)
    .map((d) => d.date);
const openDays = async (t: Flow) => {
  await t.act({ text: '/ajustes' });
  await t.act('Días de entreno');
};

describe('HU-002-4 · T-045 · /ajustes abre el menú', () => {
  it('AJ-04 ofrece mensajes y días; [Mensajes] abre AJ-01', async () => {
    const t = await onboarded();
    await t.act({ text: '/ajustes' });
    expect(t.last()?.text).toBe(renderTemplate('AJ-04'));
    expect(t.last()?.buttons.map((b) => b.text)).toEqual(templateById('AJ-04').buttons);
    await t.act('Mensajes');
    expect(t.last()?.buttons.map((b) => b.text)).toEqual(templateById('AJ-01').buttons);
  });

  it('[Días de entreno] muestra ON-10 con los días actuales marcados', async () => {
    const t = await onboarded();
    await openDays(t);
    expect(t.last()?.text).toBe(renderTemplate('ON-10', RANGE));
    expect(t.last()?.buttons.map((b) => b.text)).toEqual([
      '✅ L',
      'M',
      '✅ X',
      'J',
      '✅ V',
      'S',
      'D',
      'Listo',
    ]);
  });
});

describe('RN-PLAN-001 · HU-002-4 · T-045 · guardar los días', () => {
  it('escenario 1 · de 4 a 3 días: regenera la semana siguiente y conserva la semana en curso', async () => {
    const t = await onboarded();
    await openDays(t);
    await t.act('J');
    await t.act('Listo');
    const before = await trainingDates(t, THIS_MONDAY);

    await openDays(t);
    await t.act('✅ J');
    await t.act('✅ V');
    await t.act('S');
    await t.act('Listo');

    expect(t.user()?.profile.availableDays).toEqual(['monday', 'wednesday', 'saturday']);
    expect(await trainingDates(t, THIS_MONDAY)).toEqual(before);
    expect(await trainingDates(t, NEXT_MONDAY)).toEqual(['2026-10-26', '2026-10-28', '2026-10-31']);
    expect(t.last()?.text).toBe(
      renderTemplate('AJ-05', { fecha: 'lunes 26', dias: 'lunes, miércoles y sábado' }),
    );
  });

  it('emite plan_days_changed con cifras y sin texto del usuario', async () => {
    const t = await onboarded();
    await openDays(t);
    await t.act('J');
    await t.act('Listo');
    const event = t.events.find((e) => e.name === 'plan_days_changed');
    expect(event?.props).toEqual({ previousDays: 3, days: 4, trainingDays: 4 });
  });

  it('RN-PLAN-002 · el hábito sigue a los días y conserva la hora aprendida', async () => {
    const t = await onboarded();
    const habit = await t.deps.habits.get(userId(t));
    if (!habit) throw new Error('sin hábito');
    await t.deps.habits.save({
      ...habit,
      days: habit.days.map((d) => ({ ...d, learnedStart: '06:45' })),
    });
    await openDays(t);
    await t.act('✅ V');
    await t.act('S');
    await t.act('Listo');
    const days = (await t.deps.habits.get(userId(t)))?.days ?? [];
    expect(days.map((d) => d.weekday)).toEqual(['monday', 'wednesday', 'saturday']);
    expect(days[0]?.learnedStart).toBe('06:45');
    expect(days[2]).toMatchObject({
      learnedStart: null,
      declaredStart: habit.days[0]?.declaredStart,
      location: habit.days[0]?.location,
    });
  });

  it('sin cambios no regenera nada y vuelve al menú', async () => {
    const t = await onboarded();
    const before = await t.deps.plans.week(userId(t), NEXT_MONDAY);
    await openDays(t);
    await t.act('Listo');
    expect(t.last()?.text).toBe(renderTemplate('AJ-04'));
    expect(await t.deps.plans.week(userId(t), NEXT_MONDAY)).toEqual(before);
    expect(t.events.some((e) => e.name === 'plan_days_changed')).toBe(false);
  });

  it(`P-074 · con menos de ${min} días responde ON-11 y no guarda`, async () => {
    const t = await onboarded();
    await openDays(t);
    await t.act('✅ X');
    await t.act('✅ V');
    await t.act('Listo');
    expect(t.last()?.text).toBe(renderTemplate('ON-11', RANGE));
    expect(t.user()?.profile.availableDays).toEqual(['monday', 'wednesday', 'friday']);
  });

  it('RN-PLAN-004 · un novato con 5 días entrena menos y se le explica con ON-12', async () => {
    const t = await onboarded();
    await openDays(t);
    await t.act('M');
    await t.act('J');
    await t.act('Listo');
    expect(t.user()?.profile.availableDays).toHaveLength(5);
    const training = await trainingDates(t, NEXT_MONDAY);
    expect(training.length).toBeLessThan(5);
    expect(t.last()?.text).toBe(renderTemplate('ON-12', { dias_entreno: training.length }));
  });

  it('un dato de botón alterado no cambia los días', async () => {
    const t = await onboarded();
    await openDays(t);
    for (const value of ['ds999', 'dt999_1', 'dt1_9']) {
      await t.bot.handleUpdate(callbackUpdate(`v1:aj:${value}`, t.nextUpdateId()));
    }
    expect(t.user()?.profile.availableDays).toEqual(['monday', 'wednesday', 'friday']);
    expect(t.events.some((e) => e.name === 'plan_days_changed')).toBe(false);
  });
});
