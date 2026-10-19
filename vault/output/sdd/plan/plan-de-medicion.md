---
titulo: Plan de medición — eventos, métricas e hipótesis
tipo: sdd-plan
hito: H3
estado: borrador
version: 0.1.0
creado: 2026-10-18
actualizado: 2026-10-18
deriva_de: [propuesta-de-valor, estrategia-anti-novedad, proactividad-sin-spam, registro-sin-friccion]
fuentes: [F14, F43]
relacionados: [modelo-de-datos, estrategia-de-pruebas, spec-000-vision-fase-0]
---

# Plan de medición

> Responde a FB-001-06: *"que todo esté fragmentado y medible"*. Cada módulo emite sus eventos; cada métrica tiene fórmula; cada hipótesis tiene su métrica. Sin eventos, una historia no está terminada (Constitución IX).

## 1. Convenciones

- Nombre: `objeto_acción` en inglés y tiempo pasado (`meal_logged`).
- Propiedades comunes: `userRef` (seudónimo), `at` (UTC), `localDate`, `appVersion`, `phase` (`n1_A1`·`n1_B`·`n1_A2`·`alpha`).
- **Prohibido:** texto libre, nombres de alimentos escritos por el usuario, respuestas de tamizaje, contenido de mensajes (RN-DAT-005).

## 2. Catálogo de eventos por módulo

| Módulo | Eventos |
|---|---|
| Onboarding (SPEC-001) | `onboarding_started` · `onboarding_step_completed` · `consent_given` · `consent_declined` · `age_gate_failed` · `screening_completed` · `goal_set` · `goal_adjusted` · `habit_declared` · `onboarding_completed` |
| Plan (SPEC-002) | `plan_generated` · `plan_viewed` · `session_variant_chosen` · `cant_today_selected` · `session_rescheduled` · `plan_days_changed` |
| Entreno (SPEC-003) | `session_started` · `set_confirmed` · `set_undone` · `session_logged_as_planned` · `session_completed` · `session_partial` · `pr_detected` · `progression_suggested` · `plateau_detected` · `pain_flagged` |
| Nutrición (SPEC-004) | `meal_logged` · `favorite_meal_saved` · `meal_repeated` · `photo_estimate_requested` · `photo_estimate_confirmed` · `nutrition_half_completed` |
| Día y juego (SPEC-005) | `day_closed` · `streak_extended` · `freeze_earned` · `freeze_used` · `streak_reset` · `streak_repair_offered` · `streak_repaired` · `xp_awarded` · `level_up` · `week_closed` · `quest_generated` · `quest_completed` · `achievement_unlocked` · `season_started` · `season_closed` |
| Progreso (SPEC-006) | `weekly_summary_sent` · `progress_viewed` · `weight_logged` · `achievement_log_viewed` · `goal_completed` · `goal_partially_completed` · `maintenance_entered` · `maintenance_band_exited` · `phase_reviewed` · `miniapp_opened` |
| Mensajes (SPEC-007) | `message_scheduled` · `message_suppressed` · `message_sent` · `message_actioned` · `message_ignored` · `backoff_applied` · `inactivity_pause_started` · `reactivation_sent` · `pause_set` · `message_settings_changed` · `bot_blocked` |
| Integraciones (SPEC-008) | `export_requested` · `export_delivered` · `ingestion_token_created` · `ingestion_received` · `ingestion_rejected` · `ingestion_token_revoked` |
| Seguridad (SPEC-009) | `number_free_mode_enabled` · `risk_signal_detected` · `care_response_sent` · `overuse_signal` · `deletion_requested` · `deletion_completed` |

## 3. Métricas

