import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createLogger } from '../logger.js';
import type { EventsRepository } from '../ports/repositories.js';
import { EVENT_NAMES, EVENT_NAMES_BY_MODULE } from './catalog.js';
import { createEventEmitter } from './emitter.js';
import { EVENT_PROPS_SCHEMAS, validateEvent, type AnalyticsEvent } from './schema.js';

const VAULT_PLAN = fileURLToPath(
  new URL('../../../../../vault/output/sdd/plan/plan-de-medicion.md', import.meta.url),
);

/** Eventos de la tabla §2 de la bóveda, por fila. */
function vaultEventRows(): string[][] {
  const section = readFileSync(VAULT_PLAN, 'utf8').split('## 2.')[1]?.split('## 3.')[0] ?? '';
  return section
    .split('\n')
    .filter((line) => line.startsWith('| ') && line.includes('`'))
    .map((line) => [...line.matchAll(/`([a-z_]+)`/g)].map((m) => m[1] ?? ''));
}

const USER_ID = '65f0a1b2c3d4e5f6a7b8c9d0';
const AT = new Date('2026-10-19T15:00:00Z');

function baseEvent(overrides: Partial<AnalyticsEvent> = {}): unknown {
  return {
    userRef: USER_ID,
    name: 'photo_estimate_requested',
    at: AT,
    common: { localDate: '2026-10-19', appVersion: '0.0.0', phase: 'n1_B' },
    props: {},
    ...overrides,
  };
}

describe('T-022 · el catálogo de eventos replica plan-de-medicion §2', () => {
  it('mismos eventos, mismo orden y mismos módulos', () => {
    expect(Object.values(EVENT_NAMES_BY_MODULE).map((names) => [...names])).toEqual(
      vaultEventRows(),
    );
  });
  it('ningún evento repetido y todos en objeto_acción', () => {
    expect(new Set(EVENT_NAMES).size).toBe(EVENT_NAMES.length);
    for (const name of EVENT_NAMES) expect(name).toMatch(/^[a-z]+(_[a-z0-9]+)+$/);
  });
});

