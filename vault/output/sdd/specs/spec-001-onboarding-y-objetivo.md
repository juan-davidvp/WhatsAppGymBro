---
titulo: SPEC-001 · Onboarding, objetivo y hábito
tipo: sdd-spec
id: SPEC-001
hito: H3
estado: borrador
version: 0.1.0
fase: 0
prioridad: P1
depende_de: [SPEC-009]
creado: 2026-10-18
actualizado: 2026-10-18
deriva_de: [objetivos-y-progreso, flujos-de-usuario, usuario-cabeza-01, seguridad-y-cumplimiento]
fuentes: []
relacionados: [spec-009-seguridad-y-privacidad, spec-002-plan-y-sesion-del-dia, spec-007-proactividad-y-mensajes, reglas-de-negocio]
---

# SPEC-001 · Onboarding, objetivo y hábito

## 1. Propósito

Que un usuario nuevo pase de `/start` a tener **objetivo medible, hábito declarado y su primera sesión lista en ≤ 3 minutos**, con consentimiento y tamizaje de seguridad (JTBD-01; FB-001-15, 20, 21, 22).

## 2. Historias de usuario

### HU-001-1 · Empezar y tener mi primer plan hoy (P1)
Como usuario nuevo, quiero completar el inicio con botones en pocos minutos para entrenar hoy mismo.
**Prueba independiente:** un usuario sin datos completa el flujo y recibe su plan semanal y la sesión de hoy.

1. **Dado** un usuario que nunca usó el bot, **cuando** envía `/start`, **entonces** recibe la bienvenida (qué hace y qué no hace el bot) y el aviso de privacidad con [Acepto] [Ver política].
2. **Dado** que aceptó, **cuando** responde cada pregunta con botones, **entonces** cada pregunta llega en un mensaje con opciones y no se le pide escribir salvo su peso (opcional).
3. **Dado** que terminó, **cuando** se muestra el resumen, **entonces** ve su objetivo, su meta, sus días y la sesión de hoy (o la próxima) con [Empezar] [Ver plan].

### HU-001-2 · Elegir un objetivo con meta segura (P1)
Como usuario, quiero elegir mi objetivo y recibir una meta realista para saber hacia dónde voy.

1. **Dado** que elige `ganar_musculo` y declara 68 kg, **cuando** el sistema calcula la meta, **entonces** propone un ritmo dentro de P-005 y un horizonte de P-001 semanas (RN-OBJ-003, RN-OBJ-004).
2. **Dado** que pide una meta más ambiciosa que el límite, **cuando** toca [Más ambiciosa], **entonces** el sistema no la acepta tal cual y le ofrece un horizonte mayor o la meta máxima segura (RN-OBJ-004).
3. **Dado** que elige `perder_grasa`, **cuando** la meta implicaría un IMC menor que P-006, **entonces** no se guarda y se propone la meta mínima segura (RN-OBJ-005).
4. **Dado** que no quiere dar su peso, **cuando** elige [Prefiero no decirlo], **entonces** el objetivo se fija como `ser_constante` o el elegido sin metas de peso, y puede añadir el peso después.

### HU-001-3 · Contarle al bot mi hábito (P1)
Como usuario, quiero decir qué días, a qué hora y dónde entreno para que el plan esté listo antes.

1. **Dado** el paso de hábito, **cuando** marca días (botones L–D) y una franja horaria, **entonces** se guarda el hábito declarado por día (RN-PLAN-002).
2. **Dado** el paso de lugar, **cuando** elige [Gym] [Casa] [Ambos] y su equipamiento en casa, **entonces** se guarda el perfil de equipamiento para la versión B (RN-PLAN-003).

### HU-001-4 · Tamizaje de seguridad (P1)
Ver [[spec-009-seguridad-y-privacidad]] (HU-009-2 y HU-009-3). Este flujo los incluye en el orden de [[flujos-de-usuario]].

### HU-001-5 · Elegir cuánto me escribe el bot (P2)
1. **Dado** el paso de mensajes, **cuando** elige [Baja] [Normal] [Alta] y confirma o cambia las horas de silencio, **entonces** se guardan intensidad y silencio (RN-MSJ-002, RN-MSJ-004).

