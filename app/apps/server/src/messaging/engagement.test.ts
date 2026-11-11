import { templateById } from '@gymbro/content';
import { initialPlayerState } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { proactiveSetup } from '../testing/proactive.js';
import { callbackUpdate } from '../testing/telegram.js';

/**
 * T-072 · interacción, ignorados, retroceso, inactividad, hora habitual aprendida
 * y desvanecimiento (HU-007-1/3/6, RN-MSJ-006 a 009, FR-007-06). Onboarding L-X-V
 * el lunes 2026-10-19 (esa es su última interacción). Con hora habitual 18:00,
 * `plan_listo` del miércoles sale a las 17:00 = 22:00Z; su ventana P-067 (2 h)
 * cierra a las 00:00Z.
 */

type Setup = Awaited<ReturnType<typeof proactiveSetup>>;

const WED_17 = '2026-10-21T22:00:00Z';
const AFTER_WINDOW = '2026-10-22T00:01:00Z';
/** Primer mensaje que entrega el remitente de prueba. */
const FIRST_MESSAGE_ID = 1001;

async function run(t: Setup, from: string, to: string) {
  const end = new Date(to).getTime();
  for (let at = new Date(from).getTime(); at <= end; at += 30 * 60_000) {
    t.goTo(new Date(at).toISOString());
    await t.tick();
  }
}

/** Ciclo del miércoles a las 17:00 con hora habitual 18:00; devuelve cuántos envió. */
async function wednesdayPlanReady(t: Setup) {
  await t.setHabitTime('18:00');
  t.goTo(WED_17);
  return t.tick();
}

const stats = (t: Setup) => t.deps.messageStats.get(t.userId);

describe('FR-007-06 · RN-MSJ-007 · T-072 · acción, interacción e ignorados', () => {
  it('un toque en un botón del mensaje es su acción: message_actioned con los minutos', async () => {
    const t = await proactiveSetup();
    expect(await wednesdayPlanReady(t)).toBe(1);
    t.goTo('2026-10-21T22:30:00Z');
    const gym = t.sent[0]?.reply.buttons[0]?.data ?? '';
    await t.bot.handleUpdate(callbackUpdate(gym, t.nextUpdateId(), FIRST_MESSAGE_ID));
    expect(t.eventsNamed('message_actioned')).toEqual([
      { purpose: 'plan_listo', templateId: 'PL-01', minutes: 30 },
    ]);
    t.goTo(AFTER_WINDOW);
    await t.tick();
    expect(t.outboxOf('plan_listo')[0]).toMatchObject({ outcome: 'actioned' });
    expect(t.eventsNamed('message_ignored')).toEqual([]);
  });

  it('sin ninguna interacción en P-067 h queda ignorado (PO, 2026-11-11) y suma uno', async () => {
    const t = await proactiveSetup();
    expect(await wednesdayPlanReady(t)).toBe(1);
    t.goTo('2026-10-21T23:59:00Z'); // la ventana sigue abierta
    await t.tick();
    expect(t.outboxOf('plan_listo')[0]).toMatchObject({ outcome: null });
    t.goTo(AFTER_WINDOW);
    await t.tick();
    expect(t.outboxOf('plan_listo')[0]).toMatchObject({ outcome: 'ignored' });
    expect(t.eventsNamed('message_ignored')).toEqual([
      { purpose: 'plan_listo', templateId: 'PL-01' },
    ]);
    expect((await stats(t)).consecutiveIgnored).toBe(1);
  });

  it('otra interacción (un comando) dentro de la ventana no lo deja ignorado y reinicia la cuenta', async () => {
    const t = await proactiveSetup();
    await t.deps.messageStats.update(t.userId, { consecutiveIgnored: 2 });
    expect(await wednesdayPlanReady(t)).toBe(1);
    t.goTo('2026-10-21T22:40:00Z');
    await t.act({ text: '/hoy' });
    expect(await stats(t)).toMatchObject({
      consecutiveIgnored: 0,
      lastInteractionAt: new Date('2026-10-21T22:40:00Z'),
    });
    t.goTo(AFTER_WINDOW);
    await t.tick();
    expect(t.outboxOf('plan_listo')[0]).toMatchObject({ outcome: 'interacted' });
    expect(t.eventsNamed('message_ignored')).toEqual([]);
  });

  it('P-050 ignorados seguidos: presupuesto a la mitad P-051 días y backoff_applied', async () => {
    const t = await proactiveSetup();
    await t.deps.messageStats.update(t.userId, { consecutiveIgnored: 2 });
    expect(await wednesdayPlanReady(t)).toBe(1);
    t.goTo(AFTER_WINDOW);
    await t.tick();
    expect(t.eventsNamed('backoff_applied')).toEqual([{ days: 7 }]);
    expect(await stats(t)).toMatchObject({
      consecutiveIgnored: 0,
      backoffUntil: new Date('2026-10-29T00:01:00Z'),
    });
  });
});

