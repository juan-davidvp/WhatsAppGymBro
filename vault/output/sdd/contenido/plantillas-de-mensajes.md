---
titulo: Plantillas de mensajes (contenido versionado)
tipo: sdd-contenido
hito: H3
estado: borrador
version: 0.10.0
creado: 2026-10-18
actualizado: 2026-10-19
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
| PR-01 | Récord | 🏆 Récord: {ejercicio}, {carga} × {reps}. Quedó en tu bitácora. |
| PR-02 | Récord con memoria | 🏆 {ejercicio}: {kg} kg × {reps}. Hace {semanas} semanas eran {kg_antes}. |
| ES-01 | Estancamiento | {ejercicio} está quieto hace {sesiones} sesiones. Es normal. ¿Probamos algo distinto? [Cambiar rango] [Cambiar variante] [Semana suave] |
| ES-02 | Estrategia: variante | Listo: desde la próxima semana, {ejercicio} cambia por {nuevo}. |
| ES-03 | Estrategia: rango | Listo: desde la próxima semana, {ejercicio} va de {min} a {max} repeticiones. |
| ES-04 | Estrategia: semana suave | Listo: la próxima semana {ejercicio} lleva {series} series para recuperar. |
| ES-05 | Sin otra variante | No tengo otra variante de {ejercicio} en el catálogo. Prueba con el rango o la semana suave. |
| DL-01 | [⚠️ Dolor] | ¿Dónde te duele? [Hombro] [Codo] [Muñeca] [Espalda] [Cadera] [Rodilla] [Tobillo] [Otra zona] |
| DL-02 | Sin variante sin dolor | No tengo otra variante para ese ejercicio en esta versión: pasamos al siguiente. |


### 2.1 Plan de la semana (`/plan`, T-040)

| ID | Momento | Texto |
|---|---|---|
| PN-01 | `/plan` | Tu plan de esta semana:{lineas} |
| PN-02 | Línea de un día de entreno | {dia}: {sesion} · {minutos} min |
| PN-03 | Línea de un día de descanso | {dia}: descanso |
| PN-04 | Sin plan todavía | Aún no tienes plan: termina el inicio con /start y te lo armo. |

> PN-01 lleva una línea por día (PN-02 o PN-03), cada una en su renglón; `{minutos}` es la duración estimada de la versión del gym (RN-PLAN-006). El hoy se marca con "👉" al inicio de su línea.


### 2.2 Hoy y "Hoy no puedo" (T-041)

| ID | Momento | Texto |
|---|---|---|
| HY-01 | Hoy en día de descanso | Hoy toca descanso. Para que cuente, haz {minutos} min de movilidad y confírmalo. [Hice la movilidad] |
| HY-02 | Movilidad confirmada | Movilidad hecha: hoy cuenta. Día que cuenta n.º {n} · 🔥 {racha} |
| HY-03 | Hoy ya cuenta | Hoy ya cuenta. Mañana seguimos con tu plan. |
| HY-04 | Ayer sin registrar, dentro de la gracia (RN-DQC-005) | ¿Hiciste ayer {sesion}? Si la hiciste tal cual, regístrala con un toque. [La hice tal cual] |
| HN-01 | [Hoy no puedo] | Sin problema, no queda deuda. ¿Qué hacemos? [Exprés ahora] [Mover a otro día] [Hoy descanso] |
| HN-02 | [Hoy descanso] | Listo. Tu próximo día de entreno sigue con el plan, sin deuda. |
| HN-03 | [Mover a otro día] | ¿A qué día la pasamos? |
| HN-04 | Ningún día posible | Esta semana no queda un día que respete tu descanso. Seguimos con el plan el próximo día de entreno, sin deuda. |
| HN-05 | Sesión movida | Listo: {sesion} pasa al {dia}. |
| KB-01 | Teclado persistente (al terminar el inicio) | Abajo tienes Hoy, Comida y Progreso a un toque. |
| KB-02 | Sección aún no disponible | Esa sección todavía no está lista. Por ahora tienes Hoy y /plan. |

> - Hoy en día de entreno usa PL-01 (§1.1) con sus botones.
> - HN-03 lleva un botón por cada día de esta semana al que se puede mover la sesión (RN-PLAN-007, RN-PLAN-008).
> - Teclado persistente ([[flujos-de-usuario]] §1): `🏋️ Hoy` · `🍽️ Comida` · `📈 Progreso`.
> - KB-02 responde a Comida y Progreso hasta que lleguen M5 y M8.


