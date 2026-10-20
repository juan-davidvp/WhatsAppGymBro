import { describe, expect, it } from 'vitest';
import { readVault } from './test-utils/vault.js';
import { FAVORITE_DELETE_PREFIX, FAVORITE_EDIT_PREFIX, PROTEIN_BAR, proteinBar } from './meals.js';

const notes = readVault('output/sdd/contenido/plantillas-de-mensajes.md');

describe('T-050 · barra de proteína y botones de frecuentes, como en la bóveda', () => {
  it('la bóveda describe la barra de 10 celdas ▓/░ y los prefijos ✏️ y 🗑️', () => {
    expect(notes).toContain(
      `\`{barra}\` tiene ${String(PROTEIN_BAR.cells)} celdas (▓ llena, ░ vacía)`,
    );
    expect(notes).toContain(
      `${FAVORITE_EDIT_PREFIX} {nombre} y ${FAVORITE_DELETE_PREFIX} {nombre}`,
    );
  });

  it('se llena según la fracción y nunca pasa de la barra entera', () => {
    expect(proteinBar(0)).toBe('░'.repeat(10));
    expect(proteinBar(0.63)).toBe('▓'.repeat(6) + '░'.repeat(4));
    expect(proteinBar(1.4)).toBe('▓'.repeat(10));
  });
});
