import { renderTemplate, templateById } from '@gymbro/content';
import { PARAMETERS, startProgress } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { encodeCallbackData } from '../bot/callback-data.js';
import { runFlow, ONBOARDED_GYM_LXV } from '../testing/onboarding.js';
import { callbackUpdate, sent } from '../testing/telegram.js';
import { closeDueDays, type CloseDaysDeps } from './close-days.js';

/**
 * T-065 · señal de sobreuso y respuesta de cuidado CU-06 (HU-009-5, RN-SEG-008).
 * Onboarding el lunes 2026-10-19 (plan L-X-V: descansos M, J, S y D).
 */

const S = PARAMETERS.safety;

async function setup() {
  let now = new Date('2026-10-19T15:00:00Z');
  const clock = () => now;
  const flow = await runFlow(ONBOARDED_GYM_LXV, { clock });
  const userId = flow.user()?.id ?? '';
  const deps: CloseDaysDeps = { ...flow.deps, clock };
  const tapToday = (value: string) =>
    flow.bot.handleUpdate(
      callbackUpdate(encodeCallbackData({ action: 'td', value }), flow.nextUpdateId()),
    );
  /** Una sesión completada en `date`, sin pasar por la tarjeta. */
  const completedSession = (date: string) =>
    deps.workouts.create({
      userId,
      date,
      plannedSessionId: 'p',
      template: 'FULL_A',
      variant: 'EXPRESS',
      status: 'completed',
      startedAt: now,
      endedAt: now,
      loggedAsPlanned: true,
      progress: startProgress([]),
      lastConfirmedAt: null,
      pendingTaps: 0,
    });
  return {
    ...flow,
    userId,
    deps,
    tapToday,
    completedSession,
    goTo: (iso: string) => {
      now = new Date(iso);
    },
    overuse: () => flow.events.filter((e) => e.name === 'overuse_signal').map((e) => e.props),
    texts: () => sent(flow.calls).map((m) => m.text),
  };
}

describe('RN-SEG-008 · T-065 · más de P-063 sesiones en un día', () => {
  it(`la sesión n.º ${S.maxSessionsPerDay + 1} del día trae CU-06 una sola vez y emite overuse_signal`, async () => {
    const t = await setup();
    for (let i = 0; i <= S.maxSessionsPerDay; i++) {
      await t.tapToday('new_gym');
      await t.act('La hice tal cual');
    }
    expect(t.overuse()).toEqual([{ reason: 'sessions_per_day' }]);
    const care = sent(t.calls).find((m) => m.text === templateById('CU-06').text);
    expect(care?.buttons.map((b) => b.text)).toEqual(templateById('CU-06').buttons);
    await t.tapToday('new_gym');
    await t.act('La hice tal cual');
    expect(t.overuse()).toHaveLength(1);
  });

  it(`hasta ${S.maxSessionsPerDay} sesiones en un día no hay señal`, async () => {
    const t = await setup();
    for (let i = 0; i < S.maxSessionsPerDay; i++) {
      await t.tapToday('new_gym');
      await t.act('La hice tal cual');
    }
    expect(t.overuse()).toEqual([]);
  });

  it('[Sí, descanso] responde HN-02 y [Ajustar plan] muestra el plan de la semana (PN-01)', async () => {
    const t = await setup();
    await t.tapToday('care_rest');
    expect(t.texts().at(-1)).toBe(templateById('HN-02').text);
    await t.tapToday('care_plan');
    expect(
      t
        .texts()
        .at(-1)
        ?.startsWith(renderTemplate('PN-01', { lineas: '' })),
    ).toBe(true);
  });
});

describe(`RN-SEG-008 · T-065 · entrenar en todos los descansos durante P-064 (${S.weeksTrainingAllRestDays}) semanas`, () => {
  it('al cerrar la segunda semana seguida se emite la señal y CU-06 queda para la próxima interacción', async () => {
    const t = await setup();
    t.weekRecords.push({
      userId: t.userId,
      weekStart: '2026-10-12',
      planned: 3,
      completed: 7,
      commitment: 2,
      fulfilled: true,
      countedDays: 7,
      nutritionHalfDays: 0,
      restDaysPlanned: 4,
      restDaysTrained: 4,
    });
    for (const rest of ['2026-10-20', '2026-10-22', '2026-10-24', '2026-10-25']) {
      await t.completedSession(rest);
    }
    t.goTo('2026-10-26T17:00:00Z');
    await closeDueDays(t.deps);
    expect(t.weekRecords.at(-1)).toMatchObject({ restDaysPlanned: 4, restDaysTrained: 4 });
    expect(t.overuse()).toEqual([{ reason: 'rest_days' }]);
    t.goTo('2026-10-26T18:00:00Z');
    await t.act({ text: '🏋️ Hoy' });
    const care = sent(t.calls).find((m) => m.text === templateById('CU-06').text);
    expect(care?.buttons.map((b) => b.text)).toEqual(templateById('CU-06').buttons);
  });

  it('si descansó al menos un día, no hay señal', async () => {
    const t = await setup();
    t.weekRecords.push({
      userId: t.userId,
      weekStart: '2026-10-12',
      planned: 3,
      completed: 7,
      commitment: 2,
      fulfilled: true,
      countedDays: 7,
      nutritionHalfDays: 0,
      restDaysPlanned: 4,
      restDaysTrained: 4,
    });
    for (const rest of ['2026-10-20', '2026-10-22', '2026-10-24']) {
      await t.completedSession(rest);
    }
    t.goTo('2026-10-26T17:00:00Z');
    await closeDueDays(t.deps);
    expect(t.overuse()).toEqual([]);
  });
});
