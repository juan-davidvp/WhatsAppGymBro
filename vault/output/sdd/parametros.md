---
titulo: Parámetros configurables
tipo: sdd-parametros
hito: H3
estado: en-revision
version: 0.4.0
creado: 2026-10-18
actualizado: 2026-10-19
deriva_de: [reglas-de-negocio, objetivos-y-progreso, sistema-de-gamificacion, proactividad-sin-spam, fundamentos-de-entrenamiento, relacion-comida-entreno]
fuentes: [F39, F45, F50, F52, F55, F56, F57, F58, F59, F93, F94, F95, F99]
relacionados: [reglas-de-negocio, plan-tecnico, estrategia-de-pruebas]
---

# Parámetros

> **Todos los valores numéricos del dominio viven aquí** y en un único archivo de código (`app/packages/domain/src/config/parameters.ts`) que replica esta tabla. Cambiar un valor = cambiar esta tabla + ese archivo en el mismo commit. **Duro** = el usuario no puede cambiarlo (RN-SEG-004). `[V]` = `[VALIDAR-PROFESIONAL]`.

## Objetivos y mantenimiento

| ID | Código | Valor | Rango | Reglas | Duro | Validación |
|---|---|---|---|---|---|---|
| P-001 | `goal.horizonWeeksDefault` | 12 semanas | 4–24 | RN-OBJ-003 | No | — |
| P-002 | `goal.horizonWeeksMin` | 4 semanas | — | RN-OBJ-003 | Sí | — |
| P-003 | `goal.horizonWeeksMax` | 24 semanas | — | RN-OBJ-003 | Sí | — |
| P-004 | `goal.maxWeeklyLossPct` | 1,0 % del peso | 0,5–1,0 | RN-OBJ-004 | Sí | [V] (`F58`) |
| P-005 | `goal.maxWeeklyGainPct` | 0,5 % del peso | 0,25–0,5 | RN-OBJ-004 | Sí | [V] (`F59`) |
| P-006 | `goal.minTargetBmi` | 18,5 | — | RN-OBJ-005 | Sí | [V] |
| P-007 | `goal.weeksToSustainTarget` | 2 semanas | 1–4 | RN-OBJ-006 | No | — |
| P-008 | `goal.movingAverageDays` | 7 días (mín. 3 registros) | — | RN-OBJ-010 | Sí | — |
| P-009 | `maintenance.daysToChooseAfterGoal` | 7 días | 3–14 | RN-MAN-001 | No | — |
| P-010 | `maintenance.minWeeklySessions` | 2 sesiones | 1–3 | RN-MAN-002 | No | [V] (`F52`, `F39`) |
| P-011 | `maintenance.bandPct` | ± 2 % | 1–3 | RN-MAN-002 | No | [V] |
| P-012 | `maintenance.weeksOutOfBandAlert` | 2 semanas | — | RN-MAN-003 | No | — |
| P-057 | `goal.phaseReviewWeeks` | 4 semanas | — | RN-OBJ-009, RN-OBJ-013 | No | — |

## Plan y entrenamiento

