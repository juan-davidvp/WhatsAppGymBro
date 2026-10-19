import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { PARAMETERS } from '../config/parameters.js';
import {
  BODY_REGION_BY_PATTERN,
  correctSet,
  confirmSet,
  detectPersonalRecord,
  estimated1RM,
  isImportedActivityValid,
  isSessionCompleted,
  logSessionAsPlanned,
  plateauStrategy,
  suggestProgression,
  type LoggedSet,
  type PlannedSet,
} from './training.js';

const T = PARAMETERS.training;
const planned: PlannedSet = { exerciseCode: 'SQ_BB', setIndex: 0, reps: 8, loadKg: 60 };

describe('RN-ENT-001 · series precargadas: confirmar cuesta 1 toque y corregir cambia solo lo cambiado', () => {
  it('confirmar registra la serie tal cual', () => {
    expect(confirmSet(planned)).toEqual({ ...planned, edited: false });
  });

  it('corregir cambia solo el valor modificado', () => {
    expect(correctSet(planned, { reps: 6 })).toEqual({ ...planned, reps: 6, edited: true });
    expect(correctSet(planned, { loadKg: 62.5 })).toEqual({
      ...planned,
      loadKg: 62.5,
      edited: true,
    });
  });

  it('"La hice tal cual" registra todas las series planeadas en una sola operación', () => {
    const sets: PlannedSet[] = [0, 1, 2].map((setIndex) => ({ ...planned, setIndex }));
    expect(logSessionAsPlanned(sets)).toEqual(sets.map((s) => ({ ...s, edited: false })));
  });
});

describe('RN-ENT-002 · progresión doble', () => {
  const range = { min: 6, max: 10 };
  const atTop = (load: number): LoggedSet[] =>
    [0, 1, 2].map((setIndex) => ({
      exerciseCode: 'SQ_BB',
      setIndex,
      reps: range.max,
      loadKg: load,
      edited: false,
    }));
  const notTop = (load: number): LoggedSet[] => [
    ...atTop(load).slice(0, 2),
    { exerciseCode: 'SQ_BB', setIndex: 2, reps: range.max - 1, loadKg: load, edited: false },
  ];
  const sessions = (n: number, make: (l: number) => LoggedSet[]) =>
    Array.from({ length: n }, () => make(60));

  it(`con todas las series en el tope durante P-019 sesiones, el gym sube P-021 (tren inferior)`, () => {
    expect(
      suggestProgression({
        recentSessions: sessions(T.sessionsAtTopToProgress, atTop),
        repRange: range,
        pattern: 'SQUAT',
        variant: 'GYM',
        currentLoadKg: 60,
      }),
    ).toEqual({ type: 'increase_load', loadKg: 60 + T.lowerBodyIncrementKg });
  });

  it('tren superior sube P-020', () => {
    expect(
      suggestProgression({
        recentSessions: sessions(T.sessionsAtTopToProgress, atTop),
        repRange: range,
        pattern: 'PUSH_H',
        variant: 'GYM',
        currentLoadKg: 60,
      }),
    ).toEqual({ type: 'increase_load', loadKg: 60 + T.upperBodyIncrementKg });
  });

  it('en casa propone una variante más difícil o más repeticiones', () => {
    expect(
      suggestProgression({
        recentSessions: sessions(T.sessionsAtTopToProgress, atTop),
        repRange: range,
        pattern: 'PUSH_H',
        variant: 'HOME',
        currentLoadKg: 0,
      }),
    ).toEqual({ type: 'harder_variant_or_more_reps' });
  });

  it('si alguna serie no llegó al tope, o faltan sesiones, mantiene la carga', () => {
    const mixed = [...sessions(T.sessionsAtTopToProgress - 1, atTop), notTop(60)];
    expect(
      suggestProgression({
        recentSessions: mixed,
        repRange: range,
        pattern: 'SQUAT',
        variant: 'GYM',
        currentLoadKg: 60,
      }),
    ).toEqual({ type: 'keep' });
    expect(
      suggestProgression({
        recentSessions: sessions(T.sessionsAtTopToProgress - 1, atTop),
        repRange: range,
        pattern: 'SQUAT',
        variant: 'GYM',
        currentLoadKg: 60,
      }),
    ).toEqual({ type: 'keep' });
  });

  it('cada patrón de movimiento tiene región corporal', () => {
    expect(Object.keys(BODY_REGION_BY_PATTERN).sort()).toEqual(
      [
        'ARMS',
        'CORE',
        'HINGE',
        'PULL_H',
        'PULL_V',
        'PUSH_H',
        'PUSH_V',
        'SINGLE_LEG',
        'SQUAT',
      ].sort(),
    );
  });
});

