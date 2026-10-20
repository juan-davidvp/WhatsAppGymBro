---
titulo: Log del wiki — Gym Bro
tipo: log
hito: H3
estado: vigente
creado: 2026-10-05
actualizado: 2026-10-18
fuentes: []
relacionados: [index, inicio]
---

# Log del wiki

> Registro cronológico, solo se añade al final. Formato: `## [AAAA-MM-DD] operación | título`.
> Últimas entradas: `grep "^## \[" wiki/log.md | tail -5`

## [2026-10-05] hito | Apertura del Hito 0 — Fundamentación de la idea
- Alcance: ideación, validación de mercado, arquitectura de producto y copywriting, previos a cualquier desarrollo con Claude Code.
- Referentes indicados por el PO: Duolingo (gamificación y personificación) y Fitia (nutrición con IA y registro por cámara).

## [2026-10-05] decision | ADR-001 aceptado — patrón LLM Wiki
- Instrucción explícita del PO. Se crea `CLAUDE.md` como esquema.

## [2026-10-05] ingest | Investigación de escritorio inicial (F01–F44)
- Temas: patrón LLM Wiki; tamaño de mercado; Fitia; Duolingo; benchmarks de suscripción; precisión de la IA en fotos de comida; eficacia de chatbots y gamificación; competidores (Google Health Coach, ChatGPT Health, MyFitnessPal + Cal AI, Hevy, Fitbod, Finch, Smart Fit, Whoop); Ley 1581; política de WhatsApp Business; caso NEDA/Tessa.
- Hallazgos clave:
  1. Las estimaciones del mercado global difieren casi 3x para 2026; todas coinciden en crecimiento de dos dígitos.
  2. Salud y Fitness convierte mejor que cualquier categoría, pero tiene la peor retención en primera renovación.
  3. Las apps con IA retienen peor a 12 meses que las que no la usan.
  4. Las apps de conteo por foto subestimaron energía y grasa en ~1/3 en un estudio de 2026; el contexto de ingredientes reduce el error.
  5. *Big tech* entró al coaching con IA en 2026 (Google Health Coach, ChatGPT Health).
  6. Desde el 15-ene-2026, la API de WhatsApp Business prohíbe los asistentes de IA de propósito general.

## [2026-10-05] crear | Páginas del Hito 0
- [[propuesta-de-valor]] v0.1, [[panorama-de-mercado]], [[benchmark-competitivo]], [[gamificacion-y-habitos]], [[registro-nutricional-por-imagen]], [[seguridad-y-cumplimiento]], [[registro-de-decisiones]], [[registro-de-fuentes]], [[index]].

## [2026-10-05] decision | ADR-002 a ADR-005 en estado "propuesto"
- Canal Telegram para la Fase 0; separación LLM/dominio; posicionamiento de bienestar; "semanas cumplidas" como Métrica Estrella del Norte. Pendientes de aprobación del PO.

## [2026-10-05] lint | Revisión inicial del wiki
- Todas las páginas están en el índice; no hay páginas huérfanas.
- Fuentes nivel C en uso y pendientes de contraste: F19, F28, F33, F34, F43.
- Enlaces a páginas pendientes (esperado en H0): guia-de-entrevistas, user-personas, customer-journey, flujos-de-usuario, sistema-de-persona, prd-fase-0.
- Preguntas abiertas para el PO: Q1–Q7 en [[propuesta-de-valor]] §17. Bloqueante para H1: **Q1 (país de lanzamiento)**.

## [2026-10-18] ingest | FB-001 — observaciones del PO sobre la propuesta v0.1
- Texto literal en [[FB-001_2026-10-18_observaciones-po]], desglosado en FB-001-01 a FB-001-22. Corrección posterior del PO el mismo día: el producto, por ahora, no es una app móvil sino un **chatbot en Telegram**.
- Cambios de fondo: segmento de hombres de 18 a 32 años (FB-001-01, FB-001-12); sin IA conversacional ni compañero (FB-001-11); la fricción de registro como causa n.º 1 de abandono (FB-001-08); escribir primero sin spam (FB-001-22); cada día cuenta, también en casa (FB-001-07, FB-001-13); objetivo, progreso y mantenimiento (FB-001-10, FB-001-20, FB-001-21); integraciones más allá del chat (FB-001-05); producto individual, no social (FB-001-09).
- Mapa completo observación → cambio: [[propuesta-de-valor]] §0.

## [2026-10-18] ingest | Investigación complementaria (F45–F81)
- Hábitos y adherencia (F45–F51); entrenamiento y proteína (F52–F59); dismorfia muscular (F60); porciones con la mano (F61); cierre de Google Fit y de la API web de Fitbit (F62, F63); Colombia: población, gimnasios, sistemas operativos y canales (F64–F68, F75, F76, F81); Telegram: Mini Apps, pagos con Stars, privacidad y grammY (F69–F72); integraciones (F73, F80); notificaciones (F74); Claude Code y Spec Kit (F77–F79).
- Hallazgos que cambian decisiones: (1) un bot no puede leer Health Connect ni HealthKit porque viven en el teléfono → ADR-014; (2) los bienes digitales en Telegram se cobran con Stars → modelo de negocio; (3) los chats en la nube de Telegram no tienen cifrado de extremo a extremo → aviso de privacidad (RN-DAT-002); (4) no hay un dato reciente y confiable de uso de Telegram en Colombia → H10 y R06.
- Fuentes nivel C y "vía resumen" pendientes de contraste: lista en [[registro-de-fuentes]].

## [2026-10-18] decision | ADR-002, ADR-006, ADR-008 y ADR-009 aceptados; ADR-003 reemplazado por ADR-007
- ADR-002 Telegram como canal de la Fase 0/01 (corrección del PO). ADR-006 bot estructurado, sin charla libre ni personaje. ADR-008 segmento de hombres de 18 a 32 años. ADR-009 sin núcleo social.
- ADR-004, ADR-005, ADR-007 y ADR-010 a ADR-018 quedan **propuestos** hasta la revisión del PO (ADR-015 depende de Q8; ADR-016 de Q1).

## [2026-10-18] crear | Páginas nuevas del wiki
- Producto: [[objetivos-y-progreso]], [[estrategia-anti-novedad]]. Usuarios: [[usuario-cabeza-01]], [[jobs-to-be-done]].
- Experiencia: [[cada-dia-cuenta]], [[sistema-de-gamificacion]], [[registro-sin-friccion]], [[proactividad-sin-spam]], [[relacion-comida-entreno]], [[constancia-en-cualquier-lugar]], [[flujos-de-usuario]], [[voz-y-marca]].
- Conceptos: [[fundamentos-de-entrenamiento]], [[integraciones-y-ecosistema]].

## [2026-10-18] editar | Reescritura de páginas existentes según FB-001
- [[propuesta-de-valor]] v0.2 (la v0.1 se archiva), [[panorama-de-mercado]] (sección Colombia), [[benchmark-competitivo]], [[gamificacion-y-habitos]], [[registro-nutricional-por-imagen]] (umbral de H14), [[seguridad-y-cumplimiento]], [[registro-de-decisiones]] (ADR-006 a ADR-018), [[registro-de-fuentes]] (F45–F81).

## [2026-10-18] migracion | Esquema v2 y estructura raw / wiki / output
- `vault/CLAUDE.md` pasa a esquema v2: capa `output/` para *spec-driven development*, sistema de identificadores, cadena de trazabilidad, operación *derive*, estado `implementado` para specs y operaciones `migracion` e `implementar` en este log.
- [[propuesta-de-valor-v0-1]] movida a `wiki/_archivo/` con aviso y enlace a su reemplazo.
- `raw/README.md` renombrado a [[leeme-raw]]: los nombres deben ser únicos en la bóveda. Es una nota estructural, no una fuente.
- Nuevas notas de navegación: [[inicio]], [[leeme-output]], [[mapa-de-trazabilidad.canvas]] y plantillas de Obsidian en `_plantillas/`. Se añade frontmatter a [[index]] y a este log.
- Páginas pendientes depuradas: `sistema-de-persona` se descarta (ADR-006); `user-personas` queda cubierta por [[usuario-cabeza-01]]; `prd-fase-0` queda cubierta por el paquete SDD; [[flujos-de-usuario]] ya existe.

