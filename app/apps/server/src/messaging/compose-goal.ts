import {
  PARAMETERS,
  addDays,
  maintenanceOutOfBandAlert,
  weekStartOf,
  weightMovingAverage,
  type LocalDate,
} from '@gymbro/domain';
import { maintenanceBand } from '../goals/goal-review.js';
import type { UserRecord } from '../ports/repositories.js';
import { dayContext, type ComposeDeps, type Composer } from './compose.js';

/**
 * RN-MAN-003 · `mantenimiento` (T-082): en mantenimiento, si la media móvil de las
 * últimas P-012 semanas cerradas quedó fuera de la zona (± P-011 %), un mensaje
 * con opciones (MA-01 a MA-03). Se evalúa los lunes; se vuelve a comprobar al enviar.
 */

const WEEK_LENGTH = 7;

/** ¿La media móvil de cada una de las últimas P-012 semanas cerradas quedó fuera de la zona? */
export async function maintenanceAlertDue(
  user: UserRecord,
  date: LocalDate,
  deps: ComposeDeps,
): Promise<boolean> {
  const goal = await deps.goals.active(user.id);
  if (goal?.type !== 'maintain' || goal.startValue === null) return false;
  const weeks = PARAMETERS.maintenance.weeksOutOfBandAlert;
  const lastSunday = addDays(weekStartOf(date), -1);
  const window = PARAMETERS.goal.movingAverageDays.days;
  const from = addDays(lastSunday, -(weeks * WEEK_LENGTH + window));
  const weights = await deps.bodyMeasurements.weightsSince(user.id, from);
  const weekly = Array.from({ length: weeks }, (_, i) =>
    weightMovingAverage(weights, addDays(lastSunday, -(weeks - 1 - i) * WEEK_LENGTH)),
  );
  return maintenanceOutOfBandAlert(weekly, maintenanceBand(goal.startValue));
}

export const maintenanceAlert: Composer = async (user, date, deps) => {
  const day = await dayContext(user, date, deps);
  if (user.settings.numberFreeMode || !(await maintenanceAlertDue(user, date, deps))) {
    return { day, options: [] };
  }
  return {
    day,
    options: [
      { templateId: 'MA-01', variables: {} },
      { templateId: 'MA-02', variables: {} },
      { templateId: 'MA-03', variables: {} },
    ],
  };
};
