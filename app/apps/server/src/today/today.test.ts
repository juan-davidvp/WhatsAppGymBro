import { EXERCISES, SESSION_NAMES, renderTemplate, templateById } from '@gymbro/content';
import { PARAMETERS, rescheduleSession } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { encodeCallbackData } from '../bot/callback-data.js';
import { toTelegramHtml } from '../bot/create-bot.js';
import { ONBOARDED_GYM_LXV, runFlow } from '../testing/onboarding.js';
import { callbackUpdate } from '../testing/telegram.js';

/** Reloj que la prueba puede mover: empieza el lunes 2026-10-19 a las 10:00 en Bogotá. */
function movableClock() {
  let now = new Date('2026-10-19T15:00:00Z');
  return {
    clock: () => now,
    goTo: (iso: string) => {
      now = new Date(iso);
    },
  };
}

const exerciseName = (code: string | undefined) => EXERCISES.find((e) => e.code === code)?.name;

describe('HU-002-2 · T-041 · Hoy en un día de entreno', () => {
  it("🏋️ Hoy muestra la sesión con [Gym] [Casa] [Exprés 15'] [Hoy no puedo]", async () => {
    const flow = await runFlow([...ONBOARDED_GYM_LXV, { text: '🏋️ Hoy' }]);
    const session = flow.weeks[0]?.days[0]?.session;
    expect(flow.last()?.text).toBe(
      toTelegramHtml(
        renderTemplate('PL-01', {
          sesion: SESSION_NAMES[session?.template ?? 'FULL_A'],
          minutos: Math.round(session?.versions.GYM.estimatedMinutes ?? 0),
        }),
      ),
    );
    expect(flow.last()?.buttons.map((b) => b.text)).toEqual(templateById('PL-01').buttons);
  });

  it('/hoy y [Empezar] del resumen llevan a la misma pantalla', async () => {
    for (const step of [{ text: '/hoy' }, 'Empezar']) {
      const flow = await runFlow([...ONBOARDED_GYM_LXV, step]);
      expect(flow.last()?.buttons.map((b) => b.text)).toEqual(templateById('PL-01').buttons);
    }
  });

  it('[Gym] abre la tarjeta con la primera serie y emite la versión elegida', async () => {
    const flow = await runFlow([...ONBOARDED_GYM_LXV, { text: '🏋️ Hoy' }, 'Gym']);
    const first = flow.weeks[0]?.days[0]?.session?.versions.GYM.exercises[0];
    expect(
      flow
        .last()
        ?.text.startsWith(`${exerciseName(first?.exerciseCode)} · serie 1 de ${first?.sets}`),
    ).toBe(true);
    expect(flow.workouts).toMatchObject([{ variant: 'GYM', status: 'active' }]);
    expect(flow.events.slice(-2).map((e) => [e.name, e.props])).toEqual([
      ['session_variant_chosen', { variant: 'GYM' }],
      ['session_started', { variant: 'GYM' }],
    ]);
  });

  it('RN-PLAN-003 · [Casa] usa la versión B: sin equipo, peso corporal y sin botones de carga', async () => {
    const flow = await runFlow([...ONBOARDED_GYM_LXV, { text: '🏋️ Hoy' }, 'Casa']);
    const home = flow.weeks[0]?.days[0]?.session?.versions.HOME.exercises[0];
    expect(flow.workouts[0]?.variant).toBe('HOME');
    expect(flow.last()?.text.startsWith(exerciseName(home?.exerciseCode) ?? '?')).toBe(true);
    expect(flow.last()?.text).toContain('peso corporal');
    expect(flow.last()?.buttons.map((b) => b.text)).not.toContain('+kg');
  });

  it('volver a Hoy con una sesión abierta la retoma; elegir otra versión pregunta (SPEC-003 §8)', async () => {
    const flow = await runFlow([
      ...ONBOARDED_GYM_LXV,
      { text: '🏋️ Hoy' },
      'Gym',
      { text: '🏋️ Hoy' },
    ]);
    expect(flow.last()?.text).toContain('serie 1 de');
    await flow.bot.handleUpdate(
      callbackUpdate(encodeCallbackData({ action: 'td', value: 'home' }), flow.nextUpdateId()),
    );
    expect(flow.last()?.text).toBe(renderTemplate('SC-04', { sesion: SESSION_NAMES.FULL_A }));
    await flow.act('Nueva');
    expect(flow.workouts.map((w) => [w.variant, w.status])).toEqual([
      ['GYM', 'abandoned'],
      ['HOME', 'active'],
    ]);
  });
});

