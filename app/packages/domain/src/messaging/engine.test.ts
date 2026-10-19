import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { PARAMETERS } from '../config/parameters.js';
import { operationalDate } from '../day/day.js';
import { weekStartOf } from '../gamification/weekly.js';
import { addDays, zonedTimeToInstant } from '../time/zoned.js';
import {
  byPurposePriority,
  comebackAction,
  dayClosingAt,
  evaluateProactive,
  fadedPurposes,
  handleBotBlocked,
  isInQuietHours,
  messageBudget,
  pauseUntil,
  pickTemplate,
  planReadyAt,
  registerMessageOutcome,
  usualStartTime,
  weeklySummaryAt,
  type DayContext,
  type MessagePurpose,
  type ProactiveCandidate,
  type SentMessage,
  type UserMessagingState,
} from './engine.js';

const TZ = 'America/Bogota';
const M = PARAMETERS.messages;
const local = (date: string, time: string) => zonedTimeToInstant(date, time, TZ);
const D = '2026-10-20'; // martes

const user: UserMessagingState = {
  timeZone: TZ,
  intensity: 'NORMAL',
  quietHours: M.quietHours,
  pausedUntil: null,
  inactivityPaused: false,
  blocked: false,
  backoffUntil: null,
  disabledPurposes: [],
};
const trainingDay: DayContext = {
  dayType: 'TRAINING',
  dayCounts: false,
  sessionStarted: false,
  missingActionTaps: null,
};
const candidate = (
  purpose: MessagePurpose,
  at: Date,
  extra: Partial<ProactiveCandidate> = {},
): ProactiveCandidate => ({
  purpose,
  scheduledFor: at,
  buttons: 2,
  ...extra,
});
const sent = (
  at: Date,
  templateId = 'PL-01',
  purpose: MessagePurpose = 'plan_listo',
): SentMessage => ({ purpose, templateId, sentAt: at });
const evaluate = (
  c: ProactiveCandidate,
  history: SentMessage[] = [],
  u = user,
  day = trainingDay,
) => evaluateProactive({ candidate: c, user: u, history, day, now: c.scheduledFor });

describe('RN-MSJ-001 · todo proactivo tiene un propósito del catálogo', () => {
  it('rechaza un propósito desconocido', () => {
    expect(() => evaluate(candidate('promo' as MessagePurpose, local(D, '10:00')))).toThrow(
      'RN-MSJ-001',
    );
  });
});

describe('RN-MSJ-002 · presupuesto según la intensidad (P-045), con el resumen dentro', () => {
  it('Normal: 2 por día de entreno, 1 por día de descanso, 8 por semana', () => {
    expect(messageBudget('NORMAL', 'TRAINING', false)).toEqual({
      perDay: M.budget.NORMAL.perTrainingDay,
      perWeek: M.budget.NORMAL.perWeek,
    });
    expect(messageBudget('NORMAL', 'REST', false).perDay).toBe(M.budget.NORMAL.perRestDay);
    expect(messageBudget('LOW', 'TRAINING', false)).toEqual(M.budget.LOW);
    expect(messageBudget('HIGH', 'REST', false)).toEqual(M.budget.HIGH);
  });

  it('no envía si se superaría el presupuesto del día', () => {
    const history = [sent(local(D, '08:00')), sent(local(D, '12:00'))];
    expect(evaluate(candidate('reconocimiento', local(D, '17:00')), history)).toEqual({
      send: false,
      reason: 'budget',
    });
  });

  it('no envía si se superaría el presupuesto de la semana', () => {
    const monday = weekStartOf(D);
    const history = Array.from({ length: M.budget.NORMAL.perWeek }, (_, i) =>
      sent(local(addDays(monday, i % 7), i < 7 ? '08:00' : '13:00')),
    );
    expect(
      evaluate(candidate('resumen_semanal', local(addDays(monday, 6), '19:00')), history),
    ).toEqual({ send: false, reason: 'budget' });
  });
});

