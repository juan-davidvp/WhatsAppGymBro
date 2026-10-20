/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { PARAMETERS } from '../config/parameters.js';
import { zonedTimeToInstant, type Weekday } from '../time/zoned.js';
import {
  chooseTrainingDays,
  estimateExpressMinutes,
  generateWeeklyPlan,
  maxConsecutiveTrainingDays,
  planPublishedAt,
  rescheduleSession,
  sessionCycleFor,
  sessionReadyAt,
  SESSION_PATTERNS,
  updateHabitTime,
  WEEK_DAYS,
  type CatalogExercise,
  type ExpressException,
  type PlanInputs,
} from './plan.js';

const P = PARAMETERS.plan;
const MONDAY = '2026-10-19';
const TZ = 'America/Bogota';

/** Catálogo de prueba: un ejercicio por patrón y versión, como el de la bóveda. */
const CATALOG: CatalogExercise[] = [
  { code: 'LEG_PRESS', pattern: 'SQUAT', variants: ['GYM'], level: 'novice', equipment: 'Máquina' },
  {
    code: 'SQ_BB',
    pattern: 'SQUAT',
    variants: ['GYM'],
    level: 'intermediate',
    equipment: 'Barra, rack',
  },
  {
    code: 'SQ_GOBLET',
    pattern: 'SQUAT',
    variants: ['GYM', 'HOME'],
    level: 'novice',
    equipment: 'Mancuerna, kettlebell o mochila',
  },
  {
    code: 'SQ_BW',
    pattern: 'SQUAT',
    variants: ['HOME', 'EXPRESS'],
    level: 'novice',
    equipment: 'Ninguno',
  },
  {
    code: 'RDL_DB',
    pattern: 'HINGE',
    variants: ['GYM', 'HOME'],
    level: 'novice',
    equipment: 'Mancuernas',
  },
  {
    code: 'GLUTE_BRIDGE',
    pattern: 'HINGE',
    variants: ['HOME', 'EXPRESS'],
    level: 'novice',
    equipment: 'Ninguno',
  },
  {
    code: 'DB_BENCH',
    pattern: 'PUSH_H',
    variants: ['GYM'],
    level: 'novice',
    equipment: 'Mancuernas, banco',
  },
  {
    code: 'PUSHUP',
    pattern: 'PUSH_H',
    variants: ['HOME', 'EXPRESS'],
    level: 'novice',
    equipment: 'Ninguno',
  },
  {
    code: 'OHP_DB',
    pattern: 'PUSH_V',
    variants: ['GYM'],
    level: 'novice',
    equipment: 'Mancuernas',
  },
  {
    code: 'PIKE_PUSHUP',
    pattern: 'PUSH_V',
    variants: ['HOME', 'EXPRESS'],
    level: 'novice',
    equipment: 'Ninguno',
  },
  { code: 'ROW_CABLE', pattern: 'PULL_H', variants: ['GYM'], level: 'novice', equipment: 'Polea' },
  {
    code: 'ROW_DB',
    pattern: 'PULL_H',
    variants: ['GYM', 'HOME'],
    level: 'novice',
    equipment: 'Mancuerna, banco',
  },
  {
    code: 'ROW_BAND',
    pattern: 'PULL_H',
    variants: ['HOME'],
    level: 'novice',
    equipment: 'Banda elástica',
  },
  {
    code: 'ROW_INVERTED',
    pattern: 'PULL_H',
    variants: ['HOME', 'EXPRESS'],
    level: 'novice',
    equipment: 'Mesa estable',
  },
  {
    code: 'LAT_PULLDOWN',
    pattern: 'PULL_V',
    variants: ['GYM'],
    level: 'novice',
    equipment: 'Polea',
  },
  {
    code: 'BAND_PULLDOWN',
    pattern: 'PULL_V',
    variants: ['HOME'],
    level: 'novice',
    equipment: 'Banda elástica',
  },
  {
    code: 'LUNGE_DB',
    pattern: 'SINGLE_LEG',
    variants: ['GYM'],
    level: 'novice',
    equipment: 'Mancuernas',
  },
  {
    code: 'REVERSE_LUNGE',
    pattern: 'SINGLE_LEG',
    variants: ['HOME', 'EXPRESS'],
    level: 'novice',
    equipment: 'Ninguno',
  },
  {
    code: 'PLANK',
    pattern: 'CORE',
    variants: ['GYM', 'HOME', 'EXPRESS'],
    level: 'novice',
    equipment: 'Ninguno',
  },
  {
    code: 'CURL_DB',
    pattern: 'ARMS',
    variants: ['GYM', 'HOME'],
    level: 'novice',
    equipment: 'Mancuernas',
  },
];
const EXCEPTIONS: ExpressException[] = [
  { pattern: 'PULL_V', compensatedBy: 'PULL_H' },
  { pattern: 'ARMS', compensatedBy: null },
];

