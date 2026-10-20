import { SESSION_PATTERNS, equipmentMatches } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import {
  EXERCISES,
  HOME_EQUIPMENT_OPTIONS,
  SESSION_NAMES,
  WEEKDAY_BUTTON_LABELS,
} from './index.js';
import { readTable, readVault } from './test-utils/vault.js';

const exercisesMd = readVault('output/sdd/contenido/catalogo-de-ejercicios-base.md');
const templatesMd = readVault('output/sdd/contenido/plantillas-de-mensajes.md');

describe('T-032 · catálogos del onboarding replican la bóveda', () => {
  it('equipamiento de casa = catálogo §6, en orden', () => {
    expect([...HOME_EQUIPMENT_OPTIONS]).toEqual(
      readTable(exercisesMd, /^## 6\./).map((row) => row['Opción']),
    );
  });

  it('RN-PLAN-003 · cada opción sirve para al menos un ejercicio de casa del catálogo', () => {
    const homeEquipment = EXERCISES.filter((e) => e.variants.includes('HOME')).map(
      (e) => e.equipment,
    );
    for (const option of HOME_EQUIPMENT_OPTIONS) {
      expect(
        homeEquipment.some((equipment) => equipmentMatches(equipment, option)),
        option,
      ).toBe(true);
    }
  });

  it('nombres de sesión = catálogo §5, y uno por cada sesión del dominio', () => {
    const rows = readTable(exercisesMd, /^## 5\./);
    expect(Object.entries(SESSION_NAMES)).toEqual(rows.map((r) => [r['Código'], r['Sesión']]));
    expect(Object.keys(SESSION_NAMES).sort()).toEqual(Object.keys(SESSION_PATTERNS).sort());
  });

  it('botones de días = nota de ON-10', () => {
    expect(templatesMd).toContain(`(${WEEKDAY_BUTTON_LABELS.join(' ')})`);
  });
});
