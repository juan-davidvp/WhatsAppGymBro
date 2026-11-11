import { EXERCISES, renderTemplate, templateById } from '@gymbro/content';
import { describe, expect, it } from 'vitest';
import { toTelegramHtml } from '../bot/create-bot.js';
import { ONBOARDED_GYM_LXV, runFlow } from '../testing/onboarding.js';
import { sent, textMessage } from '../testing/telegram.js';

/**
 * T-081 · `/progreso`, registro de peso y `/logros` (HU-006-2, HU-006-3,
 * RN-OBJ-010, RN-OBJ-011, RN-GAM-011). Onboarding L-X-V el lunes 2026-10-19 sin
 * peso. Las fechas de la bóveda son días operativos de Bogotá.
 */

type Flow = Awaited<ReturnType<typeof runFlow>>;

const MONDAY_NOON = new Date('2026-10-19T17:00:00Z');

async function onboarded() {
  const flow = await runFlow(ONBOARDED_GYM_LXV, { clock: () => MONDAY_NOON });
  const userId = flow.user()?.id ?? '';
  return {
    ...flow,
    userId,
    texts: () => sent(flow.calls).map((m) => m.text),
    lastSent: () => sent(flow.calls).at(-1),
    eventsNamed: (name: string) => flow.events.filter((e) => e.name === name).map((e) => e.props),
  };
}

/** Responde por escrito a PG-10 (Telegram lo marca como respuesta al mensaje del bot). */
async function replyToBot(flow: Flow, botText: string, text: string) {
  await flow.bot.handleUpdate({
    update_id: flow.nextUpdateId(),
    message: {
      ...textMessage(text),
      reply_to_message: {
        ...textMessage(botText),
        from: { id: 1, is_bot: true, first_name: 'Gym Bro' },
      },
    },
  } as never);
}

const header = (dias: number, racha = 0) =>
  toTelegramHtml(
    renderTemplate('PG-01', {
      dias_que_cuentan: dias,
      racha,
      nivel: 1,
      nombre_nivel: 'Arranque',
    }),
  );

const squat = EXERCISES.find((e) => e.pattern === 'SQUAT' && e.equipment !== 'Ninguno');

describe('HU-006-2 · T-081 · /progreso', () => {
  it('días que cuentan, racha, nivel y Reto 66; [Registrar peso] [Ver bitácora]; progress_viewed', async () => {
    const t = await onboarded();
    await t.act({ text: '/progreso' });
    const screen = t.lastSent();
    expect(screen?.text.split('\n')).toEqual([
      header(0),
      renderTemplate('PG-04', { dias: 0, meta: 66 }),
      renderTemplate('PG-07', { minimo: 3, dias: 7 }),
    ]);
    expect(screen?.buttons.map((b) => b.text)).toEqual(templateById('PG-01').buttons);
    expect(t.eventsNamed('progress_viewed')).toEqual([{}]);
  });

  it('`📈 Progreso` del teclado abre la misma pantalla', async () => {
    const t = await onboarded();
    await t.act({ text: '📈 Progreso' });
    expect(t.lastSent()?.text.split('\n')[0]).toBe(header(0));
  });

  it('RN-OBJ-010 · con 3 pesos en 7 días muestra la media móvil (nunca un solo día)', async () => {
    const t = await onboarded();
    for (const [date, kg] of [
      ['2026-10-15', 73],
      ['2026-10-17', 72.6],
      ['2026-10-19', 72.2],
    ] as const) {
      await t.deps.bodyMeasurements.recordWeight(t.userId, date, kg);
    }
    await t.act({ text: '/progreso' });
    expect(t.lastSent()?.text).toContain(renderTemplate('PG-06', { dias: 7, peso: '72,6' }));
  });

  it('RN-OBJ-011 · con un objetivo de peso con meta, la barra va de 0 a 100 %', async () => {
    const t = await onboarded();
    await t.deps.goals.activate({
      userId: t.userId,
      type: 'lose_fat',
      metric: 'weight_kg',
      startValue: 80,
      targetValue: 76,
      startDate: '2026-10-01',
      horizonWeeks: 12,
    });
    for (const date of ['2026-10-17', '2026-10-18', '2026-10-19']) {
      await t.deps.bodyMeasurements.recordWeight(t.userId, date, 78);
    }
    await t.act({ text: '/progreso' });
    expect(t.lastSent()?.text.split('\n')[1]).toBe(
      renderTemplate('PG-02', { barra: '▓▓▓▓▓░░░░░', porcentaje: 50 }),
    );
  });

  it('HU-006-2 (PO) · fuerza: un ejercicio por patrón con su mejor 1RM estimado', async () => {
    const t = await onboarded();
    if (!squat) throw new Error('el catálogo no tiene sentadilla con equipo');
    for (const [i, loadKg, reps] of [
      [0, 80, 5],
      [1, 85, 3],
    ] as const) {
      await t.deps.setEntries.record({
        userId: t.userId,
        sessionId: 's1',
        exerciseCode: squat.code,
        setIndex: i,
        reps,
        loadKg,
        edited: false,
        confirmedAt: MONDAY_NOON,
      });
    }
    await t.act({ text: '/progreso' });
    expect(t.lastSent()?.text).toContain(renderTemplate('PG-08', { lista: `${squat.name} 94 kg` }));
  });

  it('FR-006-05 · en el modo sin números no hay peso ni [Registrar peso]', async () => {
    const t = await onboarded();
    await t.deps.users.updateSettings(t.userId, { numberFreeMode: true });
    await t.deps.bodyMeasurements.recordWeight(t.userId, '2026-10-19', 72);
    await t.act({ text: '/progreso' });
    const screen = t.lastSent();
    expect(screen?.text).not.toContain('Peso');
    expect(screen?.buttons.map((b) => b.text)).toEqual(['Ver bitácora']);
  });
});

