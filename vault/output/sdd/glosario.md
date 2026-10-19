---
titulo: Glosario — lenguaje ubicuo de Gym Bro
tipo: sdd-glosario
hito: H3
estado: en-revision
version: 0.1.1
creado: 2026-10-18
actualizado: 2026-10-19
deriva_de: [propuesta-de-valor, cada-dia-cuenta, sistema-de-gamificacion, proactividad-sin-spam, objetivos-y-progreso]
fuentes: []
relacionados: [constitucion, reglas-de-negocio, modelo-de-datos]
---

# Glosario

> Un término significa **una sola cosa** en specs, código, mensajes y conversaciones con el PO. La columna "Código" es el identificador en inglés que se usa en el repositorio.

## Usuario y objetivo

| Término | Definición | Código | Regla |
|---|---|---|---|
| Usuario cabeza 01 | Segmento de la Fase 01: hombre de 18 a 32 años que entrena solo y ha abandonado antes | — | ADR-008 |
| Objetivo | Meta activa del usuario, de un tipo del catálogo, con métrica, valor inicial, meta y horizonte | `Goal` | RN-OBJ-001/002 |
| Tipo de objetivo | `ganar_musculo`, `perder_grasa`, `ganar_fuerza`, `recomposicion`, `ser_constante`, `mantener` | `GoalType`: `gain_muscle`, `lose_fat`, `gain_strength`, `recomposition`, `consistency`, `maintain` | RN-OBJ-001 |
| Horizonte | Duración de una fase del objetivo, en semanas | `horizonWeeks` | RN-OBJ-003 |
| Media móvil de peso | Promedio de los pesos de los últimos 7 días (mínimo 3 registros) | `weightMovingAvg` | RN-OBJ-010 |
| 1RM estimado (e1RM) | peso × (1 + repeticiones ÷ 30), solo con ≤ 10 repeticiones | `estimated1RM` | RN-ENT-005 |
| Progreso del objetivo | (actual − inicial) ÷ (meta − inicial), acotado 0–100 % | `goalProgress` | RN-OBJ-011 |
| Modo mantenimiento | Estado tras cumplir un objetivo: compromiso mínimo y banda de peso | `MaintenanceMode` | RN-MAN-001/002 |
| Banda de mantenimiento | ± 2 % del peso al entrar en mantenimiento | `maintenanceBand` | RN-MAN-002 |

## Plan y entrenamiento

| Término | Definición | Código | Regla |
|---|---|---|---|
| Hábito de entreno | Días, hora habitual y lugar en que el usuario suele entrenar | `TrainingHabit` | RN-PLAN-002 |
| Hora habitual | Mediana de la hora de inicio de las últimas 6 sesiones de ese día de la semana | `usualStartTime` | RN-MSJ-006 |
| Plan semanal | Sesiones planificadas de lunes a domingo | `WeeklyPlan` | RN-PLAN-001 |
| Sesión planificada | Sesión de un día con sus tres versiones | `PlannedSession` | RN-PLAN-003 |
| Versión A / B / C | Gym / casa / exprés (15–20 min) | `SessionVariant`: `GYM`, `HOME`, `EXPRESS` | RN-PLAN-003 |
| Patrón de movimiento | Sentadilla, bisagra, empuje y tirón horizontal y vertical, unilateral, núcleo | `MovementPattern` | RN-PLAN-010 |
| Sesión | Entrenamiento realizado (registrado) | `WorkoutSession` | RN-ENT-004 |
| Serie | Repeticiones y carga de un ejercicio en una sesión | `SetEntry` | RN-ENT-001 |
| La hice tal cual | Registrar en un toque toda la sesión como estaba planeada | `logSessionAsPlanned` | RN-ENT-001 |
| Progresión doble | Subir repeticiones hasta el tope del rango y luego subir la carga | `doubleProgression` | RN-ENT-002 |
| Récord personal (RP) | Nuevo máximo de e1RM o de repeticiones con el mismo peso | `PersonalRecord` | RN-ENT-005 |
| Actividad importada | Entreno o pasos llegados por integración | `ImportedActivity` | RN-ENT-006 |

## Nutrición

| Término | Definición | Código | Regla |
|---|---|---|---|
| Porciones con la mano | Palma (proteína), mano ahuecada (carbohidrato), puño (verdura), pulgar (grasa) | `HandPortion`: `PALM`, `CUPPED_HAND`, `FIST`, `THUMB` | RN-NUT-001 |
| Meta de proteína | peso × 1,6 g/kg, expresada en palmas | `ProteinTarget` | RN-NUT-002 |
| Comida frecuente | Comida guardada para registrar con 1 toque | `FavoriteMeal` | RN-NUT-004 |
| Propuesta de porciones | Salida de la IA (foto o texto) que el usuario confirma | `PortionProposal` | RN-NUT-005 |
| Modo sin números | Modo sin gramos, peso ni calorías visibles | `numberFreeMode` | RN-SEG-003 |

## Día que cuenta y juego

