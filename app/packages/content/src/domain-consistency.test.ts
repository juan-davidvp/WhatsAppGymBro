import { BODY_REGION_BY_PATTERN } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { MOVEMENT_PATTERNS } from './index.js';

describe('RN-ENT-002 · el dominio conoce todos los patrones del catálogo de ejercicios', () => {
  it('los patrones del dominio y los del contenido son los mismos', () => {
    expect(Object.keys(BODY_REGION_BY_PATTERN).sort()).toEqual([...MOVEMENT_PATTERNS].sort());
  });
});