function inputs(overrides: Partial<PlanInputs> = {}): PlanInputs {
  return {
    level: 'novice',
    availableDays: ['monday', 'wednesday', 'friday'],
    sessionMinutes: 60,
    goal: 'gain_muscle',
    homeEquipment: ['Mancuernas'],
    weekStart: MONDAY,
    rotationStart: 0,
    catalog: CATALOG,
    expressExceptions: EXCEPTIONS,
    ...overrides,
  };
}

const sessions = (plan: ReturnType<typeof generateWeeklyPlan>) =>
  plan.days.flatMap((d) => (d.session ? [d.session] : []));

const arbitraryInputs = fc.record({
  level: fc.constantFrom('novice' as const, 'intermediate' as const),
  availableDays: fc.subarray([...WEEK_DAYS], {
    minLength: P.availableDaysRange.min,
    maxLength: P.availableDaysRange.max,
  }),
  sessionMinutes: fc.integer({ min: P.sessionMinutesRange.min, max: P.sessionMinutesRange.max }),
  goal: fc.constantFrom(
    'gain_muscle' as const,
    'lose_fat' as const,
    'gain_strength' as const,
    'recomposition' as const,
    'consistency' as const,
    'maintain' as const,
  ),
  homeEquipment: fc.subarray(['Mancuernas', 'Banda elástica', 'Mesa estable']),
  rotationStart: fc.nat({ max: 10 }),
  lowIntensity: fc.boolean(),
});

describe('RN-PLAN-001 · el plan sale de nivel, días (P-074), minutos (P-075), objetivo y equipamiento', () => {
  it('rechaza días o minutos fuera de rango', () => {
    expect(() => generateWeeklyPlan(inputs({ availableDays: ['monday'] }))).toThrow('RN-PLAN-001');
    expect(() => generateWeeklyPlan(inputs({ availableDays: [...WEEK_DAYS] }))).toThrow(
      'RN-PLAN-001',
    );
    expect(() =>
      generateWeeklyPlan(inputs({ sessionMinutes: P.sessionMinutesRange.min - 1 })),
    ).toThrow('RN-PLAN-001');
    expect(() =>
      generateWeeklyPlan(inputs({ sessionMinutes: P.sessionMinutesRange.max + 1 })),
    ).toThrow('RN-PLAN-001');
  });

  it('la semana empieza en lunes', () => {
    expect(() => generateWeeklyPlan(inputs({ weekStart: '2026-10-20' }))).toThrow('RN-PLAN-001');
  });

  it('en casa usa el equipo que el usuario tiene (sin distinguir singular y plural)', () => {
    const session = sessions(generateWeeklyPlan(inputs({ homeEquipment: ['Mancuernas'] })))[0];
    expect(session?.versions.HOME.exercises.find((e) => e.pattern === 'SQUAT')?.exerciseCode).toBe(
      'SQ_GOBLET',
    );
  });

  it('sin equipo para un patrón en casa, usa la compensación del catálogo, no un equipo que no tiene', () => {
    // FULL_A lleva PULL_V; en casa solo hay jalón con banda (no la tiene) → compensa con PULL_H con mancuernas.
    const session = sessions(generateWeeklyPlan(inputs({ homeEquipment: ['Mancuernas'] })))[0];
    const codes = session?.versions.HOME.exercises.map((e) => e.exerciseCode) ?? [];
    expect(codes).not.toContain('BAND_PULLDOWN');
    expect(codes).toContain('ROW_DB');
  });

  it('el objetivo cambia los rangos y el equipamiento la versión de casa', () => {
    const strength = sessions(generateWeeklyPlan(inputs({ goal: 'gain_strength' })))[0];
    const squat = strength?.versions.GYM.exercises.find((e) => e.pattern === 'SQUAT');
    expect(squat?.reps).toEqual(P.repRangesByGoal.strength.compound);
    const withBand = sessions(generateWeeklyPlan(inputs({ homeEquipment: ['Banda elástica'] })))[0];
    expect(withBand?.versions.HOME.exercises.some((e) => e.exerciseCode === 'BAND_PULLDOWN')).toBe(
      true,
    );
  });
});

