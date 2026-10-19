/**
 * Parámetros del dominio: réplica exacta de `vault/output/sdd/parametros.md`.
 *
 * - Única fuente de números en el código (constitución VII). Cambiar un valor =
 *   cambiar la tabla de la bóveda y este archivo en el mismo commit (`/cambiar-regla`).
 * - Cada clave lleva encima su `P-###`, las reglas que lo usan y `[V]` si está
 *   pendiente de validación profesional. `parameters.test.ts` compara ambos lados.
 * - Unidades iguales a las de la bóveda: semanas, días, horas, minutos, kg, %
 *   (como número entero o decimal, no como fracción, salvo donde la bóveda usa fracción).
 * - Horas como 'HH:MM' en la zona horaria del usuario; días de la semana en inglés.
 */
export const PARAMETERS = {
  goal: {
    /** P-001 · RN-OBJ-003 · semanas */
    horizonWeeksDefault: 12,
    /** P-002 · RN-OBJ-003 · duro · semanas */
    horizonWeeksMin: 4,
    /** P-003 · RN-OBJ-003 · duro · semanas */
    horizonWeeksMax: 24,
    /** P-004 · RN-OBJ-004 · duro · [V] · % del peso por semana */
    maxWeeklyLossPct: 1.0,
    /** P-005 · RN-OBJ-004 · duro · [V] · % del peso por semana */
    maxWeeklyGainPct: 0.5,
    /** P-006 · RN-OBJ-005 · duro · [V] · IMC */
    minTargetBmi: 18.5,
    /** P-007 · RN-OBJ-006 · semanas */
    weeksToSustainTarget: 2,
    /** P-008 · RN-OBJ-010 · duro */
    movingAverageDays: { days: 7, minEntries: 3 },
    /** P-057 · RN-OBJ-009, RN-OBJ-013 · semanas */
    phaseReviewWeeks: 4,
  },
  maintenance: {
    /** P-009 · RN-MAN-001 · días */
    daysToChooseAfterGoal: 7,
    /** P-010 · RN-MAN-002 · [V] · sesiones por semana */
    minWeeklySessions: 2,
    /** P-011 · RN-MAN-002 · [V] · ± % alrededor del peso de mantenimiento */
    bandPct: 2,
    /** P-012 · RN-MAN-003 · semanas */
    weeksOutOfBandAlert: 2,
  },
  plan: {
    /** P-013 · RN-PLAN-003 · minutos */
    expressMinutes: 15,
    /** P-014 · RN-PLAN-004 · [V] */
    splitByDays: {
      splits: [
        { days: 2, split: 'full_body', sessions: ['A', 'B'] },
        { days: 3, split: 'full_body', sessions: ['A', 'B', 'C'] },
        { days: 4, split: 'upper_lower', times: 2 },
        { days: 5, split: 'upper_lower_plus_full_body' },
        { days: 6, split: 'push_pull_legs', times: 2 },
      ],
      intermediateOnlyDays: [5, 6],
    },
    /** P-015 · RN-PLAN-005 · [V] · series por músculo y semana */
    weeklySetsPerMuscle: {
      novice: { min: 6, max: 10 },
      intermediate: { min: 10, max: 16 },
    },
    /** P-016 · RN-PLAN-005 · [V] · repeticiones */
    repRangesByGoal: {
      muscleFatLossRecomposition: { min: 6, max: 15 },
      strength: {
        compound: { min: 3, max: 6 },
        accessory: { min: 8, max: 12 },
      },
      home: {
        reps: { min: 8, max: 20 },
        repsInReserve: { min: 1, max: 3 },
      },
    },
    /** P-017 · RN-PLAN-008 · duro · [V] · días */
    minRestDaysPerWeek: 1,
    /** P-018 · RN-PLAN-008 · duro · [V] · días */
    noviceMaxConsecutiveDays: 3,
  },
  training: {
    /** P-019 · RN-ENT-002 · [V] · sesiones */
    sessionsAtTopToProgress: 2,
    /** P-020 · RN-ENT-002 · [V] · kg */
    upperBodyIncrementKg: 2.5,
    /** P-021 · RN-ENT-002 · [V] · kg */
    lowerBodyIncrementKg: 5,
    /** P-022 · RN-ENT-003 · sesiones */
    plateauSessions: 3,
    /** P-023 · RN-ENT-004 · fracción de series completadas */
    minSetFractionCompleted: 0.67,
    /** P-024 · RN-ENT-005 · repeticiones */
    e1rmMaxReps: 10,
    /** P-025 · RN-ENT-006 · minutos */
    importedActivityMinMinutes: 20,
  },
  nutrition: {
    /** P-026 · RN-NUT-002 · [V] · g por kg y día */
    proteinGPerKg: 1.6,
    /** P-027 · RN-NUT-002 · [V] · g */
    proteinGPerPalm: 25,
    /** P-028 · RN-NUT-003 · % de la meta de proteína */
    halfThresholdPct: 80,
    /** P-072 · RN-NUT-003 · comidas con al menos una palma (modo sin números) */
    numberFreeMealsWithProtein: 3,
  },
  day: {
    /** P-029 · RN-DQC-001 · duro · hora local de cierre del día operativo */
    cutoffTime: '03:00',
    /** P-030 · RN-DQC-005 · duro · hora local del día siguiente */
    loggingGraceUntil: { time: '12:00', nextDay: true },
    /** P-031 · RN-DQC-003 · [V] · pasos */
    restMinSteps: 6000,
    /** P-032 · RN-DQC-003 · minutos */
    restMobilityMinutes: 10,
  },
  streak: {
    /** P-033 · RN-GAM-002 · duro · días que cuentan */
    freezeEveryCountedDays: 7,
    /** P-034 · RN-GAM-002 · duro */
    maxFreezes: 2,
    /** P-035 · RN-GAM-003 · duro · horas */
    repairWindowHours: 48,
    /** P-036 · RN-GAM-003 · duro · días */
    repairCooldownDays: 30,
  },
  week: {
    /** P-037 · RN-GAM-004 · sesiones de tolerancia si las planificadas son ≥ minPlannedSessions */
    commitmentTolerance: { tolerance: 1, minPlannedSessions: 3 },
    /** P-070 · RN-GAM-004 · duro */
    startDay: 'monday',
  },
  xp: {
    /** P-038 · RN-GAM-005, RN-GAM-013 · duro · XP por evento (sesión por SessionVariant) */
    table: {
      session: { GYM: 50, HOME: 50, EXPRESS: 30 },
      restMission: 20,
      nutritionHalf: 15,
      completeDayBonus: 20,
      personalRecord: 25,
      comebackBonus: 30,
      weeklyQuest: 40,
      fulfilledWeek: 100,
    },
    /** P-039 · RN-GAM-005 · duro · XP por día */
    dailyCap: 150,
  },
  levels: {
    /** P-040 · RN-GAM-007 · duro · XP acumulado para entrar a cada uno de los 10 niveles */
    thresholds: [0, 300, 900, 1800, 3000, 4500, 6500, 9000, 12000, 16000],
  },
  quests: {
    /** P-041 · RN-GAM-008 · factor sobre el historial */
    difficultyFactor: 0.8,
  },
  season: {
    /** P-042 · RN-GAM-010 · semanas */
    weeks: 6,
  },
  challenge66: {
    /** P-043 · RN-GAM-012 · duro · días */
    days: 66,
    /** P-044 · RN-GAM-012 · días en que cierra cada capítulo */
    chapters: [7, 21, 45, 66],
  },
  messages: {
    /** P-045 · RN-MSJ-002 · duro · mensajes proactivos por Intensity */
    budget: {
      NORMAL: { perTrainingDay: 2, perRestDay: 1, perWeek: 8 },
      LOW: { perDay: 1, perWeek: 4 },
      HIGH: { perDay: 2, perWeek: 12 },
    },
    /** P-046 · RN-MSJ-003 · duro · horas */
    minGapHours: 3,
    /** P-047 · RN-MSJ-004 · valor por defecto; el usuario lo puede cambiar */
    quietHours: { start: '21:30', end: '07:00' },
    /** P-048 · RN-MSJ-005 · minutos */
    planReadyLeadMinutes: 60,
    /** P-049 · RN-MSJ-006 · sesiones */
    usualTimeSessions: 6,
    /** P-050 · RN-MSJ-007 · duro · mensajes ignorados seguidos */
    backoffIgnoredCount: 3,
    /** P-051 · RN-MSJ-007 · duro · días */
    backoffDays: 7,
    /** P-052 · RN-MSJ-008 · duro · días de entreno planificados sin cumplir */
    comebackAfterPlannedDays: 2,
    /** P-053 · RN-MSJ-008 · duro · días */
    inactivityPauseDays: 7,
    /** P-054 · RN-MSJ-008 · duro */
    maxReactivations: 3,
    /** P-055 · RN-MSJ-009 · semanas cumplidas */
    fadingAfterFulfilledWeeks: 8,
    /** P-056 · RN-MSJ-009 · fracción */
    planReadyMinActionRate: 0.5,
    /** P-058 · RN-MSJ-010 · duro · días */
    templateCooldownDays: 7,
    /** P-059 · RN-MSJ-013 · días */
    maxPauseDays: 14,
    /** P-060 · RN-MSJ-017 · hora local */
    weeklySummaryAt: { day: 'sunday', time: '19:00' },
    /** P-066 · RN-MSJ-016 · hora local */
    dayClosingAt: '20:00',
  },
  metrics: {
    /** P-067 · plan de medición · duro · horas */
    actionWindowHours: 2,
  },
  ingestion: {
    /** P-061 · RN-INT-004 · duro · minutos */
    duplicateWindowMinutes: 30,
  },
  safety: {
    /** P-062 · RN-SEG-006 · duro · [V] · sesiones */
    painSessionsToRefer: 2,
    /** P-063 · RN-SEG-008 · duro · [V] */
    maxSessionsPerDay: 2,
    /** P-064 · RN-SEG-008 · duro · [V] · semanas */
    weeksTrainingAllRestDays: 2,
    /** P-071 · RN-SEG-007 · duro · [V] · kcal por día (dieta de muy bajas calorías, F93) */
    veryLowCalorieDailyMax: 800,
  },
  data: {
    /** P-065 · RN-DAT-003 · duro · horas */
    deletionMaxHours: 24,
  },
  ai: {
    /** P-068 · costo (H13) · duro · [supuesto] */
    maxPhotoEstimatesPerDay: 6,
  },
  user: {
    /** P-069 · RN-DQC-001 · ADR-016 */
    defaultTimezone: 'America/Bogota',
  },
} as const;

export type Parameters = typeof PARAMETERS;
