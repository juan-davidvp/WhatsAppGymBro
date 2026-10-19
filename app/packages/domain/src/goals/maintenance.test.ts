import { describe, expect, it } from 'vitest';
import { PARAMETERS } from '../config/parameters.js';
import { addDays } from '../time/zoned.js';
import {
  enterMaintenance,
  maintenanceDecision,
  maintenanceOutOfBandAlert,
  messageIntensityOnMaintenance,
  seasonKind,
} from './maintenance.js';

const M = PARAMETERS.maintenance;
const DONE = '2026-10-19';

describe('RN-MAN-001 · al cumplir se ofrece mantener o nueva fase; sin respuesta en P-009 días, mantenimiento', () => {
  it('respeta la elección del usuario', () => {
    expect(maintenanceDecision({ achievedOn: DONE, today: DONE, choice: 'maintain' })).toBe(
      'maintenance',
    );
    expect(maintenanceDecision({ achievedOn: DONE, today: DONE, choice: 'new_phase' })).toBe(
      'new_phase',
    );
  });

  it('sin respuesta espera P-009 días y luego activa el mantenimiento', () => {
    const wait = M.daysToChooseAfterGoal;
    expect(
      maintenanceDecision({ achievedOn: DONE, today: addDays(DONE, wait - 1), choice: null }),
    ).toBe('pending');
    expect(
      maintenanceDecision({ achievedOn: DONE, today: addDays(DONE, wait), choice: null }),
    ).toBe('maintenance');
  });
});

describe('RN-MAN-002 · compromiso mínimo, proteína y banda de peso', () => {
  it('fija P-010 sesiones, conserva la meta de proteína y la banda ± P-011 % de la media de entrada', () => {
    const state = enterMaintenance({ entryMovingAvgKg: 75, proteinTargetG: 120 });
    expect(state.minWeeklySessions).toBe(M.minWeeklySessions);
    expect(state.proteinTargetG).toBe(120);
    expect(state.band.lowKg).toBeCloseTo(75 * (1 - M.bandPct / 100), 9);
    expect(state.band.highKg).toBeCloseTo(75 * (1 + M.bandPct / 100), 9);
  });
});

describe('RN-MAN-003 · aviso si la media sale de la banda P-012 semanas seguidas', () => {
  const band = enterMaintenance({ entryMovingAvgKg: 75, proteinTargetG: 120 }).band;
  const outside = band.highKg + 0.5;
  const inside = 75;
  const weeks = M.weeksOutOfBandAlert;

  it(`avisa con ${weeks} semanas seguidas fuera`, () => {
    expect(maintenanceOutOfBandAlert(Array(weeks).fill(outside), band)).toBe(true);
  });

  it('no avisa si alguna de las últimas semanas volvió a la banda, ni con menos semanas', () => {
    expect(maintenanceOutOfBandAlert([...Array(weeks - 1).fill(outside), inside], band)).toBe(
      false,
    );
    expect(maintenanceOutOfBandAlert(Array(weeks - 1).fill(outside), band)).toBe(false);
  });

  it('las semanas sin media (sin registros) no cuentan como fuera de la banda', () => {
    expect(maintenanceOutOfBandAlert([outside, null], band)).toBe(false);
  });
});

describe('RN-MAN-004 · en mantenimiento las temporadas son de maestría', () => {
  it('cambia el tipo de temporada', () => {
    expect(seasonKind(true)).toBe('mastery');
    expect(seasonKind(false)).toBe('standard');
  });
});

describe('RN-MAN-005 · al entrar en mantenimiento la intensidad pasa a Baja salvo elección del usuario', () => {
  it('Baja por defecto; respeta la elegida', () => {
    expect(messageIntensityOnMaintenance(null)).toBe('LOW');
    expect(messageIntensityOnMaintenance('HIGH')).toBe('HIGH');
  });
});
