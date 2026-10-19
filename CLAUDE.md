# Gym Bro — instrucciones para Claude Code

Bot de Telegram **estructurado** (botones, comandos y mensajes proactivos; sin charla libre ni personaje) que ayuda a hombres de 18 a 32 años que entrenan solos a ser constantes con su entreno y su comida. **Fase 0:** lo usa el fundador (protocolo N-de-1); después, una alfa pequeña en Colombia. Todo lo que se construye sale de la documentación de `vault/`.

## Constitución (prevalece sobre specs, planes, tareas y este archivo)

@vault/output/sdd/constitucion.md

## Mapa del repositorio

- `vault/` — bóveda de Obsidian, fuente de verdad del producto: `raw/` (inmutable) → `wiki/` (el porqué) → `output/` (lo que se construye). Tiene su propio `vault/CLAUDE.md`, que se carga al trabajar con sus archivos.
- `vault/output/sdd/` — paquete SDD: `constitucion.md`, `glosario.md`, `reglas-de-negocio.md` (RN), `parametros.md` (P), `specs/`, `plan/`, `contenido/`, `tareas/tareas-fase-0.md`. Índice: `vault/output/leeme-output.md`.
- `app/` — código; lo crea la tarea T-001. Monorepo pnpm: `packages/domain` (reglas puras), `packages/content` (textos y catálogos), `apps/server` (bot grammY, planificador, HTTP), `apps/miniapp` (*Should*), `infra/`.
- `herramientas/` — `lint_trazabilidad.py` (trazabilidad bóveda ↔ código) y `generar_mapa_trazabilidad.py` (lienzo de Obsidian).
- `.claude/rules/` — reglas que se aplican al tocar dominio, bot y contenido, mensajes y planificador, datos y seguridad.
- `.claude/skills/` — `/implementar-spec`, `/cambiar-regla`, `/lint-trazabilidad`, `/ingest-wiki`.

## Cómo se trabaja (spec-driven)

1. Elegir la siguiente tarea en `vault/output/sdd/tareas/tareas-fase-0.md` cuyas dependencias estén terminadas, o ejecutar `/implementar-spec T-###`.
2. Leer la spec de la tarea y **solo** las filas de `reglas-de-negocio.md` y `parametros.md` que cita. Nombres de código: `glosario.md`.
3. Si la tarea toca un `[NEEDS CLARIFICATION]` que cambia lo que se construye, **preguntar al PO antes de programar**. Si no lo toca, avanzar y dejar la duda anotada.
4. **Pruebas primero:** al menos una por regla, con el ID al inicio del nombre (`describe('RN-DQC-003 · día de descanso', …)`); invariantes con fast-check.
5. Implementar de adentro hacia afuera: dominio puro → caso de uso → adaptador (bot, planificador, base de datos).
6. Verificar: `pnpm test`, `pnpm typecheck`, `pnpm lint` y `python3 herramientas/lint_trazabilidad.py --codigo`.
7. Cerrar: marcar `✅` junto al ID de la tarea, actualizar `estado` de la spec cuando todas sus historias estén hechas y añadir una entrada a `vault/wiki/log.md`.

**Terminado** = escenarios de aceptación cumplidos · pruebas de las RN en verde · eventos de `plan/plan-de-medicion.md` emitidos · sin violar la constitución · spec y tarea actualizadas.

## Fuentes de verdad (una sola copia de cada cosa)

| Qué | Dónde se define | Dónde vive en código |
|---|---|---|
| Reglas | `vault/output/sdd/reglas-de-negocio.md` | `app/packages/domain` + pruebas con el ID |
| Números | `vault/output/sdd/parametros.md` | `app/packages/domain/src/config/parameters.ts` (comentario `P-###` en cada valor) |
| Nombres | `vault/output/sdd/glosario.md` | tipos, funciones y colecciones |
| Textos del bot | `vault/output/sdd/contenido/plantillas-de-mensajes.md` | `app/packages/content` (por ID, p. ej. `PL-01`) |
| Catálogos | `vault/output/sdd/contenido/` | `app/packages/content` |
| Datos | `vault/output/sdd/plan/modelo-de-datos.md` | repositorios en `apps/server/src/adapters` |
| Eventos | `vault/output/sdd/plan/plan-de-medicion.md` | emisor de eventos |

## Cambiar una regla, un parámetro o un texto

Nunca solo en el código. Usar `/cambiar-regla`: primero la bóveda, luego la prueba, luego el código, **en el mismo commit**, con una entrada `decision` en `vault/wiki/log.md`. Lo marcado `[VALIDAR-PROFESIONAL]` o `[V]` no cambia sin aprobación del PO. Si el código y la bóveda no coinciden, gana la bóveda hasta que el PO diga otra cosa.

## Comandos

Disponibles desde T-001; los comandos `pnpm` se ejecutan **dentro de `app/`** (ahí está el `package.json` raíz del monorepo). Ajustar esta sección si cambian.

- `pnpm install` · `pnpm test` · `pnpm typecheck` · `pnpm lint` · `pnpm format:check` · `pnpm dev` (bot en *long polling*, desde T-004)
- `cp app/infra/.env.example app/infra/.env` (completar) · `docker compose -f app/infra/docker-compose.yml up -d` — MongoDB local (usuario de la aplicación con `readWrite` solo sobre `gymbro`)
- `python3 herramientas/lint_trazabilidad.py` — bóveda · `--codigo` añade RN ↔ pruebas · `--corregir` completa `fuentes` en el frontmatter
- `python3 herramientas/generar_mapa_trazabilidad.py` — regenera el lienzo al crear o renombrar páginas

## Nunca

- Charla libre, personaje, "compañero" o sentimientos simulados (ADR-006).
- Texto generado por IA dirigido al usuario sobre salud, comida o entreno; la IA solo devuelve porciones validadas por esquema.
- Recomendar suplementos o sustancias; contar calorías por defecto; pedir fotos del cuerpo.
- Enviar un mensaje proactivo sin pasar por el motor de política de mensajes.
- Números mágicos en el código o reglas reescritas fuera de la bóveda.
- Inventar cifras, fuentes o recursos de ayuda (líneas de crisis): se verifican y se citan.
- Editar `vault/raw/`.
- Secretos en el repositorio o en los registros; texto libre del usuario en eventos o registros.
- Añadir dependencias, servicios o infraestructura que el plan técnico no justifique (principio XI).

## Estado (2026-10-18)

- Documentación H0–H3 en borrador o en revisión; H4 (construcción) empieza con T-001.
- Supuestos vigentes mientras el PO no responda: MongoDB (Q8), Mini App como *Should* que pasa a Fase 1 si no cabe (Q9), nombre "Gym Bro" y usuario del bot provisionales (Q7). Q8 conviene cerrarla antes de T-005 y T-020 (base de datos); las demás no bloquean M0–M2.
- Antes de la alfa con otras personas: firma de nutricionista y entrenador certificado sobre todo lo `[VALIDAR-PROFESIONAL]` (Q4) y política de datos con responsable designado (Q5, RN-DAT-007).

## Git

Un commit por tarea o por regla, con el ID al inicio: `T-014: día operativo y cuenta (RN-DQC-001…007)`. Rama por hito (`h4/m1-dominio`). La documentación de la bóveda que cambie va en el mismo commit que el código.
