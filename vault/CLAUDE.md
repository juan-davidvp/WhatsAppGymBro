# CLAUDE.md — Esquema de la bóveda de *Gym Bro* (LLM Wiki + SDD)

> **Capa de esquema** del patrón *LLM Wiki* de Andrej Karpathy (`F01` en [[registro-de-fuentes]]), extendida con una capa `output/` para Spec-Driven Development (SDD). Define cómo un agente (Claude Code, Claude chat u otro LLM) lee, escribe y mantiene esta bóveda de Obsidian. Se carga automáticamente cuando Claude Code trabaja con archivos dentro de `vault/`.

## 1. Propósito

Repositorio de conocimiento vivo de **Gym Bro**: un **bot de Telegram estructurado** (botones, comandos y mensajes proactivos; sin personaje ni charla libre) que ayuda a hombres de 18 a 32 años que entrenan solos a ser constantes con su entrenamiento y su alimentación. La bóveda guarda el **porqué** (wiki) y el **qué** (specs en `output/`); el **cómo** vive en el código (`../app/`).

## 2. Tres capas

| Capa | Carpeta | Quién escribe | Regla |
|---|---|---|---|
| Fuentes crudas | `raw/` | Humano | **Inmutables.** El agente las lee; nunca las edita, renombra ni borra. Incluye observaciones del PO (`FB-###`), artículos, entrevistas. |
| Wiki | `wiki/` | Agente, con revisión del PO | Conocimiento sintetizado, enlazado y trazable a fuentes. Explica el porqué. |
| Salidas | `output/` | Agente, derivado del wiki | Artefactos para un consumidor concreto: paquete SDD para Claude Code (`output/sdd/`), mapas, resúmenes. Cada archivo declara `deriva_de`. |
| Esquema | `CLAUDE.md` | PO (el agente solo propone) | Este archivo. Todo cambio se registra en `wiki/log.md`. |

## 3. Estructura

```
vault/
├── CLAUDE.md · inicio.md
├── _plantillas/            # plantillas de Obsidian (spec, ADR, regla, fuente, entrevista, página)
├── raw/                    # feedback/, investigacion/, entrevistas/, adjuntos/
├── wiki/
│   ├── index.md · log.md   # LEER index.md PRIMERO
│   ├── producto/ usuarios/ experiencia/ conceptos/
│   ├── mercado/ competencia/ decisiones/ fuentes/
│   └── _archivo/           # versiones obsoletas
└── output/
    ├── leeme-output.md · mapa-de-trazabilidad.canvas
    └── sdd/                # constitucion, glosario, reglas, parametros, specs/, plan/, contenido/, tareas/
```

## 4. Convenciones de Obsidian

- **Propiedades (frontmatter) obligatorias** en `wiki/` y `output/`: `titulo`, `tipo`, `hito`, `estado`, `creado`, `actualizado`, `fuentes`, `relacionados`. En `output/` añadir `version` y `deriva_de`.
- **Nombres de archivo** en `kebab-case`, sin tildes ni eñes y **únicos en toda la bóveda** (el nombre es la clave del enlace). Prohibido repetir nombres como `README.md`.
- **Enlaces internos** con `[[nombre]]`; a una sección: `[[nombre#Sección]]`. Un enlace a una página inexistente es válido solo si figura en "Páginas pendientes" del índice.
- **Avisos** con *callouts*: `> [!warning]`, `> [!note]`, `> [!question]` (preguntas abiertas).
- **Diagramas** en Mermaid (Obsidian los renderiza).
- **Idioma:** español neutro con tuteo; nombres locales de comidas (Colombia) cuando aplique.

## 5. Sistema de identificadores

| Prefijo | Qué es | Dónde vive |
|---|---|---|
| `F##` | Fuente externa | [[registro-de-fuentes]] |
| `FB-###-##` | Observación del PO | `raw/feedback/` |
| `H##` / `R##` / `Q##` | Hipótesis / riesgo / pregunta abierta | [[propuesta-de-valor]] |
| `M##` / `G##` | Métrica / métrica de salvaguarda | [[propuesta-de-valor]] y [[plan-de-medicion]] |
| `ADR-###` | Decisión | [[registro-de-decisiones]] |
| `RN-XXX-###` | Regla de negocio | [[reglas-de-negocio]] |
| `P-###` | Parámetro configurable | [[parametros]] |
| `SPEC-###`, `HU-###-#`, `FR-###-##`, `SC-###-#` | Spec, historia, requisito, criterio de éxito | `output/sdd/specs/` |
| `T-###` | Tarea de implementación | [[tareas-fase-0]] |

