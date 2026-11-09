import { LEVELS, renderTemplate, templateById } from '@gymbro/content';
import { PARAMETERS, initialPlayerState } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { toTelegramHtml } from '../bot/create-bot.js';
import { runFlow, ONBOARDED_GYM_LXV } from '../testing/onboarding.js';
import { sent } from '../testing/telegram.js';
import { closeDueDays, type CloseDaysDeps } from './close-days.js';

/**
 * T-062 · XP, niveles, semana cumplida y bonificación de regreso (HU-005-3/4/5).
 * Onboarding el lunes 2026-10-19 a las 10:00 en Bogotá; plan L-X-V (3 sesiones,
 * compromiso 2 por P-037).
 */

const XP = PARAMETERS.xp.table;

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
    xpOf: (refPrefix: string) =>
      flow.xpLedger.filter((e) => e.refId.startsWith(refPrefix)).map((e) => e.amount),
  };
}

type Setup = Awaited<ReturnType<typeof setup>>;

async function gymAsPlanned(t: Setup) {
  await t.act({ text: '🏋️ Hoy' });
  await t.act('Gym');
  await t.act('La hice tal cual');
}

describe('RN-GAM-005 · T-062 · XP por evento con tope diario (HU-005-3 escenario 1)', () => {
  it('terminar una sesión del gym suma el XP de P-038 una sola vez', async () => {
    const t = await setup();
    await gymAsPlanned(t);
    expect(t.xpOf('session:')).toEqual([XP.session.GYM]);
    expect(t.eventsNamed('xp_awarded')).toContainEqual({
      event: 'SESSION',
      amount: XP.session.GYM,
    });
  });

  it('el día no supera P-039: con el tope casi lleno, la sesión suma solo lo que queda', async () => {
    const t = await setup();
    const room = 10;
    await t.deps.xp.add(t.userId, {
      date: '2026-10-19',
      event: 'NUTRITION_HALF',
      amount: PARAMETERS.xp.dailyCap - room,
      refId: 'seed:cap',
      at: new Date('2026-10-19T14:00:00Z'),
    });
    await gymAsPlanned(t);
    expect(t.xpOf('session:')).toEqual([room]);
  });
});

describe('RN-GAM-006 · T-062 · el XP nunca disminuye', () => {
  it('el mismo hecho no suma dos veces y no se guardan movimientos sin monto', async () => {
    const t = await setup();
    const entry = {
      date: '2026-10-19',
      event: 'SESSION' as const,
      variant: 'GYM' as const,
      amount: 50,
      refId: 'session:x',
      at: new Date(),
    };
    expect(await t.deps.xp.add(t.userId, entry)).toEqual({ inserted: true });
    expect(await t.deps.xp.add(t.userId, entry)).toEqual({ inserted: false });
    expect(await t.deps.xp.add(t.userId, { ...entry, refId: 'zero', amount: 0 })).toEqual({
      inserted: false,
    });
    expect(await t.deps.xp.total(t.userId)).toBe(50);
  });
});

describe('RN-GAM-007 · T-062 · subir de nivel (HU-005-3 escenario 2)', () => {
  it('al cruzar el umbral de P-040 sube de nivel, guarda el logro y lo dice (RE-02)', async () => {
    const t = await setup();
    const threshold = PARAMETERS.levels.thresholds[1] ?? 0;
    await t.deps.xp.add(t.userId, {
      date: '2026-10-18',
      event: 'SESSION',
      variant: 'GYM',
      amount: threshold - 1,
      refId: 'seed:level',
      at: new Date('2026-10-18T15:00:00Z'),
    });
    await gymAsPlanned(t);
    const level = LEVELS[1];
    expect(t.eventsNamed('level_up')).toEqual([{ level: 2 }]);
    expect(t.achievements.map((a) => a.code)).toContain(level?.code);
    expect(t.texts()).toContain(
      toTelegramHtml(renderTemplate('RE-02', { nivel: 2, nombre_nivel: level?.name ?? '' })),
    );
  });
});