## [2026-10-18] derive | Paquete SDD v0.1 de la Fase 0
- Núcleo: [[constitucion]] v1.0.0, [[glosario]], [[reglas-de-negocio]] (103 reglas, 13 por validar con un profesional), [[parametros]] (70 valores).
- Specs: [[spec-000-vision-fase-0]] y SPEC-001 a SPEC-009. Plan: [[plan-tecnico]], [[modelo-de-datos]], [[plan-de-medicion]], [[estrategia-de-pruebas]]. Contenido: [[plantillas-de-mensajes]], [[catalogo-de-logros-y-niveles]], [[catalogo-de-ejercicios-base]], [[alimentos-accesibles-base]]. Tareas: [[tareas-fase-0]].
- Fuera de la bóveda, para Claude Code: `CLAUDE.md` raíz (importa la constitución), `.claude/rules/` (4 reglas por ruta), `.claude/skills/` (`/implementar-spec`, `/cambiar-regla`, `/lint-trazabilidad`, `/ingest-wiki`), `herramientas/lint_trazabilidad.py` y `herramientas/generar_mapa_trazabilidad.py`.
- Correcciones al derivar: conteo de reglas (103 · 13), evento `bot_blocked` unificado en RN-MSJ-014, tareas añadidas para las historias HU-001-6, HU-002-4, HU-006-8, HU-009-5 y HU-007-2.

## [2026-10-18] lint | Cierre de H3 antes de la entrega a Claude Code
- `python3 herramientas/lint_trazabilidad.py`: 0 errores. Bóveda con 59 notas; IDs definidos: 103 RN (13 por validar), 70 P (19 por validar), 56 T, 18 ADR, 55 HU, 65 FR, 33 SC, 22 FB y 10 specs. Las 22 observaciones FB-001 están atendidas en el wiki o en output, y cada regla aparece en al menos una spec.
- `--corregir` completó la lista `fuentes` en 5 notas ([[parametros]], [[reglas-de-negocio]], [[benchmark-competitivo]], [[panorama-de-mercado]], [[propuesta-de-valor]]).
- Advertencias aceptadas: 3 enlaces de [[propuesta-de-valor-v0-1]] a páginas que nunca se crearon (nota archivada; no se corrige). F02 está registrada pero ninguna nota la cita.
- Siguiente: aprobación del PO de la v0.2 y de los ADR propuestos; respuestas a Q1–Q9; T-001 en Claude Code.

## [2026-10-19] implementar | T-001 Monorepo `app/`
- Sin RN ni eventos (tarea de preparación). Criterio cumplido: `pnpm test` (1 prueba de humo en `@gymbro/domain`) y `pnpm typecheck` en verde; también `pnpm lint` y `pnpm format:check`. Comprobado que un error de tipos y uno de estilo sembrados hacen fallar `typecheck` y `lint`.
- Archivos: `app/package.json`, `app/pnpm-workspace.yaml` (`packages/*`, `apps/*`), `app/tsconfig.base.json` (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), `app/eslint.config.js` (typescript-eslint *strict* + Prettier), `app/.prettierrc.json`, `app/vitest.config.ts`, `app/packages/domain/` (esqueleto vacío que llena T-002).
- Dependencias (solo desarrollo, principio XI): typescript, @types/node, vitest, eslint, @eslint/js, typescript-eslint, eslint-config-prettier, prettier. TypeScript fijado en `~6.0.3` porque typescript-eslint 8.71 aún no admite TypeScript 7; `@types/node` en 22 para coincidir con Node LTS.
- `CLAUDE.md` (Comandos): los comandos `pnpm` se ejecutan dentro de `app/`.
- Siguiente: T-002 a T-005 en paralelo; T-006 (integración continua).

## [2026-10-19] implementar | T-002 `parameters.ts` replica la tabla de parámetros
- P-001 a P-070 en `app/packages/domain/src/config/parameters.ts`, agrupados como en la columna "Código" de [[parametros]], con el `P-###`, las reglas y `[V]` en un comentario encima de cada clave. Claves de `xp.table` y `messages.budget` según el [[glosario]] (`SessionVariant`, `Intensity`).
- Prueba `parameters.test.ts` (141 casos): lee la tabla de la bóveda y, para cada fila, comprueba que el código existe, que los valores coinciden (números con coma decimal y punto de miles, horas, días de la semana y zona horaria, en orden) y que el comentario `P-###` está sobre su clave; además, que ningún valor del código queda sin fila. Comprobado que detecta un cambio en P-029, P-039, P-040 y P-070.
- Límite: en los parámetros compuestos (P-014, P-016) la prueba compara los números, no las etiquetas de texto (`full_body`, `upper_lower`…).
- ESLint impide en `packages/domain/src` (sin contar pruebas) importar módulos de Node y usar `process`, `Date.now()` y `Math.random()` (constitución VII).

## [2026-10-19] implementar | T-003 Paquete `content` con esquemas y catálogos
- RN cubiertas por pruebas: RN-MSJ-010, RN-MSJ-011, RN-MSJ-012, RN-PLAN-010, RN-NUT-008 (las de la tarea) y además RN-MSJ-001, RN-SEG-005, RN-SEG-007 y RN-GAM-007 (comprobaciones de §4 de [[estrategia-de-pruebas]] y umbrales de nivel = P-040).
- Archivos: `app/packages/content/src/` — `schemas.ts` (zod), `templates.ts` (58 plantillas, frases de la semana y expresiones prohibidas de [[voz-y-marca]]), `achievements.ts` (10 niveles, 23 logros), `exercises.ts` (29 ejercicios), `foods.ts` (31 alimentos y 4 comidas frecuentes, con equivalencias en manos estructuradas), `alerts.ts`.
- `vault-sync.test.ts` compara cada catálogo con su `.md` (IDs, textos, botones, propósitos, números y equivalencias). Comprobado que detecta un texto cambiado, una proteína cambiada, una expresión prohibida y un patrón sin versión en casa.
- `[NEEDS CLARIFICATION]` añadido a [[spec-002-plan-y-sesion-del-dia]] §10: RN-PLAN-010 frente a las dos excepciones exprés del catálogo (`PULL_V`, `ARMS`). El código las guarda como dato (`EXPRESS_EXCEPTIONS`) y la prueba solo acepta esas dos.
- Expresiones de alerta: la bóveda define las 5 categorías y su respuesta CU, pero no la lista de expresiones (Q4, [[spec-009-seguridad-y-privacidad]] §10). No se inventa: listas vacías y `ALERT_EXPRESSIONS_VALIDATED = false`.
- Observaciones para el PO, sin cambio: ES-01 escribe "3 sesiones" y RE-05 "66 días" como texto fijo, que repiten P-022 y P-043; si esos parámetros cambian, el texto quedaría desactualizado. La estructura del circuito exprés (§4 del catálogo de ejercicios: 3 rondas, 40 s/20 s) tiene números que no están en [[parametros]]; no se transcribe hasta la tarea del generador de planes.

## [2026-10-19] implementar | T-004 `apps/server` con grammY en long polling
- Cubre NFR-07 y RN-DAT-006 (pruebas con esos IDs en el nombre). Archivos: `app/apps/server/src/` — `config.ts` (zod; `TELEGRAM_BOT_TOKEN` obligatorio, `DEFAULT_TZ` por defecto P-069, `LOG_LEVEL`), `logger.ts` (JSON por línea; redacta secretos por valor y por nombre de campo; omite `text`, `caption`, nombres y otros campos de texto libre o identidad), `bot/create-bot.ts` (`/start` responde ON-01 desde `@gymbro/content`; errores registrados por update sin tumbar el proceso), `main.ts` (long polling y cierre con SIGINT/SIGTERM). `templateById` añadido a `@gymbro/content`.
- Dependencias: `grammy` (plan técnico §1) y `tsx` (desarrollo: ejecuta TypeScript con las importaciones `.js` del monorepo). Sin librería de registros ni de `.env`: el registrador es propio (~90 líneas, probado) y el `.env` se carga con la opción nativa de Node `--env-file-if-exists` desde `app/infra/.env`.
- Verificación: `/start` probado sin red con `handleUpdate` (responde ON-01 al chat). El proceso real llega a la API de Telegram: con un token falso recibe `401 Unauthorized` y la salida no contiene el token. Falta probarlo con un token real de BotFather (`pnpm dev` dentro de `app/`).

## [2026-10-19] implementar | T-005 MongoDB local y `.env.example`
- Supuesto Q8 vigente (MongoDB, ADR-015); [[plan-tecnico]] §13 sigue con `[NEEDS CLARIFICATION: Q8]`. Si el PO elige PostgreSQL, el cambio aquí se limita a `docker-compose.yml` y al script de inicio.
- Archivos: `app/infra/docker-compose.yml` (`mongo:8.0`, puerto publicado solo en 127.0.0.1, volumen con nombre, verificación de salud), `app/infra/mongo-init/01-app-user.js` (usuario de la aplicación con `readWrite` solo sobre su base, por las reglas de datos y seguridad), `app/infra/.env.example` (variables de [[plan-tecnico]] §10, más las de Mongo local y `LOG_LEVEL`). `app/infra/.env` lo ignora `.gitignore`.
- Verificado con Docker: sin `.env`, Compose se niega a arrancar y nombra la variable que falta (las contraseñas vacías también se rechazan); con `.env`, la base queda `healthy`; el usuario de la aplicación escribe en `gymbro` y recibe `Unauthorized` al leer `admin` o escribir en otra base.
- `CLAUDE.md` (Comandos): paso `cp app/infra/.env.example app/infra/.env`.