| ID | Código | Valor | Rango | Reglas | Duro | Validación |
|---|---|---|---|---|---|---|
| P-013 | `plan.expressMinutes` | 15 min | 15–20 | RN-PLAN-003 | No | — |
| P-014 | `plan.splitByDays` | 2: cuerpo completo A/B · 3: cuerpo completo A/B/C · 4: torso/pierna ×2 · 5: torso/pierna + cuerpo completo · 6: empuje/tirón/pierna ×2 (5–6 solo intermedio) | — | RN-PLAN-004 | No | [V] |
| P-015 | `plan.weeklySetsPerMuscle` | Novato 6–10 · intermedio 10–16 | — | RN-PLAN-005 | No | [V] (`F55`) |
| P-016 | `plan.repRangesByGoal` | Músculo/grasa/recomposición 6–15 · fuerza 3–6 en básicos + 8–12 accesorios · casa: 8–20 cerca del fallo (1–3 en reserva) | — | RN-PLAN-005 | No | [V] |
| P-017 | `plan.minRestDaysPerWeek` | 1 | — | RN-PLAN-008 | Sí | [V] |
| P-018 | `plan.noviceMaxConsecutiveDays` | 3 | — | RN-PLAN-008 | Sí | [V] |
| P-074 | `plan.availableDaysRange` | 2–6 días | — | RN-PLAN-001 | No | — |
| P-075 | `plan.sessionMinutesRange` | 20–90 min | — | RN-PLAN-001 | No | — |
| P-076 | `plan.warmupMinutes` | 5 min | — | RN-PLAN-006 | No | [V] `[supuesto]` |
| P-077 | `plan.setSeconds` | 40 s | — | RN-PLAN-006 | No | [V] (igual al trabajo de P-079) |
| P-078 | `plan.restSecondsByGoal` | Músculo/grasa/recomposición y accesorios 90 s · fuerza en básicos 180 s | — | RN-PLAN-006 | No | [V] (`F94`, `F95`) |
| P-079 | `plan.expressCircuit` | 3 rondas · 40 s de trabajo · 20 s de pausa · 60 s entre rondas | — | RN-PLAN-003, RN-PLAN-006 | No | [V] ([[catalogo-de-ejercicios-base]] §4) |
| P-019 | `training.sessionsAtTopToProgress` | 2 sesiones | 1–3 | RN-ENT-002 | No | [V] |
| P-020 | `training.upperBodyIncrementKg` | 2,5 kg | — | RN-ENT-002 | No | [V] |
| P-021 | `training.lowerBodyIncrementKg` | 5 kg | 2,5–5 | RN-ENT-002 | No | [V] |
| P-022 | `training.plateauSessions` | 3 sesiones | — | RN-ENT-003 | No | — |
| P-023 | `training.minSetFractionCompleted` | 0,67 | — | RN-ENT-004 | No | — |
| P-024 | `training.e1rmMaxReps` | 10 repeticiones | — | RN-ENT-005 | No | — |
| P-025 | `training.importedActivityMinMinutes` | 20 min | 15–30 | RN-ENT-006 | No | — |

## Nutrición

| ID | Código | Valor | Rango | Reglas | Duro | Validación |
|---|---|---|---|---|---|---|
| P-026 | `nutrition.proteinGPerKg` | 1,6 g/kg/día | 1,4–2,2 | RN-NUT-002 | No | [V] (`F56`, `F57`) |
| P-027 | `nutrition.proteinGPerPalm` | 25 g | 20–30 | RN-NUT-002 | No | [V] |
| P-028 | `nutrition.halfThresholdPct` | 80 % | 70–100 | RN-NUT-003 | No | — |
| P-072 | `nutrition.numberFreeMealsWithProtein` | 3 comidas | — | RN-NUT-003 | No | — |

## Día que cuenta y gamificación

| ID | Código | Valor | Rango | Reglas | Duro | Validación |
|---|---|---|---|---|---|---|
| P-029 | `day.cutoffTime` | 03:00 | — | RN-DQC-001 | Sí | — |
| P-030 | `day.loggingGraceUntil` | 12:00 del día siguiente | — | RN-DQC-005 | Sí | — |
| P-031 | `day.restMinSteps` | 6.000 pasos | — | RN-DQC-003 | No | [V] |
| P-032 | `day.restMobilityMinutes` | 10 min | — | RN-DQC-003 | No | — |
| P-033 | `streak.freezeEveryCountedDays` | 7 | — | RN-GAM-002 | Sí | — |
| P-034 | `streak.maxFreezes` | 2 | — | RN-GAM-002 | Sí | — |
| P-035 | `streak.repairWindowHours` | 48 h | — | RN-GAM-003 | Sí | — |
| P-036 | `streak.repairCooldownDays` | 30 días | — | RN-GAM-003 | Sí | — |
| P-037 | `week.commitmentTolerance` | 1 (si planificadas ≥ 3) | 0–1 | RN-GAM-004 | No | — |
| P-038 | `xp.table` | Sesión A 50 · B 50 · C 30 · misión de descanso 20 · mitad de comida 15 · día completo +20 · récord 25 · regreso 30 · misión semanal 40 · semana cumplida 100 | — | RN-GAM-005, RN-GAM-013 | Sí | — |
| P-039 | `xp.dailyCap` | 150 | — | RN-GAM-005 | Sí | — |
| P-040 | `levels.thresholds` | 0 · 300 · 900 · 1.800 · 3.000 · 4.500 · 6.500 · 9.000 · 12.000 · 16.000 | — | RN-GAM-007 | Sí | — |
| P-041 | `quests.difficultyFactor` | 0,8 | 0,6–1,0 | RN-GAM-008 | No | — |
| P-042 | `season.weeks` | 6 | — | RN-GAM-010 | No | — |
| P-043 | `challenge66.days` | 66 | — | RN-GAM-012 | Sí | `F45` |
| P-044 | `challenge66.chapters` | 7 · 21 · 45 · 66 | — | RN-GAM-012 | No | — |
| P-070 | `week.startDay` | Lunes | — | RN-GAM-004 | Sí | — |

