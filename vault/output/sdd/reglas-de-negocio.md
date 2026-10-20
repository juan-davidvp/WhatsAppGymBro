---
titulo: Catálogo de reglas de negocio
tipo: sdd-reglas
hito: H3
estado: en-revision
version: 0.5.0
creado: 2026-10-18
actualizado: 2026-10-19
deriva_de: [propuesta-de-valor, objetivos-y-progreso, cada-dia-cuenta, sistema-de-gamificacion, proactividad-sin-spam, registro-sin-friccion, relacion-comida-entreno, constancia-en-cualquier-lugar, integraciones-y-ecosistema, seguridad-y-cumplimiento, fundamentos-de-entrenamiento, registro-de-decisiones]
fuentes: [F39, F40, F42, F45, F46, F47, F48, F49, F50, F51, F52, F55, F56, F57, F58, F59, F60, F61, F70, F71, F82, F93, F96, F97, F99]
relacionados: [parametros, constitucion, glosario, estrategia-de-pruebas]
---

# Catálogo de reglas de negocio

> **Fuente única de verdad de las reglas.** Las specs las referencian por ID; el código las implementa en el paquete de dominio; cada regla tiene al menos una prueba cuyo nombre empieza por su ID (Constitución, principio VII). Los valores numéricos se toman de [[parametros]] (`P-###`). Las marcadas `[VALIDAR-PROFESIONAL]` no se usan con usuarios externos hasta que un profesional las firme.
>
> **Cambiar una regla:** editar aquí → registrar `decision` en `wiki/log.md` → actualizar la prueba → actualizar el código, en el mismo commit. Skill: `/cambiar-regla`.

## RN-OBJ · Objetivos y progreso

| ID | Regla | Parámetros | Origen |
|---|---|---|---|
| RN-OBJ-001 | Un usuario tiene exactamente **un objetivo activo**, de tipo `ganar_musculo`, `perder_grasa`, `ganar_fuerza`, `recomposicion`, `ser_constante` o `mantener`. | — | FB-001-20 |
| RN-OBJ-002 | Todo objetivo tiene métrica principal, valor inicial, valor meta, fecha de inicio y horizonte en semanas. | — | FB-001-21 |
| RN-OBJ-003 | El horizonte de una fase está entre P-002 y P-003 semanas; por defecto P-001. La meta de peso propuesta usa el ritmo por defecto P-088 (ganancia) o P-089 (pérdida) en ese horizonte; el usuario puede pedirla más conservadora o más ambiciosa sin pasar los límites de RN-OBJ-004 y RN-OBJ-005. | P-001–P-003, P-088, P-089 | [[objetivos-y-progreso]] |
| RN-OBJ-004 | El ritmo semanal implícito de una meta de peso no supera P-004 (pérdida) ni P-005 (ganancia) en % del peso. Si la meta pedida lo supera, el sistema propone un horizonte mayor o una meta menor y **no guarda la meta insegura**. `[VALIDAR-PROFESIONAL]` | P-004, P-005 | `F58`, `F59` |
| RN-OBJ-005 | Ninguna meta de peso puede implicar un IMC menor que P-006. `[VALIDAR-PROFESIONAL]` | P-006 | Seguridad |
| RN-OBJ-006 | Un objetivo de peso se cumple cuando la media móvil alcanza la meta y se sostiene P-007 semanas; uno de fuerza, cuando una sesión válida registra el e1RM meta; `ser_constante`, cuando se alcanzan las semanas cumplidas meta. | P-007 | [[objetivos-y-progreso]] |
| RN-OBJ-007 | Cambiar de objetivo cierra el actual con estado `cambiado` y conserva todo el historial. | — | FB-001-18 |
| RN-OBJ-008 | Al terminar el horizonte sin alcanzar la meta, el objetivo se cierra como `completado_parcial` con el % alcanzado y se ofrecen extender o ajustar. Nunca se usa lenguaje de fracaso. | — | FB-001-17 |
| RN-OBJ-009 | El progreso se mide en tres capas: proceso (diaria), rendimiento (semanal) y resultado (en cada revisión de fase). | P-057 | FB-001-21 |
| RN-OBJ-010 | El peso se presenta como media móvil de P-008 días con al menos 3 registros; nunca se destaca la variación de un solo día. | P-008 | Seguridad |
| RN-OBJ-011 | Progreso del objetivo = (actual − inicial) ÷ (meta − inicial), acotado entre 0 y 100 %. | — | FB-001-21 |
| RN-OBJ-012 | Las mediciones corporales (peso, cintura) son opcionales. | — | RN-DAT-001 |
| RN-OBJ-013 | Cada P-057 semanas se revisa la fase: si el ritmo está fuera de los límites, se proponen ajustes con opciones, sin alarma. | P-057 | [[objetivos-y-progreso]] |