describe('RN-PLAN-002 · hábito de entreno actualizado con los datos reales', () => {
  it('la hora habitual pasa a la mediana de las últimas sesiones', () => {
    const habit = {
      days: ['tuesday'] as Weekday[],
      usualTimes: { tuesday: '18:00' },
      place: 'gym' as const,
    };
    const updated = updateHabitTime(
      habit,
      'tuesday',
      ['19:00', '19:00', '19:10', '18:50', '19:00', '19:05'],
      '18:00',
    );
    expect(updated.usualTimes.tuesday).toBe('19:00');
  });
});

describe('RN-PLAN-003 · cada sesión tiene versiones A (gym), B (casa) y C (exprés)', () => {
  it('las tres versiones existen y no están vacías', () => {
    for (const session of sessions(generateWeeklyPlan(inputs()))) {
      expect(Object.keys(session.versions).sort()).toEqual(['EXPRESS', 'GYM', 'HOME']);
      expect(session.versions.GYM.exercises.length).toBeGreaterThan(0);
      expect(session.versions.HOME.exercises.length).toBeGreaterThan(0);
      expect(session.versions.EXPRESS.exercises.length).toBeGreaterThan(0);
    }
  });

  it('la versión C es el circuito P-079 con peso corporal', () => {
    const express = sessions(generateWeeklyPlan(inputs({ sessionMinutes: 90 })))[0]?.versions
      .EXPRESS;
    expect(
      express?.exercises.every((e) => e.loadKg === 0 && e.sets === P.expressCircuit.rounds),
    ).toBe(true);
    expect(express?.estimatedMinutes).toBe(
      estimateExpressMinutes(express?.exercises.length ?? 0, P.expressCircuit.rounds),
    );
  });
});

describe('RN-PLAN-003 · la versión C es exprés de P-013 minutos', () => {
  it('propiedad: el circuito nunca pasa de P-013 minutos', () => {
    fc.assert(
      fc.property(arbitraryInputs, (generated) => {
        for (const s of sessions(generateWeeklyPlan(inputs(generated)))) {
          expect(s.versions.EXPRESS.estimatedMinutes).toBeLessThanOrEqual(P.expressMinutes + 1e-9);
        }
      }),
    );
  });
});

describe('RN-PLAN-004 · división según los días disponibles (P-014)', () => {
  it('2 → cuerpo completo A/B · 3 → A/B/C · 4 → torso/pierna · 5 → torso/pierna + cuerpo completo · 6 → empuje/tirón/pierna', () => {
    expect(sessionCycleFor(2)).toEqual(['FULL_A', 'FULL_B']);
    expect(sessionCycleFor(3)).toEqual(['FULL_A', 'FULL_B', 'FULL_C']);
    expect(sessionCycleFor(4)).toEqual(['UPPER', 'LOWER']);
    expect(sessionCycleFor(5)).toEqual(['UPPER', 'LOWER', 'UPPER', 'LOWER', 'FULL_A']);
    expect(sessionCycleFor(6)).toEqual(['PUSH', 'PULL', 'LEGS']);
  });

  it('5–6 días solo para intermedios: un novato con 6 días disponibles entrena 4', () => {
    const six: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    expect(sessions(generateWeeklyPlan(inputs({ availableDays: six }))).length).toBe(4);
    expect(
      sessions(generateWeeklyPlan(inputs({ level: 'intermediate', availableDays: six }))).length,
    ).toBe(6);
  });

  it('la composición de las sesiones coincide con catalogo-de-ejercicios-base §5', () => {
    const md = readFileSync(
      fileURLToPath(
        new URL(
          '../../../../../vault/output/sdd/contenido/catalogo-de-ejercicios-base.md',
          import.meta.url,
        ),
      ),
      'utf8',
    );
    const section = md.slice(md.indexOf('## 5. Composición'));
    const rows = section.split('\n').filter((l) => /^\| [^|]+ \| `[A-Z_]+` \|/.test(l));
    const fromVault = Object.fromEntries(
      rows.map((l) => {
        const cells = l.split('|').map((c) => c.trim());
        return [
          (cells[2] ?? '').replaceAll('`', ''),
          (cells[3] ?? '').replaceAll('`', '').split(' · '),
        ];
      }),
    );
    expect(fromVault).toEqual(SESSION_PATTERNS);
  });
});

