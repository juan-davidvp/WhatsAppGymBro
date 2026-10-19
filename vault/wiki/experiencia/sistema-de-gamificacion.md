---
titulo: Sistema de gamificación individual — mecánicas, economía y reglas éticas
tipo: diseno
hito: H2
estado: en-revision
creado: 2026-10-18
actualizado: 2026-10-18
fuentes: [F10, F11, F25, F26, F45, F46, F48, F49, F50, F51]
relacionados: [gamificacion-y-habitos, cada-dia-cuenta, estrategia-anti-novedad, objetivos-y-progreso, spec-005-dia-que-cuenta-y-gamificacion, catalogo-de-logros-y-niveles, parametros]
---

# Sistema de gamificación

> Responde a FB-001-02 ("utilizar los mecanismos de gamificación") con el referente de Duolingo, adaptado a un usuario que **entrena solo** (FB-001-09) y a un producto **sin personaje** (ADR-006). Evidencia en [[gamificacion-y-habitos]]; valores en [[parametros]].

## 1. Tesis

La gamificación **amplifica** la constancia, pero no la sostiene sola: su efecto existe y disminuye con el tiempo (`F25`), y frente a apps sin juego el incremento es pequeño (`F26`). Por eso cada mecánica tiene un **trabajo conductual concreto** y una métrica que la justifica; si no mueve su métrica, se retira.

## 2. Mapa Duolingo → Gym Bro

| Mecánica de Duolingo | Qué hizo en Duolingo | Adaptación en Gym Bro | Trabajo conductual |
|---|---|---|---|
| Racha | La racha y sus mejoras fueron palancas de retención; usuarios con racha de 10+ días abandonaron menos (`F51`); 15,4 M restauraron su racha en un evento de 2026 (`F11`) | **Racha de días que cuentan**, con descanso incluido | Volver cada día |
| *Streak freeze* | Cambios en los protectores de racha dieron mejoras de retención (`F51`) | **Comodín** automático y **reparar racha** | Quitar el miedo a fallar |
| XP | Moneda de progreso | **Puntos de esfuerzo** | Recompensa inmediata |
| Niveles | Progreso de largo plazo | **10 niveles con nombre de identidad** | Identidad ("soy constante") |
| Ligas | +17 % de tiempo de aprendizaje (`F51`) | **Liga contra ti mismo**: tu semana vs. tu semana anterior y tu mejor semana | Superarse sin exponerse |
| Misiones | Variedad diaria | **3 misiones semanales** adaptativas | Renovación |
| Eventos | Temporadas y retos | **Temporadas de 6 semanas** que empiezan en lunes (`F48`) | Nuevos comienzos |
| Logros | Insignias | **Bitácora** con fecha y dato | Memoria de lo logrado (JTBD-04) |
| Notificaciones optimizadas | Rotación con penalización por recencia (`F50`) | Rotación de plantillas (ver [[proactividad-sin-spam]]) | Evitar habituación |
| — | — | **Bonificación de regreso** | Volver después de fallar (`F46`) |

## 3. Mecánicas y reglas

### 3.1 Racha, comodín y reparación
- **Racha** = días que cuentan consecutivos (RN-GAM-001).
- **Comodín:** se gana 1 por cada 7 días que cuentan consecutivos; se acumulan hasta 2; se aplica solo cuando un día no cuenta (RN-GAM-002).
- **Reparar racha:** si se rompe sin comodín, hay 48 h para una **misión de regreso** (sesión exprés + proteína); máximo una vez cada 30 días (RN-GAM-003).
- **Mensaje al romperse:** destaca el total acumulado, que nunca baja (RN-DQC-007).

### 3.2 Semanas cumplidas (Estrella del Norte)
Una semana se cumple cuando las sesiones completadas alcanzan el compromiso: las sesiones planificadas menos una si son tres o más (RN-GAM-004). La **racha de semanas** es más tolerante que la diaria y refleja el objetivo real: entrenar cada semana.

### 3.3 Puntos de esfuerzo (XP)

| Evento | XP |
|---|---|
| Sesión versión A (gym) o B (casa) | 50 |
| Sesión versión C (exprés) | 30 |
| Misión de descanso cumplida | 20 |
| Mitad de comida cumplida | 15 |
| Bonificación por día completo | 20 |
| Récord personal | 25 |
| Bonificación de regreso (primer día que cuenta tras un día de entreno fallado) | 30 |
| Misión semanal cumplida | 40 |
| Semana cumplida | 100 |
| **Tope diario** | **150** |