## [2026-10-19] decision | Q8: MongoDB como base de datos
- Pregunta Q8 (¿MongoDB o PostgreSQL?) respondida por el PO: **MongoDB**. Antes: supuesto pendiente de confirmar. Motivo: afinidad del fundador y stack ya derivado (ADR-015).
- [[registro-de-decisiones]]: ADR-015 pasa de `propuesto` a `aceptado`. Se retira `[NEEDS CLARIFICATION: Q8]` de [[plan-tecnico]] (§1 y §13), [[spec-000-vision-fase-0]] y [[modelo-de-datos]]; Q8 marcada como respondida en [[propuesta-de-valor]] e [[inicio]]; `CLAUDE.md` (Estado) y `app/infra/docker-compose.yml` actualizados.
- Sin cambios de código: T-005 ya usaba MongoDB.

## [2026-10-19] decision | RN-PLAN-010: excepciones exprés del catálogo
- Antes: "Cada ejercicio de la versión A tiene equivalentes B y C del mismo patrón de movimiento según el catálogo de ejercicios."
- Ahora: se añade "salvo las excepciones exprés del catálogo": los patrones sin versión C (`PULL_V`, que se compensa con `PULL_H`, y `ARMS`) se compensan o se omiten en la sesión exprés.
- Motivo (PO): en casa y en exprés hay poca variedad de ejercicios; el catálogo ya documentaba esas excepciones y la regla no las reconocía.
- Cambios: [[reglas-de-negocio]] v0.2.0, [[spec-002-plan-y-sesion-del-dia]] §10 (duda resuelta), [[catalogo-de-ejercicios-base]] y [[estrategia-de-pruebas]] §4 (redacción), `content.test.ts` (nombre de la prueba RN-PLAN-010) y comentario de `EXPRESS_EXCEPTIONS`. La lógica de la prueba no cambia: ya aceptaba solo las excepciones del catálogo. Sin ADR nuevo: es una aclaración de alcance del catálogo, no una decisión de producto nueva.

## [2026-10-19] decision | RN-SEG-007: expresiones de alerta, recursos de ayuda, P-071 y CU-08
- A pedido del PO, la lista de expresiones de alerta se redacta a partir de fuentes oficiales y clínicas en lugar de esperar al profesional: nueva página [[expresiones-de-alerta]] (138 expresiones en 6 categorías, reglas de comparación, prioridad, recursos de ayuda y 25 casos de verificación). Sigue `[VALIDAR-PROFESIONAL]`: se usa en la Fase 0 y un profesional la firma antes de la alfa (Q4).
- Fuentes nuevas F82–F93 en [[registro-de-fuentes]] (NIMH, Manual MSD, FDA, AHA, NIAMS, NIDDK, Minsalud, Policía Nacional y un artículo revisado por pares sobre clembuterol).
- Nueva categoría `cardiac_warning` (prioridad 2) con plantilla **CU-08**: CU-04 ("si se repite, consulta") no basta ante dolor u opresión en el pecho, falta de aire o desmayo con el esfuerzo (`F89`). Orden de prioridad: angustia > síntomas cardíacos > purga > restricción > sustancias > dolor.
- Nuevo parámetro **P-071** `safety.veryLowCalorieDailyMax` = 800 kcal/día, duro, `[V]` (`F93`): las cifras de calorías del *red-team* ("500 calorías al día", "dieta de 800 calorías") solo activan la alerta por debajo de ese umbral, para no confundir a quien está en volumen.
- `{recurso_local}` resuelto: Línea 106 de salud mental (`F91`) para restricción, purga y angustia (más 123 en angustia); 123 para síntomas cardíacos (`F92`). Reverificar cada 6 meses.
- Cambios: [[reglas-de-negocio]] v0.2.1 (RN-SEG-007 cita P-071 y la página), [[parametros]] v0.2.0, [[plantillas-de-mensajes]] v0.2.0 (CU-08), [[glosario]] (`AlertCategory`), [[spec-009-seguridad-y-privacidad]] §10, [[seguridad-y-cumplimiento]] §4, [[leeme-output]], [[index]] y lienzo regenerado.
- Código: `packages/domain/src/safety/risk-signal.ts` (detector puro: normaliza, compara por palabras completas, aplica P-071 y la prioridad; devuelve solo la categoría), `packages/content/src/alerts.ts` (catálogo transcrito), CU-08 y `renderCareResponse`. Pruebas RN-SEG-007: detector, coincidencia con la bóveda, calidad del catálogo y los 25 casos de verificación.
- Observación para el PO: por el *red-team* de [[estrategia-de-pruebas]] §5, preguntar por creatina o proteína en polvo activa CU-03 y, por RN-SEG-007, pausa las mecánicas de juego ese día. Si parece excesivo, se puede separar en una ruta de "no recomendación" sin pausa.

## [2026-10-19] implementar | T-006 Integración continua
- `.github/workflows/ci.yml` (GitHub Actions, en cada *push* y *pull request*): instala con `--frozen-lockfile` y ejecuta tipos, ESLint, Prettier, pruebas y `herramientas/lint_trazabilidad.py --codigo`. Permisos de solo lectura; cancela ejecuciones anteriores de la misma rama.
- `pnpm check` (dentro de `app/`) corre lo mismo en local; documentado en `CLAUDE.md` (Comandos).
- Verificación: `actionlint` 1.7.7 sin errores sobre el *workflow*; `pnpm check` en verde (550 pruebas, trazabilidad 0 errores); quitando el ID de la prueba de RN-NUT-008, la trazabilidad termina con código 1 (`regla-sin-prueba`), así que el *pipeline* falla; *pipeline* simulado en un clon limpio.

## [2026-10-19] implementar | T-014 Día operativo, día que cuenta, completo, gracia y total
- RN cubiertas: RN-DQC-001 a RN-DQC-007 (pruebas con su ID; propiedades con fast-check para RN-DQC-001, RN-DQC-004 y RN-DQC-007).
- Archivos: `app/packages/domain/src/time/zoned.ts` (fechas locales y conversión de hora local a UTC con horario de verano, sin E/S) y `app/packages/domain/src/day/day.ts` (`operationalDate`, `evaluateDay`, `loggingGraceEnd`, `isDayClosable`, `closeDay`).
- Decisiones de implementación: los días se cierran en orden y el estado guarda solo la última fecha cerrada (un cierre repetido o atrasado no cambia nada, FR-005-02); en descanso, "completo" exige mitad de comida y recuperación activa aunque se haya entrenado (lectura literal de RN-DQC-004). Dependencia nueva de desarrollo: `fast-check` (plan técnico §1).

## [2026-10-19] implementar | T-015 Gamificación
- RN cubiertas: RN-GAM-001 a RN-GAM-014 (pruebas con su ID; propiedades: racha ≤ total, comodines ≤ P-034, XP nunca baja y ningún día supera P-039, bitácora solo crece, temporadas en lunes).
- Archivos: `app/packages/domain/src/gamification/` — `streak.ts` (racha, comodines, reparación), `xp.ts` (libro de XP solo de suma, tope diario, niveles, bonificación de regreso), `weekly.ts` (semana cumplida, misiones, liga personal, temporadas, bitácora, Reto 66). Las funciones devuelven los nombres de evento de SPEC-005 §7 (`streak_extended`, `freeze_used`…) para que el caso de uso los emita.
- Lecturas elegidas donde la regla admite más de una (para revisión del PO):
  - RN-GAM-002: el día salvado con comodín no cuenta, así que reinicia la serie de P-033 días para ganar el siguiente comodín.
  - RN-GAM-003: reparar devuelve la racha anterior más los días que cuenten desde la ruptura; no se ofrece reparación si la racha rota era 0.
  - RN-GAM-005: el tope diario P-039 se aplica a todos los eventos del día, también a los semanales (semana cumplida, misión). Un domingo con sesión y semana cumplida puede recortar la misión.
  - RN-GAM-008: meta = ⌊P-041 × lo logrado⌋ con mínimo 1 `[inferencia]` (la regla no fija el mínimo); la tercera misión es de constancia (días que cuentan); la de variedad queda para después.
  - RN-GAM-010: el dominio calcula los límites de cada temporada; el tema y la meta no existen todavía en el contenido de la bóveda.
  - SPEC-005 §8: una semana en pausa o sin sesiones planificadas no se evalúa.

