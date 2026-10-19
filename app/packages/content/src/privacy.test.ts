import { PARAMETERS } from '@gymbro/domain';
import { describe, expect, it } from 'vitest';
import { renderTemplate, templateById } from './index.js';

describe('RN-DAT-002 · el aviso de privacidad (ON-02) dice lo que debe decir', () => {
  const { text, buttons } = templateById('ON-02');
  it('los datos son opcionales y para el plan', () => {
    expect(text).toMatch(/opcionales/);
    expect(text).toMatch(/plan/);
  });
  it('el chat se guarda en Telegram sin cifrado de extremo a extremo', () => {
    expect(text).toMatch(/Telegram/);
    expect(text).toMatch(/no es cifrado de extremo a extremo/);
  });
  it('la comida por foto o texto se envía a un servicio de IA', () => {
    expect(text).toMatch(/foto o texto/);
    expect(text).toMatch(/IA/);
  });
  it('HU-009-1 · ofrece aceptar, ver la política y no aceptar', () => {
    expect(buttons).toEqual(['Acepto', 'Ver política', 'No acepto']);
  });
});

describe('RN-DAT-003 · la política provisional (PV-01) cita el plazo de borrado P-065', () => {
  it('se rellena con P-065 y no deja llaves', () => {
    const text = renderTemplate('PV-01', { horas_borrado: PARAMETERS.data.deletionMaxHours });
    expect(text).toContain(`${PARAMETERS.data.deletionMaxHours} horas`);
    expect(text).not.toMatch(/[{}]/);
    expect(text).toMatch(/\/borrar_datos/);
    expect(text).toMatch(/no se guardan/);
  });
});

describe('T-030 · renderTemplate', () => {
  it('falla si falta una variable o sobra una', () => {
    expect(() => renderTemplate('PV-01')).toThrow('Falta {horas_borrado}');
    expect(() => renderTemplate('ON-01', { x: 1 })).toThrow('no usa: x');
  });
});
