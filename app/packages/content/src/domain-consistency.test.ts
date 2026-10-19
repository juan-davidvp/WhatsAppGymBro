import { BODY_REGION_BY_PATTERN } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { MOVEMENT_PATTERNS } from './index.js';

describe('RN-ENT-002 · el dominio conoce todos los patrones del catálogo de ejercicios', () => {
  it('los patrones del dominio y los del contenido son los mismos', () => {
    expect(Object.keys(BODY_REGION_BY_PATTERN).sort()).toEqual([...MOVEMENT_PATTERNS].sort());
  });
});

describe('RN-MSJ-001 · el motor y el contenido usan el mismo catálogo de propósitos', () => {
  it('los propósitos del dominio y los del contenido son los mismos', async () => {
    const { MESSAGE_PURPOSES: domainPurposes } = await import('@gymbro/domain');
    const { MESSAGE_PURPOSES: contentPurposes } = await import('./index.js');
    expect([...domainPurposes].sort()).toEqual([...contentPurposes].sort());
  });
});
