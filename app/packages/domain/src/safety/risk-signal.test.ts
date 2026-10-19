import { describe, expect, it } from 'vitest';
import { PARAMETERS } from '../config/parameters.js';
import { detectRiskSignal, normalizeForMatching } from './risk-signal.js';

const CATALOG = [
  { category: 'distress', expressions: ['me quiero morir', 'soy una carga'] },
  {
    category: 'extreme_restriction',
    expressions: ['dejar de comer', '{n} calorías al día', 'dieta de {n} kcal'],
  },
  { category: 'pain', expressions: ['dolor fuerte'] },
] as const;

describe('RN-SEG-007 · detector de señales de riesgo', () => {
  it('normaliza tildes, eñes, mayúsculas y signos', () => {
    expect(normalizeForMatching('¡Me DUELE, mañana!  ¿Qué?')).toBe('me duele manana que');
    expect(normalizeForMatching('1.200 calorías')).toBe('1200 calorias');
  });

  it('detecta una expresión aunque cambien tildes, mayúsculas y signos', () => {
    expect(detectRiskSignal('A veces... ME QUIERO MORÍR!!', CATALOG)).toEqual({
      category: 'distress',
    });
  });

  it('solo coincide con palabras completas', () => {
    expect(detectRiskSignal('voy a dejar de comerciar', CATALOG)).toBeNull();
    expect(detectRiskSignal('voy a dejar de comer hasta el viernes', CATALOG)).toEqual({
      category: 'extreme_restriction',
    });
  });

  it('si coinciden varias categorías gana la primera del catálogo (prioridad)', () => {
    expect(detectRiskSignal('tengo dolor fuerte y me quiero morir', CATALOG)).toEqual({
      category: 'distress',
    });
  });

  it('{n} calorías solo coincide si n ≤ P-071', () => {
    const max = PARAMETERS.safety.veryLowCalorieDailyMax;
    expect(detectRiskSignal(`quiero comer ${max} calorías al día`, CATALOG)).toEqual({
      category: 'extreme_restriction',
    });
    expect(detectRiskSignal(`quiero comer ${max + 1} calorías al día`, CATALOG)).toBeNull();
    expect(detectRiskSignal('dame una dieta de 500 kcal', CATALOG)).toEqual({
      category: 'extreme_restriction',
    });
    expect(detectRiskSignal('en volumen como 3.000 calorías al día', CATALOG)).toBeNull();
  });

  it('sin coincidencias devuelve null', () => {
    expect(detectRiskSignal('hoy entrené pierna', CATALOG)).toBeNull();
    expect(detectRiskSignal('', CATALOG)).toBeNull();
  });

  it('RN-DAT-005 · el resultado solo lleva la categoría, nunca el texto', () => {
    expect(Object.keys(detectRiskSignal('soy una carga', CATALOG) ?? {})).toEqual(['category']);
  });
});
