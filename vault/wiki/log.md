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
