import { SESSION_NAMES, renderTemplate, templateById } from '@gymbro/content';
import { PARAMETERS, plannedSetCount } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { ONBOARDED_GYM_LXV, runFlow, type FlowStep } from '../testing/onboarding.js';
import { callbackUpdate, sent, tapData } from '../testing/telegram.js';

/** Bot con onboarding hecho y un reloj movible (empieza el lunes 2026-10-19 10:00 Bogotá). */
async function withClock(steps: readonly FlowStep[] = []) {
  let now = new Date('2026-10-19T15:00:00Z');
  const flow = await runFlow([...ONBOARDED_GYM_LXV, ...steps], { clock: () => now });
  return {
    ...flow,
    session: () => flow.workouts.at(-1),
    goTo: (iso: string) => {
      now = new Date(iso);
    },
  };
}

/** Series planeadas de la última sesión. */
function totalSets(flow: Awaited<ReturnType<typeof withClock>>): number {
  const progress = flow.session()?.progress;
  return progress ? plannedSetCount(progress) : 0;
}

async function confirmSets(flow: Awaited<ReturnType<typeof withClock>>, count: number) {
  for (let i = 0; i < count; i++) await flow.act('✅ Hecha');
}

describe('HU-003-3 · RN-ENT-004 · T-043 · terminar la sesión', () => {
  it('completada: el día cuenta y SE-01 dice series, n.º del día y racha', async () => {
    const flow = await withClock([{ text: '🏋️ Hoy' }, 'Gym']);
    const total = plannedSetCount(
      flow.session()?.progress ?? {
        exercises: [],
        cursor: null,
        pending: { reps: 0, loadKg: 0 },
        logged: [],
      },
    );
    await confirmSets(flow, total);
    await flow.act('🏁 Terminar');
    expect(flow.last()?.text).toBe(
      renderTemplate('SE-01', { series: total, record_txt: '', n: 1, racha: 1 }),
    );
    expect(flow.calls.at(-1)?.method).toBe('editMessageText');
    expect(flow.session()?.status).toBe('completed');
    expect(flow.days).toMatchObject([{ date: '2026-10-19', counted: true }]);
    expect(flow.events.find((e) => e.name === 'session_completed')?.props).toMatchObject({
      variant: 'GYM',
      sets: total,
    });
  });

  it('con P-023 de las series ya es completada', async () => {
    const flow = await withClock([{ text: '🏋️ Hoy' }, 'Gym']);
    const total = totalSets(flow);
    const needed = Math.ceil(total * PARAMETERS.training.minSetFractionCompleted);
    await confirmSets(flow, needed);
    await flow.act('🏁 Terminar');
    expect(flow.session()?.status).toBe('completed');
  });

  it('parcial: SE-04 sin reproche, el día no cuenta todavía', async () => {
    const flow = await withClock([{ text: '🏋️ Hoy' }, 'Gym']);
    await confirmSets(flow, 1);
    await flow.act('🏁 Terminar');
    expect(flow.last()?.text).toBe(renderTemplate('SE-04', { series: 1 }));
    expect(flow.session()?.status).toBe('partial');
    expect(flow.days.filter((d) => d.counted)).toEqual([]);
    expect(flow.events.at(-1)).toMatchObject({ name: 'session_partial', props: { sets: 1 } });
  });

  it('RN-ENT-004 · la exprés solo cuenta completa', async () => {
    const flow = await withClock([{ text: '🏋️ Hoy' }, "Exprés 15'"]);
    const total = totalSets(flow);
    await confirmSets(flow, total - 1);
    await flow.act('⏭️ Siguiente ejercicio');
    while (flow.session()?.progress.cursor) await flow.act('⏭️ Siguiente ejercicio');
    await flow.act('🏁 Terminar');
    expect(flow.session()?.status).toBe('partial');
  });

  it('en casa: SE-02', async () => {
    const flow = await withClock([{ text: '🏋️ Hoy' }, 'Casa']);
    const total = totalSets(flow);
    await confirmSets(flow, total);
    await flow.act('🏁 Terminar');
    expect(flow.last()?.text).toBe(renderTemplate('SE-02', { series: total, n: 1, racha: 1 }));
  });

  it('después de terminar, un botón de esa tarjeta responde SC-03 sin cambiar datos', async () => {
    const flow = await withClock([{ text: '🏋️ Hoy' }, 'Gym']);
    const old = tapData(flow.calls, '✅ Hecha');
    await flow.act('🏁 Terminar');
    await flow.bot.handleUpdate(callbackUpdate(old, flow.nextUpdateId()));
    expect(
      flow.calls.filter((c) => c.method === 'answerCallbackQuery').at(-1)?.payload['text'],
    ).toBe(templateById('SC-03').text);
  });
});

describe('HU-003-2 · RN-ENT-001 · T-043 · "La hice tal cual"', () => {
  it('en la tarjeta: registra todas las series como estaban, en 1 toque, y termina', async () => {
    const flow = await withClock([{ text: '🏋️ Hoy' }, 'Gym', 'La hice tal cual']);
    const session = flow.session();
    const total = totalSets(flow);
    expect(flow.setEntries).toHaveLength(total);
    expect(flow.setEntries.every((e) => !e.edited)).toBe(true);
    expect(session).toMatchObject({ status: 'completed', loggedAsPlanned: true });
    expect(flow.events.map((e) => e.name)).toContain('session_logged_as_planned');
    expect(flow.last()?.text.startsWith(`Sumaste ${total} series`)).toBe(true);
  });

  it('RN-DQC-005 · ayer sin registrar, antes de las 12:00: Hoy lo ofrece y cuenta para ayer', async () => {
    const flow = await withClock();
    flow.goTo('2026-10-20T14:00:00Z'); // martes 09:00 en Bogotá
    await flow.act({ text: '🏋️ Hoy' });
    const messages = sent(flow.calls).slice(-2);
    expect(messages[0]?.text).toBe(renderTemplate('HY-04', { sesion: SESSION_NAMES.FULL_A }));
    await flow.act('La hice tal cual');
    expect(flow.session()).toMatchObject({
      date: '2026-10-19',
      status: 'completed',
      loggedAsPlanned: true,
    });
    expect(flow.days.find((d) => d.date === '2026-10-19')?.counted).toBe(true);
  });

  it('pasada la gracia de ayer ya no se ofrece', async () => {
    const flow = await withClock();
    flow.goTo('2026-10-20T18:00:00Z'); // martes 13:00 en Bogotá
    await flow.act({ text: '🏋️ Hoy' });
    expect(sent(flow.calls).some((m) => m.text.startsWith('¿Hiciste ayer'))).toBe(false);
  });
});

describe('RN-GAM-001 · T-043 · n.º y racha en vivo a lo largo de la semana', () => {
  it('lunes sesión, martes movilidad, miércoles sesión: n.º 3 y racha 3', async () => {
    const flow = await withClock([{ text: '🏋️ Hoy' }, 'Gym', 'La hice tal cual']);
    flow.goTo('2026-10-20T15:00:00Z');
    await flow.act({ text: '🏋️ Hoy' });
    await flow.act('Hice la movilidad');
    flow.goTo('2026-10-21T15:00:00Z');
    await flow.act({ text: '🏋️ Hoy' });
    await flow.act('Gym');
    await flow.act('La hice tal cual');
    expect(flow.last()?.text.endsWith('Día que cuenta n.º 3 · 🔥 3')).toBe(true);
  });
});