describe('RN-MSJ-003 · al menos P-046 horas entre dos proactivos', () => {
  it('enviado a las 17:00, otro a las 19:00 no sale (HU-007-2)', () => {
    expect(
      evaluate(candidate('reconocimiento', local(D, '19:00')), [sent(local(D, '17:00'))]),
    ).toEqual({ send: false, reason: 'min_gap' });
    expect(
      evaluate(candidate('reconocimiento', local(D, '20:00')), [sent(local(D, '17:00'))]),
    ).toEqual({ send: true });
  });
});

describe('RN-MSJ-004 · nada en horas de silencio (P-047, cruza la medianoche)', () => {
  it('detecta la franja 21:30–07:00', () => {
    expect(isInQuietHours(local(D, '21:30'), M.quietHours, TZ)).toBe(true);
    expect(isInQuietHours(local(D, '06:59'), M.quietHours, TZ)).toBe(true);
    expect(isInQuietHours(local(D, '07:00'), M.quietHours, TZ)).toBe(false);
    expect(isInQuietHours(local(D, '21:29'), M.quietHours, TZ)).toBe(false);
  });

  it('el motor suprime y respeta una franja configurada por el usuario', () => {
    expect(evaluate(candidate('reconocimiento', local(D, '22:00')))).toEqual({
      send: false,
      reason: 'quiet_hours',
    });
    const custom = { ...user, quietHours: { start: '13:00', end: '14:00' } };
    expect(evaluate(candidate('reconocimiento', local(D, '13:30')), [], custom)).toEqual({
      send: false,
      reason: 'quiet_hours',
    });
  });
});

describe('RN-MSJ-005 · plan_listo P-048 minutos antes de la hora habitual', () => {
  it('hora habitual 18:00 → 17:00', () => {
    expect(planReadyAt(D, '18:00', TZ)).toEqual(local(D, '17:00'));
  });

  it('no se envía si la sesión ya empezó o el día ya cuenta', () => {
    const c = candidate('plan_listo', local(D, '17:00'));
    expect(evaluate(c, [], user, { ...trainingDay, sessionStarted: true })).toEqual({
      send: false,
      reason: 'day_already_counts',
    });
    expect(evaluate(c, [], user, { ...trainingDay, dayCounts: true })).toEqual({
      send: false,
      reason: 'day_already_counts',
    });
    expect(evaluate(c)).toEqual({ send: true });
  });

  it('pasada su hora ya no se envía (stale)', () => {
    const c = candidate('plan_listo', local(D, '17:00'), { notAfter: local(D, '18:00') });
    expect(
      evaluateProactive({
        candidate: c,
        user,
        history: [],
        day: trainingDay,
        now: local(D, '18:30'),
      }),
    ).toEqual({ send: false, reason: 'stale' });
  });
});

describe('RN-MSJ-006 · hora habitual = mediana de las últimas P-049 sesiones', () => {
  it('con suficientes sesiones usa la mediana (HU-007-3)', () => {
    expect(usualStartTime(['19:00', '19:10', '18:50', '19:00', '19:05', '18:55'], '18:00')).toBe(
      '19:00',
    );
  });

  it('con menos de P-049 sesiones usa la declarada', () => {
    expect(usualStartTime(['19:00', '19:00'], '18:00')).toBe('18:00');
  });
});

describe('RN-MSJ-007 · retroceso tras P-050 proactivos ignorados', () => {
  it('reduce el presupuesto semanal a la mitad durante P-051 días', () => {
    let state = { consecutiveIgnored: 0, backoffUntil: null as Date | null };
    const at = local(D, '10:00');
    for (let i = 0; i < M.backoffIgnoredCount; i++)
      state = registerMessageOutcome(state, { interacted: false, at });
    expect(state.backoffUntil).toEqual(new Date(at.getTime() + M.backoffDays * 86_400_000));
    expect(messageBudget('NORMAL', 'TRAINING', true).perWeek).toBe(
      Math.floor(M.budget.NORMAL.perWeek / 2),
    );
  });

  it('una interacción reinicia la cuenta', () => {
    let state = { consecutiveIgnored: 0, backoffUntil: null as Date | null };
    state = registerMessageOutcome(state, { interacted: false, at: local(D, '10:00') });
    state = registerMessageOutcome(state, { interacted: true, at: local(D, '11:00') });
    expect(state.consecutiveIgnored).toBe(0);
  });
});