## RN-MAN · Mantenimiento

| ID | Regla | Parámetros | Origen |
|---|---|---|---|
| RN-MAN-001 | Al cumplir un objetivo se ofrece **mantener** o **nueva fase**; si no hay respuesta en P-009 días, se activa el mantenimiento. | P-009 | FB-001-10, ADR-018 |
| RN-MAN-002 | En mantenimiento: compromiso mínimo de P-010 sesiones de fuerza por semana; la meta de proteína se conserva; banda de peso de ± P-011 % del peso de entrada (media móvil). `[VALIDAR-PROFESIONAL]` | P-010, P-011 | `F52`, `F39` |
| RN-MAN-003 | Si la media móvil sale de la banda durante P-012 semanas seguidas, se envía un mensaje `mantenimiento` con opciones. | P-012 | ADR-018 |
| RN-MAN-004 | En mantenimiento, las temporadas son de **maestría** (habilidades y récords de repeticiones). | — | ADR-018 |
| RN-MAN-005 | Al entrar en mantenimiento, la intensidad de mensajes pasa a Baja, salvo que el usuario elija otra. | — | ADR-011 |

## RN-PLAN · Hábito y plan

| ID | Regla | Parámetros | Origen |
|---|---|---|---|
| RN-PLAN-001 | El plan semanal se genera a partir de nivel, días disponibles (P-074), minutos por sesión (P-075), objetivo y perfil de equipamiento. | P-074, P-075 | FB-001-15 |
| RN-PLAN-002 | El hábito de entreno (días, hora habitual, lugar) se declara en el onboarding y se actualiza con los datos reales (RN-MSJ-006). | — | FB-001-22 |
| RN-PLAN-003 | Cada sesión planificada se genera con tres versiones equivalentes: **A** (gym), **B** (casa con el equipamiento del usuario) y **C** (exprés de P-013 minutos con peso corporal). Las tres cuentan para el día. | P-013 | FB-001-13 |
| RN-PLAN-004 | La división se elige según los días disponibles (tabla P-014); 5–6 días solo para nivel intermedio. `[VALIDAR-PROFESIONAL]` | P-014 | [[fundamentos-de-entrenamiento]] |
| RN-PLAN-005 | El volumen semanal por grupo muscular y los rangos de repeticiones dependen del nivel y del objetivo (tablas P-015 y P-016). `[VALIDAR-PROFESIONAL]` | P-015, P-016 | `F55` |
| RN-PLAN-006 | La duración estimada de cada versión (calentamiento P-076 + Σ series × (tiempo de serie P-077 + descanso P-078); en la versión C, el circuito P-079) no supera los minutos disponibles. `[VALIDAR-PROFESIONAL]` | P-076–P-079 | FB-001-15 |
| RN-PLAN-007 | Una sesión no realizada **no genera deuda**: no se duplica ni se suma a la siguiente; la rotación continúa. Puede reprogramarse dentro de la misma semana. | — | FB-001-17, `F46` |
| RN-PLAN-008 | Al menos P-017 día de descanso por semana; los novatos no tienen más de P-018 días seguidos de fuerza. `[VALIDAR-PROFESIONAL]` | P-017, P-018 | Seguridad |
| RN-PLAN-009 | El plan de la semana se publica con el resumen semanal (RN-MSJ-017) y la sesión del día está lista antes de la hora habitual. | — | FB-001-22 |
| RN-PLAN-010 | Cada ejercicio de la versión A tiene equivalentes B y C del mismo patrón de movimiento según el catálogo de ejercicios, **salvo las excepciones exprés del catálogo**: los patrones que el catálogo deja sin versión C se compensan con el patrón que indica o se omiten en la sesión exprés. | — | FB-001-13 · decisión del PO 2026-10-19 |

