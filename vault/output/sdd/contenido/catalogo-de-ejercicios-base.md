---
titulo: Catálogo base de ejercicios y equivalencias gym / casa / exprés
tipo: sdd-contenido
hito: H3
estado: borrador
version: 0.1.0
creado: 2026-10-18
actualizado: 2026-10-18
deriva_de: [constancia-en-cualquier-lugar, fundamentos-de-entrenamiento]
fuentes: [F53]
relacionados: [spec-002-plan-y-sesion-del-dia, parametros, reglas-de-negocio]
---

# Catálogo base de ejercicios

> [!warning] `[VALIDAR-PROFESIONAL]`
> Catálogo inicial para la Fase 0 (uso propio). Un entrenador certificado debe revisar ejercicios, progresiones y notas de seguridad antes de la alfa (Q4). Cada ejercicio de la versión A tiene equivalentes B y C del mismo patrón (RN-PLAN-010).

## 1. Patrones de movimiento

`SQUAT` (sentadilla) · `HINGE` (bisagra de cadera) · `PUSH_H` (empuje horizontal) · `PUSH_V` (empuje vertical) · `PULL_H` (tirón horizontal) · `PULL_V` (tirón vertical) · `SINGLE_LEG` (unilateral) · `CORE` (núcleo) · `ARMS` (accesorios de brazos).

## 2. Ejercicios

| Código | Nombre | Patrón | Versión | Equipo | Nivel | Nota de seguridad |
|---|---|---|---|---|---|---|
| `LEG_PRESS` | Prensa de piernas | SQUAT | A | Máquina | Novato | Rango de movimiento sin despegar la espalda baja |
| `SQ_BB` | Sentadilla con barra | SQUAT | A | Barra, rack | Intermedio | Usar los seguros del rack |
| `SQ_GOBLET` | Sentadilla *goblet* | SQUAT | A/B | Mancuerna, kettlebell o mochila | Novato | — |
| `SQ_BW` | Sentadilla con peso corporal | SQUAT | B/C | Ninguno | Novato | — |
| `RDL_BB` | Peso muerto rumano con barra | HINGE | A | Barra | Intermedio | Espalda neutra; carga moderada al inicio |
| `RDL_DB` | Peso muerto rumano con mancuernas | HINGE | A/B | Mancuernas | Novato | Espalda neutra |
| `SL_RDL` | Peso muerto a una pierna | HINGE | B | Mochila o mancuerna | Novato | Apoyo cerca para equilibrio |
| `GLUTE_BRIDGE` | Puente de glúteo | HINGE | B/C | Ninguno | Novato | — |
| `LEG_CURL` | Curl femoral en máquina | HINGE | A | Máquina | Novato | — |
| `DB_BENCH` | Press con mancuernas en banco | PUSH_H | A | Mancuernas, banco | Novato | — |
| `BENCH_BB` | Press de banca con barra | PUSH_H | A | Barra, banco | Intermedio | Con seguros o compañero de apoyo en cargas altas |
| `PUSHUP` | Flexiones (inclinadas → normales → con pies elevados) | PUSH_H | B/C | Ninguno | Novato | Progresión por dificultad, no por dolor |
| `OHP_DB` | Press militar con mancuernas | PUSH_V | A | Mancuernas | Novato | Sin arquear la zona lumbar |
| `PIKE_PUSHUP` | Flexiones en pica | PUSH_V | B/C | Ninguno | Novato | — |
| `ROW_CABLE` | Remo sentado en polea | PULL_H | A | Polea | Novato | — |
| `ROW_DB` | Remo con mancuerna a una mano | PULL_H | A/B | Mancuerna, banco | Novato | — |
| `ROW_BAND` | Remo con banda | PULL_H | B | Banda elástica | Novato | Anclaje firme |
| `ROW_INVERTED` | Remo invertido bajo una mesa firme | PULL_H | B/C | Mesa estable | Novato | Verificar que la mesa no se mueva |
| `SUPERMAN` | Superman | PULL_H | C | Ninguno | Novato | — |
| `LAT_PULLDOWN` | Jalón al pecho | PULL_V | A | Polea | Novato | — |
| `PULLUP` | Dominadas (asistidas → completas) | PULL_V | A/B | Barra | Intermedio | — |
| `BAND_PULLDOWN` | Jalón con banda | PULL_V | B | Banda elástica | Novato | Anclaje alto firme |
| `LUNGE_DB` | Zancadas con mancuernas | SINGLE_LEG | A | Mancuernas | Novato | — |
| `SQ_BULGARIAN` | Sentadilla búlgara | SINGLE_LEG | A/B | Banco o silla firme | Novato | Silla estable |
| `REVERSE_LUNGE` | Zancada hacia atrás | SINGLE_LEG | B/C | Ninguno | Novato | — |
| `PLANK` | Plancha (y variantes laterales) | CORE | A/B/C | Ninguno | Novato | — |
| `CURL_DB` | Curl de bíceps con mancuernas | ARMS | A/B | Mancuernas | Novato | — |
| `TRI_CABLE` | Extensión de tríceps en polea | ARMS | A | Polea | Novato | — |
| `DIPS_CHAIR` | Fondos en silla | ARMS | B | Silla firme | Novato | Detener si molesta el hombro |

## 3. Equivalencias por patrón

| Patrón | A (gym) | B (casa) | C (exprés) |
|---|---|---|---|
| SQUAT | `LEG_PRESS` · `SQ_BB` · `SQ_GOBLET` | `SQ_GOBLET` · `SQ_BW` | `SQ_BW` |
| HINGE | `RDL_BB` · `RDL_DB` · `LEG_CURL` | `SL_RDL` · `RDL_DB` · `GLUTE_BRIDGE` | `GLUTE_BRIDGE` |
| PUSH_H | `BENCH_BB` · `DB_BENCH` | `PUSHUP` | `PUSHUP` |
| PUSH_V | `OHP_DB` | `PIKE_PUSHUP` | `PIKE_PUSHUP` |
| PULL_H | `ROW_CABLE` · `ROW_DB` | `ROW_BAND` · `ROW_INVERTED` · `ROW_DB` | `ROW_INVERTED` · `SUPERMAN` |
| PULL_V | `LAT_PULLDOWN` · `PULLUP` | `PULLUP` · `BAND_PULLDOWN` | — (se compensa con PULL_H) |
| SINGLE_LEG | `LUNGE_DB` · `SQ_BULGARIAN` | `SQ_BULGARIAN` · `REVERSE_LUNGE` | `REVERSE_LUNGE` |
| CORE | `PLANK` | `PLANK` | `PLANK` |
| ARMS | `CURL_DB` · `TRI_CABLE` | `CURL_DB` · `DIPS_CHAIR` | — |

## 4. Versión C (exprés de 15 minutos) — estructura propuesta

Circuito de 5 ejercicios (`SQ_BW`, `PUSHUP`, `REVERSE_LUNGE`, `ROW_INVERTED` o `SUPERMAN`, `PLANK`), 3 rondas, 40 s de trabajo y 20 s de pausa, con 1 minuto entre rondas `[VALIDAR-PROFESIONAL]`. Para el usuario no entrenado, las cargas bajas producen ganancias sustanciales (`F53`); en casa, las series se acercan al fallo dejando 1–3 repeticiones en reserva (P-016).
