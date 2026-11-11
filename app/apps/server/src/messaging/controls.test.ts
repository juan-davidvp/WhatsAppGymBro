import { renderTemplate, templateById } from '@gymbro/content';
import { describe, expect, it } from 'vitest';
import { toTelegramHtml } from '../bot/create-bot.js';
import { evaluateClosedWeek } from '../scheduler/close-week.js';
import { proactiveSetup } from '../testing/proactive.js';
import { sent } from '../testing/telegram.js';
import { BotBlockedError } from './sender.js';

/**
 * T-073 · `/pausa`, `/ajustes` de mensajes y bloqueo (HU-007-4, HU-007-7,
 * RN-MSJ-013, RN-MSJ-014). Onboarding L-X-V el lunes 2026-10-19 a las 10:00 en
 * Bogotá; con hora habitual 18:00, `plan_listo` del miércoles sale a las 22:00Z.
 */

type Setup = Awaited<ReturnType<typeof proactiveSetup>>;

const WED_17 = '2026-10-21T22:00:00Z';
const lastText = (t: Setup) => sent(t.calls).at(-1)?.text;
const stats = (t: Setup) => t.deps.messageStats.get(t.userId);

function userOf(t: Setup) {
  const user = t.user();
  if (!user) throw new Error('sin usuario');
  return user;
}

describe('RN-MSJ-013 · T-073 · /pausa (HU-007-4 escenario 1)', () => {
  it('ofrece 1, 3, 7 o 14 días; al elegir, PA-02 con la fecha y pause_set', async () => {
    const t = await proactiveSetup();
    await t.act({ text: '/pausa' });
    const options = sent(t.calls).at(-1);
    expect(options?.text).toBe(renderTemplate('PA-01'));
    expect(options?.buttons.map((b) => b.text)).toEqual(['1 día', '3 días', '7 días', '14 días']);
    await t.act('3 días');
    expect(lastText(t)).toBe(renderTemplate('PA-02', { fecha: 'jueves 22' }));
    expect(t.eventsNamed('pause_set')).toEqual([{ days: 3 }]);
    expect(await stats(t)).toMatchObject({
      pausedAt: new Date('2026-10-19T15:00:00Z'),
      pausedUntil: new Date('2026-10-22T15:00:00Z'),
    });
  });

  it('en pausa no se programa ni se envía ningún proactivo; los comandos siguen funcionando', async () => {
    const t = await proactiveSetup();
    await t.setHabitTime('18:00');
    await t.act({ text: '/pausa' });
    await t.act('3 días');
    t.goTo(WED_17);
    expect(await t.tick()).toBe(0);
    expect(t.outbox).toEqual([]);
    const before = t.calls.length;
    await t.act({ text: '/plan' });
    expect(t.calls.length).toBeGreaterThan(before);
  });

  it('/pausa en pausa muestra hasta cuándo y [Reanudar]; al reanudar vuelve a programar', async () => {
    const t = await proactiveSetup();
    await t.setHabitTime('18:00');
    await t.act({ text: '/pausa' });
    await t.act('14 días');
    await t.act({ text: '/pausa' });
    const paused = sent(t.calls).at(-1);
    expect(paused?.text).toBe(renderTemplate('PA-03', { fecha: 'lunes 2' }));
    expect(paused?.buttons.map((b) => b.text)).toEqual(templateById('PA-03').buttons);
    t.goTo('2026-10-21T20:00:00Z');
    await t.act('Reanudar');
    expect(lastText(t)).toBe(renderTemplate('PA-04'));
    expect((await stats(t)).pausedUntil).toEqual(new Date('2026-10-21T20:00:00Z'));
    t.goTo(WED_17);
    expect(await t.tick()).toBe(1);
  });

  it('la semana que toca una pausa no se evalúa (ni cumplida ni rota); sin pausa, sí', async () => {
    const withPause = await proactiveSetup();
    await withPause.act({ text: '/pausa' });
    await withPause.act('1 día');
    withPause.goTo('2026-10-26T09:00:00Z');
    const paused = await evaluateClosedWeek(userOf(withPause), '2026-10-25', withPause.deps);
    expect(paused?.result).toEqual({ evaluated: false });

    const without = await proactiveSetup();
    without.goTo('2026-10-26T09:00:00Z');
    const normal = await evaluateClosedWeek(userOf(without), '2026-10-25', without.deps);
    expect(normal?.result.evaluated).toBe(true);
  });
});