| ID | Métrica | Fórmula | Fuente de datos |
|---|---|---|---|
| **M00** | Semanas cumplidas (Estrella del Norte) | Σ semanas con `fulfilled = true` en las últimas 4 ÷ usuarios activos | `weeks` |
| M01 | Días que cuentan por semana | Σ `day_closed.counted` ÷ usuarios activos ÷ semanas | `days` |
| M02 | Retención D1/D7/D30 | Usuarios con alguna interacción el día N ÷ cohorte | `events` |
| M02b | **Índice de sostenimiento** | DQC medio semanas 5–8 ÷ DQC medio semanas 1–4 (por usuario) | `days` |
| M03 | Tasa de acción de mensajes | `message_actioned` en ≤ P-067 h ÷ `message_sent` (por propósito y plantilla) | `proactive_messages` |
| M04 | Fricción de registro | Mediana de toques por serie; mediana de `durationMs` por comida y método | `set_entries`, `meals` |
| M05 | Días con mitad de comida | Σ `nutritionHalf` ÷ días | `days` |
| M06 | Días que cuentan desde casa o exprés | Σ DQC con sesión B/C ÷ Σ DQC | `days` + `workout_sessions` |
| M07 | Regreso en ≤ 48 h | Días de entreno fallados seguidos de un DQC en ≤ 48 h ÷ días fallados | `days` |
| M08 | Conversión prueba → pago (Fase 1) | Pagos ÷ pruebas iniciadas | — |

| ID | Salvaguarda | Fórmula | Umbral |
|---|---|---|---|
| G01 | Fallos críticos de seguridad | Red-team + revisión de `care_response_sent` | 0 |
| G02 | Objetivos fuera de límites | Metas guardadas que violan RN-OBJ-004/005 | 0 |
| G03 | Tasa de bloqueo | `bot_blocked` ÷ usuarios activos (mensual) | Alerta > 5 % `[supuesto]` |
| G04 | Uso de pausa | `pause_set` ÷ usuarios activos | Vigilar |
| G05 | Sobreuso | `overuse_signal` ÷ usuarios activos | Vigilar |
| G06 | Violaciones del motor | Envíos fuera de presupuesto, silencio o separación | 0 |

## 4. Hipótesis → métricas

| Hipótesis | Métrica | Momento |
|---|---|---|
| H02 plan listo ↑ sesiones | Sesiones completadas B vs. A1; % de sesiones iniciadas desde `plan_listo` | N-de-1 |
| H03 sin spam | M03, G03, G04 | Concierge, N-de-1, alfa |
| H04 fricción | M04 | N-de-1 |
| H05 / H08 novedad | M02b, retención semana 8 | Alfa |
| H06 casa/exprés | M06 | N-de-1, alfa |
| H07 comida ↔ entreno | Correlación semanal M05 vs. M00 | Alfa |
| H11 seguridad | G01 | Antes de la alfa |
| H13 costo IA | Costo de `photo_estimate_requested` por día activo | N-de-1 |
| H14 precisión | Proteína estimada vs. referencia en 20 comidas | N-de-1 |

## 5. Protocolo N-de-1 (captura de datos)

| Fase | Fuente | Qué se registra |
|---|---|---|
| A1 (2 semanas, sin bot) | Hoja de cálculo diaria | Sesiones planificadas y completadas, días con proteína registrada, motivación 1–7 (semanal) |
| B (6 semanas, con bot) | Eventos del bot + hoja semanal | Todo lo anterior + M03, M04, comodines, costo de IA |
| A2 (2 semanas, sin bot) | Hoja de cálculo diaria | Igual que A1 |

Análisis: comparar tasas de sesiones completadas A1 vs. B vs. A2; describir la tendencia (no inferencia estadística con n = 1). Resultado en `vault/raw/` (datos) y `vault/wiki/` (síntesis).

## 6. Paneles

- **Fase 0:** `/exportar` + un cuaderno o una hoja de cálculo con las fórmulas de la §3. Opcional (*Could*): un comando oculto `/lab` solo para el fundador con M01, M03, M04 y G06 de la semana.
- **Fase 1:** herramienta de analítica con consentimiento y seudonimización.
