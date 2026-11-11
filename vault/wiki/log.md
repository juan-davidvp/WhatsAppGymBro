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

## [2026-11-08] decision | M6 · día que cuenta y juego: lecturas aprobadas por el PO
- **Avisos del cierre** (comodín usado, racha reiniciada con oferta de reparar, bonificación de regreso): se muestran en la **próxima interacción** (🏋️ Hoy o al registrar algo). El cierre corre a las 12:00 del día siguiente y la bandeja de salida es de T-070. Así ningún módulo envía proactivos por fuera del motor (constitución III). RA-01 a RA-03 ya estaban en la §2 de [[plantillas-de-mensajes]] como respuestas no proactivas. El envío proactivo llega con T-071.
- **Día con señal de riesgo** (FR-005-07, RN-SEG-007): el día que cuenta sigue sumando al total, porque no es una mecánica (FR-005-06). La racha **puede sumar, nunca romperse**: si el día cuenta, sube en silencio; si no, no se rompe ni gasta comodín. Ese día no hay XP, ni comodín ganado, ni logros, ni mensajes de juego. Aplica desde T-061.
- **Línea de la semana (DC-03):** un día cerrado que no contó, o que salvó un comodín, se marca con `–`. Es una raya neutra: nunca una ✗ y sin emoji nuevo. Actualizado V2 de [[cada-dia-cuenta]] y la nota de DC-03.
- **Racha de semanas** ([[spec-005-dia-que-cuenta-y-gamificacion]] §10): se adopta la propuesta de la spec. La racha diaria se muestra desde el día 1 y la de semanas desde que se cierra la primera semana cumplida (T-062).
- **Parámetro nuevo P-096** (`scheduler.intervalSeconds` = 60 s): el ciclo del planificador del [[plan-tecnico]] §6 ("cada minuto"), para no dejar el número en el código ([[parametros]] v0.9.0).

## [2026-11-08] implementar | T-060 Cierre de día programado e idempotente; día que cuenta y línea de la semana
- **Cierre programado** (`app/apps/server/src/scheduler/close-days.ts`, FR-005-02): cada ciclo (P-096) cierra, en orden, los días de cada usuario activo con el onboarding hecho cuya gracia terminó (RN-DQC-005, `lastClosableDate`).
  - Evalúa el día con sus fuentes, lo guarda cerrado y lo suma al total (RN-DQC-007).
  - Un día sin registros también se cierra: no cuenta, pero no resta.
  - Es idempotente: el estado guarda el último día cerrado; cerrar otra vez no cambia nada ni repite el evento.
  - El tipo del día es el que tenía al registrarse. Sin registros, es el del plan guardado o, si esa semana nunca se guardó, el que el plan le habría dado, sin guardarlo ni emitir `plan_generated` (`plannedDayType`).
- **Ciclo** (`scheduler/loop.ts`): un tic al arrancar y uno cada P-096. Un tic no se solapa con otro y un error se registra (`scheduler_tick_failed`) sin detener el ciclo. Se arranca y se detiene con el bot en `main.ts`.
- **Semana en una línea** (HU-005-1, DC-03): `weekMarks` en el dominio y `renderWeekLine` en el contenido. Va debajo de SE-01/02/03, DC-01/DC-02, HY-02 y al final de 🏋️ Hoy. Un día anterior sigue ⬜ mientras dura su gracia.
- **Evento:** `day_closed` (fecha, tipo, cuenta, completo, fuente: `session`·`nutrition`·`mobility`·`none`), con esquema estricto.
- **Repositorios:** `days.close` crea el día cerrado si no tenía registros; `days.dayType`; `history` con `complete`; `streak_states.applyDayClose` dice si aplicó; `lastClosedDate`; `users.listActive`.
- **HU-005-1 escenario 4** ya lo cubrían HY-01 y PL-01 con su botón; ahora también muestran la semana.
- **Pruebas:** `scheduler/close-days.test.ts` (gracia, "La hice tal cual" dentro de la gracia, idempotencia, registro tardío, días sin abrir el bot, usuario en pausa), `scheduler/loop.test.ts`, `day/week-line.test.ts` y la prueba de `lastClosableDate`.
- **Pendiente:**
  - Con `/pausa` (T-073), decidir si los días en pausa se cierran al volver o se saltan. Hoy un usuario en pausa no se cierra.
  - La racha, la reparación y los avisos llegan en T-061.

