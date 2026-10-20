/**
 * Piezas de presentación de `🍽️ Comida` descritas en las notas de §2.5 de
 * `vault/output/sdd/contenido/plantillas-de-mensajes.md`.
 */

/** `{barra}` de CM-04 y CM-05: 10 celdas, ▓ llena y ░ vacía. */
export const PROTEIN_BAR = { cells: 10, filled: '▓', empty: '░' } as const;

/** Botones de CM-12 por cada frecuente: ✏️ {nombre} y 🗑️ {nombre}. */
export const FAVORITE_EDIT_PREFIX = '✏️';
export const FAVORITE_DELETE_PREFIX = '🗑️';

/** `{barra}` para una fracción de la meta (se llena como máximo la barra entera). */
export function proteinBar(fraction: number): string {
  const filled = Math.round(Math.min(1, Math.max(0, fraction)) * PROTEIN_BAR.cells);
  return PROTEIN_BAR.filled.repeat(filled) + PROTEIN_BAR.empty.repeat(PROTEIN_BAR.cells - filled);
}
