import { SESSION_NAMES, WEEKDAY_NAMES, renderTemplate } from '@gymbro/content';
import { WEEK_DAYS, operationalDate, weekdayOf, type LocalDate } from '@gymbro/domain';
import type { Reply } from '../onboarding/replies.js';
import type { UserRecord } from '../ports/repositories.js';
import { currentWeek, type PlanDeps } from './weekly-plan.js';

/** `/plan` (HU-002-1 escenario 2): los 7 días con su tipo y el nombre de cada sesión. */

/** "Lunes", "Martes"… para el inicio de una línea. */
export function dayLabel(date: LocalDate): string {
  const name = WEEKDAY_NAMES[WEEK_DAYS.indexOf(weekdayOf(date))] ?? date;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export async function planView(user: UserRecord, deps: PlanDeps): Promise<Reply[]> {
  const week = user.onboarding.completedAt ? await currentWeek(user, deps) : null;
  if (!week) return [{ text: renderTemplate('PN-04'), buttons: [] }];
  const today = operationalDate(deps.clock(), user.timezone);
  const lines = week.days.map((day) => {
    const line = day.session
      ? renderTemplate('PN-02', {
          dia: dayLabel(day.date),
          sesion: SESSION_NAMES[day.session.template],
          minutos: Math.round(day.session.versions.GYM.estimatedMinutes),
        })
      : renderTemplate('PN-03', { dia: dayLabel(day.date) });
    return `\n${day.date === today ? '👉 ' : ''}${line}`;
  });
  await deps.events.emit('plan_viewed', { userId: user.id, timezone: user.timezone });
  return [{ text: renderTemplate('PN-01', { lineas: lines.join('') }), buttons: [] }];
}
