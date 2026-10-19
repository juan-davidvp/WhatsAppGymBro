---
titulo: Cada día cuenta — unidad diaria de valor y visualización del esfuerzo
tipo: diseno
hito: H2
estado: en-revision
creado: 2026-10-18
actualizado: 2026-10-18
fuentes: [F45, F46, F56, F69]
relacionados: [relacion-comida-entreno, sistema-de-gamificacion, objetivos-y-progreso, constancia-en-cualquier-lugar, registro-sin-friccion, spec-005-dia-que-cuenta-y-gamificacion, spec-006-progreso-logros-y-mantenimiento]
---

# Cada día cuenta

> Responde a FB-001-07: *"El esfuerzo es inmediato y la recompensa tarda semanas. ¿Cómo visualizamos el esfuerzo? ¿Cómo le hacemos saber al usuario que cada día cuenta?"* Reglas formales: RN-DQC y RN-GAM en [[reglas-de-negocio]].

## 1. El problema

Entre el primer día de gym y el primer cambio que se ve en el espejo pasan semanas. La automaticidad de un hábito tomó una mediana de 66 días (`F45`). En ese valle, lo único que el usuario percibe es el esfuerzo. Si el producto solo muestra resultados (kilos, medidas), durante ese tiempo no muestra nada.

## 2. Principio

> **Medir y celebrar lo que el usuario controla hoy mientras llega lo que no controla todavía.** Cada día deja una huella visible que se acumula y nunca se borra.

## 3. El "día que cuenta" (DQC)

Cada día tiene **dos mitades**: **entreno** y **comida**. El tipo de día lo define el plan.

| Tipo de día | El día **cuenta** si… | El día es **completo** si… |
|---|---|---|
| Entreno | Completas la sesión en cualquier versión (gym, casa o exprés) o se importa una actividad válida (≥ 20 min) | Además cumples tu proteína (≥ 80 % de la meta) |
| Descanso | Cumples la **misión de descanso**: tu proteína **o** recuperación activa (pasos o 10 min de movilidad) | Cumples ambas |

**Ejemplos**

| Situación | ¿Cuenta? | ¿Completo? |
|---|---|---|
| Martes: Torso A en el gym + 128/130 g de proteína | Sí | Sí |
| Jueves: parcial, hace la versión exprés en casa | Sí | Solo si cumple la proteína |
| Domingo de descanso: cumple la proteína | Sí | Solo si además camina o hace movilidad |
| Domingo de descanso: 7.500 pasos importados, sin registrar comida | Sí | No |
| Miércoles de entreno: no entrena ni registra nada | No (se aplica un comodín si tiene) | No |

**Detalles que evitan castigos injustos:**
- El día operativo **cierra a las 03:00** (quien entrena tarde no pierde el día) y el registro admite **gracia hasta las 12:00 del día siguiente** (quien olvidó registrar no pierde la racha) — RN-DQC-001, RN-DQC-005.
- El **total acumulado** de días que cuentan **nunca disminuye** (RN-DQC-007). La racha puede volver a cero; el total no.

## 4. Visualizaciones en Telegram

| ID | Visualización | Dónde aparece | Fase |
|---|---|---|---|
| V1 | **Contador acumulado:** "Día que cuenta n.º 47" | Mensaje al cerrar la sesión o la misión del día | 0 · Must |
| V2 | **Semana en una línea:** `L ✅ M ✅ X ⭐ J ⬜ V · S · D ·` (✅ cuenta, ⭐ completo, ⬜ pendiente, · futuro) | `/hoy`, cierre del día | 0 · Must |
| V3 | **Barra de proteína:** `▓▓▓▓▓▓▓▓░░ 104/130 g` | Tras registrar comida; `/hoy` | 0 · Must |
| V4 | **Muro de constancia:** imagen tipo mapa de calor de las últimas 12–16 semanas | Resumen semanal (domingo); `/progreso` | 0 · Must |
| V5 | **Reto 66:** "Día 23 de 66" con capítulos en 7, 21, 45 y 66 | `/progreso`; mensaje de logro al cerrar cada capítulo | 0 · Should |
| V6 | **Barra del objetivo:** "Vas en el 40 % de tu meta" | `/progreso`; revisión de fase | 0 · Must |
| V7 | **Bitácora:** lista de logros con fecha y dato | `/logros` | 0 · Must |
| V8 | **Esfuerzo acumulado:** kilos movidos (gym) y minutos activos (casa) de la semana | Resumen semanal | 0 · Could |
| V9 | **Mapa muscular semanal** (imagen) | Resumen semanal | 1 |
| V10 | **Mini App de progreso:** muro interactivo, línea de tiempo de logros, gráficas; háptica al marcar (`F69`) | Botón de menú del bot | 0 · Should / 1 |

> [!note] Por qué imágenes generadas en la Fase 0
> Una imagen enviada por el bot muestra el muro sin construir aún una interfaz. Es el puente más barato hacia "más allá del chat" (ADR-013).

## 5. Micro-recompensas inmediatas

| Momento | Señal | Regla |
|---|---|---|
| Confirmar una serie | La tarjeta de sesión se actualiza: ✅ y la siguiente serie lista | RN-ENT-001 |
| Terminar la sesión | "Sumaste 14 series · 1 récord · Día que cuenta n.º 47 · 🔥 9" | RN-DQC-002 |
| Cerrar la proteína | "Día completo ⭐" | RN-DQC-004 |
| Récord personal | 🏆 + registro en la bitácora | RN-ENT-005, RN-GAM-011 |
| Regresar tras fallar | Bonificación de regreso: "Volver también suma" | RN-GAM-013 (`F46`) |
| Semana cumplida | Mensaje en el resumen semanal + XP | RN-GAM-004 |

## 6. Lenguaje

- **Sí:** "sumaste", "cuenta", "vas en", "volviste", "tus días no se pierden".
- **No:** "fallaste", "perdiste", "rompiste", "otra vez cero" o colores de alarma para días no contados.
- Cuando la racha vuelve a cero, el mensaje destaca el total: *"Tu racha arranca de nuevo, pero tus 47 días que cuentan siguen ahí."*

## 7. Lo que no se hace

- Mostrar la variación diaria del peso.
- Comparar con otros usuarios.
- Premiar comer menos o bajar de peso.
- Usar una figura o personaje que se ponga triste.

## 8. Medición

| Métrica | Pregunta que responde |
|---|---|
| M01 · DQC por usuario activo por semana | ¿Cada día está contando? |
| % de días completos | ¿Comida y entreno van juntos? |
| Visitas a `/progreso` y aperturas de la Mini App | ¿Se mira el esfuerzo acumulado? |
| Índice de sostenimiento | ¿Ver el esfuerzo sostiene la constancia de las semanas 5–8? (H05) |