## [2026-10-19] implementar | T-010 Objetivos y mantenimiento
- RN cubiertas: RN-OBJ-001 a RN-OBJ-013 y RN-MAN-001 a RN-MAN-005 (pruebas con su ID; propiedades: siempre un único objetivo activo, ninguna meta aceptada viola P-004/P-005 ni el IMC P-006, progreso siempre entre 0 y 100 %).
- Archivos: `app/packages/domain/src/goals/goals.ts` (objetivo activo e historial, validación y propuesta de metas de peso con alternativas seguras, media móvil, progreso, cumplimiento, completado parcial, revisión de fase) y `goals/maintenance.ts` (decisión, banda, aviso fuera de banda, temporadas de maestría, intensidad Baja).
- Lecturas elegidas (para revisión del PO): la meta propuesta por defecto usa el ritmo máximo seguro (P-004/P-005) en P-001 semanas; [Más conservadora] la reduce en el adaptador. "Sostener la meta P-007 semanas" = todos los días de esa ventana con media móvil en la meta o más allá. La revisión de fase (RN-OBJ-013) solo marca ritmos más rápidos que el límite. Si el usuario ya está bajo el IMC mínimo y pide perder, la meta segura es mantener su peso. Una semana sin media de peso no cuenta como fuera de la banda de mantenimiento.

## [2026-10-19] implementar | T-012 Registro de entrenamiento
- RN cubiertas: RN-ENT-001 a RN-ENT-006 (pruebas con su ID; propiedad: registrar más series nunca descompleta una sesión). Archivo: `app/packages/domain/src/training/training.ts` (confirmar y corregir series, "La hice tal cual", progresión doble, estancamiento, sesión completada, e1RM de Epley, récords, actividad importada). `packages/content` comprueba que los patrones de movimiento del dominio y del catálogo coinciden.
- Observación para el PO: P-023 vale **0,67**, no 2/3. Leído literalmente, con 6, 9 o 12 series planificadas exige una serie más de las que daría 2/3 (4/6 = 0,667 < 0,67). Se implementa el valor de la bóveda; si la intención era 2/3, cambiar P-023 con `/cambiar-regla`.
- Lecturas elegidas: la primera vez que se hace un ejercicio no hay récord (no hay máximo previo); el núcleo (`CORE`) usa el incremento de tren superior; el estancamiento compara la mejor marca de las últimas P-022 sesiones con el máximo anterior.

## [2026-10-19] decision | P-072: comidas con proteína en modo sin números
- RN-NUT-003 decía "3 comidas" dentro del texto; por la constitución VII el número pasa a [[parametros]] como **P-072** `nutrition.numberFreeMealsWithProtein` = 3 (sin cambio de comportamiento). [[reglas-de-negocio]] v0.2.2, [[parametros]] v0.2.1.

## [2026-10-19] implementar | T-013 Nutrición
- RN cubiertas: RN-NUT-001 a RN-NUT-008 (pruebas con su ID; propiedad: la meta en palmas es múltiplo de 0,5 y está a ≤ 0,25 del valor exacto). Archivo: `app/packages/domain/src/nutrition/nutrition.ts` (porciones con la mano, meta de proteína, mitad de comida con y sin números, frecuentes en 1 toque, "repetir ayer" como propuesta, confirmación obligatoria de propuestas, foco en la proteína total del día, calorías siempre desactivadas).
- Lecturas elegidas: la proteína de un registro por porciones sale solo de las palmas (P-027); los alimentos del catálogo usan su proteína aproximada. "Repetir ayer" crea propuestas que se confirman, igual que las de la IA (RN-NUT-005).

## [2026-10-19] decision | P-073: toques máximos para `cierre_del_dia`
- RN-MSJ-016 decía "1–2 toques" dentro del texto; el número pasa a [[parametros]] como **P-073** `messages.dayClosingMaxTaps` = 2 (sin cambio de comportamiento). [[reglas-de-negocio]] v0.2.3, [[parametros]] v0.2.2.
- `[NEEDS CLARIFICATION]` añadido a [[spec-007-proactividad-y-mensajes]] §10: CD-03 y CD-04 son para un día que ya cuenta, pero RN-MSJ-016 solo permite `cierre_del_dia` si el día no cuenta. El motor aplica la regla.

## [2026-10-19] implementar | T-016 Motor de política de mensajes
- RN cubiertas: RN-MSJ-001 a RN-MSJ-017 (RN-MSJ-011 en `packages/content`). SC-007-1: simulación de 60 días con 200 usuarios sintéticos (intensidad, días de entreno, candidatos, interacción y pausas aleatorios) y verificación independiente de cada envío: 0 violaciones de presupuesto de día y semana, silencio, separación o pausa. Comprobado que la simulación falla si se desactiva la separación mínima.
- Archivo: `app/packages/domain/src/messaging/engine.ts` — `evaluateProactive` (decide y da el motivo de supresión), prioridad entre propósitos, `pickTemplate` (rotación sin repetir en P-058 días, azar recibido como parámetro), hora habitual, retroceso, regreso y reactivación, desvanecimiento, pausa, bloqueo, horas de cierre y de resumen. `packages/content` comprueba que el catálogo de propósitos coincide.
- Lecturas elegidas: los presupuestos se cuentan por día operativo y por semana de lunes; el retroceso redondea la mitad hacia abajo; un candidato sin botones se suprime (`no_action`); la reactivación es un candidato marcado que el motor deja pasar durante la pausa por inactividad.

## [2026-10-19] decision | Expresiones de alerta v0.1.1: hinchazón en articulaciones
- El *red-team* de T-017 mostró que "tengo la rodilla hinchada" no activaba `pain`, aunque la hinchazón es una señal de `F90`. Se añaden "hinchazón", "rodilla hinchada", "tobillo hinchado", "codo hinchado", "muñeca hinchada" y "hombro hinchado" (no "hinchado" suelto, para no confundir "me siento hinchado después de almorzar", que queda como caso de control). [[expresiones-de-alerta]] v0.1.1 y `packages/content/src/alerts.ts`.

## [2026-10-19] implementar | T-017 Seguridad
- RN cubiertas: RN-SEG-001 a RN-SEG-010 (pruebas con su ID). Archivos: `app/packages/domain/src/safety/safety.ts` (mayoría de edad por respuesta sí/no, tamizajes, lista de parámetros duros, ruta de cuidado antes de cualquier otra, dolor repetido, sobreuso, política de imágenes, validación estricta de la salida de la IA) y el detector `safety/risk-signal.ts` ya existente.
- La lista de parámetros duros del código se compara con la columna "Duro" de [[parametros]] en una prueba.
- *Red-team* (HU-009-7, H11): `packages/content/src/red-team.test.ts`, 50 escenarios (34 de texto libre en las 6 categorías, 8 metas peligrosas, menores, tamizaje positivo, sobreuso e intentos de cambiar límites duros): 0 fallos críticos tras añadir las expresiones de hinchazón.
- Pendiente fuera del dominio: los instrumentos exactos de los tamizajes (Q4); el dominio recibe solo las respuestas.

## [2026-10-19] decision | P-074 a P-079: tiempos y rangos del plan; composición de sesiones
- El PO aprueba los valores propuestos para estimar la duración de las sesiones (RN-PLAN-006), que no estaban definidos: **P-076** calentamiento 5 min `[supuesto]`, **P-077** 40 s por serie, **P-078** descanso de 90 s (músculo, grasa, recomposición y accesorios) y 180 s (fuerza en básicos), con fuentes nuevas `F94` (ACSM 2009) y `F95` (Schoenfeld 2016). Todos `[V]`.
- Pasan a [[parametros]] números que estaban en el texto: **P-074** días disponibles 2–6 y **P-075** minutos 20–90 (RN-PLAN-001); **P-079** circuito exprés 3 rondas · 40 s · 20 s · 60 s entre rondas ([[catalogo-de-ejercicios-base]] §4).
- RN-PLAN-006 queda `[VALIDAR-PROFESIONAL]` y cita P-076 a P-079 (conteo: 14 reglas por validar). [[reglas-de-negocio]] v0.3.0, [[parametros]] v0.3.0, [[catalogo-de-ejercicios-base]] v0.2.0 con §5 "Composición de las sesiones por división" `[VALIDAR-PROFESIONAL]` `[inferencia]` (derivada de los nombres de P-014).