- La casa vale lo mismo que el gym: la constancia importa más que el lugar (FB-001-13).
- El **tope diario** evita premiar entrenar dos veces al día o en días de descanso (RN-GAM-005, RN-SEG-008).
- **El XP nunca se pierde** (RN-GAM-006).

**Economía esperada** (plan de 4 días/semana): ≈ 500 XP en una semana normal (4 sesiones, 3 misiones de descanso, proteína 4 días, 2 días completos, 1 misión y la semana cumplida) y hasta ≈ 750 en una semana perfecta `[cálculo sobre la tabla]`.

### 3.4 Niveles de identidad

| Nivel | Nombre | XP acumulado | Semana aproximada con ~500 XP/semana |
|---|---|---|---|
| 1 | Arranque | 0 | 1 |
| 2 | En marcha | 300 | 1 |
| 3 | Constante | 900 | 2 |
| 4 | Firme | 1.800 | 4 |
| 5 | Disciplinado | 3.000 | 6 |
| 6 | Inquebrantable | 4.500 | 9 |
| 7 | De hierro | 6.500 | 13 |
| 8 | De acero | 9.000 | 18 |
| 9 | Titán | 12.000 | 24 |
| 10 | Leyenda | 16.000 | 32 |

Los primeros niveles llegan rápido (enganche); los siguientes se espacian para acompañar el valle de las semanas 4–10. Nombres a validar con usuarios (H1).

### 3.5 Misiones semanales
Cada lunes, 3 misiones: una de entreno, una de comida y una de constancia o variedad. Su dificultad es ≈ 80 % de lo logrado la semana anterior (RN-GAM-008), para que sean alcanzables. Ejemplos: "Cierra tu proteína 4 días", "Haz 1 sesión en casa", "Supera 1 récord", "Registra 3 desayunos con un toque".

### 3.6 Liga contra ti mismo
Cada domingo: "Esta semana: 6 días que cuentan (la anterior: 5). Tu mejor semana: 7." Sin rankings entre usuarios en las Fases 0–1 (RN-GAM-009, ADR-009).

### 3.7 Temporadas
Bloques de 6 semanas que empiezan en lunes, con tema, meta y cierre con insignia (RN-GAM-010). Ejemplos: "Temporada de fuerza", "Temporada en casa", "Temporada de proteína". En mantenimiento, las temporadas son de **maestría** (habilidades como la dominada estricta o la sentadilla a una pierna).

### 3.8 Reto 66 y logros
- **Reto 66:** 66 días que cuentan **acumulados** (no consecutivos), con capítulos en 7, 21, 45 y 66; al completarlo se desbloquea "Hábito forjado" (RN-GAM-012). La cifra viene de la mediana de automaticidad (`F45`), con rango amplio: se presenta como referencia, no como promesa.
- **Logros:** catálogo en [[catalogo-de-logros-y-niveles]]; cada logro se guarda en la bitácora con fecha y dato (RN-GAM-011).

## 4. Principios éticos (no negociables)

| # | Principio | Razón |
|---|---|---|
| E1 | El descanso planificado cuenta | Evitar el sobreentrenamiento |
| E2 | Se premia la constancia y el esfuerzo, nunca el déficit ni la pérdida de peso | Prevenir conductas de riesgo alimentario |
| E3 | El XP y el total de días nunca se pierden | No castigar (FB-001-17) |
| E4 | Sin rankings de cuerpo, peso ni fotos | Proteger la imagen corporal |
| E5 | Sin personaje que sufra ni culpa manipuladora | ADR-006 |
| E6 | Competencia solo contra uno mismo | Segmento no social (FB-001-09) |
| E7 | Tope diario de XP | Evitar el uso compulsivo |
| E8 | Volver siempre suma más que nunca haber fallado | El regreso es la conducta más valiosa (`F46`) |
| E9 | Toda mecánica es desactivable salvo el día que cuenta | Respeto por quien no disfruta el juego |
| E10 | Cada mecánica tiene métrica; si no mueve su métrica, se retira | Evitar acumulación de "juego" sin efecto |

## 5. Métrica por mecánica

| Mecánica | Métrica que la justifica |
|---|---|
| Racha + comodín | Abandono en ≤ 3 días después de un día fallado |
| Reparar racha | % de rachas reparadas que siguen activas 14 días después |
| Bonificación de regreso | Tasa de regreso en ≤ 48 h (M07) |
| Misiones | Tasa de cumplimiento; DQC de la semana con misión vs. sin misión |
| Liga personal | DQC de la semana siguiente a una semana récord |
| Temporadas | Reactivación al inicio de cada temporada |
| Niveles y logros | Retención de usuarios con ≥ 1 logro vs. sin logros |
