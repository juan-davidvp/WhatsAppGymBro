import { PARAMETERS } from '../config/parameters.js';

/**
 * RN-SEG-007: detector de señales de riesgo en el texto libre.
 *
 * Función pura: recibe el catálogo (categorías en orden de prioridad, con sus
 * expresiones) desde `@gymbro/content` y devuelve solo la categoría, nunca el
 * texto (RN-DAT-005). Reglas de comparación:
 * `vault/output/sdd/contenido/expresiones-de-alerta.md` §1.
 */

export interface AlertCatalogEntry<C extends string = string> {
  readonly category: C;
  readonly expressions: readonly string[];
}

export interface RiskSignal<C extends string = string> {
  readonly category: C;
}

const NUMBER_PLACEHOLDER = '{n}';
const NUMBER_TOKEN = 'numtoken';

/**
 * Minúsculas, sin tildes (ñ → n), punto de miles eliminado ("1.200" → "1200"),
 * todo lo que no sea letra o número → espacio, espacios unidos.
 */
export function normalizeForMatching(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/(\d)\.(?=\d{3}(?!\d))/g, '$1')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

interface CompiledExpression {
  readonly pattern: RegExp;
  readonly hasNumber: boolean;
}

function compile(expression: string): CompiledExpression {
  const hasNumber = expression.includes(NUMBER_PLACEHOLDER);
  const normalized = normalizeForMatching(expression.replaceAll(NUMBER_PLACEHOLDER, NUMBER_TOKEN));
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(NUMBER_TOKEN, '(\\d+)');
  return { pattern: new RegExp(`(?:^| )${escaped}(?: |$)`), hasNumber };
}

/** RN-SEG-007: con `{n}`, solo cuenta si la cifra es ≤ P-071 (dieta de muy bajas calorías). */
function matches({ pattern, hasNumber }: CompiledExpression, text: string): boolean {
  const match = pattern.exec(text);
  if (!match) return false;
  if (!hasNumber) return true;
  const value = Number(match[1]);
  return value > 0 && value <= PARAMETERS.safety.veryLowCalorieDailyMax;
}

const cache = new WeakMap<readonly string[], CompiledExpression[]>();

function compiled(expressions: readonly string[]): CompiledExpression[] {
  let result = cache.get(expressions);
  if (!result) {
    result = expressions.map(compile);
    cache.set(expressions, result);
  }
  return result;
}

/**
 * RN-SEG-007: primera categoría del catálogo (prioridad) con alguna expresión
 * presente en el texto como secuencia de palabras completas; null si ninguna.
 */
export function detectRiskSignal<C extends string>(
  text: string,
  catalog: readonly AlertCatalogEntry<C>[],
): RiskSignal<C> | null {
  const normalized = normalizeForMatching(text);
  if (normalized === '') return null;
  for (const entry of catalog) {
    if (compiled(entry.expressions).some((expression) => matches(expression, normalized))) {
      return { category: entry.category };
    }
  }
  return null;
}
