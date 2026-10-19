import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  EXERCISES,
  EXPRESS_EXCEPTIONS,
  FOODS,
  FREQUENT_MEAL_TEMPLATES,
  LEVELS,
  MESSAGE_TEMPLATES,
  PROHIBITED_EXPRESSIONS,
  WEEKLY_PHRASES,
  type Amount,
  type HandEquivalence,
  type HandPortion,
  type SessionVariant,
} from './index.js';
import { bracketed, parseNumber, readTable, readVault, type Row } from './test-utils/vault.js';

/**
 * T-003 · el contenido transcrito coincide con `vault/output/sdd/contenido/`.
 * Si cambia un texto o un catálogo en la bóveda, estas pruebas fallan hasta
 * actualizar `packages/content` en el mismo commit.
 */

const templatesMd = readVault('output/sdd/contenido/plantillas-de-mensajes.md');
const achievementsMd = readVault('output/sdd/contenido/catalogo-de-logros-y-niveles.md');
const exercisesMd = readVault('output/sdd/contenido/catalogo-de-ejercicios-base.md');
const foodsMd = readVault('output/sdd/contenido/alimentos-accesibles-base.md');
const voiceMd = readVault('wiki/experiencia/voz-y-marca.md');

describe('T-003 · plantillas de mensajes', () => {
  const headings = [
    /^### 1\.1/,
    /^### 1\.2/,
    /^### 1\.3/,
    /^### 1\.4/,
    /^### 1\.5/,
    /^### 1\.6/,
    /^### 1\.7/,
    /^## 2\./,
    /^## 3\./,
    /^### 3\.1/,
    /^## 4\./,
  ];
  const vaultTemplates = headings.flatMap((heading) => {
    const purpose = templatesMd
      .split('\n')
      .find((line) => heading.test(line))
      ?.match(/`(\w+)`/)?.[1];
    return readTable(templatesMd, heading).map((row) => {
      const text = row['Texto'] ?? '';
      return {
        id: row['ID'] ?? '',
        purpose: heading.source.includes('###') ? purpose : undefined,
        text: text.replace(/\s*\[[^\]]+\]/g, '').trim(),
        buttons: [...bracketed(row['Botones'] ?? ''), ...bracketed(text)],
      };
    });
  });

  it('los mismos IDs, en el mismo orden', () => {
    expect(MESSAGE_TEMPLATES.map((t) => t.id)).toEqual(vaultTemplates.map((t) => t.id));
  });

  it.each(vaultTemplates)('$id coincide en texto, botones y propósito', (expected) => {
    const actual = MESSAGE_TEMPLATES.find((t) => t.id === expected.id);
    expect(actual?.text).toBe(expected.text);
    expect(actual?.buttons).toEqual(expected.buttons);
    expect(actual?.kind === 'proactive' ? actual.purpose : undefined).toBe(expected.purpose);
  });

  it('las frases de {frase_semana} coinciden', () => {
    const line = templatesMd.split('\n').find((l) => l.startsWith('`{frase_semana}`')) ?? '';
    expect(WEEKLY_PHRASES).toEqual([...line.matchAll(/"([^"]+)"/g)].map((m) => m[1]));
  });

  it('las expresiones prohibidas coinciden con voz-y-marca', () => {
    const line = voiceMd.split('\n').find((l) => l.includes('**Expresiones prohibidas**')) ?? '';
    expect(PROHIBITED_EXPRESSIONS).toEqual([...line.matchAll(/"([^"]+)"/g)].map((m) => m[1]));
  });
});

describe('T-003 · niveles y logros', () => {
  it('los niveles coinciden', () => {
    const rows = readTable(achievementsMd, /^## 1\. Niveles/);
    expect(LEVELS.map((l) => ({ ...l }))).toEqual(
      rows.map((r) => ({
        number: Number(r['Nivel']),
        code: r['Código'],
        name: r['Nombre'],
        xpThreshold: parseNumber(r['XP acumulado'] ?? ''),
      })),
    );
  });

  it('los logros coinciden (las filas con "·" agrupan varios logros)', () => {
    const rows = readTable(achievementsMd, /^## 2\. Logros/);
    const expected = rows.flatMap((r) => {
      const codes = (r['Código'] ?? '').split(' · ');
      const names = (r['Nombre'] ?? '').split(' · ');
      return codes.map((code, i) => ({
        code,
        name: names[i],
        condition: r['Condición'],
        storedData: r['Dato guardado'],
      }));
    });
    expect(ACHIEVEMENTS.map((a) => ({ ...a }))).toEqual(
      expected.map((a) => ({ ...a, condition: a.condition?.replace('(F45)', '(`F45`)') })),
    );
  });
});

const VARIANT_BY_VERSION: Record<string, SessionVariant> = { A: 'GYM', B: 'HOME', C: 'EXPRESS' };

describe('T-003 · ejercicios', () => {
  it('los ejercicios coinciden', () => {
    const rows = readTable(exercisesMd, /^## 2\. Ejercicios/);
    expect(EXERCISES.map((e) => ({ ...e }))).toEqual(
      rows.map((r) => ({
        code: r['Código'],
        name: r['Nombre'],
        pattern: r['Patrón'],
        variants: (r['Versión'] ?? '').split('/').map((v) => VARIANT_BY_VERSION[v]),
        equipment: r['Equipo'],
        level: r['Nivel'] === 'Novato' ? 'novice' : 'intermediate',
        safetyNote: r['Nota de seguridad'] === '—' ? null : r['Nota de seguridad'],
      })),
    );
  });

  it('la tabla de equivalencias por patrón coincide con patrón + versiones', () => {
    const rows = readTable(exercisesMd, /^## 3\. Equivalencias/);
    const columns: [string, SessionVariant][] = [
      ['A (gym)', 'GYM'],
      ['B (casa)', 'HOME'],
      ['C (exprés)', 'EXPRESS'],
    ];
    for (const row of rows) {
      for (const [column, variant] of columns) {
        const listed = (row[column] ?? '').match(/[A-Z][A-Z0-9_]+/g) ?? [];
        const codes = listed.filter((code) => EXERCISES.some((e) => e.code === code));
        const derived = EXERCISES.filter(
          (e) => e.pattern === row['Patrón'] && e.variants.includes(variant),
        ).map((e) => e.code);
        expect(codes.sort(), `${row['Patrón']} · ${column}`).toEqual(derived.sort());
      }
    }
  });

  it('las excepciones exprés coinciden con los "—" de la columna C', () => {
    const rows = readTable(exercisesMd, /^## 3\. Equivalencias/);
    const fromVault = rows
      .filter((r) => (r['C (exprés)'] ?? '').startsWith('—'))
      .map((r) => ({
        pattern: r['Patrón'],
        compensatedBy: (r['C (exprés)'] ?? '').match(/con ([A-Z_]+)/)?.[1] ?? null,
      }));
    expect(EXPRESS_EXCEPTIONS.map((e) => ({ ...e }))).toEqual(fromVault);
  });
});

const HAND_WORDS: [RegExp, HandPortion][] = [
  [/palmas?/, 'PALM'],
  [/manos? ahuecadas?/, 'CUPPED_HAND'],
  [/puños?/, 'FIST'],
  [/pulgar(es)?/, 'THUMB'],
];

/** "0,75 palma + 1–2 manos ahuecadas" → { PALM: 0.75, CUPPED_HAND: { min: 1, max: 2 } } */
function parseHands(text: string): HandEquivalence {
  const result: HandEquivalence = {};
  for (const part of text.split('+').map((p) => p.trim())) {
    const [, amountText = '', unit = ''] = part.match(/^([\d,]+(?:–[\d,]+)?)\s+(.+)$/) ?? [];
    const portion = HAND_WORDS.find(([pattern]) => pattern.test(unit))?.[1];
    if (!portion) throw new Error(`Porción desconocida: "${part}"`);
    result[portion] = parseAmount(amountText);
  }
  return result;
}

function parseAmount(text: string): Amount {
  const [min = '', max] = text.split('–');
  return max === undefined ? parseNumber(min) : { min: parseNumber(min), max: parseNumber(max) };
}

describe('T-003 · alimentos', () => {
  const foodFromRow = (r: Row, countsForProtein: boolean) => ({
    code: r['Código'],
    name: r['Alimento'],
    referencePortion: r['Porción de referencia'],
    handEquivalence: parseHands(r['Equivalencia en manos'] ?? r['Equivalencia'] ?? ''),
    proteinG: parseNumber(r['Proteína aprox. (g)'] ?? ''),
    countsForProtein,
    relativeCost: r['Costo relativo'] ?? null,
  });

  it('los alimentos coinciden', () => {
    const expected = [
      ...readTable(foodsMd, /^## 1\./).map((r) => foodFromRow(r, true)),
      ...readTable(foodsMd, /^## 2\./).map((r) => foodFromRow(r, false)),
    ];
    expect(FOODS.map((f) => ({ ...f }))).toEqual(expected);
  });

  it('las comidas frecuentes coinciden', () => {
    const expected = readTable(foodsMd, /^## 3\./).map((r) => ({
      code: r['Código'],
      name: r['Comida'],
      portions: parseHands(r['Porciones propuestas'] ?? ''),
      proteinG: parseAmount(r['Proteína aprox. (g)'] ?? ''),
    }));
    expect(FREQUENT_MEAL_TEMPLATES.map((m) => ({ ...m }))).toEqual(expected);
  });
});