| Término | Definición | Código | Regla |
|---|---|---|---|
| Día operativo | De 03:00 a 03:00 en la zona del usuario | `OperationalDay` | RN-DQC-001 |
| Tipo de día | `entreno` o `descanso`, según el plan | `DayType`: `TRAINING`, `REST` | RN-DQC-001 |
| Mitad de entreno | Sesión completada o actividad válida (día de entreno) | `trainingHalf` | RN-DQC-002 |
| Mitad de comida | Proteína ≥ 80 % de la meta | `nutritionHalf` | RN-NUT-003 |
| Misión de descanso | Mitad de comida **o** recuperación activa (pasos o movilidad) | `restMission` | RN-DQC-003 |
| Día que cuenta (DQC) | Día que cumple la mitad que corresponde a su tipo | `CountedDay` / `isCounted` | RN-DQC-002/003 |
| Día completo | Día que cumple ambas mitades | `isComplete` | RN-DQC-004 |
| Gracia de registro | Ventana hasta las 12:00 del día siguiente para registrar | `loggingGrace` | RN-DQC-005 |
| Racha | Días que cuentan consecutivos | `Streak` | RN-GAM-001 |
| Comodín | Protección automática de un día que no cuenta | `StreakFreeze` | RN-GAM-002 |
| Reparar racha | Misión de regreso en 48 h para recuperar una racha rota | `streakRepair` | RN-GAM-003 |
| Semana cumplida | Sesiones completadas ≥ compromiso semanal | `FulfilledWeek` | RN-GAM-004 |
| Compromiso semanal | Planificadas − 1 si son 3 o más; si no, planificadas | `weeklyCommitment` | RN-GAM-004 |
| Puntos de esfuerzo (XP) | Moneda de progreso que nunca se pierde | `effortPoints` | RN-GAM-005/006 |
| Nivel | Uno de 10 niveles con nombre de identidad | `Level` | RN-GAM-007 |
| Misión semanal | Reto de la semana adaptado al historial | `WeeklyQuest` | RN-GAM-008 |
| Liga personal | Comparación con la semana anterior y la mejor semana propia | `personalLeague` | RN-GAM-009 |
| Temporada | Bloque temático de 6 semanas que inicia en lunes | `Season` | RN-GAM-010 |
| Logro / Bitácora | Hito guardado con fecha y dato / lista de logros | `Achievement` / `AchievementLog` | RN-GAM-011 |
| Reto 66 | 66 días que cuentan acumulados | `Challenge66` | RN-GAM-012 |
| Bonificación de regreso | XP extra al volver tras un día de entreno no cumplido | `comebackBonus` | RN-GAM-013 |
| Índice de sostenimiento | DQC medio semanas 5–8 ÷ semanas 1–4 | `sustainIndex` | [[plan-de-medicion]] |

## Mensajes

| Término | Definición | Código | Regla |
|---|---|---|---|
| Mensaje proactivo | Mensaje que el usuario no pidió | `ProactiveMessage` | RN-MSJ-001 |
| Propósito | Motivo del mensaje, del catálogo de 7 | `MessagePurpose` | RN-MSJ-001 |
| Motor de política | Componente único que decide si un mensaje se envía | `MessagePolicyEngine` | RN-MSJ-015 |
| Bandeja de salida | Mensajes programados pendientes de envío | `Outbox` | RN-MSJ-015 |
| Presupuesto | Máximo de mensajes por día y semana según la intensidad | `messageBudget` | RN-MSJ-002 |
| Intensidad | Baja, Normal o Alta | `Intensity`: `LOW`, `NORMAL`, `HIGH` | RN-MSJ-002 |
| Horas de silencio | Franja sin mensajes proactivos | `quietHours` | RN-MSJ-004 |
| Retroceso | Reducción del presupuesto tras mensajes ignorados | `backoff` | RN-MSJ-007 |
| Pausa por inactividad | Detención de proactivos tras 7 días sin actividad | `inactivityPause` | RN-MSJ-008 |
| Desvanecimiento | Menos recordatorios al consolidarse el hábito | `fading` | RN-MSJ-009 |
| Plantilla | Texto versionado con ID para un propósito | `MessageTemplate` | RN-MSJ-010 |
| Tasa de acción | Mensajes seguidos de una acción en ≤ 2 h ÷ enviados | `actionRate` | [[plan-de-medicion]] |

## Seguridad y datos

| Término | Definición | Código | Regla |
|---|---|---|---|
| Tamizaje | Preguntas de seguridad en el onboarding | `Screening` | RN-SEG-002/003 |
| Señal de riesgo | Coincidencia con la lista de expresiones de alerta o con patrones de sobreuso | `RiskSignal` | RN-SEG-007/008 |
| Respuesta de cuidado | Plantilla predefinida ante una señal de riesgo | `CareResponse` | RN-SEG-007 |
| Categoría de alerta | Tipo de señal de riesgo en el texto libre, con prioridad y respuesta propias | `AlertCategory`: `distress`, `cardiac_warning`, `purge`, `extreme_restriction`, `substances`, `pain` | RN-SEG-007 |
| Consentimiento | Autorización explícita y granular por categoría de dato | `Consent` | RN-DAT-001 |
| Puente de ingesta | Endpoint con token por usuario para recibir actividades | `IngestionWebhook` | RN-INT-003 |
