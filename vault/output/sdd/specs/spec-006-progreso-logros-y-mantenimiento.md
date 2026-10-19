---
titulo: SPEC-006 · Progreso, logros y modo mantenimiento
tipo: sdd-spec
id: SPEC-006
hito: H3
estado: borrador
version: 0.1.0
fase: 0
prioridad: P1
depende_de: [SPEC-005]
creado: 2026-10-18
actualizado: 2026-10-18
deriva_de: [objetivos-y-progreso, cada-dia-cuenta, relacion-comida-entreno, integraciones-y-ecosistema]
fuentes: [F52, F69]
relacionados: [spec-005-dia-que-cuenta-y-gamificacion, spec-007-proactividad-y-mensajes, catalogo-de-logros-y-niveles, plan-tecnico]
---

# SPEC-006 · Progreso, logros y modo mantenimiento

## 1. Propósito

Que el usuario **vea su esfuerzo y su progreso contra un objetivo** (FB-001-07, FB-001-21), **guarde sus logros para recordar que sí es posible** (JTBD-04) y tenga **un modo para mantener** cuando cumple su meta (FB-001-10).

## 2. Historias de usuario

### HU-006-1 · Resumen semanal con mi muro (P1)
1. **Dado** el domingo a la hora P-060, **cuando** el motor de mensajes lo permite, **entonces** recibe una **imagen** con el muro de constancia de las últimas 12–16 semanas (días que cuentan y completos) y un texto con: días que cuentan, sesiones vs. compromiso, proteína media, récords, comparación con la semana anterior y su mejor semana, misiones nuevas y el plan de la semana (RN-MSJ-017, RN-GAM-009).

### HU-006-2 · `/progreso` (P1)
1. **Dado** `/progreso`, **cuando** lo abre, **entonces** ve: total de días que cuentan, racha, nivel, barra del objetivo (RN-OBJ-011), Reto 66, media móvil de peso si hay datos (RN-OBJ-010) y 1RM estimado de sus ejercicios clave.
2. **Dado** [Registrar peso], **cuando** escribe un número, **entonces** se guarda y se recalculan la media móvil y la meta de proteína.

### HU-006-3 · Bitácora de logros (P1)
1. **Dado** `/logros`, **cuando** la abre, **entonces** ve sus logros en orden cronológico con fecha y dato, por ejemplo "12-nov · Récord sentadilla 80 × 5 (e1RM 93 kg)" (RN-GAM-011).

### HU-006-4 · Objetivo cumplido (P2)
1. **Dado** que la media móvil alcanza la meta y se sostiene P-007 semanas, **cuando** se detecta, **entonces** recibe un mensaje de celebración con el resumen del capítulo (semanas, días que cuentan, récords) y [Mantener] [Nueva meta] (RN-OBJ-006, RN-MAN-001).
2. **Dado** el fin del horizonte sin meta, **cuando** se cierra, **entonces** queda como `completado_parcial` con el % alcanzado y [Extender] [Ajustar] (RN-OBJ-008).

### HU-006-5 · Modo mantenimiento (P2)
1. **Dado** [Mantener] o P-009 días sin respuesta, **cuando** entra en mantenimiento, **entonces** el compromiso pasa a P-010 sesiones/semana, se fija la banda ± P-011 % y la intensidad de mensajes pasa a Baja (RN-MAN-002, RN-MAN-005).
2. **Dado** mantenimiento, **cuando** la media móvil sale de la banda P-012 semanas, **entonces** recibe un mensaje `mantenimiento` con opciones (RN-MAN-003).
3. **Dado** mantenimiento, **cuando** empieza una temporada, **entonces** es de maestría (RN-MAN-004).

### HU-006-6 · Revisión de fase (P2)
1. **Dado** P-057 semanas desde el inicio de la fase, **cuando** se revisa, **entonces** si el ritmo está fuera de límites recibe propuestas de ajuste con opciones (RN-OBJ-013).

### HU-006-7 · Mini App de progreso (P3, Should)
1. **Dado** el botón de menú del bot, **cuando** abre la Mini App, **entonces** ve el muro interactivo, la línea de tiempo de la bitácora y gráficas; el servidor valida los datos de inicio de Telegram antes de responder (`F69`).

### HU-006-8 · Tu relación comida–entreno (P3, Could)
1. **Dado** al menos 4 semanas de datos, **cuando** se genera el resumen, **entonces** puede incluir una observación del tipo "Las semanas en que cumpliste tu proteína 5+ días completaste el X % de tus sesiones", formulada como observación, no como causa.

## 3. Requisitos funcionales

| ID | Requisito |
|---|---|
| FR-006-01 | La imagen del muro DEBE generarse en el servidor a partir de los días (sin datos sensibles en la imagen más allá de los días y conteos). |
| FR-006-02 | Los cálculos de progreso, media móvil, e1RM y cumplimiento DEBEN vivir en el dominio (RN-OBJ-006 a RN-OBJ-011). |
| FR-006-03 | La bitácora DEBE ser de solo agregar; un logro no se edita ni se borra salvo borrado total (RN-GAM-011, RN-DAT-003). |
| FR-006-04 | El paso a mantenimiento DEBE actualizar compromiso, banda e intensidad en una sola operación. |
| FR-006-05 | En modo sin números, el progreso NO DEBE mostrar peso ni gramos; usa días que cuentan, sesiones y récords. |

## 4. Reglas aplicables

RN-OBJ-006 a RN-OBJ-013 · RN-MAN-001 a RN-MAN-005 · RN-GAM-009 · RN-GAM-011 · RN-MSJ-017 · RN-SEG-003.

## 5. Entidades

`Goal`, `BodyMeasurement`, `Achievement`, `AchievementLog`, `MaintenanceMode`, `WeeklySummary`.

## 6. Criterios de éxito

| ID | Criterio |
|---|---|
| SC-006-1 | El resumen semanal se envía todas las semanas sin violar silencio ni presupuesto. |
| SC-006-2 | Retención de usuarios con ≥ 1 logro vs. sin logros (alfa). |
| SC-006-3 | Retención a 4 semanas después de cumplir un objetivo (Fase 1). |

## 7. Eventos

`weekly_summary_sent` · `progress_viewed` (vista) · `weight_logged` · `achievement_log_viewed` · `goal_completed` · `goal_partially_completed` · `maintenance_entered` · `maintenance_band_exited` · `phase_reviewed` · `miniapp_opened`.

## 8. Casos límite

- Menos de 3 pesos en 7 días: "datos insuficientes" en lugar de media móvil.
- Objetivo `ser_constante`: la barra se mide en semanas cumplidas.
- Usuario en modo sin números que alcanza su meta: celebración por constancia, sin cifras de peso.

## 9. Fuera de alcance

Fotos de progreso, compartir en redes, exportar la imagen en alta resolución.

## 10. Aclaraciones pendientes

- `[NEEDS CLARIFICATION: Q9]` ¿La Mini App entra en la Fase 0?
- `[NEEDS CLARIFICATION]` ¿Cuántas semanas muestra el muro? Propuesta: 12 en el chat, 52 en la Mini App.
