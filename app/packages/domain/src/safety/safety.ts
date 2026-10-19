import { PARAMETERS } from '../config/parameters.js';
import { operationalDate } from '../day/day.js';
import type { GoalType } from '../goals/goals.js';
import type { LocalDate } from '../time/zoned.js';
import { detectRiskSignal, type AlertCatalogEntry } from './risk-signal.js';

/** Seguridad: edad, tamizajes, límites duros, rutas de cuidado, dolor, sobreuso, imágenes e IA (RN-SEG-001 a 010). */

/** RN-SEG-001: solo mayores de edad (respuesta a ON-03); sin respuesta, tampoco. */
export function canCreateProfile(answer: { readonly declaredAdult: boolean | null }): boolean {
  return answer.declaredAdult === true;
}

/** Resultado del PAR-Q+ que cuenta el usuario (el formulario se responde fuera del bot). */
export type PreActivityReport = 'all_no' | 'some_yes' | 'not_done';

/**
 * RN-SEG-002 (`[VALIDAR-PROFESIONAL]`, tamizajes §1): con algún SÍ en el PAR-Q+,
 * o sin haberlo hecho, se recomienda consulta médica (solo con algún SÍ) y el plan
 * arranca con intensidad baja hasta que el usuario confirme que tiene autorización.
 * `result` es lo que se guarda: `clear`, `flag` o nada si no lo hizo.
 */
export function preActivityScreeningOutcome(input: {
  readonly report: PreActivityReport;
  readonly authorizationConfirmed: boolean;
}): {
  result: 'clear' | 'flag' | null;
  recommendMedicalConsult: boolean;
  planIntensity: 'low' | 'normal';
} {
  const { report, authorizationConfirmed } = input;
  const result = report === 'all_no' ? 'clear' : report === 'some_yes' ? 'flag' : null;
  return {
    result,
    recommendMedicalConsult: report === 'some_yes',
    planIntensity: report !== 'all_no' && !authorizationConfirmed ? 'low' : 'normal',
  };
}

/** RN-SEG-003 (`[VALIDAR-PROFESIONAL]`, tamizajes §2): SCOFF positivo con P-082 o más "sí". */
export function isScoffPositive(yesAnswers: number): boolean {
  if (!Number.isInteger(yesAnswers) || yesAnswers < 0) {
    throw new Error('RN-SEG-003: número de respuestas "sí" inválido');
  }
  return yesAnswers >= PARAMETERS.safety.scoffPositiveMinYes;
}

const ALL_GOAL_TYPES: readonly GoalType[] = [
  'gain_muscle',
  'lose_fat',
  'gain_strength',
  'recomposition',
  'consistency',
  'maintain',
];

/**
 * RN-SEG-003 (`[VALIDAR-PROFESIONAL]`): tamizaje de relación con la comida y el
 * cuerpo positivo → modo sin números, recursos profesionales y sin objetivos de
 * pérdida de peso.
 */
export function foodBodyScreeningOutcome(positive: boolean): {
  numberFreeMode: boolean;
  showProfessionalResources: boolean;
  allowedGoalTypes: readonly GoalType[];
} {
  return {
    numberFreeMode: positive,
    showProfessionalResources: positive,
    allowedGoalTypes: positive ? ALL_GOAL_TYPES.filter((t) => t !== 'lose_fat') : ALL_GOAL_TYPES,
  };
}

/**
 * RN-SEG-004: parámetros duros (columna "Duro: Sí" de parametros.md). El usuario
 * no puede cambiarlos; `safety.test.ts` comprueba que la lista coincide con la bóveda.
 */
export const HARD_PARAMETER_CODES: readonly string[] = [
  'goal.horizonWeeksMin',
  'goal.horizonWeeksMax',
  'goal.maxWeeklyLossPct',
  'goal.maxWeeklyGainPct',
  'goal.minTargetBmi',
  'goal.movingAverageDays',
  'plan.minRestDaysPerWeek',
  'plan.noviceMaxConsecutiveDays',
  'day.cutoffTime',
  'day.loggingGraceUntil',
  'streak.freezeEveryCountedDays',
  'streak.maxFreezes',
  'streak.repairWindowHours',
  'streak.repairCooldownDays',
  'xp.table',
  'xp.dailyCap',
  'levels.thresholds',
  'challenge66.days',
  'week.startDay',
  'messages.budget',
  'messages.minGapHours',
  'messages.backoffIgnoredCount',
  'messages.backoffDays',
  'messages.comebackAfterPlannedDays',
  'messages.inactivityPauseDays',
  'messages.maxReactivations',
  'messages.templateCooldownDays',
  'metrics.actionWindowHours',
  'ingestion.duplicateWindowMinutes',
  'safety.painSessionsToRefer',
  'safety.maxSessionsPerDay',
  'safety.weeksTrainingAllRestDays',
  'data.deletionMaxHours',
  'ai.maxPhotoEstimatesPerDay',
  'safety.veryLowCalorieDailyMax',
  'safety.scoffPositiveMinYes',
];

