import { PARAMETERS } from '../config/parameters.js';
import { loggingGraceEnd } from '../day/day.js';
import { addDays, daysBetween, type LocalDate } from '../time/zoned.js';

/** Racha, comodines y reparación (RN-GAM-001 a RN-GAM-003). Funciones puras. */

export interface StreakDay {
  readonly date: LocalDate;
  readonly counted: boolean;
  /** Instante del cierre del día (fin de la gracia, RN-DQC-005). */
  readonly closedAt: Date;
}

export interface StreakRepairOffer {
  /** Fin del plazo para reparar (ISO, UTC). */
  readonly offeredUntil: string;
  /** Racha que se recupera si se completa la misión de regreso. */
  readonly restoreTo: number;
}

export interface StreakState {
  /** RN-GAM-001: días que cuentan consecutivos hasta el último día cerrado. */
  readonly current: number;
  /** Días que cuentan seguidos desde el último día que no contó (para ganar comodines). */
  readonly countedRun: number;
  /** RN-GAM-002: comodines disponibles (0…P-034). */
  readonly freezes: number;
  readonly repair: StreakRepairOffer | null;
  readonly lastRepairDate: LocalDate | null;
  readonly lastClosedDate: LocalDate | null;
}

/** Nombres de los eventos de medición de SPEC-005 §7. */
export type StreakEvent =
  | 'streak_extended'
  | 'freeze_earned'
  | 'freeze_used'
  | 'streak_reset'
  | 'streak_repair_offered'
  | 'streak_repaired';

export function initialStreakState(): StreakState {
  return {
    current: 0,
    countedRun: 0,
    freezes: 0,
    repair: null,
    lastRepairDate: null,
    lastClosedDate: null,
  };
}

const HOUR_MS = 3_600_000;

/** RN-GAM-003: como máximo una reparación cada P-036 días. */
function repairAllowed(state: StreakState, date: LocalDate): boolean {
  return (
    state.lastRepairDate === null ||
    daysBetween(state.lastRepairDate, date) >= PARAMETERS.streak.repairCooldownDays
  );
}

/**
 * RN-GAM-001 a RN-GAM-003: cierra un día en la racha. Idempotente: un día ya
 * cerrado (o anterior) no cambia nada.
 */
export function closeStreakDay(
  state: StreakState,
  day: StreakDay,
): { state: StreakState; events: StreakEvent[] } {
  if (state.lastClosedDate !== null && day.date <= state.lastClosedDate) {
    return { state, events: [] };
  }

  if (day.counted) {
    const countedRun = state.countedRun + 1;
    const earns =
      countedRun % PARAMETERS.streak.freezeEveryCountedDays === 0 &&
      state.freezes < PARAMETERS.streak.maxFreezes;
    return {
      state: {
        ...state,
        current: state.current + 1,
        countedRun,
        freezes: earns ? state.freezes + 1 : state.freezes,
        lastClosedDate: day.date,
      },
      events: earns ? ['streak_extended', 'freeze_earned'] : ['streak_extended'],
    };
  }

  // RN-GAM-002: el comodín se aplica solo; la racha se mantiene, pero el día no cuenta.
  if (state.freezes > 0) {
    return {
      state: { ...state, freezes: state.freezes - 1, countedRun: 0, lastClosedDate: day.date },
      events: ['freeze_used'],
    };
  }

  // RN-GAM-003: sin comodín la racha vuelve a 0 y, si se puede, se ofrece reparar.
  const offer =
    state.current > 0 && repairAllowed(state, day.date)
      ? {
          offeredUntil: new Date(
            day.closedAt.getTime() + PARAMETERS.streak.repairWindowHours * HOUR_MS,
          ).toISOString(),
          restoreTo: state.current,
        }
      : null;
  return {
    state: { ...state, current: 0, countedRun: 0, repair: offer, lastClosedDate: day.date },
    events: offer ? ['streak_reset', 'streak_repair_offered'] : ['streak_reset'],
  };
}

export interface RepairAttempt {
  readonly date: LocalDate;
  readonly at: Date;
  /** Misión de regreso: sesión C (exprés) completada… */
  readonly expressSessionDone: boolean;
  /** …y mitad de comida cumplida. */
  readonly nutritionHalf: boolean;
}

/** RN-GAM-003: repara la racha si la misión de regreso se cumple dentro del plazo. */
export function repairStreak(
  state: StreakState,
  attempt: RepairAttempt,
): { state: StreakState; repaired: boolean } {
  const offer = state.repair;
  const inTime = offer !== null && attempt.at.getTime() <= Date.parse(offer.offeredUntil);
  if (!offer || !inTime || !attempt.expressSessionDone || !attempt.nutritionHalf) {
    return { state, repaired: false };
  }
  return {
    state: {
      ...state,
      current: offer.restoreTo + state.current,
      repair: null,
      lastRepairDate: attempt.date,
    },
    repaired: true,
  };
}

/**
 * RN-GAM-001 y RN-DQC-007, vista en vivo: total de días que cuentan y racha
 * con lo registrado hasta hoy, antes de que el cierre programado (M6) guarde el
 * estado. Repite el cierre de cada día pasado (un día sin registro no cuenta,
 * con su comodín si lo hay) y suma hoy solo si ya cuenta: hoy sigue abierto.
 */
export function liveCountedDays(
  history: readonly { readonly date: LocalDate; readonly counted: boolean }[],
  today: LocalDate,
  timeZone: string,
): { total: number; current: number } {
  const byDate = new Map(history.map((d) => [d.date, d.counted]));
  const past = history
    .map((d) => d.date)
    .filter((date) => date < today)
    .sort();
  let state = initialStreakState();
  for (let date = past[0]; date !== undefined && date < today; date = addDays(date, 1)) {
    state = closeStreakDay(state, {
      date,
      counted: byDate.get(date) ?? false,
      closedAt: loggingGraceEnd(date, timeZone),
    }).state;
  }
  const countsToday = byDate.get(today) ?? false;
  const total = history.filter((d) => d.counted && d.date <= today).length;
  return { total, current: state.current + (countsToday ? 1 : 0) };
}
