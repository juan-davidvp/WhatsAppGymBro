---
titulo: Modelo de datos de la Fase 0
tipo: sdd-plan
hito: H3
estado: borrador
version: 0.1.6
creado: 2026-10-18
actualizado: 2026-10-20
deriva_de: [glosario, reglas-de-negocio, seguridad-y-cumplimiento]
fuentes: []
relacionados: [plan-tecnico, plan-de-medicion, glosario]
---

# Modelo de datos · Fase 0

> Para MongoDB (ADR-015; Q8 respondida el 2026-10-19). Nombres de colecciones y campos en inglés según el [[glosario]]. Todas las fechas y horas se guardan en UTC; el **día operativo** (`date`, formato `AAAA-MM-DD`) se calcula en el dominio con la zona del usuario (RN-DQC-001).

## 1. Diagrama

```mermaid
erDiagram
    USER ||--o{ CONSENT : otorga
    USER ||--o{ SCREENING : responde
    USER ||--o{ GOAL : persigue
    USER ||--|| TRAINING_HABIT : declara
    USER ||--o{ WEEKLY_PLAN : recibe
    WEEKLY_PLAN ||--o{ PLANNED_SESSION : contiene
    PLANNED_SESSION ||--o{ WORKOUT_SESSION : se_realiza_como
    WORKOUT_SESSION ||--o{ SET_ENTRY : registra
    USER ||--o{ PERSONAL_RECORD : logra
    USER ||--o{ MEAL : registra
    USER ||--o{ FAVORITE_MEAL : guarda
    USER ||--o{ BODY_MEASUREMENT : mide
    USER ||--o{ DAY : vive
    USER ||--|| STREAK_STATE : tiene
    USER ||--o{ XP_LEDGER : acumula
    USER ||--o{ ACHIEVEMENT : desbloquea
    USER ||--o{ WEEK : cumple
    USER ||--o{ PROACTIVE_MESSAGE : recibe
    USER ||--|| MESSAGE_STATS : acumula
    USER ||--o{ IMPORTED_ACTIVITY : importa
    USER ||--o{ EVENT : genera
```

## 2. Colecciones