describe('RN-DAT-005 · SC-009-3 · revisión automática de esquemas de eventos', () => {
  it('acepta categorías, identificadores, números, booleanos y listas de fichas', () => {
    const result = validateEvent(
      baseEvent({
        props: {
          method: 'favorite',
          proteinG: 32.5,
          templateId: 'PL-01',
          counted: true,
          purposes: ['plan_listo', 'regreso'],
          favoriteMealId: null,
        },
      }),
    );
    expect(result.ok).toBe(true);
  });

  it('rechaza una frase escrita por el usuario en cualquier propiedad', () => {
    const result = validateEvent(baseEvent({ props: { method: 'arroz con pollo y ensalada' } }));
    expect(result.ok).toBe(false);
  });

  it('propiedad: ningún texto con espacios, saltos de línea o caracteres no ASCII se guarda', () => {
    const freeText = fc
      .string({ minLength: 1, maxLength: 200 })
      .filter((s) => /[\s\u0080-￿]/.test(s) || s.length > 64)
      .map((s) => (s.length > 64 ? s : `${s} x`));
    fc.assert(
      fc.property(
        freeText,
        fc.constantFrom('method', 'category', 'reason', 'unit'),
        (value, key) => {
          expect(validateEvent(baseEvent({ props: { [key]: value } })).ok).toBe(false);
          expect(validateEvent(baseEvent({ props: { [key]: [value] } })).ok).toBe(false);
        },
      ),
    );
  });

  it.each(['text', 'caption', 'foodName', 'userMessage', 'screeningAnswer', 'note', 'inputRaw'])(
    'rechaza la clave de texto libre "%s" aunque el valor sea una ficha',
    (key) => {
      expect(validateEvent(baseEvent({ props: { [key]: 'ok' } })).ok).toBe(false);
    },
  );

  it('rechaza objetos anidados (no se puede esconder texto en un subobjeto)', () => {
    expect(validateEvent(baseEvent({ props: { meal: { food: 'pizza' } } as never })).ok).toBe(
      false,
    );
  });

  it('rechaza un evento fuera del catálogo y campos de primer nivel extra', () => {
    expect(validateEvent(baseEvent({ name: 'free_chat' as never })).ok).toBe(false);
    expect(validateEvent({ ...(baseEvent() as object), text: 'hola' }).ok).toBe(false);
  });

  it('el seudónimo es el id interno, no un id de Telegram', () => {
    expect(validateEvent(baseEvent({ userRef: '123456789' })).ok).toBe(false);
  });

  it('los eventos con esquema propio no admiten claves extra', () => {
    expect(
      validateEvent(baseEvent({ name: 'risk_signal_detected', props: { category: 'distress' } }))
        .ok,
    ).toBe(true);
    expect(
      validateEvent(
        baseEvent({ name: 'risk_signal_detected', props: { category: 'distress', extra: 'x' } }),
      ).ok,
    ).toBe(false);
    expect(
      validateEvent(baseEvent({ name: 'risk_signal_detected', props: { category: 'sadness' } })).ok,
    ).toBe(false);
  });

  it('todo esquema propio pertenece a un evento del catálogo', () => {
    for (const name of Object.keys(EVENT_PROPS_SCHEMAS)) expect(EVENT_NAMES).toContain(name);
  });

  it('los motivos de rechazo no repiten el valor recibido', () => {
    const result = validateEvent(baseEvent({ props: { method: 'me quiero morir' } }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problems.join(' ')).not.toContain('morir');
  });
});

function setupEmitter(options: { failStore?: boolean } = {}) {
  const stored: AnalyticsEvent[] = [];
  const lines: string[] = [];
  const repository: EventsRepository = {
    insert(event) {
      if (options.failStore) return Promise.reject(new Error('mongo caído'));
      stored.push(event);
      return Promise.resolve();
    },
  };
  const emitter = createEventEmitter({
    repository,
    logger: createLogger({ level: 'debug', secrets: [], write: (l) => lines.push(l) }),
    appVersion: '0.1.0',
    phase: 'n1_B',
    // 02:30 en Bogotá: aún es el día operativo anterior (RN-DQC-001).
    clock: () => new Date('2026-10-20T07:30:00Z'),
  });
  return { emitter, stored, lines };
}

describe('T-022 · emisor de eventos', () => {
  it('añade seudónimo, instante, día operativo, versión y fase', async () => {
    const { emitter, stored } = setupEmitter();
    await emitter.emit(
      'risk_signal_detected',
      { userId: USER_ID, timezone: 'America/Bogota' },
      { category: 'pain' },
    );
    expect(stored).toEqual([
      {
        userRef: USER_ID,
        name: 'risk_signal_detected',
        at: new Date('2026-10-20T07:30:00Z'),
        common: { localDate: '2026-10-19', appVersion: '0.1.0', phase: 'n1_B' },
        props: { category: 'pain' },
      },
    ]);
  });

  it('un evento con texto libre no se guarda y se registra sin el texto', async () => {
    const { emitter, stored, lines } = setupEmitter();
    await emitter.emit(
      'meal_logged',
      { userId: USER_ID, timezone: 'America/Bogota' },
      { method: 'comí arepa con huevo' },
    );
    expect(stored).toEqual([]);
    expect(lines.join('\n')).toContain('event_rejected');
    expect(lines.join('\n')).not.toContain('arepa');
  });

  it('si la base falla, el emisor no lanza (medir no rompe la respuesta)', async () => {
    const { emitter, lines } = setupEmitter({ failStore: true });
    await expect(emitter.emit('plan_viewed', null)).resolves.toBeUndefined();
    expect(lines.join('\n')).toContain('event_store_failed');
  });
});
