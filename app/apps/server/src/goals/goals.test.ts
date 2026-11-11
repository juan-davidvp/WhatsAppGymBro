import { renderTemplate, templateById } from '@gymbro/content';
import { PARAMETERS, addDays, type DayStatus, type LocalDate } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { evaluateClosedWeek } from '../scheduler/close-week.js';
import { proactiveSetup } from '../testing/proactive.js';
import { sent } from '../testing/telegram.js';
import { reviewGoalDay } from './goal-review.js';

/**
 * T-082 · objetivo cumplido, plazo cumplido, revisión de fase y mantenimiento
 * (HU-006-4 a 6, RN-OBJ-006, 008, 013, RN-MAN-001 a 003, 005). Onboarding L-X-V el
 * lunes 2026-10-19; el objetivo de peso se fija a mano para cada caso.
 */

type Setup = Awaited<ReturnType<typeof proactiveSetup>>;

const TODAY = '2026-10-19';

async function weightGoal(
  t: Setup,
  goal: { start: number; target: number; startDate: LocalDate; weeks: number },
) {
  await t.deps.goals.activate({
    userId: t.userId,
    type: 'lose_fat',
    metric: 'weight_kg',
    startValue: goal.start,
    targetValue: goal.target,
    startDate: goal.startDate,
    horizonWeeks: goal.weeks,
  });
}

async function weighDaily(t: Setup, from: LocalDate, to: LocalDate, kg: number) {
  for (let date = from; date <= to; date = addDays(date, 1)) {
    await t.deps.bodyMeasurements.recordWeight(t.userId, date, kg);
  }
}

const pendingNotices = (t: Setup) => t.notices.filter((n) => n.userId === t.userId);
const userOf = (t: Setup) => {
  const user = t.user();
  if (!user) throw new Error('sin usuario');
  return user;
};

describe('RN-OBJ-006 · T-082 · objetivo cumplido (HU-006-4 escenario 1)', () => {
  it('la media móvil en la meta P-007 semanas: GO-01 con el capítulo, GOAL_DONE y goal_completed', async () => {
    const t = await proactiveSetup();
    await weightGoal(t, { start: 80, target: 76, startDate: '2026-08-10', weeks: 12 });
    await weighDaily(t, '2026-09-25', TODAY, 75.8);
    await reviewGoalDay(userOf(t), TODAY, t.deps);
    expect(await t.deps.goals.latest(t.userId)).toMatchObject({
      status: 'completed',
      progressPct: 100,
    });
    expect(pendingNotices(t).map((n) => [n.templateId, n.variables])).toEqual([
      ['GO-01', { semanas: 10, dias_que_cuentan: 0, records: 0 }],
    ]);
    expect(t.achievements.map((a) => a.code)).toContain('GOAL_DONE');
    expect(t.eventsNamed('goal_completed')).toEqual([{ type: 'lose_fat' }]);
    // El aviso llega con [Mantener] [Nueva meta].
    await t.act({ text: '/hoy' });
    const goalNotice = sent(t.calls).find((m) => m.text.startsWith('Sí era posible'));
    expect(goalNotice?.buttons.map((b) => b.text)).toEqual(templateById('GO-01').buttons);
  });

  it('un día menos de lo sostenido (P-007 semanas) todavía no lo cumple', async () => {
    const t = await proactiveSetup();
    await weightGoal(t, { start: 80, target: 76, startDate: '2026-08-10', weeks: 12 });
    const days = PARAMETERS.goal.weeksToSustainTarget * 7;
    await weighDaily(t, addDays(TODAY, -(days + 5)), addDays(TODAY, -(days - 1)), 77);
    await weighDaily(t, addDays(TODAY, -(days - 2)), TODAY, 75.8);
    await reviewGoalDay(userOf(t), TODAY, t.deps);
    expect(await t.deps.goals.active(t.userId)).not.toBeNull();
    expect(pendingNotices(t)).toEqual([]);
  });
});

describe('RN-OBJ-008 · T-082 · fin del plazo sin la meta (HU-006-4 escenario 2)', () => {
  it('queda completado parcial con el %, GO-02 con [Extender] [Ajustar]; [Extender] suma P-001', async () => {
    const t = await proactiveSetup();
    await weightGoal(t, { start: 80, target: 76, startDate: '2026-07-01', weeks: 12 });
    await weighDaily(t, '2026-10-10', TODAY, 78);
    await reviewGoalDay(userOf(t), TODAY, t.deps);
    expect(await t.deps.goals.latest(t.userId)).toMatchObject({
      status: 'partially_completed',
      progressPct: 50,
    });
    expect(pendingNotices(t)[0]).toMatchObject({
      templateId: 'GO-02',
      variables: { porcentaje: 50 },
    });
    expect(t.eventsNamed('goal_partially_completed')).toEqual([{ progressPct: 50 }]);
    await t.act({ text: '/hoy' });
    await t.act('Extender');
    expect(sent(t.calls).at(-1)?.text).toBe(
      renderTemplate('GO-06', { semanas: PARAMETERS.goal.horizonWeeksDefault }),
    );
    expect(await t.deps.goals.active(t.userId)).toMatchObject({
      startValue: 80,
      targetValue: 76,
      horizonWeeks: 12 + PARAMETERS.goal.horizonWeeksDefault,
    });
  });
});

