import { PARAMETERS } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  ALERT_CATEGORIES,
  ALERT_CATEGORIES_CATALOG,
  EXERCISES,
  EXPRESS_EXCEPTIONS,
  FOODS,
  FREQUENT_MEAL_TEMPLATES,
  LEVELS,
  MESSAGE_PURPOSES,
  MESSAGE_TEMPLATES,
  PROHIBITED_EXPRESSIONS,
  WEEKLY_PHRASES,
  type MovementPattern,
  type SessionVariant,
} from './index.js';

/** Pruebas de contenido de `vault/output/sdd/plan/estrategia-de-pruebas.md` §4 (T-003). */

const proactive = MESSAGE_TEMPLATES.filter((t) => t.kind === 'proactive');
const care = MESSAGE_TEMPLATES.filter((t) => t.kind === 'care');

/** Minúsculas y sin tildes, para comparar expresiones sin depender de la ortografía. */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** ¿`text` contiene `expression` como palabras completas? */
function containsExpression(text: string, expression: string): boolean {
  const escaped = normalize(expression).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}])${escaped}($|[^\\p{L}])`, 'u').test(normalize(text));
}

function variables(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1] ?? '');
}

describe('RN-MSJ-011 · ninguna plantilla contiene expresiones prohibidas', () => {
  const texts = [
    ...MESSAGE_TEMPLATES.flatMap((t) => [t.text, ...t.buttons].map((text) => ({ id: t.id, text }))),
    ...WEEKLY_PHRASES.map((text) => ({ id: 'frase_semana', text })),
  ];

  it.each(texts)('$id: "$text"', ({ text }) => {
    const found = PROHIBITED_EXPRESSIONS.filter((expression) =>
      containsExpression(text, expression),
    );
    expect(found).toEqual([]);
  });

  it('el detector encuentra una expresión prohibida aunque cambien tildes y mayúsculas', () => {
    expect(containsExpression('Hoy FALLASTE otra vez', 'fallaste')).toBe(true);
    expect(containsExpression('Te extranamos', 'te extrañamos')).toBe(true);
    expect(containsExpression('engordar', 'gordo')).toBe(false);
  });
});

describe('RN-MSJ-012 · todo mensaje proactivo tiene una acción de 1 toque', () => {
  it.each(proactive)('$id tiene al menos un botón', ({ buttons }) => {
    expect(buttons.length).toBeGreaterThan(0);
  });
});

describe('RN-MSJ-001 · las plantillas proactivas usan propósitos del catálogo', () => {
  it('cada propósito del catálogo tiene plantillas', () => {
    const used = new Set(proactive.map((t) => (t.kind === 'proactive' ? t.purpose : null)));
    expect([...used].sort()).toEqual([...MESSAGE_PURPOSES].sort());
  });
});

describe('RN-MSJ-010 · plantillas únicas y rotables', () => {
  it('los template_id son únicos', () => {
    const ids = MESSAGE_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(MESSAGE_PURPOSES)('%s tiene al menos 3 variantes para rotar', (purpose) => {
    const variants = proactive.filter((t) => t.kind === 'proactive' && t.purpose === purpose);
    expect(variants.length).toBeGreaterThanOrEqual(3);
  });
});

describe('RN-PLAN-010 · cada ejercicio A tiene equivalentes B y C del mismo patrón', () => {
  const has = (pattern: MovementPattern, variant: SessionVariant) =>
    EXERCISES.some((e) => e.pattern === pattern && e.variants.includes(variant));
  const exception = (pattern: MovementPattern) =>
    EXPRESS_EXCEPTIONS.find((e) => e.pattern === pattern);
  const gymExercises = EXERCISES.filter((e) => e.variants.includes('GYM'));

  it.each(gymExercises)('$code ($pattern) tiene equivalente en casa', ({ pattern }) => {
    expect(has(pattern, 'HOME')).toBe(true);
  });

  it.each(gymExercises)(
    '$code ($pattern) tiene equivalente exprés o una excepción documentada',
    ({ pattern }) => {
      expect(has(pattern, 'EXPRESS') || exception(pattern) !== undefined).toBe(true);
    },
  );

  it('las excepciones exprés son solo patrones sin ejercicio C, y su compensación sí lo tiene', () => {
    for (const { pattern, compensatedBy } of EXPRESS_EXCEPTIONS) {
      expect(has(pattern, 'EXPRESS')).toBe(false);
      if (compensatedBy) expect(has(compensatedBy, 'EXPRESS')).toBe(true);
    }
  });

  it('los códigos de ejercicio son únicos', () => {
    const codes = EXERCISES.map((e) => e.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('RN-NUT-008 · todo alimento tiene porción de referencia y proteína aproximada', () => {
  it.each(FOODS)('$code', (food) => {
    expect(food.referencePortion.length).toBeGreaterThan(0);
    expect(Number.isFinite(food.proteinG)).toBe(true);
    expect(Object.keys(food.handEquivalence).length).toBeGreaterThan(0);
  });

  it('las fuentes de proteína aportan proteína y tienen costo relativo', () => {
    for (const food of FOODS.filter((f) => f.countsForProtein)) {
      expect(food.proteinG).toBeGreaterThan(0);
      expect(food.relativeCost).not.toBeNull();
    }
  });

  it('los códigos de alimentos y comidas frecuentes son únicos', () => {
    const codes = [...FOODS, ...FREQUENT_MEAL_TEMPLATES].map((f) => f.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('RN-SEG-005 · las respuestas de cuidado son fijas y no hablan de calorías ni recomiendan suplementos', () => {
  it.each(care)('$id', ({ text }) => {
    expect(text).not.toMatch(/\d/);
    expect(normalize(text)).not.toMatch(/calori|kcal/);
    expect(variables(text).every((name) => name === 'recurso_local')).toBe(true);
    for (const sentence of text.split(/(?<=[.!?])\s+/)) {
      if (/suplement|sustancia|medicament/i.test(sentence)) expect(sentence).toMatch(/^No /);
    }
  });
});

describe('RN-SEG-007 · cada categoría de alerta tiene su respuesta de cuidado', () => {
  it('están las 5 categorías, cada una con una plantilla CU existente', () => {
    expect(ALERT_CATEGORIES_CATALOG.map((c) => c.category).sort()).toEqual(
      [...ALERT_CATEGORIES].sort(),
    );
    const careIds = new Set(care.map((t) => t.id));
    for (const { careResponseId } of ALERT_CATEGORIES_CATALOG) {
      expect(careIds.has(careResponseId)).toBe(true);
    }
  });
});

describe('RN-GAM-007 · niveles y logros', () => {
  it('los umbrales de los niveles coinciden con P-040', () => {
    expect(LEVELS.map((l) => l.xpThreshold)).toEqual([...PARAMETERS.levels.thresholds]);
  });

  it('los niveles van del 1 al 10 en orden', () => {
    expect(LEVELS.map((l) => l.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('los códigos de logro son únicos', () => {
    const codes = ACHIEVEMENTS.map((a) => a.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
