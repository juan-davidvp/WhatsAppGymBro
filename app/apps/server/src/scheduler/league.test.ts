import { describe, expect, it } from 'vitest';
import type { WeekRecord } from '../ports/repositories.js';
import { runFlow, ONBOARDED_GYM_LXV } from '../testing/onboarding.js';
import { closeDueDays, type CloseDaysDeps } from './close-days.js';

/**
 * T-064 · liga personal (HU-005-8 escenario 1, RN-GAM-009). Onboarding el lunes
 * 2026-10-19 (plan L-X-V); la semana del 19 al 25 se cierra el lunes 26 a las 12:00.
 */

const EARLIER_WEEKS = ['2026-10-05', '2026-10-12'];

async function setup(earlierCounted: readonly number[]) {
  let now = new Date('2026-10-19T15:00:00Z');
  const clock = () => now;
  const flow = await runFlow(ONBOARDED_GYM_LXV, { clock });
  const userId = flow.user()?.id ?? '';
  earlierCounted.forEach((countedDays, i) => {
    const week: WeekRecord = {
      weekStart: EARLIER_WEEKS[i] ?? '2026-09-28',
      planned: 3,
      completed: 2,
      commitment: 2,
      fulfilled: true,
      countedDays,
      nutritionHalfDays: 0,
    };
    flow.weekRecords.push({ ...week, userId });
  });
  const deps: CloseDaysDeps = { ...flow.deps, clock };
  /** Hace contar esos días de la semana del 19 (sesión en entreno, movilidad en descanso). */
  const countDays = async (dates: readonly string[]) => {
    for (const date of dates) {
      const rest = date === '2026-10-20' || date === '2026-10-22';
      await deps.days.addSource(
        userId,
        date,
        rest ? 'REST' : 'TRAINING',
        rest ? 'mobility' : `session:${date}`,
      );
    }
  };
  const closeWeek = async () => {
    now = new Date('2026-10-26T17:00:00Z');
    await closeDueDays(deps);
  };
  return { ...flow, userId, countDays, closeWeek };
}

describe('RN-GAM-009 · T-064 · liga personal: solo contra uno mismo', () => {
  it('una semana mejor que todas las anteriores se reconoce (RE-03) y guarda "Mejor semana"', async () => {
    const t = await setup([2, 3]);
    await t.countDays(['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22']);
    await t.closeWeek();
    expect(t.achievements.map((a) => a.code)).toContain('BEST_WEEK');
    expect(t.notices).toContainEqual(
      expect.objectContaining({ templateId: 'RE-03', variables: { dqc: 4 } }),
    );
  });

  it('una nueva mejor semana después de la primera también se reconoce, sin repetir el logro', async () => {
    const t = await setup([2, 3]);
    t.achievements.push({
      userId: t.userId,
      code: 'BEST_WEEK',
      at: new Date('2026-10-12T17:00:00Z'),
      value: 3,
      context: '2026-10-12',
    });
    await t.countDays(['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22']);
    await t.closeWeek();
    expect(t.achievements.filter((a) => a.code === 'BEST_WEEK')).toHaveLength(1);
    expect(t.notices).toContainEqual(
      expect.objectContaining({ templateId: 'RE-03', variables: { dqc: 4 } }),
    );
  });

  it('si no supera su mejor semana, no hay reconocimiento', async () => {
    const t = await setup([5, 3]);
    await t.countDays(['2026-10-19', '2026-10-21']);
    await t.closeWeek();
    expect(t.notices.map((n) => n.templateId)).not.toContain('RE-03');
    expect(t.achievements.map((a) => a.code)).not.toContain('BEST_WEEK');
  });

  it('la primera semana no tiene con qué compararse: no hay "mejor semana"', async () => {
    const t = await setup([]);
    await t.countDays(['2026-10-19', '2026-10-21']);
    await t.closeWeek();
    expect(t.notices.map((n) => n.templateId)).not.toContain('RE-03');
  });
});
