import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { PARAMETERS } from '../config/parameters.js';
import {
  closeDay,
  evaluateDay,
  initialCountedDaysState,
  isDayClosable,
  loggingGraceEnd,
  operationalDate,
  zonedTimeToInstant,
  type ClosedDay,
  type DayInputs,
} from './day.js';

const BOGOTA = 'America/Bogota'; // UTC−5, sin horario de verano
const at = (iso: string) => new Date(iso);

const base: DayInputs = {
  type: 'TRAINING',
  sessionsCompleted: 0,
  importedActivityMinutes: [],
  nutritionHalf: false,
  importedSteps: 0,
  mobilityMinutes: 0,
};

describe('RN-DQC-001 · día operativo de P-029 a P-029 en la zona del usuario', () => {
  it('antes de las 03:00 locales todavía es el día anterior', () => {
    // 02:59 en Bogotá = 07:59 UTC
    expect(operationalDate(at('2026-10-20T07:59:00Z'), BOGOTA)).toBe('2026-10-19');
    // 03:00 en Bogotá = 08:00 UTC
    expect(operationalDate(at('2026-10-20T08:00:00Z'), BOGOTA)).toBe('2026-10-20');
  });

  it('usa la zona del usuario, no la del servidor', () => {
    const instant = at('2026-10-20T05:00:00Z'); // 00:00 en Bogotá, 07:00 en Madrid
    expect(operationalDate(instant, BOGOTA)).toBe('2026-10-19');
    expect(operationalDate(instant, 'Europe/Madrid')).toBe('2026-10-20');
  });

  it('por defecto usa la zona P-069', () => {
    expect(PARAMETERS.user.defaultTimezone).toBe(BOGOTA);
    expect(operationalDate(at('2026-10-20T07:59:00Z'))).toBe('2026-10-19');
  });

  it('convierte una hora local a instante UTC, también con horario de verano', () => {
    expect(zonedTimeToInstant('2026-10-20', '03:00', BOGOTA).toISOString()).toBe(
      '2026-10-20T08:00:00.000Z',
    );
    // Madrid: 29-mar-2026 pasa a UTC+2
    expect(zonedTimeToInstant('2026-03-30', '03:00', 'Europe/Madrid').toISOString()).toBe(
      '2026-03-30T01:00:00.000Z',
    );
  });

  it('propiedad: la fecha operativa es la fecha local o la del día anterior', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2035-01-01'), noInvalidDate: true }),
        (instant) => {
          const local = new Intl.DateTimeFormat('en-CA', { timeZone: BOGOTA }).format(instant);
          const day = operationalDate(instant, BOGOTA);
          const previous = new Date(`${local}T00:00:00Z`);
          previous.setUTCDate(previous.getUTCDate() - 1);
          expect([local, previous.toISOString().slice(0, 10)]).toContain(day);
        },
      ),
    );
  });
});

describe('RN-DQC-002 · un día de entreno cuenta con una sesión o una actividad válida', () => {
  it('no cuenta sin sesión ni actividad', () => {
    expect(evaluateDay(base).counts).toBe(false);
  });

  it('cuenta con una sesión A, B o C completada', () => {
    expect(evaluateDay({ ...base, sessionsCompleted: 1 }).counts).toBe(true);
  });

  it('cuenta con una actividad importada de al menos P-025 minutos (RN-ENT-006)', () => {
    const min = PARAMETERS.training.importedActivityMinMinutes;
    expect(evaluateDay({ ...base, importedActivityMinutes: [min] }).counts).toBe(true);
    expect(evaluateDay({ ...base, importedActivityMinutes: [min - 1, min - 1] }).counts).toBe(
      false,
    );
  });

  it('la comida sola no hace contar un día de entreno', () => {
    expect(evaluateDay({ ...base, nutritionHalf: true }).counts).toBe(false);
  });
});

describe('RN-DQC-003 · un día de descanso cuenta con la misión de descanso', () => {
  const rest: DayInputs = { ...base, type: 'REST' };

  it('cuenta con la mitad de comida', () => {
    expect(evaluateDay({ ...rest, nutritionHalf: true }).counts).toBe(true);
  });

  it('cuenta con al menos P-031 pasos importados', () => {
    const steps = PARAMETERS.day.restMinSteps;
    expect(evaluateDay({ ...rest, importedSteps: steps }).counts).toBe(true);
    expect(evaluateDay({ ...rest, importedSteps: steps - 1 }).counts).toBe(false);
  });

  it('cuenta con al menos P-032 minutos de movilidad confirmados', () => {
    const minutes = PARAMETERS.day.restMobilityMinutes;
    expect(evaluateDay({ ...rest, mobilityMinutes: minutes }).counts).toBe(true);
    expect(evaluateDay({ ...rest, mobilityMinutes: minutes - 1 }).counts).toBe(false);
  });

  it('no cuenta sin ninguna de las dos', () => {
    expect(evaluateDay(rest).counts).toBe(false);
  });
});