describe('RN-MSJ-008 · regreso, regreso final, pausa y reactivación', () => {
  const base = {
    today: D,
    missedPlannedTrainingDays: 0,
    daysWithoutActivity: 0,
    comebackAlreadySent: false,
    inactivityPaused: false,
    reactivationsUsed: 0,
    lastReactivationDate: null,
  };

  it(`tras P-052 días de entreno sin actividad envía 1 regreso`, () => {
    expect(comebackAction({ ...base, missedPlannedTrainingDays: M.comebackAfterPlannedDays })).toBe(
      'send_comeback',
    );
    expect(
      comebackAction({
        ...base,
        missedPlannedTrainingDays: M.comebackAfterPlannedDays,
        comebackAlreadySent: true,
      }),
    ).toBe('none');
  });

  it('tras P-053 días sin actividad envía el regreso final y pausa', () => {
    expect(comebackAction({ ...base, daysWithoutActivity: M.inactivityPauseDays })).toBe(
      'send_final_and_pause',
    );
  });

  it('en pausa solo reactiva el lunes o el día 1, como máximo P-054 veces', () => {
    const paused = { ...base, inactivityPaused: true };
    expect(comebackAction({ ...paused, today: '2026-10-26' })).toBe('send_reactivation'); // lunes
    expect(comebackAction({ ...paused, today: '2026-11-01' })).toBe('send_reactivation'); // día 1
    expect(comebackAction({ ...paused, today: '2026-10-21' })).toBe('none');
    expect(
      comebackAction({ ...paused, today: '2026-10-26', reactivationsUsed: M.maxReactivations }),
    ).toBe('none');
  });

  it('el motor solo deja pasar mensajes de reactivación mientras dura la pausa', () => {
    const inactive = { ...user, inactivityPaused: true };
    expect(evaluate(candidate('regreso', local(D, '10:00')), [], inactive)).toEqual({
      send: false,
      reason: 'inactive',
    });
    expect(
      evaluate(candidate('regreso', local(D, '10:00'), { reactivation: true }), [], inactive),
    ).toEqual({ send: true });
  });
});

describe('RN-MSJ-009 · desvanecimiento tras P-055 semanas cumplidas', () => {
  it('desactiva recordatorio_contextual y plan_listo si su tasa de acción es baja', () => {
    expect(
      fadedPurposes({
        fulfilledWeeksStreak: M.fadingAfterFulfilledWeeks - 1,
        planReadyActionRate: 0,
      }),
    ).toEqual([]);
    expect(
      fadedPurposes({
        fulfilledWeeksStreak: M.fadingAfterFulfilledWeeks,
        planReadyActionRate: M.planReadyMinActionRate,
      }),
    ).toEqual(['recordatorio_contextual']);
    expect(
      fadedPurposes({
        fulfilledWeeksStreak: M.fadingAfterFulfilledWeeks,
        planReadyActionRate: M.planReadyMinActionRate - 0.01,
      }),
    ).toEqual(['recordatorio_contextual', 'plan_listo']);
  });

  it('el motor no envía un propósito desactivado', () => {
    const faded = { ...user, disabledPurposes: ['recordatorio_contextual'] as MessagePurpose[] };
    expect(evaluate(candidate('recordatorio_contextual', local(D, '12:00')), [], faded)).toEqual({
      send: false,
      reason: 'disabled_purpose',
    });
  });
});

describe('RN-MSJ-010 · la misma plantilla no se repite en P-058 días', () => {
  it('elige solo entre las que no se usaron en la ventana', () => {
    const now = local(D, '17:00');
    const history = [
      sent(new Date(now.getTime() - 86_400_000), 'PL-01'),
      sent(new Date(now.getTime() - 2 * 86_400_000), 'PL-02'),
    ];
    expect(pickTemplate(['PL-01', 'PL-02', 'PL-03'], history, now, () => 0)).toBe('PL-03');
  });

  it('pasada la ventana la plantilla vuelve a estar disponible', () => {
    const now = local(D, '17:00');
    const old = sent(new Date(now.getTime() - (M.templateCooldownDays + 1) * 86_400_000), 'PL-01');
    expect(pickTemplate(['PL-01'], [old], now, () => 0.99)).toBe('PL-01');
    expect(pickTemplate(['PL-01'], [sent(now, 'PL-01')], now, () => 0)).toBeNull();
  });
});