## [2026-11-09] decision | RN-GAM-003 · misión de regreso: cualquier sesión y exprés en descanso
- **Problema:** la oferta de reparar (RA-02) llega al cerrar el día fallado (12:00 del día siguiente). Con un plan L-X-V, ese día casi siempre es de descanso, y en descanso no se podía iniciar ninguna sesión: [Exprés 15'] no hacía nada.
- **Decisión del PO:**
  - En un día de descanso, [Exprés 15'] de RA-02 abre la versión exprés de la sesión planificada que no se hizo (si no hay, la siguiente del plan), con la fecha de hoy. La rotación del plan no cambia. Entrenar en descanso cuenta (RN-DQC-006) y RN-SEG-008 sigue vigilando el sobreuso.
  - Repara cualquier sesión completada (A, B o C) más la mitad de comida, el mismo día y dentro de P-035 horas. La exprés es el mínimo; hacer más no impide reparar.
- **Cambios:** [[reglas-de-negocio]] v0.6.0 (RN-GAM-003) y [[sistema-de-gamificacion]]. En el dominio, `RepairAttempt.expressSessionDone` pasa a `sessionCompleted`. RA-02 lleva el botón [Exprés 15'] ([[plantillas-de-mensajes]] v0.13.0).

## [2026-11-09] implementar | T-061 Racha, comodines, reparación y regreso
- **Dominio:**
  - `closePlayerDay` (`gamification/day-close.ts`) cierra un día para el juego en un solo paso puro: total (RN-DQC-007), racha y comodines (RN-GAM-001/002), oferta de reparación (RN-GAM-003) y bonificación de regreso (RN-GAM-013).
  - Día con señal de riesgo (FR-005-07, decisión del 2026-11-08): la racha puede subir, pero no se rompe, no gasta ni gana comodín y no hay bonificación.
  - `StreakState.longest`.
  - `liveCountedDays` parte de lo ya cerrado, así que una racha reparada se ve en vivo.
- **Estado guardado:** `streak_states` guarda todo el estado del juego con `rev`. El cierre y la reparación se guardan solo si `rev` no cambió, y un documento de T-060 se lee como versión 0 ([[modelo-de-datos]] v0.2.0).
- **Avisos en la próxima interacción:** colección `notices`. Al cerrar se guardan RA-01 (comodín usado) y RA-02 (racha reiniciada con oferta de reparar). Se muestran al abrir 🏋️ Hoy o al registrar una sesión, una comida o la movilidad.
  - Tras varios días sin abrir el bot, solo el más reciente de cada plantilla.
  - RA-02 solo mientras el plazo siga abierto.
  - Sin avisos con el juego desactivado (FR-005-06) o con señal de riesgo ese día.
- **Reparación en vivo** (`days/day-status.ts`): al registrar una sesión o la mitad de comida, si hay oferta abierta y el día tiene las dos cosas, la racha vuelve (`streak_repaired`, RA-03). `sessions/session.ts` · `repairSessionFor` elige la sesión de la misión de regreso.
- **Eventos con esquema estricto:** `streak_extended`, `freeze_earned`, `freeze_used`, `streak_reset`, `streak_repair_offered`, `streak_repaired` (solo números).
- **Pruebas:** `gamification/day-close.test.ts` (idempotencia, regreso, señal de riesgo, invariantes con fast-check: SC-005-1 para el total y la racha), `scheduler/streak-close.test.ts` (HU-005-2 escenarios 1 y 2, comodín ganado, reparación con exprés en descanso y con sesión completa, plazo vencido, señal de riesgo, juego desactivado) y las de los repositorios.
- **Pendiente:** la bonificación de regreso (HU-005-4) queda calculada en el cierre (`comebackBonus`, `comebackPending`). Su XP y BR-01 llegan con T-062, porque la bonificación es XP.

## [2026-11-09] implementar | T-062 XP, niveles y semana cumplida
- **Libro de XP** (`xp_ledger`, FR-005-03, `days/xp.ts`):
  - Cada hecho que da XP tiene su clave (`refId`): el mismo hecho no suma dos veces (índice único `userId+refId`, [[modelo-de-datos]] v0.3.0).
  - Monto de P-038 con el tope diario P-039 del día al que se suma (RN-GAM-005, RN-DQC-006).
  - Un día con señal de riesgo no da XP (FR-005-07).
  - Solo se guardan movimientos positivos (RN-GAM-006).
- **Qué suma:**
  - La sesión al terminarla, según su versión.
  - La mitad de comida, la misión de descanso y el día completo, una vez por día.
  - El récord personal (pendiente desde T-044).
  - La bonificación de regreso al cerrar el día (RN-GAM-013, HU-005-4), con BR-01 en la próxima interacción.
  - La semana cumplida al cerrar el domingo.
- **Niveles** (RN-GAM-007): al cruzar un umbral de P-040 se emite `level_up`, se guarda el logro del nivel (`L2`…`L10`, `achievement_unlocked`) y queda RE-02 para la próxima interacción. Por ahora RE-02 va sin su botón [Ver progreso]: `/progreso` llega con M8.
- **Semana cumplida** (RN-GAM-004, HU-005-5, `scheduler/close-week.ts`):
  - Al cerrar el último día de la semana se cuentan las sesiones completadas frente al compromiso y se guarda en `weeks`.
  - Cumplida: XP, SM-01 y racha de semanas +1 (`nextWeekStreak`). No cumplida: la racha de semanas vuelve a 0, sin aviso ni lenguaje de fracaso.
  - Una semana sin plan guardado se evalúa con el plan que se habría generado (`plannedWeekDays`), sin guardarlo.
- **Racha de semanas en la línea** (SPEC-005 §10, decisión del 2026-11-08): DC-04 va debajo de DC-03 desde la primera semana cumplida.
- **Textos nuevos** (redactados por Claude, [[plantillas-de-mensajes]] v0.14.0), pendientes de revisión del PO en el PR:
  - DC-04 "Semanas cumplidas seguidas: {semanas}".
  - SM-01 "Semana cumplida: {sesiones} de {compromiso} sesiones.", sin mencionar puntos porque el tope del domingo puede dejarlos en 0.
- **Eventos con esquema estricto:** `xp_awarded` (evento, monto), `level_up` (nivel), `week_closed` (cumplida, sesiones, compromiso) y `achievement_unlocked` (código).
- **Pruebas:** `scheduler/xp-week.test.ts` (HU-005-3 escenarios 1 y 2, tope diario, idempotencia, señal de riesgo, HU-005-4, HU-005-5 cumplida y no cumplida) y `weekly.test.ts` (`nextWeekStreak`).

## [2026-11-09] decision | M6 · misiones, logros, liga, temporadas y sobreuso
- **Misiones semanales (T-063):** se avisan al generarse (MI-01) y al cumplirse (MI-02, con su XP), en la próxima interacción. Sin comando nuevo.
- **Logros (T-063):** cada logro del catálogo se anuncia con un texto genérico (LG-01). El Reto 66 conserva RE-01 y RE-05.
- **Liga personal y temporadas (T-064, *Could*):** se hace la liga personal (mejor semana propia, RE-03). Las **temporadas quedan fuera de la Fase 0** hasta que el PO defina temas, metas e insignias (RN-GAM-010 sigue en la bóveda; HU-005-8 escenario 2 queda pendiente).
- **Sobreuso (T-065):** [Ajustar plan] de CU-06 muestra el plan de la semana (PN-01) mientras no exista T-045. [Sí, descanso] responde HN-02. CU-06 no cambia.

## [2026-11-09] implementar | T-063 Misiones semanales, Reto 66 y logros (Should)
- **Misiones** (`scheduler/quests.ts`, RN-GAM-008, HU-005-6):
  - Al cerrar un día se asegura que la semana del día siguiente tenga sus 3 misiones (colección `quests`, una por semana, [[modelo-de-datos]] v0.4.0). La primera semana van con el mínimo; después, P-041 × lo logrado la semana anterior (`weeks` guarda ahora `nutritionHalfDays`).
  - Con cada cierre se revisan las misiones de la semana del día cerrado (`questsReached`). Una cumplida suma su XP una vez (P-038).
  - Eventos `quest_generated` (metas) y `quest_completed` (tipo).
- **Logros** (`days/achievements.ts`, RN-GAM-011, RN-GAM-012, HU-005-7): cada logro se guarda una vez en la bitácora y se anuncia en la próxima interacción.
  - Reto 66 con RE-01 por capítulo (P-044) y RE-05 al llegar a P-043.
  - El resto con LG-01: primera sesión, primera en casa o exprés, primer día completo, 100/200/365 días, primera semana cumplida, 4 y 12 semanas seguidas, semana de proteína, regreso tras 7+ días, racha reparada, primer récord y 10 récords.
  - Los números salen del catálogo ([[catalogo-de-logros-y-niveles]]): los códigos (`DQC_100`, `WEEKS_4`) y las condiciones ("7 días seguidos", "7+ días").
- **Lectura propia, para revisión del PO:** con el juego desactivado o una señal de riesgo ese día, el logro **se guarda pero no se anuncia**. La decisión del 2026-11-08 dice "ni logros" ese día, pero los logros por umbral (Reto 66, 100 días) no se repiten, así que no guardarlos sería perderlos (constitución I).
- **Corrección:** de los avisos pendientes solo se resumen los que se reemplazan (RA-01, RA-02, MI-01). Antes también se resumían los logros, y si caían dos el mismo día se perdía uno.
- **Textos nuevos** (redactados por Claude, [[plantillas-de-mensajes]] v0.15.0), pendientes de revisión del PO: MI-01, MI-02 (con los rótulos de su nota) y LG-01.
- **Pruebas:** `scheduler/quests-achievements.test.ts` (generación, dificultad, misión cumplida una vez, Reto 66 capítulo 1 y hábito forjado, LG-01 una vez, señal de riesgo) y `weekly.test.ts` (`questsReached`). Además, las pruebas de fin de sesión y de comida buscan su mensaje entre los avisos de logros que ahora lo siguen.

## [2026-11-09] implementar | T-064 Liga personal (Could; sin temporadas)
- **Liga personal** (`scheduler/close-week.ts`, RN-GAM-009, HU-005-8 escenario 1): al cerrar la semana se compara solo con las semanas anteriores del mismo usuario (`compareWithOwnHistory`), en días que cuentan.
  - Si supera su mejor semana y hay al menos una anterior: RE-03 en la próxima interacción.
  - La primera vez, además, el logro `BEST_WEEK` en la bitácora; después solo RE-03.
  - No existe ninguna comparación entre usuarios.
- **Temporadas (RN-GAM-010):** no se implementan. Quedan como `[NEEDS CLARIFICATION]` en [[spec-005-dia-que-cuenta-y-gamificacion]] §10 hasta que el PO defina temas, metas e insignias. `seasonOf` sigue en el dominio con sus pruebas.
- **Pruebas:** `scheduler/league.test.ts` (nueva mejor semana, segunda mejor semana sin repetir el logro, semana que no supera, primera semana).

## [2026-11-09] implementar | T-065 Señal de sobreuso y respuesta de cuidado CU-06 (Should)
- **Más de P-063 sesiones en un día** (`sessions/finish.ts`, RN-SEG-008, HU-009-5): al completar la sesión n.º P-063 + 1 del día se responde CU-06 y se emite `overuse_signal` (`sessions_per_day`), una sola vez ese día.
- **Todos los descansos entrenados durante P-064 semanas** (`scheduler/close-week.ts`): `weeks` guarda los descansos del plan y en cuántos se completó una sesión ([[modelo-de-datos]] v0.5.0). Al cerrar la semana, `overuseSignal` del dominio decide; si hay señal, CU-06 queda para la próxima interacción y se emite `overuse_signal` (`rest_days`).
- CU-06 es una respuesta de cuidado: sale aunque el juego esté desactivado.
- **Botones de CU-06** (decisión del PO, 2026-11-09): [Sí, descanso] responde HN-02; [Ajustar plan] muestra el plan de la semana (PN-01) hasta que exista T-045.
- **Para revisión del PO** (CU-06 está marcada `[VALIDAR-PROFESIONAL]`): el texto dice "vienes entrenando también en tus descansos", que encaja con la señal semanal pero no del todo con la de varias sesiones en un mismo día. No se cambió; si se quiere, una variante para ese caso necesita revisión profesional.
- **Pruebas:** `scheduler/overuse.test.ts` (tercera sesión del día, dos sesiones sin señal, botones de CU-06, dos semanas entrenando todos los descansos, una semana con descanso).

## [2026-11-09] hito | M6 · Día que cuenta y juego (SPEC-005): T-060 a T-065 hechas
- [[spec-005-dia-que-cuenta-y-gamificacion]] sigue en `borrador`: falta HU-005-8 escenario 2 (temporadas), fuera de la Fase 0 por decisión del PO, y los nombres de los niveles se validan en H1.
- **Pendientes que quedan:**
  - Temporadas (RN-GAM-010).
  - Días en pausa con `/pausa` (T-073).
  - Envío proactivo de los avisos del cierre con la bandeja (T-070/T-071).
  - [Ver progreso] y [Ver bitácora] con `/progreso` y `/logros` (M8).
  - T-045 (ajustar días) para [Ajustar plan] de CU-06.

## [2026-11-09] implementar | M6 · correcciones tras la revisión de código
Revisión de todo el código de M6 con un agente revisor. Corregido:
- **Arranque con una base existente:** `ensureIndexes` falla si un índice cambió de opciones (`quests` pasó a único en T-063). Ahora borra y recrea ese índice, sin tocar los datos. Hay prueba con el índice viejo.
- **Cierre resistente a fallos (FR-005-02):** los efectos del cierre (XP, avisos, semana, misiones, logros) van antes de guardar el estado. Todos tienen clave, así que si algo falla, el ciclo siguiente repite el día sin duplicar ni perder nada. Los eventos de medición pueden repetirse en ese caso.
- **Un usuario con error ya no detiene el cierre de los demás:** se registra `day_close_failed` y se sigue.
- **RN-GAM-003:**
  - Un segundo día sin contar ya no borra una oferta de reparación vigente, y `streak_reset` solo sale si había racha.
  - La reparación se intenta también después del cierre, para cuando la misión se hizo antes de que existiera la oferta. Si choca con el cierre (`rev`), se reintenta una vez.
- **Misiones y señal de riesgo (FR-005-07):** ese día no se evalúan, así que la misión se cumple con un cierre posterior y no pierde su XP. El XP y el aviso van antes de marcarla cumplida.
- **RN-DQC-001:** al terminar una sesión, el día se guarda con el tipo del plan y no siempre como entreno. Así "completo" ya no depende del orden en que se registran la sesión y la comida.

Pendiente, sin cambiar:
- **Para decisión del PO (RN-GAM-005, P-039):** el tope diario recorta los bonos del cierre (semana cumplida, misiones, regreso), que se suman al día cerrado. Un domingo con 85 XP en vivo y una misión deja 25 de 100 para la semana cumplida. Cambiarlo es una regla nueva.
- **Riesgos bajos** (Fase 0 corre en un solo proceso):
  - Detectar la subida de nivel y marcar avisos no es atómico.
  - Un cierre en curso podría recrear datos de un usuario que se borra en ese mismo instante.
  - Si el proceso cae entre guardar el XP del regreso y su aviso, BR-01 no se repite.
  - Terminar una sesión marca la sesión completada antes de sumar el día (patrón de T-043): si falla a mitad, el día no cuenta.

## [2026-11-10] decision | M7 · mensajes proactivos: alcance aprobado por el PO
- **RN-MSJ-016 se amplía:** `cierre_del_dia` sale si el día no cuenta, **o si cuenta y solo le falta la mitad de comida para quedar completo** (CD-03/CD-04). Sigue limitado a P-073 toques y al presupuesto. Cierra la duda de SPEC-007 §10. Pendiente: aplicarlo en la bóveda y en el motor con T-071.
- **`recordatorio_contextual` entra en la Fase 0** con un solo disparador: ayer fue de entreno y no contó, y hoy hay hueco. Tiene la menor prioridad y desvanecimiento RN-MSJ-009. Cierra la otra duda de SPEC-007 §10.
- **Alcance de T-071:**
  - `resumen_semanal` sale ya, en texto (RS-01/RS-02). RS-03 espera a la imagen del muro de T-080.
  - Los reconocimientos siguen como avisos en la próxima interacción hasta M8, que trae /logros y /progreso.
  - `mantenimiento` pasa a M8, con el registro de peso.
- **Botones de T-045:** [Ajustar plan] y [Ajustar días] muestran el plan de la semana, como CU-06. RG-03 sale de la rotación hasta T-045.
- **Trabajo de T-070 en curso** (rama `h4/m7-mensajes-proactivos`, sin commit):
  - P-097 y P-098 en [[parametros]] v0.10.0.
  - `proactive_messages` y `message_stats` en [[modelo-de-datos]] v0.6.0.
  - Puertos `OutboxRepository` y `MessageStatsRepository`, repositorios de Mongo y en memoria, y `telegramPayload` compartido.

## [2026-11-10] implementar | T-070 Bandeja de salida, ciclo, envío con reintentos y supresión de salidas viejas
- **Bandeja** (`proactive_messages`, FR-007-02): una salida por propósito y día operativo (clave `propósito:fecha`, índice único). Repositorios de MongoDB en `adapters/mongo/messaging-repositories.ts` y dobles en `testing/in-memory-messaging.ts`. `message_stats` está listo para T-072 y T-073 ([[modelo-de-datos]] v0.6.0).
- **Programación** (`messaging/schedule.ts`): en cada ciclo (P-096), `plan_listo` se programa P-048 minutos antes de la hora habitual del día (la del hábito; si no, la de su franja, P-083). Vale hasta esa hora. Pasada la hora, ya no se programa.
- **Envío** (`messaging/dispatch.ts`, FR-007-03):
  - Cada salida vencida se vuelve a evaluar con el motor (RN-MSJ-015) y el estado del momento.
  - El motor evalúa la **hora real de envío**: una salida atrasada no cae en silencio ni rompe el presupuesto o la separación. Vieja → `stale`.
  - La plantilla se elige con la rotación (RN-MSJ-010) y los botones salen de la plantilla (RN-MSJ-012).
  - Un error con una salida no detiene las demás.
- **Telegram** (`messaging/sender.ts`, FR-007-08): reintenta ante 429 (con el `retry_after` de Telegram) o fallos 5xx y de red, hasta P-097 intentos y con espera exponencial desde P-098. Un 403 (bot bloqueado) no se reintenta: se maneja en T-073. El formato de las respuestas se comparte (`telegramPayload`).
- **Eventos:** `message_scheduled`, `message_suppressed` (motivo) y `message_sent` (plantilla), con esquema estricto.
- **Pruebas:**
  - `messaging/cycle.test.ts`: programar y enviar una vez, sesión ya empezada, salida vieja, hora pasada y silencio.
  - **G06 = 0:** 3 semanas de ciclos cada 30 min con horas habituales cambiantes, verificando cada envío por separado.
  - `messaging/sender.test.ts` y pruebas de la bandeja contra MongoDB.
- **Para decisión del PO:** con la franja de la mañana (06:00, P-083) y el silencio por defecto (21:30–07:00, P-047), `plan_listo` cae a las 05:00, dentro del silencio, y **nunca sale**. Opciones:
  - acercar el aviso al fin del silencio si todavía es antes de la hora habitual;
  - pedir otra hora de silencio en el onboarding;
  - aceptar que quien entrena temprano no recibe `plan_listo`.
- **Pendiente:** `repositories.ts` de MongoDB supera las 800 líneas; conviene partirlo por módulo en una tarea de limpieza.

## [2026-11-11] implementar | T-071 Candidatos de M7 y RN-MSJ-016 ampliada
- **Reglas** ([[reglas-de-negocio]] v0.7.0), según la decisión del PO del 2026-11-10:
  - RN-MSJ-005: si `plan_listo` cae en silencio, sale la noche anterior un minuto antes del silencio (`planReadySendAt`).
  - RN-MSJ-016: `cierre_del_dia` también va cuando el día ya cuenta y solo le falta la mitad de comida para quedar completo.
- **Textos** ([[plantillas-de-mensajes]] v0.16.0, para revisión del PO en el PR):
  - PL-06 a PL-08: variantes de la víspera, con [Ver plan].
  - RS-04: resumen sin cifras de proteína.
- **Programación** (`messaging/schedule.ts`): en cada ciclo, por usuario y con un error aislado por usuario:
  - `plan_listo` de hoy y de mañana; el de mañana solo si sale esta noche.
  - `regreso` y `recordatorio_contextual`, solo si se cumple su condición, a la hora de `plan_listo` (fuera del silencio).
  - `cierre_del_dia` a las 20:00 (P-066).
  - `resumen_semanal` el domingo a las 19:00 (P-060).
  - Todas valen hasta que empieza el silencio.
- **Composición** (al enviar, con el estado de ese momento):
  - `compose-day.ts`: `plan_listo` PL-01/02/03/05, o PL-06/07/08 la víspera. `cierre_del_dia` CD-01/02 si el día no cuenta y es descanso, y CD-03/04 si ya cuenta; solo con una comida frecuente (P-073 toques), y en el modo sin números sin las plantillas con gramos.
  - `compose-week.ts`: `regreso` RG-01/02, `recordatorio_contextual` RC-01/02/03, y `resumen_semanal` RS-01 (si hay semana anterior y comidas) o RS-04.
  - `comeback.ts`: entradas de RN-MSJ-008. La actividad es un día que contó o que tuvo la mitad de comida, en una ventana de P-053 días y nunca antes del alta.
  - La fecha del mensaje sale de la clave de la bandeja, así que el aviso de la víspera habla del día siguiente.
- **Supuestos para el PO:**
  - Una semana sin días que cuentan no recibe resumen (pregunta abierta en [[spec-007-proactividad-y-mensajes]] §10).
  - `{frase_semana}` rota por número de semana, sin repetir la de la semana anterior.
  - El día del alta cuenta como día planificado para `regreso`.
- **Pruebas:**
  - `messaging/candidates.test.ts` (13): HU-007-5 escenarios 1 y 2, CD-03, sin frecuente, día completo, `regreso` único en una semana sin actividad (sale el jueves), conteo reiniciado, `recordatorio_contextual` con y sin día anterior contado, RS-04, RS-01 con proteína media, semana en cero y solo domingo.
  - `cycle.test.ts`: aviso de la víspera y víspera atrasada (`stale`).
  - G06 sigue en 0 con todos los propósitos.
- **Pendiente para T-072:**
  - Ampliar la simulación de G06 a 60 días (SC-007-1).
  - Los candidatos se recalculan en cada ciclo aunque ya estén en la bandeja; basta para la Fase 0 (principio XI).

## [2026-11-11] decision | M7 · ignorado y reactivaciones (PO)
- **Ignorado (RN-MSJ-007):** un proactivo queda ignorado si en P-067 h (2 h) tras el envío no hubo ninguna interacción del usuario, ni toque ni comando. Si entrena desde 🏋️ Hoy sin tocar el mensaje, no cuenta como ignorado. La ventana es la misma de M03.
- **Reactivaciones (RN-MSJ-008):** el máximo de P-054 es por cada pausa por inactividad. Cuando el usuario vuelve, el contador se reinicia.
- Registrado en [[spec-007-proactividad-y-mensajes]] §10 y en [[modelo-de-datos]] v0.7.0.

## [2026-11-11] implementar | T-072 Hora habitual aprendida, retroceso, inactividad y desvanecimiento
- **Modelo** ([[modelo-de-datos]] v0.7.0):
  - `proactive_messages.outcome` (`actioned`·`interacted`·`ignored`) con índice `status+outcome+sentAt`.
  - `message_stats.lastInteractionAt`.
  - Índice `workout_sessions` `userId+startedAt`.
  - `training_habits.learnedStart` ahora se escribe.
- **Interacción** (FR-007-06, `bot/middleware.ts` → `messaging/engagement.ts`):
  - Cada toque o comando guarda la hora, reinicia los ignorados y saca de la pausa por inactividad con las reactivaciones en cero.
  - Un toque en un botón de un proactivo es su acción: `message_actioned` con los minutos.
  - Si el registro falla, el update sigue.
- **Ignorados y retroceso** (RN-MSJ-007): al cerrar la ventana P-067, cada enviada queda `actioned`, `interacted` o `ignored`. Una ignorada emite `message_ignored`. Con P-050 seguidas, el presupuesto semanal queda a la mitad P-051 días (`backoff_applied`).
- **Hora habitual aprendida** (RN-MSJ-006, `messaging/learned-time.ts`): en cada ciclo, la mediana de inicio de las últimas P-049 sesiones de cada día del hábito; con menos, la declarada. Solo se guarda cuando cambia.
- **Inactividad** (RN-MSJ-008):
  - Tras P-053 días sin actividad: `regreso` final (RG-04/05), pausa e `inactivity_pause_started`.
  - En pausa solo se programa la reactivación: RG-06 el lunes y RG-07 el día 1, con `reactivation_sent`, hasta P-054.
  - Lo que ya estaba en la bandeja se suprime con `inactive`.
  - Ahora la interacción también es actividad para `regreso`: el onboarding cuenta.
- **Desvanecimiento** (RN-MSJ-009): tras P-055 semanas cumplidas seguidas, el motor recibe `recordatorio_contextual` como apagado, y también `plan_listo` si su tasa de acción no llega a P-056.
- **Rotación** (RN-MSJ-010): ya estaba desde T-070. La simulación la verifica.
- **Pruebas:**
  - `messaging/engagement.test.ts` (11): acción, ignorado, interacción en la ventana, retroceso, final y pausa, reactivaciones y regreso a la actividad, tope de P-054, hora aprendida y desvanecimiento.
  - **SC-007-1:** 60 días con comportamientos aleatorios (semilla fija), incluido un tramo de 15 días de ausencia. 0 violaciones de presupuesto, silencio, separación y rotación, pasando por ignorados, retroceso, pausa y reactivación.

## [2026-11-11] decision | M7 · /pausa y /ajustes (PO)
- **`/pausa` (RN-MSJ-013):** detiene los proactivos de 1 a P-059 días, con las opciones de P-099 (nuevo parámetro: 1, 3, 7 y 14). La semana que toca una pausa no se evalúa, ni cumplida ni rota (SPEC-005 §8). Los días se cierran igual. Con una pausa en curso, `/pausa` ofrece [Reanudar].
- **`/ajustes`:** por ahora abre directo la pantalla de mensajes (cantidad, silencio y tipos). Cuando lleguen las otras secciones pasa a ser un menú.
- Cambian [[reglas-de-negocio]] v0.8.0 (RN-MSJ-013 y RN-MSJ-014), [[parametros]] v0.11.0 (P-099), [[modelo-de-datos]] v0.8.0 (`pausedAt` y `purposesEnabled`) y [[plantillas-de-mensajes]] v0.17.0 (§2.6 y los comandos `pausa` y `ajustes`).

## [2026-11-11] implementar | T-073 /pausa, /ajustes de mensajes y bloqueo
- **`/pausa`** (`messaging/pause.ts`):
  - PA-01 con [1 día] [3 días] [7 días] [14 días] y PA-02 con la fecha de fin; emite `pause_set`.
  - Con pausa en curso: PA-03 con [Reanudar] (PA-04) y [Cambiar días].
  - En pausa, el planificador no programa nada y el motor suprime lo que ya estaba (`paused`). Los comandos siguen.
  - El cierre de semana no evalúa la que toca una pausa (`pauseTouchesWeek` en el dominio).
- **`/ajustes`** (`messaging/message-settings.ts`):
  - AJ-01 con cantidad, silencio y tipos apagados. [Cantidad] reutiliza ON-22 y [Silencio] ON-23 con las franjas de P-047 y P-086.
  - [Tipos] lleva a AJ-02 con ✅/⬜ por propósito.
  - Cada cambio se guarda, emite `message_settings_changed` (campo), avisa con AJ-03 y el motor lo usa en la siguiente evaluación.
  - Los tipos apagados se guardan en `users.settings.purposesEnabled`. El motor recibe los apagados por el usuario más los desvanecidos (RN-MSJ-009).
- **Bloqueo** (RN-MSJ-014): un 403 de Telegram (`BotBlockedError`) cancela las salidas pendientes (también la de ese envío), guarda `blockedAt`, pasa al usuario a `blocked` (deja de estar activo) y emite `bot_blocked`. **[supuesto, para el PO]** Si vuelve a escribir, lo desbloqueó: vuelve a `active` y se le puede escribir de nuevo.
- **Comandos** del menú: se añaden `pausa` y `ajustes`.
- **Pruebas:**
  - `messaging/controls.test.ts` (9): opciones y fecha, nada en pausa con los comandos funcionando, [Reanudar], semana no evaluada, AJ-01, cantidad y silencio con su evento, silencio nuevo en la siguiente evaluación, tipo apagado con `disabled_purpose`, bloqueo y desbloqueo.
  - `pauseTouchesWeek` en el dominio (RN-MSJ-013).
  - `setStatus` y `purposesEnabled` contra MongoDB.

## [2026-11-11] implementar | M7 · correcciones de la revisión de código
Revisión del diff completo de M7 (T-070 a T-073): sin hallazgos críticos ni altos. Se corrigen los 5 medios y 3 de los bajos.

- **Bloquear o desbloquear el bot no es una interacción.** Telegram lo avisa como `my_chat_member`. Antes reiniciaba los ignorados, sacaba de la pausa y podía desbloquear a quien acababa de bloquear. Ahora solo cuentan los mensajes, ediciones y toques.
- **La acción cuenta dentro de P-067 h (M03).** Un toque posterior es solo una interacción. La tasa de acción de `plan_listo` (RN-MSJ-009) se calcula con el resultado de las ventanas cerradas.
- **RN-MSJ-010 en días operativos** (aclaración en [[reglas-de-negocio]]). Medida en horas, el resumen del domingo con una sola plantilla podía quedar suprimido como `cooldown` si el ciclo empezaba unos segundos antes que la semana anterior.
- **[Reanudar] solo actúa con la pausa en curso.** Un botón viejo alargaba la pausa guardada y dejaba sin evaluar la semana actual.
- **Un proactivo sale como mucho una vez.** La salida se reclama (`sending`) antes de enviarla. Si el proceso cae a mitad del envío, no se reenvía al reiniciar. Si Telegram falla tras los reintentos, queda `failed`. Al detenerse, el proceso espera el ciclo en curso. [[modelo-de-datos]]: estados `sending` y `failed`.
- **Bajos corregidos:**
  - Un `regreso` o `recordatorio_contextual` que al salir del silencio pasaría al día siguiente ya no se programa.
  - Al registrar un ignorado solo se escriben los campos del retroceso.
  - Los índices de `/ajustes` se validan con una expresión estricta.
- **Pendiente:**
  - El ciclo de cada minuto relee mucho por usuario. Basta para la Fase 0 (principio XI); antes de la alfa conviene saltar los candidatos cuya clave ya existe.
  - Un `retry_after` largo de Telegram detiene el ciclo; habría que poner un tope (nuevo parámetro).
  - `pausedAt` y `pausedUntil` guardan solo la última pausa.

## [2026-11-11] decision | M8 · alcance y diseño de Progreso (PO)
- **Alcance:**
  - M8 cubre T-080 a T-082.
  - La Mini App (T-083) pasa a la Fase 1, lo que resuelve Q9.
  - T-084 (relación comida–entreno) queda para después.
- **Peso (HU-006-2):** se registra con botones desde el último peso (P-100: ± 0,1 y ± 0,5 kg). Solo el primero se escribe, respondiendo a PG-10. Esto prevalece sobre "escribe un número" (constitución II).
- **Muro (T-080):** 12 semanas, imagen sin texto (los datos van en el pie), SVG → PNG con `@resvg/resvg-js`.
- **Ejercicios clave de `/progreso`:** uno por patrón (sentadilla, bisagra, empuje y tirón), el más entrenado, con su mejor 1RM estimado.
- **Cambios en la bóveda:**
  - [[parametros]] v0.12.0: P-100 y P-101.
  - [[modelo-de-datos]] v0.9.0: `personal_records` con `loadKg` y `reps`.
  - [[plantillas-de-mensajes]] v0.18.0: §2.7, comandos `progreso` y `logros`, y sale KB-02.
  - [[spec-006-progreso-logros-y-mantenimiento]] §10.

## [2026-11-11] implementar | T-081 /progreso, registro de peso y /logros
- **Dominio** (`progress/progress.ts`): `strengthHighlights` da un ejercicio por patrón con su mejor 1RM estimado (RN-ENT-005). `stepWeight` suma o resta los pasos de P-100, con una prueba de propiedad.
- **`/progreso` y `📈 Progreso`** (`progress/progress-screen.ts`):
  - PG-01: días que cuentan, racha y nivel.
  - Barra del objetivo (PG-02/03, RN-OBJ-011), solo si tiene meta.
  - Reto 66 (PG-04/05).
  - Media móvil del peso o "datos insuficientes" (PG-06/07, RN-OBJ-010).
  - Fuerza (PG-08).
  - En el modo sin números no hay peso, barra de peso ni [Registrar peso] (FR-006-05), y [Registrar peso] exige la autorización de medidas corporales (RN-DAT-001). Emite `progress_viewed`.
- **Peso** (`progress/weight.ts`):
  - PG-09 con [−0,5] [−0,1] [+0,1] [+0,5] [Guardar]; el peso viaja en el botón, sin estado guardado.
  - Sin peso previo, PG-10 pide responder al mensaje (`force_reply`), y un texto que no es un peso recibe PG-12.
  - Al guardar emite `weight_logged {source: 'progress'}`.
- **`/logros` y [Ver bitácora]** (`progress/logbook.ts`, RN-GAM-011):
  - Logros y récords de los más viejos a los más recientes, con las últimas P-101 entradas.
  - Los récords guardan ahora carga y repeticiones para mostrar "80 kg × 5 (e1RM 93 kg)"; los anteriores salen sin ese dato (BI-05).
  - Emite `achievement_log_viewed`.
  - Los avisos RE-01 a RE-05 llevan ya sus botones [Ver bitácora]/[Ver progreso].
- **Repositorios:** `weightsSince`, `records.list` y `achievements.list`, en MongoDB y en memoria, con pruebas.
- **Pruebas:**
  - `progress/progress.test.ts` (12): pantalla, teclado, media móvil, barra del objetivo, fuerza, modo sin números, peso escrito y con botones, bitácora vacía y en orden, [Ver bitácora].
  - En el dominio, `progress.test.ts`.

## [2026-11-11] implementar | T-080 Imagen del muro y resumen semanal
- **Dominio** (`progress/progress.ts`): `wallGrid` arma el muro de las últimas P-102 semanas (nuevo, 12), de lunes a domingo. Cada día queda como completo, cuenta, no cuenta o todavía no pasó. Solo estados, sin datos sensibles (FR-006-01).
- **Imagen** (`adapters/images/wall.ts`):
  - Plantilla SVG sin texto, renderizada a PNG en el servidor con `@resvg/resvg-js` 2.6.2. Es la dependencia nueva que preveía el plan técnico §8, sin fuentes que empaquetar.
  - Colores: verde oscuro = completo, verde claro = cuenta, gris = no cuenta, contorno = por venir.
- **Resumen semanal:**
  - Sale como foto con el pie RS-01, RS-03 o RS-04; RS-03 entra ahora que hay imagen.
  - La imagen se genera al enviar. Si falla, se registra y sale solo el texto, sin RS-03.
  - Emite `weekly_summary_sent {withImage}`.
  - El envío proactivo admite foto (`sendPhoto` con el texto de pie).
  - [[plantillas-de-mensajes]] v0.19.0: la nota de §1.5 se actualiza; ya no menciona RS-02, que el PO había dejado fuera.
- **Pruebas:**
  - Muro en el dominio, con una propiedad.
  - Imagen: un cuadro por día, sin texto, PNG válido.
  - Envío como foto.
  - Resumen con imagen y RS-03, y resumen cuando la imagen falla.
  - Generé una imagen de ejemplo con el renderizador real.
- **Pendiente:** verificar el envío a Telegram con el bot real. El criterio de T-080 dice "enviada en local", y aquí no hay token; quedó probado con la API simulada.

## [2026-11-11] decision | T-082 · nueva meta y compromiso en mantenimiento (PO)
- **[Nueva meta], [Ajustar] y [Extender]** reutilizan la propuesta del onboarding (ON-05 y ON-06/07). Extender suma P-001 semanas; en la pregunta se nombró P-006 por error, que es el IMC mínimo. El objetivo anterior se cierra con su estado (RN-OBJ-007). Cubre lo esencial de T-035.
- **Mantenimiento:** solo cambia el umbral de la semana cumplida (P-010); el plan sigue con los días declarados.
- [[plantillas-de-mensajes]] v0.20.0: §2.8 con GO-01 a GO-10, textos nuevos para revisión del PO.

## [2026-11-11] implementar | T-082 Objetivo cumplido, revisión de fase y mantenimiento
- **Revisión diaria** (`goals/goal-review.ts`, al cerrar cada día):
  - RN-OBJ-006: la media móvil en la meta P-007 semanas cierra el objetivo como cumplido. Llega GO-01 como aviso con el capítulo, se anota GOAL_DONE y se emite `goal_completed`.
  - RN-OBJ-008: el fin del plazo sin la meta lo cierra como completado parcial, con el % y GO-02, sin lenguaje de fracaso; emite `goal_partially_completed`.
  - RN-OBJ-013: cada P-057 semanas revisa la fase y emite `phase_reviewed`; con el ritmo fuera de límites llega GO-03.
  - RN-MAN-001: si en P-009 días no elige, entra solo en mantenimiento.
- **Mantenimiento** (RN-MAN-002, RN-MAN-005, FR-006-04): es un objetivo `maintain` con el peso de entrada (zona ± P-011 %, GO-04, o GO-05 sin peso). La intensidad pasa a Baja y se emite `maintenance_entered`. La semana se cumple con P-010 sesiones (`evaluateWeek` con `maintenance`).
- **`mantenimiento` proactivo** (RN-MAN-003, `messaging/compose-goal.ts`): los lunes, si la media de las últimas P-012 semanas quedó fuera de la zona, sale MA-01 a MA-03 por el motor (`maintenance_band_exited`). [Ver opciones] muestra GO-09; [Mover mi zona] centra la zona (GO-10).
- **Botones** (`goals/goal-actions.ts`):
  - [Mantener], [Nueva meta] (ON-05/21 → ON-06/07 o GO-07 → GO-08), [Extender] (GO-06) y [Ajustar].
  - La propuesta de meta del onboarding se extrajo para reutilizarla, sin cambiar su comportamiento.
  - Los avisos GO llevan sus botones.
- **Repositorios:** `goals.close`, `latest` y `extendActive`.
- **Pruebas:** `goals/goals.test.ts` (11) y RN-MAN-002 en el dominio.
- **Pendiente:**
  - El logro MAINTENANCE_4W (4 semanas cumplidas en mantenimiento).
  - Las temporadas de maestría (RN-MAN-004), que están fuera de la Fase 0.
  - Que `/ajustes` permita cambiar de objetivo (resto de T-035).

