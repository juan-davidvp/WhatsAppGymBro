import { z } from 'zod';
import { achievementSchema, levelSchema } from './schemas.js';

/**
 * Niveles y logros transcritos de
 * `vault/output/sdd/contenido/catalogo-de-logros-y-niveles.md` (v0.1.0).
 * Nombres de niveles pendientes de validación con usuarios (H1).
 * Los umbrales de XP deben coincidir con P-040 (`content.test.ts` lo comprueba).
 */
export const LEVELS = z
  .array(levelSchema)
  .length(10)
  .parse([
    { number: 1, code: 'L1', name: 'Arranque', xpThreshold: 0 },
    { number: 2, code: 'L2', name: 'En marcha', xpThreshold: 300 },
    { number: 3, code: 'L3', name: 'Constante', xpThreshold: 900 },
    { number: 4, code: 'L4', name: 'Firme', xpThreshold: 1800 },
    { number: 5, code: 'L5', name: 'Disciplinado', xpThreshold: 3000 },
    { number: 6, code: 'L6', name: 'Inquebrantable', xpThreshold: 4500 },
    { number: 7, code: 'L7', name: 'De hierro', xpThreshold: 6500 },
    { number: 8, code: 'L8', name: 'De acero', xpThreshold: 9000 },
    { number: 9, code: 'L9', name: 'Titán', xpThreshold: 12000 },
    { number: 10, code: 'L10', name: 'Leyenda', xpThreshold: 16000 },
  ]);

/** RN-GAM-011: los logros se guardan en la bitácora y no se borran. */
export const ACHIEVEMENTS = z.array(achievementSchema).parse([
  {
    code: 'FIRST_SESSION',
    name: 'Primer día',
    condition: 'Primera sesión completada',
    storedData: 'Fecha, versión',
  },
  {
    code: 'FIRST_HOME',
    name: 'En casa también',
    condition: 'Primera sesión B o C completada',
    storedData: 'Fecha',
  },
  {
    code: 'FIRST_COMPLETE_DAY',
    name: 'Día completo',
    condition: 'Primer día con ambas mitades',
    storedData: 'Fecha',
  },
  {
    code: 'CH66_7',
    name: 'Capítulo 1',
    condition: '7 días que cuentan acumulados',
    storedData: 'Fecha',
  },
  {
    code: 'CH66_21',
    name: 'Capítulo 2',
    condition: '21 días que cuentan acumulados',
    storedData: 'Fecha',
  },
  {
    code: 'CH66_45',
    name: 'Capítulo 3',
    condition: '45 días que cuentan acumulados',
    storedData: 'Fecha',
  },
  {
    code: 'CH66_66',
    name: 'Hábito forjado',
    condition: '66 días que cuentan acumulados (`F45`)',
    storedData: 'Fecha, semanas transcurridas',
  },
  {
    code: 'DQC_100',
    name: 'Centenario',
    condition: 'Días que cuentan acumulados',
    storedData: 'Fecha',
  },
  {
    code: 'DQC_200',
    name: 'Doble centenario',
    condition: 'Días que cuentan acumulados',
    storedData: 'Fecha',
  },
  {
    code: 'DQC_365',
    name: 'Un año de días',
    condition: 'Días que cuentan acumulados',
    storedData: 'Fecha',
  },
  {
    code: 'WEEK_1',
    name: 'Primera semana cumplida',
    condition: 'Primera semana cumplida',
    storedData: 'Fecha',
  },
  {
    code: 'WEEKS_4',
    name: 'Mes sólido',
    condition: 'Semanas cumplidas seguidas',
    storedData: 'Fecha',
  },
  {
    code: 'WEEKS_12',
    name: 'Trimestre sólido',
    condition: 'Semanas cumplidas seguidas',
    storedData: 'Fecha',
  },
  {
    code: 'FIRST_PR',
    name: 'Primer récord',
    condition: 'Primer récord personal',
    storedData: 'Ejercicio, valor',
  },
  { code: 'PR_10', name: 'Diez récords', condition: '10 récords personales', storedData: 'Fecha' },
  {
    code: 'COMEBACK',
    name: 'El regreso',
    condition: 'Primer día que cuenta tras 7+ días sin actividad',
    storedData: 'Fecha, días de pausa',
  },
  {
    code: 'STREAK_REPAIRED',
    name: 'Reparado',
    condition: 'Primera racha reparada',
    storedData: 'Fecha',
  },
  {
    code: 'PROTEIN_WEEK',
    name: 'Semana de proteína',
    condition: '7 días seguidos con la mitad de comida',
    storedData: 'Fecha',
  },
  {
    code: 'BEST_WEEK',
    name: 'Mejor semana',
    condition: 'Nueva mejor semana en días que cuentan',
    storedData: 'Valor',
  },
  {
    code: 'GOAL_DONE',
    name: 'Sí era posible',
    condition: 'Objetivo cumplido',
    storedData: 'Resumen del capítulo',
  },
  {
    code: 'MAINTENANCE_4W',
    name: 'Sostener también es ganar',
    condition: '4 semanas cumplidas en mantenimiento',
    storedData: 'Fecha',
  },
  {
    code: 'SEASON_DONE',
    name: 'Temporada cerrada',
    condition: 'Cierre de una temporada con su meta',
    storedData: 'Temporada',
  },
  {
    code: 'SKILL_PULLUP',
    name: 'Primera dominada',
    condition: 'Habilidad de maestría registrada (mantenimiento)',
    storedData: 'Fecha',
  },
]);