## [2026-10-19] implementar | T-011 Generador del plan semanal — M1 completo
- RN cubiertas: RN-PLAN-001 a RN-PLAN-010 (pruebas con su ID; propiedades con fast-check: ninguna versión supera los minutos disponibles, la versión C no pasa de P-013, ningún plan deja menos de P-017 descansos ni más de P-018 días seguidos a un novato, cada patrón de A tiene B y C o su excepción). `packages/content` prueba el generador con el catálogo real y la composición de sesiones se compara con la bóveda.
- Archivo: `app/packages/domain/src/plan/plan.ts` — validación de entradas, días de entreno según nivel y descanso, ciclo de sesiones de P-014 con rotación por día planificado, versiones A/B/C con rangos y descansos por objetivo, equipamiento de casa (con compensación del catálogo si falta equipo), ajuste al tiempo recortando series, reprogramar sin deuda, hábito, publicación del plan y hora de la sesión.
- Lecturas elegidas: el volumen semanal arranca en el mínimo de P-015 y se reparte entre las sesiones que tienen el patrón; si no cabe en el tiempo se recortan series (RN-PLAN-006 manda sobre el volumen); la intensidad baja (FR-002-08) usa el volumen de novato; las repeticiones precargadas son el inicio del rango (progresión doble).
- M1 (dominio) completo: T-010 a T-017 ✅. Siguiente: M2 (servidor base: repositorios MongoDB, middleware, eventos).

## [2026-10-19] decision | P-080 y P-081: caducidad de `processed_updates` y retención de eventos
- [[modelo-de-datos]] §5 tenía los números dentro del texto ("7 días", "12 meses"); pasan a [[parametros]] como **P-080** `data.processedUpdatesTtlDays` = 7 y **P-081** `data.eventsRetentionMonths` = 12 `[supuesto]`, sin cambio de comportamiento. [[parametros]] v0.3.1, [[modelo-de-datos]] v0.1.2.

## [2026-10-19] implementar | T-020 Repositorios MongoDB, índices e idempotencia
- Puertos en `app/apps/server/src/ports/repositories.ts`; adaptador en `app/apps/server/src/adapters/mongo/` (`schema.ts` con las 28 colecciones y sus índices, `indexes.ts`, `idempotency.ts`, `repositories.ts`).
- Idempotencia: cada *update* se marca una vez en `processed_updates` (índice único y caducidad P-080); serie con clave `set:{sessionId}:{exerciseCode}:{setIndex}` y comida con `meal:{chatId}:{messageId}:{callbackData}` (índice único); cerrar un día pasa de abierto a cerrado una sola vez y suma al total de días que cuentan con una actualización condicional que usa `closeDay` del dominio (RN-DQC-007).
- Pruebas con MongoDB en memoria (`mongodb-memory-server`, binario 8.0.4): repetir un toque no duplica serie, comida ni día que cuenta (SC-003-2); `risk_signals` no guarda texto libre (RN-DAT-005). Una prueba compara los índices del código con la columna de [[modelo-de-datos]] §2.

## [2026-10-19] implementar | T-022 Emisor de eventos sin texto libre
- Archivos: `app/apps/server/src/events/` — `catalog.ts` (los 80 eventos de [[plan-de-medicion]] §2, con prueba de sincronía), `schema.ts` (esquema de cada evento) y `emitter.ts` (añade `localDate` con el día operativo del dominio, `appVersion` y `phase`; valida y guarda). Puerto `EventsRepository` y adaptador MongoDB.
- SC-009-3 (revisión automática de esquemas): todo valor de texto es una ficha ASCII sin espacios de ≤ 64 caracteres; las claves no pueden llamarse como texto libre (`text`, `name`, `message`, `answer`, `note`…); no hay objetos anidados; los eventos que ya se emiten (`risk_signal_detected`, `care_response_sent`) tienen esquema propio estricto. Propiedad con fast-check: ningún texto con espacios, saltos de línea o caracteres no ASCII se guarda. Un evento que no cumple no se guarda y se registra `event_rejected` sin los valores; si la base falla, medir no rompe la respuesta.
- Lecturas elegidas: `userRef` es el id interno del usuario (seudónimo sin relación con el id de Telegram; `/borrar_datos` lo reemplaza, [[modelo-de-datos]] §4), sin un secreto nuevo para *hash* (principio XI). Las propiedades comunes van en `common` ([[modelo-de-datos]] v0.1.3). Cada tarea que emita eventos nuevos añade su esquema propio.
- Pendiente: la retención P-081 en meses no se aplica aún (falta decidir cómo convertir meses en una caducidad; se hará con la rutina de borrado).

## [2026-10-19] implementar | T-021 Middleware del bot — M2 completo
- Cadena de cada update ([[plan-tecnico]] §5): deduplicación (`processed_updates`) → usuario (crea o carga; ignora grupos, canales y otros bots) → detector de riesgo → enrutador. Archivos: `app/apps/server/src/bot/middleware.ts`, `create-bot.ts`, `callback-data.ts`; `main.ts` conecta MongoDB, crea los índices y el emisor de eventos.
- RN-SEG-007: todo texto libre (mensaje, mensaje editado, argumento de un comando, pie de foto) pasa por el detector antes de cualquier ruta; si coincide, se responde la plantilla de cuidado de su categoría y nada más se procesa. La respuesta va antes de guardar: si la base falla, la persona igual recibe el cuidado. Se guarda solo la categoría en `risk_signals` y se emiten `risk_signal_detected` y `care_response_sent`.
- Prueba de "un texto de alerta nunca llega a otra ruta": cada expresión del catálogo por las 4 vías, más una propiedad con fast-check (texto alrededor, mayúsculas, vía al azar; 200 casos), más una integración con MongoDB en memoria (sin duplicados al reintentar y sin texto del usuario en la base). Comprobado que las pruebas fallan si el detector se pone después del enrutador.
- Enrutador: `/start` → ON-01; botón → se confirma el toque; texto o foto sin ruta → CU-07 con [Hoy] [Comida] [Progreso]. `callback_data` en formato `v1:nav:<destino>`; límite de 1–64 bytes verificado en la referencia de la Bot API ([[plan-tecnico]] v0.1.2).
- Configuración nueva: `MONGODB_URI` (obligatoria; se redacta en los registros, también la contraseña sola), `MONGO_DATABASE` y `STUDY_PHASE` ([[plan-tecnico]] §10, `.env.example`).
- Lecturas elegidas y pendientes: un update se marca como procesado antes de atenderlo (como mucho una vez: si falla a mitad, no se reintenta; preferible a duplicar series o días). Las respuestas de cuidado desde texto libre van sin botones por ahora (el [Ver variante] de CU-04 necesita saber el ejercicio; llega con T-04x). Las pantallas de Hoy, Comida y Progreso llegan con sus tareas. Reiniciar el contador de mensajes ignorados al interactuar (§5 paso 8) llega con T-070. La pausa de mecánicas de juego del día se leerá de `risk_signals` cuando exista la gamificación en el servidor.
- M2 (servidor base) completo: T-020 a T-022 ✅. Siguiente: M3 (seguridad y onboarding).

## [2026-10-19] decision | M3: tamizajes, textos y política provisional
- El PO decide (2026-10-19): (1) los tamizajes se redactan a partir de instrumentos validados y públicos (PAR-Q+ y SCOFF en español), `[VALIDAR-PROFESIONAL]`, igual que las expresiones de alerta (Q4 sigue abierta para la firma); (2) Claude redacta en la bóveda los textos que faltan del onboarding, del tamizaje y de `/borrar_datos`, y el PO los revisa en el pull request; (3) [Ver política] muestra una política provisional fiel al [[modelo-de-datos]] con el fundador como responsable en la Fase 0 (RN-DAT-007), y ON-02 gana [No acepto] como pide HU-009-1.
- [[plantillas-de-mensajes]] v0.3.0: ON-02 dice "si registras comida con foto o texto" (antes solo fotos; RN-DAT-002 nombra ambos) y gana [No acepto]; nuevas ON-08 (sin datos sensibles), PV-01 (política provisional, `{horas_borrado}` = P-065), PV-02 y PV-03 (dar o retirar la autorización desde `/privacidad`).

## [2026-10-19] implementar | T-030 Consentimiento y aviso de privacidad
- Dominio: `app/packages/domain/src/onboarding/onboarding.ts` — orden de los pasos de F1 ([[flujos-de-usuario]]), cuáles se saltan (sin autorización: sin objetivo —queda ser constante—, sin tamizaje de comida, sin peso ni meta; equipamiento solo si entrena en casa) y la decisión de autorización por categoría (RN-DAT-001). Propiedad con fast-check: el flujo solo avanza y termina en el resumen.
- Servidor: `app/apps/server/src/onboarding/onboarding.ts` (casos de uso que devuelven respuestas; el bot solo las envía), `/start`, `/privacidad`, botones `v1:ob:<paso>:<valor>` y `v1:pv:<valor>`. `consents` guarda solo inserciones (historial; vale la más reciente) con la versión de la política. Eventos `onboarding_started`, `consent_given`, `consent_declined` y `onboarding_step_completed`, cada uno con esquema propio.
- Escenarios de HU-009-1 en `onboarding.test.ts` (aceptar, ver la política, no aceptar, no saltarse el aviso, botón viejo, texto en lugar de botón, retomar con `/start`, dar y retirar desde `/privacidad`) y repositorio contra MongoDB en memoria.
- Lecturas elegidas: aceptar el aviso autoriza las 5 categorías que nombra (el aviso las describe juntas); el tamizaje previo a la actividad se mantiene sin autorización porque es una medida de seguridad (RN-SEG-002), pero sin autorización no se guarda su resultado (se decide en T-031). Retirar la autorización no borra lo ya guardado: PV-03 remite a `/borrar_datos`.

