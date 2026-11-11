import { wallGrid } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { wallPng, wallSvg } from './wall.js';

/** T-080 · HU-006-1 · FR-006-01 · imagen del muro (SVG → PNG con resvg). */

const grid = wallGrid(
  [
    { date: '2026-10-19', counted: true, complete: true },
    { date: '2026-10-20', counted: true, complete: false },
  ],
  '2026-10-21',
);

describe('FR-006-01 · T-080 · imagen del muro', () => {
  it('un cuadro por día de las P-102 semanas y ningún texto (sin datos sensibles)', () => {
    const svg = wallSvg(grid);
    const cells = svg.match(/<rect /g) ?? [];
    expect(cells).toHaveLength(grid.flat().length + 1); // + el fondo
    expect(svg).not.toMatch(/<text/);
  });

  it('se renderiza a PNG en el servidor', () => {
    const png = wallPng(grid);
    expect(Array.from(png.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(png.length).toBeGreaterThan(500);
  });
});
