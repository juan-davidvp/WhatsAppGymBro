import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { PARAMETERS } from '../config/parameters.js';
import { addDays, weekdayOf } from '../time/zoned.js';
import {
  appendToLogbook,
  challengeChaptersCrossed,
  compareWithOwnHistory,
  evaluateWeek,
  generateWeeklyQuests,
  habitForged,
  seasonOf,
  weekStartOf,
  weeklyCommitment,
  type LogbookEntry,
} from './weekly.js';

const { tolerance, minPlannedSessions } = PARAMETERS.week.commitmentTolerance;

describe('RN-GAM-004 · semana cumplida', () => {
  it(`la semana empieza en ${PARAMETERS.week.startDay} (P-070)`, () => {
    expect(weekStartOf('2026-10-22')).toBe('2026-10-19'); // jueves → lunes
    expect(weekStartOf('2026-10-19')).toBe('2026-10-19');
    expect(weekStartOf('2026-10-25')).toBe('2026-10-19'); // domingo
    expect(weekdayOf(weekStartOf('2026-10-25'))).toBe(PARAMETERS.week.startDay);
  });

  it(`con ${minPlannedSessions} o más planificadas, el compromiso es planificadas − P-037`, () => {
    expect(weeklyCommitment(minPlannedSessions)).toBe(minPlannedSessions - tolerance);
    expect(weeklyCommitment(5)).toBe(5 - tolerance);
  });

  it(`con menos de ${minPlannedSessions}, el compromiso son todas las planificadas`, () => {
    expect(weeklyCommitment(minPlannedSessions - 1)).toBe(minPlannedSessions - 1);
  });

  it('está cumplida si las sesiones completadas alcanzan el compromiso', () => {
    expect(evaluateWeek({ planned: 4, completed: 3, paused: false })).toEqual({
      evaluated: true,
      commitment: 3,
      fulfilled: true,
    });
    expect(evaluateWeek({ planned: 4, completed: 2, paused: false })).toMatchObject({
      fulfilled: false,
    });
  });

  it('una semana en pausa o sin sesiones planificadas no se evalúa (ni cumplida ni rota)', () => {
    expect(evaluateWeek({ planned: 4, completed: 0, paused: true })).toEqual({ evaluated: false });
    expect(evaluateWeek({ planned: 0, completed: 0, paused: false })).toEqual({ evaluated: false });
  });
});

describe('RN-GAM-008 · misiones semanales', () => {
  it('son 3: entreno, comida y constancia', () => {
    const quests = generateWeeklyQuests({ sessions: 4, nutritionHalfDays: 5, countedDays: 6 });
    expect(quests.map((q) => q.kind)).toEqual(['TRAINING', 'NUTRITION', 'CONSISTENCY']);
  });

  it('la dificultad es P-041 × lo logrado la semana anterior', () => {
    const factor = PARAMETERS.quests.difficultyFactor;
    const quests = generateWeeklyQuests({ sessions: 5, nutritionHalfDays: 5, countedDays: 6 });
    expect(quests[0]?.target).toBe(Math.floor(factor * 5));
    expect(quests[2]?.target).toBe(Math.floor(factor * 6));
  });

  it('nunca baja de un mínimo alcanzable, ni la primera semana', () => {
    for (const quest of generateWeeklyQuests(null)) expect(quest.target).toBeGreaterThanOrEqual(1);
    for (const quest of generateWeeklyQuests({
      sessions: 0,
      nutritionHalfDays: 0,
      countedDays: 0,
    })) {
      expect(quest.target).toBe(1);
    }
  });

  it('propiedad: la meta nunca es mayor que lo logrado (salvo el mínimo de 1)', () => {
    fc.assert(
      fc.property(fc.nat({ max: 7 }), fc.nat({ max: 7 }), fc.nat({ max: 7 }), (s, n, c) => {
        const achieved = [s, n, c];
        generateWeeklyQuests({ sessions: s, nutritionHalfDays: n, countedDays: c }).forEach(
          (q, i) => {
            expect(q.target).toBeLessThanOrEqual(Math.max(1, achieved[i] ?? 0));
          },
        );
      }),
    );
  });
});

describe('RN-GAM-009 · liga personal: solo contra uno mismo', () => {
  it('compara con la semana anterior y con la mejor semana propia', () => {
    expect(compareWithOwnHistory({ current: 5, previous: 3, best: 4 })).toEqual({
      deltaVsPrevious: 2,
      isNewBest: true,
    });
    expect(compareWithOwnHistory({ current: 2, previous: null, best: 4 })).toEqual({
      deltaVsPrevious: null,
      isNewBest: false,
    });
  });

  it('no existen rankings entre usuarios: la comparación no recibe ni devuelve datos de otros', () => {
    expect(Object.keys(compareWithOwnHistory({ current: 1, previous: 1, best: 1 }))).toEqual([
      'deltaVsPrevious',
      'isNewBest',
    ]);
  });
});

describe('RN-GAM-010 · temporadas de P-042 semanas que inician en lunes', () => {
  const anchor = '2026-10-19'; // lunes
  const days = PARAMETERS.season.weeks * 7;

  it('calcula inicio y fin de cada temporada', () => {
    expect(seasonOf(anchor, anchor)).toEqual({
      index: 0,
      start: anchor,
      end: addDays(anchor, days - 1),
    });
    expect(seasonOf(addDays(anchor, days), anchor)).toMatchObject({
      index: 1,
      start: addDays(anchor, days),
    });
  });

  it('toda temporada empieza en lunes', () => {
    fc.assert(
      fc.property(fc.nat({ max: 1000 }), (offset) => {
        expect(weekdayOf(seasonOf(addDays(anchor, offset), anchor).start)).toBe('monday');
      }),
    );
  });

  it('rechaza un ancla que no sea lunes', () => {
    expect(() => seasonOf('2026-10-21', '2026-10-20')).toThrow('RN-GAM-010');
  });
});

describe('RN-GAM-011 · la bitácora de logros solo crece', () => {
  const entry = (code: string, date = '2026-10-19'): LogbookEntry => ({ code, date, value: null });

  it('registra un logro una sola vez', () => {
    const log = appendToLogbook([], entry('FIRST_SESSION'));
    expect(appendToLogbook(log, entry('FIRST_SESSION', '2026-10-20'))).toEqual(log);
  });

  it('propiedad: la bitácora nunca pierde entradas', () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom('A', 'B', 'C', 'D'), { maxLength: 30 }), (codes) => {
        let log: readonly LogbookEntry[] = [];
        for (const code of codes) {
          const next = appendToLogbook(log, entry(code));
          expect(next.slice(0, log.length)).toEqual(log);
          log = next;
        }
      }),
    );
  });
});

describe('RN-GAM-012 · Reto 66', () => {
  const chapters = PARAMETERS.challenge66.chapters;

  it('desbloquea los capítulos P-044 al alcanzar esos días que cuentan acumulados', () => {
    expect(challengeChaptersCrossed(6, 7)).toEqual([chapters[0]]);
    expect(challengeChaptersCrossed(7, 8)).toEqual([]);
    expect(challengeChaptersCrossed(0, 66)).toEqual([...chapters]);
  });

  it(`con ${PARAMETERS.challenge66.days} días acumulados otorga "Hábito forjado" una vez`, () => {
    const days = PARAMETERS.challenge66.days;
    expect(habitForged(days - 1, days)).toBe(true);
    expect(habitForged(days, days + 1)).toBe(false);
    expect(habitForged(days - 2, days - 1)).toBe(false);
  });
});
