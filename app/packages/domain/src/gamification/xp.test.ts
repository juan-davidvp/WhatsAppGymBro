import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { PARAMETERS } from '../config/parameters.js';
import {
  awardXp,
  levelForXp,
  totalXp,
  updateComeback,
  XP_EVENT_TYPES,
  type XpEvent,
  type XpLedgerEntry,
} from './xp.js';

const TABLE = PARAMETERS.xp.table;
const CAP = PARAMETERS.xp.dailyCap;
const D = '2026-10-19';

function award(ledger: XpLedgerEntry[], event: XpEvent, date = D, paused = false) {
  const entry = awardXp(ledger, { date, event, paused });
  ledger.push(entry);
  return entry;
}

describe('RN-GAM-005 · XP por evento según P-038 con tope diario P-039', () => {
  it('cada evento suma lo que dice la tabla', () => {
    const ledger: XpLedgerEntry[] = [];
    expect(award(ledger, { type: 'SESSION', variant: 'GYM' }).amount).toBe(TABLE.session.GYM);
    expect(award(ledger, { type: 'NUTRITION_HALF' }, '2026-10-20').amount).toBe(
      TABLE.nutritionHalf,
    );
    expect(award(ledger, { type: 'SESSION', variant: 'EXPRESS' }, '2026-10-21').amount).toBe(
      TABLE.session.EXPRESS,
    );
  });

  it('no supera el tope diario: el exceso se recorta y lo demás da 0', () => {
    const ledger: XpLedgerEntry[] = [];
    award(ledger, { type: 'SESSION', variant: 'GYM' });
    award(ledger, { type: 'FULFILLED_WEEK' });
    const third = award(ledger, { type: 'WEEKLY_QUEST' });
    expect(totalXp(ledger)).toBe(CAP);
    expect(third.amount).toBe(CAP - TABLE.session.GYM - TABLE.fulfilledWeek);
    expect(award(ledger, { type: 'PERSONAL_RECORD' }).amount).toBe(0);
  });

  it('el tope es por día: otro día vuelve a sumar', () => {
    const ledger: XpLedgerEntry[] = [];
    award(ledger, { type: 'FULFILLED_WEEK' });
    award(ledger, { type: 'FULFILLED_WEEK' });
    expect(award(ledger, { type: 'NUTRITION_HALF' }, '2026-10-20').amount).toBe(
      TABLE.nutritionHalf,
    );
  });

  it('RN-DQC-006 · entrenar en descanso también respeta el tope', () => {
    const ledger: XpLedgerEntry[] = [];
    award(ledger, { type: 'REST_MISSION' });
    for (let i = 0; i < 4; i++) award(ledger, { type: 'SESSION', variant: 'GYM' });
    expect(totalXp(ledger)).toBe(CAP);
  });

  it('FR-005-07 · con las mecánicas pausadas por una señal de riesgo no se suma XP', () => {
    expect(
      awardXp([], { date: D, event: { type: 'SESSION', variant: 'GYM' }, paused: true }).amount,
    ).toBe(0);
  });
});

describe('RN-GAM-006 · el XP acumulado nunca disminuye', () => {
  it('propiedad: con cualquier secuencia de eventos el total no baja y ningún día pasa de P-039', () => {
    const event = fc.oneof(
      fc.constantFrom<XpEvent>(
        { type: 'REST_MISSION' },
        { type: 'NUTRITION_HALF' },
        { type: 'COMPLETE_DAY_BONUS' },
        { type: 'PERSONAL_RECORD' },
        { type: 'COMEBACK' },
        { type: 'WEEKLY_QUEST' },
        { type: 'FULFILLED_WEEK' },
      ),
      fc
        .constantFrom('GYM', 'HOME', 'EXPRESS')
        .map((variant): XpEvent => ({ type: 'SESSION', variant })),
    );
    fc.assert(
      fc.property(
        fc.array(fc.record({ event, day: fc.nat({ max: 10 }), paused: fc.boolean() }), {
          maxLength: 100,
        }),
        (sequence) => {
          const ledger: XpLedgerEntry[] = [];
          let previous = 0;
          for (const { event: e, day, paused } of sequence) {
            const entry = award(ledger, e, `2026-10-${String(10 + day).padStart(2, '0')}`, paused);
            expect(entry.amount).toBeGreaterThanOrEqual(0);
            const total = totalXp(ledger);
            expect(total).toBeGreaterThanOrEqual(previous);
            previous = total;
          }
          const byDay = new Map<string, number>();
          for (const entry of ledger)
            byDay.set(entry.date, (byDay.get(entry.date) ?? 0) + entry.amount);
          for (const sum of byDay.values()) expect(sum).toBeLessThanOrEqual(CAP);
        },
      ),
    );
  });
});

describe('RN-GAM-007 · niveles según los umbrales P-040', () => {
  const thresholds = PARAMETERS.levels.thresholds;

  it('el nivel 1 empieza en 0 XP', () => {
    expect(levelForXp(0)).toBe(1);
  });

  it('cada umbral sube un nivel y justo antes no', () => {
    thresholds.forEach((threshold, index) => {
      expect(levelForXp(threshold)).toBe(index + 1);
      if (threshold > 0) expect(levelForXp(threshold - 1)).toBe(index);
    });
  });

  it('el nivel máximo es el 10', () => {
    expect(levelForXp(10_000_000)).toBe(thresholds.length);
  });
});

describe('RN-GAM-013 · bonificación de regreso', () => {
  it('el primer día que cuenta tras un día de entreno no cumplido otorga la bonificación', () => {
    let state = { pending: false };
    let result = updateComeback(state, { type: 'TRAINING', counted: false });
    expect(result.bonus).toBe(false);
    state = result.state;
    result = updateComeback(state, { type: 'REST', counted: false });
    expect(result.bonus).toBe(false);
    result = updateComeback(result.state, { type: 'REST', counted: true });
    expect(result.bonus).toBe(true);
    expect(updateComeback(result.state, { type: 'TRAINING', counted: true }).bonus).toBe(false);
  });

  it('un descanso que no cuenta no activa la bonificación', () => {
    const result = updateComeback({ pending: false }, { type: 'REST', counted: false });
    expect(result.state.pending).toBe(false);
  });

  it('la bonificación vale lo que dice P-038', () => {
    expect(awardXp([], { date: D, event: { type: 'COMEBACK' }, paused: false }).amount).toBe(
      TABLE.comebackBonus,
    );
  });
});

describe('RN-GAM-014 · prohibiciones de la gamificación', () => {
  it('no existe ningún evento de XP por peso, déficit o comparación con otros', () => {
    expect(XP_EVENT_TYPES.join(' ').toLowerCase()).not.toMatch(/weight|deficit|loss|rank|calor/);
  });

  it('ningún movimiento del libro es negativo', () => {
    expect(() =>
      totalXp([{ date: D, event: 'SESSION', variant: 'GYM', amount: -10 } as XpLedgerEntry]),
    ).toThrow('RN-GAM-014');
  });
});
