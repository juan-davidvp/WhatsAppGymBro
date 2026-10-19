import { describe, expect, it } from 'vitest';
import { templateById } from './index.js';

describe('templateById', () => {
  it('devuelve la plantilla por su ID', () => {
    expect(templateById('ON-01').kind).toBe('onboarding');
  });

  it('falla con un ID que no existe', () => {
    expect(() => templateById('XX-99')).toThrow('Plantilla desconocida: XX-99');
  });
});
