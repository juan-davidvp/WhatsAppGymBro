import { renderTemplate, templateById } from '@gymbro/content';
import {
  initialPlayerState,
  initialStreakState,
  plannedSetCount,
  type StreakState,
} from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { runFlow, ONBOARDED_GYM_LXV } from '../testing/onboarding.js';
import { sent } from '../testing/telegram.js';
import { closeDueDays, type CloseDaysDeps } from './close-days.js';

/**
 * T-061 · racha, comodines, reparación y avisos (HU-005-2). Onboarding el lunes
 * 2026-10-19 (plan L-X-V); se parte de 5 días que cuentan ya cerrados hasta el
 * domingo 18 y el lunes no se registra nada.
 */

const TUESDAY_NOON = '2026-10-20T17:00:00Z';
const TUESDAY_1PM = '2026-10-20T18:00:00Z';

async function withStreak(streak: Partial<StreakState>) {
  let now = new Date('2026-10-19T15:00:00Z');
  const clock = () => now;
  const flow = await runFlow(ONBOARDED_GYM_LXV, { clock });
  const userId = flow.user()?.id ?? '';
  flow.streakStates.set(userId, {
    rev: 1,
    state: {
      ...initialPlayerState(),
      counted: { total: 5, lastClosedDate: '2026-10-18' },
      streak: {
        ...initialStreakState(),
        current: 5,
        longest: 5,
        countedRun: 5,
        lastClosedDate: '2026-10-18',
        ...streak,
      },
    },
  });
  const deps: CloseDaysDeps = { ...flow.deps, clock };
  return {
    ...flow,
    userId,
    deps,
    goTo: (iso: string) => {
      now = new Date(iso);
    },
    state: () => flow.streakStates.get(userId)?.state,
    eventsNamed: (name: string) => flow.events.filter((e) => e.name === name).map((e) => e.props),
    texts: () => sent(flow.calls).map((m) => m.text),
  };
}

describe('RN-GAM-002 · T-061 · el comodín se aplica solo (HU-005-2 escenario 1)', () => {
  it('el día que no cuenta gasta el comodín, la racha sigue y Hoy lo avisa una vez (RA-01)', async () => {
    const t = await withStreak({ freezes: 1 });
    t.goTo(TUESDAY_NOON);
    await closeDueDays(t.deps);
    expect(t.state()?.streak).toMatchObject({ current: 5, freezes: 0 });
    expect(t.eventsNamed('freeze_used')).toEqual([{ freezes: 0, streak: 5 }]);
    t.goTo(TUESDAY_1PM);
    await t.act({ text: '🏋️ Hoy' });
    const ra01 = renderTemplate('RA-01', { racha: 5, comodines: 0 });
    expect(t.texts()).toContain(ra01);
    await t.act({ text: '🏋️ Hoy' });
    expect(t.texts().filter((text) => text === ra01)).toHaveLength(1);
  });

  it(`gana un comodín al cerrar ${7} días que cuentan seguidos`, async () => {
    const t = await withStreak({ current: 6, countedRun: 6 });
    await t.deps.days.addSource(t.userId, '2026-10-19', 'TRAINING', 'session:s1');
    t.goTo(TUESDAY_NOON);
    await closeDueDays(t.deps);
    expect(t.eventsNamed('freeze_earned')).toEqual([{ freezes: 1 }]);
    expect(t.state()?.streak).toMatchObject({ current: 7, freezes: 1 });
  });
});