## [2026-10-19] decision | Tamizajes: PAR-Q+ por enlace y SCOFF colombiano adaptado (P-082)
- La investigación (fuentes `F96`–`F102`) mostró tres cosas:
  - las condiciones del PAR-Q+ prohíben incorporarlo en encuestas electrónicas o productos sin permiso escrito, y prohíben cambiar su texto (`F97`);
  - el SCOFF no tiene una licencia formal publicada;
  - el SCOFF se validó en mujeres, y su sensibilidad es menor cuando hay más hombres (`F102`).
- El PO decide (2026-10-19):
  - **PAR-Q+ por enlace:** el bot enlaza al formulario oficial en español y pregunta solo el resultado ([Todo NO] [Algún SÍ] [No lo hice]). "No lo hice" arranca con intensidad baja, como "Algún SÍ".
  - **SCOFF:** traducción colombiana de Rueda et al. (`F100`, CC BY), pasada a masculino y tuteo `[adaptación propia]`.
  - Antes de la alfa: firma profesional y permisos de uso (Q4).
- Nueva página [[tamizajes]]. Nuevo **P-082** `safety.scoffPositiveMinYes` = 2 (duro, `[V]`). RN-SEG-002 y RN-SEG-003 citan [[tamizajes]] ([[reglas-de-negocio]] v0.4.0, [[parametros]] v0.4.0).
- [[plantillas-de-mensajes]] v0.4.0: §3.1 con TZ-01 a TZ-11.
- **Conflicto resuelto a favor de la regla:** la pregunta 4 del SCOFF usaba "gordo", que RN-MSJ-011 prohíbe en las plantillas. Se reformuló como "¿Sientes que te sobra peso…?" y queda anotado para la revisión profesional.
- [[modelo-de-datos]] v0.1.4 añade `users.settings.lowIntensityStart`.

## [2026-10-19] implementar | T-031 Edad, tamizajes y modo sin números
- Dominio: `preActivityScreeningOutcome` ahora recibe el resultado del PAR-Q+ que cuenta el usuario, e `isScoffPositive` aplica P-082 (pruebas RN-SEG-002 y RN-SEG-003).
- Contenido: `packages/content/src/screenings.ts` (enlace al PAR-Q+ y preguntas del SCOFF), con una prueba de sincronía con [[tamizajes]].
- Servidor:
  - **Edad (RN-SEG-001):** con "No" se borra todo lo guardado y el evento `age_gate_failed` queda sin seudónimo. Con "Sí" se guarda solo la confirmación.
  - **PAR-Q+:** guarda la consecuencia (`lowIntensityStart`) y, con autorización `screening`, el resultado. [Ya tengo autorización] y el resultado tardío funcionan también después del onboarding (botones `v1:sc:…`).
  - **SCOFF:** 5 preguntas de 1 toque. La cuenta de "sí" viaja en el botón y las respuestas no se guardan. Si es positivo: modo sin números, recurso de ayuda y `number_free_mode_enabled`.
  - **Eventos:** `screening_completed` lleva solo tipo y resultado.
  - **Borrado:** el puerto `UserDataEraser` y su adaptador MongoDB borran al usuario de todas las colecciones; la prueba no encuentra rastros (base de T-034).
- Pendiente para T-032: si el SCOFF es positivo y el objetivo elegido era perder grasa, hay que volver a pedir el objetivo sin esa opción (RN-SEG-003).
- Pregunta abierta para el profesional: ¿un "sí" a la pregunta 1 (vómito) debería disparar CU-02 por sí solo ([[tamizajes]] §2)?

## [2026-10-19] implementar | T-034 `/borrar_datos` con borrado total
- `app/apps/server/src/privacy/deletion.ts`: `/borrar_datos` → BD-01 → BD-02 → borrado. El borrado ocurre en el momento, muy por debajo de P-065. Después, BD-03 indica cómo borrar el chat en Telegram. Cancelar en cualquiera de las dos confirmaciones no borra nada (BD-04). Si el borrado falla, se dice (BD-05) y no se anuncia un borrado que no ocurrió.
- [[plantillas-de-mensajes]] v0.5.0, §3.2: textos BD-01 a BD-05, redactados por Claude a pedido del PO. BD-03 no nombra botones de la aplicación de Telegram, que cambian según el cliente.
- SC-009-2: prueba de integración con MongoDB. Recorre el onboarding con autorización, el tamizaje y una alerta; tras el borrado, ninguna colección contiene el id del usuario.
- Eventos: `deletion_requested` (queda sin seudónimo al borrar) y `deletion_completed` (sin seudónimo).

## [2026-10-19] implementar | T-033 Respuestas de cuidado y suite de red-team
- `app/apps/server/src/bot/red-team.test.ts`: red-team de punta a punta por el bot, con 51 escenarios y 0 fallos críticos (HU-009-7, H11):
  - **34 textos de alerta** de las 6 categorías. Entran por mensaje, pie de foto, mensaje editado y argumento de `/start`, y en tres momentos: usuario nuevo, a mitad del onboarding y después. Incluyen manipulación ("ignora tus reglas…") y varias señales a la vez (gana la prioridad).
  - **6 controles sin alerta**, como "me muero de hambre" y "hoy entreno pecho".
  - **4 escenarios de botones y flujos**: menor de edad, saltarse el aviso con botones fabricados, datos basura y una alerta a mitad del tamizaje.
  - **Revisión de las 6 respuestas de cuidado**: no tienen cifras fuera del recurso de ayuda ni recomiendan sustancias o dietas.
- Pausa del juego (HU-009-4, RN-SEG-007): `isGameMechanicsPausedOn` en el dominio usa el día operativo de la señal, y `RiskSignalsRepository.instantsBetween` la consulta. La usará la gamificación del servidor (M5).
- Queda en [[spec-009-seguridad-y-privacidad]] §10: añadir [Registrar comida] a CU-01 para los falsos positivos requiere aprobación del PO, porque la plantilla es `[VALIDAR-PROFESIONAL]`.

## [2026-10-20] decision | Onboarding: franja, minutos, estatura, silencio y ritmo de la meta propuesta (P-083 a P-089)
- El PO decide (2026-10-20):
  - **P-083** `habit.timeSlotStarts` `[supuesto]`: una sola franja horaria para todos los días elegidos (mañana 06:00, mediodía 12:00, tarde 17:00, noche 19:30), que después se ajusta con la hora real (RN-MSJ-006). FR-001-07 decía "franja por día"; se cambia para no alargar el inicio (SC-001-1).
  - **P-084** `plan.sessionMinutesOptions` `[supuesto]`: botones de 20, 30, 45, 60 y 90 minutos.
  - **Estatura junto al peso**, solo si hay meta de peso, porque RN-OBJ-005 la necesita. Rangos plausibles para pedir confirmación: **P-085** 140–220 cm `[supuesto]` y **P-087** 35–250 kg (el número estaba en el texto de [[spec-001-onboarding-y-objetivo]] §8). Nuevo paso `height` en el flujo F1 ([[flujos-de-usuario]]).
  - **P-086** `messages.quietHoursOptions` `[supuesto]`: alternativas 22:30–07:00 y 23:30–08:00 a P-047.
- **Corrección hacia la bóveda.** [[objetivos-y-progreso]] §2 fija la meta propuesta por defecto en +0,25 %/semana al ganar y −0,5 %/semana al perder, pero `proposeWeightGoal` (T-010) proponía al ritmo máximo (P-004/P-005). Esos ritmos pasan a **P-088** y **P-089** (`[V]`) y RN-OBJ-003 los cita ([[reglas-de-negocio]] v0.4.1, [[parametros]] v0.5.0).
  - "Más conservadora" es la misma meta en P-003 semanas.
  - "Más ambiciosa" es la misma meta en P-002 semanas, que se valida; si no es segura, ON-07 ofrece la meta segura o más semanas.
- [[plantillas-de-mensajes]] v0.6.0: ON-09 a ON-25, redactadas por Claude a pedido del PO, con una nota de los botones generados.
- [[catalogo-de-ejercicios-base]] v0.3.0 §6: equipamiento de casa que se pregunta.
- [[modelo-de-datos]] v0.1.5: `users.profile` y los contadores del onboarding.

## [2026-10-20] implementar | T-032 Onboarding completo con reanudación
- **Dominio** (`onboarding/onboarding.ts`):
  - paso `height` y modo sin números en el flujo;
  - nivel por tiempo entrenando;
  - peso y estatura plausibles;
  - `weightGoalOffers` e `isSafeWeightGoal`, con una propiedad de fast-check: toda meta ofrecida es segura incluso después de redondearla a una cifra decimal hacia el peso actual.
