import { SESSION_NAMES, renderTemplate, templateById } from '@gymbro/content';
import { PARAMETERS } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { ONBOARDED_GYM_LXV, runFlow } from '../testing/onboarding.js';
import { callbackUpdate, tapData } from '../testing/telegram.js';

/** Onboarding + Hoy + Gym, con un reloj que la prueba puede mover. */
async function gymCard() {
  let now = new Date('2026-10-19T15:00:00Z');
  const flow = await runFlow([...ONBOARDED_GYM_LXV, { text: '🏋️ Hoy' }, 'Gym'], {
    clock: () => now,
  });
  return {
    ...flow,
    session: () => flow.workouts.at(-1),
    later: (seconds: number) => {
      now = new Date(now.getTime() + seconds * 1000);
    },
  };
}

describe('RN-ENT-001 · FR-003-01/02 · T-042 · 1 toque por serie en un solo mensaje', () => {
  it('[✅ Hecha] registra la serie tal cual y edita la misma tarjeta con la siguiente', async () => {
    const flow = await gymCard();
    const first = flow.session()?.progress.exercises[0];
    const sendsBefore = flow.calls.filter((c) => c.method === 'sendMessage').length;
    await flow.act('✅ Hecha');
    expect(flow.setEntries).toMatchObject([
      {
        exerciseCode: first?.exerciseCode,
        setIndex: 0,
        reps: first?.targetReps,
        loadKg: first?.loadKg,
        edited: false,
      },
    ]);
    expect(flow.calls.filter((c) => c.method === 'sendMessage')).toHaveLength(sendsBefore);
    expect(flow.calls.at(-1)?.method).toBe('editMessageText');
    expect(flow.last()?.text).toContain(`serie 2 de ${first?.sets}`);
    expect(flow.events.at(-1)).toMatchObject({
      name: 'set_confirmed',
      props: { taps: 1, edited: false },
    });
  });

  it('HU-003-1 escenario 3: dos veces −1 rep y Hecha registran 8 en vez de 10', async () => {
    const flow = await gymCard();
    const target = flow.session()?.progress.exercises[0]?.targetReps ?? 0;
    await flow.act('−1 rep');
    await flow.act('−1 rep');
    await flow.act('✅ Hecha');
    expect(flow.setEntries[0]).toMatchObject({ reps: target - 2, edited: true });
    expect(flow.events.at(-1)?.props).toEqual({ taps: 3, edited: true });
  });

  it('RN-ENT-002 · ±kg mueve la carga por el incremento de su región', async () => {
    const flow = await gymCard();
    const first = flow.session()?.progress.exercises[0];
    // Un ejercicio del gym sin carga previa empieza en 0 kg y se puede ajustar.
    expect(flow.last()?.buttons.map((b) => b.text)).toContain('+kg');
    await flow.act('+kg');
    const step = ['SQUAT', 'HINGE', 'SINGLE_LEG'].includes(first?.pattern ?? '')
      ? PARAMETERS.training.lowerBodyIncrementKg
      : PARAMETERS.training.upperBodyIncrementKg;
    expect(flow.session()?.progress.pending.loadKg).toBe((first?.loadKg ?? 0) + step);
  });

  it('[⏭️ Siguiente ejercicio] salta las series que quedan', async () => {
    const flow = await gymCard();
    await flow.act('⏭️ Siguiente ejercicio');
    expect(flow.session()?.progress.cursor).toEqual({ exercise: 1, set: 0 });
  });

  it('sin series pendientes muestra SC-02 con [🏁 Terminar]', async () => {
    const flow = await gymCard();
    while (flow.session()?.progress.cursor) await flow.act('✅ Hecha');
    expect(flow.last()?.text).toBe(
      renderTemplate('SC-02', { hechas: flow.setEntries.length, sesion: SESSION_NAMES.FULL_A }),
    );
    expect(flow.last()?.buttons.map((b) => b.text)).toContain('🏁 Terminar');
  });
});

describe('SC-003-2 · FR-003-03 · T-042 · ningún toque repetido duplica una serie', () => {
  it('doble toque del mismo botón: una sola serie', async () => {
    const flow = await gymCard();
    const data = tapData(flow.calls, '✅ Hecha');
    await flow.bot.handleUpdate(callbackUpdate(data, flow.nextUpdateId()));
    await flow.bot.handleUpdate(callbackUpdate(data, flow.nextUpdateId()));
    expect(flow.setEntries).toHaveLength(1);
  });

  it('reintento de Telegram (mismo update_id): una sola serie', async () => {
    const flow = await gymCard();
    const update = callbackUpdate(tapData(flow.calls, '✅ Hecha'), flow.nextUpdateId());
    await flow.bot.handleUpdate(update);
    await flow.bot.handleUpdate(update);
    expect(flow.setEntries).toHaveLength(1);
  });
});

describe('FR-003-04 · T-042 · deshacer durante P-090 segundos', () => {
  it('dentro de la ventana quita la última serie y vuelve a ella', async () => {
    const flow = await gymCard();
    await flow.act('✅ Hecha');
    expect(flow.last()?.buttons.map((b) => b.text)).toContain('↩️ Deshacer');
    await flow.act('↩️ Deshacer');
    expect(flow.setEntries).toEqual([]);
    expect(flow.session()?.progress.cursor).toEqual({ exercise: 0, set: 0 });
    expect(flow.events.at(-1)?.name).toBe('set_undone');
  });

  it('pasada la ventana ya no deshace, aunque se toque un botón viejo', async () => {
    const flow = await gymCard();
    await flow.act('✅ Hecha');
    const undo = tapData(flow.calls, '↩️ Deshacer');
    flow.later(PARAMETERS.training.undoWindowSeconds + 1);
    await flow.bot.handleUpdate(callbackUpdate(undo, flow.nextUpdateId()));
    expect(flow.setEntries).toHaveLength(1);
  });
});

describe('SPEC-003 §8 · T-042 · tarjeta de una sesión que ya terminó', () => {
  it('responde SC-03 como aviso y no cambia datos', async () => {
    const flow = await gymCard();
    const data = tapData(flow.calls, '✅ Hecha');
    const session = flow.session();
    if (!session) throw new Error('sin sesión');
    await flow.deps.workouts.update(session.id, session.rev, { status: 'completed' });
    await flow.bot.handleUpdate(callbackUpdate(data, flow.nextUpdateId()));
    const answer = flow.calls.filter((c) => c.method === 'answerCallbackQuery').at(-1);
    expect(answer?.payload['text']).toBe(templateById('SC-03').text);
    expect(flow.setEntries).toEqual([]);
  });
});