### HU-001-6 · Cambiar de objetivo sin perder nada (P3)
1. **Dado** un objetivo activo, **cuando** el usuario elige otro en `/ajustes`, **entonces** el anterior se cierra como `cambiado`, el historial se conserva y se genera un plan nuevo (RN-OBJ-007).

## 3. Requisitos funcionales

| ID | Requisito |
|---|---|
| FR-001-01 | El sistema DEBE iniciar el onboarding con `/start` y permitir retomarlo donde quedó si se interrumpe. |
| FR-001-02 | El sistema DEBE mostrar el aviso de privacidad y registrar el consentimiento antes de pedir cualquier dato sensible (RN-DAT-001, RN-DAT-002). |
| FR-001-03 | El sistema DEBE verificar la mayoría de edad declarada antes de crear el perfil (RN-SEG-001). |
| FR-001-04 | El sistema DEBE ofrecer los 6 tipos de objetivo del catálogo (RN-OBJ-001). |
| FR-001-05 | El sistema DEBE calcular una meta propuesta con horizonte por defecto y validarla contra los límites (RN-OBJ-002 a RN-OBJ-005). |
| FR-001-06 | El sistema DEBE permitir ajustar la meta con botones sin superar los límites. |
| FR-001-07 | El sistema DEBE capturar nivel, días disponibles, franja horaria por día, minutos por sesión, lugar y equipamiento (RN-PLAN-001, RN-PLAN-002). |
| FR-001-08 | El sistema DEBE ejecutar los tamizajes de SPEC-009 y aplicar sus consecuencias al plan y a la nutrición (RN-SEG-002, RN-SEG-003). |
| FR-001-09 | El sistema DEBE capturar intensidad de mensajes y horas de silencio, con valores por defecto (RN-MSJ-002, RN-MSJ-004). |
| FR-001-10 | El sistema DEBE generar el primer plan al terminar (SPEC-002) y ofrecer la sesión de hoy si es día de entreno. |
| FR-001-11 | El sistema DEBE configurar el teclado persistente (`🏋️ Hoy` · `🍽️ Comida` · `📈 Progreso`) y la lista de comandos. |

## 4. Reglas aplicables

RN-OBJ-001 a RN-OBJ-005 · RN-OBJ-007 · RN-OBJ-012 · RN-PLAN-001 · RN-PLAN-002 · RN-MSJ-002 · RN-MSJ-004 · RN-SEG-001 a RN-SEG-003 · RN-DAT-001 · RN-DAT-002.

## 5. Entidades

`User`, `Profile`, `Consent`, `Screening`, `Goal`, `TrainingHabit`, `MessagePreferences` (ver [[modelo-de-datos]]).

## 6. Criterios de éxito

| ID | Criterio |
|---|---|
| SC-001-1 | Mediana de duración del onboarding ≤ 3 min y ≤ 25 toques. |
| SC-001-2 | 100 % de las metas guardadas dentro de los límites (G02 = 0). |
| SC-001-3 | ≥ 80 % de quienes inician `/start` terminan el onboarding (alfa). |

## 7. Eventos

`onboarding_started` · `onboarding_step_completed` (paso) · `consent_given` (categorías) · `screening_completed` (resultado por categoría, sin respuestas) · `goal_set` (tipo, horizonte, ritmo) · `goal_adjusted` (dirección, ¿limitado?) · `habit_declared` (días, franjas) · `onboarding_completed` (duración_ms, toques).

## 8. Casos límite

- El usuario abandona a mitad: al volver con cualquier mensaje, el bot ofrece [Continuar] [Empezar de nuevo].
- Escribe texto en lugar de tocar un botón: se repite la pregunta con los botones (salvo palabras de alerta → SPEC-009).
- Peso fuera de rango plausible (< 35 kg o > 250 kg): se pide confirmar.
- Elige 6 días siendo novato: se le ofrece 3–4 días y se explica por qué (RN-PLAN-004).

## 9. Fuera de alcance

Registro con correo o teléfono, cuentas fuera de Telegram, importación de historial de otras apps.

## 10. Aclaraciones pendientes

- `[NEEDS CLARIFICATION: Q4]` Instrumento exacto de los tamizajes (ver SPEC-009).
- `[NEEDS CLARIFICATION]` ¿Preguntar la cintura en el onboarding o solo después en `/progreso`? Propuesta: después, para no alargar el inicio.
