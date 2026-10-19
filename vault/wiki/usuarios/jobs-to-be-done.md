---
titulo: Jobs to be Done — trabajo principal, JTBD 01–07 y mapa del trabajo
tipo: usuario
hito: H1
estado: borrador
creado: 2026-10-18
actualizado: 2026-10-18
fuentes: [F45, F46, F47]
relacionados: [usuario-cabeza-01, propuesta-de-valor, objetivos-y-progreso, registro-sin-friccion, cada-dia-cuenta]
---

# *Jobs to be Done*

> Reescritos con las observaciones FB-001-15 a FB-001-18 del PO. Formato: *Cuando… quiero… para…*. Los resultados deseados de la §4 son el instrumento para priorizar en H1.

## 1. Trabajo principal

> **Volverme constante en el gym —sin depender de la motivación ni de nadie— para lograr el cuerpo y la energía que quiero, y mantenerlos.**

## 2. Trabajos relacionados

| ID | Tipo | Declaración | Observación del PO | Respuesta del producto |
|---|---|---|---|---|
| **JTBD-01** | Funcional | Cuando voy a entrenar, quiero un plan hecho para **mi nivel, mi tiempo y mi objetivo**, para no perder tiempo pensando y saber que voy por buen camino. | FB-001-15 | Plan por reglas con nivel, minutos, días, equipamiento y objetivo ([[spec-002-plan-y-sesion-del-dia]]) |
| **JTBD-02** | Funcional | Cuando como, quiero registrarlo **fácil y con comida accesible** —la que de verdad como y puedo pagar—, para saber si estoy comiendo para mi objetivo sin volverme contador. | FB-001-16 | Porciones con la mano, comidas frecuentes, catálogo de alimentos accesibles ([[spec-004-registro-de-nutricion]]) |
| **JTBD-03** | Emocional | Cuando no progreso o fallo un día, quiero que **nada me castigue** y que me muestren cómo seguir, para no rendirme como las otras veces. | FB-001-17 | Comodines, reparar racha, regreso premiado, estancamiento con estrategia, XP que nunca se pierde |
| **JTBD-04** | Identidad | Cuando logro algo —un récord, un mes constante, mi objetivo—, quiero **guardarlo y volver a mirarlo**, para recordar que sí es posible. | FB-001-18 | Bitácora de logros con fecha y dato; capítulo cerrado al cumplir el objetivo |
| **JTBD-05** | Funcional | Cuando no puedo ir al gym, quiero una alternativa en casa que **también cuente**, para no romper la constancia. | FB-001-13 | Versiones B (casa) y C (exprés) de cada sesión |
| **JTBD-06** | Emocional | Cuando entreno solo, quiero que **alguien lleve la cuenta** de mi esfuerzo sin tener que socializar, para mantenerme motivado a mi manera. | FB-001-09 | Mensajes proactivos, contador de días que cuentan, liga contra uno mismo |
| **JTBD-07** | Funcional | Cuando ya alcancé mi objetivo, quiero un plan para **mantenerlo** con menos esfuerzo, para no perder lo que gané. | FB-001-10 | Modo mantenimiento |

## 3. Mapa del trabajo

| Paso | Qué intenta lograr el usuario | Respuesta de Gym Bro | Métrica |
|---|---|---|---|
| **Definir** | Saber qué quiere y si es realista | Objetivo del catálogo con meta y horizonte seguros | % de objetivos dentro de límites (G02) |
| **Preparar** | Saber qué hacer hoy | "Plan listo" antes de su hora habitual | % de sesiones iniciadas desde el mensaje |
| **Confirmar** | Decidir si va al gym, entrena en casa o hace la versión corta | Botones [Gym] [Casa] [Exprés] [Hoy no puedo] | % de días que cuentan con B o C (M06) |
| **Ejecutar** | Entrenar sin pensar en cargas ni series | Tarjeta de sesión precargada con progresión | Toques por serie (M04) |
| **Monitorear** | Saber si va bien hoy | "Día que cuenta #N", proteína del día, racha | DQC por semana (M01) |
| **Modificar** | Ajustar cuando algo falla | Comodín, reparar racha, plan sin deuda, estrategia de estancamiento | Regreso en ≤ 48 h (M07) |
| **Concluir** | Cerrar un ciclo y verlo | Resumen semanal, cierre de temporada, objetivo cumplido | Semanas cumplidas (M00) |
| **Mantener** | No perder lo ganado | Modo mantenimiento y maestría | Retención después del objetivo |

## 4. Resultados deseados (instrumento para H1)

En la encuesta de H1, cada persona califica de 1 a 10 la **importancia** y su **satisfacción actual** con cada resultado. **Puntaje de oportunidad** = importancia + máx.(importancia − satisfacción, 0). Los resultados con puntaje ≥ 12 se priorizan.

| ID | Resultado deseado (minimizar / aumentar) | JTBD |
|---|---|---|
| RD-01 | Minimizar el tiempo para saber qué entrenar hoy | 01 |
| RD-02 | Minimizar la incertidumbre sobre cuánto peso usar | 01 |
| RD-03 | Minimizar los toques para registrar una serie | 01 |
| RD-04 | Minimizar el tiempo para registrar una comida | 02 |
| RD-05 | Aumentar la certeza de que como suficiente proteína | 02 |
| RD-06 | Minimizar el costo de comer para mi objetivo | 02 |
| RD-07 | Minimizar la probabilidad de abandonar después de fallar un día | 03 |
| RD-08 | Aumentar la claridad sobre qué hacer cuando no progreso | 03 |
| RD-09 | Aumentar la facilidad para ver lo que he logrado | 04 |
| RD-10 | Minimizar los días en que no hago nada porque no puedo ir al gym | 05 |
| RD-11 | Aumentar la sensación de que mi esfuerzo se nota, sin exponerme socialmente | 06 |
| RD-12 | Minimizar el esfuerzo para mantener lo logrado | 07 |
| RD-13 | Minimizar las notificaciones que no me sirven | Transversal |

## 5. ¿Qué "despide" el usuario para "contratar" Gym Bro?

- La rutina copiada de TikTok o YouTube.
- La app de calorías que dejó en una semana.
- La nota del celular o el cuaderno.
- El parcero de gym que no tiene o con quien no coincide.
- El entrenador personal que no puede pagar.
- La app de su cadena de gimnasio, que solo sirve dentro del gym.
- Preguntarle a un asistente de IA general cada vez que no sabe qué hacer.

## 6. Fundamento

- Fallar un día no altera de forma relevante la formación del hábito (`F45`), lo que respalda JTBD-03.
- Premiar el regreso tras faltar fue la intervención más efectiva entre 54 para aumentar las visitas al gym (`F46`).
- Atar la acción a un cuándo y un dónde tuvo un efecto medio de d = 0,65 (`F47`), lo que respalda el paso "Preparar".
