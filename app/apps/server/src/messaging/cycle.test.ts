import { SESSION_NAMES, renderTemplate, templateById } from '@gymbro/content';
import {
  PARAMETERS,
  daysBetween,
  isInQuietHours,
  messageBudget,
  operationalDate,
  weekStartOf,
} from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { proactiveSetup } from '../testing/proactive.js';

/**
 * T-070 · bandeja de salida y ciclo del planificador (HU-007-1/2, FR-007-02/03).
 * El miércoles 2026-10-21 toca entrenar; con hora habitual 18:00 (Bogotá, UTC−5),
 * `plan_listo` sale a las 17:00 (P-048) = 22:00Z y vale hasta las 18:00 = 23:00Z.
 */

const COUNTED_DAY = {
  trainingHalf: true,
  nutritionHalf: false,
  activeRecovery: false,
  counts: true,
  complete: false,
};

const TZ = 'America/Bogota';
const WED_16 = '2026-10-21T21:00:00Z';
const WED_17 = '2026-10-21T22:00:00Z';

describe('RN-MSJ-005 · RN-MSJ-015 · T-070 · plan_listo pasa por la bandeja y el motor', () => {
  it('se programa una vez y sale P-048 minutos antes de la hora habitual, con sus 4 botones', async () => {
    const t = await proactiveSetup();
    await t.setHabitTime('18:00');
    t.goTo(WED_16);
    expect(await t.tick()).toBe(0);
    expect(t.outboxOf('plan_listo')).toMatchObject([
      { key: 'plan_listo:2026-10-21', status: 'pending' },
    ]);
    t.goTo(WED_17);
    expect(await t.tick()).toBe(1);
    expect(await t.tick()).toBe(0); // otro ciclo no lo repite
    const [message] = t.sent;
    expect(message?.reply.buttons.map((b) => b.label)).toEqual(templateById('PL-01').buttons);
    expect(t.outboxOf('plan_listo')[0]).toMatchObject({ status: 'sent', templateId: 'PL-01' });
    expect(t.eventsNamed('message_sent')).toEqual([{ purpose: 'plan_listo', templateId: 'PL-01' }]);
    // El texto es la plantilla con sus variables (sesión del plan y minutos).
    const week = t.weeks.find((w) => w.weekStart === '2026-10-19');
    const session = week?.days.find((d) => d.date === '2026-10-21')?.session;
    expect(message?.reply.text).toBe(
      renderTemplate('PL-01', {
        sesion: SESSION_NAMES[session?.template ?? 'FULL_A'],
        minutos: Math.round(session?.versions.GYM.estimatedMinutes ?? 0),
      }),
    );
  });

  it('HU-007-1 escenario 2 · si la sesión ya empezó, se suprime (day_already_counts)', async () => {
    const t = await proactiveSetup();
    await t.setHabitTime('18:00');
    t.goTo(WED_16);
    await t.tick();
    await t.act({ text: '🏋️ Hoy' });
    await t.act('Gym');
    t.goTo(WED_17);
    await t.tick();
    expect(t.sent).toEqual([]);
    expect(t.outboxOf('plan_listo')[0]).toMatchObject({
      status: 'suppressed',
      suppressedReason: 'day_already_counts',
    });
  });

  it('SPEC-007 §8 · una salida vieja (servidor caído) se suprime con stale, no se envía tarde', async () => {
    const t = await proactiveSetup();
    await t.setHabitTime('18:00');
    t.goTo(WED_16);
    await t.tick();
    t.goTo('2026-10-21T23:30:00Z'); // 18:30: ya pasó la hora habitual
    await t.tick();
    expect(t.sent).toEqual([]);
    expect(t.outboxOf('plan_listo')[0]).toMatchObject({
      status: 'suppressed',
      suppressedReason: 'stale',
    });
    expect(t.eventsNamed('message_suppressed')).toEqual([
      { purpose: 'plan_listo', reason: 'stale' },
    ]);
  });

  it('pasada la hora habitual ya no se programa', async () => {
    const t = await proactiveSetup();
    await t.setHabitTime('18:00');
    t.goTo('2026-10-21T23:30:00Z');
    await t.tick();
    expect(t.outboxOf('plan_listo')).toEqual([]);
  });

  it('RN-MSJ-005 (ampliada) · si el aviso caería en silencio, sale la noche anterior con PL-06 y [Ver plan]', async () => {
    const t = await proactiveSetup();
    // El lunes contó: el martes no hay recordatorio_contextual que ocupe el hueco.
    await t.deps.days.saveStatus(t.userId, '2026-10-19', 'TRAINING', COUNTED_DAY);
    await t.setHabitTime('07:30'); // aviso a las 06:30, dentro de 21:30–07:00
    t.goTo('2026-10-21T02:00:00Z'); // martes 21:00
    await t.tick();
    expect(t.outboxOf('plan_listo')).toMatchObject([
      // Martes 21:29 (un minuto antes del silencio), válido hasta que empieza.
      {
        key: 'plan_listo:2026-10-21',
        scheduledFor: new Date('2026-10-21T02:29:00Z'),
        notAfter: new Date('2026-10-21T02:30:00Z'),
      },
    ]);
    t.goTo('2026-10-21T02:29:00Z');
    expect(await t.tick()).toBe(1);
    const week = t.weeks.find((w) => w.weekStart === '2026-10-19');
    const session = week?.days.find((d) => d.date === '2026-10-21')?.session;
    expect(t.sent[0]?.reply.text).toBe(
      renderTemplate('PL-06', { sesion: SESSION_NAMES[session?.template ?? 'FULL_A'] }),
    );
    expect(t.sent[0]?.reply.buttons.map((b) => b.label)).toEqual(['Ver plan']);
    // El miércoles por la mañana no sale otro.
    t.goTo('2026-10-21T11:30:00Z');
    expect(await t.tick()).toBe(0);
  });

  it('RN-MSJ-004 · una salida de la víspera que se atrasa hasta el silencio se suprime (stale)', async () => {
    const t = await proactiveSetup();
    // El lunes contó: el martes no hay recordatorio_contextual que ocupe el hueco.
    await t.deps.days.saveStatus(t.userId, '2026-10-19', 'TRAINING', COUNTED_DAY);
    await t.setHabitTime('07:30');
    t.goTo('2026-10-21T02:00:00Z');
    await t.tick();
    t.goTo('2026-10-21T02:45:00Z'); // martes 21:45: ya empezó el silencio
    await t.tick();
    expect(t.sent).toEqual([]);
    expect(t.outboxOf('plan_listo')[0]).toMatchObject({ suppressedReason: 'stale' });
  });
});