| Colección | Campos principales | Índices | Reglas / invariantes |
|---|---|---|---|
| `users` | `telegramUserId` (único), `chatId`, `status` (`active`·`paused`·`blocked`·`deleted`), `timezone`, `isAdultConfirmedAt`, `sex` (opcional, declarado), `level`, `equipmentProfile`, `settings` {`intensity`, `quietHours`, `purposesEnabled`, `gamificationEnabled`, `numberFreeMode`, `lowIntensityStart`}, `profile` {`goalType`, `level`, `availableDays`, `timeSlot`, `place`, `sessionMinutes`, `homeEquipment`, `heightCm`}, `onboarding` {`step`, `startedAt`, `interactions`, `completedAt`} | `telegramUserId` único | No se guarda la fecha de nacimiento: solo la confirmación de mayoría de edad (minimización, RN-SEG-001) |
| `consents` | `userId`, `category` (`health_data`·`body_measurements`·`screening`·`ai_processing`·`analytics`), `granted`, `at`, `policyVersion` | `userId+category` | RN-DAT-001 |
| `screenings` | `userId`, `type` (`pre_activity`·`food_body`), `result` (`clear`·`flag`), `at` | `userId` | **No se guardan las respuestas**, solo el resultado (minimización); solo con autorización `screening`. Las consecuencias (`lowIntensityStart`, `numberFreeMode`) van en `users.settings` siempre ([[tamizajes]] §3) |
| `goals` | `userId`, `type`, `metric`, `startValue`, `targetValue`, `startDate`, `horizonWeeks`, `status` (`active`·`completed`·`partially_completed`·`changed`·`paused`), `closedAt`, `progressPct` | `userId+status` | Un solo `active` por usuario (RN-OBJ-001). `startValue` y `targetValue` quedan en null en un objetivo sin meta de peso del onboarding, hasta tener datos |
| `training_habits` | `userId`, `days[]` {`weekday`, `declaredStart`, `learnedStart`, `location`} | `userId` único | RN-PLAN-002, RN-MSJ-006 |
| `weekly_plans` | `userId`, `weekStart`, `days[]` {`date`, `dayType`, `plannedSessionId`}, `nextRotationStart`, `intensity` (`low`·`normal`) | `userId+weekStart` único | RN-PLAN-001 a 009. Se guarda una sola vez por semana; la siguiente continúa la rotación desde `nextRotationStart` (RN-PLAN-007) |
| `planned_sessions` | `userId`, `date`, `template` (código de sesión, [[catalogo-de-ejercicios-base]] §5), `versions` {`GYM`, `HOME`, `EXPRESS`: {`exercises[]` {`exerciseCode`, `pattern`, `sets`, `reps` {min, max}, `targetReps`, `loadKg`, `restSeconds`}, `estimatedMinutes`}} | `userId+date` | RN-PLAN-003, RN-PLAN-006 |
| `workout_sessions` | `userId`, `plannedSessionId`, `date`, `variant`, `status` (`active`·`completed`·`partial`·`abandoned`), `startedAt`, `endedAt`, `loggedAsPlanned`, `cardMessageId` | `userId+date` | RN-ENT-004 |
| `set_entries` | `sessionId`, `userId`, `exerciseCode`, `setIndex`, `reps`, `loadKg`, `edited`, `confirmedAt`, `idempotencyKey` | `idempotencyKey` único | RN-ENT-001; NFR-03 |
| `personal_records` | `userId`, `exerciseCode`, `type` (`e1rm`·`reps`), `value`, `date`, `setEntryId` | `userId+exerciseCode+type` | RN-ENT-005 |
| `pain_flags` | `userId`, `exerciseCode`, `zone`, `date` | `userId+exerciseCode` | RN-SEG-006 |
| `meals` | `userId`, `date`, `loggedAt`, `method` (`portions`·`favorite`·`repeat`·`photo`·`text`), `portions` {`palm`, `cuppedHand`, `fist`, `thumb`}, `proteinG`, `favoriteMealId`, `durationMs`, `taps`, `idempotencyKey` | `userId+date`; `idempotencyKey` único | RN-NUT-001 a 005; sin imagen (RN-DAT-004) |
| `favorite_meals` | `userId`, `name`, `portions`, `foodCodes[]` | `userId` | RN-NUT-004 |
| `body_measurements` | `userId`, `date`, `weightKg`, `waistCm` | `userId+date` | RN-OBJ-010, RN-OBJ-012 |
| `days` | `userId`, `date`, `dayType`, `trainingHalf`, `nutritionHalf`, `restMissionMet`, `counted`, `complete`, `sources[]`, `freezeUsed`, `status` (`open`·`closed`), `closedAt` | `userId+date` único | RN-DQC-001 a 007 |
| `streak_states` | `userId`, `current`, `longest`, `freezes`, `totalCountedDays`, `lastClosedDate`, `repairAvailableUntil`, `lastRepairAt` | `userId` único | `totalCountedDays` nunca baja (RN-DQC-007) |
| `xp_ledger` | `userId`, `at`, `event`, `amount` (> 0), `refId` | `userId+at` | Solo inserciones; suma nunca baja (RN-GAM-006) |
| `achievements` | `userId`, `code`, `at`, `value`, `context` | `userId+code+at` | Solo inserciones (RN-GAM-011) |
| `weeks` | `userId`, `weekStart`, `planned`, `completed`, `commitment`, `fulfilled`, `countedDays` | `userId+weekStart` único | RN-GAM-004 |
| `quests` | `userId`, `weekStart`, `items[]` {`code`, `target`, `progress`, `done`} | `userId+weekStart` | RN-GAM-008 |
| `seasons` | `userId`, `code`, `startDate`, `endDate`, `status` | `userId+startDate` | RN-GAM-010 |
| `proactive_messages` | `userId`, `purpose`, `templateId`, `scheduledFor`, `status` (`pending`·`sent`·`suppressed`·`cancelled`), `suppressedReason`, `sentAt`, `telegramMessageId`, `actionedAt` | `status+scheduledFor`; `userId+sentAt` | RN-MSJ-001 a 017 |
| `message_stats` | `userId`, `consecutiveIgnored`, `backoffUntil`, `inactivityPausedAt`, `reactivationsUsed`, `pausedUntil`, `actionRateByPurpose` | `userId` único | RN-MSJ-007 a 009, 013 |
| `imported_activities` | `userId`, `source`, `type` (`steps`·`workout`), `start`, `end`, `value`, `receivedAt` | `userId+start` | RN-INT-003, RN-INT-004 |
| `ingestion_tokens` | `userId`, `tokenHash`, `createdAt`, `revokedAt` | `tokenHash` único | RN-INT-003 |
| `risk_signals` | `userId`, `category`, `at` | `userId+at` | Solo categoría (RN-DAT-005) |
| `events` | `userRef` (seudónimo: el id interno del usuario), `name`, `at`, `common` {`localDate`, `appVersion`, `phase`}, `props` (sin texto libre; validadas por esquema antes de guardar) | `name+at`; `userRef+at` | [[plan-de-medicion]] |
| `processed_updates` | `updateId`, `at` | `updateId` único; caducidad P-080 | Idempotencia de Telegram |

## 3. Catálogos (paquete `content`, no en la base)

`exercises` ([[catalogo-de-ejercicios-base]]) · `foods` ([[alimentos-accesibles-base]]) · `message_templates` ([[plantillas-de-mensajes]]) · `achievements_catalog` y `levels` ([[catalogo-de-logros-y-niveles]]) · `risk_expressions` (lista de alerta, `[VALIDAR-PROFESIONAL]`).

## 4. Borrado total (RN-DAT-003)

`/borrar_datos` elimina todos los documentos con el `userId` en **todas** las colecciones anteriores y reemplaza `userRef` de `events` por un valor irrecuperable (o los elimina). Una prueba verifica que no quedan rastros (SC-009-2).

## 5. Retención

| Datos | Retención |
|---|---|
| `processed_updates` | P-080 |
| `events` | P-081 `[supuesto]` |
| Fotos de comida | No se almacenan |
| Resto | Mientras la cuenta esté activa o hasta el borrado |
