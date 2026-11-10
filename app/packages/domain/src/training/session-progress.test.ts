import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { PARAMETERS } from '../config/parameters.js';
import {
  adjustPending,
  confirmCurrent,
  loadStepFor,
  plannedSetCount,
  skipExercise,
  startProgress,
  undoLast,
  type SessionExercise,
} from './session-progress.js';

const SQUAT: SessionExercise = {
  exerciseCode: 'SQ',
  pattern: 'SQUAT',
  sets: 2,
  targetReps: 10,
  loadKg: 60,
};
const PRESS: SessionExercise = {
  exerciseCode: 'BP',
  pattern: 'PUSH_H',
  sets: 3,
  targetReps: 8,
  loadKg: 40,
};

describe('RN-ENT-001 · HU-003-1 · confirmar la serie precargada', () => {
  it('1 toque registra la serie tal cual y avanza a la siguiente', () => {
    const { progress, entry } = confirmCurrent(startProgress([SQUAT, PRESS]));
    expect(entry).toEqual({
      exerciseIndex: 0,
      setIndex: 0,
      exerciseCode: 'SQ',
      reps: 10,
      loadKg: 60,
      edited: false,
    });
    expect(progress.cursor).toEqual({ exercise: 0, set: 1 });
  });

  it('HU-003-1 escenario 3: dos veces −1 rep y Hecha registran 8 con la carga objetivo', () => {
    let p = startProgress([SQUAT]);
    p = adjustPending(adjustPending(p, { reps: -1 }), { reps: -1 });
    expect(confirmCurrent(p).entry).toMatchObject({ reps: 8, loadKg: 60, edited: true });
  });

  it('la carga ajustada se mantiene en las series siguientes del mismo ejercicio', () => {
    const p = confirmCurrent(adjustPending(startProgress([SQUAT, PRESS]), { load: 1 })).progress;
    expect(p.pending.loadKg).toBe(60 + PARAMETERS.training.lowerBodyIncrementKg);
    const next = confirmCurrent(p).progress;
    expect(next.cursor).toEqual({ exercise: 1, set: 0 });
    expect(next.pending).toEqual({ reps: 8, loadKg: 40 });
  });

  it('RN-ENT-002 · el paso de carga es el de la región: P-021 abajo, P-020 arriba', () => {
    expect(loadStepFor('SQUAT')).toBe(PARAMETERS.training.lowerBodyIncrementKg);
    expect(loadStepFor('PUSH_H')).toBe(PARAMETERS.training.upperBodyIncrementKg);
  });

  it('ni repeticiones ni carga bajan de 0', () => {
    const bodyweight = { ...SQUAT, loadKg: 0, targetReps: 0 };
    const p = adjustPending(startProgress([bodyweight]), { reps: -1, load: -1 });
    expect(p.pending).toEqual({ reps: 0, loadKg: 0 });
  });

  it('[⏭️ Siguiente ejercicio] salta lo que queda del actual', () => {
    expect(skipExercise(startProgress([SQUAT, PRESS])).cursor).toEqual({ exercise: 1, set: 0 });
    expect(skipExercise(startProgress([SQUAT])).cursor).toBeNull();
  });
});

describe('FR-003-04 · deshacer la última serie', () => {
  it('quita la última serie y vuelve a ella con sus valores', () => {
    const done = confirmCurrent(adjustPending(startProgress([SQUAT]), { reps: 1 })).progress;
    const { progress, removed } = undoLast(done);
    expect(removed?.reps).toBe(11);
    expect(progress.logged).toEqual([]);
    expect(progress.cursor).toEqual({ exercise: 0, set: 0 });
    expect(progress.pending).toEqual({ reps: 11, loadKg: 60 });
  });
  it('sin series no deshace nada', () => {
    expect(undoLast(startProgress([SQUAT])).removed).toBeNull();
  });
});

describe('RN-ENT-001 · propiedades del avance', () => {
  const exercise = fc.record({
    exerciseCode: fc.constantFrom('A', 'B', 'C'),
    pattern: fc.constantFrom('SQUAT' as const, 'PUSH_H' as const, 'CORE' as const),
    sets: fc.integer({ min: 0, max: 5 }),
    targetReps: fc.integer({ min: 1, max: 20 }),
    loadKg: fc.integer({ min: 0, max: 100 }),
  });
  const action = fc.constantFrom('done', 'plus', 'minus', 'skip', 'undo');

  it('nunca se registran más series que las planeadas ni dos veces la misma', () => {
    fc.assert(
      fc.property(
        fc.array(exercise, { maxLength: 5 }),
        fc.array(action, { maxLength: 40 }),
        (list, actions) => {
          let p = startProgress(list);
          for (const a of actions) {
            if (a === 'done') p = confirmCurrent(p).progress;
            else if (a === 'plus') p = adjustPending(p, { reps: 1 });
            else if (a === 'minus') p = adjustPending(p, { load: -1 });
            else if (a === 'skip') p = skipExercise(p);
            else p = undoLast(p).progress;
          }
          expect(p.logged.length).toBeLessThanOrEqual(plannedSetCount(p));
          const keys = p.logged.map((e) => `${e.exerciseIndex}:${e.setIndex}`);
          expect(new Set(keys).size).toBe(keys.length);
        },
      ),
    );
  });

  it('confirmar todo registra exactamente las series planeadas y termina', () => {
    fc.assert(
      fc.property(fc.array(exercise, { maxLength: 5 }), (list) => {
        let p = startProgress(list);
        while (p.cursor) p = confirmCurrent(p).progress;
        expect(p.logged).toHaveLength(plannedSetCount(p));
      }),
    );
  });
});

describe('RN-SEG-006 · cambiar el ejercicio en curso por una variante', () => {
  it('las series que faltan usan la variante; lo registrado no cambia', async () => {
    const { replaceCurrentExercise } = await import('./session-progress.js');
    const done = confirmCurrent(startProgress([SQUAT])).progress;
    const swapped = replaceCurrentExercise(done, 'LEG_PRESS', 0);
    expect(swapped.exercises[0]?.exerciseCode).toBe('LEG_PRESS');
    expect(swapped.pending).toEqual({ reps: SQUAT.targetReps, loadKg: 0 });
    expect(swapped.logged[0]?.exerciseCode).toBe('SQ');
  });
});
