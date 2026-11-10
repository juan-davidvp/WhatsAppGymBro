import { describe, expect, it } from 'vitest';
import { BOT_COMMANDS, MAIN_KEYBOARD } from './index.js';
import { readTable, readVault } from './test-utils/vault.js';

const templatesMd = readVault('output/sdd/contenido/plantillas-de-mensajes.md');

describe('FR-001-11 · T-041 · teclado persistente y comandos', () => {
  it('el teclado es el de la bóveda', () => {
    expect(templatesMd).toContain(MAIN_KEYBOARD.map((k) => `\`${k}\``).join(' · '));
  });
  it('los comandos son los de §2.3, en orden', () => {
    expect(BOT_COMMANDS.map((c) => [c.command, c.description])).toEqual(
      readTable(templatesMd, /^### 2\.3/).map((r) => [r['Comando'], r['Descripción']]),
    );
  });
  it('Telegram acepta los nombres y las descripciones (1–32 y 1–256 caracteres)', () => {
    for (const { command, description } of BOT_COMMANDS) {
      expect(command).toMatch(/^[a-z0-9_]{1,32}$/);
      expect(description.length).toBeGreaterThan(0);
      expect(description.length).toBeLessThanOrEqual(256);
    }
  });
});
