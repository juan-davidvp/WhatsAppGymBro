---
titulo: SPEC-003 · Registro de entrenamiento con un toque
tipo: sdd-spec
id: SPEC-003
hito: H3
estado: borrador
version: 0.1.0
fase: 0
prioridad: P1
depende_de: [SPEC-002]
creado: 2026-10-18
actualizado: 2026-10-18
deriva_de: [registro-sin-friccion, fundamentos-de-entrenamiento, cada-dia-cuenta, seguridad-y-cumplimiento]
fuentes: []
relacionados: [spec-005-dia-que-cuenta-y-gamificacion, spec-009-seguridad-y-privacidad, reglas-de-negocio]
---

# SPEC-003 · Registro de entrenamiento con un toque

## 1. Propósito

Eliminar la fricción de registrar el entreno (causa n.º 1 de abandono, FB-001-08): **confirmar en vez de escribir**, sin teclado y sin llenar el chat.

## 2. Historias de usuario

### HU-003-1 · Confirmar cada serie con un toque (P1)
1. **Dado** una sesión abierta, **cuando** se muestra la tarjeta, **entonces** es **un solo mensaje** con el ejercicio, la serie actual, las repeticiones y la carga objetivo, y los botones [✅ Hecha] [−1 rep] [+1 rep] [−kg] [+kg] [⏭️ Siguiente ejercicio] [⚠️ Dolor] [🏁 Terminar].
2. **Dado** la tarjeta, **cuando** toca [✅ Hecha], **entonces** la serie se registra tal cual y el mismo mensaje se edita para mostrar la siguiente serie (RN-ENT-001).
3. **Dado** que hizo 8 en lugar de 10, **cuando** toca [−1 rep] dos veces y luego [✅ Hecha], **entonces** se registran 8 repeticiones con la carga objetivo.

### HU-003-2 · "La hice tal cual" (P1)
1. **Dado** que entrenó sin registrar (por ejemplo, sin señal), **cuando** toca [La hice tal cual] en la sesión del día o hasta la gracia de registro, **entonces** se registran todas las series como estaban planeadas en 1 toque (RN-ENT-001, RN-DQC-005).

### HU-003-3 · Terminar y ver lo que sumé (P1)
1. **Dado** que completó al menos P-023 de las series (o toda la versión C), **cuando** toca [🏁 Terminar], **entonces** la sesión queda `completada` y el día se evalúa (RN-ENT-004, SPEC-005).
2. **Dado** que termina con menos series, **cuando** confirma, **entonces** la sesión queda `parcial`, no se usa lenguaje negativo y se le recuerda que la versión exprés cuenta.

### HU-003-4 · Récords personales (P2)
1. **Dado** una serie con e1RM mayor que el máximo previo del ejercicio (≤ P-024 repeticiones), **cuando** se confirma, **entonces** se marca 🏆, se guarda el logro en la bitácora y se suma el XP de récord (RN-ENT-005, RN-GAM-011).

### HU-003-5 · Progresión sugerida (P2)
1. **Dado** que alcanzó el tope del rango en todas las series de un ejercicio en P-019 sesiones seguidas, **cuando** se genera su próxima sesión, **entonces** la carga sugerida sube P-020/P-021 (gym) o se propone una variante más difícil (casa) (RN-ENT-002).
2. **Dado** P-022 sesiones sin progreso, **cuando** se genera la siguiente, **entonces** se propone una estrategia con botones, sin restar XP (RN-ENT-003).

### HU-003-6 · Marcar dolor (P2)
1. **Dado** [⚠️ Dolor], **cuando** elige la zona, **entonces** se detiene la progresión de ese ejercicio, se ofrece una variante y se registra el evento (RN-SEG-006).
2. **Dado** dolor en P-062 sesiones del mismo ejercicio, **cuando** ocurre, **entonces** se envía la respuesta de cuidado que recomienda consulta profesional.

## 3. Requisitos funcionales

| ID | Requisito |
|---|---|
| FR-003-01 | La tarjeta de sesión DEBE ser un único mensaje editado en cada acción. |
| FR-003-02 | Confirmar una serie tal cual DEBE costar exactamente 1 toque (RN-ENT-001). |
| FR-003-03 | Todos los toques DEBEN ser idempotentes: un toque repetido o un reintento de Telegram no duplica la serie (NFR-03). |
| FR-003-04 | El sistema DEBE ofrecer [↩️ Deshacer] para la última serie durante 10 s. |
| FR-003-05 | El sistema DEBE permitir "La hice tal cual" hasta el final de la gracia de registro (RN-DQC-005). |
| FR-003-06 | El cálculo de sesión completada, récords y progresión DEBE vivir en el dominio (RN-ENT-002 a RN-ENT-005). |
| FR-003-07 | El sistema NO DEBE enviar mensajes de temporizador de descanso por el chat (ruido); el temporizador vive en la Mini App (Should). |

## 4. Reglas aplicables

RN-ENT-001 a RN-ENT-005 · RN-DQC-005 · RN-GAM-011 · RN-SEG-006.

## 5. Entidades

`WorkoutSession`, `SetEntry`, `PersonalRecord`, `PainFlag`.

## 6. Criterios de éxito

| ID | Criterio |
|---|---|
| SC-003-1 | Mediana de 1 toque por serie confirmada y ≤ 2 s por confirmación (H04). |
| SC-003-2 | 0 series duplicadas por reintentos (prueba de idempotencia). |
| SC-003-3 | ≥ 90 % de las sesiones iniciadas terminan en `completada` o `parcial` registrada (no abandonadas sin estado). |

## 7. Eventos

`session_started` (versión) · `set_confirmed` (toques, editada) · `set_undone` · `session_logged_as_planned` · `session_completed` (versión, series, duración_min) · `session_partial` · `pr_detected` (ejercicio, tipo) · `progression_suggested` · `plateau_detected` · `pain_flagged` (zona).

## 8. Casos límite

- Dos sesiones abiertas el mismo día: solo una activa; la segunda pregunta [Continuar la anterior] [Nueva].
- El usuario toca un botón de una tarjeta vieja: se responde "Esta sesión ya terminó" sin modificar datos.
- Peso corporal (sin carga): el récord se mide por repeticiones (RN-ENT-005).

## 9. Fuera de alcance

Reloj inteligente, video de técnica, RPE detallado, superseries complejas.

## 10. Aclaraciones pendientes

- `[NEEDS CLARIFICATION]` ¿Registrar repeticiones en reserva (RIR) en la Fase 0? Propuesta: no; solo repeticiones y carga.
