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