## RN-ENT · Entrenamiento

| ID | Regla | Parámetros | Origen |
|---|---|---|---|
| RN-ENT-001 | Cada serie se presenta precargada con repeticiones y carga objetivo; confirmarla tal cual cuesta **1 toque**; corregir modifica solo el valor cambiado. "La hice tal cual" registra la sesión completa en 1 toque. | — | FB-001-08 |
| RN-ENT-002 | Progresión doble: si en todas las series de un ejercicio se alcanza el tope del rango durante P-019 sesiones seguidas, la siguiente sugiere el incremento mínimo (P-020 tren superior, P-021 tren inferior); en casa, una variante más difícil o más repeticiones. `[VALIDAR-PROFESIONAL]` | P-019–P-021 | [[fundamentos-de-entrenamiento]] |
| RN-ENT-003 | Si un ejercicio no progresa en P-022 sesiones, se propone una estrategia: **variante** (otro ejercicio del mismo patrón y versión del catálogo), **rango** (alterna entre el rango de fuerza y el de músculo de P-016 para ese ejercicio) o **descarga** (la semana siguiente ese ejercicio lleva P-091 series menos). Se aplica desde el plan de la semana siguiente. El estancamiento no resta XP ni afecta la racha. `[VALIDAR-PROFESIONAL]` | P-022, P-091 | FB-001-17 |
| RN-ENT-004 | Una sesión está completada si se registra al menos P-023 de las series de su versión; la versión C debe completarse entera. | P-023 | ADR-010 |
| RN-ENT-005 | Hay récord personal cuando el e1RM (Epley, solo con ≤ P-024 repeticiones) supera el máximo previo del ejercicio, o cuando las repeticiones con el mismo peso (o peso corporal) superan el máximo previo. | P-024 | FB-001-18 |
| RN-ENT-006 | Una actividad importada de al menos P-025 minutos cuenta como entreno alternativo para el día; no modifica la progresión de cargas. | P-025 | FB-001-05 |

## RN-NUT · Nutrición

| ID | Regla | Parámetros | Origen |
|---|---|---|---|
| RN-NUT-001 | El método de registro por defecto son las **porciones con la mano**: palma (proteína), mano ahuecada (carbohidrato), puño (verdura), pulgar (grasa). | — | `F61`, ADR-012 |
| RN-NUT-002 | Meta de proteína diaria = peso × P-026 g/kg, expresada en palmas de P-027 g, redondeada al 0,5 más cercano. `[VALIDAR-PROFESIONAL]` | P-026, P-027 | `F56`, `F57` |
| RN-NUT-003 | La mitad de comida se cumple cuando la proteína registrada del día alcanza al menos P-028 % de la meta. En modo sin números: P-072 comidas con al menos una porción de proteína. | P-028, P-072 | ADR-010 |
| RN-NUT-004 | Una comida puede guardarse como frecuente y registrarse luego con 1 toque; existe "repetir ayer". | — | FB-001-08 |
| RN-NUT-005 | Las propuestas de la IA (foto o texto) **nunca** se registran sin confirmación del usuario. | — | ADR-007 |
| RN-NUT-006 | Las sugerencias de comida dependen del tipo de día; se prioriza la proteína total del día sobre el horario. `[VALIDAR-PROFESIONAL]` | — | `F56`, FB-001-04 |
| RN-NUT-007 | El conteo de calorías está desactivado por defecto, no existe en la Fase 0 y nunca se activa con una señal de riesgo. | — | ADR-012 |
| RN-NUT-008 | El catálogo base de alimentos accesibles define equivalencias en porciones y proteína aproximada. `[VALIDAR-PROFESIONAL]` | — | FB-001-16 |

## RN-DQC · Día que cuenta

