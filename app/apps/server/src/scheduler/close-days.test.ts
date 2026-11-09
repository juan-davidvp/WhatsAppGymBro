import { describe, expect, it } from 'vitest';
import { runFlow, ONBOARDED_GYM_LXV } from '../testing/onboarding.js';
import { closeDueDays, type CloseDaysDeps } from './close-days.js';

/**
 * T-060 · cierre programado del día (HU-005-1, FR-005-02). El onboarding termina
 * el lunes 2026-10-19 a las 10:00 en Bogotá (UTC−5); plan L-X-V.
 */

function movableClock() {
  let now = new Date('2026-10-19T15:00:00Z');
  return {
    clock: () => now,
    goTo: (iso: string) => {
      now = new Date(iso);
    },
  };
}

async function onboarded() {
  const time = movableClock();
  const flow = await runFlow(ONBOARDED_GYM_LXV, { clock: time.clock });
  const deps: CloseDaysDeps = { ...flow.deps, clock: time.clock };
  const closedEvents = () => flow.events.filter((e) => e.name === 'day_closed').map((e) => e.props);
  const userId = () => flow.user()?.id ?? '';
  const total = () => flow.streakStates.get(userId())?.state.counted.total;
  return { ...flow, ...time, deps, closedEvents, userId, total };
}

describe('RN-DQC-005 · T-060 · el día se cierra solo al terminar la gracia', () => {
  it('el lunes no se cierra el martes a las 11:59 y sí a las 12:00', async () => {
    const t = await onboarded();
    t.goTo('2026-10-20T16:59:00Z');
    expect(await closeDueDays(t.deps)).toBe(0);
    t.goTo('2026-10-20T17:00:00Z');
    expect(await closeDueDays(t.deps)).toBe(1);
    expect(t.closedEvents()).toEqual([
      { date: '2026-10-19', dayType: 'TRAINING', counted: false, complete: false, source: 'none' },
    ]);
    expect(t.days.find((d) => d.date === '2026-10-19')?.status).toBe('closed');
  });

  it('"La hice tal cual" dentro de la gracia hace contar el día anterior al cerrarlo (SPEC-005 §8)', async () => {
    const t = await onboarded();
    t.goTo('2026-10-20T15:00:00Z'); // martes 10:00
    await t.act({ text: '🏋️ Hoy' });
    await t.act('La hice tal cual');
    t.goTo('2026-10-20T17:00:00Z');
    await closeDueDays(t.deps);
    expect(t.closedEvents()).toEqual([
      {
        date: '2026-10-19',
        dayType: 'TRAINING',
        counted: true,
        complete: false,
        source: 'session',
      },
    ]);
    expect(t.total()).toBe(1);
  });
});

describe('FR-005-02 · T-060 · el cierre es idempotente', () => {
  it('cerrar dos veces no cambia el total ni repite el evento', async () => {
    const t = await onboarded();
    const userId = t.user()?.id ?? '';
    await t.deps.days.addSource(userId, '2026-10-19', 'TRAINING', 'session:s1');
    t.goTo('2026-10-20T17:00:00Z');
    expect(await closeDueDays(t.deps)).toBe(1);
    expect(await closeDueDays(t.deps)).toBe(0);
    expect(t.closedEvents()).toHaveLength(1);
    expect(t.total()).toBe(1);
  });

  it('un registro tardío no cambia un día ya cerrado', async () => {
    const t = await onboarded();
    const userId = t.user()?.id ?? '';
    t.goTo('2026-10-20T17:00:00Z');
    await closeDueDays(t.deps);
    await t.deps.days.addSource(userId, '2026-10-19', 'TRAINING', 'session:tarde');
    await closeDueDays(t.deps);
    expect(t.days.find((d) => d.date === '2026-10-19')?.counted).toBe(false);
    expect(t.total()).toBe(0);
  });
});

describe('RN-DQC-007 · T-060 · los días sin abrir el bot se cierran en orden sin restar', () => {
  it('el viernes a las 12:00 cierra de lunes a jueves con el tipo del plan', async () => {
    const t = await onboarded();
    const userId = t.user()?.id ?? '';
    await t.deps.days.addSource(userId, '2026-10-19', 'TRAINING', 'session:s1');
    t.goTo('2026-10-23T17:00:00Z');
    expect(await closeDueDays(t.deps)).toBe(4);
    expect(t.closedEvents().map((e) => [e['date'], e['dayType'], e['counted']])).toEqual([
      ['2026-10-19', 'TRAINING', true],
      ['2026-10-20', 'REST', false],
      ['2026-10-21', 'TRAINING', false],
      ['2026-10-22', 'REST', false],
    ]);
    expect(t.streakStates.get(userId)?.state.counted).toEqual({
      total: 1,
      lastClosedDate: '2026-10-22',
    });
  });

  it('cerrar días pasados no guarda planes ni emite plan_generated', async () => {
    const t = await onboarded();
    const before = t.weeks.length;
    t.goTo('2026-11-03T17:00:00Z'); // dos semanas después
    await closeDueDays(t.deps);
    expect(t.weeks.length).toBe(before);
    expect(t.closedEvents().at(-1)?.['date']).toBe('2026-11-02');
  });

  it('RN-DQC-003 · un día de descanso con la mitad de comida cierra contando por la comida', async () => {
    const t = await onboarded();
    const userId = t.user()?.id ?? '';
    await t.deps.days.addSource(userId, '2026-10-20', 'REST', 'nutrition_half');
    t.goTo('2026-10-21T17:00:00Z');
    await closeDueDays(t.deps);
    expect(t.closedEvents().at(-1)).toEqual({
      date: '2026-10-20',
      dayType: 'REST',
      counted: true,
      complete: false,
      source: 'nutrition',
    });
  });
});

describe('T-060 · solo se cierran los días de usuarios activos con el onboarding hecho', () => {
  it('un usuario en pausa no se cierra', async () => {
    const t = await onboarded();
    for (const [key, user] of t.users) t.users.set(key, { ...user, status: 'paused' });
    t.goTo('2026-10-21T17:00:00Z');
    expect(await closeDueDays(t.deps)).toBe(0);
  });

  it('sin onboarding terminado no hay nada que cerrar', async () => {
    const time = movableClock();
    const flow = await runFlow([], { clock: time.clock });
    time.goTo('2026-10-21T17:00:00Z');
    expect(await closeDueDays({ ...flow.deps, clock: time.clock })).toBe(0);
  });
});
