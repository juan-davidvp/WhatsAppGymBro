import { ALERT_CATEGORIES_CATALOG, renderCareResponse, templateById } from '@gymbro/content';
import { PARAMETERS, detectRiskSignal } from '@gymbro/domain';
import fc from 'fast-check';
import type { Update } from 'grammy/types';
import { describe, expect, it } from 'vitest';
import {
  botAuthorUpdate,
  callbackUpdate,
  editedTextUpdate,
  groupTextUpdate,
  photoUpdate,
  setupTestBot,
  textUpdate,
} from '../testing/telegram.js';
import { CALLBACK_DATA_MAX_BYTES, encodeCallbackData, parseCallbackData } from './callback-data.js';

/** Cada expresión del catálogo, con `{n}` reemplazado por una cifra ≤ P-071. */
const ALERT_TEXTS = ALERT_CATEGORIES_CATALOG.flatMap((entry) =>
  entry.expressions.map((expression) =>
    expression.replaceAll('{n}', String(PARAMETERS.safety.veryLowCalorieDailyMax - 200)),
  ),
);

const CARE_TEXTS = new Set(
  ALERT_CATEGORIES_CATALOG.map((entry) => renderCareResponse(entry.category)),
);

/** Mensajes que mandaría cualquier otra ruta. */
const OTHER_ROUTE_TEXTS = [templateById('ON-01').text, templateById('CU-07').text];

function sentTexts(calls: { method: string; payload: Record<string, unknown> }[]): string[] {
  return calls.filter((c) => c.method === 'sendMessage').map((c) => String(c.payload['text']));
}

/** El texto de alerta llega por todas las formas de texto libre. */
const CARRIERS: { name: string; build: (text: string, id: number) => Update }[] = [
  { name: 'mensaje', build: (text, id) => textUpdate(text, id) },
  { name: 'argumento de /start', build: (text, id) => textUpdate(`/start ${text}`, id) },
  { name: 'mensaje editado', build: (text, id) => editedTextUpdate(text, id) },
  { name: 'pie de foto', build: (text, id) => photoUpdate(text, id) },
];