describe('HU-007-4 escenario 2 · T-073 · /ajustes de mensajes', () => {
  it('AJ-01 muestra cantidad, silencio y tipos apagados', async () => {
    const t = await proactiveSetup();
    await t.act({ text: '/ajustes' });
    const screen = sent(t.calls).at(-1);
    expect(screen?.text).toBe(
      toTelegramHtml(
        renderTemplate('AJ-01', {
          intensidad: 'Normal',
          inicio: '21:30',
          fin: '07:00',
          apagados: 'ninguno',
        }),
      ),
    );
    expect(screen?.buttons.map((b) => b.text)).toEqual(templateById('AJ-01').buttons);
  });

  it('cambia la cantidad y el silencio, con message_settings_changed por campo', async () => {
    const t = await proactiveSetup();
    await t.act({ text: '/ajustes' });
    await t.act('Cantidad');
    expect(lastText(t)).toBe(renderTemplate('ON-22'));
    await t.act('Poco');
    await t.act('Silencio');
    await t.act('23:30–08:00');
    expect(userOf(t).settings).toMatchObject({
      intensity: 'LOW',
      quietHours: { start: '23:30', end: '08:00' },
    });
    expect(lastText(t)).toBe(
      toTelegramHtml(
        renderTemplate('AJ-01', {
          intensidad: 'Poco',
          inicio: '23:30',
          fin: '08:00',
          apagados: 'ninguno',
        }),
      ),
    );
    expect(t.eventsNamed('message_settings_changed')).toEqual([
      { field: 'intensity' },
      { field: 'quiet_hours' },
    ]);
  });

  it('el silencio nuevo se respeta desde la siguiente evaluación', async () => {
    const t = await proactiveSetup();
    await t.setHabitTime('08:30'); // aviso a las 07:30 = 12:30Z
    await t.act({ text: '/ajustes' });
    await t.act('Silencio');
    await t.act('23:30–08:00');
    // Con el silencio por defecto (hasta las 07:00) saldría a las 07:30; ahora cae en
    // silencio y sale la víspera, un minuto antes de las 23:30 (RN-MSJ-005).
    t.goTo('2026-10-21T04:00:00Z'); // martes 23:00
    await t.tick();
    expect(t.outboxOf('plan_listo')[0]).toMatchObject({
      key: 'plan_listo:2026-10-21',
      scheduledFor: new Date('2026-10-21T04:29:00Z'),
    });
  });

  it('apagar un tipo: el motor lo suprime (disabled_purpose) y AJ-01 lo nombra', async () => {
    const t = await proactiveSetup();
    await t.setHabitTime('18:00');
    await t.act({ text: '/ajustes' });
    await t.act('Tipos');
    expect(
      sent(t.calls)
        .at(-1)
        ?.buttons.map((b) => b.text),
    ).toEqual([
      '✅ Plan del día',
      '✅ Cierre del día',
      '✅ Recordatorio',
      '✅ Regreso',
      '✅ Resumen de la semana',
      'Listo',
    ]);
    await t.act('✅ Plan del día');
    expect(sent(t.calls).at(-1)?.buttons[0]?.text).toBe('⬜ Plan del día');
    await t.act('Listo');
    expect(lastText(t)).toContain('apagados: Plan del día.');
    expect(t.eventsNamed('message_settings_changed')).toEqual([{ field: 'purpose' }]);
    t.goTo(WED_17);
    expect(await t.tick()).toBe(0);
    expect(t.outboxOf('plan_listo')[0]).toMatchObject({ suppressedReason: 'disabled_purpose' });
  });
});

describe('RN-MSJ-014 · T-073 · el usuario bloquea el bot (HU-007-7)', () => {
  it('cancela las pendientes, marca al usuario y registra bot_blocked; si vuelve a escribir, se reanuda', async () => {
    const t = await proactiveSetup();
    await t.setHabitTime('18:00');
    t.goTo('2026-10-21T20:00:00Z');
    await t.tick(); // plan_listo y cierre_del_dia del miércoles en la bandeja
    t.deps.sender = { send: () => Promise.reject(new BotBlockedError()) };
    t.goTo(WED_17);
    expect(await t.tick()).toBe(0);
    expect(t.outbox.every((m) => m.status === 'cancelled')).toBe(true);
    expect(userOf(t).status).toBe('blocked');
    expect((await stats(t)).blockedAt).toEqual(new Date(WED_17));
    expect(t.eventsNamed('bot_blocked')).toEqual([{}]);
    // Bloqueado no está activo: el planificador no le programa nada.
    t.goTo('2026-10-22T20:00:00Z');
    await t.tick();
    expect(t.outbox.filter((m) => m.status === 'pending')).toEqual([]);
    // RN-MSJ-014 [supuesto]: si escribe, lo desbloqueó.
    await t.act({ text: '/hoy' });
    expect(userOf(t).status).toBe('active');
    expect((await stats(t)).blockedAt).toBeNull();
  });
});
