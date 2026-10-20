import { detectRiskSignal, normalizeForMatching } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import {
  ALERT_CATEGORIES,
  ALERT_CATEGORIES_CATALOG,
  MESSAGE_TEMPLATES,
  renderCareResponse,
  templateById,
} from './index.js';
import { readTable, readVault } from './test-utils/vault.js';

/** Catálogo de `vault/output/sdd/contenido/expresiones-de-alerta.md` (RN-SEG-007). */
const alertsMd = readVault('output/sdd/contenido/expresiones-de-alerta.md');

function vaultExpressions(category: string): string[] {
  const lines = alertsMd.split('\n');
  const start = lines.findIndex((l) => l.startsWith('### ') && l.includes(`\`${category}\``));
  const end = lines.findIndex((l, i) => i > start && /^#{2,3} /.test(l));
  return lines
    .slice(start + 1, end)
    .filter((l) => l.startsWith('- `'))
    .map((l) => l.slice(3, l.lastIndexOf('`')));
}

describe('RN-SEG-007 · el catálogo de alertas coincide con la bóveda', () => {
  it('las categorías, su prioridad y su respuesta coinciden con §2', () => {
    const rows = readTable(alertsMd, /^## 2\. Categorías/);
    expect(ALERT_CATEGORIES_CATALOG.map((c) => [c.category, c.careResponseId])).toEqual(
      rows.map((r) => [r['Código'], r['Respuesta']]),
    );
    expect([...ALERT_CATEGORIES]).toEqual(rows.map((r) => r['Código']));
  });

  it.each(ALERT_CATEGORIES_CATALOG)('$category: mismas expresiones que §3', (entry) => {
    expect([...entry.expressions]).toEqual(vaultExpressions(entry.category));
  });

  it('los recursos de ayuda coinciden con §4', () => {
    const rows = readTable(alertsMd, /^## 4\. Recursos/);
    const expected = Object.fromEntries(rows.map((r) => [r['Categoría'], r['{recurso_local}']]));
    const actual = Object.fromEntries(
      ALERT_CATEGORIES_CATALOG.filter((c) => c.helpResource).map((c) => [
        c.category,
        c.helpResource,
      ]),
    );
    expect(actual).toEqual(expected);
  });
});

describe('RN-SEG-007 · calidad del catálogo', () => {
  it('ninguna categoría está vacía', () => {
    for (const entry of ALERT_CATEGORIES_CATALOG)
      expect(entry.expressions.length).toBeGreaterThan(0);
  });

  it('ninguna expresión se repite tras normalizar, ni dentro ni entre categorías', () => {
    const all = ALERT_CATEGORIES_CATALOG.flatMap((c) => c.expressions.map(normalizeForMatching));
    expect(all.filter((e, i) => all.indexOf(e) !== i)).toEqual([]);
  });

  it('cada categoría responde con una plantilla de cuidado existente', () => {
    for (const { careResponseId } of ALERT_CATEGORIES_CATALOG) {
      expect(templateById(careResponseId).kind).toBe('care');
    }
  });

  it('las plantillas con {recurso_local} tienen recurso, y quedan sin variables al rellenarlas', () => {
    for (const entry of ALERT_CATEGORIES_CATALOG) {
      const template = templateById(entry.careResponseId);
      expect(template.text.includes('{recurso_local}')).toBe(entry.helpResource !== null);
      expect(renderCareResponse(entry.category)).not.toMatch(/\{\w+\}/);
    }
  });

  it('todas las respuestas de cuidado CU tienen categoría salvo las de otras rutas (CU-06 sobreuso, CU-07 fuera de dominio, CU-09 dolor repetido)', () => {
    const used = new Set(ALERT_CATEGORIES_CATALOG.map((c) => c.careResponseId));
    const unused = MESSAGE_TEMPLATES.filter((t) => t.kind === 'care' && !used.has(t.id)).map(
      (t) => t.id,
    );
    expect(unused).toEqual(['CU-06', 'CU-07', 'CU-09']);
  });
});

describe('RN-SEG-007 · casos de verificación (§5, incluye el red-team de estrategia-de-pruebas §5)', () => {
  const cases = readTable(alertsMd, /^## 5\. Casos/).map((r) => ({
    text: r['Texto'] ?? '',
    expected: r['Categoría esperada'] === '—' ? null : (r['Categoría esperada'] ?? null),
  }));

  it('hay casos para cada categoría y casos que no deben activar nada', () => {
    const covered = new Set(cases.map((c) => c.expected));
    for (const category of ALERT_CATEGORIES) expect(covered.has(category)).toBe(true);
    expect(covered.has(null)).toBe(true);
  });

  it.each(cases)('"$text" → $expected', ({ text, expected }) => {
    expect(detectRiskSignal(text, ALERT_CATEGORIES_CATALOG)?.category ?? null).toBe(expected);
  });
});
