---
titulo: SPEC-005 · Día que cuenta, racha y gamificación
tipo: sdd-spec
id: SPEC-005
hito: H3
estado: borrador
version: 0.1.0
fase: 0
prioridad: P1
depende_de: [SPEC-003, SPEC-004]
creado: 2026-10-18
actualizado: 2026-10-18
deriva_de: [cada-dia-cuenta, sistema-de-gamificacion, estrategia-anti-novedad, gamificacion-y-habitos]
fuentes: [F45, F46]
relacionados: [spec-006-progreso-logros-y-mantenimiento, spec-007-proactividad-y-mensajes, catalogo-de-logros-y-niveles, parametros]
---

# SPEC-005 · Día que cuenta, racha y gamificación

## 1. Propósito

Hacer visible que **cada día cuenta** (FB-001-07) con las mecánicas de constancia de Duolingo adaptadas a quien entrena solo (FB-001-02, FB-001-09), **sin castigar nunca** (FB-001-17).

## 2. Historias de usuario

### HU-005-1 · Saber si mi día ya cuenta (P1)
1. **Dado** un día de entreno, **cuando** completa una sesión A, B o C, **entonces** recibe "Día que cuenta n.º N" con la semana en una línea (`L ✅ M ⭐ …`) (RN-DQC-002).
2. **Dado** un día de descanso, **cuando** cumple la proteína o la recuperación activa, **entonces** el día cuenta (RN-DQC-003).
3. **Dado** que cumple ambas mitades, **cuando** se evalúa el día, **entonces** se marca ⭐ completo (RN-DQC-004).
4. **Dado** `🏋️ Hoy`, **cuando** el día no cuenta todavía, **entonces** ve qué le falta con un botón para hacerlo.

### HU-005-2 · Racha que no castiga (P1)
1. **Dado** un día que no cuenta y un comodín disponible, **cuando** se cierra el día (fin de la gracia), **entonces** se aplica el comodín y la racha sigue (RN-GAM-002).
2. **Dado** un día que no cuenta sin comodín, **cuando** se cierra, **entonces** la racha vuelve a 0, el total acumulado no cambia y se ofrece reparar durante P-035 horas (RN-GAM-003, RN-DQC-007).
3. **Dado** P-033 días que cuentan seguidos, **cuando** se cierra el último, **entonces** gana un comodín si tiene menos de P-034.

### HU-005-3 · Puntos y niveles (P1)
1. **Dado** cualquier evento de la tabla P-038, **cuando** ocurre, **entonces** se suma su XP sin superar el tope diario P-039 (RN-GAM-005).
2. **Dado** que el XP cruza un umbral de P-040, **cuando** se suma, **entonces** sube de nivel y se registra el logro (RN-GAM-007).
3. **Dado** cualquier situación, **cuando** se calcula el XP, **entonces** nunca disminuye (RN-GAM-006).

### HU-005-4 · Bonificación de regreso (P1)
1. **Dado** un día de entreno no cumplido, **cuando** el siguiente día que cuenta se cierra, **entonces** recibe la bonificación de regreso y el mensaje "Volver también suma" (RN-GAM-013).

### HU-005-5 · Semana cumplida (P1)
1. **Dado** el domingo al cierre, **cuando** las sesiones completadas ≥ compromiso (RN-GAM-004), **entonces** la semana queda cumplida, suma XP y extiende la racha de semanas.

### HU-005-6 · Misiones semanales (P2)
1. **Dado** el lunes, **cuando** se generan las misiones, **entonces** son 3 (entreno, comida, constancia o variedad) con dificultad P-041 × lo logrado la semana anterior (RN-GAM-008).

### HU-005-7 · Reto 66 y logros (P2)
1. **Dado** que alcanza 7, 21, 45 o 66 días que cuentan acumulados, **cuando** se cierra ese día, **entonces** se desbloquea el capítulo y se guarda en la bitácora; con 66, "Hábito forjado" (RN-GAM-012, RN-GAM-011).

### HU-005-8 · Liga personal y temporadas (P3)
1. **Dado** el resumen semanal, **cuando** se compara, **entonces** solo se compara con la semana anterior y la mejor semana propia (RN-GAM-009).
2. **Dado** un lunes de inicio de temporada, **cuando** empieza, **entonces** se anuncia tema y meta; al cerrar, insignia (RN-GAM-010).

## 3. Requisitos funcionales

| ID | Requisito |
|---|---|
| FR-005-01 | El estado del día DEBE calcularse en el dominio a partir de sesiones, comidas, actividades importadas y plan, y recalcularse hasta el fin de la gracia (RN-DQC-001 a RN-DQC-005). |
| FR-005-02 | El cierre del día DEBE ser un proceso programado e idempotente (cerrar dos veces no cambia el resultado). |
| FR-005-03 | El XP DEBE guardarse como un libro de movimientos solo de suma (cada movimiento con evento y monto). |
| FR-005-04 | Racha, comodines, reparación, semanas y niveles DEBEN ser funciones puras del dominio con pruebas por regla. |
| FR-005-05 | Ningún texto de esta funcionalidad DEBE contener expresiones prohibidas (RN-MSJ-011, RN-GAM-014). |
| FR-005-06 | Toda mecánica salvo el día que cuenta DEBE poder desactivarse en `/ajustes` (principio E9). |
| FR-005-07 | Ante una señal de riesgo del día (SPEC-009), las mecánicas de juego se pausan ese día (RN-SEG-007). |

## 4. Reglas aplicables

RN-DQC-001 a RN-DQC-007 · RN-GAM-001 a RN-GAM-014 · RN-SEG-007.

## 5. Entidades

`Day`, `Streak`, `StreakFreeze`, `XpLedgerEntry`, `Level`, `Week`, `WeeklyQuest`, `Season`, `Achievement`, `Challenge66Progress`.

## 6. Criterios de éxito

| ID | Criterio |
|---|---|
| SC-005-1 | Pruebas de propiedades: para cualquier secuencia de días, el total acumulado y el XP nunca disminuyen. |
| SC-005-2 | Tasa de regreso en ≤ 48 h tras un día fallado (M07) medida desde la Fase 0. |
| SC-005-3 | Índice de sostenimiento ≥ 0,8 en la alfa (H08). |

## 7. Eventos

`day_closed` (tipo, cuenta, completo, fuente) · `streak_extended` · `freeze_earned` · `freeze_used` · `streak_reset` · `streak_repair_offered` · `streak_repaired` · `xp_awarded` (evento, monto) · `level_up` (nivel) · `week_closed` (cumplida, sesiones, compromiso) · `quest_generated` · `quest_completed` · `achievement_unlocked` (código) · `season_started` · `season_closed`.

## 8. Casos límite

- Cambio de zona horaria (viaje): el día operativo usa la zona vigente al inicio del día.
- Sesión registrada con "La hice tal cual" dentro de la gracia: el día anterior pasa a contar y la racha se recalcula.
- Semana con 0 sesiones planificadas (vacaciones): la semana no se evalúa (ni cumplida ni rota) si el usuario usó `/pausa` o pausó el objetivo.

## 9. Fuera de alcance

Rankings entre usuarios, tienda de recompensas, monedas canjeables, desafíos entre amigos.

## 10. Aclaraciones pendientes

- `[NEEDS CLARIFICATION]` Nombres de los niveles: validar con usuarios en H1.
- `[NEEDS CLARIFICATION]` ¿Mostrar la racha diaria y la de semanas a la vez desde el día 1? Propuesta: la diaria desde el día 1; la de semanas desde la segunda semana.