describe('HU-006-2 · T-081 · registrar el peso (PO, 2026-11-11: con botones desde el último)', () => {
  it('sin peso previo se escribe respondiendo a PG-10; un texto que no es peso recibe PG-12', async () => {
    const t = await onboarded();
    await t.act({ text: '/progreso' });
    await t.act('Registrar peso');
    const ask = t.calls.at(-1);
    expect(ask?.payload['text']).toBe(renderTemplate('PG-10'));
    expect(ask?.payload['reply_markup']).toEqual({ force_reply: true });
    await replyToBot(t, renderTemplate('PG-10'), 'hola');
    expect(t.lastSent()?.text).toBe(renderTemplate('PG-12'));
    await replyToBot(t, renderTemplate('PG-12'), '72,5 kg');
    expect(t.texts()).toContain(renderTemplate('PG-11', { peso: '72,5' }));
    expect(await t.deps.bodyMeasurements.latestWeightKg(t.userId)).toBe(72.5);
    expect(t.eventsNamed('weight_logged').at(-1)).toEqual({ source: 'progress' });
  });

  it('con un peso previo: [−0,5] [−0,1] [+0,1] [+0,5] [Guardar] desde el último, 3 toques', async () => {
    const t = await onboarded();
    await t.deps.bodyMeasurements.recordWeight(t.userId, '2026-10-18', 72.5);
    await t.act({ text: '/progreso' });
    await t.act('Registrar peso');
    const stepper = t.lastSent();
    expect(stepper?.text).toBe(toTelegramHtml(renderTemplate('PG-09', { peso: '72,5' })));
    expect(stepper?.buttons.map((b) => b.text)).toEqual([
      '−0,5',
      '−0,1',
      '+0,1',
      '+0,5',
      'Guardar',
    ]);
    await t.act('+0,5');
    expect(t.lastSent()?.text).toBe(toTelegramHtml(renderTemplate('PG-09', { peso: '73,0' })));
    await t.act('Guardar');
    expect(await t.deps.bodyMeasurements.latestWeightKg(t.userId)).toBe(73);
    // Vuelve a /progreso (editado en el mismo mensaje).
    expect(t.lastSent()?.text.split('\n')[0]).toBe(header(0));
  });
});

describe('HU-006-3 · RN-GAM-011 · T-081 · /logros', () => {
  it('sin entradas: BI-02', async () => {
    const t = await onboarded();
    await t.act({ text: '/logros' });
    expect(t.lastSent()?.text).toBe(renderTemplate('BI-02'));
    expect(t.eventsNamed('achievement_log_viewed')).toEqual([{}]);
  });

  it('logros y récords en orden cronológico con fecha y dato', async () => {
    const t = await onboarded();
    if (!squat) throw new Error('el catálogo no tiene sentadilla con equipo');
    await t.deps.achievements.appendOnce({
      userId: t.userId,
      code: 'FIRST_SESSION',
      at: new Date('2026-10-19T23:00:00Z'),
      value: null,
      context: null,
    });
    await t.deps.records.record({
      userId: t.userId,
      exerciseCode: squat.code,
      type: 'e1rm',
      value: 80,
      date: '2026-11-12',
      setKey: 'set:s2:SQ:0',
      loadKg: 80,
      reps: 5,
    });
    await t.act({ text: '/logros' });
    expect(t.lastSent()?.text.split('\n')).toEqual([
      renderTemplate('BI-01', { total: 2 }),
      renderTemplate('BI-03', { fecha: '19-oct', nombre: 'Primer día' }),
      renderTemplate('BI-04', {
        fecha: '12-nov',
        ejercicio: squat.name,
        carga: '80 kg',
        reps: 5,
        e1rm: ' (e1RM 93 kg)',
      }),
    ]);
  });

  it('[Ver bitácora] de PG-01 abre la bitácora', async () => {
    const t = await onboarded();
    await t.act({ text: '/progreso' });
    await t.act('Ver bitácora');
    expect(t.lastSent()?.text).toBe(renderTemplate('BI-02'));
  });
});
