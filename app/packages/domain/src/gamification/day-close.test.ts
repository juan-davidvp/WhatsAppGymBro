import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { PARAMETERS } from '../config/parameters.js';
import { addDays } from '../time/zoned.js';
import {
  closePlayerDay,
  initialPlayerState,
  type PlayerDay,
  type PlayerState,
} from './day-close.js';

const START = '2026-10-05';

function day(offset: number, fields: Partial<PlayerDay> = {}): PlayerDay {
  const date = addDays(START, offset);
  return {
    date,
    type: 'TRAINING',
    counted: true,
    closedAt: new Date(`${addDays(date, 1)}T17:00:00Z`),
    riskPaused: false,
    ...fields,
  };
}

function run(days: readonly PlayerDay[], state: PlayerState = initialPlayerState()) {
  const results = days.map((d) => {
    const result = closePlayerDay(state, d);
    state = result.state;
    return result;
  });
  return { state, results };
}

describe('FR-005-02 · T-061 · cerrar un día dos veces no cambia nada', () => {
  it('el segundo cierre no aplica, no emite eventos ni da bonificación', () => {
    const once = closePlayerDay(initialPlayerState(), day(0)).state;
    const again = closePlayerDay(once, day(0));
    expect(again).toEqual({ state: once, applied: false, events: [], comebackBonus: false });
  });
});

describe('RN-GAM-013 · bonificación de regreso (HU-005-4)', () => {
  it('el primer día que cuenta después de un día de entreno no cumplido la otorga una vez', () => {
    const { results } = run([day(0, { counted: false }), day(1, { type: 'REST' }), day(2)]);
    expect(results.map((r) => r.comebackBonus)).toEqual([false, true, false]);
  });

  it('un descanso que no cuenta no la activa', () => {
    const { results } = run([day(0, { type: 'REST', counted: false }), day(1)]);
    expect(results.map((r) => r.comebackBonus)).toEqual([false, false]);
  });
});

describe('RN-SEG-007 · FR-005-07 · día con señal de riesgo', () => {
  it('si no cuenta, la racha no se rompe y no gasta comodín', () => {
    const { state } = run([
      ...Array.from({ length: PARAMETERS.streak.freezeEveryCountedDays }, (_, i) => day(i)),
      day(PARAMETERS.streak.freezeEveryCountedDays, { counted: false, riskPaused: true }),
    ]);
    expect(state.streak.current).toBe(PARAMETERS.streak.freezeEveryCountedDays);
    expect(state.streak.freezes).toBe(1);
  });

  it('si cuenta, suma al total y a la racha, pero sin comodín ganado ni bonificación', () => {
    const before = run(
      Array.from({ length: PARAMETERS.streak.freezeEveryCountedDays - 1 }, (_, i) => day(i)),
    ).state;
    const broken = closePlayerDay(before, day(PARAMETERS.streak.freezeEveryCountedDays - 1));
    const paused = closePlayerDay(
      { ...before, comeback: { pending: true } },
      day(PARAMETERS.streak.freezeEveryCountedDays - 1, { riskPaused: true }),
    );
    expect(broken.events).toContain('freeze_earned');
    expect(paused.events).not.toContain('freeze_earned');
    expect(paused.state.streak.current).toBe(PARAMETERS.streak.freezeEveryCountedDays);
    expect(paused.state.counted.total).toBe(PARAMETERS.streak.freezeEveryCountedDays);
    expect(paused.comebackBonus).toBe(false);
    expect(paused.state.comeback.pending).toBe(false);
  });
});

describe('RN-DQC-007 · RN-GAM-001 · invariantes del cierre', () => {
  it('para cualquier secuencia, el total nunca baja y la racha nunca lo supera (SC-005-1)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            counted: fc.boolean(),
            rest: fc.boolean(),
            riskPaused: fc.boolean(),
            repeat: fc.boolean(),
          }),
          { maxLength: 120 },
        ),
        (sequence) => {
          let state = initialPlayerState();
          let offset = 0;
          for (const step of sequence) {
            const before = state.counted.total;
            const d = day(offset, {
              counted: step.counted,
              type: step.rest ? 'REST' : 'TRAINING',
              riskPaused: step.riskPaused,
            });
            state = closePlayerDay(state, d).state;
            if (step.repeat) state = closePlayerDay(state, d).state;
            expect(state.counted.total).toBeGreaterThanOrEqual(before);
            expect(state.streak.current).toBeLessThanOrEqual(state.counted.total);
            expect(state.streak.longest).toBeGreaterThanOrEqual(state.streak.current);
            offset += 1;
          }
        },
      ),
    );
  });
});
