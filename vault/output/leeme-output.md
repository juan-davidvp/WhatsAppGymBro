---
titulo: Léeme de la capa output · paquete SDD de la Fase 0
tipo: output-indice
hito: H3
estado: en-revision
version: 0.1.0
creado: 2026-10-18
actualizado: 2026-10-19
deriva_de: [index, propuesta-de-valor, registro-de-decisiones]
fuentes: [F01, F77, F78, F79]
relacionados: [constitucion, spec-000-vision-fase-0, tareas-fase-0, inicio]
---

# Capa `output/` · paquete SDD de la Fase 0

> [!note] Qué hay aquí
> Artefactos **derivados** del wiki para un consumidor concreto: Claude Code construyendo el bot de Telegram de la Fase 0. Aquí no se decide nada nuevo: si cambia el porqué, se cambia primero en `wiki/` y luego se deriva de nuevo (operación *derive*, `vault/CLAUDE.md` §6.3). El patrón raw → wiki → esquema es el de Karpathy (`F01`); `output/` es la extensión de este proyecto.

## 1. Contenido

| Artefacto | Para qué sirve | Versión | Estado |
|---|---|---|---|
| [[constitucion]] | Principios no negociables (I–XI), restricciones, definición de terminado y gobernanza. Se importa en cada sesión de Claude Code | 1.0.0 | en-revision |
| [[glosario]] | Términos del dominio y su nombre en código (inglés) | 0.1.0 | borrador |
| [[reglas-de-negocio]] | **Fuente única** de las 103 reglas `RN-…` (14 por validar con un profesional) | 0.1.0 | en-revision |
| [[parametros]] | Los 81 valores numéricos `P-001…P-081`, que el código replica en `parameters.ts` | 0.1.0 | en-revision |
| [[spec-000-vision-fase-0]] | Mapa de specs, orden de implementación, MoSCoW, requisitos no funcionales y criterios globales | 0.1.0 | borrador |
| [[spec-001-onboarding-y-objetivo]] · [[spec-002-plan-y-sesion-del-dia]] · [[spec-003-registro-de-entrenamiento]] · [[spec-004-registro-de-nutricion]] · [[spec-005-dia-que-cuenta-y-gamificacion]] · [[spec-006-progreso-logros-y-mantenimiento]] · [[spec-007-proactividad-y-mensajes]] · [[spec-008-integraciones]] · [[spec-009-seguridad-y-privacidad]] | Una spec por módulo: historias (HU) con escenarios Dado/Cuando/Entonces, requisitos (FR), reglas citadas, criterios de éxito (SC), eventos, casos borde, fuera de alcance y dudas `[NEEDS CLARIFICATION]` | 0.1.0 | borrador |
| [[plan-tecnico]] | Stack, arquitectura hexagonal, estructura del repositorio, flujo de una actualización, planificador, IA acotada, despliegue | 0.1.0 | borrador |
| [[modelo-de-datos]] | Colecciones, índices, invariantes, borrado total y retención | 0.1.0 | borrador |
| [[plan-de-medicion]] | Eventos, métricas M00–M08 y salvaguardas G01–G06, protocolo N-de-1 | 0.1.0 | borrador |
| [[estrategia-de-pruebas]] | Niveles, pruebas nombradas por `RN`, invariantes, *red-team*, aceptación manual en el gym, integración continua | 0.1.0 | borrador |
| [[plantillas-de-mensajes]] · [[catalogo-de-logros-y-niveles]] · [[catalogo-de-ejercicios-base]] · [[alimentos-accesibles-base]] · [[expresiones-de-alerta]] | Contenido versionado que el código carga desde `app/packages/content/` | 0.1.0 | borrador |
| [[tareas-fase-0]] | Tareas T-001…T-104 por hito, con dependencias, paralelismo y criterio de terminado | 0.1.0 | borrador |
| [[mapa-de-trazabilidad.canvas]] | Lienzo de Obsidian con la cadena raw → wiki → output → código | 0.1.0 | borrador |

## 2. Orden de lectura

