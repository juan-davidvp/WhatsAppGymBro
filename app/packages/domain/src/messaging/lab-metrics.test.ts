import { describe, expect, it } from 'vitest';
import { PARAMETERS } from '../config/parameters.js';
import { engineViolations, labMetrics, median, type LabEvent } from './lab-metrics.js';

/** T-102 · métricas de `/lab` (plan de medición §3 y §6). */

const WEEK = '2026-10-19';
const TZ = 'America/Bogota';
const QUIET = { start: '21:30', end: '07:00' };
const FROM = new Date('2026-10-19T08:00:00Z');
const WINDOW_MINUTES = PARAMETERS.metrics.actionWindowHours * 60;

const event = (name: string, props: LabEvent['props'] = {}): LabEvent => ({ name, props });
const sent = (iso: string) => ({
  purpose: 'plan_listo' as const,
  templateId: 'PL-01',
  sentAt: new Date(iso),
});
const violations = (messages: readonly ReturnType<typeof sent>[], from = FROM) =>
  engineViolations({ sent: messages, from, quietHours: QUIET, timeZone: TZ, intensity: 'NORMAL' });

describe('T-102 · median', () => {
  it('toma el valor central, promedia los dos centrales y no inventa datos', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBeNull();
  });
});

describe('T-102 · M01, M03 y M04 de la semana', () => {
  it('M01 cuenta solo los días cerrados de esta semana que contaron', () => {
    const metrics = labMetrics(
      [
        event('day_closed', { date: '2026-10-18', counted: true }),
        event('day_closed', { date: '2026-10-19', counted: true }),
        event('day_closed', { date: '2026-10-20', counted: false }),
      ],
      WEEK,
    );
    expect(metrics.countedDays).toBe(1);
  });

  it('M03 solo suma las acciones dentro de la ventana P-067', () => {
    const metrics = labMetrics(
      [
        event('message_sent'),
        event('message_sent'),
        event('message_actioned', { minutes: WINDOW_MINUTES }),
        event('message_actioned', { minutes: WINDOW_MINUTES + 1 }),
      ],
      WEEK,
    );
    expect(metrics).toMatchObject({ sentMessages: 2, actionedMessages: 1, actionRatePct: 50 });
  });

  it('M03 sin envíos no tiene tasa', () => {
    expect(labMetrics([], WEEK).actionRatePct).toBeNull();
  });

  it('M04 da la mediana de toques por serie y de segundos por método de comida', () => {
    const metrics = labMetrics(
      [
        event('set_confirmed', { taps: 1 }),
        event('set_confirmed', { taps: 1 }),
        event('set_confirmed', { taps: 3 }),
        event('meal_logged', { method: 'favorite', durationMs: 2_000 }),
        event('meal_logged', { method: 'favorite', durationMs: 4_000 }),
        event('meal_logged', { method: 'portions', durationMs: 12_000 }),
      ],
      WEEK,
    );
    expect(metrics.medianSetTaps).toBe(1);
    expect(metrics.medianMealSeconds).toEqual({ favorite: 3, portions: 12 });
  });
});

describe('T-102 · G06 · violaciones del motor', () => {
  it('sin problemas da 0', () => {
    expect(violations([sent('2026-10-19T14:00:00Z'), sent('2026-10-20T14:00:00Z')])).toBe(0);
  });

  it('cuenta un envío en horas de silencio', () => {
    expect(violations([sent('2026-10-20T04:00:00Z')])).toBe(1);
  });

  it('cuenta un envío sin la separación mínima, también frente a la semana anterior', () => {
    const gapMs = (PARAMETERS.messages.minGapHours * 3_600_000) / 2;
    const first = new Date('2026-10-19T14:00:00Z');
    const second = new Date(first.getTime() + gapMs).toISOString();
    expect(violations([sent(first.toISOString()), sent(second)])).toBe(1);
    expect(violations([sent(first.toISOString()), sent(second)], new Date(second))).toBe(1);
  });

  it('cuenta lo que pasa del presupuesto semanal', () => {
    const { perWeek } = PARAMETERS.messages.budget.NORMAL;
    const days = Array.from({ length: 7 }, (_, i) => 19 + i);
    const messages = days
      .flatMap((d) => [`2026-10-${d}T13:00:00Z`, `2026-10-${d}T20:00:00Z`])
      .map(sent);
    expect(violations(messages)).toBe(Math.max(0, messages.length - perWeek));
  });

  it('un mensaje de antes de la semana no se cuenta como violación', () => {
    expect(violations([sent('2026-10-19T04:00:00Z')])).toBe(0);
  });
});
