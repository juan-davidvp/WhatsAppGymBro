import { renderTemplate, templateById } from '@gymbro/content';
import { describe, expect, it } from 'vitest';
import { ONBOARDED_GYM_LXV, runFlow } from '../testing/onboarding.js';

/** T-102 · `/lab` solo para el fundador (plan de medición §6). La cuenta de prueba es la 42. */

const FOUNDER = 42;
const OTHER = 7;

describe('T-102 · /lab', () => {
  it('muestra M01, M03, M04 y G06 de la semana al fundador', async () => {
    const t = await runFlow(ONBOARDED_GYM_LXV, { founderTelegramId: FOUNDER });
    await t.act({ text: '/lab' });
    expect(t.last()?.text).toBe(
      [
        renderTemplate('LB-01', { fecha: '2026-10-19' }),
        renderTemplate('LB-02', { dias: 0 }),
        renderTemplate('LB-03', { tasa: 'sin datos', accionados: 0, enviados: 0 }),
        renderTemplate('LB-04', { toques: 'sin datos', comida: 'sin datos' }),
        renderTemplate('LB-05', { violaciones: 0 }),
      ].join('\n'),
    );
  });

  it('otra cuenta recibe CU-07, como un mensaje fuera de dominio', async () => {
    const t = await runFlow(ONBOARDED_GYM_LXV, { founderTelegramId: OTHER });
    await t.act({ text: '/lab' });
    expect(t.last()?.text).toBe(templateById('CU-07').text);
  });

  it('sin FOUNDER_TELEGRAM_ID no responde con métricas a nadie', async () => {
    const t = await runFlow(ONBOARDED_GYM_LXV);
    await t.act({ text: '/lab' });
    expect(t.last()?.text).toBe(templateById('CU-07').text);
  });

  it('solo lee los eventos del propio usuario desde el lunes', async () => {
    const t = await runFlow(ONBOARDED_GYM_LXV, { founderTelegramId: FOUNDER });
    const userId = t.user()?.id ?? '';
    const monday = new Date('2026-10-19T08:00:00Z');
    const events = await t.deps.eventLog.since(userId, monday);
    expect(events.length).toBeGreaterThan(0);
    expect(await t.deps.eventLog.since('otra-persona', monday)).toEqual([]);
    expect(await t.deps.eventLog.since(userId, new Date('2026-10-20T00:00:00Z'))).toEqual([]);
  });
});