**Claude Code, en cada sesión:**
1. `CLAUDE.md` de la raíz (se carga solo) y la [[constitucion]] (importada desde ese archivo).
2. [[tareas-fase-0]] → la siguiente tarea cuyas dependencias estén terminadas.
3. La spec de esa tarea y **solo las filas** de [[reglas-de-negocio]] y [[parametros]] que cita.
4. [[plan-tecnico]] y [[modelo-de-datos]] para saber dónde va el código; [[glosario]] para nombrarlo.
5. [[estrategia-de-pruebas]] antes de escribir la primera prueba.

**Una persona que revisa (PO, nutricionista, entrenador):** [[inicio]] → [[propuesta-de-valor]] → [[constitucion]] → [[spec-000-vision-fase-0]] → filas `[VALIDAR-PROFESIONAL]` de [[reglas-de-negocio]] y `[V]` de [[parametros]].

## 3. Uso con Claude Code

- Abrir Claude Code en la **raíz del repositorio** (`gym-bro/`), no dentro de `vault/`. Los `CLAUDE.md` del directorio de trabajo se cargan al iniciar y los de subcarpetas, como `vault/CLAUDE.md`, solo cuando se trabaja con sus archivos (`F77`).
- Las reglas por ruta de `.claude/rules/` se aplican al tocar el dominio, el bot y el contenido, los mensajes y el planificador, o los datos (`F77`).
- *Skills* del proyecto en `.claude/skills/`, invocables con `/nombre` y argumentos (`F78`):

| Skill | Cuándo | Ejemplo |
|---|---|---|
| `/implementar-spec` | Implementar una tarea o una spec completa, pruebas primero | `/implementar-spec T-014` |
| `/cambiar-regla` | Cambiar una `RN` o un `P` sin perder la trazabilidad | `/cambiar-regla P-045 1 mensaje en días de descanso` |
| `/lint-trazabilidad` | Al cerrar un hito y antes de cada *pull request* | `/lint-trazabilidad --codigo` |
| `/ingest-wiki` | Incorporar una fuente o una observación nueva del PO | `/ingest-wiki raw/feedback/FB-002_…md` |

## 4. Compatibilidad con GitHub Spec Kit

El paquete sigue la secuencia de Spec Kit —constitución → especificar → planificar → tareas → implementar (`F79`)— con estructura propia en español y trazabilidad a `RN`.

| Spec Kit | En esta bóveda |
|---|---|
| `.specify/memory/constitution.md` | [[constitucion]] |
| `specs/###-nombre/spec.md` | `output/sdd/specs/spec-###-nombre.md` |
| `plan.md` | [[plan-tecnico]] (común a toda la Fase 0) |
| `data-model.md` | [[modelo-de-datos]] |
| `tasks.md` | [[tareas-fase-0]] |
| `/speckit.implement` | `/implementar-spec` |

> [!question] ¿Instalar Spec Kit?
> Recomendación: **no en la Fase 0**. Duplicaría la constitución y las specs, y dos copias de una regla es justo lo que el principio "las reglas viven en un solo lugar" evita. Si se adopta más adelante, `.specify/memory/constitution.md` debe ser una copia generada de la [[constitucion]] (nunca editada a mano), y las specs de Spec Kit deben citar las `RN` por ID en lugar de reescribirlas.

## 5. Reglas de esta capa

1. Todo artefacto declara `deriva_de` y `version` (SemVer: **mayor** si cambia una regla o el alcance; **menor** si se añade contenido; **parche** si solo cambia la redacción).
2. Las reglas viven solo en [[reglas-de-negocio]] y [[parametros]]; specs, plan y contenido las citan por ID y no las reescriben.
3. Si un cambio en el wiki deja un artefacto desactualizado, se le añade `> [!warning] Desactualizado` hasta derivarlo de nuevo.
4. Un `[NEEDS CLARIFICATION]` bloquea solo las historias afectadas; el resto de la spec se puede implementar.
5. El estado de cada spec avanza `borrador` → `en-revision` → `aprobado` → `implementado`.

## 6. Registro de cambios

| Versión | Fecha | Cambio | Origen |
|---|---|---|---|
| 0.1.0 | 2026-10-18 | Primera derivación completa del paquete SDD de la Fase 0 (bot de Telegram estructurado) | FB-001, corrección de canal (ADR-002), ADR-001 a ADR-018 |
