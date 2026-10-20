/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PARAMETERS } from '../config/parameters.js';
import {
  assertUserConfigurable,
  canCreateProfile,
  foodBodyScreeningOutcome,
  isGameMechanicsPausedOn,
  isScoffPositive,
  HARD_PARAMETER_CODES,
  imagePolicy,
  overuseSignal,
  painOutcome,
  preActivityScreeningOutcome,
  routeFreeText,
  validatePortionEstimate,
} from './safety.js';

const S = PARAMETERS.safety;

describe('RN-SEG-001 · solo mayores de edad', () => {
  it('crea el perfil solo si declara ser mayor de edad', () => {
    expect(canCreateProfile({ declaredAdult: true })).toBe(true);
    expect(canCreateProfile({ declaredAdult: false })).toBe(false);
    expect(canCreateProfile({ declaredAdult: null })).toBe(false);
  });
});

describe('RN-SEG-002 · tamizaje previo a la actividad (PAR-Q+ por enlace)', () => {
  it('algún SÍ: recomienda consulta, arranca suave y se guarda como flag', () => {
    expect(
      preActivityScreeningOutcome({ report: 'some_yes', authorizationConfirmed: false }),
    ).toEqual({ result: 'flag', recommendMedicalConsult: true, planIntensity: 'low' });
  });

  it('con la autorización confirmada vuelve a la intensidad normal', () => {
    expect(
      preActivityScreeningOutcome({ report: 'some_yes', authorizationConfirmed: true })
        .planIntensity,
    ).toBe('normal');
  });

  it('todo NO: intensidad normal, sin recomendación, se guarda como clear', () => {
    expect(
      preActivityScreeningOutcome({ report: 'all_no', authorizationConfirmed: false }),
    ).toEqual({ result: 'clear', recommendMedicalConsult: false, planIntensity: 'normal' });
  });

  it('sin hacerlo: arranca suave y no hay resultado que guardar', () => {
    expect(
      preActivityScreeningOutcome({ report: 'not_done', authorizationConfirmed: false }),
    ).toEqual({ result: null, recommendMedicalConsult: false, planIntensity: 'low' });
  });
});

describe('RN-SEG-003 · SCOFF positivo con P-082 o más "sí"', () => {
  it('por debajo del punto de corte es negativo; en el punto de corte, positivo', () => {
    const cut = PARAMETERS.safety.scoffPositiveMinYes;
    expect(isScoffPositive(cut - 1)).toBe(false);
    expect(isScoffPositive(cut)).toBe(true);
    expect(isScoffPositive(5)).toBe(true);
    expect(isScoffPositive(0)).toBe(false);
  });
  it('rechaza cuentas inválidas', () => {
    expect(() => isScoffPositive(-1)).toThrow('RN-SEG-003');
    expect(() => isScoffPositive(1.5)).toThrow('RN-SEG-003');
  });
});

describe('RN-SEG-003 · tamizaje de relación con la comida y el cuerpo', () => {
  it('positivo: modo sin números, recursos profesionales y sin objetivos de pérdida de peso', () => {
    const outcome = foodBodyScreeningOutcome(true);
    expect(outcome.numberFreeMode).toBe(true);
    expect(outcome.showProfessionalResources).toBe(true);
    expect(outcome.allowedGoalTypes).not.toContain('lose_fat');
  });

  it('negativo: todos los objetivos disponibles', () => {
    expect(foodBodyScreeningOutcome(false).allowedGoalTypes).toContain('lose_fat');
  });
});

describe('RN-SEG-004 · los límites duros no son configurables', () => {
  const vault = readFileSync(
    fileURLToPath(new URL('../../../../../vault/output/sdd/parametros.md', import.meta.url)),
    'utf8',
  );
  const hardInVault = vault
    .split('\n')
    .filter((line) => /^\|\s*P-\d{3}\s*\|/.test(line))
    .map((line) => line.split('|').map((c) => c.trim()))
    .filter((cells) => (cells[6] ?? '').startsWith('Sí'))
    .map((cells) => (cells[2] ?? '').replaceAll('`', ''));

  it('la lista de duros coincide con la columna "Duro" de parametros.md', () => {
    expect([...HARD_PARAMETER_CODES].sort()).toEqual(hardInVault.sort());
  });

  it('rechaza configurar un duro y acepta uno configurable (horas de silencio)', () => {
    expect(() => assertUserConfigurable('goal.maxWeeklyLossPct')).toThrow('RN-SEG-004');
    expect(() => assertUserConfigurable('messages.quietHours')).not.toThrow();
  });
});

const CATALOG = [
  { category: 'distress', expressions: ['me quiero morir'] },
  { category: 'substances', expressions: ['esteroides', 'creatina'] },
] as const;

describe('RN-SEG-005 · nunca se recomiendan sustancias: la pregunta va a la respuesta de cuidado', () => {
  it('preguntar por esteroides o suplementos lleva a la ruta de cuidado de sustancias', () => {
    expect(routeFreeText('¿qué esteroides me recomiendas?', CATALOG)).toEqual({
      route: 'care',
      category: 'substances',
      pauseGameMechanicsToday: true,
    });
    expect(routeFreeText('¿cuánta creatina tomo?', CATALOG)).toMatchObject({
      route: 'care',
      category: 'substances',
    });
  });
});

