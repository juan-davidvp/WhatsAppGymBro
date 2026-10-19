---
titulo: SPEC-002 · Plan semanal y sesión del día (A/B/C)
tipo: sdd-spec
id: SPEC-002
hito: H3
estado: borrador
version: 0.1.0
fase: 0
prioridad: P1
depende_de: [SPEC-001]
creado: 2026-10-18
actualizado: 2026-10-18
deriva_de: [constancia-en-cualquier-lugar, fundamentos-de-entrenamiento, flujos-de-usuario, objetivos-y-progreso]
fuentes: []
relacionados: [spec-003-registro-de-entrenamiento, spec-007-proactividad-y-mensajes, catalogo-de-ejercicios-base, parametros]
---

# SPEC-002 · Plan semanal y sesión del día

## 1. Propósito

Que el usuario tenga siempre una sesión **hecha para su nivel, su tiempo y su objetivo** (JTBD-01) y una alternativa **en casa o exprés que cuente igual** (JTBD-05; FB-001-13), sin deudas cuando falla (FB-001-17).

## 2. Historias de usuario

### HU-002-1 · Ver mi plan de la semana (P1)
1. **Dado** un usuario con onboarding completo, **cuando** se genera el plan, **entonces** contiene sesiones en sus días disponibles, con la división de P-014 y al menos P-017 día de descanso (RN-PLAN-004, RN-PLAN-008).
2. **Dado** el plan, **cuando** escribe `/plan`, **entonces** ve los 7 días con el tipo de día y el nombre de cada sesión, y [Ajustar días].
3. **Dado** que es domingo a la hora P-060, **cuando** se envía el resumen semanal, **entonces** incluye el plan de la semana siguiente (RN-PLAN-009, RN-MSJ-017).

### HU-002-2 · Elegir dónde entreno hoy (P1)
1. **Dado** un día de entreno, **cuando** toca `🏋️ Hoy` o responde a `plan_listo`, **entonces** ve la sesión con [Gym] [Casa] [Exprés 15'] [Hoy no puedo].
2. **Dado** que toca [Casa], **cuando** se abre la sesión, **entonces** cada ejercicio es el equivalente B del mismo patrón con su equipamiento (RN-PLAN-003, RN-PLAN-010).
3. **Dado** cualquier versión, **cuando** se estima su duración, **entonces** no supera los minutos disponibles (RN-PLAN-006).

### HU-002-3 · "Hoy no puedo" sin deuda (P1)
1. **Dado** [Hoy no puedo], **cuando** elige [Exprés ahora], **entonces** se abre la versión C.
2. **Dado** [Hoy no puedo], **cuando** elige [Mover a otro día], **entonces** se ofrecen solo días de esta semana que respeten el descanso mínimo (RN-PLAN-007, RN-PLAN-008).
3. **Dado** que no entrena ese día, **cuando** llega el siguiente día de entreno, **entonces** la sesión es la siguiente de la rotación, sin volumen extra (RN-PLAN-007).

### HU-002-4 · Ajustar días disponibles (P2)
1. **Dado** `/ajustes` → días, **cuando** cambia de 4 a 3 días, **entonces** el plan se regenera desde la semana siguiente y la semana en curso conserva lo registrado.

## 3. Requisitos funcionales

| ID | Requisito |
|---|---|
| FR-002-01 | El generador DEBE ser una función pura del dominio: entradas (nivel, días, minutos, objetivo, equipamiento, historial) → plan semanal. |
| FR-002-02 | El generador DEBE producir las versiones A, B y C de cada sesión, con equivalencias por patrón del catálogo (RN-PLAN-003, RN-PLAN-010). |
| FR-002-03 | El generador DEBE respetar las tablas de división, volumen y repeticiones (P-014 a P-016) y el descanso mínimo (P-017, P-018). |
| FR-002-04 | Cada ejercicio DEBE traer series, repeticiones objetivo y carga sugerida a partir del historial (progresión de SPEC-003). |
| FR-002-05 | El sistema DEBE marcar cada día como `entreno` o `descanso` (RN-DQC-001). |
| FR-002-06 | El sistema DEBE permitir reprogramar una sesión dentro de la misma semana sin crear deuda (RN-PLAN-007). |
| FR-002-07 | El sistema DEBE publicar el plan semanal con el resumen del domingo (RN-PLAN-009). |
| FR-002-08 | En nivel novato con un tamizaje positivo de SPEC-009, el plan DEBE iniciar con intensidad baja (RN-SEG-002). |

## 4. Reglas aplicables

RN-PLAN-001 a RN-PLAN-010 · RN-DQC-001 · RN-SEG-002 · RN-MAN-002.

## 5. Entidades

`WeeklyPlan`, `PlannedSession`, `SessionVariant`, `PlannedExercise`, `Exercise`, `MovementPattern`, `EquipmentProfile`.

## 6. Criterios de éxito

| ID | Criterio |
|---|---|
| SC-002-1 | 100 % de los planes generados en pruebas respetan P-014 a P-018 (prueba de propiedades sobre combinaciones de entradas). |
| SC-002-2 | ≥ 30 % de los días que cuentan en semanas con imprevistos provienen de B o C (H06, alfa). |
| SC-002-3 | ≥ 50 % de las sesiones se inician desde `plan_listo` o `🏋️ Hoy` en ≤ 2 toques. |

## 7. Eventos

`plan_generated` (división, días) · `plan_viewed` · `session_variant_chosen` (A/B/C) · `cant_today_selected` (opción) · `session_rescheduled` · `plan_days_changed`.

## 8. Casos límite

- Usuario con 2 días y 20 minutos: cuerpo completo mínimo; la versión C coincide con la A.
- Sin equipamiento en casa: la versión B usa peso corporal.
- Cambio de objetivo a mitad de semana: el plan nuevo empieza el lunes siguiente.

## 9. Fuera de alcance

Planes de cardio específicos, deportes, programación por bloques avanzados, rutinas personalizadas por un entrenador humano.

## 10. Aclaraciones pendientes

- `[NEEDS CLARIFICATION: Q4]` Validación profesional de P-014 a P-018 y del catálogo de ejercicios.
- `[NEEDS CLARIFICATION]` ¿El usuario puede cambiar un ejercicio por otro de su mismo patrón? Propuesta: sí, en Fase 0 con botón [Cambiar ejercicio] (Should).