- **Servidor** (`apps/server/src/onboarding/`):
  - `profile-steps.ts`: objetivo, nivel, días y equipamiento (selección múltiple que edita el mismo mensaje; la selección viaja en el botón), franja, lugar, minutos, peso y estatura escritos (con coma decimal, confirmación fuera de rango y "Prefiero no decirlo"), meta, intensidad y silencio;
  - `summary.ts`: guarda el hábito y el objetivo, genera el plan de esta semana y la siguiente para mostrar la primera sesión (T-040 lo guardará), cierra el onboarding y emite `onboarding_completed` con duración e interacciones;
  - `/start` a mitad del onboarding ofrece ON-25 [Continuar] [Empezar de nuevo];
  - si el SCOFF es positivo y el objetivo era perder grasa, ON-21 pide otro objetivo (RN-SEG-003);
  - las negritas de ON-06 se envían como HTML de Telegram.
- **Repositorios MongoDB nuevos:** `body_measurements`, `training_habits` y `goals` (un solo objetivo activo; el anterior queda `changed`). Los usuarios guardados antes de este cambio se leen con valores por defecto.
- **Pruebas** (`full-flow.test.ts`, 18 escenarios):
  - **SC-001-1:** el camino completo llega al resumen en ≤ 25 interacciones.
  - **Sin autorización:** el objetivo queda en ser constante.
  - **Días:** fuera de P-074 no se aceptan; un novato que marca 6 recibe ON-12.
  - **Equipamiento de casa** se guarda.
  - **Peso:**
    - texto ilegible → ON-20;
    - fuera de rango → ON-19;
    - una alerta escrita en el paso del peso recibe cuidado y no se toma como peso;
    - sin estatura no se propone meta.
  - **Meta:**
    - "más conservadora" y "más ambiciosa" funcionan;
    - una meta insegura fabricada en el botón no se guarda.
  - **SCOFF positivo** con objetivo de perder grasa.
  - **Retomar:** "empezar de nuevo" funciona.
  - **Horas de silencio:** cambiarlas funciona.
- **Pendientes:**
  - FR-001-11 (teclado persistente y comandos) pasa a T-040/T-041.
  - Los objetivos sin meta de peso (fuerza, recomposición, constancia, mantener) se guardan sin valores hasta tener datos.

## [2026-10-20] decision | M4: textos, conteo del día adelantado y alcance
- El PO decide (2026-10-20):
  1. Claude redacta en la bóveda los textos de M4 que faltan (plan, Hoy, "Hoy no puedo", tarjeta de sesión, fin de sesión) y el PO los revisa en el pull request.
  2. Al terminar una sesión, SE-01/02/03 muestran el número de día que cuenta y la racha. Para eso se adelanta lo mínimo de M6: evaluar el día con el dominio (RN-DQC) y calcular número y racha con los días guardados. El cierre programado, los comodines aplicados por el planificador y la reparación siguen en M6.
  3. Se incluye T-044 (récords, progresión, estancamiento y dolor) y queda fuera T-045 (ajustar días).
- Consecuencia de (2): sin una forma de registrar el descanso, la racha se rompería cada día de descanso. La pantalla Hoy en día de descanso ofrece [Hice la movilidad], que RN-DQC-003 ya admite (P-032).

## [2026-10-20] implementar | T-040 Plan semanal y `/plan`
- `app/apps/server/src/plans/weekly-plan.ts`:
  - `ensureWeek` arma las entradas del generador desde el perfil;
  - continúa la rotación de la semana anterior (RN-PLAN-007);
  - precarga la última carga de cada ejercicio (FR-002-04);
  - guarda la semana una sola vez y emite `plan_generated`.
- El onboarding guarda esta semana y la siguiente al terminar.
- `plan-view.ts`: `/plan` y [Ver plan] muestran los 7 días (PN-01 a PN-04, [[plantillas-de-mensajes]] v0.7.0 §2.1) con el hoy marcado. Emite `plan_viewed`.
- Repositorio MongoDB `plansRepository` (`weekly_plans` + `planned_sessions`, [[modelo-de-datos]] v0.1.6) y `lastLoads` en las series.
- Pendientes:
  - [Ajustar días] de HU-002-1 queda para T-045.
  - El plan semanal que acompaña al resumen del domingo (RN-PLAN-009) llega con M7.
  - Si el onboarding termina a mitad de semana, la primera semana puede incluir días ya pasados: la primera sesión que se muestra es la próxima desde hoy.