### 2.4 Tarjeta de sesión (T-041, T-042)

| ID | Momento | Texto |
|---|---|---|
| SC-01 | Tarjeta: serie que toca | {ejercicio} · serie {serie} de {series}: {reps} reps con {carga}. Llevas {hechas} de {total} series. [✅ Hecha] [−1 rep] [+1 rep] [−kg] [+kg] [⏭️ Siguiente ejercicio] [⚠️ Dolor] [🏁 Terminar] |
| SC-02 | Tarjeta: no quedan series | Hiciste las {hechas} series de {sesion}. [🏁 Terminar] |
| SC-03 | Toque en una tarjeta vieja | Esta sesión ya terminó. |
| SC-04 | Ya hay una sesión abierta hoy | Ya tienes una sesión abierta hoy: {sesion}. [Continuar la anterior] [Nueva] |

> - SC-01 es un solo mensaje que se edita en cada toque (FR-003-01).
> - `{carga}` es "{n} kg" en un ejercicio con equipo (también "0 kg" mientras no tenga carga) o "peso corporal" en uno sin equipo, que no muestra [−kg] ni [+kg].
> - Después de confirmar una serie aparece [↩️ Deshacer] durante P-090 segundos (FR-003-04).
> - Antes de la primera serie aparece [La hice tal cual] (HU-003-2).
> - SC-03 se muestra como aviso breve sobre el botón, sin cambiar datos ([[spec-003-registro-de-entrenamiento]] §8).
> - En SE-01, `{record_txt}` es " y {n} récord 🏆" (o "récords") si hubo récords en la sesión, o vacío. El récord de cada serie se avisa con PR-01 como aviso breve sobre [✅ Hecha].
> - [⚠️ Dolor] muestra DL-01; con la zona elegida, la tarjeta pasa a CU-04, o a CU-09 si el dolor se repite (RN-SEG-006). [Ver variante] cambia el ejercicio por otro del mismo patrón y versión, o pasa al siguiente con DL-02 si no hay otro.
> - ES-01 llega como mensaje nuevo después del fin de sesión, con un solo ejercicio estancado por vez. ES-02 a ES-05 confirman la estrategia elegida (RN-ENT-003).

### 2.3 Comandos del menú

| Comando | Descripción |
|---|---|
| start | Empezar o retomar |
| hoy | Tu sesión de hoy |
| plan | Tu plan de la semana |
| privacidad | Tu autorización y la política de datos |
| borrar_datos | Borrar todos tus datos |

> Lista que el bot registra en Telegram. Cada comando se añade aquí cuando su tarea lo implementa ([[flujos-de-usuario]] §1 tiene la lista completa prevista).

## 3. Onboarding (textos base)