/** Generador pseudoaleatorio con semilla (LCG): la simulación es reproducible. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

describe('SC-007-1 · G06 · T-072 · 60 días con comportamientos aleatorios: 0 violaciones', () => {
  it(
    'presupuesto, silencio, separación y rotación se cumplen en cada envío',
    { timeout: 120_000 },
    async () => {
      const t = await proactiveSetup();
      const random = seeded(7);
      const hours = ['06:30', '08:00', '12:00', '17:00', '19:00', '21:00', '22:30'] as const;
      const start = new Date('2026-10-19T16:00:00Z').getTime();
      const step = 30 * 60_000;
      const ticksPerDay = 48;
      for (let i = 0; i < 60 * ticksPerDay; i += 1) {
        const at = new Date(start + i * step);
        t.goTo(at.toISOString());
        // Del día 25 al 39, ausente: pasa por el regreso final, la pausa y una reactivación.
        const absent = i >= 25 * ticksPerDay && i < 40 * ticksPerDay;
        if (i % ticksPerDay === 0) {
          await t.setHabitTime(hours[Math.floor(random() * hours.length)] ?? '18:00');
          // Algunos días cuentan; otros no hay nada (activa regreso, pausa y reactivación).
          if (!absent && random() < 0.4) {
            await t.deps.days.saveStatus(
              t.userId,
              operationalDate(at, TZ),
              'TRAINING',
              COUNTED_DAY,
            );
          }
        }
        // De vez en cuando un comando: interacción que reinicia ignorados y saca de la pausa.
        if (!absent && random() < 0.01) await t.act({ text: '/hoy' });
        await t.tick();
      }
      const quietHours = t.user()?.settings.quietHours ?? PARAMETERS.messages.quietHours;
      const budget = messageBudget('NORMAL', 'TRAINING', false);
      const sent = t.outbox
        .filter((m) => m.status === 'sent')
        .sort((a, b) => (a.sentAt?.getTime() ?? 0) - (b.sentAt?.getTime() ?? 0));
      expect(sent.length).toBeGreaterThan(10);
      expect(new Set(sent.map((m) => m.purpose)).size).toBeGreaterThan(2);
      // La simulación pasa por ignorados y retroceso, no solo por el camino feliz.
      expect(t.eventsNamed('message_ignored').length).toBeGreaterThan(0);
      expect(t.eventsNamed('backoff_applied').length).toBeGreaterThan(0);
      expect(t.eventsNamed('inactivity_pause_started').length).toBeGreaterThan(0);
      expect(t.eventsNamed('reactivation_sent').length).toBeGreaterThan(0);
      sent.forEach((message, i) => {
        const at = message.sentAt ?? new Date(0);
        expect(isInQuietHours(at, quietHours, TZ)).toBe(false);
        const previous = sent[i - 1]?.sentAt;
        if (previous) {
          expect(at.getTime() - previous.getTime()).toBeGreaterThanOrEqual(
            PARAMETERS.messages.minGapHours * 3_600_000,
          );
        }
        const date = operationalDate(at, TZ);
        const sameDay = sent.filter((m) => m.sentAt && operationalDate(m.sentAt, TZ) === date);
        const sameWeek = sent.filter(
          (m) => m.sentAt && weekStartOf(operationalDate(m.sentAt, TZ)) === weekStartOf(date),
        );
        expect(sameDay.length).toBeLessThanOrEqual(budget.perDay);
        expect(sameWeek.length).toBeLessThanOrEqual(budget.perWeek);
        // RN-MSJ-010: la misma plantilla no vuelve en P-058 días operativos.
        const repeated = sent
          .slice(0, i)
          .filter(
            (m) =>
              m.templateId === message.templateId &&
              daysBetween(operationalDate(m.sentAt ?? new Date(0), TZ), date) <
                PARAMETERS.messages.templateCooldownDays,
          );
        expect(repeated).toEqual([]);
      });
    },
  );
});