## [2026-10-20] implementar | T-041 Hoy, elección de versión y "Hoy no puedo" sin deuda
- `app/apps/server/src/today/today.ts`:
  - `🏋️ Hoy`, `/hoy` y [Empezar] muestran PL-01 con [Gym] [Casa] [Exprés 15'] [Hoy no puedo] en un día de entreno;
  - en un día de descanso muestran HY-01 con [Hice la movilidad] (RN-DQC-003, P-032);
  - si el día ya cuenta, muestran HY-03; si hay una sesión abierta, la retoman.
- **"Hoy no puedo"** (HN-01):
  - [Exprés ahora] abre la versión C;
  - [Mover a otro día] ofrece solo los días de descanso que quedan esta semana y que pasan RN-PLAN-008 (se revalida al tocar);
  - [Hoy descanso] no cambia nada.
  - Eventos `cant_today_selected` y `session_rescheduled`.
- `sessions/session.ts` abre la versión elegida con la tarjeta de la primera serie (`card.ts`, SC-01; las acciones de la tarjeta son T-042) y emite `session_variant_chosen` y `session_started`. Una segunda versión con una sesión abierta pregunta [Continuar la anterior] [Nueva] (SPEC-003 §8).
- **Lo adelantado de M6** (`days/day-status.ts`): cada actividad es una fuente del día (`session:<id>`, `mobility`), el dominio evalúa el día y `liveCountedDays` (dominio, RN-GAM-001/RN-DQC-007) da el n.º y la racha en vivo, con los comodines.
- **Dominio nuevo:** `training/session-progress.ts` (avance de la tarjeta, puro, con propiedades de fast-check: nunca más series que las planeadas ni repetidas).
- **FR-001-11:** al terminar el onboarding llega el teclado persistente (KB-01) y el servidor registra los comandos del menú (§2.3). Comida y Progreso responden KB-02 hasta M5 y M8.
- **Bóveda:**
  - [[plantillas-de-mensajes]] v0.8.0 (§2.2 a §2.4);
  - **P-090** `training.undoWindowSeconds` = 10 s: el número estaba en FR-003-04, que ahora cita P-090 ([[parametros]] v0.6.0);
  - [[modelo-de-datos]] v0.1.7.
- **Lectura elegida de RN-PLAN-007:** "la rotación continúa" significa que el próximo día de entreno trae la sesión que el plan ya tenía, sin repetir la saltada ni sumar volumen. Así lo codifica el generador de T-011.

## [2026-10-20] implementar | T-042 Tarjeta de sesión editable, 1 toque por serie, deshacer e idempotencia
- `app/apps/server/src/sessions/card-actions.ts`:
  - [✅ Hecha] registra la serie con su clave estable y edita el mismo mensaje con la siguiente (FR-003-01/02);
  - [−1 rep] [+1 rep] [−kg] [+kg] ajustan antes de confirmar; la carga cambia en el incremento de su región, P-020/P-021;
  - [⏭️ Siguiente ejercicio] salta las series que quedan;
  - [↩️ Deshacer] funciona durante P-090 s (FR-003-04);
  - sin series pendientes se muestra SC-02.
- **Idempotencia (SC-003-2):** cada botón lleva la versión del estado de la sesión. Un doble toque, un botón viejo o un reintento de Telegram no registran nada y se vuelve a mostrar la tarjeta actual; la tarjeta de una sesión terminada responde SC-03 como aviso breve.
- **SC-003-1:** `set_confirmed` lleva los toques que costó la serie (1 si se confirmó tal cual) y si se editó.
- **Corrección:** sin historial, los ejercicios del gym empiezan en 0 kg. La tarjeta ahora muestra los botones de carga según el equipo del ejercicio, no según la carga actual ("0 kg" en vez de "peso corporal"). Nota de §2.4 en [[plantillas-de-mensajes]].
- Pruebas: `sessions/card.test.ts` (10 escenarios, incluidos doble toque, reintento con el mismo `update_id`, deshacer fuera de la ventana y tarjeta de una sesión terminada).

## [2026-10-20] implementar | T-043 "La hice tal cual" y terminar sesión
- `app/apps/server/src/sessions/finish.ts`:
  - [🏁 Terminar] deja la sesión **completada** si llega a P-023 de sus series (la exprés, entera, RN-ENT-004) o **parcial** si no.
  - Completada: el día suma la fuente `session:<id>`, se evalúa y la tarjeta se edita con SE-01/02/03, que muestran el n.º del día y la racha en vivo.
  - Parcial: SE-04, sin reproche.
  - Eventos `session_completed` (versión, series, minutos) y `session_partial`.
- **[La hice tal cual]** en la tarjeta antes de la primera serie registra todas las series como estaban (RN-ENT-001) y termina. Evento `session_logged_as_planned`.
- **FR-003-05 y RN-DQC-005:** si ayer había sesión y no se registró, Hoy ofrece primero HY-04 [La hice tal cual] hasta el fin de la gracia (12:00 del día siguiente). Se registra en la versión del lugar habitual y cuenta para ayer.
- Pruebas: `sessions/finish.test.ts` (10 escenarios). Incluyen el umbral P-023, la exprés incompleta, la gracia antes y después de las 12:00, y n.º y racha de 3 tras lunes de sesión, martes de movilidad y miércoles de sesión.
- Pendiente para T-044: `{record_txt}` de SE-01 (récords del día).

## [2026-10-20] implementar | T-044 Récords, progresión, estancamiento y dolor (Should)
- **Récords (HU-003-4, RN-ENT-005, RN-GAM-011):** `app/apps/server/src/sessions/records.ts`.
  - Al confirmar una serie se compara con todo lo anterior del ejercicio: e1RM mayor, o más repeticiones con la misma carga.
  - El récord se guarda una vez por serie (`setKey` único) y se avisa con PR-01 sobre el botón, sin mensaje nuevo.
  - La bitácora anota FIRST_PR y PR_10 una sola vez; PR_10 lee su número de la condición del catálogo.
  - Evento `pr_detected`. SE-01 muestra `{record_txt}`.
  - **El XP del récord queda para T-062** (decisión del PO en M4).
- **Progresión (HU-003-5 escenario 1, RN-ENT-002):** la semana nueva sube la carga P-020/P-021 tras P-019 sesiones en el tope del rango (lo hacía ya T-040). No sube si hubo dolor en alguna de esas sesiones (RN-SEG-006).
  - **Pendiente:** la "variante más difícil" en casa no está implementada. El catálogo no ordena las variantes por dificultad. HU-003-5 sigue abierta por eso y por el XP; la spec queda en `borrador`.
- **Estancamiento (HU-003-5 escenario 2, RN-ENT-003 `[VALIDAR-PROFESIONAL]`):** `sessions/plateau.ts`.
  - Al terminar una sesión (o "La hice tal cual"), si un ejercicio lleva P-022 sesiones sin superar su mejor marca anterior, ES-01 ofrece rango, variante o semana suave. Evento `plateau_detected`.
  - Cada estrategia se confirma con ES-02 a ES-05 y se guarda en `exercise_adjustments` desde la semana siguiente.
  - Si esa semana ya estaba generada y sin usar, se descarta y se regenera con el ajuste.
  - No resta XP ni toca días o rachas.
  - **Lectura elegida:** la spec dice "cuando se genera la siguiente". La propuesta se muestra al terminar la sesión en que se detecta, que es cuando hay alguien para tocar el botón; el ajuste entra en el plan siguiente.
- **Dolor (HU-003-6, RN-SEG-006):** `sessions/pain.ts`.
  - [⚠️ Dolor] → zona (DL-01) en la misma tarjeta → se guarda con la sesión y se emite `pain_flagged` (solo la zona).
  - Responde CU-04, o CU-09 si hubo dolor en P-062 sesiones distintas del ejercicio. Ambas son plantillas fijas.
  - [Ver variante] cambia el ejercicio por otro del mismo patrón y versión, o pasa al siguiente con DL-02.
- **Corrección:** el lector de `callback_data` no aceptaba la acción `pt` (botones de ES-01). Lo detectó la prueba de estancamiento; ahora hay prueba de ida y vuelta para `ss` y `pt`.
- Pruebas:
  - `sessions/records-plateau-pain.test.ts` (17 escenarios);
  - repositorios de MongoDB de récords, bitácora, dolor, ajustes, historia del ejercicio y descarte de semana.

## [2026-10-20] decision | M5 · nutrición: alcance y lecturas aprobadas por el PO
- **Foto y texto → porciones (T-053 *Should*, T-054 *Could*):** quedan para después. El proveedor de IA y su política de retención de imágenes siguen como `[NEEDS CLARIFICATION]` en [[spec-004-registro-de-nutricion]] §10. Hasta entonces, una foto recibe la respuesta de siempre y Comida usa porciones.
- **Proteína de las plantillas:** palmas × P-027 en toda comida (FR-004-04). Con un rango de porciones se usa el valor bajo. La proteína aproximada del catálogo queda como referencia. Nombres cortos para los botones en [[alimentos-accesibles-base]] v0.2.0.
- **Paso de la palma:** media palma (P-093); las demás manos, de 1 en 1.
- **Día en vivo:** la mitad de comida se guarda como fuente `nutrition_half` del día y puede hacer contar el descanso (DC-01) o completar el día (DC-02). El cierre programado sigue en T-060.
- **Parámetros nuevos** ([[parametros]] v0.8.0):
  - P-092: 4 palmas sin peso declarado `[V]`, de SPEC-004 §8;
  - P-093: paso de la palma;
  - P-094: 6 frecuentes como botones `[supuesto]`;
  - P-095: 3 alimentos en la sugerencia `[supuesto]`.
- **Textos:** CM-01 a CM-17 redactados por Claude ([[plantillas-de-mensajes]] v0.11.0 §2.5). HY-01 ahora nombra la misión de proteína y trae [Registrar comida]; KB-02 queda solo para Progreso. Pendientes de revisión del PO en el PR.

## [2026-10-20] implementar | T-050 Teclado de porciones y barra de proteína
- `app/apps/server/src/meals/meals.ts`: `🍽️ Comida` (teclado, CU-07 y [Registrar comida] de Hoy) → CM-01 → [Porciones] → CM-03.
  - El teclado se edita en el mismo mensaje. El borrador de la comida viaja en los datos del botón (`meals/draft.ts`, ≤ 64 bytes).
  - 1 palma cuesta 5 toques desde `🍽️ Comida`, dentro del presupuesto de FR-004-02.
- [Guardar] registra la comida con su clave de toque (un doble toque no duplica) y edita el mensaje con la barra CM-04/CM-05.
  - La meta sale del peso (RN-NUT-002) o de P-092.
  - En modo sin números se usan CM-06/CM-07 (HU-004-3).
- **FR-004-07:** durante la gracia (hasta P-030), [Era de ayer] registra la comida en el día anterior.
- **FR-004-08:** cada comida guarda duración (desde que se abrió el menú) y toques.
- **Eventos:** `meal_logged` (método, duración, toques, proteína) y `nutrition_half_completed` (modo).
- **Dominio nuevo:** `dailyProteinGoal`, `palmsFromProtein`, `adjustPortion` (propiedad: nunca bajo 0), `hasPortions`, `rotatingPick`.

## [2026-10-20] implementar | T-051 Frecuentes, plantillas y "repetir ayer"
- **Frecuentes:**
  - [Guardar como frecuente] registra la comida y guarda la frecuente, con el nombre corto de la plantilla o CM-17. Evento `favorite_meal_saved`.
  - Las frecuentes salen como botones en CM-01, hasta P-094, y se registran con 1 toque.
  - [Editar frecuentes] permite ✏️ ajustar las porciones o 🗑️ borrar (FR-004-03).
- **Plantillas:** abren el teclado con el valor bajo de cada rango.
- **Repetir ayer:**
  - CM-10 muestra las comidas de ayer; [Registrar] las suma hoy con 1 toque. Evento `meal_repeated`.
  - [Cancelar] no registra nada.
- **Repositorios** (MongoDB y dobles en memoria): `meals.onDate` y `favorite_meals`.

## [2026-10-20] implementar | T-052 Sugerencias según el tipo de día
- **Día de entreno:** antes de la hora habitual (P-083 de su franja), `🍽️ Comida` muestra primero CM-15. Lleva P-095 fuentes de proteína de costo `$` del catálogo, que rotan con el día de la semana (RN-NUT-006).
- **Día de descanso:** Hoy (HY-01) dice que la misión es la proteína o la recuperación activa (HU-004-6 escenario 2).
- **Pruebas:** `meals/meals.test.ts` (29 escenarios) y `meals/draft.test.ts` (ida y vuelta con fast-check).
- **Pendiente:**
  - T-053 y T-054 (IA), por decisión del PO.
  - Pedir el peso en `/progreso` (SPEC-004 §8) llega con M8.
  - SPEC-004 sigue en `borrador` mientras falten HU-004-4/5.
