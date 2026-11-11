import { Resvg } from '@resvg/resvg-js';
import type { WallCell } from '@gymbro/domain';

/**
 * Imagen del muro de constancia (T-080, HU-006-1, FR-006-01, plan técnico §8):
 * plantilla SVG con un cuadro por día (columnas = semanas, filas = lunes a
 * domingo) renderizada a PNG en el servidor. Sin texto ni datos sensibles: solo
 * el estado de cada día (decisión del PO, 2026-11-11). Sin fuentes que empaquetar.
 */

/** Diseño de la imagen (no son reglas de negocio). */
const CELL = 28;
const GAP = 6;
const PADDING = 18;
const RADIUS = 6;
const DAYS_PER_WEEK = 7;
/** Escala del PNG para que se vea nítido en pantallas densas. */
const ZOOM = 2;

const BACKGROUND = '#ffffff';
const FILL: Readonly<Record<WallCell, string>> = {
  complete: '#1b7f5a',
  counted: '#7cc9a2',
  none: '#e4e7ea',
  future: '#ffffff',
};
const FUTURE_STROKE = '#e4e7ea';

export function wallSvg(grid: readonly (readonly WallCell[])[]): string {
  const width = PADDING * 2 + grid.length * CELL + Math.max(0, grid.length - 1) * GAP;
  const height = PADDING * 2 + DAYS_PER_WEEK * CELL + (DAYS_PER_WEEK - 1) * GAP;
  const cells = grid.flatMap((week, w) =>
    week.map((cell, d) => {
      const x = PADDING + w * (CELL + GAP);
      const y = PADDING + d * (CELL + GAP);
      const stroke = cell === 'future' ? ` stroke="${FUTURE_STROKE}" stroke-width="2"` : '';
      return `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="${RADIUS}" fill="${FILL[cell]}"${stroke}/>`;
    }),
  );
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="${BACKGROUND}"/>`,
    ...cells,
    '</svg>',
  ].join('');
}

/** PNG del muro, listo para `sendPhoto`. */
export function wallPng(grid: readonly (readonly WallCell[])[]): Uint8Array {
  return new Resvg(wallSvg(grid), { fitTo: { mode: 'zoom', value: ZOOM } }).render().asPng();
}