| ID | Texto |
|---|---|
| ON-01 | Soy Gym Bro. Te armo el plan, te aviso cuándo toca y llevo la cuenta de cada día que entrenas. Funciono con botones. |
| ON-02 | Antes de empezar: los datos que te pida son opcionales y sirven para tu plan. Este chat se guarda en Telegram (no es cifrado de extremo a extremo) y, si registras comida con foto o texto, se envía a un servicio de IA para estimar porciones. [Acepto] [Ver política] [No acepto] |
| ON-03 | ¿Tienes 18 años o más? [Sí] [No] |
| ON-04 | Por ahora Gym Bro es solo para mayores de 18. Gracias por escribir. |
| ON-05 | ¿Qué quieres lograr? [Ganar músculo] [Perder grasa] [Ganar fuerza] [Recomposición] [Ser constante] [Mantener] |
| ON-06 | Te propongo **{meta}** en **{semanas} semanas**. [Me sirve] [Más conservadora] [Más ambiciosa] |
| ON-07 | Esa meta va más rápido de lo que tu cuerpo puede sostener sin riesgo. Te propongo {meta_segura} en {semanas} semanas, o la misma meta en {semanas_largas}. [Opción 1] [Opción 2] |
| ON-08 | Listo, sin datos sensibles: no te pido peso ni tamizaje de comida, y tu objetivo es ser constante. Puedes cambiarlo en /privacidad. |
| ON-09 | ¿Cuánto llevas entrenando con pesas? [Nunca] [Menos de 6 meses] [6 meses o más] |
| ON-10 | ¿Qué días puedes entrenar? Marca entre {min_dias} y {max_dias} y toca Listo. |
| ON-11 | Elige entre {min_dias} y {max_dias} días para seguir. |
| ON-12 | Como estás empezando, tu plan usa {dias_entreno} de esos días y deja el resto para descansar y progresar. |
| ON-13 | ¿A qué hora sueles entrenar? Mañana ≈ {manana} · Mediodía ≈ {mediodia} · Tarde ≈ {tarde} · Noche ≈ {noche}. [Mañana] [Mediodía] [Tarde] [Noche] |
| ON-14 | ¿Dónde entrenas? [Gym] [Casa] [Ambos] |
| ON-15 | ¿Cuántos minutos tienes por sesión? |
| ON-16 | ¿Qué tienes para entrenar en casa? Marca lo que tengas y toca Listo; sin nada también se puede. |
| ON-17 | Si quieres, escribe tu peso en kg (por ejemplo, 72,5). Es opcional y sirve para proponerte una meta. [Prefiero no decirlo] |
| ON-18 | Y tu estatura en cm (por ejemplo, 175). [Prefiero no decirlo] |
| ON-19 | ¿{valor}? Confírmalo o escríbelo de nuevo. [Sí, es correcto] |
| ON-20 | No entendí el número. Escríbelo solo con cifras (por ejemplo, {ejemplo}) o toca Prefiero no decirlo. [Prefiero no decirlo] |
| ON-21 | Con este resultado, el objetivo de perder grasa no está disponible. ¿Qué quieres lograr? |
| ON-22 | ¿Cuánto quieres que te escriba? [Poco] [Normal] [Más] |
| ON-23 | No te escribo entre las {inicio} y las {fin}. ¿Te sirve? |
| ON-24 | Listo. Objetivo: {objetivo}{meta}. Entrenas {dias} · {franja}. Tu primera sesión: {primera_sesion}. [Empezar] [Ver plan] |
| ON-25 | Te quedaste a mitad del inicio. [Continuar] [Empezar de nuevo] |
| PV-01 | Política de datos (provisional, Fase 0). Responsable: el fundador de Gym Bro. Guardo tus respuestas con botones, tus entrenos, tus comidas y, si lo das, tu peso; de los tamizajes, solo el resultado. Lo uso para tu plan y para medir si el bot ayuda, sin lo que escribes. Las fotos de comida no se guardan. Descargas todo con /exportar y lo borras con /borrar_datos en máximo {horas_borrado} horas. [Acepto] [No acepto] |
| PV-02 | Hecho: guardé tu autorización. Puedes cambiarla cuando quieras en /privacidad. |
| PV-03 | Hecho: dejo de pedirte datos sensibles. Si quieres borrar lo que ya está guardado, usa /borrar_datos. |


> Botones generados por el código (no van en la tabla porque dependen de datos):
> - **ON-10:** un botón por día (L M X J V S D) que se marca con ✅ al tocarlo, y [Listo].
> - **ON-15:** un botón por valor de P-084 ("{n} min").
> - **ON-16:** las opciones de [[catalogo-de-ejercicios-base]] §6, que se marcan con ✅, y [Listo].
> - **ON-21:** los objetivos de ON-05 sin [Perder grasa] (RN-SEG-003).
> - **ON-23:** [Me sirve] más una opción por cada franja de P-086 ("22:30–07:00").
>
> En ON-24, `{meta}` es " · meta {kg} kg en {semanas} semanas" o vacío. ON-06 y ON-07 expresan la meta en kg con una cifra decimal. En modo sin números no hay paso de peso ni de meta (RN-SEG-003).

> PV-01 es la política provisional de la Fase 0, que puede operar sin política pública (RN-DAT-007); se muestra con [Ver política] y con /privacidad. Antes de la alfa la reemplaza el texto legal con su responsable designado (Q5). `{horas_borrado}` = P-065.

### 3.1 Tamizajes `[VALIDAR-PROFESIONAL]`

> Instrumentos, fuentes y limitaciones en [[tamizajes]]. `{enlace_parq}` = enlace al PAR-Q+ oficial en español ([[tamizajes]] §1); `{recurso_local}` = recurso verificado de la categoría `extreme_restriction` ([[expresiones-de-alerta]] §4).