| ID | Regla | Parámetros | Origen |
|---|---|---|---|
| RN-DQC-001 | Cada día operativo va de P-029 a P-029 del día siguiente, en la zona horaria del usuario, y es de tipo `entreno` o `descanso` según el plan. | P-029, P-069 | ADR-010 |
| RN-DQC-002 | Un día de entreno **cuenta** si se completa una sesión (A, B o C) o se importa una actividad válida (RN-ENT-006). | — | FB-001-07, FB-001-13 |
| RN-DQC-003 | Un día de descanso **cuenta** si se cumple la misión de descanso: mitad de comida **o** recuperación activa (≥ P-031 pasos importados o ≥ P-032 minutos de movilidad confirmados). | P-031, P-032 | FB-001-04 |
| RN-DQC-004 | Un día es **completo** si: en entreno, cuenta y además cumple la mitad de comida; en descanso, cumple la mitad de comida y la recuperación activa. | — | FB-001-04 |
| RN-DQC-005 | El registro de un día admite gracia hasta las P-030 del día siguiente; el estado del día se recalcula hasta entonces. | P-030 | FB-001-17 |
| RN-DQC-006 | Entrenar en un día de descanso cuenta, pero el XP del día respeta el tope (RN-GAM-005). | — | RN-SEG-008 |
| RN-DQC-007 | El total acumulado de días que cuentan **nunca disminuye**. | — | `F45`, FB-001-07 |

## RN-GAM · Gamificación

| ID | Regla | Parámetros | Origen |
|---|---|---|---|
| RN-GAM-001 | La racha es el número de días que cuentan consecutivos hasta el último día cerrado. | — | `F51` |
| RN-GAM-002 | Se gana 1 comodín por cada P-033 días que cuentan consecutivos, con un máximo de P-034; se aplica automáticamente a un día que no cuenta y mantiene la racha. | P-033, P-034 | `F45`, `F51` |
| RN-GAM-003 | Si la racha se rompe sin comodín, durante P-035 horas se ofrece repararla con una misión de regreso (sesión C + mitad de comida); como máximo una reparación cada P-036 días. | P-035, P-036 | `F46` |
| RN-GAM-004 | Una semana (lunes a domingo) está cumplida si las sesiones completadas alcanzan el compromiso: planificadas − P-037 si son 3 o más; si no, las planificadas. | P-037, P-070 | ADR-005 |
| RN-GAM-005 | El XP por evento sigue la tabla P-038, con un tope diario de P-039. | P-038, P-039 | [[sistema-de-gamificacion]] |
| RN-GAM-006 | El XP acumulado **nunca disminuye**. | — | FB-001-17 |
| RN-GAM-007 | Los niveles 1–10 se alcanzan con los umbrales de XP de P-040 y tienen nombre de identidad. | P-040 | [[catalogo-de-logros-y-niveles]] |
| RN-GAM-008 | Cada lunes se generan 3 misiones semanales (entreno, comida, constancia o variedad) con dificultad igual a P-041 × lo logrado la semana anterior, sin bajar de un mínimo alcanzable. | P-041 | `F49`, `F50` |
| RN-GAM-009 | La liga personal compara solo con la semana anterior y la mejor semana del propio usuario; **no existen rankings entre usuarios**. | — | ADR-009 |
| RN-GAM-010 | Las temporadas duran P-042 semanas, inician en lunes y tienen tema, meta y cierre con insignia. | P-042 | `F48` |
| RN-GAM-011 | Los logros del catálogo se guardan en la bitácora con fecha, tipo, valor y contexto; no se borran salvo borrado total de datos. | — | FB-001-18 |
| RN-GAM-012 | Reto 66: P-043 días que cuentan **acumulados**, con capítulos en P-044; al completarse se otorga "Hábito forjado". | P-043, P-044 | `F45` |
| RN-GAM-013 | El primer día que cuenta después de un día de entreno no cumplido otorga la bonificación de regreso (P-038). | P-038 | `F46` |
| RN-GAM-014 | Prohibido: restar XP, rankings corporales, recompensas por déficit o pérdida de peso, mensajes de culpa y personajes que sufren. | — | ADR-006, ADR-009 |

## RN-MSJ · Mensajes proactivos

