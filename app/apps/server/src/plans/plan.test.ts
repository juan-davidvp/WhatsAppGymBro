import { renderTemplate } from '@gymbro/content';
import { PARAMETERS, addDays } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { ONBOARDED_GYM_LXV, runFlow } from '../testing/onboarding.js';
import { ensureWeek } from './weekly-plan.js';

const MONDAY = '2026-10-19';

describe('HU-002-1 · RN-PLAN-001 · T-040 · plan guardado al terminar el onboarding', () => {
  it('guarda esta semana y la siguiente, con sesiones solo en días disponibles y descanso mínimo', async () => {
    const flow = await runFlow(ONBOARDED_GYM_LXV);
    expect(flow.weeks.map((w) => w.weekStart)).toEqual([MONDAY, addDays(MONDAY, 7)]);
    for (const week of flow.weeks) {
      const training = week.days.filter((d) => d.session !== null);
      expect(training.map((d) => d.date)).toEqual(
        week.days.filter((_, i) => [0, 2, 4].includes(i)).map((d) => d.date),
      );
      expect(week.days.length - training.length).toBeGreaterThanOrEqual(
        PARAMETERS.plan.minRestDaysPerWeek,
      );
    }
    expect(flow.events.filter((e) => e.name === 'plan_generated')).toHaveLength(2);
  });

  it('RN-PLAN-007 · la semana siguiente continúa la rotación de sesiones', async () => {
    const flow = await runFlow(ONBOARDED_GYM_LXV);
    const [first, second] = flow.weeks;
    const firstTemplate = second?.days.find((d) => d.session)?.session?.template;
    const lastThisWeek = first?.days.filter((d) => d.session).at(-1)?.session?.template;
    expect(firstTemplate).toBeDefined();
    expect(firstTemplate).not.toBe(lastThisWeek);
  });

  it('pedir la misma semana dos veces no la duplica ni cambia sus sesiones', async () => {
    const flow = await runFlow(ONBOARDED_GYM_LXV);
    const user = flow.user();
    if (!user) throw new Error('sin usuario');
    const deps = { ...flow.deps, clock: () => new Date('2026-10-19T15:00:00Z') };
    const again = await ensureWeek(user, MONDAY, deps);
    expect(flow.weeks).toHaveLength(2);
    expect(again).toBe(flow.weeks[0]);
  });

  it('FR-002-04 · un plan nuevo precarga la última carga registrada de cada ejercicio', async () => {
    const flow = await runFlow(ONBOARDED_GYM_LXV);
    const user = flow.user();
    if (!user) throw new Error('sin usuario');
    const code = flow.weeks[0]?.days.find((d) => d.session)?.session?.versions.GYM.exercises[0]
      ?.exerciseCode;
    await flow.deps.setEntries.record({
      userId: user.id,
      sessionId: 's1',
      exerciseCode: code ?? '',
      setIndex: 0,
      reps: 8,
      loadKg: 42.5,
      edited: false,
      confirmedAt: new Date('2026-10-19T12:00:00Z'),
    });
    const deps = { ...flow.deps, clock: () => new Date('2026-10-19T15:00:00Z') };
    const week = await ensureWeek(user, addDays(MONDAY, 14), deps);
    const loads = (week?.days ?? [])
      .flatMap((d) => d.session?.versions.GYM.exercises ?? [])
      .filter((e) => e.exerciseCode === code)
      .map((e) => e.loadKg);
    expect(loads.length).toBeGreaterThan(0);
    expect(new Set(loads)).toEqual(new Set([42.5]));
  });
});

describe('HU-002-1 escenario 2 · T-040 · /plan', () => {
  it('muestra los 7 días con el tipo de día, el nombre de la sesión y el hoy marcado', async () => {
    const flow = await runFlow([...ONBOARDED_GYM_LXV, { text: '/plan' }]);
    const text = flow.last()?.text ?? '';
    const lines = text.split('\n');
    expect(lines[0]).toBe(renderTemplate('PN-01', { lineas: '' }));
    expect(lines.slice(1)).toHaveLength(7);
    expect(lines[1]).toMatch(/^👉 Lunes: Cuerpo completo A · \d+ min$/);
    expect(lines[2]).toBe(renderTemplate('PN-03', { dia: 'Martes' }));
    expect(flow.events.at(-1)?.name).toBe('plan_viewed');
  });

  it('[Ver plan] del resumen abre la misma vista', async () => {
    const flow = await runFlow([...ONBOARDED_GYM_LXV, 'Ver plan']);
    expect(flow.last()?.text.startsWith(renderTemplate('PN-01', { lineas: '' }))).toBe(true);
  });

  it('sin onboarding terminado, /plan pide terminar el inicio', async () => {
    const flow = await runFlow(['Acepto', { text: '/plan' }]);
    expect(flow.last()?.text).toBe(renderTemplate('PN-04'));
  });
});
