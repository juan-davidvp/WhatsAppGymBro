import { BODY_REGION_BY_PATTERN } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { MOVEMENT_PATTERNS } from './index.js';

describe('RN-ENT-002 · el dominio conoce todos los patrones del catálogo de ejercicios', () => {
  it('los patrones del dominio y los del contenido son los mismos', () => {
    expect(Object.keys(BODY_REGION_BY_PATTERN).sort()).toEqual([...MOVEMENT_PATTERNS].sort());
  });
});

describe('RN-DQC-004 · la línea de la semana tiene un símbolo por cada marca del dominio', () => {
  it('las marcas del dominio y las del contenido son las mismas', async () => {
    const { WEEK_MARKS } = await import('@gymbro/domain');
    const { WEEK_LINE_SYMBOLS } = await import('./index.js');
    expect(Object.keys(WEEK_LINE_SYMBOLS).sort()).toEqual([...WEEK_MARKS].sort());
  });
});

describe('RN-GAM-008 · cada misión del dominio tiene su rótulo en el contenido', () => {
  it('los tipos de misión del dominio y los rótulos son los mismos', async () => {
    const { generateWeeklyQuests } = await import('@gymbro/domain');
    const { QUEST_LABELS } = await import('./index.js');
    expect(
      generateWeeklyQuests(null)
        .map((q) => q.kind)
        .sort(),
    ).toEqual(Object.keys(QUEST_LABELS).sort());
  });
});

describe('RN-MSJ-001 · el motor y el contenido usan el mismo catálogo de propósitos', () => {
  it('los propósitos del dominio y los del contenido son los mismos', async () => {
    const { MESSAGE_PURPOSES: domainPurposes } = await import('@gymbro/domain');
    const { MESSAGE_PURPOSES: contentPurposes } = await import('./index.js');
    expect([...domainPurposes].sort()).toEqual([...contentPurposes].sort());
  });
});