| ID | Regla | Parámetros | Origen |
|---|---|---|---|
| RN-MSJ-001 | Todo mensaje proactivo tiene un propósito del catálogo: `plan_listo`, `recordatorio_contextual`, `cierre_del_dia`, `reconocimiento`, `resumen_semanal`, `regreso`, `mantenimiento`. | — | FB-001-22 |
| RN-MSJ-002 | Presupuesto según la intensidad (P-045): Normal ≤ 2 por día de entreno, ≤ 1 por día de descanso y ≤ 8 por semana; Baja ≤ 4 por semana; Alta ≤ 12 por semana. El resumen semanal cuenta dentro del presupuesto. | P-045 | ADR-011, `F51` |
| RN-MSJ-003 | Entre dos mensajes proactivos pasan al menos P-046 horas. | P-046 | ADR-011 |
| RN-MSJ-004 | Ningún mensaje proactivo se envía en horas de silencio (P-047, configurables por el usuario). | P-047 | ADR-011 |
| RN-MSJ-005 | `plan_listo` se envía P-048 minutos antes de la hora habitual en días de entreno; no se envía si la sesión ya empezó o el día ya cuenta. | P-048 | `F47` |
| RN-MSJ-006 | La hora habitual de cada día de la semana es la mediana de la hora de inicio de las últimas P-049 sesiones de ese día; sin datos suficientes, se usa la declarada. | P-049 | FB-001-22 |
| RN-MSJ-007 | Si P-050 mensajes proactivos seguidos no tienen interacción, el presupuesto semanal se reduce a la mitad durante P-051 días. | P-050, P-051 | `F49` |
| RN-MSJ-008 | Tras P-052 días de entreno planificados sin actividad se envía 1 `regreso`; tras P-053 días sin actividad se envía un `regreso` final y se pausan los proactivos. Solo se reactivan con una interacción del usuario o con 1 mensaje en el siguiente lunes o día 1 del mes, como máximo P-054 veces. | P-052–P-054 | `F48`, `F51` |
| RN-MSJ-009 | Tras P-055 semanas cumplidas seguidas, `recordatorio_contextual` se desactiva por defecto; `plan_listo` se mantiene si su tasa de acción es al menos P-056. | P-055, P-056 | ADR-011 |
| RN-MSJ-010 | La misma plantilla no se envía dos veces al mismo usuario en P-058 días; cada envío registra el `template_id`. | P-058 | `F50` |
| RN-MSJ-011 | Ninguna plantilla contiene expresiones de la lista prohibida de [[voz-y-marca]]; lo verifica una prueba automática. | — | FB-001-17 |
| RN-MSJ-012 | Todo mensaje proactivo incluye al menos una acción de 1 toque. | — | FB-001-08 |
| RN-MSJ-013 | `/pausa` detiene los mensajes proactivos entre 1 y P-059 días; los comandos siguen funcionando. | P-059 | ADR-011 |
| RN-MSJ-014 | Si Telegram indica que el usuario bloqueó el bot, se detienen los envíos y se registra el evento `bot_blocked`. | — | ADR-002 |
| RN-MSJ-015 | Solo el motor de política puede programar o enviar mensajes proactivos. | — | Constitución III |
| RN-MSJ-016 | `cierre_del_dia` (P-066) solo se envía si el día todavía no cuenta y la acción que falta se puede hacer en P-073 toques o menos. | P-066, P-073 | ADR-011 |
| RN-MSJ-017 | `resumen_semanal` se envía el domingo a la hora P-060 (si no cae en silencio) e incluye el plan de la semana siguiente. | P-060 | `F48` |

## RN-INT · Integraciones

| ID | Regla | Parámetros | Origen |
|---|---|---|---|
| RN-INT-001 | Las integraciones son opcionales, se ofrecen en contexto y piden los permisos mínimos. | — | ADR-014 |
| RN-INT-002 | `/exportar` entrega todos los datos del usuario en CSV y JSON. | — | `F40` |
| RN-INT-003 | El puente de ingesta acepta actividades y pasos solo con un token por usuario, revocable y con límite de tasa. | — | ADR-014 |
| RN-INT-004 | Los datos importados no sobrescriben registros manuales; los duplicados del mismo tipo con inicio en ± P-061 minutos se resuelven a favor del registro de Gym Bro. | P-061 | ADR-014 |
| RN-INT-005 | Si se revoca una integración, el producto sigue funcionando con registro manual y los datos importados se conservan salvo solicitud de borrado. | — | ADR-014 |
| RN-INT-006 | (Fase 1) Hevy, Strava y Google Calendar son de solo lectura, salvo la creación de eventos de calendario autorizada por el usuario. | — | ADR-014 |

## RN-SEG · Seguridad

