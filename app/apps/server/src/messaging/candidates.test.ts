import { renderTemplate, templateById } from '@gymbro/content';
import { operationalDate, type DayStatus, type LocalDate } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { proactiveSetup } from '../testing/proactive.js';
import { weeklyPhrase } from './compose-week.js';

/**
 * T-071 · candidatos de M7 (HU-007-3, HU-007-5, RN-MSJ-008, 016, 017). Onboarding
 * L-X-V el lunes 2026-10-19 en Bogotá (UTC−5). Para aislar un propósito se marca
 * el lunes como día que cuenta (así no hay `regreso` ni `recordatorio_contextual`).
 */

type Setup = Awaited<ReturnType<typeof proactiveSetup>>;

const COUNTED: DayStatus = {
  trainingHalf: true,
  nutritionHalf: false,
  activeRecovery: false,
  counts: true,
  complete: false,
};

const counted = (t: Setup, date: LocalDate) =>
  t.deps.days.saveStatus(t.userId, date, 'TRAINING', COUNTED);

const favorite = (t: Setup) =>
  t.deps.favorites.create({
    userId: t.userId,
    name: 'Desayuno',
    portions: { palm: 1, cuppedHand: 1, fist: 1, thumb: 0 },
    foodCodes: [],
  });

/** Ciclos cada 30 minutos entre dos instantes (como el planificador, más espaciado). */
async function run(t: Setup, from: string, to: string) {
  const end = new Date(to).getTime();
  for (let at = new Date(from).getTime(); at <= end; at += 30 * 60_000) {
    t.goTo(new Date(at).toISOString());
    await t.tick();
  }
}

const TUE_20H = '2026-10-21T01:00:00Z';
const WED_20H = '2026-10-22T01:00:00Z';

describe('RN-MSJ-016 · T-071 · cierre_del_dia solo si sirve (HU-007-5)', () => {
  it('escenario 1 · descanso sin la mitad de comida y con frecuente: CD-01 con [Lo de siempre] [Porciones]', async () => {
    const t = await proactiveSetup();
    await counted(t, '2026-10-19');
    await favorite(t);
    t.goTo(TUE_20H);
    expect(await t.tick()).toBe(1);
    expect(t.sentTemplates()).toEqual(['cierre_del_dia:CD-01']);
    expect(t.sent[0]?.reply.buttons.map((b) => b.label)).toEqual(['Lo de siempre', 'Porciones']);
    expect(t.sent[0]?.reply.text).toMatch(
      /^Te falta poco para que hoy cuente: \d+ g de proteína\.$/,
    );
  });

  it('escenario 2 · a un día de entreno le falta la sesión: no se envía (not_doable)', async () => {
    const t = await proactiveSetup();
    await counted(t, '2026-10-19');
    await favorite(t);
    t.goTo(WED_20H);
    await t.tick();
    expect(t.sent).toEqual([]);
    expect(t.outboxOf('cierre_del_dia')[0]).toMatchObject({ suppressedReason: 'not_doable' });
  });

  it('ampliada (PO, 2026-11-10) · el día ya cuenta y solo le falta la comida para completo: CD-03', async () => {
    const t = await proactiveSetup();
    await counted(t, '2026-10-19');
    await favorite(t);
    await t.deps.days.addSource(t.userId, '2026-10-21', 'TRAINING', 'session:s1');
    t.goTo(WED_20H);
    expect(await t.tick()).toBe(1);
    expect(t.sentTemplates()).toEqual(['cierre_del_dia:CD-03']);
  });

  it('sin una comida frecuente no se puede en P-073 toques: se suprime (not_doable)', async () => {
    const t = await proactiveSetup();
    await counted(t, '2026-10-19');
    t.goTo(TUE_20H);
    await t.tick();
    expect(t.sent).toEqual([]);
    expect(t.outboxOf('cierre_del_dia')[0]).toMatchObject({ suppressedReason: 'not_doable' });
  });

  it('el día ya completo no recibe cierre (day_already_counts)', async () => {
    const t = await proactiveSetup();
    await counted(t, '2026-10-19');
    await favorite(t);
    await t.deps.days.addSource(t.userId, '2026-10-21', 'TRAINING', 'session:s1');
    await t.deps.days.addSource(t.userId, '2026-10-21', 'TRAINING', 'nutrition_half');
    await t.deps.days.saveStatus(t.userId, '2026-10-21', 'TRAINING', {
      ...COUNTED,
      nutritionHalf: true,
      complete: true,
    });
    t.goTo(WED_20H);
    await t.tick();
    expect(t.outboxOf('cierre_del_dia')[0]).toMatchObject({
      suppressedReason: 'day_already_counts',
    });
  });
});