describe('RN-SEG-007 · T-021 · un texto de alerta nunca llega a otra ruta', () => {
  it.each(CARRIERS)(
    'cada expresión del catálogo como $name → solo su respuesta de cuidado',
    async ({ build }) => {
      for (const [index, text] of ALERT_TEXTS.entries()) {
        const { bot, calls } = setupTestBot();
        await bot.handleUpdate(build(text, index + 1));
        const category = detectRiskSignal(text, ALERT_CATEGORIES_CATALOG)?.category;
        expect(category, text).toBeDefined();
        expect(sentTexts(calls), text).toEqual([renderCareResponse(category ?? 'distress')]);
      }
    },
  );

  it('propiedad: con texto alrededor, en mayúsculas y por cualquier vía, solo cuidado', async () => {
    const filler = fc.constantFrom('', 'hola', 'oye bro', 'la verdad', 'hoy en el gym', '...');
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...ALERT_TEXTS),
        filler,
        filler,
        fc.boolean(),
        fc.constantFrom(...CARRIERS),
        async (expression, before, after, upper, carrier) => {
          const raw = `${before} ${expression} ${after}`.trim();
          const text = upper ? raw.toUpperCase() : raw;
          const { bot, calls } = setupTestBot();
          await bot.handleUpdate(carrier.build(text, 1));
          const sent = sentTexts(calls);
          expect(sent).toHaveLength(1);
          expect(CARE_TEXTS.has(sent[0] ?? '')).toBe(true);
          for (const other of OTHER_ROUTE_TEXTS) expect(sent).not.toContain(other);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('guarda solo la categoría y emite risk_signal_detected y care_response_sent', async () => {
    const { bot, riskSignals, events } = setupTestBot();
    await bot.handleUpdate(textUpdate('después del almuerzo me hago vomitar'));
    expect(riskSignals).toEqual([
      { userId: expect.any(String) as string, category: 'purge', at: expect.any(Date) as Date },
    ]);
    expect(events.map((e) => [e.name, e.props])).toEqual([
      ['risk_signal_detected', { category: 'purge' }],
      ['care_response_sent', { category: 'purge', templateId: 'CU-02' }],
    ]);
  });

  it('si guardar la señal falla, la persona igual recibe la respuesta de cuidado', async () => {
    const { bot, calls, lines } = setupTestBot({ failRiskSignals: true });
    await bot.handleUpdate(textUpdate('no quiero vivir'));
    expect(sentTexts(calls)).toEqual([renderCareResponse('distress')]);
    expect(lines.join('\n')).toContain('risk_signal_store_failed');
  });

  it('un texto sin alerta sigue al enrutador', async () => {
    const { bot, calls, riskSignals } = setupTestBot({ onboardingCompleted: true });
    await bot.handleUpdate(textUpdate('me siento hinchado después de almorzar'));
    expect(sentTexts(calls)).toEqual([templateById('CU-07').text]);
    expect(riskSignals).toEqual([]);
  });

  it('NFR-07 · el registro no contiene el texto de alerta', async () => {
    const { bot, lines } = setupTestBot();
    await bot.handleUpdate(textUpdate('estoy pensando en suicidarme'));
    expect(lines.join('\n')).not.toContain('suicid');
  });
});

describe('NFR-03 · SC-003-2 · deduplicación de updates', () => {
  it('el mismo update_id dos veces produce una sola respuesta', async () => {
    const { bot, calls, lines } = setupTestBot();
    await bot.handleUpdate(textUpdate('/start', 7));
    const afterFirst = sentTexts(calls).length;
    await bot.handleUpdate(textUpdate('/start', 7));
    expect(afterFirst).toBeGreaterThan(0);
    expect(sentTexts(calls)).toHaveLength(afterFirst);
    expect(lines.join('\n')).toContain('update_duplicate');
  });

  it('una alerta repetida por reintento no duplica la señal ni los eventos', async () => {
    const { bot, riskSignals, events } = setupTestBot();
    await bot.handleUpdate(textUpdate('llevo 3 días sin comer', 9));
    await bot.handleUpdate(textUpdate('llevo 3 días sin comer', 9));
    expect(riskSignals).toHaveLength(1);
    expect(events).toHaveLength(2);
  });
});

describe('T-021 · usuario', () => {
  it('crea el usuario en su primer update y lo reutiliza después', async () => {
    const { bot, users } = setupTestBot();
    await bot.handleUpdate(textUpdate('/start', 1));
    await bot.handleUpdate(textUpdate('hola', 2));
    expect([...users.values()].map((u) => [u.telegramUserId, u.chatId])).toEqual([[42, 42]]);
  });

  it('ignora grupos y mensajes de otros bots (no responde ni crea usuario)', async () => {
    const { bot, calls, users } = setupTestBot();
    await bot.handleUpdate(groupTextUpdate('quiero morirme', 1));
    await bot.handleUpdate(botAuthorUpdate('hola', 2));
    expect(calls).toEqual([]);
    expect(users.size).toBe(0);
  });
});

describe('T-021 · enrutador', () => {
  it('/start de alguien nuevo → ON-01 y el aviso de privacidad ON-02', async () => {
    const { bot, calls } = setupTestBot();
    await bot.handleUpdate(textUpdate('/start'));
    expect(sentTexts(calls)).toEqual([templateById('ON-01').text, templateById('ON-02').text]);
  });

  it('texto o foto sin ruta → CU-07 con sus tres botones, nunca conversación', async () => {
    for (const update of [textUpdate('¿qué opinas del clima?', 1), photoUpdate(undefined, 2)]) {
      const { bot, calls } = setupTestBot({ onboardingCompleted: true });
      await bot.handleUpdate(update);
      const send = calls.find((c) => c.method === 'sendMessage');
      expect(send?.payload['text']).toBe(templateById('CU-07').text);
      const keyboard = (
        send?.payload['reply_markup'] as {
          inline_keyboard: { text: string; callback_data: string }[][];
        }
      ).inline_keyboard.flat();
      expect(keyboard.map((b) => b.text)).toEqual(templateById('CU-07').buttons);
      for (const button of keyboard) expect(parseCallbackData(button.callback_data)).not.toBeNull();
    }
  });

  it('un botón confirma el toque (Telegram no lo deja cargando), conocido o no', async () => {
    for (const data of [encodeCallbackData({ action: 'nav', target: 'today' }), 'v0:viejo']) {
      const { bot, calls } = setupTestBot();
      await bot.handleUpdate(callbackUpdate(data));
      expect(calls.filter((c) => c.method === 'answerCallbackQuery')).toHaveLength(1);
    }
  });
});

describe('T-021 · datos de los botones', () => {
  it(`caben en ${CALLBACK_DATA_MAX_BYTES} bytes y se leen de vuelta`, () => {
    for (const target of ['today', 'food', 'progress'] as const) {
      const data = encodeCallbackData({ action: 'nav', target });
      expect(new TextEncoder().encode(data).length).toBeLessThanOrEqual(CALLBACK_DATA_MAX_BYTES);
      expect(parseCallbackData(data)).toEqual({ action: 'nav', target });
    }
  });

  it('onboarding y privacidad: ida y vuelta, y el paso más largo cabe', () => {
    for (const action of [
      { action: 'ob', step: 'pre_activity_screening', value: 'q7_yes' },
      { action: 'pv', value: 'decline' },
    ] as const) {
      const data = encodeCallbackData(action);
      expect(new TextEncoder().encode(data).length).toBeLessThanOrEqual(CALLBACK_DATA_MAX_BYTES);
      expect(parseCallbackData(data)).toEqual(action);
    }
    expect(() => encodeCallbackData({ action: 'pv', value: 'Con Espacio' })).toThrow();
  });

  it('rechaza otra versión, otra acción u otro destino', () => {
    for (const data of [
      'v2:nav:today',
      'v1:xyz:today',
      'v1:nav:gym',
      'v1:nav:today:x',
      'v1:ob:paso_falso:yes',
      'v1:ob:age',
      'v1:pv:a:b',
      '',
      'basura',
    ]) {
      expect(parseCallbackData(data)).toBeNull();
    }
  });
});
