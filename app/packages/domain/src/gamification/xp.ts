import { PARAMETERS } from '../config/parameters.js';
import type { DayType } from '../day/day.js';
import type { LocalDate } from '../time/zoned.js';

/** XP, niveles y bonificación de regreso (RN-GAM-005 a 007, 013 y 014). */

export type SessionVariant = 'GYM' | 'HOME' | 'EXPRESS';

/** RN-GAM-014: solo eventos de constancia; ninguno por peso, déficit ni comparación con otros. */
export const XP_EVENT_TYPES = [
  'SESSION',
  'REST_MISSION',
  'NUTRITION_HALF',
  'COMPLETE_DAY_BONUS',
  'PERSONAL_RECORD',
  'COMEBACK',
  'WEEKLY_QUEST',
  'FULFILLED_WEEK',
] as const;
export type XpEventType = (typeof XP_EVENT_TYPES)[number];

export type XpEvent =
  | { readonly type: 'SESSION'; readonly variant: SessionVariant }
  | { readonly type: Exclude<XpEventType, 'SESSION'> };

/** FR-005-03: libro de movimientos solo de suma. */
export interface XpLedgerEntry {
  readonly date: LocalDate;
  readonly event: XpEventType;
  readonly variant?: SessionVariant;
  readonly amount: number;
}

/** RN-GAM-005: XP de la tabla P-038 para un evento. */
function tableAmount(event: XpEvent): number {
  const table = PARAMETERS.xp.table;
  switch (event.type) {
    case 'SESSION':
      return table.session[event.variant];
    case 'REST_MISSION':
      return table.restMission;
    case 'NUTRITION_HALF':
      return table.nutritionHalf;
    case 'COMPLETE_DAY_BONUS':
      return table.completeDayBonus;
    case 'PERSONAL_RECORD':
      return table.personalRecord;
    case 'COMEBACK':
      return table.comebackBonus;
    case 'WEEKLY_QUEST':
      return table.weeklyQuest;
    case 'FULFILLED_WEEK':
      return table.fulfilledWeek;
  }
}

/**
 * RN-GAM-005 y RN-DQC-006: movimiento de XP para un evento, recortado para que el
 * día no supere P-039 (puede ser 0). FR-005-07: si las mecánicas están pausadas por
 * una señal de riesgo (RN-SEG-007), el movimiento es 0.
 */
export function awardXp(
  ledger: readonly XpLedgerEntry[],
  award: { readonly date: LocalDate; readonly event: XpEvent; readonly paused: boolean },
): XpLedgerEntry {
  const earnedToday = ledger
    .filter((entry) => entry.date === award.date)
    .reduce((sum, entry) => sum + entry.amount, 0);
  const room = Math.max(0, PARAMETERS.xp.dailyCap - earnedToday);
  const amount = award.paused ? 0 : Math.min(tableAmount(award.event), room);
  return {
    date: award.date,
    event: award.event.type,
    ...(award.event.type === 'SESSION' ? { variant: award.event.variant } : {}),
    amount,
  };
}

/** RN-GAM-006 y RN-GAM-014: total del libro; un movimiento negativo es un error, nunca se resta. */
export function totalXp(ledger: readonly XpLedgerEntry[]): number {
  return ledger.reduce((sum, entry) => {
    if (entry.amount < 0) throw new Error('RN-GAM-014: el XP nunca se resta');
    return sum + entry.amount;
  }, 0);
}

/** RN-GAM-007: nivel (1…10) para un XP acumulado según los umbrales P-040. */
export function levelForXp(xp: number): number {
  const thresholds = PARAMETERS.levels.thresholds;
  let level = 1;
  thresholds.forEach((threshold, index) => {
    if (xp >= threshold) level = index + 1;
  });
  return level;
}

export interface ComebackState {
  /** Hubo un día de entreno no cumplido y aún no llega el día que cuenta siguiente. */
  readonly pending: boolean;
}

/**
 * RN-GAM-013: al cerrar un día, indica si otorga la bonificación de regreso
 * (primer día que cuenta después de un día de entreno no cumplido).
 */
export function updateComeback(
  state: ComebackState,
  day: { readonly type: DayType; readonly counted: boolean },
): { state: ComebackState; bonus: boolean } {
  if (day.counted) return { state: { pending: false }, bonus: state.pending };
  if (day.type === 'TRAINING') return { state: { pending: true }, bonus: false };
  return { state, bonus: false };
}