describe('RN-MSJ-008 · T-072 · pausa por inactividad y reactivaciones', () => {
  it('P-053 días sin actividad: regreso final, pausa e inactivity_pause_started', async () => {
    const t = await proactiveSetup();
    // Del martes 20 al lunes 26 sin actividad: el martes 27 sale el final.
    await run(t, '2026-10-27T11:00:00Z', '2026-10-28T04:00:00Z');
    expect(t.sentTemplates()).toEqual(['regreso:RG-04']);
    expect(t.sent[0]?.reply.buttons.map((b) => b.label)).toEqual(templateById('RG-04').buttons);
    expect((await stats(t)).inactivityPausedAt).not.toBeNull();
    expect(t.eventsNamed('inactivity_pause_started')).toEqual([{ inactiveDays: 7 }]);
    // En pausa no se programa nada más (el miércoles 28 no es lunes ni día 1) y lo
    // que ya estaba en la bandeja (el aviso de la víspera) se suprime.
    const pausedAt = new Date('2026-10-27T12:30:00Z');
    await run(t, '2026-10-28T11:00:00Z', '2026-10-29T04:00:00Z');
    expect(t.outbox.filter((m) => m.createdAt > pausedAt)).toEqual([]);
    expect(t.sent).toHaveLength(1);
    expect(t.outboxOf('plan_listo')).toMatchObject([{ suppressedReason: 'inactive' }]);
  });

  it('en pausa: el día 1 sale RG-07 y el lunes RG-06 (reactivaciones); un toque lo saca de la pausa', async () => {
    const t = await proactiveSetup();
    await t.deps.messageStats.update(t.userId, {
      inactivityPausedAt: new Date('2026-10-27T12:00:00Z'),
    });
    await run(t, '2026-11-01T11:00:00Z', '2026-11-03T04:00:00Z'); // domingo 1 y lunes 2
    expect(t.sentTemplates()).toEqual(['regreso:RG-07', 'regreso:RG-06']);
    expect(t.outboxOf('regreso').every((m) => m.reactivation)).toBe(true);
    expect(t.eventsNamed('reactivation_sent')).toEqual([{ count: 1 }, { count: 2 }]);
    expect(await stats(t)).toMatchObject({
      reactivationsUsed: 2,
      lastReactivationDate: '2026-11-02',
    });
    // Vuelve: sale de la pausa con las reactivaciones en cero (PO, 2026-11-11).
    await t.act({ text: '/hoy' });
    expect(await stats(t)).toMatchObject({ inactivityPausedAt: null, reactivationsUsed: 0 });
  });

  it('con P-054 reactivaciones usadas ya no se escribe hasta que vuelva', async () => {
    const t = await proactiveSetup();
    await t.deps.messageStats.update(t.userId, {
      inactivityPausedAt: new Date('2026-10-27T12:00:00Z'),
      reactivationsUsed: 3,
    });
    await run(t, '2026-11-02T11:00:00Z', '2026-11-03T04:00:00Z');
    expect(t.outbox).toEqual([]);
  });
});