describe('RN-SEG-007 · FR-005-07 · T-062 · sin XP el día con señal de riesgo', () => {
  it('la sesión cuenta, pero no suma XP', async () => {
    const t = await setup();
    await t.deps.riskSignals.record(t.userId, 'distress', new Date('2026-10-19T14:30:00Z'));
    await gymAsPlanned(t);
    expect(t.days.find((d) => d.date === '2026-10-19')?.counted).toBe(true);
    expect(t.xpLedger).toEqual([]);
  });
});

describe('RN-GAM-013 · T-062 · bonificación de regreso (HU-005-4)', () => {
  it('el primer día que cuenta tras un entreno fallado suma la bonificación y lo dice (BR-01)', async () => {
    const t = await setup();
    t.streakStates.set(t.userId, {
      rev: 1,
      state: {
        ...initialPlayerState(),
        counted: { total: 3, lastClosedDate: '2026-10-18' },
        comeback: { pending: true },
      },
    });
    await gymAsPlanned(t);
    t.goTo('2026-10-20T17:00:00Z');
    await closeDueDays(t.deps);
    expect(t.xpOf('comeback:')).toEqual([XP.comebackBonus]);
    t.goTo('2026-10-20T18:00:00Z');
    await t.act({ text: '🏋️ Hoy' });
    expect(t.texts()).toContain(renderTemplate('BR-01', { xp: XP.comebackBonus }));
  });
});

describe('RN-GAM-004 · T-062 · semana cumplida (HU-005-5)', () => {
  it('con las sesiones del compromiso, al cerrar el domingo la semana queda cumplida, suma XP y extiende la racha de semanas', async () => {
    const t = await setup();
    await gymAsPlanned(t); // lunes
    t.goTo('2026-10-21T15:00:00Z'); // miércoles
    await gymAsPlanned(t);
    t.goTo('2026-10-26T17:00:00Z'); // lunes siguiente 12:00: cierra hasta el domingo
    await closeDueDays(t.deps);
    expect(t.eventsNamed('week_closed')).toEqual([{ fulfilled: true, sessions: 2, commitment: 2 }]);
    expect(t.weekRecords).toMatchObject([{ weekStart: '2026-10-19', fulfilled: true }]);
    expect(t.xpOf('week:')).toEqual([XP.fulfilledWeek]);
    expect(t.streakStates.get(t.userId)?.state.weekStreak).toBe(1);
    t.goTo('2026-10-26T18:00:00Z');
    await t.act({ text: '🏋️ Hoy' });
    expect(t.texts()).toContain(renderTemplate('SM-01', { sesiones: 2, compromiso: 2 }));
    // Desde la primera semana cumplida, la racha de semanas va debajo de la línea (DC-04).
    expect(t.texts().at(-1)?.split('\n').at(-1)).toBe(renderTemplate('DC-04', { semanas: 1 }));
  });

  it('sin el compromiso no queda cumplida: sin XP, sin aviso y la racha de semanas en 0', async () => {
    const t = await setup();
    await gymAsPlanned(t); // solo el lunes
    t.goTo('2026-10-26T17:00:00Z');
    await closeDueDays(t.deps);
    expect(t.eventsNamed('week_closed')).toEqual([
      { fulfilled: false, sessions: 1, commitment: 2 },
    ]);
    expect(t.xpOf('week:')).toEqual([]);
    expect(t.streakStates.get(t.userId)?.state.weekStreak).toBe(0);
    expect(t.notices.some((n) => n.templateId === 'SM-01')).toBe(false);
    t.goTo('2026-10-26T18:00:00Z');
    await t.act({ text: '🏋️ Hoy' });
    expect(t.texts().join('\n')).not.toContain(templateById('DC-04').text.split(':')[0]);
  });
});
