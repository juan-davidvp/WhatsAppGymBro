import {
  closeDay,
  initialCountedDaysState,
  type CountedDaysState,
  type DayType,
} from '../day/day.js';
import type { LocalDate } from '../time/zoned.js';
import {
  closeStreakDay,
  initialStreakState,
  type StreakEvent,
  type StreakState,
} from './streak.js';
import { updateComeback, type ComebackState } from './xp.js';

/**
 * Cierre de un día para el juego (T-061): total acumulado (RN-DQC-007), racha y
 * comodines (RN-GAM-001 a 003) y bonificación de regreso (RN-GAM-013), en un
 * solo paso puro. El caso de uso guarda el estado y ejecuta los efectos.
 */

export interface PlayerState {
  readonly counted: CountedDaysState;
  readonly streak: StreakState;
  readonly comeback: ComebackState;
  /** RN-GAM-004: semanas cumplidas seguidas (`nextWeekStreak`, al cerrar el domingo). */
  readonly weekStreak: number;
}

export function initialPlayerState(): PlayerState {
  return {
    counted: initialCountedDaysState(),
    streak: initialStreakState(),
    comeback: { pending: false },
    weekStreak: 0,
  };
}

export interface PlayerDay {
  readonly date: LocalDate;
  readonly type: DayType;
  readonly counted: boolean;
  /** Fin de la gracia del día (RN-DQC-005). */
  readonly closedAt: Date;
  /** RN-SEG-007: hubo una señal de riesgo ese día (FR-005-07). */
  readonly riskPaused: boolean;
}

export interface PlayerDayResult {
  readonly state: PlayerState;
  /** false si el día ya estaba cerrado (FR-005-02: cerrar dos veces no cambia nada). */
  readonly applied: boolean;
  readonly events: readonly StreakEvent[];
  /** RN-GAM-013: este día otorga la bonificación de regreso. */
  readonly comebackBonus: boolean;
}

/**
 * RN-DQC-007, RN-GAM-001 a 003, RN-GAM-013 y FR-005-07: cierra `day` sobre
 * `state`. Con señal de riesgo, el día suma al total y la racha puede subir,
 * pero no se rompe, no hay comodín ganado ni gastado y no hay bonificación;
 * si el día cuenta, el regreso queda saldado sin premio.
 */
export function closePlayerDay(state: PlayerState, day: PlayerDay): PlayerDayResult {
  const last = state.counted.lastClosedDate;
  if (last !== null && day.date <= last) {
    return { state, applied: false, events: [], comebackBonus: false };
  }
  const streak = closeStreakDay(state.streak, {
    date: day.date,
    counted: day.counted,
    closedAt: day.closedAt,
    riskPaused: day.riskPaused,
  });
  const comeback = day.riskPaused
    ? { state: day.counted ? { pending: false } : state.comeback, bonus: false }
    : updateComeback(state.comeback, { type: day.type, counted: day.counted });
  return {
    state: {
      ...state,
      counted: closeDay(state.counted, { date: day.date, counted: day.counted }),
      streak: streak.state,
      comeback: comeback.state,
    },
    applied: true,
    events: streak.events,
    comebackBonus: comeback.bonus,
  };
}
