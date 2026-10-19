---
name: ingest-wiki
description: Incorpora una fuente nueva (artículo, estudio, entrevista, dato de mercado) o una observación del PO a la bóveda de Gym Bro siguiendo el patrón LLM Wiki - registrar, sintetizar, enlazar y marcar qué artefactos de output quedan desactualizados. Úsala cuando haya material nuevo en vault/raw/ o una URL para analizar.
argument-hint: "[ruta en vault/raw/ | URL | texto del PO]"
disable-model-invocation: true
---

# Ingest al wiki

Material: $ARGUMENTS

Seguir `vault/CLAUDE.md` §6.1:

1. **Guardar la fuente cruda.**
   - URL: leerla y, si el PO lo pide, guardar notas o la referencia en `vault/raw/investigacion/`.
   - Texto del PO que todavía no está en `raw/`: crear `vault/raw/feedback/FB-###_AAAA-MM-DD_tema.md` (siguiente número libre) con el texto **literal** y, debajo, su desglose atómico `FB-###-01`, `FB-###-02`… Una vez creado, el archivo no se vuelve a editar.
   - Nunca modificar, renombrar ni borrar un archivo existente de `raw/`.
2. **Ubicarse:** leer `vault/wiki/index.md` y solo las páginas que el material toca.
3. **Proponer 3–5 hallazgos** (qué dice, qué cambia, páginas afectadas, confianza A/B/C) y **esperar la confirmación del PO**.
4. **Tras la confirmación:**
   - Fuente externa → fila nueva `F##` (siguiente número libre) en `vault/wiki/fuentes/registro-de-fuentes.md` con fecha, confianza y URL.
   - Actualizar las páginas del wiki afectadas: parafrasear (citas de menos de 15 palabras, una por fuente), citar `F##` o `FB-###-##`, separar evidencia, `[inferencia]` y `[supuesto]`; subir `actualizado`.
   - Si cambia una regla o un parámetro, no editarlo aquí: anotar que requiere `/cambiar-regla`.
   - Marcar cada artefacto de `vault/output/` afectado con `> [!warning] Desactualizado por <F## / FB-###>` al inicio, hasta que se derive de nuevo.
   - Páginas nuevas → `vault/wiki/index.md`. Preguntas abiertas → `Q##` en la propuesta de valor.
   - `vault/wiki/log.md`: `## [AAAA-MM-DD] ingest | <título>`.
5. **Verificar:** `python3 herramientas/lint_trazabilidad.py`.
6. **Resumen** en el chat: qué cambió, qué artefactos necesitan *derive*, qué preguntas quedaron abiertas.
