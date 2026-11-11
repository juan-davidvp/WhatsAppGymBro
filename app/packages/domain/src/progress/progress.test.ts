import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { PARAMETERS } from '../config/parameters.js';
import { estimated1RM } from '../training/training.js';
import { stepWeight, strengthHighlights, wallGrid } from './progress.js';

const sets = (...pairs: [number, number][]) => pairs.map(([loadKg, reps]) => ({ loadKg, reps }));
const STEPS = PARAMETERS.progress.weightStepsKg;

describe('HU-006-2 · RN-ENT-005 · fuerza por patrón en /progreso (PO, 2026-11-11)', () => {
  it('por patrón, el ejercicio con más series y su mejor 1RM estimado, en orden', () => {
    const highlights = strengthHighlights([
      { code: 'BENCH', pattern: 'PUSH_H', sets: sets([60, 8], [62.5, 6]) },
      { code: 'OHP', pattern: 'PUSH_V', sets: sets([40, 8]) },
      { code: 'SQ', pattern: 'SQUAT', sets: sets([80, 5], [80, 5], [85, 3]) },
      { code: 'ROW', pattern: 'PULL_H', sets: sets([50, 10]) },
    ]);
    expect(highlights.map((h) => [h.group, h.code])).toEqual([
      ['SQUAT', 'SQ'],
      ['PUSH', 'BENCH'],
      ['PULL', 'ROW'],
    ]);
    expect(highlights[0]?.e1rmKg).toBeCloseTo(estimated1RM(85, 3) ?? 0);
  });

  it('sin series con carga (peso corporal) o fuera de patrón, el patrón no sale', () => {
    expect(
      strengthHighlights([
        { code: 'PUSHUP', pattern: 'PUSH_H', sets: sets([0, 15]) },
        { code: 'PLANK', pattern: 'CORE', sets: sets([10, 5]) },
        { code: 'CURL', pattern: 'ARMS', sets: sets([12, 10]) },
      ]),
    ).toEqual([]);
  });
});

describe('HU-006-2 · registrar el peso con botones (PO, 2026-11-11, P-100)', () => {
  it('suma o resta un paso y redondea al paso menor', () => {
    expect(stepWeight(72.5, 0.1)).toBe(72.6);
    expect(stepWeight(72.5, -0.5)).toBe(72);
    expect(stepWeight(72.3, 0.5)).toBe(72.8);
  });

  it('el resultado es siempre un múltiplo exacto del paso menor', () => {
    const unit = Math.min(...STEPS);
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 2500 }),
        fc.constantFrom(...STEPS, ...STEPS.map((s) => -s)),
        (tenths, delta) => {
          const result = stepWeight(tenths * unit, delta);
          return Math.abs(result / unit - Math.round(result / unit)) < 1e-9;
        },
      ),
    );
  });
});

describe('HU-006-1 · muro de constancia de P-102 semanas (PO, 2026-11-11)', () => {
  const today = '2026-10-21'; // miércoles

  it('P-102 semanas de lunes a domingo, la actual al final, con el estado de cada día', () => {
    const grid = wallGrid(
      [
        { date: '2026-10-19', counted: true, complete: true },
        { date: '2026-10-20', counted: true, complete: false },
        { date: '2026-10-21', counted: false, complete: false },
        { date: '2026-08-03', counted: true, complete: false },
      ],
      today,
    );
    expect(grid).toHaveLength(PARAMETERS.progress.wallWeeks);
    expect(grid.every((week) => week.length === 7)).toBe(true);
    expect(grid.at(-1)).toEqual([
      'complete',
      'counted',
      'none',
      'future',
      'future',
      'future',
      'future',
    ]);
    // El lunes de la primera semana es 11 semanas antes del lunes actual.
    expect(grid[0]?.[0]).toBe('counted');
  });

  it('un día fuera de la ventana no aparece y nada futuro cuenta', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), (weeks) => {
        const grid = wallGrid(
          [{ date: '2026-12-01', counted: true, complete: true }],
          today,
          weeks,
        );
        return grid.flat().every((cell) => cell !== 'complete' && cell !== 'counted');
      }),
    );
  });
});
