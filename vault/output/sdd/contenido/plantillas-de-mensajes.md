---
titulo: Plantillas de mensajes (contenido versionado)
tipo: sdd-contenido
hito: H3
estado: borrador
version: 0.1.0
creado: 2026-10-18
actualizado: 2026-10-18
deriva_de: [voz-y-marca, proactividad-sin-spam, cada-dia-cuenta, seguridad-y-cumplimiento]
fuentes: []
relacionados: [spec-007-proactividad-y-mensajes, spec-009-seguridad-y-privacidad, reglas-de-negocio]
---

# Plantillas de mensajes

> Fuente del contenido que el código carga desde `app/packages/content/`. Variables entre `{llaves}`; botones entre `[corchetes]`. Reglas: tuteo, 1–3 líneas, sin expresiones prohibidas (RN-MSJ-011), toda plantilla proactiva con botón (RN-MSJ-012) y al menos 3 variantes por propósito (RN-MSJ-010). Las respuestas de cuidado (§4) requieren `[VALIDAR-PROFESIONAL]` antes de la alfa.

## 1. Mensajes proactivos

### 1.1 `plan_listo`

| ID | Texto | Botones |
|---|---|---|
| PL-01 | Hoy toca **{sesion}** ({minutos} min). ¿Dónde lo haces? | [Gym] [Casa] [Exprés 15'] [Hoy no puedo] |
| PL-02 | Tu sesión de hoy está lista: **{sesion}**. Todo cargado, solo confirmas. | [Gym] [Casa] [Exprés 15'] [Hoy no puedo] |
| PL-03 | {dia_semana} de **{sesion}**. Si hoy no da para el gym, la versión en casa cuenta igual. | [Gym] [Casa] [Exprés 15'] [Hoy no puedo] |
| PL-04 | Listo tu plan: **{sesion}**. La última vez subiste en {ejercicio_clave}; hoy vamos por más. | [Gym] [Casa] [Exprés 15'] [Hoy no puedo] |
| PL-05 | Llevas {dias_que_cuentan} días que cuentan. Hoy suma el siguiente: **{sesion}**. | [Gym] [Casa] [Exprés 15'] [Hoy no puedo] |

### 1.2 `recordatorio_contextual`

| ID | Condición | Texto | Botones |
|---|---|---|---|
| RC-01 | Ayer no entrenó y hoy tiene hueco | Ayer no se pudo. Hoy con 15 minutos el día cuenta. | [Exprés 15'] [Hoy descanso] |
| RC-02 | Igual | 15 minutos en casa y tu semana sigue en pie. | [Exprés 15'] [Ver plan] |
| RC-03 | Igual | ¿Una exprés hoy? No hace falta gym para que cuente. | [Exprés 15'] [Hoy descanso] |

### 1.3 `cierre_del_dia`

| ID | Condición | Texto | Botones |
|---|---|---|---|
| CD-01 | Falta la proteína (día de descanso) | Te falta poco para que hoy cuente: {faltan_g} g de proteína. | [Lo de siempre] [Porciones] |
| CD-02 | Igual | Hoy es descanso y la misión es la proteína. ¿Registramos la cena? | [Lo de siempre] [Porciones] |
| CD-03 | Día de entreno ya cuenta, falta proteína para completo | Tu día ya cuenta. Con {faltan_g} g más de proteína queda completo ⭐ | [Lo de siempre] [Porciones] |
| CD-04 | Igual | Un vaso de leche o dos huevos y cierras el día completo. | [Registrar] [Hoy no] |

### 1.4 `reconocimiento` (fuera de la sesión)

| ID | Disparador | Texto | Botones |
|---|---|---|---|
| RE-01 | Capítulo del Reto 66 | Capítulo {capitulo} del Reto 66: {dias} días que cuentan. Quedó en tu bitácora. | [Ver bitácora] |
| RE-02 | Subida de nivel | Nivel {nivel}: **{nombre_nivel}**. Esto lo construiste día a día. | [Ver progreso] |
| RE-03 | Mejor semana | Esta fue tu mejor semana: {dqc} días que cuentan. | [Ver mi semana] |
| RE-04 | Cierre de temporada | Cerraste la temporada **{temporada}**. Insignia guardada. | [Ver bitácora] |
| RE-05 | Hábito forjado | 66 días que cuentan. Hábito forjado. Sí era posible. | [Ver bitácora] |

### 1.5 `resumen_semanal` (acompaña la imagen del muro)

| ID | Texto | Botones |
|---|---|---|
| RS-01 | Tu semana: {dqc} días que cuentan ({dqc_anterior} la anterior) · {sesiones}/{compromiso} sesiones · proteína media {proteina_media} g. {frase_semana} | [Ver plan] [Ajustar días] |
| RS-02 | Semana {cumplida_o_no}. {dqc} días que cuentan y {records} récords. Tu mejor semana: {mejor}. Misiones nuevas listas. | [Ver misiones] [Ver plan] |
| RS-03 | Así quedó tu muro esta semana. {frase_semana} El plan de la próxima ya está. | [Ver plan] [Ajustar días] |

`{frase_semana}` sale de una lista rotativa sin juicios: "Cada día sumó.", "Volviste cuando costaba, y eso también suma.", "Semana sólida.", "Constancia por encima de todo."

### 1.6 `regreso`

| ID | Condición | Texto | Botones |
|---|---|---|---|
| RG-01 | 2 días de entreno sin actividad | Aquí sigo. Sin sermones: ¿arrancamos con 15 minutos? | [Exprés 15'] [Ajustar plan] |
| RG-02 | Igual | Pasa. Tus {dias_que_cuentan} días que cuentan siguen ahí. ¿Una exprés hoy? | [Exprés 15'] [Ajustar plan] |
| RG-03 | Igual | Las semanas raras existen. ¿Bajamos a {dias_menos} días por ahora? | [Sí, ajustar] [Exprés 15'] |
| RG-04 | Final (7 días) | Voy a dejar de escribirte para no llenarte el chat. Cuando quieras volver, toca el botón y retomamos. | [Volver] |
| RG-05 | Final (7 días) | Me quedo en pausa. Tu progreso queda guardado; vuelve cuando quieras. | [Volver] |
| RG-06 | Reactivación (lunes o día 1) | Semana nueva. ¿Retomamos con 2 días? | [Sí] [Ahora no] |
| RG-07 | Reactivación (lunes o día 1) | Mes nuevo, plan nuevo si quieres. | [Retomar] [Ahora no] |

### 1.7 `mantenimiento`

| ID | Condición | Texto | Botones |
|---|---|---|---|
| MA-01 | Media móvil fuera de la banda 2 semanas | Tu peso salió un poco de tu zona de mantenimiento. ¿Ajustamos algo? | [Ver opciones] [Está bien así] |
| MA-02 | Igual | Pequeño desvío en tu zona de mantenimiento. Nada grave; ¿revisamos? | [Ver opciones] [Está bien así] |
| MA-03 | Igual | Tu banda de mantenimiento se movió. Puedes ajustarla o abrir una meta nueva. | [Ver opciones] [Nueva meta] |

## 2. Respuestas en la sesión y el día (no proactivas)

| ID | Momento | Texto |
|---|---|---|
| SE-01 | Sesión terminada | Sumaste {series} series{record_txt}. Día que cuenta n.º {n} · 🔥 {racha} |
| SE-02 | Sesión terminada (casa) | En casa y cuenta igual: {series} series. Día que cuenta n.º {n} · 🔥 {racha} |
| SE-03 | Sesión terminada (exprés) | 15 minutos que cuentan. Día n.º {n} · 🔥 {racha} |
| SE-04 | Sesión parcial | Registré {series} series. Si te queda energía, la exprés completa el día. |
| DC-01 | Día que cuenta (descanso) | Descanso cumplido: tu día cuenta. n.º {n} · 🔥 {racha} |
| DC-02 | Día completo | Día completo ⭐ Entreno y comida, los dos. |
| DC-03 | Línea de semana | {L} {M} {X} {J} {V} {S} {D} |
| RA-01 | Comodín usado | Usé un comodín: tu racha sigue en {racha}. Te queda {comodines}. |
| RA-02 | Racha reiniciada | Tu racha arranca de nuevo, pero tus {total} días que cuentan siguen ahí. ¿Reparamos con una exprés? |
| RA-03 | Racha reparada | Racha reparada. Volver también suma. |
| BR-01 | Bonificación de regreso | Volviste. Eso vale +{xp} puntos. |
| PR-01 | Récord | 🏆 Récord: {ejercicio} {kg} kg × {reps}. Quedó en tu bitácora. |
| PR-02 | Récord con memoria | 🏆 {ejercicio}: {kg} kg × {reps}. Hace {semanas} semanas eran {kg_antes}. |
| ES-01 | Estancamiento | {ejercicio} está quieto hace 3 sesiones. Es normal. ¿Probamos algo distinto? [Cambiar rango] [Cambiar variante] [Semana suave] |

## 3. Onboarding (textos base)

| ID | Texto |
|---|---|
| ON-01 | Soy Gym Bro. Te armo el plan, te aviso cuándo toca y llevo la cuenta de cada día que entrenas. Funciono con botones. |
| ON-02 | Antes de empezar: los datos que te pida son opcionales y sirven para tu plan. Este chat se guarda en Telegram (no es cifrado de extremo a extremo) y, si usas fotos de comida, se envían a un servicio de IA para estimar porciones. [Acepto] [Ver política] |
| ON-03 | ¿Tienes 18 años o más? [Sí] [No] |
| ON-04 | Por ahora Gym Bro es solo para mayores de 18. Gracias por escribir. |
| ON-05 | ¿Qué quieres lograr? [Ganar músculo] [Perder grasa] [Ganar fuerza] [Recomposición] [Ser constante] [Mantener] |
| ON-06 | Te propongo **{meta}** en **{semanas} semanas**. [Me sirve] [Más conservadora] [Más ambiciosa] |
| ON-07 | Esa meta va más rápido de lo que tu cuerpo puede sostener sin riesgo. Te propongo {meta_segura} en {semanas} semanas, o la misma meta en {semanas_largas}. [Opción 1] [Opción 2] |

## 4. Respuestas de cuidado (seguridad) `[VALIDAR-PROFESIONAL]`

> Predefinidas, nunca generadas. `{recurso_local}` se reemplaza por recursos de ayuda **verificados y vigentes** para Colombia antes de la alfa (pendiente en SPEC-009).

| ID | Categoría | Texto |
|---|---|---|
| CU-01 | Restricción extrema | Eso no te lo puedo recomendar porque puede afectar tu salud. Comer suficiente es parte del entrenamiento. Si la comida te está generando angustia, hablar con un profesional ayuda: {recurso_local} |
| CU-02 | Compensación o purga | No voy a sugerir compensar comida con ejercicio ni nada parecido. Si sientes que necesitas hacerlo, vale la pena hablarlo con un profesional: {recurso_local} |
| CU-03 | Sustancias y suplementos | No recomiendo suplementos, medicamentos ni sustancias. Para eso, lo correcto es un profesional de la salud. Lo que sí podemos hacer: plan y comida de todos los días. |
| CU-04 | Dolor | Para con ese ejercicio por hoy. Te propongo una variante sin dolor. Si se repite, consulta a un profesional. [Ver variante] |
| CU-05 | Angustia | Gracias por contármelo. No soy la ayuda adecuada para esto, pero hay personas que sí: {recurso_local}. Si estás en peligro, busca ayuda de emergencia ahora. |
| CU-06 | Sobreuso | Vienes entrenando también en tus descansos. El músculo crece cuando descansas; ¿le damos un día libre? [Sí, descanso] [Ajustar plan] |
| CU-07 | Pregunta fuera del dominio | Funciono con botones para tu entreno y tu comida. ¿Qué quieres hacer? [Hoy] [Comida] [Progreso] |
