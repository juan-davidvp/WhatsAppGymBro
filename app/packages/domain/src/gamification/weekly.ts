import { PARAMETERS } from '../config/parameters.js';
import { addDays, daysBetween, weekdayOf, type LocalDate } from '../time/zoned.js';

/** Semana cumplida, misiones, liga personal, temporadas, logros y Reto 66 (RN-GAM-004, 008 a 012). */

/** RN-GAM-004: lunes (P-070) de la semana de una fecha. */
export function weekStartOf(date: LocalDate): LocalDate {
  let current = date;
  while (weekdayOf(current) !== PARAMETERS.week.startDay) current = addDays(current, -1);
  return current;
}

/** RN-GAM-004: planificadas − P-037 si son al menos `minPlannedSessions`; si no, las planificadas. */
export function weeklyCommitment(planned: number): number {
  const { tolerance, minPlannedSessions } = PARAMETERS.week.commitmentTolerance;
  return planned >= minPlannedSessions ? planned - tolerance : planned;
}

export type WeekResult =
  | { readonly evaluated: false }
  | { readonly evaluated: true; readonly commitment: number; readonly fulfilled: boolean };

/**
 * RN-GAM-004: una semana está cumplida si las sesiones completadas alcanzan el
 * compromiso. Una semana en pausa o sin sesiones planificadas no se evalúa
 * (SPEC-005 §8): ni cumplida ni rota.
 */
export function evaluateWeek(week: {
  readonly planned: number;
  readonly completed: number;
  readonly paused: boolean;
}): WeekResult {
  if (week.paused || week.planned <= 0) return { evaluated: false };
  const commitment = weeklyCommitment(week.planned);
  return { evaluated: true, commitment, fulfilled: week.completed >= commitment };
}

export type QuestKind = 'TRAINING' | 'NUTRITION' | 'CONSISTENCY';

export interface WeeklyQuest {
  readonly kind: QuestKind;
  readonly target: number;
}

export interface WeekAchieved {
  readonly sessions: number;
  readonly nutritionHalfDays: number;
  readonly countedDays: number;
}

/**
 * Mínimo alcanzable de una misión: una unidad (una sesión, un día).
 * `[inferencia]` RN-GAM-008 pide "un mínimo alcanzable" sin fijar el número.
 */
const MIN_QUEST_TARGET = 1;

/**
 * RN-GAM-008: 3 misiones (entreno, comida, constancia) con meta
 * ⌊P-041 × lo logrado la semana anterior⌋, nunca por debajo del mínimo alcanzable.
 * Sin historial (primera semana), la meta es el mínimo.
 */
export function generateWeeklyQuests(lastWeek: WeekAchieved | null): WeeklyQuest[] {
  const target = (achieved: number) =>
    Math.max(MIN_QUEST_TARGET, Math.floor(PARAMETERS.quests.difficultyFactor * achieved));
  return [
    { kind: 'TRAINING', target: target(lastWeek?.sessions ?? 0) },
    { kind: 'NUTRITION', target: target(lastWeek?.nutritionHalfDays ?? 0) },
    { kind: 'CONSISTENCY', target: target(lastWeek?.countedDays ?? 0) },
  ];
}

/**
 * RN-GAM-009: liga personal. Solo recibe datos del propio usuario: la semana
 * actual, la anterior y la mejor. No existen rankings entre usuarios.
 */
export function compareWithOwnHistory(weeks: {
  readonly current: number;
  readonly previous: number | null;
  readonly best: number;
}): { deltaVsPrevious: number | null; isNewBest: boolean } {
  return {
    deltaVsPrevious: weeks.previous === null ? null : weeks.current - weeks.previous,
    isNewBest: weeks.current > weeks.best,
  };
}

export interface Season {
  readonly index: number;
  readonly start: LocalDate;
  readonly end: LocalDate;
}

/**
 * RN-GAM-010: temporada de P-042 semanas a la que pertenece `date`, contando desde
 * `anchorMonday` (el lunes de la primera temporada del usuario).
 */
export function seasonOf(date: LocalDate, anchorMonday: LocalDate): Season {
  if (weekdayOf(anchorMonday) !== 'monday') {
    throw new Error('RN-GAM-010: las temporadas inician en lunes');
  }
  const length = PARAMETERS.season.weeks * 7;
  const index = Math.floor(daysBetween(anchorMonday, date) / length);
  const start = addDays(anchorMonday, index * length);
  return { index, start, end: addDays(start, length - 1) };
}

export interface LogbookEntry {
  /** Código del catálogo de logros (`FIRST_SESSION`, `CH66_7`…). */
  readonly code: string;
  readonly date: LocalDate;
  readonly value: string | number | null;
}

/**
 * RN-GAM-011: la bitácora solo crece; cada logro se registra una vez. No hay
 * función para quitar entradas (solo el borrado total de datos, RN-DAT-003).
 */
export function appendToLogbook(
  log: readonly LogbookEntry[],
  entry: LogbookEntry,
): readonly LogbookEntry[] {
  return log.some((existing) => existing.code === entry.code) ? log : [...log, entry];
}

/** RN-GAM-012: capítulos de P-044 alcanzados al pasar de `before` a `after` días acumulados. */
export function challengeChaptersCrossed(before: number, after: number): number[] {
  return PARAMETERS.challenge66.chapters.filter((chapter) => before < chapter && chapter <= after);
}

/** RN-GAM-012: "Hábito forjado" al llegar a P-043 días que cuentan acumulados. */
export function habitForged(before: number, after: number): boolean {
  const days = PARAMETERS.challenge66.days;
  return before < days && after >= days;
}
