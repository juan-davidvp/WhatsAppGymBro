/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PARAMETERS } from './parameters.js';

/**
 * T-002 · `parameters.ts` replica `vault/output/sdd/parametros.md`.
 *
 * Para cada fila `P-###` de la bóveda se comprueba:
 * 1. que el código (`goal.horizonWeeksDefault`) existe en PARAMETERS;
 * 2. que el valor coincide: se extraen de la celda "Valor" los números
 *    (coma decimal, punto de miles), las horas (HH:MM), los días de la semana
 *    y las zonas horarias, en orden, y se comparan con los del valor en código;
 * 3. que el comentario `P-###` está justo encima de su clave.
 * Y al revés: ningún valor de PARAMETERS queda sin fila en la bóveda.
 */

const VAULT_PARAMETERS = fileURLToPath(
  new URL('../../../../../vault/output/sdd/parametros.md', import.meta.url),
);
const PARAMETERS_SOURCE = fileURLToPath(new URL('./parameters.ts', import.meta.url));

interface VaultRow {
  id: string;
  code: string;
  value: string;
}

function readVaultRows(): VaultRow[] {
  return readFileSync(VAULT_PARAMETERS, 'utf8')
    .split('\n')
    .filter((line) => /^\|\s*P-\d{3}\s*\|/.test(line))
    .map((line) => {
      const cells = line.split('|').map((cell) => cell.trim());
      return {
        id: cells[1] ?? '',
        code: (cells[2] ?? '').replaceAll('`', ''),
        value: cells[3] ?? '',
      };
    });
}

type Token = number | string;

const WEEKDAYS_ES: Record<string, string> = {
  lunes: 'monday',
  martes: 'tuesday',
  miércoles: 'wednesday',
  jueves: 'thursday',
  viernes: 'friday',
  sábado: 'saturday',
  domingo: 'sunday',
};
const WEEKDAYS_EN = new Set(Object.values(WEEKDAYS_ES));
const TIME = /^\d{2}:\d{2}$/;
const TIMEZONE = /^[A-Z][a-z]+\/[A-Za-z_]+$/;

/** Fichas comparables de la celda "Valor" de la bóveda, en orden de aparición. */
function tokensFromVault(cell: string): Token[] {
  const pattern =
    /(\d{1,2}:\d{2})|([A-Z][a-z]+\/[A-Za-z_]+)|(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?)|(\p{L}+)/gu;
  const tokens: Token[] = [];
  for (const match of cell.matchAll(pattern)) {
    const [, time, timezone, number, word] = match;
    const weekday = word ? WEEKDAYS_ES[word.toLowerCase()] : undefined;
    if (time) tokens.push(time.padStart(5, '0'));
    else if (timezone) tokens.push(timezone);
    else if (number) tokens.push(Number(number.replaceAll('.', '').replace(',', '.')));
    else if (weekday) tokens.push(weekday);
  }
  return tokens;
}

/** Fichas comparables del valor en código, recorrido en el orden de declaración. */
function tokensFromCode(value: unknown): Token[] {
  if (typeof value === 'number') return [value];
  if (typeof value === 'string') {
    return TIME.test(value) || TIMEZONE.test(value) || WEEKDAYS_EN.has(value) ? [value] : [];
  }
  if (Array.isArray(value)) return value.flatMap(tokensFromCode);
  if (value !== null && typeof value === 'object')
    return Object.values(value).flatMap(tokensFromCode);
  return [];
}

function resolve(code: string): unknown {
  return code
    .split('.')
    .reduce<unknown>(
      (node, key) =>
        node !== null && typeof node === 'object'
          ? (node as Record<string, unknown>)[key]
          : undefined,
      PARAMETERS,
    );
}

/** Rutas de las claves de segundo nivel (`grupo.clave`), que son las que nombra la bóveda. */
function codePaths(): string[] {
  return Object.entries(PARAMETERS).flatMap(([group, entries]) =>
    Object.keys(entries).map((key) => `${group}.${key}`),
  );
}

const rows = readVaultRows();

describe('T-002 · parameters.ts replica parametros.md', () => {
  it('la bóveda tiene 72 parámetros', () => {
    expect(rows).toHaveLength(72);
  });

  it.each(rows)('$id · $code existe con el mismo valor', ({ code, value }) => {
    const codeValue = resolve(code);
    expect(codeValue, `falta ${code} en PARAMETERS`).toBeDefined();
    const expected = tokensFromVault(value);
    expect(expected.length, `la celda "${value}" no tiene valores comparables`).toBeGreaterThan(0);
    expect(tokensFromCode(codeValue)).toEqual(expected);
  });

  it.each(rows)('$id está comentado justo encima de $code', ({ id, code }) => {
    const lines = readFileSync(PARAMETERS_SOURCE, 'utf8').split('\n');
    const index = lines.findIndex((line) => new RegExp(`/\\*\\*\\s*${id}\\b`).test(line));
    expect(index, `no hay comentario /** ${id} … */`).toBeGreaterThanOrEqual(0);
    const key = code.split('.').at(-1);
    expect(lines[index + 1]?.trim().startsWith(`${key}:`)).toBe(true);
  });

  it('ningún valor de PARAMETERS queda sin fila en la bóveda', () => {
    const vaultCodes = new Set(rows.map((row) => row.code));
    expect(codePaths().filter((path) => !vaultCodes.has(path))).toEqual([]);
  });
});
