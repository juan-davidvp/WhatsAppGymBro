import {
  PARAMETERS,
  evaluateDay,
  liveCountedDays,
  type DayStatus,
  type DayType,
  type LocalDate,
} from '@gymbro/domain';
import type { DaysRepository, UserRecord } from '../ports/repositories.js';

/**
 * Registro del día mientras está abierto (lo mínimo de M6 que adelanta M4).
 * Cada actividad se guarda como fuente del día (`session:<id>` completada,
 * `mobility`), el dominio evalúa el día (RN-DQC-002/003) y se calculan el total
 * y la racha en vivo (RN-GAM-001, RN-DQC-007). El cierre programado es de T-060.
 */

export const MOBILITY_SOURCE = 'mobility';
export const sessionSource = (sessionId: string) => `session:${sessionId}`;

export interface DayResult {
  readonly status: DayStatus;
  /** N.º del día que cuenta (total con hoy) y racha en vivo. */
  readonly total: number;
  readonly streak: number;
}

/** RN-DQC-002 y RN-DQC-003: entradas del día a partir de sus fuentes. */
export function dayInputsFrom(type: DayType, sources: readonly string[]) {
  return {
    type,
    sessionsCompleted: sources.filter((s) => s.startsWith('session:')).length,
    importedActivityMinutes: [],
    // RN-NUT-003 llega con M5.
    nutritionHalf: false,
    importedSteps: 0,
    mobilityMinutes: sources.includes(MOBILITY_SOURCE) ? PARAMETERS.day.restMobilityMinutes : 0,
  };
}

/** Añade una actividad al día, lo evalúa y guarda su estado. */
export async function recordDayActivity(
  user: UserRecord,
  date: LocalDate,
  type: DayType,
  source: string,
  deps: { days: DaysRepository },
): Promise<DayResult> {
  const sources = await deps.days.addSource(user.id, date, type, source);
  const status = evaluateDay(dayInputsFrom(type, sources));
  await deps.days.saveStatus(user.id, date, type, status);
  const live = liveCountedDays(await deps.days.history(user.id), date, user.timezone);
  return { status, total: live.total, streak: live.current };
}

/** ¿El día ya cuenta? (para no ofrecer otra vez lo que ya se hizo). */
export async function dayCounts(
  user: UserRecord,
  date: LocalDate,
  deps: { days: DaysRepository },
): Promise<boolean> {
  return (await deps.days.history(user.id)).some((d) => d.date === date && d.counted);
}
