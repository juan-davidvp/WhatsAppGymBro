---
titulo: Catálogo de logros y niveles
tipo: sdd-contenido
hito: H3
estado: borrador
version: 0.1.0
creado: 2026-10-18
actualizado: 2026-10-18
deriva_de: [sistema-de-gamificacion, objetivos-y-progreso]
fuentes: [F45]
relacionados: [spec-005-dia-que-cuenta-y-gamificacion, spec-006-progreso-logros-y-mantenimiento, parametros]
---

# Catálogo de logros y niveles

## 1. Niveles (RN-GAM-007, P-040)

| Nivel | Código | Nombre | XP acumulado |
|---|---|---|---|
| 1 | `L1` | Arranque | 0 |
| 2 | `L2` | En marcha | 300 |
| 3 | `L3` | Constante | 900 |
| 4 | `L4` | Firme | 1.800 |
| 5 | `L5` | Disciplinado | 3.000 |
| 6 | `L6` | Inquebrantable | 4.500 |
| 7 | `L7` | De hierro | 6.500 |
| 8 | `L8` | De acero | 9.000 |
| 9 | `L9` | Titán | 12.000 |
| 10 | `L10` | Leyenda | 16.000 |

Nombres pendientes de validación con usuarios (H1).

## 2. Logros (RN-GAM-011)

| Código | Nombre | Condición | Dato guardado |
|---|---|---|---|
| `FIRST_SESSION` | Primer día | Primera sesión completada | Fecha, versión |
| `FIRST_HOME` | En casa también | Primera sesión B o C completada | Fecha |
| `FIRST_COMPLETE_DAY` | Día completo | Primer día con ambas mitades | Fecha |
| `CH66_7` | Capítulo 1 | 7 días que cuentan acumulados | Fecha |
| `CH66_21` | Capítulo 2 | 21 días que cuentan acumulados | Fecha |
| `CH66_45` | Capítulo 3 | 45 días que cuentan acumulados | Fecha |
| `CH66_66` | Hábito forjado | 66 días que cuentan acumulados (`F45`) | Fecha, semanas transcurridas |
| `DQC_100` · `DQC_200` · `DQC_365` | Centenario · Doble centenario · Un año de días | Días que cuentan acumulados | Fecha |
| `WEEK_1` | Primera semana cumplida | Primera semana cumplida | Fecha |
| `WEEKS_4` · `WEEKS_12` | Mes sólido · Trimestre sólido | Semanas cumplidas seguidas | Fecha |
| `FIRST_PR` | Primer récord | Primer récord personal | Ejercicio, valor |
| `PR_10` | Diez récords | 10 récords personales | Fecha |
| `COMEBACK` | El regreso | Primer día que cuenta tras 7+ días sin actividad | Fecha, días de pausa |
| `STREAK_REPAIRED` | Reparado | Primera racha reparada | Fecha |
| `PROTEIN_WEEK` | Semana de proteína | 7 días seguidos con la mitad de comida | Fecha |
| `BEST_WEEK` | Mejor semana | Nueva mejor semana en días que cuentan | Valor |
| `GOAL_DONE` | Sí era posible | Objetivo cumplido | Resumen del capítulo |
| `MAINTENANCE_4W` | Sostener también es ganar | 4 semanas cumplidas en mantenimiento | Fecha |
| `SEASON_DONE` | Temporada cerrada | Cierre de una temporada con su meta | Temporada |
| `SKILL_PULLUP` | Primera dominada | Habilidad de maestría registrada (mantenimiento) | Fecha |

**Reglas:** los logros se guardan en la bitácora con fecha, tipo, valor y contexto y no se borran (RN-GAM-011). Ningún logro premia bajar de peso, comer menos ni entrenar en días de descanso (RN-GAM-014).
