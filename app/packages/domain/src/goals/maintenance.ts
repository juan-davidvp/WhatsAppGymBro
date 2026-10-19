import { PARAMETERS } from '../config/parameters.js';
import { daysBetween, type LocalDate } from '../time/zoned.js';

/** Modo mantenimiento (RN-MAN-001 a 005). */

/** `Intensity` del glosario (RN-MSJ-002). */
export type Intensity = 'LOW' | 'NORMAL' | 'HIGH';

/**
 * RN-MAN-001: tras cumplir el objetivo, el usuario elige mantener o nueva fase;
 * si no responde en P-009 días, entra en mantenimiento.
 */
export function maintenanceDecision(input: {
  readonly achievedOn: LocalDate;
  readonly today: LocalDate;
  readonly choice: 'maintain' | 'new_phase' | null;
}): 'maintenance' | 'new_phase' | 'pending' {
  if (input.choice === 'maintain') return 'maintenance';
  if (input.choice === 'new_phase') return 'new_phase';
  return daysBetween(input.achievedOn, input.today) >= PARAMETERS.maintenance.daysToChooseAfterGoal
    ? 'maintenance'
    : 'pending';
}

export interface MaintenanceBand {
  readonly lowKg: number;
  readonly highKg: number;
}

/** `MaintenanceMode` del glosario. */
export interface MaintenanceMode {
  readonly minWeeklySessions: number;
  readonly proteinTargetG: number;
  readonly band: MaintenanceBand;
}

/**
 * RN-MAN-002: P-010 sesiones semanales como mínimo, la meta de proteína se
 * conserva y la banda es ± P-011 % de la media móvil al entrar.
 */
export function enterMaintenance(input: {
  readonly entryMovingAvgKg: number;
  readonly proteinTargetG: number;
}): MaintenanceMode {
  const fraction = PARAMETERS.maintenance.bandPct / 100;
  return {
    minWeeklySessions: PARAMETERS.maintenance.minWeeklySessions,
    proteinTargetG: input.proteinTargetG,
    band: {
      lowKg: input.entryMovingAvgKg * (1 - fraction),
      highKg: input.entryMovingAvgKg * (1 + fraction),
    },
  };
}

/**
 * RN-MAN-003: true si la media móvil semanal estuvo fuera de la banda las últimas
 * P-012 semanas seguidas. Una semana sin media no cuenta como fuera.
 */
export function maintenanceOutOfBandAlert(
  weeklyMovingAverages: readonly (number | null)[],
  band: MaintenanceBand,
): boolean {
  const weeks = PARAMETERS.maintenance.weeksOutOfBandAlert;
  const recent = weeklyMovingAverages.slice(-weeks);
  return (
    recent.length === weeks &&
    recent.every((avg) => avg !== null && (avg < band.lowKg || avg > band.highKg))
  );
}

/** RN-MAN-004: en mantenimiento las temporadas son de maestría. */
export function seasonKind(inMaintenance: boolean): 'mastery' | 'standard' {
  return inMaintenance ? 'mastery' : 'standard';
}

/** RN-MAN-005: al entrar en mantenimiento la intensidad pasa a Baja, salvo que el usuario elija otra. */
export function messageIntensityOnMaintenance(chosenByUser: Intensity | null): Intensity {
  return chosenByUser ?? 'LOW';
}
