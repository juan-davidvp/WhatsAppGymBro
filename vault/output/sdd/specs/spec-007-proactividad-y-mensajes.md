---
titulo: SPEC-007 · Proactividad y motor de mensajes
tipo: sdd-spec
id: SPEC-007
hito: H3
estado: borrador
version: 0.1.1
fase: 0
prioridad: P1
depende_de: [SPEC-002, SPEC-005]
creado: 2026-10-18
actualizado: 2026-10-19
deriva_de: [proactividad-sin-spam, estrategia-anti-novedad, voz-y-marca]
fuentes: [F47, F49, F50, F51]
relacionados: [plantillas-de-mensajes, parametros, plan-tecnico, estrategia-de-pruebas]
---

# SPEC-007 · Proactividad y motor de mensajes

## 1. Propósito

Cumplir el valor más fuerte del producto: **escribir primero, en el momento del hábito, sin ser spam** (FB-001-22). Un único **motor de política** decide cada mensaje no solicitado.

## 2. Historias de usuario

### HU-007-1 · Plan listo antes de mi hora (P1)
1. **Dado** un día de entreno con hora habitual 18:00, **cuando** son las 17:00 (P-048), **entonces** recibe `plan_listo` con [Gym] [Casa] [Exprés 15'] [Hoy no puedo] (RN-MSJ-005).
2. **Dado** que ya empezó la sesión o el día ya cuenta, **cuando** llega la hora, **entonces** no se envía (RN-MSJ-005).
3. **Dado** que sus últimas 6 sesiones de martes empezaron hacia las 19:00, **cuando** se calcula la hora habitual del martes, **entonces** pasa a 19:00 (RN-MSJ-006).

### HU-007-2 · Nunca más de lo acordado (P1)
1. **Dado** intensidad Normal, **cuando** el motor evalúa un nuevo mensaje, **entonces** no se envía si supera 2 en un día de entreno, 1 en uno de descanso u 8 en la semana (RN-MSJ-002).
2. **Dado** horas de silencio 21:30–07:00, **cuando** un mensaje caería en esa franja, **entonces** no se envía (RN-MSJ-004).
3. **Dado** un mensaje enviado a las 17:00, **cuando** se evalúa otro a las 19:00, **entonces** no se envía (separación P-046) (RN-MSJ-003).

### HU-007-3 · Si dejo de responder, el bot baja la voz (P1)
1. **Dado** 3 mensajes proactivos seguidos sin interacción, **cuando** se evalúa el siguiente, **entonces** el presupuesto semanal queda a la mitad durante 7 días (RN-MSJ-007).
2. **Dado** 2 días de entreno planificados sin actividad, **cuando** corresponde, **entonces** se envía 1 `regreso` con [Exprés 15'] [Ajustar plan] (RN-MSJ-008).
3. **Dado** 7 días sin actividad, **cuando** se cumple, **entonces** se envía un `regreso` final y se pausan los proactivos; solo vuelven si el usuario interactúa o con 1 mensaje el siguiente lunes o día 1 del mes, máximo 3 veces (RN-MSJ-008).

### HU-007-4 · Controlar los mensajes (P2)
1. **Dado** `/pausa`, **cuando** elige 1, 3, 7 o 14 días, **entonces** no recibe proactivos en ese periodo y los comandos siguen funcionando (RN-MSJ-013).
2. **Dado** `/ajustes`, **cuando** cambia intensidad, silencio o desactiva un propósito, **entonces** el motor lo respeta desde la siguiente evaluación.

### HU-007-5 · Cierre del día solo si sirve (P2)
1. **Dado** las 20:00 (P-066) de un día que no cuenta y al que solo le falta la proteína, **cuando** hay presupuesto, **entonces** recibe `cierre_del_dia` con [Lo de siempre] [Porciones] (RN-MSJ-016).
2. **Dado** que al día le falta la sesión completa, **cuando** son las 20:00, **entonces** no se envía `cierre_del_dia` (no es realizable en 1–2 toques).

### HU-007-6 · Menos recordatorios cuando ya tengo el hábito (P3)
1. **Dado** 8 semanas cumplidas seguidas, **cuando** se evalúa `recordatorio_contextual`, **entonces** está desactivado por defecto; `plan_listo` sigue si su tasa de acción ≥ P-056 (RN-MSJ-009).

### HU-007-7 · Bloqueo (P1)
1. **Dado** que el usuario bloqueó el bot, **cuando** un envío falla con el error de bloqueo de Telegram, **entonces** se marcan como canceladas las salidas pendientes y se registra `bot_blocked` (RN-MSJ-014).

## 3. Requisitos funcionales

| ID | Requisito |
|---|---|
| FR-007-01 | El motor DEBE ser una función pura `evaluar(contexto, candidato) → enviar | suprimir(motivo)` en el dominio. |
| FR-007-02 | Todos los mensajes proactivos DEBEN entrar a una **bandeja de salida** persistente con propósito, plantilla, hora programada y estado; ningún otro componente envía proactivos (RN-MSJ-015). |
| FR-007-03 | Un **planificador** DEBE ejecutarse cada minuto: toma las salidas vencidas, re-evalúa la política con el estado actual y envía o suprime. |
| FR-007-04 | Cada envío DEBE registrar `template_id` y respetar la rotación de P-058 (RN-MSJ-010). |
| FR-007-05 | Toda plantilla DEBE incluir al menos un botón de acción (RN-MSJ-012) y pasar la prueba de expresiones prohibidas (RN-MSJ-011). |
| FR-007-06 | Una interacción del usuario (toque o comando) DEBE reiniciar el contador de mensajes ignorados (RN-MSJ-007). |
| FR-007-07 | La supresión DEBE registrar su motivo (`budget`, `quiet_hours`, `min_gap`, `paused`, `inactive`, `day_already_counts`, `disabled_purpose`, `cooldown`). |
| FR-007-08 | Los envíos DEBEN respetar los límites de Telegram con reintentos y espera exponencial (NFR-04). |

## 4. Reglas aplicables

RN-MSJ-001 a RN-MSJ-017 · RN-PLAN-009 · RN-MAN-003 · RN-MAN-005.

## 5. Entidades

`ProactiveMessage` (salida), `MessageTemplate`, `MessagePreferences`, `MessageStats` (ignorados seguidos, reactivaciones usadas, tasa de acción por propósito).

## 6. Criterios de éxito

| ID | Criterio |
|---|---|
| SC-007-1 | Simulación de 60 días con comportamientos aleatorios: 0 violaciones de presupuesto, silencio, separación, pausa y rotación (prueba automática). |
| SC-007-2 | Tasa de acción de `plan_listo` ≥ 40 % (H03, concierge y N-de-1). |
| SC-007-3 | Tasa de bloqueo mensual < 5 % y uso de `/pausa` vigilado (alfa). |

## 7. Eventos

`message_scheduled` (propósito, plantilla) · `message_suppressed` (propósito, motivo) · `message_sent` · `message_actioned` (propósito, plantilla, minutos hasta la acción) · `message_ignored` · `backoff_applied` · `inactivity_pause_started` · `reactivation_sent` · `pause_set` (días) · `message_settings_changed` (campo) · `bot_blocked`.

## 8. Casos límite

- Dos propósitos compiten por el mismo hueco: prioridad `regreso` > `plan_listo` > `cierre_del_dia` > `reconocimiento` > `recordatorio_contextual`; `resumen_semanal` tiene su hueco reservado el domingo.
- El servidor estuvo caído y hay salidas vencidas hace horas: se re-evalúan; si su momento ya pasó (p. ej., `plan_listo` después de la hora habitual), se suprimen con motivo `stale`.
- El usuario cambia de zona horaria: las salidas futuras se reprograman.

## 9. Fuera de alcance

Optimización con algoritmos de bandido (Fase 1+, cuando haya volumen), notificaciones por correo o SMS, mensajes en grupos.

## 10. Aclaraciones pendientes

- `[NEEDS CLARIFICATION]` Las plantillas CD-03 y CD-04 son para un día que **ya cuenta** y al que le falta proteína para quedar completo, pero RN-MSJ-016 dice que `cierre_del_dia` solo se envía si el día **todavía no cuenta**. El motor aplica la regla (CD-03/CD-04 no se envían). Propuesta: ampliar RN-MSJ-016 a "si el día no cuenta, o si cuenta y le falta solo la mitad de comida para quedar completo" (T-016, 2026-10-19).
- `[NEEDS CLARIFICATION]` ¿`recordatorio_contextual` entra en la Fase 0? Propuesta: sí, solo con un disparador (ayer faltó y hoy hay hueco); el resto en Fase 1.