## Mensajes proactivos

| ID | Código | Valor | Rango | Reglas | Duro | Validación |
|---|---|---|---|---|---|---|
| P-045 | `messages.budget` | Normal: 2/día de entreno · 1/día de descanso · 8/semana · Baja: 1/día · 4/semana · Alta: 2/día · 12/semana | — | RN-MSJ-002 | Sí (el usuario elige la intensidad, no los números) | — |
| P-046 | `messages.minGapHours` | 3 h | — | RN-MSJ-003 | Sí | — |
| P-047 | `messages.quietHours` | 21:30–07:00 | Configurable | RN-MSJ-004 | No | — |
| P-048 | `messages.planReadyLeadMinutes` | 60 min | 30–120 | RN-MSJ-005 | No | — |
| P-049 | `messages.usualTimeSessions` | 6 sesiones | — | RN-MSJ-006 | No | — |
| P-050 | `messages.backoffIgnoredCount` | 3 | — | RN-MSJ-007 | Sí | — |
| P-051 | `messages.backoffDays` | 7 | — | RN-MSJ-007 | Sí | — |
| P-052 | `messages.comebackAfterPlannedDays` | 2 días de entreno | — | RN-MSJ-008 | Sí | — |
| P-053 | `messages.inactivityPauseDays` | 7 días | — | RN-MSJ-008 | Sí | — |
| P-054 | `messages.maxReactivations` | 3 | — | RN-MSJ-008 | Sí | — |
| P-055 | `messages.fadingAfterFulfilledWeeks` | 8 | — | RN-MSJ-009 | No | — |
| P-056 | `messages.planReadyMinActionRate` | 0,5 | — | RN-MSJ-009 | No | — |
| P-058 | `messages.templateCooldownDays` | 7 | — | RN-MSJ-010 | Sí | `F50` |
| P-059 | `messages.maxPauseDays` | 14 | — | RN-MSJ-013 | No | — |
| P-060 | `messages.weeklySummaryAt` | Domingo 19:00 | — | RN-MSJ-017 | No | — |
| P-066 | `messages.dayClosingAt` | 20:00 | — | RN-MSJ-016 | No | — |
| P-073 | `messages.dayClosingMaxTaps` | 2 toques | — | RN-MSJ-016 | No | — |
| P-067 | `metrics.actionWindowHours` | 2 h | — | [[plan-de-medicion]] | Sí | — |

## Integraciones, seguridad y datos

| ID | Código | Valor | Rango | Reglas | Duro | Validación |
|---|---|---|---|---|---|---|
| P-061 | `ingestion.duplicateWindowMinutes` | 30 min | — | RN-INT-004 | Sí | — |
| P-062 | `safety.painSessionsToRefer` | 2 sesiones | — | RN-SEG-006 | Sí | [V] |
| P-063 | `safety.maxSessionsPerDay` | 2 | — | RN-SEG-008 | Sí | [V] |
| P-064 | `safety.weeksTrainingAllRestDays` | 2 | — | RN-SEG-008 | Sí | [V] |
| P-065 | `data.deletionMaxHours` | 24 h | — | RN-DAT-003 | Sí | — |
| P-080 | `data.processedUpdatesTtlDays` | 7 días | — | [[modelo-de-datos]] §5 (idempotencia) | No | — |
| P-081 | `data.eventsRetentionMonths` | 12 meses | — | [[modelo-de-datos]] §5 | No | `[supuesto]` |
| P-068 | `ai.maxPhotoEstimatesPerDay` | 6 | — | Costo (H13) | Sí | `[supuesto]` |
| P-069 | `user.defaultTimezone` | America/Bogota | — | RN-DQC-001 | No | ADR-016 |
| P-071 | `safety.veryLowCalorieDailyMax` | 800 kcal/día | — | RN-SEG-007 | Sí | [V] (`F93`) |
| P-082 | `safety.scoffPositiveMinYes` | 2 respuestas "sí" | — | RN-SEG-003 | Sí | [V] (`F99`, `F101`) |
