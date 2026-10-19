import { describe, expect, it } from 'vitest';

describe('T-001 · monorepo', () => {
  it('el paquete @gymbro/domain se puede importar', async () => {
    const domain = await import('./index.js');
    expect(domain).toBeDefined();
  });
});
