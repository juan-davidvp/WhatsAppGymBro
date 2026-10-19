/**
 * @gymbro/domain — reglas de negocio puras (constitución VII y X).
 * Sin E/S: ni base de datos, ni red, ni Telegram, ni reloj del sistema.
 */
export { PARAMETERS, type Parameters } from './config/parameters.js';
export {
  detectRiskSignal,
  normalizeForMatching,
  type AlertCatalogEntry,
  type RiskSignal,
} from './safety/risk-signal.js';
export * from './time/zoned.js';
export {
  closeDay,
  evaluateDay,
  initialCountedDaysState,
  isDayClosable,
  loggingGraceEnd,
  operationalDate,
  operationalDayStart,
  type ClosedDay,
  type CountedDaysState,
  type DayInputs,
  type DayStatus,
  type DayType,
} from './day/day.js';
export * from './gamification/streak.js';
export * from './gamification/xp.js';
export * from './gamification/weekly.js';
export * from './goals/goals.js';
export * from './goals/maintenance.js';
