---
name: lint-trazabilidad
description: Revisa la trazabilidad de la bóveda de Gym Bro (enlaces, fuentes F##, reglas RN, parámetros P, historias HU, observaciones FB, frontmatter) y, con --codigo, que cada regla tenga su prueba. Úsala al cerrar un hito, antes de un pull request o después de crear, renombrar o archivar páginas.
argument-hint: "[--codigo] [--corregir]"
---

# Lint de trazabilidad

1. Ejecutar desde la raíz del repositorio: `python3 herramientas/lint_trazabilidad.py $ARGUMENTS`
2. Separar el informe en **errores** (bloquean la entrega) y **advertencias**.
3. Proponer para cada error la corrección concreta (archivo y cambio). Corregir directamente solo lo mecánico y seguro: un enlace con error tipográfico, la lista `fuentes` del frontmatter (`--corregir`), un conteo. Nunca editar `vault/raw/`. Nunca inventar una fuente `F##` para "arreglar" una cita: marcar la afirmación como `[supuesto]` o preguntar al PO.
4. Si se crearon, renombraron o archivaron páginas: añadirlas a `vault/wiki/index.md` y regenerar el lienzo con `python3 herramientas/generar_mapa_trazabilidad.py`.
5. Repetir el lint hasta tener 0 errores.
6. Registrar en `vault/wiki/log.md`: `## [AAAA-MM-DD] lint | <resumen>` con errores corregidos y advertencias pendientes.
