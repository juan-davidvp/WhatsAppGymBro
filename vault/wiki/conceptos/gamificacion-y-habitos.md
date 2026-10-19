---
titulo: Gamificación y formación de hábitos — evidencia
tipo: concepto
hito: H0
estado: en-revision
creado: 2026-10-05
actualizado: 2026-10-18
fuentes: [F10, F11, F12, F21, F22, F23, F24, F25, F26, F34, F45, F46, F47, F48, F49, F50, F51]
relacionados: [sistema-de-gamificacion, estrategia-anti-novedad, proactividad-sin-spam, cada-dia-cuenta]
---

# Gamificación y formación de hábitos (evidencia)

> Página de **evidencia**. El diseño que se deriva de ella está en [[sistema-de-gamificacion]], [[proactividad-sin-spam]] y [[estrategia-anti-novedad]]. Actualizada el 2026-10-18 con fuentes sobre formación de hábitos, intervenciones para ir al gym y notificaciones.

## 1. Formación de hábitos

| Estudio | Hallazgo | Implicación | Fuente |
|---|---|---|---|
| Lally et al., 2010 (*European Journal of Social Psychology*) — 96 voluntarios, 84 días | La automaticidad llegó con una mediana de 66 días, con un rango de 18 a 254; fallar un día no alteró de forma relevante el proceso | Horizonte del "Reto 66"; los días fallados no deben castigarse | `F45` |
| Gollwitzer y Sheeran, 2006 — metaanálisis de 94 pruebas | Los planes "si–entonces" (cuándo, dónde, cómo) tuvieron un efecto medio de d = 0,65 sobre el logro de metas | Capturar el hábito (días, hora, lugar) y anticipar el plan | `F47` |
| Dai, Milkman y Riis, 2014 (*Management Science*) | Las conductas aspiracionales (incluidas las visitas al gym) aumentan al inicio de semanas, meses, años, semestres y tras cumpleaños | Temporadas y reactivaciones en lunes o inicio de mes | `F48` |

## 2. Intervenciones digitales para la actividad física

| Estudio | Hallazgo | Implicación | Fuente |
|---|---|---|---|
| Milkman et al., 2021 (*Nature*) — megaestudio con 61.293 socios de una cadena de gyms y 54 programas de 4 semanas | ~45 % de los programas aumentó las visitas semanales entre ~9 % y 27 %; el mejor premiaba **volver tras faltar**; solo ~8 % dejó efecto medible después del programa | Bonificación de regreso; diseñar para después de la novedad | `F46` |
| HeartSteps (Klasnja et al.) — 37 participantes, 42 días, 5 aleatorizaciones diarias | Las sugerencias de caminar aumentaron los pasos de los 30 minutos siguientes, pero el efecto se deterioró a lo largo del estudio | Los mensajes proactivos se habitúan: presupuesto y variedad | `F49` |
| Mazeas et al., 2022 (JMIR) — 16 ensayos, 2.407 participantes | La gamificación aumenta la actividad física con un efecto pequeño a mediano que persiste pero disminuye con el tiempo | Amplificador, no motor | `F25` |
| *eClinicalMedicine*, 2024 — 34 ensayos | Frente a apps sin gamificación, la mejora en pasos fue pequeña (~489 pasos/día) | El "juego" añadido aporta poco por sí solo | `F26` |
| Singh et al., 2023 (*npj Digital Medicine*) — 19 ensayos | Los chatbots mejoran actividad física, frutas y verduras y sueño; 74 % de los ensayos de baja calidad | Señal positiva con evidencia débil | `F21` |
| Metaanálisis 2025 — 12 ensayos de chatbots de ejercicio | Aumento pequeño de la actividad física, sin efecto en hábitos de ejercicio ni sedentarismo | Mover la conducta ≠ instalar el hábito | `F22` |
| Revisión de alcance JMIR, 2026 | Limitaciones recurrentes: bajo *engagement*, empatía limitada, privacidad | La retención es el problema de diseño | `F23` |
| Ensayo pragmático npj, 2026 — entrevista motivacional | Mejoras sostenidas a 9 meses | La técnica de cambio de conducta importa más que los puntos | `F24` |

## 3. Lecciones de Duolingo

| Lección | Dato | Fuente |
|---|---|---|
| La retención de usuarios actuales es la palanca principal | Su métrica de retención de usuarios actuales tuvo ~5 veces más impacto en los usuarios diarios que la segunda palanca; al subir 21 %, la deserción diaria de los mejores usuarios cayó más de 40 % | `F51` |
| La racha es el vínculo | La proporción de usuarios diarios con racha de 7+ días casi se triplicó; en 2023, más del 70 % tenía racha de más de una semana | `F51`, `F12` |
| Perder la racha duele | En 2026, 15,4 M de personas restauraron su racha en un evento, incluidos casi 8 M sin racha activa | `F11` |
| Las ligas suben el compromiso | +17 % de tiempo de aprendizaje y el triple de usuarios muy comprometidos | `F51` |
| El canal de notificaciones se protege | No aumentaban la cantidad sin justificación fuerte; optimizaban horario, plantillas y texto | `F51` |
| Las plantillas se desgastan | Una plantilla reciente rinde menos; un algoritmo con penalización por recencia aumentó 0,5 % los usuarios diarios y ~2 % la retención D1/D7 de usuarios nuevos | `F50` |
| Escala del modelo | 50,5 M de usuarios diarios y 11,5 M de suscriptores en 3T 2025 | `F10` |

## 4. Finch como contra-referente

Finch convierte el autocuidado en el cuidado de una mascota virtual y alcanzó ingresos estimados de USD 30–40 M anuales (`F34`, C). Gym Bro toma la idea de un **bucle de cuidado diario**, pero **sin mascota ni personaje** (ADR-006): el objeto que crece es el muro de días que cuentan del propio usuario.

## 5. Conclusión

La gamificación **amplifica**; la constancia la sostienen el **hábito anclado a señales**, el **regreso sin castigo**, la **renovación** y la **utilidad diaria**. `[inferencia sobre F25, F45–F51]`