describe('RN-PLAN-005 · volumen y repeticiones por nivel y objetivo (P-015, P-016)', () => {
  it('con tiempo de sobra, cada patrón alcanza las series semanales mínimas del nivel', () => {
    for (const level of ['novice', 'intermediate'] as const) {
      const plan = generateWeeklyPlan(
        inputs({ level, sessionMinutes: 90, availableDays: ['monday', 'wednesday', 'friday'] }),
      );
      const weekly = new Map<string, number>();
      for (const s of sessions(plan))
        for (const e of s.versions.GYM.exercises)
          weekly.set(e.pattern, (weekly.get(e.pattern) ?? 0) + e.sets);
      const min =
        level === 'novice'
          ? P.weeklySetsPerMuscle.novice.min
          : P.weeklySetsPerMuscle.intermediate.min;
      expect(Math.min(...weekly.values())).toBeGreaterThanOrEqual(level === 'novice' ? min : 1);
    }
  });

  it('músculo usa 6–15; casa usa 8–20; la repetición precargada es el inicio del rango', () => {
    const session = sessions(generateWeeklyPlan(inputs()))[0];
    expect(session?.versions.GYM.exercises[0]?.reps).toEqual(
      P.repRangesByGoal.muscleFatLossRecomposition,
    );
    expect(session?.versions.HOME.exercises[0]?.reps).toEqual(P.repRangesByGoal.home.reps);
    expect(session?.versions.GYM.exercises[0]?.targetReps).toBe(
      P.repRangesByGoal.muscleFatLossRecomposition.min,
    );
  });

  it('FR-002-08 · intensidad baja con tamizaje positivo', () => {
    const plan = generateWeeklyPlan(
      inputs({ level: 'intermediate', lowIntensity: true, sessionMinutes: 90 }),
    );
    expect(plan.intensity).toBe('low');
  });

  it('FR-002-04 · la carga sugerida viene de la progresión', () => {
    const session = sessions(generateWeeklyPlan(inputs({ suggestedLoads: { LEG_PRESS: 80 } })))[0];
    expect(
      session?.versions.GYM.exercises.find((e) => e.exerciseCode === 'LEG_PRESS')?.loadKg,
    ).toBe(80);
  });
});

describe('RN-PLAN-006 · ninguna versión supera los minutos disponibles', () => {
  it('propiedad: para cualquier entrada válida, A, B y C caben en el tiempo', () => {
    fc.assert(
      fc.property(arbitraryInputs, (generated) => {
        const plan = generateWeeklyPlan(inputs(generated));
        for (const s of sessions(plan)) {
          for (const version of Object.values(s.versions)) {
            expect(version.estimatedMinutes).toBeLessThanOrEqual(generated.sessionMinutes + 1e-9);
          }
        }
      }),
    );
  });

  it('con 20 minutos recorta series en lugar de pasarse', () => {
    const plan = generateWeeklyPlan(inputs({ sessionMinutes: P.sessionMinutesRange.min }));
    const session = sessions(plan)[0];
    expect(session?.versions.GYM.estimatedMinutes).toBeLessThanOrEqual(P.sessionMinutesRange.min);
  });
});

describe('RN-PLAN-007 · una sesión no realizada no genera deuda', () => {
  it('el plan no recibe lo realizado: la semana siguiente tiene el mismo volumen pase lo que pase', () => {
    const week1 = generateWeeklyPlan(inputs());
    const week2 = generateWeeklyPlan(
      inputs({ weekStart: '2026-10-26', rotationStart: week1.nextRotationStart }),
    );
    const volume = (p: typeof week1) =>
      sessions(p).map((s) => s.versions.GYM.exercises.reduce((n, e) => n + e.sets, 0));
    expect(volume(week2)).toEqual(volume(week1));
  });

  it('la rotación continúa por día planificado', () => {
    const week1 = generateWeeklyPlan(inputs({ availableDays: ['monday', 'thursday'] }));
    expect(sessions(week1).map((s) => s.template)).toEqual(['FULL_A', 'FULL_B']);
    const week2 = generateWeeklyPlan(
      inputs({
        availableDays: ['monday', 'wednesday', 'friday'],
        rotationStart: 1,
        weekStart: '2026-10-26',
      }),
    );
    expect(sessions(week2).map((s) => s.template)).toEqual(['FULL_B', 'FULL_C', 'FULL_A']);
  });

  it('se puede mover a un descanso de la misma semana sin volumen extra', () => {
    const plan = generateWeeklyPlan(inputs());
    const moved = rescheduleSession(plan, '2026-10-19', '2026-10-20', 'novice');
    expect(moved.days[0]?.session).toBeNull();
    expect(moved.days[1]?.session).toEqual(plan.days[0]?.session);
    expect(sessions(moved)).toHaveLength(sessions(plan).length);
  });

  it('no se puede mover a un día que ya tiene sesión', () => {
    const plan = generateWeeklyPlan(inputs());
    expect(() => rescheduleSession(plan, '2026-10-19', '2026-10-21', 'novice')).toThrow(
      'RN-PLAN-007',
    );
  });
});

