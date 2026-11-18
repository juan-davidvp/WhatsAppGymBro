import { EXPORT_CSV, EXPORT_JSON_FILE, type ExportCsvKey } from '@gymbro/content';
import type { UserExport } from '../ports/repositories.js';
import type { ZipEntry } from './zip.js';

/**
 * Contenido de `/exportar` (T-090, HU-008-1, RN-INT-002): un CSV por tema y un JSON
 * con todo lo guardado del usuario. Nunca salen tokens, claves ni identificadores
 * internos, aunque una colección nueva los tenga.
 */

type Row = Readonly<Record<string, unknown>>;

const INTERNAL_KEYS: ReadonlySet<string> = new Set([
  '_id',
  'userId',
  'userRef',
  'idempotencyKey',
  'setKey',
  'rev',
  'sessionId',
  'plannedSessionId',
  'favoriteMealId',
  'refId',
  'chatId',
  'telegramMessageId',
]);
const SECRET_KEY = /token|secret|password|hash|pepper/i;
/** Una hoja de cálculo ejecuta como fórmula una celda de texto que empieza así. */
const FORMULA_START = /^[=+\-@\t\r]/;
const NEEDS_QUOTES = /[",\r\n]/;
const UTF8_BOM = '﻿';
const CSV_LINE_END = '\r\n';
const JSON_INDENT = 2;

/** Copia sin campos internos ni secretos, a cualquier profundidad. */
export function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value === null || typeof value !== 'object' || value instanceof Date) return value;
  const convertible = value as { toJSON?: () => unknown };
  if (typeof convertible.toJSON === 'function') return convertible.toJSON();
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !INTERNAL_KEYS.has(key) && !SECRET_KEY.test(key))
      .map(([key, field]) => [key, sanitize(field)]),
  );
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  const raw = typeof value === 'string' ? value : JSON.stringify(value);
  const text = FORMULA_START.test(raw) ? `'${raw}` : raw;
  return NEEDS_QUOTES.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Las filas van ordenadas: la primera columna es siempre la fecha. */
function csvFile(key: ExportCsvKey, rows: readonly (readonly unknown[])[]): ZipEntry {
  const { file, columns } = EXPORT_CSV[key];
  const body = rows.map((row) => row.map(csvCell).join(',')).sort();
  const text = [columns.join(','), ...body].join(CSV_LINE_END);
  return { name: file, content: Buffer.from(`${UTF8_BOM}${text}${CSV_LINE_END}`, 'utf8') };
}

const rowsOf = (data: UserExport, collection: string): readonly Row[] => data[collection] ?? [];

/** Los archivos del ZIP a partir de lo guardado del usuario. */
export function exportFiles(data: UserExport, generatedAt: Date): ZipEntry[] {
  const portions = (row: Row) => (row['portions'] ?? {}) as Row;
  const json = JSON.stringify(
    { generatedAt: generatedAt.toISOString(), data: sanitize(data) },
    null,
    JSON_INDENT,
  );
  return [
    csvFile(
      'sessions',
      rowsOf(data, 'workout_sessions').map((s) => [
        s['date'],
        s['template'],
        s['variant'],
        s['status'],
        s['startedAt'],
        s['endedAt'],
      ]),
    ),
    csvFile(
      'sets',
      rowsOf(data, 'set_entries').map((s) => [
        s['confirmedAt'],
        s['exerciseCode'],
        Number(s['setIndex']) + 1,
        s['reps'],
        s['loadKg'],
        s['edited'],
      ]),
    ),
    csvFile(
      'meals',
      rowsOf(data, 'meals').map((m) => [
        m['date'],
        m['loggedAt'],
        m['method'],
        portions(m)['palm'],
        portions(m)['cuppedHand'],
        portions(m)['fist'],
        portions(m)['thumb'],
        m['proteinG'],
      ]),
    ),
    csvFile(
      'days',
      rowsOf(data, 'days').map((d) => [
        d['date'],
        d['dayType'],
        d['counted'],
        d['complete'],
        d['trainingHalf'],
        d['nutritionHalf'],
      ]),
    ),
    csvFile(
      'achievements',
      rowsOf(data, 'achievements').map((a) => [a['at'], a['code'], a['value'], a['context']]),
    ),
    csvFile(
      'measurements',
      rowsOf(data, 'body_measurements').map((m) => [m['date'], m['weightKg'], m['waistCm']]),
    ),
    { name: EXPORT_JSON_FILE, content: Buffer.from(json, 'utf8') },
  ];
}
