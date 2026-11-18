import { renderTemplate } from '@gymbro/content';
import { describe, expect, it } from 'vitest';
import { ONBOARDED_GYM_LXV, runFlow } from '../testing/onboarding.js';

/**
 * T-035 · cambiar de objetivo desde `/ajustes` (HU-001-6, RN-OBJ-007). El onboarding
 * deja «Ganar músculo» sin meta de peso, el lunes 2026-10-19.
 */

const THIS_MONDAY = '2026-10-19';
const NEXT_MONDAY = '2026-10-26';

const onboarded = () => runFlow(ONBOARDED_GYM_LXV);
type Flow = Awaited<ReturnType<typeof onboarded>>;

const userId = (t: Flow) => t.user()?.id ?? '';
const plansGenerated = (t: Flow) => t.events.filter((e) => e.name === 'plan_generated').length;
const openGoals = async (t: Flow) => {
  await t.act({ text: '/ajustes' });
  await t.act('Objetivo');
};

describe('RN-OBJ-007 · HU-001-6 · T-035 · cambiar de objetivo desde /ajustes', () => {
  it('[Objetivo] muestra las opciones del onboarding (ON-05)', async () => {
    const t = await onboarded();
    await openGoals(t);
    expect(t.last()?.text).toBe(renderTemplate('ON-05'));
  });

  it('escenario 1 · el anterior queda cambiado, se conserva y hay plan nuevo desde la semana siguiente', async () => {
    const t = await onboarded();
    const thisWeek = await t.deps.plans.week(userId(t), THIS_MONDAY);
    const nextWeek = await t.deps.plans.week(userId(t), NEXT_MONDAY);
    const generated = plansGenerated(t);

    await openGoals(t);
    await t.act('Ganar fuerza');

    expect(t.goals.map((g) => [g.type, g.status])).toEqual([
      ['gain_muscle', 'changed'],
      ['gain_strength', 'active'],
    ]);
    expect(t.user()?.profile.goalType).toBe('gain_strength');
    expect(t.last()?.text).toBe(renderTemplate('GO-07', { objetivo: 'Ganar fuerza' }));
    expect(plansGenerated(t)).toBe(generated + 1);
    expect(await t.deps.plans.week(userId(t), THIS_MONDAY)).toEqual(thisWeek);
    expect(await t.deps.plans.week(userId(t), NEXT_MONDAY)).not.toEqual(nextWeek);
  });

  it('con meta de peso, el plan se rehace al aceptar la propuesta y no antes', async () => {
    const t = await onboarded();
    await t.deps.users.updateProfile(userId(t), { heightCm: 175 });
    await t.deps.bodyMeasurements.recordWeight(userId(t), THIS_MONDAY, 80);
    const generated = plansGenerated(t);

    await openGoals(t);
    await t.act('Perder grasa');
    expect(plansGenerated(t)).toBe(generated);

    await t.act('Me sirve');
    expect(t.goals.at(-1)).toMatchObject({ type: 'lose_fat', status: 'active' });
    expect(plansGenerated(t)).toBe(generated + 1);
  });

  it('si abandona la propuesta de meta, el perfil sigue con el objetivo anterior', async () => {
    const t = await onboarded();
    await t.deps.users.updateProfile(userId(t), { heightCm: 175 });
    await t.deps.bodyMeasurements.recordWeight(userId(t), THIS_MONDAY, 80);
    await openGoals(t);
    await t.act('Perder grasa');
    expect(t.user()?.profile.goalType).toBe('gain_muscle');
    expect(t.goals.map((g) => [g.type, g.status])).toEqual([['gain_muscle', 'active']]);
  });

  it('con peso y estatura, repetir el mismo objetivo tampoco reinicia su plazo', async () => {
    const t = await onboarded();
    await t.deps.users.updateProfile(userId(t), { heightCm: 175 });
    await t.deps.bodyMeasurements.recordWeight(userId(t), THIS_MONDAY, 80);
    await openGoals(t);
    await t.act('Ganar músculo');
    expect(t.last()?.text).toBe(renderTemplate('AJ-04'));
    expect(t.goals).toHaveLength(1);
  });

  it('elegir el mismo objetivo no lo reinicia y vuelve al menú', async () => {
    const t = await onboarded();
    const generated = plansGenerated(t);
    await openGoals(t);
    await t.act('Ganar músculo');
    expect(t.goals.map((g) => g.status)).toEqual(['active']);
    expect(plansGenerated(t)).toBe(generated);
    expect(t.last()?.text).toBe(renderTemplate('AJ-04'));
  });
});