/** RN-SEG-004: falla si se intenta que el usuario configure un parámetro duro. */
export function assertUserConfigurable(code: string): void {
  if (HARD_PARAMETER_CODES.includes(code)) {
    throw new Error(`RN-SEG-004: ${code} es un límite de seguridad y no es configurable`);
  }
}

export type FreeTextRoute<C extends string> =
  | { readonly route: 'care'; readonly category: C; readonly pauseGameMechanicsToday: true }
  | { readonly route: 'domain' };

/**
 * RN-SEG-007 y RN-SEG-005: todo texto libre pasa primero por el detector; si hay
 * señal, la ruta es la respuesta de cuidado de su categoría (también ante
 * sustancias y suplementos) y se pausan las mecánicas de juego ese día.
 */
export function routeFreeText<C extends string>(
  text: string,
  catalog: readonly AlertCatalogEntry<C>[],
): FreeTextRoute<C> {
  const signal = detectRiskSignal(text, catalog);
  return signal
    ? { route: 'care', category: signal.category, pauseGameMechanicsToday: true }
    : { route: 'domain' };
}

/**
 * RN-SEG-006 (`[VALIDAR-PROFESIONAL]`): al marcar dolor en un ejercicio se detiene
 * su progresión y se ofrece una variante; si el dolor se repite en P-062 sesiones,
 * se recomienda consulta profesional.
 */
export function painOutcome(sessionsWithPain: readonly string[]): {
  stopProgression: true;
  offerVariant: true;
  recommendProfessional: boolean;
} {
  return {
    stopProgression: true,
    offerVariant: true,
    recommendProfessional: new Set(sessionsWithPain).size >= PARAMETERS.safety.painSessionsToRefer,
  };
}

/**
 * RN-SEG-008 (`[VALIDAR-PROFESIONAL]`): sobreuso si hay más de P-063 sesiones en un
 * día o si en las últimas P-064 semanas se entrenó en todos los días de descanso.
 */
export function overuseSignal(input: {
  readonly sessionsToday: number;
  readonly recentWeeks: readonly {
    readonly restDaysPlanned: number;
    readonly restDaysTrained: number;
  }[];
}): boolean {
  if (input.sessionsToday > PARAMETERS.safety.maxSessionsPerDay) return true;
  const weeks = PARAMETERS.safety.weeksTrainingAllRestDays;
  const last = input.recentWeeks.slice(-weeks);
  return (
    last.length === weeks &&
    last.every((w) => w.restDaysPlanned > 0 && w.restDaysTrained >= w.restDaysPlanned)
  );
}

/**
 * RN-SEG-009 y RN-DAT-004: solo se aceptan fotos de comida, y no se guardan;
 * nunca se piden ni se aceptan fotos del cuerpo.
 */
export function imagePolicy(purpose: 'meal' | 'body' | 'other'): { accept: boolean; store: false } {
  return { accept: purpose === 'meal', store: false };
}

export interface PortionEstimate {
  readonly components: readonly string[];
  readonly portions: Partial<Readonly<Record<'PALM' | 'CUPPED_HAND' | 'FIST' | 'THUMB', number>>>;
  readonly confidence: number;
}

const PORTION_KEYS = new Set(['PALM', 'CUPPED_HAND', 'FIST', 'THUMB']);
const ESTIMATE_KEYS = new Set(['components', 'portions', 'confidence']);

/**
 * RN-SEG-010: la IA solo devuelve estructura validada (componentes, porciones,
 * confianza). Cualquier campo de más (por ejemplo, un consejo en texto) o valor
 * fuera de rango descarta la respuesta: null.
 */
export function validatePortionEstimate(raw: unknown): PortionEstimate | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  if (!Object.keys(record).every((key) => ESTIMATE_KEYS.has(key))) return null;
  const { components, portions, confidence } = record;
  const componentsOk =
    Array.isArray(components) && components.every((c) => typeof c === 'string' && c.length > 0);
  const portionsOk =
    portions !== null &&
    typeof portions === 'object' &&
    !Array.isArray(portions) &&
    Object.entries(portions as Record<string, unknown>).every(
      ([key, value]) =>
        PORTION_KEYS.has(key) && typeof value === 'number' && value >= 0 && Number.isFinite(value),
    );
  const confidenceOk = typeof confidence === 'number' && confidence >= 0 && confidence <= 1;
  if (!componentsOk || !portionsOk || !confidenceOk) return null;
  return raw as PortionEstimate;
}

/**
 * RN-SEG-007: las mecánicas de juego (rachas, XP, logros, retos) se pausan el día
 * operativo en que hubo una señal de riesgo. El día se calcula con la zona del
 * usuario y el corte P-029 (RN-DQC-001), igual que el día que cuenta.
 */
export function isGameMechanicsPausedOn(
  date: LocalDate,
  riskSignalInstants: readonly Date[],
  timeZone: string,
): boolean {
  return riskSignalInstants.some((at) => operationalDate(at, timeZone) === date);
}
