/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Solo para pruebas: lee tablas de la bóveda para comparar el contenido transcrito. */

const VAULT_ROOT = new URL('../../../../../vault/', import.meta.url);

export function readVault(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, VAULT_ROOT)), 'utf8');
}

export type Row = Record<string, string>;

/**
 * Filas de la primera tabla que aparece después del encabezado que coincide con
 * `heading`, como objetos indexados por el texto de la cabecera. Se quitan las
 * comillas invertidas de cada celda.
 */
export function readTable(markdown: string, heading: RegExp): Row[] {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => /^#{1,6} /.test(line) && heading.test(line));
  if (start < 0) throw new Error(`No se encontró el encabezado ${heading}`);
  const tableStart = lines.findIndex((line, i) => i > start && line.startsWith('|'));
  const header = splitRow(lines[tableStart] ?? '');
  const rows: Row[] = [];
  for (let i = tableStart + 2; i < lines.length && lines[i]?.startsWith('|'); i++) {
    const cells = splitRow(lines[i] ?? '');
    rows.push(Object.fromEntries(header.map((name, j) => [name, cells[j] ?? ''])));
  }
  return rows;
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim().replaceAll('`', ''));
}

/** "1,5" → 1.5 · "1.800" → 1800 */
export function parseNumber(text: string): number {
  return Number(text.replaceAll('.', '').replace(',', '.'));
}

/** Botones escritos como `[Texto]` en una celda. */
export function bracketed(text: string): string[] {
  return [...text.matchAll(/\[([^\]]+)\]/g)].map((match) => match[1] ?? '');
}
