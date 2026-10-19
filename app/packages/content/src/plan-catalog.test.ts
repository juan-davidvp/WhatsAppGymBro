import { generateWeeklyPlan, PARAMETERS, WEEK_DAYS } from '@gymbro/domain';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { EXERCISES, EXPRESS_EXCEPTIONS } from './index.js';

/** T-011 con el catálogo real de ejercicios de la bóveda. */
describe('RN-PLAN-003 · RN-PLAN-010 · el generador funciona con el catálogo real', () => {
  it('propiedad: toda sesión tiene A, B y C con ejercicios del catálogo y dentro del tiempo', () => {
    const codes = new Set(EXERCISES.map((e) => e.code));
    const P = PARAMETERS.plan;
    fc.assert(
      fc.property(
        fc.constantFrom('novice' as const, 'intermediate' as const),
        fc.subarray([...WEEK_DAYS], {
          minLength: P.availableDaysRange.min,
          maxLength: P.availableDaysRange.max,
        }),
        fc.integer({ min: P.sessionMinutesRange.min, max: P.sessionMinutesRange.max }),
        fc.constantFrom('gain_muscle' as const, 'gain_strength' as const, 'consistency' as const),
        (level, availableDays, sessionMinutes, goal) => {
          const plan = generateWeeklyPlan({
            level,
            availableDays,
            sessionMinutes,
            goal,
            homeEquipment: ['Mancuernas'],
            weekStart: '2026-10-19',
            rotationStart: 0,
            catalog: EXERCISES,
            expressExceptions: EXPRESS_EXCEPTIONS,
          });
          for (const day of plan.days) {
            if (!day.session) continue;
            for (const version of Object.values(day.session.versions)) {
              expect(version.exercises.length).toBeGreaterThan(0);
              expect(version.exercises.every((e) => codes.has(e.exerciseCode))).toBe(true);
              expect(version.estimatedMinutes).toBeLessThanOrEqual(sessionMinutes + 1e-9);
            }
            expect(day.session.versions.EXPRESS.estimatedMinutes).toBeLessThanOrEqual(
              P.expressMinutes + 1e-9,
            );
          }
        },
      ),
    );
  });
});
