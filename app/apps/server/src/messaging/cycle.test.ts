import { SESSION_NAMES, renderTemplate, templateById } from '@gymbro/content';
import {
  PARAMETERS,
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

const WED_16 = '2026-10-21T21:00:00Z';
const WED_17 = '2026-10-21T22:00:00Z';

describe('RN-MSJ-005 · RN-MSJ-015 · T-070 · plan_listo pasa por la bandeja y el motor', () => {
  it('se programa una vez y sale P-048 minutos antes de la hora habitual, con sus 4 botones', async () => {
    const t = await proactiveSetup();
    await t.setHabitTime('18:00');
    t.goTo(WED_16);
    expect(await t.tick()).toBe(0);
    expect(t.outbox).toMatchObject([{ key: 'plan_listo:2026-10-21', status: 'pending' }]);
    t.goTo(WED_17);
    expect(await t.tick()).toBe(1);
    expect(await t.tick()).toBe(0); // otro ciclo no lo repite
    const [message] = t.sent;
    expect(message?.reply.buttons.map((b) => b.label)).toEqual(templateById('PL-01').buttons);
    expect(t.outbox[0]).toMatchObject({ status: 'sent', templateId: 'PL-01' });
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
    expect(t.outbox[0]).toMatchObject({
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
    expect(t.outbox[0]).toMatchObject({ status: 'suppressed', suppressedReason: 'stale' });
    expect(t.eventsNamed('message_suppressed')).toEqual([
      { purpose: 'plan_listo', reason: 'stale' },
    ]);
  });

  it('pasada la hora habitual ya no se programa', async () => {
    const t = await proactiveSetup();
    await t.setHabitTime('18:00');
    t.goTo('2026-10-21T23:30:00Z');
    await t.tick();
    expect(t.outbox).toEqual([]);
  });

  it('RN-MSJ-004 · con la hora habitual temprana, el aviso caería en silencio y no se envía', async () => {
    const t = await proactiveSetup();
    await t.setHabitTime('07:30'); // aviso a las 06:30, dentro de 21:30–07:00
    t.goTo('2026-10-21T11:30:00Z');
    await t.tick();
    expect(t.sent).toEqual([]);
    expect(t.outbox[0]).toMatchObject({ suppressedReason: 'quiet_hours' });
  });
});

describe('G06 · T-070 · ningún envío fuera de presupuesto, silencio o separación', () => {
  it('3 semanas con ciclos cada 30 min y horas habituales cambiantes: 0 violaciones', async () => {
    const t = await proactiveSetup();
    const hours = ['06:30', '08:00', '12:00', '17:00', '19:00', '21:00', '22:30'] as const;
    const start = new Date('2026-10-19T16:00:00Z').getTime();
    const step = 30 * 60_000;
    const ticksPerDay = 48;
    for (let i = 0; i < 21 * ticksPerDay; i += 1) {
      if (i % ticksPerDay === 0) {
        await t.setHabitTime(hours[(i / ticksPerDay) % hours.length] ?? '18:00');
      }
      t.goTo(new Date(start + i * step).toISOString());
      await t.tick();
    }
    const tz = 'America/Bogota';
    const quietHours = t.user()?.settings.quietHours ?? PARAMETERS.messages.quietHours;
    const budget = messageBudget('NORMAL', 'TRAINING', false);
    expect(t.sent.length).toBeGreaterThan(0);
    t.sent.forEach((message, i) => {
      expect(isInQuietHours(message.at, quietHours, tz)).toBe(false);
      const previous = t.sent[i - 1];
      if (previous) {
        expect(message.at.getTime() - previous.at.getTime()).toBeGreaterThanOrEqual(
          PARAMETERS.messages.minGapHours * 3_600_000,
        );
      }
      const date = operationalDate(message.at, tz);
      const sameDay = t.sent.filter((m) => operationalDate(m.at, tz) === date).length;
      const sameWeek = t.sent.filter(
        (m) => weekStartOf(operationalDate(m.at, tz)) === weekStartOf(date),
      ).length;
      expect(sameDay).toBeLessThanOrEqual(budget.perDay);
      expect(sameWeek).toBeLessThanOrEqual(budget.perWeek);
    });
  });
});
