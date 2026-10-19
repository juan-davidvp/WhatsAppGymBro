import { templateById } from '@gymbro/content';
import { describe, expect, it } from 'vitest';
import {
  callbackUpdate,
  sent,
  setupTestBot,
  startAnd,
  tapData,
  textUpdate,
} from '../testing/telegram.js';

async function requestDeletion(options: { failErase?: boolean } = {}) {
  const setup = options.failErase ? await startWith(options) : await startAnd('Acepto', 'Sí');
  await setup.bot.handleUpdate(textUpdate('/borrar_datos', setup.nextUpdateId()));
  const tap = (label: string) =>
    setup.bot.handleUpdate(callbackUpdate(tapData(setup.calls, label), setup.nextUpdateId()));
  return { ...setup, tap };
}

/** Variante de startAnd con opciones del doble en memoria. */
async function startWith(options: { failErase?: boolean }) {
  const setup = setupTestBot(options);
  let id = 1;
  await setup.bot.handleUpdate(textUpdate('/start', id++));
  await setup.bot.handleUpdate(callbackUpdate(tapData(setup.calls, 'Acepto'), id++));
  return { ...setup, nextUpdateId: () => id++ };
}

describe('HU-009-6 · RN-DAT-003 · T-034 · /borrar_datos', () => {
  it('pide dos confirmaciones antes de borrar', async () => {
    const { tap, calls, users } = await requestDeletion();
    expect(sent(calls).at(-1)?.text).toBe(templateById('BD-01').text);
    await tap('Sí, borrar');
    expect(sent(calls).at(-1)?.text).toBe(templateById('BD-02').text);
    expect(users.size).toBe(1);
  });

  it('con la segunda confirmación borra todo, explica cómo borrar el chat y los eventos quedan sin seudónimo', async () => {
    const { tap, calls, users, consents, events } = await requestDeletion();
    await tap('Sí, borrar');
    await tap('Borrar todo');
    expect(sent(calls).at(-1)?.text).toBe(templateById('BD-03').text);
    expect(users.size).toBe(0);
    expect(consents).toEqual([]);
    expect(events.every((e) => e.subject === null)).toBe(true);
    expect(events.map((e) => e.name)).toEqual(
      expect.arrayContaining(['deletion_requested', 'deletion_completed']),
    );
  });

  it('cancelar en cualquiera de las dos confirmaciones no borra nada', async () => {
    for (const steps of [['Cancelar'], ['Sí, borrar', 'Cancelar']]) {
      const { tap, calls, users } = await requestDeletion();
      for (const label of steps) await tap(label);
      expect(sent(calls).at(-1)?.text).toBe(templateById('BD-04').text);
      expect(users.size).toBe(1);
    }
  });

  it('si el borrado falla, lo dice y no anuncia un borrado que no ocurrió', async () => {
    const { tap, calls, lines, events } = await requestDeletion({ failErase: true });
    await tap('Sí, borrar');
    await tap('Borrar todo');
    expect(sent(calls).at(-1)?.text).toBe(templateById('BD-05').text);
    expect(lines.join('\n')).toContain('deletion_failed');
    expect(events.map((e) => e.name)).not.toContain('deletion_completed');
  });

  it('después del borrado, un mensaje nuevo empieza de cero', async () => {
    const { tap, bot, calls, nextUpdateId } = await requestDeletion();
    await tap('Sí, borrar');
    await tap('Borrar todo');
    await bot.handleUpdate(textUpdate('/start', nextUpdateId()));
    expect(sent(calls).at(-1)?.text).toBe(templateById('ON-02').text);
  });
});
