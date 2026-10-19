---
titulo: Estrategia anti-novedad — cómo sostener el uso más allá de las primeras semanas
tipo: producto
hito: H0
estado: en-revision
creado: 2026-10-18
actualizado: 2026-10-18
fuentes: [F16, F25, F31, F45, F46, F47, F48, F49, F50, F51, F52]
relacionados: [propuesta-de-valor, gamificacion-y-habitos, sistema-de-gamificacion, proactividad-sin-spam, cada-dia-cuenta, registro-sin-friccion, objetivos-y-progreso, plan-de-medicion]
---

# Estrategia anti-novedad

> Responde a FB-001-03: *"Riesgo más crítico… ¿cómo evitar este riesgo?"*. Al eliminar el personaje (ADR-006), el riesgo se reformula: **ya no es que la relación con un personaje se desgaste, sino que la constancia dependa de lo nuevo que se siente el producto y no del hábito.**

## 1. Por qué el uso decae (evidencia)

| Fenómeno | Evidencia | Implicación |
|---|---|---|
| La gamificación pierde fuerza | Su efecto sobre la actividad física persiste pero disminuye con el tiempo (`F25`) | La gamificación amplifica; no sostiene sola |
| Las intervenciones terminan y el efecto se va | De 54 programas de 4 semanas para ir al gym, cerca del 45 % aumentó las visitas, pero solo ~8 % dejó un efecto medible después (`F46`) | Hay que diseñar para el día 60, no solo para la semana 1 |
| Los mensajes proactivos generan habituación | En HeartSteps, el efecto de las sugerencias de caminar se deterioró a lo largo del estudio de 42 días (`F49`) | Variar, espaciar y medir cada mensaje |
| Repetir el mismo mensaje pierde efecto | Duolingo comprobó que una plantilla enviada recientemente rinde menos y que su efecto se recupera con el tiempo (`F50`) | Rotar plantillas con penalización por recencia |
| Las apps con IA retienen peor a 12 meses | Retención anual 21,1 % vs. 30,7 % sin IA (`F16`) | El valor no puede depender de la "magia" de la IA |

## 2. Principio rector

> **La novedad abre la puerta; la utilidad diaria y el hábito la mantienen abierta.** El papel del producto cambia con el tiempo: primero engancha, luego consolida, después se aparta (menos mensajes) y al final sostiene (mantenimiento).

## 3. Diez palancas

| # | Palanca | Mecanismo | Evidencia | Elemento de producto | Métrica | Reglas |
|---|---|---|---|---|---|---|
| 1 | **Utilidad que no depende de la novedad** | Ahorra decisiones y tiempo todos los días | Fricción = causa n.º 1 (FB-001-08, `F31`) | Plan listo; confirmar en 1 toque; "lo de siempre" | Toques por serie; segundos por comida | RN-ENT-001, RN-NUT-004 |
| 2 | **Anclar a señales del entorno** | Plan atado al día y la hora habituales | Planes "si–entonces": d = 0,65 (`F47`) | Hábito declarado y aprendido; plan listo antes de la hora | % de sesiones iniciadas ±60 min de la hora habitual | RN-PLAN-002, RN-MSJ-005, RN-MSJ-006 |
| 3 | **Regreso sin castigo y premiado** | Quitar el costo emocional de fallar | Un día fallado no deshace el hábito (`F45`); premiar el regreso fue la mejor intervención (`F46`) | Comodines, reparar racha, bonificación de regreso, plan sin deuda | Regreso en ≤ 48 h (M07) | RN-GAM-002, 003, 013, RN-PLAN-007 |
| 4 | **Nuevos comienzos programados** | Aprovechar los lunes y los inicios de mes | Efecto de nuevo comienzo (`F48`) | Temporadas que inician en lunes; plan y resumen el domingo; reactivación en lunes o día 1 | Reactivaciones en esas fechas | RN-GAM-010, RN-MSJ-008 |
| 5 | **Renovación contra la habituación** | Que algo cambie cada semana | `F49`, `F50`, `F25` | Misiones semanales adaptativas; temporadas; rotación de plantillas | Tasa de acción por plantilla en el tiempo | RN-GAM-008, RN-MSJ-010 |
| 6 | **Progreso visible con horizonte** | Ver que cada día suma hacia algo | Mediana de 66 días hasta la automaticidad (`F45`) | Contador que nunca baja, muro, Reto 66, barra del objetivo | DQC por semana (M01) | RN-DQC-007, RN-GAM-012 |
| 7 | **Identidad y memoria de logros** | Pasar de "estoy intentando" a "soy alguien que entrena" `[inferencia]` | JTBD-04 (FB-001-18) | Niveles con nombre de identidad; bitácora | Retención de usuarios con ≥ 1 logro vs. sin logros | RN-GAM-007, RN-GAM-011 |
| 8 | **Datos que llegan solos** | Menos esfuerzo para que el día cuente | Fricción (FB-001-08) | Puente de ingesta de pasos y actividades; actividad importada cuenta | % de DQC con datos pasivos | RN-ENT-006, RN-INT-003 |
| 9 | **Respetar el canal** | Un canal silenciado no se recupera | Duolingo no aumenta la cantidad de notificaciones sin una justificación fuerte (`F51`) | Presupuesto, silencio, retroceso, pausa, desvanecimiento | Tasa de bloqueo (G03); uso de `/pausa` (G04) | RN-MSJ-002 a 009, 013 |
| 10 | **Mantenimiento con propósito** | Que cumplir la meta no sea el final | La fuerza se mantiene con dosis mínimas (`F52`) | Modo mantenimiento y maestría | Retención después del objetivo | RN-MAN-001 a 005 |