describe('RN-OBJ-013 · T-082 · revisión de fase cada P-057 semanas (HU-006-6)', () => {
  const start = addDays(TODAY, -PARAMETERS.goal.phaseReviewWeeks * 7);

  it('con el ritmo fuera de límites: GO-03 con opciones y phase_reviewed', async () => {
    const t = await proactiveSetup();
    await weightGoal(t, { start: 80, target: 70, startDate: start, weeks: 24 });
    await weighDaily(t, addDays(TODAY, -6), TODAY, 74);
    await reviewGoalDay(userOf(t), TODAY, t.deps);
    expect(t.eventsNamed('phase_reviewed')).toEqual([{ withinLimits: false }]);
    expect(pendingNotices(t)[0]).toMatchObject({ templateId: 'GO-03' });
  });

  it('dentro de límites: solo se registra la revisión, sin mensaje', async () => {
    const t = await proactiveSetup();
    await weightGoal(t, { start: 80, target: 76, startDate: start, weeks: 24 });
    await weighDaily(t, addDays(TODAY, -6), TODAY, 79);
    await reviewGoalDay(userOf(t), TODAY, t.deps);
    expect(t.eventsNamed('phase_reviewed')).toEqual([{ withinLimits: true }]);
    expect(pendingNotices(t)).toEqual([]);
  });
});

describe('RN-MAN-001 · RN-MAN-002 · RN-MAN-005 · T-082 · modo mantenimiento (HU-006-5)', () => {
  it('[Mantener]: objetivo maintain, zona ± P-011 %, intensidad Baja y GO-04', async () => {
    const t = await proactiveSetup();
    await weightGoal(t, { start: 80, target: 76, startDate: '2026-08-10', weeks: 12 });
    await weighDaily(t, '2026-09-25', TODAY, 75.8);
    await reviewGoalDay(userOf(t), TODAY, t.deps);
    await t.act({ text: '/hoy' });
    await t.act('Mantener');
    expect(sent(t.calls).at(-1)?.text).toBe(
      renderTemplate('GO-04', { sesiones: 2, bajo: '74,3', alto: '77,3' }),
    );
    expect(await t.deps.goals.active(t.userId)).toMatchObject({
      type: 'maintain',
      startValue: 75.8,
    });
    expect(userOf(t).settings.intensity).toBe('LOW');
    expect(t.eventsNamed('maintenance_entered')).toEqual([{ source: 'choice' }]);
  });

  it('sin elegir en P-009 días, entra solo (GO-04 como aviso)', async () => {
    const t = await proactiveSetup();
    await weightGoal(t, { start: 80, target: 76, startDate: '2026-08-10', weeks: 12 });
    await weighDaily(t, '2026-09-25', TODAY, 75.8);
    await reviewGoalDay(userOf(t), TODAY, t.deps);
    t.goTo('2026-10-26T12:00:00Z');
    const later = addDays(TODAY, PARAMETERS.maintenance.daysToChooseAfterGoal);
    await reviewGoalDay(userOf(t), addDays(later, -1), t.deps);
    expect(await t.deps.goals.active(t.userId)).toBeNull();
    await reviewGoalDay(userOf(t), later, t.deps);
    expect(await t.deps.goals.active(t.userId)).toMatchObject({ type: 'maintain' });
    expect(pendingNotices(t).map((n) => n.templateId)).toEqual(['GO-01', 'GO-04']);
    expect(t.eventsNamed('maintenance_entered')).toEqual([{ source: 'timeout' }]);
  });

  it('en mantenimiento la semana se cumple con P-010 sesiones (el plan no cambia)', async () => {
    const t = await proactiveSetup();
    await t.deps.goals.activate({
      userId: t.userId,
      type: 'maintain',
      metric: 'weight_kg',
      startValue: 75,
      targetValue: 75,
      startDate: TODAY,
      horizonWeeks: 12,
    });
    t.goTo('2026-10-26T09:00:00Z');
    const week = await evaluateClosedWeek(userOf(t), '2026-10-25', t.deps);
    expect(week?.result).toMatchObject({ evaluated: true, commitment: 2 });
  });
});

