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
