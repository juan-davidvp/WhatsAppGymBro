import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { PARAMETERS } from '../config/parameters.js';
import { closeDay, initialCountedDaysState } from '../day/day.js';
import { addDays } from '../time/zoned.js';
import {
  closeStreakDay,
  initialStreakState,
  repairStreak,
  type StreakDay,
  type StreakState,
} from './streak.js';

const START = '2026-10-05';
const FREEZE_EVERY = PARAMETERS.streak.freezeEveryCountedDays;
const MAX_FREEZES = PARAMETERS.streak.maxFreezes;

function day(offset: number, counted: boolean): StreakDay {
  const date = addDays(START, offset);
  return { date, counted, closedAt: new Date(`${addDays(date, 1)}T17:00:00Z`) };
}

function run(days: readonly boolean[], state: StreakState = initialStreakState()) {
  const events: string[] = [];
  days.forEach((counted, i) => {
    const result = closeStreakDay(state, day(i, counted));
    state = result.state;
    events.push(...result.events);
  });
  return { state, events };
}

describe('RN-GAM-001 · la racha son los días que cuentan consecutivos', () => {
  it('suma uno por cada día que cuenta', () => {
    expect(run([true, true, true]).state.current).toBe(3);
  });

  it('un día que no cuenta sin comodín la deja en 0', () => {
    expect(run([true, true, false]).state.current).toBe(0);
  });

  it('cerrar dos veces el mismo día no cambia la racha', () => {
    const once = closeStreakDay(initialStreakState(), day(0, true)).state;
    expect(closeStreakDay(once, day(0, true)).state).toEqual(once);
  });
});

describe('RN-GAM-002 · comodines', () => {
  it(`gana un comodín cada ${FREEZE_EVERY} días que cuentan seguidos`, () => {
    const { state, events } = run(Array(FREEZE_EVERY).fill(true));
    expect(state.freezes).toBe(1);
    expect(events).toContain('freeze_earned');
  });

  it(`no pasa de ${MAX_FREEZES} comodines`, () => {
    const { state } = run(Array(FREEZE_EVERY * (MAX_FREEZES + 2)).fill(true));
    expect(state.freezes).toBe(MAX_FREEZES);
  });

  it('se aplica solo a un día que no cuenta y mantiene la racha', () => {
    const { state, events } = run([...Array(FREEZE_EVERY).fill(true), false]);
    expect(state.current).toBe(FREEZE_EVERY);
    expect(state.freezes).toBe(0);
    expect(events).toContain('freeze_used');
    expect(events).not.toContain('streak_reset');
  });

  it('el día salvado no cuenta: reinicia la serie para ganar el siguiente comodín', () => {
    const { state } = run([
      ...Array(FREEZE_EVERY).fill(true),
      false,
      ...Array(FREEZE_EVERY - 1).fill(true),
    ]);
    expect(state.freezes).toBe(0);
    expect(state.current).toBe(FREEZE_EVERY * 2 - 1);
  });
});

describe('RN-GAM-003 · reparar la racha', () => {
  const broken = () => run([true, true, true, false]);

  it('al romperse sin comodín se ofrece reparar durante P-035 horas', () => {
    const { state, events } = broken();
    expect(events).toContain('streak_reset');
    expect(events).toContain('streak_repair_offered');
    const closedAt = day(3, false).closedAt;
    expect(state.repair?.offeredUntil).toBe(
      new Date(closedAt.getTime() + PARAMETERS.streak.repairWindowHours * 3_600_000).toISOString(),
    );
  });

  it('con la misión de regreso (sesión C + mitad de comida) dentro del plazo, la racha vuelve', () => {
    const { state } = broken();
    const result = repairStreak(state, {
      date: addDays(START, 4),
      at: new Date(day(3, false).closedAt.getTime() + 3_600_000),
      expressSessionDone: true,
      nutritionHalf: true,
    });
    expect(result.repaired).toBe(true);
    expect(result.state.current).toBe(3);
    expect(result.state.repair).toBeNull();
  });

  it('sin la misión completa, o fuera de plazo, no repara', () => {
    const { state } = broken();
    const within = new Date(day(3, false).closedAt.getTime() + 3_600_000);
    const late = new Date(
      day(3, false).closedAt.getTime() + (PARAMETERS.streak.repairWindowHours + 1) * 3_600_000,
    );
    const attempt = (at: Date, expressSessionDone: boolean, nutritionHalf: boolean) =>
      repairStreak(state, { date: addDays(START, 4), at, expressSessionDone, nutritionHalf })
        .repaired;
    expect(attempt(within, true, false)).toBe(false);
    expect(attempt(within, false, true)).toBe(false);
    expect(attempt(late, true, true)).toBe(false);
  });

  it('como máximo una reparación cada P-036 días', () => {
    const { state } = broken();
    const repaired = repairStreak(state, {
      date: addDays(START, 4),
      at: new Date(day(3, false).closedAt.getTime() + 3_600_000),
      expressSessionDone: true,
      nutritionHalf: true,
    }).state;
    // Se vuelve a romper pocos días después: no se ofrece otra reparación.
    let next = closeStreakDay(repaired, day(5, false));
    expect(next.events).toContain('streak_reset');
    expect(next.events).not.toContain('streak_repair_offered');
    // Pasado el plazo de enfriamiento sí se ofrece.
    next = closeStreakDay(
      {
        ...next.state,
        current: 2,
        lastClosedDate: addDays(START, PARAMETERS.streak.repairCooldownDays + 3),
      },
      day(PARAMETERS.streak.repairCooldownDays + 4, false),
    );
    expect(next.events).toContain('streak_repair_offered');
  });
});

describe('RN-GAM-001 y RN-GAM-002 · invariantes', () => {
  it('la racha nunca supera el total acumulado y los comodines nunca superan P-034', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ counted: fc.boolean(), tryRepair: fc.boolean() }), { maxLength: 150 }),
        (sequence) => {
          let streak = initialStreakState();
          let total = initialCountedDaysState();
          sequence.forEach(({ counted, tryRepair }, i) => {
            const d = day(i, counted);
            if (tryRepair) {
              streak = repairStreak(streak, {
                date: d.date,
                at: new Date(d.closedAt.getTime() - 3_600_000),
                expressSessionDone: counted,
                nutritionHalf: counted,
              }).state;
            }
            streak = closeStreakDay(streak, d).state;
            total = closeDay(total, d);
            expect(streak.current).toBeLessThanOrEqual(total.total);
            expect(streak.freezes).toBeLessThanOrEqual(MAX_FREEZES);
            expect(streak.freezes).toBeGreaterThanOrEqual(0);
          });
        },
      ),
    );
  });
});