describe('RN-MSJ-012 · todo proactivo lleva al menos una acción de 1 toque', () => {
  it('sin botones no se envía', () => {
    expect(evaluate(candidate('reconocimiento', local(D, '10:00'), { buttons: 0 }))).toEqual({
      send: false,
      reason: 'no_action',
    });
  });
});

describe('RN-MSJ-013 · /pausa entre 1 y P-059 días', () => {
  it('pausa y el motor no envía mientras dure', () => {
    const until = pauseUntil(local(D, '09:00'), 3);
    expect(
      evaluate(candidate('reconocimiento', local(D, '10:00')), [], { ...user, pausedUntil: until }),
    ).toEqual({ send: false, reason: 'paused' });
    expect(
      evaluate(candidate('reconocimiento', local(addDays(D, 3), '10:00')), [], {
        ...user,
        pausedUntil: until,
      }),
    ).toEqual({ send: true });
  });

  it('rechaza pausas fuera del rango', () => {
    expect(() => pauseUntil(local(D, '09:00'), 0)).toThrow('RN-MSJ-013');
    expect(() => pauseUntil(local(D, '09:00'), M.maxPauseDays + 1)).toThrow('RN-MSJ-013');
  });
});

describe('RN-MSJ-014 · bloqueo del bot', () => {
  it('cancela las salidas pendientes, registra bot_blocked y el motor no envía más', () => {
    const result = handleBotBlocked([
      { id: 1, status: 'pending' },
      { id: 2, status: 'sent' },
    ]);
    expect(result.outbox).toEqual([
      { id: 1, status: 'cancelled' },
      { id: 2, status: 'sent' },
    ]);
    expect(result.event).toBe('bot_blocked');
    expect(
      evaluate(candidate('reconocimiento', local(D, '10:00')), [], { ...user, blocked: true }),
    ).toEqual({ send: false, reason: 'blocked' });
  });
});

describe('RN-MSJ-015 · solo el motor de política aprueba proactivos', () => {
  it('ordena por prioridad cuando compiten: regreso > plan_listo > cierre > reconocimiento > recordatorio', () => {
    const at = local(D, '10:00');
    const ordered = byPurposePriority([
      candidate('recordatorio_contextual', at),
      candidate('reconocimiento', at),
      candidate('regreso', at),
      candidate('cierre_del_dia', at),
      candidate('plan_listo', at),
    ]);
    expect(ordered.map((c) => c.purpose)).toEqual([
      'regreso',
      'plan_listo',
      'cierre_del_dia',
      'reconocimiento',
      'recordatorio_contextual',
    ]);
  });
});

describe('RN-MSJ-016 · cierre_del_dia solo si el día no cuenta y lo que falta cabe en P-073 toques', () => {
  const closing = candidate('cierre_del_dia', dayClosingAt(D, TZ));

  it(`se evalúa a las ${M.dayClosingAt}`, () => {
    expect(dayClosingAt(D, TZ)).toEqual(local(D, M.dayClosingAt));
  });

  it('si solo falta la proteína (1 toque) se envía', () => {
    expect(
      evaluate(closing, [], user, { ...trainingDay, dayType: 'REST', missingActionTaps: 1 }),
    ).toEqual({ send: true });
  });

  it('si falta la sesión completa no se envía (HU-007-5)', () => {
    expect(evaluate(closing, [], user, { ...trainingDay, missingActionTaps: null })).toEqual({
      send: false,
      reason: 'not_doable',
    });
    expect(
      evaluate(closing, [], user, { ...trainingDay, missingActionTaps: M.dayClosingMaxTaps + 1 }),
    ).toEqual({ send: false, reason: 'not_doable' });
  });

  it('si el día ya cuenta no se envía', () => {
    expect(
      evaluate(closing, [], user, { ...trainingDay, dayCounts: true, missingActionTaps: 1 }),
    ).toEqual({ send: false, reason: 'day_already_counts' });
  });
});