describe('RN-SEG-006 · dolor en un ejercicio', () => {
  it('detiene la progresión y ofrece variante', () => {
    expect(painOutcome(['s1'])).toEqual({
      stopProgression: true,
      offerVariant: true,
      recommendProfessional: false,
    });
  });

  it(`si se repite en P-062 (${S.painSessionsToRefer}) sesiones recomienda consulta profesional`, () => {
    const sessions = Array.from({ length: S.painSessionsToRefer }, (_, i) => `s${i}`);
    expect(painOutcome(sessions).recommendProfessional).toBe(true);
    expect(painOutcome(['s1', 's1']).recommendProfessional).toBe(S.painSessionsToRefer <= 1);
  });
});

describe('RN-SEG-007 · el texto libre pasa por el detector antes que cualquier otra ruta', () => {
  it('con señal: ruta de cuidado y mecánicas de juego en pausa ese día', () => {
    expect(routeFreeText('a veces me quiero morir', CATALOG)).toEqual({
      route: 'care',
      category: 'distress',
      pauseGameMechanicsToday: true,
    });
  });

  it('sin señal: sigue la ruta normal del dominio', () => {
    expect(routeFreeText('2 huevos y una arepa', CATALOG)).toEqual({ route: 'domain' });
  });
});

describe('RN-SEG-008 · sobreuso', () => {
  it(`más de P-063 (${S.maxSessionsPerDay}) sesiones en un día`, () => {
    expect(overuseSignal({ sessionsToday: S.maxSessionsPerDay + 1, recentWeeks: [] })).toBe(true);
    expect(overuseSignal({ sessionsToday: S.maxSessionsPerDay, recentWeeks: [] })).toBe(false);
  });

  it(`entrenar todos los días de descanso P-064 (${S.weeksTrainingAllRestDays}) semanas seguidas`, () => {
    const all = { restDaysPlanned: 2, restDaysTrained: 2 };
    const some = { restDaysPlanned: 2, restDaysTrained: 1 };
    expect(
      overuseSignal({ sessionsToday: 0, recentWeeks: Array(S.weeksTrainingAllRestDays).fill(all) }),
    ).toBe(true);
    expect(
      overuseSignal({
        sessionsToday: 0,
        recentWeeks: [...Array(S.weeksTrainingAllRestDays - 1).fill(all), some],
      }),
    ).toBe(false);
  });
});

describe('RN-SEG-009 · no se piden ni se guardan fotos del cuerpo', () => {
  it('solo se aceptan fotos de comida y ninguna se guarda', () => {
    expect(imagePolicy('meal')).toEqual({ accept: true, store: false });
    expect(imagePolicy('body')).toEqual({ accept: false, store: false });
    expect(imagePolicy('other').accept).toBe(false);
  });
});

describe('RN-SEG-010 · la IA solo devuelve estructuras validadas', () => {
  const valid = {
    components: ['arroz', 'pollo'],
    portions: { PALM: 1, CUPPED_HAND: 1.5 },
    confidence: 0.7,
  };

  it('acepta componentes, porciones y confianza', () => {
    expect(validatePortionEstimate(valid)).toEqual(valid);
  });

  it('descarta cualquier texto de recomendación u otro campo de más', () => {
    expect(validatePortionEstimate({ ...valid, advice: 'come menos carbohidratos' })).toBeNull();
    expect(validatePortionEstimate({ ...valid, calories: 650 })).toBeNull();
  });

  it('descarta valores fuera de rango o mal tipados', () => {
    expect(validatePortionEstimate({ ...valid, confidence: 1.5 })).toBeNull();
    expect(validatePortionEstimate({ ...valid, portions: { PALM: -1 } })).toBeNull();
    expect(validatePortionEstimate({ ...valid, portions: { SPOON: 1 } })).toBeNull();
    expect(validatePortionEstimate('come pollo')).toBeNull();
  });
});

describe('RN-SEG-007 · las mecánicas de juego se pausan el día operativo de la señal', () => {
  const tz = 'America/Bogota';
  it('una señal a las 23:00 pausa ese día; otra a las 02:00 cuenta para el día anterior (P-029)', () => {
    const at23 = new Date('2026-10-20T04:00:00Z'); // 2026-10-19 23:00 en Bogotá
    expect(isGameMechanicsPausedOn('2026-10-19', [at23], tz)).toBe(true);
    const at02 = new Date('2026-10-20T07:00:00Z'); // 2026-10-20 02:00 en Bogotá
    expect(isGameMechanicsPausedOn('2026-10-19', [at02], tz)).toBe(true);
    expect(isGameMechanicsPausedOn('2026-10-20', [at02], tz)).toBe(false);
  });
  it('sin señales no hay pausa', () => {
    expect(isGameMechanicsPausedOn('2026-10-19', [], tz)).toBe(false);
  });
});
