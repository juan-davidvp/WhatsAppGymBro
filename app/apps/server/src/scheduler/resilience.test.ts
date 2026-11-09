import { PARAMETERS, initialPlayerState, initialStreakState, startProgress } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import type { EventEmitter } from '../events/emitter.js';
import { runFlow, ONBOARDED_GYM_LXV } from '../testing/onboarding.js';
import { closeDueDays, type CloseDaysDeps } from './close-days.js';

/**
 * Revisión de M6: el cierre no pierde efectos si algo falla a mitad (FR-005-02),
 * la reparación se intenta aunque la misión se hiciera antes de la oferta
 * (RN-GAM-003) y una misión alcanzada en un día con señal de riesgo no se pierde
 * (FR-005-07). Onboarding el lunes 2026-10-19 (plan L-X-V).
 */

async function setup() {
  let now = new Date('2026-10-19T15:00:00Z');
  const clock = () => now;
  const flow = await runFlow(ONBOARDED_GYM_LXV, { clock });
  const userId = flow.user()?.id ?? '';
  const deps: CloseDaysDeps = { ...flow.deps, clock };
  return {
    ...flow,
    userId,
    deps,
    goTo: (iso: string) => {
      now = new Date(iso);
    },
    named: (name: string) => flow.events.filter((e) => e.name === name),
    completedSession: (date: string) =>
      deps.workouts.create({
        userId,
        date,
        plannedSessionId: 'p',
        template: 'FULL_A',
        variant: 'EXPRESS',
        status: 'completed',
        startedAt: now,
        endedAt: now,
        loggedAsPlanned: true,
        progress: startProgress([]),
        lastConfirmedAt: null,
        pendingTaps: 0,
      }),
  };
}

describe('FR-005-02 · un fallo a mitad del cierre no pierde efectos', () => {
  it('si falla un efecto, el día no queda cerrado en el estado y el ciclo siguiente lo repite completo', async () => {
    const t = await setup();
    t.streakStates.set(t.userId, {
      rev: 1,
      state: {
        ...initialPlayerState(),
        counted: { total: 3, lastClosedDate: '2026-10-18' },
        comeback: { pending: true },
      },
    });
    await t.deps.days.addSource(t.userId, '2026-10-19', 'TRAINING', 'session:s1');
    let failed = false;
    const flaky: EventEmitter = {
      emit: (name, subject, props) => {
        if (name === 'day_closed' && !failed) {
          failed = true;
          return Promise.reject(new Error('mongo caído'));
        }
        return t.deps.events.emit(name, subject, props);
      },
    };
    t.goTo('2026-10-20T17:00:00Z');
    expect(await closeDueDays({ ...t.deps, events: flaky })).toBe(0);
    expect(t.streakStates.get(t.userId)?.state.counted.lastClosedDate).toBe('2026-10-18');
    expect(await closeDueDays(t.deps)).toBe(1);
    expect(t.named('day_closed')).toHaveLength(1);
    expect(t.xpLedger.filter((e) => e.refId === 'comeback:2026-10-19')).toHaveLength(1);
    expect(t.streakStates.get(t.userId)?.state.comeback.pending).toBe(false);
  });
});

describe('RN-GAM-003 · la misión de regreso hecha antes de la oferta también repara', () => {
  it('sesión y mitad de comida el martes por la mañana; al cerrar el lunes a las 12:00, la racha se repara', async () => {
    const t = await setup();
    t.streakStates.set(t.userId, {
      rev: 1,
      state: {
        ...initialPlayerState(),
        counted: { total: 5, lastClosedDate: '2026-10-18' },
        streak: { ...initialStreakState(), current: 5, longest: 5, lastClosedDate: '2026-10-18' },
      },
    });
    t.goTo('2026-10-20T13:00:00Z'); // martes 08:00: el lunes sigue abierto
    await t.completedSession('2026-10-20');
    await t.deps.days.addSource(t.userId, '2026-10-20', 'REST', 'session:x');
    await t.deps.days.addSource(t.userId, '2026-10-20', 'REST', 'nutrition_half');
    t.goTo('2026-10-20T17:00:00Z');
    await closeDueDays(t.deps);
    expect(t.named('streak_repair_offered')).toHaveLength(1);
    expect(t.named('streak_repaired').map((e) => e.props)).toEqual([{ streak: 5 }]);
    expect(t.streakStates.get(t.userId)?.state.streak.current).toBe(5);
  });
});

describe('FR-005-07 · RN-GAM-008 · una misión alcanzada en un día con señal de riesgo no se pierde', () => {
  it('ese día no se evalúa; se cumple con el cierre del día siguiente, con su XP', async () => {
    const t = await setup();
    await t.deps.days.addSource(t.userId, '2026-10-19', 'TRAINING', 'session:s1');
    await t.completedSession('2026-10-19');
    t.goTo('2026-10-20T17:00:00Z');
    await closeDueDays(t.deps); // cierra el lunes y crea las misiones de la semana
    await t.deps.riskSignals.record(t.userId, 'distress', new Date('2026-10-20T20:00:00Z'));
    t.goTo('2026-10-21T17:00:00Z');
    await closeDueDays(t.deps); // martes, con señal de riesgo
    expect(t.named('quest_completed')).toEqual([]);
    t.goTo('2026-10-22T17:00:00Z');
    await closeDueDays(t.deps); // miércoles
    expect(t.named('quest_completed').map((e) => e.props)).toContainEqual({ kind: 'TRAINING' });
    expect(t.xpLedger.find((e) => e.refId === 'quest:2026-10-19:TRAINING')?.amount).toBe(
      PARAMETERS.xp.table.weeklyQuest,
    );
  });
});