describe('RN-DQC-004 · día completo', () => {
  it('entreno: cuenta y además cumple la mitad de comida', () => {
    expect(evaluateDay({ ...base, sessionsCompleted: 1 }).complete).toBe(false);
    expect(evaluateDay({ ...base, sessionsCompleted: 1, nutritionHalf: true }).complete).toBe(true);
    expect(evaluateDay({ ...base, nutritionHalf: true }).complete).toBe(false);
  });

  it('descanso: mitad de comida y recuperación activa', () => {
    const rest: DayInputs = { ...base, type: 'REST', nutritionHalf: true };
    expect(evaluateDay(rest).complete).toBe(false);
    expect(
      evaluateDay({ ...rest, mobilityMinutes: PARAMETERS.day.restMobilityMinutes }).complete,
    ).toBe(true);
  });

  it('un día completo siempre cuenta', () => {
    fc.assert(
      fc.property(arbitraryDayInputs(), (inputs) => {
        const status = evaluateDay(inputs);
        if (status.complete) expect(status.counts).toBe(true);
      }),
    );
  });
});

describe('RN-DQC-005 · gracia de registro hasta P-030 del día siguiente', () => {
  it('la gracia del 19 termina el 20 a las 12:00 locales', () => {
    expect(loggingGraceEnd('2026-10-19', BOGOTA).toISOString()).toBe('2026-10-20T17:00:00.000Z');
  });

  it('el día se puede cerrar solo cuando termina la gracia', () => {
    expect(isDayClosable('2026-10-19', at('2026-10-20T16:59:59Z'), BOGOTA)).toBe(false);
    expect(isDayClosable('2026-10-19', at('2026-10-20T17:00:00Z'), BOGOTA)).toBe(true);
  });

  it('dentro de la gracia el estado se recalcula: registrar tarde hace contar el día', () => {
    expect(evaluateDay(base).counts).toBe(false);
    expect(evaluateDay({ ...base, sessionsCompleted: 1 }).counts).toBe(true);
  });
});

describe('RN-DQC-006 · entrenar en un día de descanso cuenta', () => {
  it('una sesión completada en descanso hace contar el día', () => {
    expect(evaluateDay({ ...base, type: 'REST', sessionsCompleted: 1 }).counts).toBe(true);
  });
});

describe('RN-DQC-007 · el total acumulado de días que cuentan nunca disminuye', () => {
  const day = (date: string, counted: boolean): ClosedDay => ({ date, counted });

  it('suma los días que cuentan y no resta los que no', () => {
    let state = initialCountedDaysState();
    state = closeDay(state, day('2026-10-19', true));
    state = closeDay(state, day('2026-10-20', false));
    state = closeDay(state, day('2026-10-21', true));
    expect(state.total).toBe(2);
  });

  it('cerrar una fecha anterior a la última cerrada no cambia nada', () => {
    const state = closeDay(initialCountedDaysState(), day('2026-10-20', true));
    expect(closeDay(state, day('2026-10-19', true))).toEqual(state);
  });

  it('cerrar dos veces el mismo día no cambia el resultado (FR-005-02)', () => {
    const once = closeDay(initialCountedDaysState(), day('2026-10-19', true));
    expect(closeDay(once, day('2026-10-19', true))).toEqual(once);
    expect(closeDay(once, day('2026-10-19', false))).toEqual(once);
  });

  it('propiedad: con cualquier secuencia de cierres, el total nunca baja y cuenta cada fecha una vez', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ offset: fc.nat({ max: 60 }), counted: fc.boolean() }), {
          maxLength: 200,
        }),
        (unordered) => {
          // El planificador cierra en orden; los reintentos repiten fechas ya cerradas.
          const closes = [...unordered].sort((a, b) => a.offset - b.offset);
          let state = initialCountedDaysState();
          const firstResult = new Map<number, boolean>();
          for (const { offset, counted } of closes) {
            const next = closeDay(state, day(dateFromOffset(offset), counted));
            expect(next.total).toBeGreaterThanOrEqual(state.total);
            if (!firstResult.has(offset)) firstResult.set(offset, counted);
            state = next;
          }
          expect(state.total).toBe([...firstResult.values()].filter(Boolean).length);
        },
      ),
    );
  });
});

function dateFromOffset(offset: number): string {
  const date = new Date('2026-01-01T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function arbitraryDayInputs(): fc.Arbitrary<DayInputs> {
  return fc.record({
    type: fc.constantFrom('TRAINING' as const, 'REST' as const),
    sessionsCompleted: fc.nat({ max: 3 }),
    importedActivityMinutes: fc.array(fc.nat({ max: 120 }), { maxLength: 3 }),
    nutritionHalf: fc.boolean(),
    importedSteps: fc.nat({ max: 20000 }),
    mobilityMinutes: fc.nat({ max: 60 }),
  });
}