describe('RN-ENT-003 · estancamiento', () => {
  const n = T.plateauSessions;

  it(`sin progreso en P-022 sesiones propone una estrategia`, () => {
    const best = [100, ...Array(n).fill(100)];
    expect(plateauStrategy(best)).toEqual(['change_rep_range', 'change_variant', 'deload_week']);
  });

  it('si alguna de las últimas sesiones superó el máximo previo no hay estancamiento', () => {
    expect(plateauStrategy([100, ...Array(n - 1).fill(100), 101])).toBeNull();
  });

  it('sin suficiente historial no hay estancamiento', () => {
    expect(plateauStrategy(Array(n).fill(100))).toBeNull();
  });

  it('el estancamiento no resta XP ni afecta la racha: solo devuelve opciones', () => {
    const result = plateauStrategy([100, ...Array(n).fill(90)]);
    expect(Array.isArray(result)).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/xp|streak|racha/i);
  });
});

describe('RN-ENT-004 · sesión completada', () => {
  it(`con al menos P-023 (${T.minSetFractionCompleted}) de las series de su versión`, () => {
    expect(isSessionCompleted({ variant: 'GYM', plannedSets: 9, loggedSets: 7 })).toBe(true);
    expect(isSessionCompleted({ variant: 'GYM', plannedSets: 9, loggedSets: 6 })).toBe(false);
    expect(isSessionCompleted({ variant: 'HOME', plannedSets: 3, loggedSets: 3 })).toBe(true);
  });

  it('la versión C se completa entera', () => {
    expect(isSessionCompleted({ variant: 'EXPRESS', plannedSets: 15, loggedSets: 14 })).toBe(false);
    expect(isSessionCompleted({ variant: 'EXPRESS', plannedSets: 15, loggedSets: 15 })).toBe(true);
  });

  it('propiedad: registrar más series nunca hace que una sesión deje de estar completada', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }),
        fc.nat({ max: 30 }),
        fc.constantFrom('GYM' as const, 'HOME' as const, 'EXPRESS' as const),
        (plannedSets, logged, variant) => {
          if (isSessionCompleted({ variant, plannedSets, loggedSets: logged })) {
            expect(isSessionCompleted({ variant, plannedSets, loggedSets: logged + 1 })).toBe(true);
          }
        },
      ),
    );
  });
});

describe('RN-ENT-005 · récords personales', () => {
  it('e1RM de Epley solo con ≤ P-024 repeticiones', () => {
    expect(estimated1RM(100, 5)).toBeCloseTo(100 * (1 + 5 / 30), 9);
    expect(estimated1RM(100, T.e1rmMaxReps)).not.toBeNull();
    expect(estimated1RM(100, T.e1rmMaxReps + 1)).toBeNull();
    expect(estimated1RM(0, 12)).toBeNull();
  });

  it('hay récord si el e1RM supera el máximo previo del ejercicio', () => {
    const history = [{ reps: 5, loadKg: 100 }];
    expect(detectPersonalRecord({ reps: 6, loadKg: 100 }, history)).toEqual({ kind: 'e1rm' });
    expect(detectPersonalRecord({ reps: 5, loadKg: 100 }, history)).toBeNull();
  });

  it('hay récord si con el mismo peso (o peso corporal) se superan las repeticiones previas', () => {
    expect(detectPersonalRecord({ reps: 16, loadKg: 0 }, [{ reps: 15, loadKg: 0 }])).toEqual({
      kind: 'reps',
    });
    expect(
      detectPersonalRecord({ reps: 12, loadKg: 60 }, [
        { reps: 11, loadKg: 60 },
        { reps: 3, loadKg: 90 },
      ]),
    ).toEqual({ kind: 'reps' });
  });

  it('la primera vez que se hace un ejercicio no es récord: no hay máximo previo que superar', () => {
    expect(detectPersonalRecord({ reps: 5, loadKg: 100 }, [])).toBeNull();
  });
});

describe('RN-ENT-006 · actividad importada', () => {
  it(`cuenta como entreno alternativo si dura al menos P-025 minutos`, () => {
    expect(isImportedActivityValid(T.importedActivityMinMinutes)).toBe(true);
    expect(isImportedActivityValid(T.importedActivityMinMinutes - 1)).toBe(false);
  });

  it('no modifica la progresión de cargas: la progresión solo mira sesiones registradas', () => {
    // suggestProgression no recibe actividades importadas; con historial vacío mantiene.
    expect(
      suggestProgression({
        recentSessions: [],
        repRange: { min: 6, max: 10 },
        pattern: 'SQUAT',
        variant: 'GYM',
        currentLoadKg: 60,
      }),
    ).toEqual({ type: 'keep' });
  });
});
