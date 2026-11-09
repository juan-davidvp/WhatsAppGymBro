import { renderTemplate } from './lookup.js';
import { WEEKDAY_BUTTON_LABELS } from './onboarding.js';

/**
 * Semana en una línea (DC-03, HU-005-1): la letra de cada día seguida de su
 * marca. Símbolos de la nota de DC-03 en
 * `vault/output/sdd/contenido/plantillas-de-mensajes.md` §2 (V2 de cada-dia-cuenta).
 * Las claves son las marcas `WeekMark` del dominio.
 */
export const WEEK_LINE_SYMBOLS = {
  COMPLETE: '⭐',
  COUNTED: '✅',
  PENDING: '⬜',
  MISSED: '–',
  FUTURE: '·',
} as const;

export type WeekLineMark = keyof typeof WEEK_LINE_SYMBOLS;

/** Variables de DC-03, en orden de lunes a domingo. */
const DC03_VARIABLES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

/** DC-03 con las 7 marcas de la semana (de lunes a domingo). */
export function renderWeekLine(marks: readonly WeekLineMark[]): string {
  if (marks.length !== DC03_VARIABLES.length) {
    throw new Error('DC-03 necesita una marca por cada día de la semana');
  }
  const variables = Object.fromEntries(
    DC03_VARIABLES.map((name, i) => [
      name,
      `${WEEKDAY_BUTTON_LABELS[i] ?? name}${WEEK_LINE_SYMBOLS[marks[i] ?? 'FUTURE']}`,
    ]),
  );
  return renderTemplate('DC-03', variables);
}
