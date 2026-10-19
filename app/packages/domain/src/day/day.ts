import { PARAMETERS } from '../config/parameters.js';
import {
  addDays,
  localParts,
  minutesOfDay,
  toLocalDate,
  zonedTimeToInstant,
  type LocalDate,
} from '../time/zoned.js';

export { zonedTimeToInstant } from '../time/zoned.js';

/** `DayType` del glosario (RN-DQC-001): el plan decide si el día es de entreno o de descanso. */
export type DayType = 'TRAINING' | 'REST';

/** Lo registrado en un día operativo; el caso de uso lo arma desde la base. */
export interface DayInputs {
  readonly type: DayType;
  /** Sesiones A, B o C completadas (RN-ENT-004 decide si una sesión está completa). */
  readonly sessionsCompleted: number;
  /** Duración en minutos de cada actividad importada (RN-ENT-006). */
  readonly importedActivityMinutes: readonly number[];
  /** Mitad de comida cumplida (RN-NUT-003, la calcula `nutrition/`). */
  readonly nutritionHalf: boolean;
  readonly importedSteps: number;
  /** Minutos de movilidad confirmados por el usuario. */
  readonly mobilityMinutes: number;
}

export interface DayStatus {
  readonly trainingHalf: boolean;
  readonly nutritionHalf: boolean;
  readonly activeRecovery: boolean;
  /** `isCounted` del glosario. */
  readonly counts: boolean;
  /** `isComplete` del glosario. */
  readonly complete: boolean;
}

/**
 * RN-DQC-001: fecha del día operativo de un instante. El día va de P-029 a P-029
 * del día siguiente en la zona del usuario (P-069 por defecto).
 */
export function operationalDate(
  instant: Date,
  timeZone: string = PARAMETERS.user.defaultTimezone,
): LocalDate {
  const p = localParts(instant, timeZone);
  const date = toLocalDate(p.year, p.month, p.day);
  const beforeCutoff = p.hour * 60 + p.minute < minutesOfDay(PARAMETERS.day.cutoffTime);
  return beforeCutoff ? addDays(date, -1) : date;
}

/** RN-DQC-001: instante en que empieza el día operativo `date`. */
export function operationalDayStart(date: LocalDate, timeZone: string): Date {
  return zonedTimeToInstant(date, PARAMETERS.day.cutoffTime, timeZone);
}

/** RN-DQC-002 y RN-ENT-006: sesión completada o actividad importada de al menos P-025 minutos. */
function trainingHalfMet(inputs: DayInputs): boolean {
  return (
    inputs.sessionsCompleted > 0 ||
    inputs.importedActivityMinutes.some(
      (minutes) => minutes >= PARAMETERS.training.importedActivityMinMinutes,
    )
  );
}

/** RN-DQC-003: recuperación activa = ≥ P-031 pasos o ≥ P-032 minutos de movilidad. */
function activeRecoveryMet(inputs: DayInputs): boolean {
  return (
    inputs.importedSteps >= PARAMETERS.day.restMinSteps ||
    inputs.mobilityMinutes >= PARAMETERS.day.restMobilityMinutes
  );
}

/**
 * RN-DQC-002, RN-DQC-003, RN-DQC-004 y RN-DQC-006: estado del día.
 * Es una función pura de lo registrado, así que se recalcula sin más hasta que
 * termina la gracia (RN-DQC-005).
 */
export function evaluateDay(inputs: DayInputs): DayStatus {
  const trainingHalf = trainingHalfMet(inputs);
  const nutritionHalf = inputs.nutritionHalf;
  const activeRecovery = activeRecoveryMet(inputs);

  if (inputs.type === 'TRAINING') {
    return {
      trainingHalf,
      nutritionHalf,
      activeRecovery,
      counts: trainingHalf,
      complete: trainingHalf && nutritionHalf,
    };
  }

  // Descanso: la misión de descanso o, por RN-DQC-006, entrenar igual cuenta.
  const restMission = nutritionHalf || activeRecovery;
  return {
    trainingHalf,
    nutritionHalf,
    activeRecovery,
    counts: restMission || trainingHalf,
    complete: nutritionHalf && activeRecovery,
  };
}

/** RN-DQC-005: fin de la gracia de registro del día `date` (P-030 del día siguiente). */
export function loggingGraceEnd(date: LocalDate, timeZone: string): Date {
  const { time, nextDay } = PARAMETERS.day.loggingGraceUntil;
  return zonedTimeToInstant(nextDay ? addDays(date, 1) : date, time, timeZone);
}

/** RN-DQC-005: el día solo se cierra cuando termina su gracia. */
export function isDayClosable(date: LocalDate, now: Date, timeZone: string): boolean {
  return now.getTime() >= loggingGraceEnd(date, timeZone).getTime();
}

export interface ClosedDay {
  readonly date: LocalDate;
  readonly counted: boolean;
}

/** Total acumulado de días que cuentan (`CountedDay`). */
export interface CountedDaysState {
  readonly total: number;
  readonly lastClosedDate: LocalDate | null;
}

export function initialCountedDaysState(): CountedDaysState {
  return { total: 0, lastClosedDate: null };
}

/**
 * RN-DQC-007: cerrar un día solo puede sumar. Idempotente (FR-005-02): los días se
 * cierran en orden y un cierre repetido o de una fecha ya cerrada no cambia nada.
 */
export function closeDay(state: CountedDaysState, day: ClosedDay): CountedDaysState {
  if (state.lastClosedDate !== null && day.date <= state.lastClosedDate) return state;
  return {
    total: state.total + (day.counted ? 1 : 0),
    lastClosedDate: day.date,
  };
}