describe('RN-GAM-003 · RN-DQC-007 · T-061 · racha reiniciada y reparación (HU-005-2 escenario 2)', () => {
  it('sin comodín la racha vuelve a 0, el total no cambia y se ofrece reparar (RA-02)', async () => {
    const t = await withStreak({ freezes: 0 });
    t.goTo(TUESDAY_NOON);
    await closeDueDays(t.deps);
    expect(t.state()?.streak.current).toBe(0);
    expect(t.state()?.counted.total).toBe(5);
    expect(t.eventsNamed('streak_reset')).toEqual([{}]);
    expect(t.eventsNamed('streak_repair_offered')).toEqual([{}]);
    t.goTo(TUESDAY_1PM);
    await t.act({ text: '🏋️ Hoy' });
    const offer = sent(t.calls).find((m) => m.text === renderTemplate('RA-02', { total: 5 }));
    expect(offer?.buttons.map((b) => b.text)).toEqual(templateById('RA-02').buttons);
  });

  it('la exprés más la mitad de comida dentro del plazo repara la racha (RA-03) y se ve en vivo', async () => {
    const t = await withStreak({ freezes: 0 });
    t.goTo(TUESDAY_NOON);
    await closeDueDays(t.deps);
    t.goTo(TUESDAY_1PM);
    await t.deps.days.addSource(t.userId, '2026-10-20', 'REST', 'nutrition_half');
    await t.act({ text: '🏋️ Hoy' });
    await t.act("Exprés 15'");
    const progress = t.workouts.at(-1)?.progress;
    for (let i = 0; i < (progress ? plannedSetCount(progress) : 0); i++) await t.act('✅ Hecha');
    await t.act('🏁 Terminar');
    expect(t.eventsNamed('streak_repaired')).toEqual([{ streak: 5 }]);
    expect(t.state()?.streak).toMatchObject({
      current: 5,
      repair: null,
      lastRepairDate: '2026-10-20',
    });
    // RN-DQC-001: entrenar en un descanso no cambia el tipo del día (lo pone el plan).
    expect(t.days.find((d) => d.date === '2026-10-20')?.dayType).toBe('REST');
    const finish = sent(t.calls.filter((c) => c.method === 'editMessageText')).at(-1);
    // 5 cerrados + hoy; la racha recupera los 5 y suma hoy.
    expect(finish?.text.split('\n')[0]).toBe(renderTemplate('SE-03', { n: 6, racha: 6 }));
    expect(t.texts()).toContain(templateById('RA-03').text);
  });

  it('una sesión completa del gym más la mitad de comida también repara (decisión del PO, 2026-11-09)', async () => {
    const t = await withStreak({
      current: 0,
      countedRun: 0,
      lastClosedDate: '2026-10-20',
      repair: { offeredUntil: '2026-10-22T17:00:00.000Z', restoreTo: 5 },
    });
    const stored = t.streakStates.get(t.userId);
    if (stored) {
      t.streakStates.set(t.userId, {
        ...stored,
        state: { ...stored.state, counted: { total: 5, lastClosedDate: '2026-10-20' } },
      });
    }
    t.goTo('2026-10-21T15:00:00Z'); // miércoles 10:00, día de entreno
    await t.deps.days.addSource(t.userId, '2026-10-21', 'TRAINING', 'nutrition_half');
    await t.act({ text: '🏋️ Hoy' });
    await t.act('Gym');
    await t.act('La hice tal cual');
    expect(t.eventsNamed('streak_repaired')).toEqual([{ streak: 5 }]);
    expect(t.texts()).toContain(templateById('RA-03').text);
  });

  it('pasado el plazo de P-035 horas, la oferta ya no se muestra', async () => {
    const t = await withStreak({ freezes: 0 });
    t.goTo(TUESDAY_NOON);
    await closeDueDays(t.deps);
    t.goTo('2026-10-22T18:00:00Z'); // jueves 13:00: más de 48 h después del cierre
    await t.act({ text: '🏋️ Hoy' });
    expect(t.texts()).not.toContain(renderTemplate('RA-02', { total: 5 }));
  });
});

describe('RN-SEG-007 · FR-005-07 · T-061 · día con señal de riesgo', () => {
  it('un día que no cuenta con señal de riesgo no rompe la racha ni deja avisos', async () => {
    const t = await withStreak({ freezes: 0 });
    await t.deps.riskSignals.record(t.userId, 'distress', new Date('2026-10-19T20:00:00Z'));
    t.goTo(TUESDAY_NOON);
    await closeDueDays(t.deps);
    expect(t.state()?.streak.current).toBe(5);
    expect(t.eventsNamed('streak_reset')).toEqual([]);
    expect(t.notices.filter((n) => n.templateId.startsWith('RA-'))).toEqual([]);
  });
});

describe('FR-005-06 · T-061 · con el juego desactivado no hay avisos de racha', () => {
  it('la racha se calcula igual, pero no se guarda RA-02', async () => {
    const t = await withStreak({ freezes: 0 });
    await t.deps.users.updateSettings(t.userId, { gamificationEnabled: false });
    t.goTo(TUESDAY_NOON);
    await closeDueDays(t.deps);
    expect(t.eventsNamed('streak_reset')).toEqual([{}]);
    expect(t.notices).toEqual([]);
    expect(t.eventsNamed('quest_generated')).toHaveLength(1);
  });
});
