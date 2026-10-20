import { describe, expect, it } from 'vitest';
import {
  PARQ_FORM_URL,
  SCOFF_QUESTION_TEMPLATE_IDS,
  renderFoodBodyPositive,
  renderPreActivityPrompt,
  templateById,
} from './index.js';
import { readTable, readVault } from './test-utils/vault.js';

const screeningsMd = readVault('output/sdd/contenido/tamizajes.md');

describe('RN-SEG-002 · el PAR-Q+ va por enlace (tamizajes §1)', () => {
  it('el enlace del código es el de la bóveda', () => {
    expect(screeningsMd).toContain(PARQ_FORM_URL);
  });
  it('TZ-01 lleva el enlace y los tres resultados posibles, sin copiar las preguntas (F97)', () => {
    expect(renderPreActivityPrompt()).toContain(PARQ_FORM_URL);
    expect(templateById('TZ-01').buttons).toEqual(['Todo NO', 'Algún SÍ', 'No lo hice']);
    expect(renderPreActivityPrompt()).not.toMatch(/médico le ha comunicado|dolor en el pecho/);
  });
  it('con algún SÍ se ofrece confirmar la autorización (HU-009-2)', () => {
    expect(templateById('TZ-02').buttons).toEqual(['Ya tengo autorización']);
  });
});

describe('RN-SEG-003 · las preguntas del SCOFF son las de la bóveda (tamizajes §2)', () => {
  const rows = readTable(screeningsMd, /^## 2\./);
  it('cinco preguntas, cada una con [Sí] [No]', () => {
    expect(rows).toHaveLength(SCOFF_QUESTION_TEMPLATE_IDS.length);
    for (const id of SCOFF_QUESTION_TEMPLATE_IDS) {
      expect(templateById(id).buttons).toEqual(['Sí', 'No']);
    }
  });
  it.each(SCOFF_QUESTION_TEMPLATE_IDS.map((id, index) => ({ id, index })))(
    '$id = pregunta $index de la tabla',
    ({ id, index }) => {
      const expected = Object.values(rows[index] ?? {})[1];
      expect(templateById(id).text).toBe(`${index + 1}/5 · ${expected}`);
    },
  );
  it('el resultado positivo (TZ-11) lleva el recurso de ayuda verificado y no deja llaves', () => {
    const text = renderFoodBodyPositive();
    expect(text).toMatch(/Línea 106/);
    expect(text).not.toMatch(/[{}]/);
  });
});