describe('HU-002-3 · RN-PLAN-007 · T-041 · "Hoy no puedo" sin deuda', () => {
  const toCant = [...ONBOARDED_GYM_LXV, { text: '🏋️ Hoy' }, 'Hoy no puedo'];

  it('ofrece exprés, mover o descansar', async () => {
    const flow = await runFlow(toCant);
    expect(flow.last()?.buttons.map((b) => b.text)).toEqual(templateById('HN-01').buttons);
  });

  it('[Exprés ahora] abre la versión C', async () => {
    const flow = await runFlow([...toCant, 'Exprés ahora']);
    expect(flow.workouts[0]?.variant).toBe('EXPRESS');
    expect(flow.events.find((e) => e.name === 'cant_today_selected')?.props).toEqual({
      option: 'express',
    });
  });

  it('[Hoy descanso] no cambia el plan ni crea deuda', async () => {
    const flow = await runFlow([...toCant, 'Hoy descanso']);
    expect(flow.last()?.text).toBe(templateById('HN-02').text);
    expect(flow.weeks[0]?.days.filter((d) => d.session)).toHaveLength(3);
    expect(flow.weeks[0]?.days.map((d) => d.session?.template ?? null)).toEqual(
      flow.weeks[0]?.days.map((d) => d.session?.template ?? null),
    );
  });

  it('RN-PLAN-008 · [Mover a otro día] ofrece solo días que respetan el descanso, y mover funciona', async () => {
    const flow = await runFlow([...toCant, 'Mover a otro día']);
    const offered = flow.last()?.buttons.map((b) => b.text) ?? [];
    expect(offered.length).toBeGreaterThan(0);
    const week = flow.weeks[0];
    if (!week) throw new Error('sin plan');
    for (const label of offered) {
      const date =
        week.days[
          ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].indexOf(label)
        ]?.date ?? '';
      expect(() => rescheduleSession(week, '2026-10-19', date, 'novice')).not.toThrow();
    }
    await flow.act('Martes');
    expect(flow.last()?.text).toBe(
      renderTemplate('HN-05', { sesion: SESSION_NAMES.FULL_A, dia: 'martes' }),
    );
    expect(flow.weeks[0]?.days.slice(0, 2).map((d) => d.type)).toEqual(['REST', 'TRAINING']);
  });

  it('un botón fabricado hacia un día que rompe el descanso no mueve nada', async () => {
    const flow = await runFlow([...toCant, 'Mover a otro día']);
    await flow.bot.handleUpdate(
      callbackUpdate(
        encodeCallbackData({ action: 'td', value: 'mv_20261021' }),
        flow.nextUpdateId(),
      ),
    );
    expect(flow.last()?.text).toBe(templateById('HN-04').text);
    expect(flow.weeks[0]?.days[0]?.type).toBe('TRAINING');
  });
});

describe('RN-DQC-003 · T-041 · Hoy en un día de descanso', () => {
  it('ofrece la movilidad; confirmarla hace que el día cuente con su n.º y racha', async () => {
    const time = movableClock();
    const flow = await runFlow(ONBOARDED_GYM_LXV, { clock: time.clock });
    time.goTo('2026-10-20T15:00:00Z'); // martes, día de descanso
    await flow.act({ text: '🏋️ Hoy' });
    expect(flow.last()?.text).toBe(
      renderTemplate('HY-01', { minutos: PARAMETERS.day.restMobilityMinutes }),
    );
    await flow.act('Hice la movilidad');
    expect(flow.last()?.text).toBe(renderTemplate('HY-02', { n: 1, racha: 1 }));
    expect(flow.days).toMatchObject([{ date: '2026-10-20', counted: true, sources: ['mobility'] }]);
    await flow.act({ text: '🏋️ Hoy' });
    expect(flow.last()?.text).toBe(templateById('HY-03').text);
  });
});

describe('FR-001-11 · T-041 · teclado persistente', () => {
  it('Progreso todavía no está: KB-02', async () => {
    const flow = await runFlow([...ONBOARDED_GYM_LXV, { text: '📈 Progreso' }]);
    expect(flow.last()?.text).toBe(templateById('KB-02').text);
  });
});
