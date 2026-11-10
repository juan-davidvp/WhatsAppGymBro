import { EXERCISES, renderTemplate, templateById } from '@gymbro/content';
import {
  PARAMETERS,
  alternateGoal,
  plannedSetCount,
  repRangeFor,
  type SessionProgress,
} from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { ensureWeek, suggestedLoadsFor } from '../plans/weekly-plan.js';
import { inMemoryDependencies } from '../testing/in-memory.js';
import { ONBOARDED_GYM_LXV, runFlow, type FlowStep } from '../testing/onboarding.js';
import { exerciseName, formatLoad, usesEquipment } from './card.js';

/** Bot con onboarding hecho y la sesión de gym del lunes abierta. */
async function gymSession(steps: readonly FlowStep[] = []) {
  const flow = await runFlow([...ONBOARDED_GYM_LXV, { text: '🏋️ Hoy' }, 'Gym', ...steps]);
  const session = () => flow.workouts.at(-1);
  const progress = (): SessionProgress =>
    session()?.progress ?? {
      exercises: [],
      cursor: null,
      pending: { reps: 0, loadKg: 0 },
      logged: [],
    };
  const first = () => {
    const exercise = progress().exercises[0];
    if (!exercise) throw new Error('Sesión sin ejercicios');
    return exercise;
  };
  const userId = () => flow.user()?.id ?? '';
  /** Series de sesiones anteriores de ese ejercicio, antes del lunes de prueba. */
  const seedHistory = async (
    code: string,
    sessions: readonly { reps: number; loadKg: number }[],
  ) => {
    for (const [i, set] of sessions.entries()) {
      await flow.deps.setEntries.record({
        userId: userId(),
        sessionId: `old${String(i)}`.padEnd(24, '0'),
        exerciseCode: code,
        setIndex: 0,
        reps: set.reps,
        loadKg: set.loadKg,
        edited: false,
        confirmedAt: new Date(Date.UTC(2026, 9, 1 + i)),
      });
    }
  };
  const toast = () =>
    flow.calls.filter((c) => c.method === 'answerCallbackQuery').at(-1)?.payload['text'];
  return { ...flow, session, progress, first, userId, seedHistory, toast };
}

describe('HU-003-4 · RN-ENT-005 · T-044 · récords personales', () => {
  it('la primera serie de un ejercicio nunca es récord (no hay con qué comparar)', async () => {
    const flow = await gymSession(['✅ Hecha']);
    expect(flow.records).toEqual([]);
    expect(flow.toast()).toBeUndefined();
  });

  it('más repeticiones con la misma carga: PR-01 como aviso, se guarda una vez y FIRST_PR', async () => {
    const flow = await gymSession();
    const { exerciseCode } = flow.first();
    const { reps, loadKg } = flow.progress().pending;
    await flow.seedHistory(exerciseCode, [{ reps: reps - 1, loadKg }]);
    await flow.act('✅ Hecha');
    expect(flow.toast()).toBe(
      renderTemplate('PR-01', {
        ejercicio: exerciseName(exerciseCode),
        carga: formatLoad(loadKg, usesEquipment(exerciseCode)),
        reps,
      }),
    );
    expect(flow.records).toHaveLength(1);
    expect(flow.achievements.map((a) => a.code)).toEqual(['FIRST_PR']);
    expect(flow.events.find((e) => e.name === 'pr_detected')?.props).toEqual({
      exerciseCode,
      kind: 'reps',
    });
  });

  it('SE-01 suma los récords de la sesión ({record_txt})', async () => {
    const flow = await gymSession();
    const { exerciseCode } = flow.first();
    const { reps, loadKg } = flow.progress().pending;
    await flow.seedHistory(exerciseCode, [{ reps: reps - 1, loadKg }]);
    const total = plannedSetCount(flow.progress());
    for (let i = 0; i < total; i++) await flow.act('✅ Hecha');
    await flow.act('🏁 Terminar');
    const count = flow.records.length;
    expect(count).toBeGreaterThan(0);
    const recordTxt = ` y ${String(count)} ${count === 1 ? 'récord' : 'récords'} 🏆`;
    const texts = flow.calls
      .filter((c) => c.method === 'editMessageText' || c.method === 'sendMessage')
      .map((c) => String(c.payload['text']));
    expect(texts).toContain(
      renderTemplate('SE-01', { series: total, record_txt: recordTxt, n: 1, racha: 1 }),
    );
  });
});

