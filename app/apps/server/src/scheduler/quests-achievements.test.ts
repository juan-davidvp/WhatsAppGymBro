import { ACHIEVEMENTS, QUEST_LABELS, renderTemplate } from '@gymbro/content';
import { PARAMETERS, initialPlayerState } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { toTelegramHtml } from '../bot/create-bot.js';
import { runFlow, ONBOARDED_GYM_LXV } from '../testing/onboarding.js';
import { sent } from '../testing/telegram.js';
import { closeDueDays, type CloseDaysDeps } from './close-days.js';

/**
 * T-063 · misiones semanales, Reto 66 y logros (HU-005-6/7). Onboarding el lunes
 * 2026-10-19 a las 10:00 en Bogotá; plan L-X-V.
 */

async function setup() {
  let now = new Date('2026-10-19T15:00:00Z');
  const clock = () => now;
  const flow = await runFlow(ONBOARDED_GYM_LXV, { clock });
  const userId = flow.user()?.id ?? '';
  const deps: CloseDaysDeps = { ...flow.deps, clock };
  return {
    ...flow,
    userId,
    deps,
    goTo: (iso: string) => {
      now = new Date(iso);
    },
    eventsNamed: (name: string) => flow.events.filter((e) => e.name === name).map((e) => e.props),
    texts: () => sent(flow.calls).map((m) => m.text),
  };
}

type Setup = Awaited<ReturnType<typeof setup>>;

async function gymAsPlanned(t: Setup) {
  await t.act({ text: '🏋️ Hoy' });
  await t.act('Gym');
  await t.act('La hice tal cual');
}

const achievementName = (code: string) => ACHIEVEMENTS.find((a) => a.code === code)?.name ?? '';

describe('RN-GAM-008 · T-063 · misiones semanales (HU-005-6)', () => {
  it('la primera semana se generan 3 misiones con el mínimo y se avisan (MI-01)', async () => {
    const t = await setup();
    t.goTo('2026-10-20T17:00:00Z');
    await closeDueDays(t.deps);
    expect(t.eventsNamed('quest_generated')).toEqual([
      { training: 1, nutrition: 1, consistency: 1 },
    ]);
    expect(t.questRows).toMatchObject([{ weekStart: '2026-10-19' }]);
    t.goTo('2026-10-20T18:00:00Z');
    await t.act({ text: '🏋️ Hoy' });
    expect(t.texts()).toContain(renderTemplate('MI-01', { entreno: 1, comida: 1, constancia: 1 }));
  });

  it('la dificultad es P-041 × lo logrado la semana anterior', async () => {
    const t = await setup();
    t.weekRecords.push({
      userId: t.userId,
      weekStart: '2026-10-12',
      planned: 3,
      completed: 5,
      commitment: 2,
      fulfilled: true,
      countedDays: 6,
      nutritionHalfDays: 5,
      restDaysPlanned: 4,
      restDaysTrained: 0,
    });
    t.goTo('2026-10-20T17:00:00Z');
    await closeDueDays(t.deps);
    const factor = PARAMETERS.quests.difficultyFactor;
    expect(t.eventsNamed('quest_generated')).toEqual([
      {
        training: Math.floor(factor * 5),
        nutrition: Math.floor(factor * 5),
        consistency: Math.floor(factor * 6),
      },
    ]);
  });

  it('al alcanzar la meta, la misión se cumple una vez, suma XP y se avisa (MI-02)', async () => {
    const t = await setup();
    await gymAsPlanned(t); // lunes: 1 sesión y 1 día que cuenta
    t.goTo('2026-10-21T17:00:00Z'); // miércoles 12:00: cierra lunes y martes
    await closeDueDays(t.deps);
    expect(t.eventsNamed('quest_completed')).toEqual([
      { kind: 'TRAINING' },
      { kind: 'CONSISTENCY' },
    ]);
    expect(t.xpLedger.filter((e) => e.refId.startsWith('quest:')).map((e) => e.amount)).toEqual([
      PARAMETERS.xp.table.weeklyQuest,
      PARAMETERS.xp.table.weeklyQuest,
    ]);
    t.goTo('2026-10-22T17:00:00Z');
    await closeDueDays(t.deps);
    expect(t.eventsNamed('quest_completed')).toHaveLength(2);
    await t.act({ text: '🏋️ Hoy' });
    expect(t.texts()).toContain(
      renderTemplate('MI-02', { mision: QUEST_LABELS.TRAINING, meta: 1 }),
    );
  });
});

describe('RN-GAM-012 · T-063 · Reto 66 (HU-005-7)', () => {
  it('al llegar a 7 días que cuentan se desbloquea el capítulo 1 y se avisa (RE-01)', async () => {
    const t = await setup();
    t.streakStates.set(t.userId, {
      rev: 1,
      state: { ...initialPlayerState(), counted: { total: 6, lastClosedDate: '2026-10-18' } },
    });
    await gymAsPlanned(t);
    t.goTo('2026-10-20T17:00:00Z');
    await closeDueDays(t.deps);
    expect(t.achievements.map((a) => a.code)).toContain('CH66_7');
    expect(t.notices.map((n) => n.templateId)).toContain('RE-01');
    t.goTo('2026-10-20T18:00:00Z');
    await t.act({ text: '🏋️ Hoy' });
    expect(t.texts()).toContain(renderTemplate('RE-01', { capitulo: 1, dias: 7 }));
  });

  it(`con ${PARAMETERS.challenge66.days} días: "Hábito forjado" (RE-05)`, async () => {
    const t = await setup();
    const total = PARAMETERS.challenge66.days - 1;
    t.streakStates.set(t.userId, {
      rev: 1,
      state: { ...initialPlayerState(), counted: { total, lastClosedDate: '2026-10-18' } },
    });
    await gymAsPlanned(t);
    t.goTo('2026-10-20T17:00:00Z');
    await closeDueDays(t.deps);
    expect(t.achievements.map((a) => a.code)).toContain(`CH66_${PARAMETERS.challenge66.days}`);
    expect(t.notices.map((n) => n.templateId)).toContain('RE-05');
  });
});

describe('RN-GAM-011 · T-063 · logros en la bitácora (decisión del PO: se anuncian todos)', () => {
  it('la primera sesión guarda "Primer día" una sola vez y lo anuncia (LG-01)', async () => {
    const t = await setup();
    await gymAsPlanned(t);
    expect(t.texts()).toContain(
      toTelegramHtml(renderTemplate('LG-01', { nombre: achievementName('FIRST_SESSION') })),
    );
    t.goTo('2026-10-21T15:00:00Z');
    await gymAsPlanned(t);
    expect(t.achievements.filter((a) => a.code === 'FIRST_SESSION')).toHaveLength(1);
  });

  it('con señal de riesgo el logro se guarda, pero no se anuncia ese día (FR-005-07)', async () => {
    const t = await setup();
    await t.deps.riskSignals.record(t.userId, 'distress', new Date('2026-10-19T14:30:00Z'));
    await gymAsPlanned(t);
    expect(t.achievements.map((a) => a.code)).toContain('FIRST_SESSION');
    expect(t.notices.some((n) => n.templateId === 'LG-01')).toBe(false);
  });
});