**Regla de oro:** toda cifra o afirmación externa lleva `F##`. Lo no respaldado se marca `[inferencia]`, `[supuesto]` o `[hipótesis H##]`. Todo valor numérico que afecte la salud se marca `[VALIDAR-PROFESIONAL]` hasta que un profesional lo firme.

**Confianza de fuentes:** **A** primaria, oficial o revisada por pares · **B** prensa especializada o reporte de industria · **C** blog de proveedor, estimación de terceros o fuente secundaria (contrastar antes de decidir).

## 5.1 Cadena de trazabilidad (no romper)

`FB / F##` → página del wiki (porqué) → `ADR` → `RN` + `P` → `SPEC` (`HU`, `FR`, `SC`) → `T` → prueba en código (nombrada con el `RN`) → evento de medición (`M`).

## 6. Operaciones

### 6.1 Ingest (incorporar una fuente o una observación)
1. El humano deja la fuente en `raw/` (o entrega una URL). Las observaciones del PO se guardan literales en `raw/feedback/FB-###_fecha_tema.md`.
2. El agente propone 3–5 hallazgos y espera confirmación.
3. Registra la fuente (`F##`) o desglosa la observación (`FB-###-##`).
4. Actualiza las páginas afectadas del wiki **y** marca qué artefactos de `output/` quedan desactualizados.
5. Añade las páginas nuevas a `wiki/index.md` y una entrada en `wiki/log.md`.

### 6.2 Query (consultar)
Leer `wiki/index.md` → leer solo lo pertinente → responder citando `[[página]]` y `F##`. Si la respuesta tiene valor duradero, proponer archivarla.

### 6.3 Derive (generar o actualizar `output/`)
1. Partir de páginas `wiki/` en estado `en-revision` o `aprobado`.
2. Subir `version` del artefacto y completar `deriva_de`.
3. Si cambia una regla (`RN`) o un parámetro (`P`), registrar `decision` en el log y avisar que el código debe revisarse (ver `../CLAUDE.md`).

### 6.4 Lint (obligatorio al cierre de cada hito y antes de cada entrega a código)
Ejecutar `python3 ../herramientas/lint_trazabilidad.py` y revisar: enlaces rotos, páginas huérfanas, `F##` sin registrar, `RN` citadas que no existen, `RN` sin ninguna spec, observaciones `FB` sin atender, cifras sin fuente, contradicciones y datos volátiles con más de 6 meses.

## 7. Formato del log

`## [AAAA-MM-DD] operación | título` — operaciones: `hito`, `ingest`, `query`, `crear`, `editar`, `derive`, `decision`, `lint`, `migracion`, `implementar` (tarea `T-###` terminada en `../app/`). Últimas entradas: `grep "^## \[" wiki/log.md | tail -5`.

## 8. Ciclo de vida

`borrador` → `en-revision` → `aprobado` → `obsoleto`. Las specs añaden `implementado` entre `aprobado` y `obsoleto`; las páginas de navegación (`index`, `log`, `inicio`) usan `vigente`. Nada se borra: lo obsoleto se mueve a `wiki/_archivo/` con aviso y enlace a su reemplazo. Editar una página `aprobado` exige una entrada `decision` en el log.

## 9. Hitos

| Hito | Entregables | Estado |
|---|---|---|
| **H0** Fundamentación | Propuesta de valor, mercado, benchmark, conceptos | Cerrado v0.2 (2026-10-18), pendiente de aprobación del PO |
| **H1** Descubrimiento | Entrevistas al usuario cabeza 01, concierge, prueba de canal (Telegram) | Pendiente — corre en paralelo a H4 |
| **H2** Diseño de experiencia | Flujos, voz de marca, sistema de gamificación (conceptual) | Borrador en `wiki/experiencia/` |
| **H3** Especificación | Paquete SDD en `output/sdd/` | Borrador v0.1 — listo para revisión |
| **H4** Construcción Fase 0 | Bot en `../app/`, protocolo N-de-1 | Pendiente — se inicia con Claude Code |

## 10. Reglas para el agente

1. **No inventar cifras.** Si falta un dato, crear `Q##` y registrarlo en el log.
2. **No copiar textos de las fuentes.** Parafrasear; citas de menos de 15 palabras y una por fuente.
3. **Separar evidencia, inferencia y supuesto.**
4. **No modificar `raw/`.**
5. **Seguridad primero:** todo contenido de nutrición, peso o entrenamiento se revisa contra [[seguridad-y-cumplimiento]].
6. **El producto no es un bot conversacional:** no proponer charla libre, personajes ni compañeros virtuales (ADR-006).
7. **Las reglas viven en un solo lugar:** [[reglas-de-negocio]] y [[parametros]]. Las specs las referencian; no las reescriben.