describe('RN-MAN-003 · T-082 · mantenimiento fuera de la zona P-012 semanas', () => {
  const COUNTED: DayStatus = {
    trainingHalf: true,
    nutritionHalf: false,
    activeRecovery: false,
    counts: true,
    complete: false,
  };

  it('el lunes sale MA con [Ver opciones]; [Mover mi zona] la centra en el peso actual', async () => {
    const t = await proactiveSetup();
    for (const date of ['2026-10-19', '2026-10-21', '2026-10-23', '2026-10-26']) {
      await t.deps.days.saveStatus(t.userId, date, 'TRAINING', COUNTED);
    }
    await t.deps.goals.activate({
      userId: t.userId,
      type: 'maintain',
      metric: 'weight_kg',
      startValue: 75,
      targetValue: 75,
      startDate: '2026-09-01',
      horizonWeeks: 12,
    });
    await weighDaily(t, '2026-10-08', '2026-10-25', 78);
    for (let hour = 11; hour <= 22; hour += 1) {
      t.goTo(`2026-10-26T${String(hour).padStart(2, '0')}:00:00Z`);
      await t.tick();
    }
    expect(t.eventsNamed('maintenance_band_exited')).toEqual([{}]);
    expect(t.sentTemplates()).toEqual(['mantenimiento:MA-01']);
    expect(t.sent[0]?.reply.buttons.map((b) => b.label)).toEqual(templateById('MA-01').buttons);
    const options = t.sent[0]?.reply.buttons[0]?.data ?? '';
    await t.bot.handleUpdate({
      update_id: t.nextUpdateId(),
      callback_query: {
        id: 'cb',
        from: { id: 42, is_bot: false, first_name: 'Juan' },
        chat_instance: 'ci',
        data: options,
        message: { message_id: 1001, date: 0, chat: { id: 42, type: 'private' }, text: 'x' },
      },
    } as never);
    expect(sent(t.calls).at(-1)?.text).toBe(renderTemplate('GO-09'));
    await t.act('Mover mi zona');
    expect(sent(t.calls).at(-1)?.text).toBe(
      renderTemplate('GO-10', { bajo: '76,4', alto: '79,6' }),
    );
    expect(await t.deps.goals.active(t.userId)).toMatchObject({
      type: 'maintain',
      startValue: 78,
    });
  });
});

describe('HU-006-4 · T-082 · [Nueva meta] reutiliza el onboarding (PO, 2026-11-11)', () => {
  it('sin peso ni estatura: ON-05 y un objetivo sin meta (GO-07)', async () => {
    const t = await proactiveSetup();
    await weightGoal(t, { start: 80, target: 76, startDate: '2026-08-10', weeks: 12 });
    await weighDaily(t, '2026-09-25', TODAY, 75.8);
    await reviewGoalDay(userOf(t), TODAY, t.deps);
    await t.act({ text: '/hoy' });
    await t.act('Nueva meta');
    expect(sent(t.calls).at(-1)?.text).toBe(renderTemplate('ON-05'));
    await t.act('Ser constante');
    expect(sent(t.calls).at(-1)?.text).toBe(renderTemplate('GO-07', { objetivo: 'Ser constante' }));
    expect(await t.deps.goals.active(t.userId)).toMatchObject({ type: 'consistency' });
    expect(userOf(t).profile.goalType).toBe('consistency');
  });

  it('con peso y estatura, ganar músculo propone la meta (ON-06) y [Me sirve] la fija (GO-08)', async () => {
    const t = await proactiveSetup();
    await t.deps.users.updateProfile(t.userId, { heightCm: 175 });
    await weightGoal(t, { start: 80, target: 76, startDate: '2026-08-10', weeks: 12 });
    await weighDaily(t, '2026-09-25', TODAY, 75.8);
    await reviewGoalDay(userOf(t), TODAY, t.deps);
    await t.act({ text: '/hoy' });
    await t.act('Nueva meta');
    await t.act('Ganar músculo');
    expect(sent(t.calls).at(-1)?.text).toMatch(/Te propongo/);
    await t.act('Me sirve');
    expect(sent(t.calls).at(-1)?.text).toMatch(/^Listo, objetivo nuevo: Ganar músculo, meta/);
    expect(await t.deps.goals.active(t.userId)).toMatchObject({
      type: 'gain_muscle',
      metric: 'weight_kg',
      startValue: 75.8,
    });
    expect(t.eventsNamed('goal_set').at(-1)).toMatchObject({
      type: 'gain_muscle',
      withTarget: true,
    });
  });
});