## 4. Curva de los primeros 90 días (hipótesis)

| Etapa | Días | Riesgo dominante | Estado emocional esperado | Intervención |
|---|---|---|---|---|
| Enganche | 1–7 | Fricción del primer uso | Entusiasmo, curiosidad | Onboarding ≤ 3 min; primera sesión el mismo día; primer logro rápido |
| Primera caída | 8–21 | Primer día fallado; "no veo cambios" | Duda | Comodín automático; misión de regreso; mensaje "tus días no se pierden" |
| Valle | 22–45 | Habituación a los mensajes; aburrimiento | Rutina sin brillo | Misiones nuevas; primera temporada; récords; menos mensajes, más útiles |
| Consolidación | 46–66 | Interrupción por evento de vida | Orgullo cuando lo nota | Capítulos del Reto 66; versión casa/exprés; resumen con comparación |
| Autonomía | 67–90 | El producto se vuelve prescindible | Seguridad | Desvanecimiento de recordatorios; maestría; foco en resultados del mes |

## 5. Pre-mortem

*Es julio de 2027 y la mayoría de los usuarios dejó de usar Gym Bro en la semana 6. ¿Qué pasó?*

| Causa probable | Contramedida | Señal temprana |
|---|---|---|
| Registrar seguía siendo tedioso | Presupuestos de toques y segundos (H04) | Mediana > 1 toque por serie o > 20 s por comida |
| Los mensajes se sintieron spam | Presupuesto y retroceso (ADR-011) | Bloqueos, `/pausa`, tasa de acción < 30 % |
| Un mal día rompió la racha y con ella la motivación | Comodines, reparar, contador acumulado | Abandono en ≤ 3 días después de una racha rota |
| El plan no encajaba con su vida | Versiones B/C; reprogramar sin deuda | Muchos [Hoy no puedo] sin uso de B/C |
| No veía resultados | Capas de proceso y rendimiento | Pocas visitas a `/progreso`; caída de DQC |
| Todo se volvió igual | Misiones, temporadas, rotación | Tasa de acción en caída sostenida |
| Cumplió su meta y no había nada más | Mantenimiento | Abandono en ≤ 2 semanas tras el objetivo |
| El canal no era el suyo | H10; núcleo independiente del canal | Reclutamiento con alta tasa de rechazo por "no uso Telegram" |

## 6. Alertas tempranas de abandono (por usuario)

| Señal | Definición | Respuesta automática |
|---|---|---|
| S1 | 2 días de entreno planificados seguidos sin sesión | 1 mensaje `regreso` con versión exprés (RN-MSJ-008) |
| S2 | 3 mensajes proactivos seguidos sin interacción | Presupuesto a la mitad por 7 días (RN-MSJ-007) |
| S3 | DQC semanal cae ≥ 50 % frente al promedio de 3 semanas | La misión semanal siguiente se vuelve más fácil (RN-GAM-008) |
| S4 | 7 días sin actividad | Mensaje final y pausa de proactivos (RN-MSJ-008) |

## 7. Cómo se mide la novedad

**Índice de sostenimiento (IS)** = DQC promedio de las semanas 5–8 ÷ DQC promedio de las semanas 1–4 de cada usuario.

| IS | Lectura |
|---|---|
| ≥ 0,8 | El hábito se sostiene (meta) |
| 0,6–0,8 | Erosión: revisar palancas 3, 5 y 9 |
| < 0,6 | El uso dependía de la novedad: alerta roja |

Además: curva de retención semanal por cohorte, tasa de acción por plantilla a lo largo del tiempo y tasa de bloqueo.

## 8. Experimentos

| Experimento | Hipótesis | Cuándo |
|---|---|---|
| Concierge de 3 semanas | H03, H05, H08 (versión manual) | H1 |
| N-de-1 A-B-A | H02, H04, H06 | H4 |
| Alfa de 8 semanas | H08 (IS ≥ 0,8; ≥ 40 % activos en la semana 8) | Alfa |
| Bonificación de regreso sí/no | Efecto sobre M07 | Fase 1 (requiere más usuarios) |