describe('RN-MSJ-017 · resumen semanal el domingo a la hora P-060', () => {
  it('sale el domingo de la semana', () => {
    expect(weeklySummaryAt(D, TZ)).toEqual(local('2026-10-25', M.weeklySummaryAt.time));
  });
});

describe('SC-007-1 · simulación de 60 días: 0 violaciones de presupuesto, silencio, separación o pausa', () => {
  const purposes: MessagePurpose[] = [
    'plan_listo',
    'recordatorio_contextual',
    'cierre_del_dia',
    'reconocimiento',
    'regreso',
    'mantenimiento',
  ];
  const intensities = ['LOW', 'NORMAL', 'HIGH'] as const;

  it('ningún usuario sintético recibe un mensaje que viole las reglas', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...intensities),
        fc.array(fc.boolean(), { minLength: 7, maxLength: 7 }),
        fc.array(
          fc.record({
            day: fc.nat({ max: 59 }),
            minute: fc.nat({ max: 24 * 60 - 1 }),
            purpose: fc.constantFrom(...purposes),
            interacted: fc.boolean(),
          }),
          { maxLength: 300 },
        ),
        fc.option(
          fc.record({
            day: fc.nat({ max: 59 }),
            days: fc.integer({ min: 1, max: M.maxPauseDays }),
          }),
        ),
        (intensity, trainingWeekdays, rawCandidates, pause) => {
          const start = '2026-10-19'; // lunes
          const pausedUntil = pause
            ? pauseUntil(local(addDays(start, pause.day), '00:00'), pause.days)
            : null;
          const pausedFrom = pause ? local(addDays(start, pause.day), '00:00') : null;
          let ignore = { consecutiveIgnored: 0, backoffUntil: null as Date | null };
          const history: SentMessage[] = [];
          const candidates = rawCandidates
            .map((c) => ({
              ...c,
              at: new Date(local(addDays(start, c.day), '00:00').getTime() + c.minute * 60_000),
            }))
            .sort((a, b) => a.at.getTime() - b.at.getTime());

          for (const c of candidates) {
            const date = operationalDate(c.at, TZ);
            const weekdayIndex =
              ((Math.round((Date.parse(date) - Date.parse(start)) / 86_400_000) % 7) + 7) % 7;
            const day: DayContext = {
              dayType: trainingWeekdays[weekdayIndex] ? 'TRAINING' : 'REST',
              dayCounts: false,
              sessionStarted: false,
              missingActionTaps: 1,
            };
            const u: UserMessagingState = {
              ...user,
              intensity,
              pausedUntil: pausedFrom && c.at >= pausedFrom ? pausedUntil : null,
              backoffUntil: ignore.backoffUntil,
            };
            const decision = evaluateProactive({
              candidate: candidate(c.purpose, c.at),
              user: u,
              history,
              day,
              now: c.at,
            });
            if (!decision.send) continue;

            // Verificación independiente de cada envío aprobado.
            expect(isInQuietHours(c.at, M.quietHours, TZ)).toBe(false);
            if (pausedFrom && pausedUntil)
              expect(c.at >= pausedFrom && c.at < pausedUntil).toBe(false);
            const last = history.at(-1);
            if (last)
              expect(c.at.getTime() - last.sentAt.getTime()).toBeGreaterThanOrEqual(
                M.minGapHours * 3_600_000,
              );
            const budget = messageBudget(
              intensity,
              day.dayType,
              ignore.backoffUntil !== null && c.at < ignore.backoffUntil,
            );
            const dates = history.map((m) => operationalDate(m.sentAt, TZ));
            expect(dates.filter((d) => d === date).length + 1).toBeLessThanOrEqual(budget.perDay);
            expect(
              dates.filter((d) => weekStartOf(d) === weekStartOf(date)).length + 1,
            ).toBeLessThanOrEqual(budget.perWeek);

            history.push(sent(c.at, `${c.purpose}-x`, c.purpose));
            ignore = registerMessageOutcome(ignore, { interacted: c.interacted, at: c.at });
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});