describe('HU-003-5 escenario 1 · RN-ENT-002 · T-044 · progresión de carga', () => {
  const exercise = EXERCISES.find((e) => e.variants.includes('GYM'));
  if (!exercise) throw new Error('Catálogo sin ejercicios de gym');
  const top = repRangeFor('gain_muscle', exercise.pattern, 'GYM').max;

  async function withTopSessions() {
    const memory = inMemoryDependencies();
    const deps = { ...memory.deps, clock: () => new Date('2026-10-19T15:00:00Z') };
    for (let s = 0; s < PARAMETERS.training.sessionsAtTopToProgress; s++) {
      await deps.setEntries.record({
        userId: 'u1',
        sessionId: `s${String(s)}`.padEnd(24, '0'),
        exerciseCode: exercise?.code ?? '',
        setIndex: 0,
        reps: top,
        loadKg: 20,
        edited: false,
        confirmedAt: new Date(Date.UTC(2026, 9, 1 + s)),
      });
    }
    return deps;
  }

  it(`P-019 sesiones en el tope del rango: la carga sube`, async () => {
    const deps = await withTopSessions();
    const { loads, increased } = await suggestedLoadsFor('u1', 'gain_muscle', deps);
    expect(increased).toBe(1);
    expect(loads[exercise.code]).toBeGreaterThan(20);
  });

  it('RN-SEG-006 · con dolor en una de esas sesiones, la carga no sube', async () => {
    const deps = await withTopSessions();
    await deps.painFlags.record({
      userId: 'u1',
      exerciseCode: exercise.code,
      zone: 'knee',
      date: '2026-10-02',
      sessionId: 's1'.padEnd(24, '0'),
    });
    const { loads, increased } = await suggestedLoadsFor('u1', 'gain_muscle', deps);
    expect(increased).toBe(0);
    expect(loads[exercise.code]).toBe(20);
  });
});

describe('HU-003-6 · RN-SEG-006 · T-044 · [⚠️ Dolor]', () => {
  it('pide la zona con DL-01 en la misma tarjeta', async () => {
    const flow = await gymSession(['⚠️ Dolor']);
    expect(flow.last()?.text).toBe(templateById('DL-01').text);
    expect(flow.last()?.buttons.map((b) => b.text)).toEqual(templateById('DL-01').buttons);
    expect(flow.calls.filter((c) => c.method !== 'answerCallbackQuery').at(-1)?.method).toBe(
      'editMessageText',
    );
  });

  it('la zona se guarda, emite pain_flagged sin texto libre y responde CU-04 fija', async () => {
    const flow = await gymSession(['⚠️ Dolor', 'Rodilla']);
    expect(flow.painFlags).toMatchObject([
      { exerciseCode: flow.first().exerciseCode, zone: 'knee', sessionId: flow.session()?.id },
    ]);
    expect(flow.events.at(-1)).toMatchObject({ name: 'pain_flagged', props: { zone: 'knee' } });
    expect(flow.last()?.text).toBe(templateById('CU-04').text);
    expect(flow.last()?.buttons.map((b) => b.text)).toEqual([
      'Ver variante',
      '⏭️ Siguiente ejercicio',
    ]);
  });

  it(`dolor en P-062 sesiones distintas del mismo ejercicio: CU-09 recomienda profesional`, async () => {
    const flow = await gymSession();
    await flow.deps.painFlags.record({
      userId: flow.userId(),
      exerciseCode: flow.first().exerciseCode,
      zone: 'knee',
      date: '2026-10-12',
      sessionId: 'older'.padEnd(24, '0'),
    });
    await flow.act('⚠️ Dolor');
    await flow.act('Rodilla');
    expect(flow.last()?.text).toBe(templateById('CU-09').text);
  });

  it('[Ver variante] cambia el ejercicio por otro del mismo patrón, o pasa al siguiente con DL-02', async () => {
    const flow = await gymSession(['⚠️ Dolor', 'Hombro']);
    const before = flow.first();
    await flow.act('Ver variante');
    const after = flow.progress().exercises[0];
    if (after?.exerciseCode !== before.exerciseCode) {
      expect(after?.pattern).toBe(before.pattern);
      expect(flow.last()?.text.startsWith(exerciseName(after?.exerciseCode ?? ''))).toBe(true);
    } else {
      expect(flow.toast()).toBe(templateById('DL-02').text);
      expect(flow.progress().cursor?.exercise).not.toBe(0);
    }
  });

  it('[⏭️ Siguiente ejercicio] desde CU-04 salta el ejercicio con dolor', async () => {
    const flow = await gymSession(['⚠️ Dolor', 'Codo', '⏭️ Siguiente ejercicio']);
    expect(flow.progress().cursor?.exercise).toBe(1);
  });
});

