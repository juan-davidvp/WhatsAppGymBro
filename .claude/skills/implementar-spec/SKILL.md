---
name: implementar-spec
description: Implementa una tarea (T-###) o una spec (SPEC-###) de Gym Bro con spec-driven development, escribiendo primero las pruebas de cada regla de negocio. Úsala para construir o continuar cualquier funcionalidad de la Fase 0 del bot de Telegram.
argument-hint: "[T-### | SPEC-###]"
---

# Implementar una tarea o una spec

Objetivo: $ARGUMENTS

## 1. Ubicar el trabajo

1. Si es `T-###`: buscar su fila en `vault/output/sdd/tareas/tareas-fase-0.md` y comprobar que sus dependencias tienen `✅`. Si falta alguna, decir cuál y proponer empezar por ella.
2. Si es `SPEC-###`: listar sus tareas en ese archivo y avanzar por la primera pendiente cuyas dependencias estén hechas.
3. Leer la spec completa en `vault/output/sdd/specs/`: historias y escenarios, FR, RN citadas, SC, eventos, casos borde, fuera de alcance y `[NEEDS CLARIFICATION]`.

## 2. Reunir solo lo necesario

- Las filas de las RN citadas en `vault/output/sdd/reglas-de-negocio.md` y de los `P-###` que esas reglas usan en `vault/output/sdd/parametros.md` (buscarlas por ID; no hace falta cargar los archivos enteros).
- Nombres: `vault/output/sdd/glosario.md`. Ubicación del código: `vault/output/sdd/plan/plan-tecnico.md` §3 y §4. Colecciones e índices: `plan/modelo-de-datos.md`. Eventos: `plan/plan-de-medicion.md` §2. Textos y catálogos: `vault/output/sdd/contenido/`.

## 3. Detenerse si una duda cambia lo que se construye

Si un `[NEEDS CLARIFICATION]`, una contradicción entre spec y regla, o una regla que parezca violar la constitución afecta esta tarea: explicar el impacto en 2–3 líneas, proponer una opción por defecto y **preguntar al PO antes de programar**. Las reglas `[VALIDAR-PROFESIONAL]` se pueden usar en la Fase 0 (uso propio), pero se mantienen señaladas.

## 4. Plan breve (en el chat, máximo 15 líneas)

RN a cubrir · archivos a crear o tocar · pruebas que se escribirán · eventos a emitir · presupuesto de toques si hay interacción con el usuario.

## 5. Pruebas primero

- Al menos una prueba por RN, con el ID al inicio del nombre: `describe('RN-DQC-003 · día de descanso', ...)`.
- Cada escenario Dado/Cuando/Entonces de la historia se convierte en una prueba del caso de uso.
- Invariantes con fast-check cuando la spec o `plan/estrategia-de-pruebas.md` §3 lo pidan.
- Ejecutarlas y confirmar que fallan por la razón esperada.

## 6. Implementar de adentro hacia afuera

Dominio puro (números solo desde `parameters.ts`) → caso de uso → adaptadores (repositorio, bot, planificador) → contenido. Respetar `.claude/rules/`.

## 7. Verificar

- `pnpm test` · `pnpm typecheck` · `pnpm lint`
- `python3 herramientas/lint_trazabilidad.py --codigo`: la tarea no está terminada si alguna de sus RN aparece sin prueba.
- Recorrer el criterio "Terminado cuando…" de la tarea y cada SC aplicable; decir explícitamente cuáles se cumplieron y cómo se comprobó.

## 8. Cerrar y trazar

1. Añadir `✅` junto al ID de la tarea en `tareas-fase-0.md`.
2. Si todas las historias de la spec están hechas: `estado: implementado` y subir la `version` (parche) en su frontmatter.
3. Añadir al final de `vault/wiki/log.md`: `## [AAAA-MM-DD] implementar | T-### <título>` con las RN cubiertas y los archivos principales.
4. Si el trabajo reveló algo que contradice la bóveda, no se "arregla" en silencio en el código: se anota como `[NEEDS CLARIFICATION]` en la spec y se avisa al PO.
5. Proponer el mensaje de commit: `T-###: <resumen> (RN-…)`.