describe('RN-MSJ-008 · T-071 · un solo regreso tras P-052 días de entreno sin actividad (HU-007-3)', () => {
  it("una semana sin actividad: 1 regreso con [Exprés 15'] [Ajustar plan] y nunca dos", async () => {
    const t = await proactiveSetup();
    await t.setHabitTime('18:00');
    await run(t, '2026-10-19T16:00:00Z', '2026-10-26T04:00:00Z');
    const comebacks = t.sent.filter((m) => m.reply.text.startsWith('Aquí sigo'));
    expect(t.sentTemplates().filter((s) => s.startsWith('regreso:'))).toEqual(['regreso:RG-01']);
    expect(comebacks).toHaveLength(1);
    expect(comebacks[0]?.reply.buttons.map((b) => b.label)).toEqual(templateById('RG-01').buttons);
    // Lunes y miércoles planificados sin actividad: sale el jueves.
    expect(operationalDate(comebacks[0]?.at ?? new Date(0), 'America/Bogota')).toBe('2026-10-22');
  });

  it('si vuelve a entrenar, el conteo empieza de nuevo y no sale regreso', async () => {
    const t = await proactiveSetup();
    await t.setHabitTime('18:00');
    await counted(t, '2026-10-21');
    await run(t, '2026-10-22T12:00:00Z', '2026-10-23T04:00:00Z');
    expect(t.outboxOf('regreso')).toEqual([]);
  });
});

describe('T-071 · recordatorio_contextual con disparador único (PO, 2026-11-10)', () => {
  it("ayer era de entreno y no contó, hoy es descanso: RC-01 con [Exprés 15']", async () => {
    const t = await proactiveSetup();
    await t.setHabitTime('18:00');
    await counted(t, '2026-10-19');
    // Miércoles de entreno sin actividad; jueves de descanso.
    await run(t, '2026-10-22T12:00:00Z', '2026-10-23T04:00:00Z');
    expect(t.sentTemplates()).toEqual(['recordatorio_contextual:RC-01']);
    expect(t.sent[0]?.reply.buttons.map((b) => b.label)).toEqual(templateById('RC-01').buttons);
  });

  it('si ayer contó, no hay recordatorio', async () => {
    const t = await proactiveSetup();
    await t.setHabitTime('18:00');
    await counted(t, '2026-10-21');
    await run(t, '2026-10-22T12:00:00Z', '2026-10-23T04:00:00Z');
    expect(t.outboxOf('recordatorio_contextual')).toEqual([]);
  });
});

const SUNDAY_19H = '2026-10-26T00:00:00Z';

describe('RN-MSJ-017 · T-071 · resumen_semanal en texto el domingo a las 19:00 (P-060)', () => {
  it('sin semana anterior: RS-04 con los días que cuentan y la frase de la semana', async () => {
    const t = await proactiveSetup();
    await counted(t, '2026-10-19');
    await counted(t, '2026-10-21');
    await counted(t, '2026-10-23');
    t.goTo(SUNDAY_19H);
    expect(await t.tick()).toBe(1);
    expect(t.sent[0]?.reply.text).toBe(
      renderTemplate('RS-04', { dqc: 3, frase_semana: weeklyPhrase('2026-10-19') }),
    );
    expect(t.sent[0]?.reply.buttons.map((b) => b.label)).toEqual(['Ver plan', 'Ajustar días']);
  });

  it('con semana anterior y comidas: RS-01 con la proteína media', async () => {
    const t = await proactiveSetup();
    await counted(t, '2026-10-19');
    await counted(t, '2026-10-21');
    await counted(t, '2026-10-23');
    await t.deps.weeks.save(t.userId, {
      weekStart: '2026-10-12',
      planned: 3,
      completed: 2,
      commitment: 2,
      fulfilled: true,
      countedDays: 2,
      nutritionHalfDays: 0,
      restDaysPlanned: 4,
      restDaysTrained: 0,
    });
    for (const [date, proteinG] of [
      ['2026-10-19', 30],
      ['2026-10-21', 50],
    ] as const) {
      await t.deps.meals.record({
        userId: t.userId,
        date,
        loggedAt: new Date(`${date}T17:00:00Z`),
        method: 'portions',
        portions: { palm: 1, cuppedHand: 0, fist: 0, thumb: 0 },
        proteinG,
        favoriteMealId: null,
        durationMs: 1000,
        taps: 2,
        idempotencyKey: `meal:${date}`,
      });
    }
    t.deps.random = () => 0.99; // la rotación elige la última opción (RS-01)
    t.goTo(SUNDAY_19H);
    expect(await t.tick()).toBe(1);
    expect(t.sentTemplates()).toEqual(['resumen_semanal:RS-01']);
    expect(t.sent[0]?.reply.text).toContain('3 días que cuentan (2 la anterior)');
    expect(t.sent[0]?.reply.text).toContain('proteína media 40 g');
  });

  it('una semana sin días que cuentan no recibe resumen [supuesto, para el PO]', async () => {
    const t = await proactiveSetup();
    t.goTo(SUNDAY_19H);
    await t.tick();
    expect(t.outboxOf('resumen_semanal')[0]).toMatchObject({ suppressedReason: 'not_doable' });
  });

  it('solo se programa el domingo', async () => {
    const t = await proactiveSetup();
    await run(t, '2026-10-19T16:00:00Z', '2026-10-25T04:00:00Z');
    expect(t.outboxOf('resumen_semanal')).toEqual([]);
  });
});