describe('HU-003-5 escenario 2 · RN-ENT-003 · T-044 · estancamiento', () => {
  /** P-022 + 1 sesiones previas con la misma marca, y la de hoy "tal cual" sin mejorarla. */
  async function stalled() {
    const flow = await gymSession();
    const { exerciseCode } = flow.first();
    await flow.seedHistory(
      exerciseCode,
      Array.from({ length: PARAMETERS.training.plateauSessions + 1 }, () => ({
        reps: 8,
        loadKg: 200,
      })),
    );
    await flow.act('La hice tal cual');
    return flow;
  }

  it('al terminar ofrece ES-01 con rango, variante o semana suave y emite plateau_detected', async () => {
    const flow = await stalled();
    expect(flow.last()?.text).toBe(
      renderTemplate('ES-01', {
        ejercicio: exerciseName(flow.first().exerciseCode),
        sesiones: PARAMETERS.training.plateauSessions,
      }),
    );
    expect(flow.last()?.buttons.map((b) => b.text)).toEqual(templateById('ES-01').buttons);
    expect(flow.events.map((e) => e.name)).toContain('plateau_detected');
  });

  it('sin historia suficiente no hay ES-01', async () => {
    const flow = await gymSession(['La hice tal cual']);
    expect(flow.events.map((e) => e.name)).not.toContain('plateau_detected');
  });

  it('[Semana suave]: ES-04 con P-091 series menos, guardada desde la semana siguiente', async () => {
    const flow = await stalled();
    const exercise = flow.first();
    await flow.act('Semana suave');
    expect(flow.last()?.text).toBe(
      renderTemplate('ES-04', {
        ejercicio: exerciseName(exercise.exerciseCode),
        series: Math.max(1, exercise.sets - PARAMETERS.training.deloadSetReduction),
      }),
    );
    expect(flow.adjustments).toMatchObject([
      { exerciseCode: exercise.exerciseCode, strategy: 'deload', fromWeek: '2026-10-26' },
    ]);
  });

  it('la semana siguiente se genera con la estrategia (y si ya existía sin usar, se rehace)', async () => {
    const flow = await stalled();
    const exercise = flow.first();
    const user = flow.user();
    if (!user) throw new Error('Sin usuario');
    const deps = { ...flow.deps, clock: () => new Date('2026-10-19T15:00:00Z') };
    await ensureWeek(user, '2026-10-26', deps);
    await flow.act('Semana suave');
    const week = await ensureWeek(user, '2026-10-26', deps);
    const sets = (week?.days ?? [])
      .flatMap((d) => d.session?.versions.GYM.exercises ?? [])
      .filter((e) => e.exerciseCode === exercise.exerciseCode)
      .map((e) => e.sets);
    expect(sets.length).toBeGreaterThan(0);
    expect(new Set(sets)).toEqual(
      new Set([Math.max(1, exercise.sets - PARAMETERS.training.deloadSetReduction)]),
    );
  });

  it('[Cambiar rango]: ES-03 con el rango alterno de P-016', async () => {
    const flow = await stalled();
    const exercise = flow.first();
    await flow.act('Cambiar rango');
    const range = repRangeFor(alternateGoal('gain_muscle'), exercise.pattern, 'GYM');
    expect(flow.last()?.text).toBe(
      renderTemplate('ES-03', {
        ejercicio: exerciseName(exercise.exerciseCode),
        min: range.min,
        max: range.max,
      }),
    );
  });

  it('[Cambiar variante]: ES-02 con otro ejercicio del patrón, o ES-05 si no hay', async () => {
    const flow = await stalled();
    const exercise = flow.first();
    await flow.act('Cambiar variante');
    const adjustment = flow.adjustments[0];
    if (adjustment) {
      expect(adjustment.strategy).toBe('variant');
      expect(flow.last()?.text).toBe(
        renderTemplate('ES-02', {
          ejercicio: exerciseName(exercise.exerciseCode),
          nuevo: exerciseName(adjustment.replacementCode ?? ''),
        }),
      );
    } else {
      expect(flow.last()?.text).toBe(
        renderTemplate('ES-05', { ejercicio: exerciseName(exercise.exerciseCode) }),
      );
    }
  });

  it('tocar dos veces la estrategia no la duplica; nunca toca días ni récords', async () => {
    const flow = await stalled();
    const days = flow.days.map((d) => ({ ...d }));
    await flow.act('Semana suave');
    await flow.act('Semana suave');
    expect(flow.adjustments).toHaveLength(1);
    expect(flow.days).toEqual(days);
  });
});