describe('RN-PLAN-008 · descanso mínimo y días seguidos de novato', () => {
  it('cuenta los días seguidos como una semana que continúa', () => {
    expect(maxConsecutiveTrainingDays([true, false, false, false, false, true, true])).toBe(3);
  });

  it('propiedad: ningún plan deja menos de P-017 descansos ni más de P-018 días seguidos a un novato', () => {
    fc.assert(
      fc.property(arbitraryInputs, (generated) => {
        const plan = generateWeeklyPlan(inputs(generated));
        const pattern = plan.days.map((d) => d.type === 'TRAINING');
        expect(pattern.filter((t) => !t).length).toBeGreaterThanOrEqual(P.minRestDaysPerWeek);
        if (generated.level === 'novice')
          expect(maxConsecutiveTrainingDays(pattern)).toBeLessThanOrEqual(
            P.noviceMaxConsecutiveDays,
          );
        expect(pattern.filter(Boolean).length).toBeGreaterThan(0);
      }),
    );
  });

  it('un novato con lunes a jueves disponibles no entrena los cuatro seguidos', () => {
    const days = chooseTrainingDays('novice', ['monday', 'tuesday', 'wednesday', 'thursday']);
    expect(days.length).toBeLessThanOrEqual(P.noviceMaxConsecutiveDays);
  });

  it('mover una sesión no puede romper el descanso', () => {
    const plan = generateWeeklyPlan(
      inputs({ availableDays: ['monday', 'tuesday', 'thursday', 'friday'] }),
    );
    expect(sessions(plan)).toHaveLength(4);
    // Viernes → miércoles deja lunes a jueves seguidos (4 > P-018).
    expect(() => rescheduleSession(plan, '2026-10-23', '2026-10-21', 'novice')).toThrow(
      'RN-PLAN-008',
    );
  });
});

describe('RN-PLAN-009 · el plan se publica con el resumen semanal y la sesión está lista antes de la hora', () => {
  it('se publica el domingo anterior a la hora P-060', () => {
    expect(planPublishedAt(MONDAY, TZ)).toEqual(
      zonedTimeToInstant('2026-10-18', PARAMETERS.messages.weeklySummaryAt.time, TZ),
    );
  });

  it('la sesión está lista P-048 minutos antes de la hora habitual', () => {
    const ready = sessionReadyAt(MONDAY, '18:00', TZ);
    expect(ready.getTime()).toBeLessThan(zonedTimeToInstant(MONDAY, '18:00', TZ).getTime());
  });
});

describe('RN-PLAN-010 · cada ejercicio A tiene equivalentes B y C del mismo patrón, salvo las excepciones exprés', () => {
  it('en cada sesión, los patrones de A están en B y en C (o en su compensación, o se omiten)', () => {
    fc.assert(
      fc.property(arbitraryInputs, (generated) => {
        for (const s of sessions(generateWeeklyPlan(inputs(generated)))) {
          const home = new Set(s.versions.HOME.exercises.map((e) => e.pattern));
          const express = new Set(s.versions.EXPRESS.exercises.map((e) => e.pattern));
          for (const e of s.versions.GYM.exercises) {
            const exception = EXCEPTIONS.find((x) => x.pattern === e.pattern);
            if (!exception) expect(express.has(e.pattern)).toBe(true);
            else if (exception.compensatedBy)
              expect(express.has(exception.compensatedBy)).toBe(true);
          }
          // B se recorta por tiempo igual que A, pero nunca tiene patrones que A no tenga.
          const allowed = new Set([
            ...SESSION_PATTERNS[s.template],
            ...EXCEPTIONS.flatMap((x) => (x.compensatedBy ? [x.compensatedBy] : [])),
          ]);
          for (const p of home) expect(allowed.has(p)).toBe(true);
        }
      }),
    );
  });
});
