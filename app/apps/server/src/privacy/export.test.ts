import { EXPORT_CSV, EXPORT_JSON_FILE, renderTemplate, templateById } from '@gymbro/content';
import { inflateRawSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import type { Reply } from '../onboarding/replies.js';
import { ONBOARDED_GYM_LXV, runFlow } from '../testing/onboarding.js';
import { sent } from '../testing/telegram.js';
import { answerExport } from './export.js';
import { exportFiles, sanitize } from './export-files.js';
import { createZip } from './zip.js';

/** T-090 · `/exportar` (HU-008-1, RN-INT-002, FR-008-01, SC-008-1). */

const NOW = new Date('2026-10-19T17:00:00Z');

/** Lee un ZIP con su directorio central, como lo haría un descompresor. */
function readZip(bytes: Uint8Array): Map<string, string> {
  const zip = Buffer.from(bytes);
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = zip.readUInt16LE(end + 10);
  let at = zip.readUInt32LE(end + 16);
  const files = new Map<string, string>();
  for (let i = 0; i < count; i += 1) {
    const compressed = zip.readUInt32LE(at + 20);
    const nameLength = zip.readUInt16LE(at + 28);
    const local = zip.readUInt32LE(at + 42);
    const name = zip.toString('utf8', at + 46, at + 46 + nameLength);
    const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    files.set(name, inflateRawSync(zip.subarray(start, start + compressed)).toString('utf8'));
    at += 46 + nameLength;
  }
  return files;
}

const sample = {
  users: [{ _id: 'abc', telegramUserId: 42, timezone: 'America/Bogota' }],
  workout_sessions: [
    {
      _id: 's1',
      userId: 'u1',
      rev: 3,
      date: '2026-10-19',
      template: 'FULL_A',
      variant: 'GYM',
      status: 'completed',
      startedAt: new Date('2026-10-19T23:00:00Z'),
      endedAt: null,
    },
  ],
  set_entries: [
    {
      userId: 'u1',
      idempotencyKey: 'k',
      sessionId: 's1',
      exerciseCode: 'SQ_BB',
      setIndex: 0,
      reps: 5,
      loadKg: 80,
      edited: false,
      confirmedAt: new Date('2026-10-19T23:10:00Z'),
    },
  ],
  achievements: [{ userId: 'u1', code: '=CMD()', at: NOW, value: 'a,"b"', context: null }],
  ingestion_tokens: [{ userId: 'u1', tokenHash: 'secreto' }],
  integrations: [{ apiToken: 'secreto', nested: { password: 'secreto', ok: 1 } }],
};

describe('RN-INT-002 · HU-008-1 · T-090 · contenido del archivo', () => {
  it('escenario 1 · un CSV por tema con sus columnas y un JSON completo', () => {
    const files = readZip(createZip(exportFiles(sample, NOW), NOW));
    expect([...files.keys()]).toEqual([
      ...Object.values(EXPORT_CSV).map((c) => c.file),
      EXPORT_JSON_FILE,
    ]);
    const series = files.get('series.csv')?.replace('﻿', '').trim().split('\r\n');
    expect(series).toEqual([
      EXPORT_CSV.sets.columns.join(','),
      '2026-10-19T23:10:00.000Z,SQ_BB,1,5,80,false',
    ]);
    const json = JSON.parse(files.get(EXPORT_JSON_FILE) ?? '{}') as {
      data: Record<string, unknown[]>;
    };
    expect(json.data['workout_sessions']).toEqual([
      {
        date: '2026-10-19',
        template: 'FULL_A',
        variant: 'GYM',
        status: 'completed',
        startedAt: '2026-10-19T23:00:00.000Z',
        endedAt: null,
      },
    ]);
  });

  it('escenario 2 · no lleva tokens, claves ni identificadores internos', () => {
    const files = readZip(createZip(exportFiles(sample, NOW), NOW));
    const all = [...files.values()].join('\n');
    expect(all).not.toContain('secreto');
    expect(sanitize(sample.integrations)).toEqual([{ nested: { ok: 1 } }]);
    const json = files.get(EXPORT_JSON_FILE) ?? '';
    expect(json).not.toMatch(/"(_id|userId|idempotencyKey|rev|sessionId)"/);
  });

  it('una celda de texto no se ejecuta como fórmula en una hoja de cálculo', () => {
    const files = readZip(createZip(exportFiles(sample, NOW), NOW));
    expect(files.get('logros.csv')).toContain(`2026-10-19T17:00:00.000Z,'=CMD(),"a,""b""",`);
  });

  it('SC-008-1 · 12 semanas de datos se generan en mucho menos de 30 s', () => {
    const many = Array.from({ length: 12 * 7 * 40 }, (_, i) => ({
      ...sample.set_entries[0],
      setIndex: i,
    }));
    const started = performance.now();
    const bytes = createZip(exportFiles({ set_entries: many }, NOW), NOW);
    expect(bytes.length).toBeGreaterThan(0);
    expect(performance.now() - started).toBeLessThan(30_000);
  });
});

describe('FR-008-01 · T-090 · /exportar en el bot', () => {
  const onboarded = () => runFlow(ONBOARDED_GYM_LXV, { clock: () => NOW });

  it('pide confirmar y, al aceptar, envía el ZIP como documento con EX-02', async () => {
    const t = await onboarded();
    await t.act({ text: '/exportar' });
    const ask = sent(t.calls).at(-1);
    expect(ask?.text).toBe(renderTemplate('EX-01'));
    expect(ask?.buttons.map((b) => b.text)).toEqual(templateById('EX-01').buttons);
    await t.act('Generar archivo');
    const document = t.calls.find((c) => c.method === 'sendDocument');
    expect(document?.payload['caption']).toBe(renderTemplate('EX-02'));
    const names = t.events.map((e) => e.name);
    expect(names).toContain('export_requested');
    expect(names).toContain('export_delivered');
  });

  it('[Cancelar] no genera nada', async () => {
    const t = await onboarded();
    await t.act({ text: '/exportar' });
    await t.act('Cancelar');
    expect(sent(t.calls).at(-1)?.text).toBe(renderTemplate('EX-03'));
    expect(t.calls.some((c) => c.method === 'sendDocument')).toBe(false);
  });

  it('el archivo trae los datos reales del usuario, con nombre por fecha', async () => {
    const t = await onboarded();
    await t.deps.bodyMeasurements.recordWeight(t.user()?.id ?? '', '2026-10-19', 72.5);
    const user = t.user();
    if (!user) throw new Error('sin usuario');
    const logger = { info: () => {}, warn: () => {}, error: () => {} } as never;
    const delivered: Reply[] = [];
    await answerExport(user, 'go', { ...t.deps, clock: () => NOW, logger }, (reply) => {
      delivered.push(reply);
      return Promise.resolve();
    });
    const [reply] = delivered;
    expect(reply?.document?.name).toBe('gymbro-datos-2026-10-19.zip');
    const files = readZip(reply?.document?.bytes ?? new Uint8Array());
    expect(files.get('mediciones.csv')).toContain('2026-10-19,72.5,');
  });

  it('si falla, avisa con EX-04 y registra el error', async () => {
    const t = await onboarded();
    const user = t.user();
    if (!user) throw new Error('sin usuario');
    const errors: string[] = [];
    const logger = { info: () => {}, warn: () => {}, error: (e: string) => errors.push(e) };
    const [reply] = await answerExport(
      user,
      'go',
      {
        exporter: { collect: () => Promise.reject(new Error('mongo caído')) },
        events: t.deps.events,
        clock: () => NOW,
        logger: logger as never,
      },
      () => Promise.resolve(),
    );
    expect(reply?.text).toBe(renderTemplate('EX-04'));
    expect(errors).toEqual(['export_failed']);
  });

  it('si Telegram no acepta el archivo, avisa con EX-04 y no lo da por entregado', async () => {
    const t = await onboarded();
    const user = t.user();
    if (!user) throw new Error('sin usuario');
    const logger = { info: () => {}, warn: () => {}, error: () => {} } as never;
    const [reply] = await answerExport(user, 'go', { ...t.deps, clock: () => NOW, logger }, () =>
      Promise.reject(new Error('telegram caído')),
    );
    expect(reply?.text).toBe(renderTemplate('EX-04'));
    expect(t.events.some((e) => e.name === 'export_delivered')).toBe(false);
  });
});