describe('RN-MSJ-006 · T-072 · hora habitual aprendida', () => {
  it('con P-049 miércoles empezados a las 19:00, plan_listo sale a las 18:00 y no a las 17:00', async () => {
    const t = await proactiveSetup();
    await t.setHabitTime('18:00');
    await t.act({ text: '🏋️ Hoy' });
    await t.act('Gym');
    const base = t.workouts.at(-1);
    if (!base) throw new Error('sin sesión de base');
    for (const md of ['09-09', '09-16', '09-23', '09-30', '10-07', '10-14']) {
      const date = `2026-${md}`;
      const next = new Date(new Date(`${date}T00:00:00Z`).getTime() + 86_400_000);
      await t.deps.workouts.create({
        ...base,
        date,
        status: 'completed',
        startedAt: next, // 19:00 en Bogotá
        endedAt: next,
      });
    }
    t.goTo(WED_17);
    expect(await t.tick()).toBe(0);
    const habit = await t.deps.habits.get(t.userId);
    expect(habit?.days.find((d) => d.weekday === 'wednesday')?.learnedStart).toBe('19:00');
    expect(habit?.days.find((d) => d.weekday === 'monday')?.learnedStart).toBeNull();
    t.goTo('2026-10-21T23:00:00Z');
    expect(await t.tick()).toBe(1);
    expect(t.sentTemplates()).toEqual(['plan_listo:PL-01']);
  });
});

describe('RN-MSJ-009 · T-072 · menos recordatorios con el hábito', () => {
  const withWeekStreak = (t: Setup, weekStreak: number) =>
    t.streakStates.set(t.userId, { rev: 1, state: { ...initialPlayerState(), weekStreak } });

  /** Un `plan_listo` enviado la semana anterior, con o sin acción. */
  async function previousPlanReady(t: Setup, actioned: boolean) {
    await t.deps.outbox.schedule(
      {
        userId: t.userId,
        key: 'plan_listo:2026-10-14',
        purpose: 'plan_listo',
        scheduledFor: new Date('2026-10-14T22:00:00Z'),
        notAfter: null,
        reactivation: false,
      },
      new Date('2026-10-14T21:00:00Z'),
    );
    const old = t.outboxOf('plan_listo')[0];
    if (!old) throw new Error('sin salida previa');
    await t.deps.outbox.markSent(old.id, {
      templateId: 'PL-02',
      sentAt: new Date('2026-10-14T22:00:00Z'),
      telegramMessageId: 1,
    });
    if (actioned) await t.deps.outbox.markActioned(old.id, new Date('2026-10-14T22:10:00Z'));
  }

  it('tras P-055 semanas cumplidas, recordatorio_contextual se suprime (disabled_purpose)', async () => {
    const t = await proactiveSetup();
    withWeekStreak(t, 8);
    // Miércoles de entreno sin actividad y jueves de descanso.
    await run(t, '2026-10-22T11:00:00Z', '2026-10-23T04:00:00Z');
    expect(t.outboxOf('recordatorio_contextual')[0]).toMatchObject({
      suppressedReason: 'disabled_purpose',
    });
  });

  it('plan_listo sigue si su tasa de acción llega a P-056', async () => {
    const t = await proactiveSetup();
    withWeekStreak(t, 8);
    await previousPlanReady(t, true);
    expect(await wednesdayPlanReady(t)).toBe(1);
  });

  it('plan_listo se apaga si su tasa de acción no llega a P-056', async () => {
    const t = await proactiveSetup();
    withWeekStreak(t, 8);
    await previousPlanReady(t, false);
    expect(await wednesdayPlanReady(t)).toBe(0);
    expect(t.outboxOf('plan_listo').at(-1)).toMatchObject({
      suppressedReason: 'disabled_purpose',
    });
  });
});
