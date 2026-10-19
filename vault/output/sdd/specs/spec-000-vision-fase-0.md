---
titulo: SPEC-000 · Visión y alcance de la Fase 0
tipo: sdd-spec
id: SPEC-000
hito: H3
estado: borrador
version: 0.1.1
fase: 0
creado: 2026-10-18
actualizado: 2026-10-19
deriva_de: [propuesta-de-valor, usuario-cabeza-01, jobs-to-be-done, registro-de-decisiones]
fuentes: [F41, F69, F70, F71]
relacionados: [constitucion, reglas-de-negocio, plan-tecnico, tareas-fase-0]
---

# SPEC-000 · Visión y alcance de la Fase 0

## 1. Propósito

Construir un **bot de Telegram estructurado** que el fundador use durante 10 semanas (protocolo N-de-1) para validar que el núcleo —**plan listo + registro con un toque + día que cuenta + mensajes proactivos sin spam + seguridad**— aumenta la constancia y es técnicamente viable, antes de abrirlo a una alfa de 5–15 usuarios del segmento.

## 2. Usuarios

- **Fase 0:** el fundador (usuario cero).
- **Alfa (después de la compuerta):** usuario cabeza 01 ([[usuario-cabeza-01]]).

## 3. Mapa de specs

| Spec | Módulo | Prioridad | Depende de |
|---|---|---|---|
| [[spec-009-seguridad-y-privacidad]] | Consentimiento, tamizaje, señales de riesgo, borrado | P1 | — |
| [[spec-001-onboarding-y-objetivo]] | `/start`, objetivo, hábito, preferencias | P1 | 009 |
| [[spec-002-plan-y-sesion-del-dia]] | Plan semanal y versiones A/B/C | P1 | 001 |
| [[spec-003-registro-de-entrenamiento]] | Tarjeta de sesión, progresión, récords | P1 | 002 |
| [[spec-004-registro-de-nutricion]] | Porciones, frecuentes, proteína, foto | P1 | 001 |
| [[spec-005-dia-que-cuenta-y-gamificacion]] | Día que cuenta, racha, XP, niveles, misiones | P1 | 003, 004 |
| [[spec-007-proactividad-y-mensajes]] | Motor de política y planificador | P1 | 002, 005 |
| [[spec-006-progreso-logros-y-mantenimiento]] | Resumen semanal, muro, bitácora, objetivo, mantenimiento | P1/P2 | 005 |
| [[spec-008-integraciones]] | Exportar, puente de ingesta | P1/P3 | 005 |

**Orden de implementación sugerido:** dominio (todas las RN con pruebas) → 009 → 001 → 002 → 003 → 004 → 005 → 007 → 006 → 008. Ver [[tareas-fase-0]].

## 4. Alcance (MoSCoW)

| Prioridad | Incluye |
|---|---|
| **Must** | Consentimiento y aviso de privacidad · tamizajes · objetivo con meta segura · hábito · plan semanal con A/B/C · tarjeta de sesión (1 toque por serie, "La hice tal cual") · porciones con la mano y comidas frecuentes · proteína del día · día que cuenta, racha, comodines, XP, niveles · motor de mensajes con presupuesto, silencio, retroceso, inactividad y `/pausa` · resumen semanal con imagen del muro · bitácora · `/exportar` · `/borrar_datos` · respuestas de cuidado predefinidas |
| **Should** | Foto → propuesta de porciones · récords personales · reparar racha · misiones semanales · modo mantenimiento · Mini App de progreso |
| **Could** | Texto libre → porciones · puente de ingesta de pasos · temporadas · liga personal · esfuerzo acumulado en el resumen |
| **Won't (Fase 0)** | Pagos (Stars) · rankings sociales · calorías · fotos corporales · OAuth con Hevy/Strava/Calendar · app nativa · voz |

## 5. Requisitos no funcionales

| ID | Requisito |
|---|---|
| NFR-01 | Respuesta a un toque de botón (confirmación visible) en ≤ 1 s en el percentil 95, sin contar la latencia de red del usuario. |
| NFR-02 | Ningún mensaje proactivo excede el presupuesto ni cae en horas de silencio (verificable en los registros: 0 violaciones). |
| NFR-03 | Los toques de botón son idempotentes: un toque repetido no duplica una serie ni una comida. |
| NFR-04 | Respeta los límites de envío de Telegram con reintentos y espera exponencial. |
| NFR-05 | El dominio no tiene dependencias de E/S y su cobertura de pruebas es ≥ 90 %. |
| NFR-06 | Todas las fechas se calculan en la zona horaria del usuario (por defecto America/Bogota). |
| NFR-07 | Los registros técnicos no contienen texto libre ni datos sensibles (RN-DAT-005, RN-DAT-006). |
| NFR-08 | El costo de IA por día activo se registra por llamada (H13). |

## 6. Criterios de éxito de la Fase 0 (compuerta hacia la alfa)

| ID | Criterio |
|---|---|
| SC-000-1 | Sesiones completadas en la fase B ≥ 20 % por encima de la línea base A1 (N-de-1). |
| SC-000-2 | Mediana de 1 toque por serie confirmada; ≤ 20 s por comida registrada por porciones o frecuente. |
| SC-000-3 | ≥ 70 % de 20 comidas pesadas con proteína estimada dentro de ±25 % (H14). |
| SC-000-4 | 0 fallos críticos en el *red-team* de ≥ 50 escenarios (H11). |
| SC-000-5 | 0 violaciones de presupuesto o de horas de silencio en las 10 semanas. |
| SC-000-6 | Costo de IA por día activo medido y documentado (H13). |
| SC-000-7 | Resultados de H1 que no refuten H01, H09 ni H10. |

## 7. Restricciones del canal (Telegram)

- El bot solo puede escribir primero a usuarios que ya iniciaron `/start`.
- Los chats no son de extremo a extremo; hay que informarlo (`F71`).
- Cobrar bienes digitales exige Telegram Stars (`F70`) — fuera de la Fase 0.
- La Mini App debe validar en el servidor los datos de inicio que entrega Telegram (`F69`).
- La API de WhatsApp Business no se usa: prohíbe asistentes de IA de propósito general desde el 15-ene-2026 (`F41`).

## 8. Fuera de alcance

Pagos, multiusuario a escala, panel de administración, internacionalización, mujeres como segmento (fase futura), cualquier forma de conversación libre.

## 9. Aclaraciones pendientes

- ~~Q8~~ Base de datos: **MongoDB** (respondida el 2026-10-19, ADR-015).
- `[NEEDS CLARIFICATION: Q9]` ¿Mini App dentro de la Fase 0 o en la Fase 1?
- `[NEEDS CLARIFICATION: Q7]` Nombre del bot en BotFather.
- `[NEEDS CLARIFICATION: Q4]` Profesionales que validarán los parámetros `[V]` antes de la alfa.
