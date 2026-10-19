import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PARAMETERS } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { COLLECTIONS } from './schema.js';

/** T-020 · las colecciones e índices del código son los de modelo-de-datos.md §2. */

const md = readFileSync(
  fileURLToPath(
    new URL('../../../../../../vault/output/sdd/plan/modelo-de-datos.md', import.meta.url),
  ),
  'utf8',
);
const section = md.slice(md.indexOf('## 2. Colecciones'), md.indexOf('## 3.'));
const rows = section
  .split('\n')
  .filter((line) => /^\| `[a-z_]+` \|/.test(line))
  .map((line) => line.split('|').map((cell) => cell.trim()));

/** "`userId+date`; `idempotencyKey` único" → [{ keys, unique }]; "caducidad" → índice TTL en `at`. */
function parseIndexes(cell: string) {
  return cell.split(';').map((part) => {
    if (part.includes('caducidad')) {
      return { keys: ['at'], expireAfterSeconds: PARAMETERS.data.processedUpdatesTtlDays * 86_400 };
    }
    const keys = (part.match(/`([^`]+)`/)?.[1] ?? '').split('+');
    return part.includes('único') ? { keys, unique: true } : { keys };
  });
}

describe('T-020 · el esquema de MongoDB coincide con el modelo de datos', () => {
  it('las mismas colecciones', () => {
    expect(Object.keys(COLLECTIONS).sort()).toEqual(
      rows.map((r) => (r[1] ?? '').replaceAll('`', '')).sort(),
    );
  });

  it.each(rows.map((r) => [(r[1] ?? '').replaceAll('`', ''), r[3] ?? '']))(
    '%s: mismos índices',
    (name, cell) => {
      expect(COLLECTIONS[name as keyof typeof COLLECTIONS]).toEqual(parseIndexes(cell));
    },
  );
});