| ID | Texto |
|---|---|
| TZ-01 | Antes de armar tu plan, un chequeo de salud de 2 minutos: el PAR-Q+ oficial en español, 7 preguntas de sí o no: {enlace_parq} ¿Cómo te fue? [Todo NO] [Algún SÍ] [No lo hice] |
| TZ-02 | Con algún SÍ, lo indicado es hablar con un médico antes de empezar. Tu plan arranca suave hasta que me confirmes que tienes su autorización. [Ya tengo autorización] |
| TZ-03 | Sin el chequeo, tu plan arranca suave. Cuando lo completes, cuéntame cómo te fue. [Todo NO] [Algún SÍ] |
| TZ-04 | Listo: tu plan deja el arranque suave. |
| TZ-05 | Ahora 5 preguntas rápidas sobre tu relación con la comida. Responde con sinceridad: guardo solo el resultado, no tus respuestas. |
| TZ-06 | 1/5 · ¿Te provocas el vómito porque te sientes muy lleno? [Sí] [No] |
| TZ-07 | 2/5 · ¿Te preocupa haber perdido el control sobre la cantidad de comida que comes? [Sí] [No] |
| TZ-08 | 3/5 · ¿Has perdido recientemente más de 7 kg en un período de 3 meses? [Sí] [No] |
| TZ-09 | 4/5 · ¿Sientes que te sobra peso aunque los demás digan que estás demasiado delgado? [Sí] [No] |
| TZ-10 | 5/5 · ¿Dirías que la comida domina tu vida? [Sí] [No] |
| TZ-11 | Gracias por responder. Tu progreso se va a mostrar sin números: sin gramos, peso ni calorías. Si la comida te genera angustia, hablar con un profesional ayuda: {recurso_local} |

### 3.2 Borrar mis datos (`/borrar_datos`, RN-DAT-003)

| ID | Texto |
|---|---|
| BD-01 | ¿Borrar todos tus datos de Gym Bro? Se borran tu plan, tus entrenos, tus comidas, tu progreso y tus logros. No se puede deshacer. [Sí, borrar] [Cancelar] |
| BD-02 | Última confirmación: después de esto empiezas de cero. [Borrar todo] [Cancelar] |
| BD-03 | Listo: borré todos tus datos de Gym Bro. Este chat sigue en Telegram; para borrarlo, elimínalo desde tu lista de chats. |
| BD-04 | Cancelado: no borré nada. |
| BD-05 | Algo falló y no terminé de borrar. Vuelve a intentarlo con /borrar_datos. |

## 4. Respuestas de cuidado (seguridad) `[VALIDAR-PROFESIONAL]`

> Predefinidas, nunca generadas. `{recurso_local}` se reemplaza por el recurso de ayuda verificado de cada categoría (Línea 106 o 123), definido en [[expresiones-de-alerta]] §4.

| ID | Categoría | Texto |
|---|---|---|
| CU-01 | Restricción extrema | Eso no te lo puedo recomendar porque puede afectar tu salud. Comer suficiente es parte del entrenamiento. Si la comida te está generando angustia, hablar con un profesional ayuda: {recurso_local} |
| CU-02 | Compensación o purga | No voy a sugerir compensar comida con ejercicio ni nada parecido. Si sientes que necesitas hacerlo, vale la pena hablarlo con un profesional: {recurso_local} |
| CU-03 | Sustancias y suplementos | No recomiendo suplementos, medicamentos ni sustancias. Para eso, lo correcto es un profesional de la salud. Lo que sí podemos hacer: plan y comida de todos los días. |
| CU-04 | Dolor | Para con ese ejercicio por hoy. Te propongo una variante sin dolor. Si se repite, consulta a un profesional. [Ver variante] |
| CU-05 | Angustia | Gracias por contármelo. No soy la ayuda adecuada para esto, pero hay personas que sí: {recurso_local}. Si estás en peligro, busca ayuda de emergencia ahora. |
| CU-06 | Sobreuso | Vienes entrenando también en tus descansos. El músculo crece cuando descansas; ¿le damos un día libre? [Sí, descanso] [Ajustar plan] |
| CU-07 | Pregunta fuera del dominio | Funciono con botones para tu entreno y tu comida. ¿Qué quieres hacer? [Hoy] [Comida] [Progreso] |
| CU-08 | Síntomas cardíacos con el esfuerzo | Para el ejercicio ahora. Si la molestia en el pecho, la falta de aire o el mareo no pasan en unos minutos o empeoran, busca ayuda de emergencia ya: {recurso_local} |
| CU-09 | Dolor repetido en un ejercicio (RN-SEG-006, P-062) | El dolor se repite en este ejercicio. Antes de seguir con él, lo indicado es que lo revise un profesional de la salud. [Ver variante] |