| ID | Regla | Parámetros | Origen |
|---|---|---|---|
| RN-SEG-001 | Solo pueden usar el bot mayores de 18 años (edad declarada); si no, no se crea el perfil. | — | ADR-004 |
| RN-SEG-002 | Tamizaje previo a la actividad en el onboarding (PAR-Q+ oficial por enlace; el bot pregunta solo el resultado, [[tamizajes]] §1); con alguna respuesta positiva, o sin el tamizaje hecho, se recomienda consulta médica y el plan inicia con intensidad baja hasta que el usuario confirme que tiene autorización (o cuente que todo fue NO). `[VALIDAR-PROFESIONAL]` | — | [[seguridad-y-cumplimiento]], `F96`, `F97` |
| RN-SEG-003 | Tamizaje breve de relación con la comida y el cuerpo (SCOFF, [[tamizajes]] §2), positivo con P-082 o más respuestas "sí"; si es positivo: modo sin números, recursos profesionales y sin objetivos de pérdida de peso. `[VALIDAR-PROFESIONAL]` | P-082 | `F42`, `F60`, `F99`–`F102` |
| RN-SEG-004 | Los límites de seguridad (RN-OBJ-004, RN-OBJ-005 y parámetros marcados como duros) no son configurables por el usuario. | — | Constitución V |
| RN-SEG-005 | Nunca se recomiendan suplementos, fármacos ni sustancias, incluidos esteroides anabólicos; ante preguntas, respuesta de cuidado y derivación. | — | `F60` |
| RN-SEG-006 | Si el usuario marca dolor en un ejercicio, se detiene su progresión y se ofrece una variante; si el dolor se repite en P-062 sesiones, se recomienda consulta profesional. | P-062 | [[seguridad-y-cumplimiento]] |
| RN-SEG-007 | El texto libre se revisa contra la lista de expresiones de alerta **antes de cualquier otra ruta**; si coincide, se responde con la respuesta de cuidado predefinida de su categoría y se pausan las mecánicas de juego ese día. La lista, las categorías, su prioridad y la forma de comparar viven en [[expresiones-de-alerta]]. `[VALIDAR-PROFESIONAL]` | P-071 | `F42`, `F82`–`F93` |
| RN-SEG-008 | Hay señal de sobreuso si se registran más de P-063 sesiones en un día o se entrena en todos los días de descanso durante P-064 semanas; se envía un mensaje de cuidado y se sugiere descansar. | P-063, P-064 | `F60` |
| RN-SEG-009 | No se solicitan ni se almacenan fotos del cuerpo. | — | `F60` |
| RN-SEG-010 | La IA solo devuelve estructuras validadas por esquema (componentes y porciones); nunca texto de recomendación de salud dirigido al usuario. | — | ADR-007 |

## RN-DAT · Datos y privacidad

| ID | Regla | Parámetros | Origen |
|---|---|---|---|
| RN-DAT-001 | Antes de pedir datos sensibles se obtiene autorización explícita y granular, informando la finalidad y que responder es voluntario. | — | `F40` |
| RN-DAT-002 | El aviso de privacidad informa que el chat se almacena en Telegram (sin cifrado de extremo a extremo) y que las fotos o textos de comida se envían a un proveedor de IA. | — | `F71` |
| RN-DAT-003 | `/borrar_datos` elimina, previa confirmación, todos los datos del usuario en la base de Gym Bro en máximo P-065 horas e informa cómo borrar el chat en Telegram. | P-065 | `F40` |
| RN-DAT-004 | Las fotos de comida no se conservan después de la estimación; solo se guarda la propuesta confirmada. | — | Minimización |
| RN-DAT-005 | Los eventos de analítica y de seguridad no contienen texto libre ni datos sensibles: solo categorías, identificadores y métricas. | — | `F40` |
| RN-DAT-006 | Los secretos (token del bot, claves de API, cadena de conexión) nunca se escriben en el código ni en los registros. | — | Constitución |
| RN-DAT-007 | La Fase 0 (uso propio) puede operar sin política pública; antes de la alfa se requieren política de tratamiento, responsable designado y registro de autorizaciones. | — | `F40` |

---

**Conteo:** 103 reglas · 15 con `[VALIDAR-PROFESIONAL]` (lo verifica `herramientas/lint_trazabilidad.py`).
