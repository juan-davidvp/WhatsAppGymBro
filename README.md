# Gym Bro

Bot de Telegram **estructurado** (botones, comandos y mensajes proactivos; sin charla libre ni personaje) que ayuda a hombres de 18 a 32 años que entrenan solos a ser constantes con su entreno y su comida. Este repositorio reúne la documentación de producto —una bóveda de Obsidian con trazabilidad— y, desde la tarea T-001, el código.

```
gym-bro/
├── CLAUDE.md            ← instrucciones para Claude Code (importa la constitución)
├── .claude/
│   ├── rules/           ← reglas por ruta: dominio · bot y contenido · mensajes y planificador · datos y seguridad
│   └── skills/          ← /implementar-spec · /cambiar-regla · /lint-trazabilidad · /ingest-wiki
├── herramientas/        ← lint_trazabilidad.py · generar_mapa_trazabilidad.py
├── vault/               ← bóveda de Obsidian: raw (inmutable) → wiki (el porqué) → output (lo que se construye)
└── app/                 ← código del bot (lo crea Claude Code en T-001)
```

## 1. Abrir la bóveda en Obsidian

1. En Obsidian: **Abrir carpeta como bóveda** y elegir `gym-bro/vault/` (no la raíz del repositorio).
2. La carpeta `vault/.obsidian/` ya trae los ajustes de enlaces y plantillas. Comprobar en **Ajustes**:
   - **Archivos y enlaces:** formato de enlace nuevo "Ruta más corta posible"; "Usar [[Wikilinks]]" activado; "Actualizar enlaces internos automáticamente" activado; carpeta de adjuntos `raw/adjuntos`.
   - **Complementos principales → Plantillas:** activado, con la carpeta `_plantillas`. Si el complemento estaba apagado, activarlo y elegir la carpeta a mano.
3. Empezar por `inicio.md`. El lienzo `output/mapa-de-trazabilidad.canvas` muestra la cadena completa: observación → wiki → decisión → regla → spec → tarea → prueba → métrica.

## 2. Construir con Claude Code

1. **Requisitos:** Node.js LTS y pnpm, Docker (MongoDB local), Python 3.10 o superior (herramientas) y un bot creado con BotFather en Telegram. El token va en `app/.env`, nunca en el repositorio.
2. Abrir una terminal en la **raíz** `gym-bro/` y ejecutar `claude`. Claude Code carga `CLAUDE.md` con la constitución importada; las reglas de `.claude/rules/` y `vault/CLAUDE.md` se cargan cuando trabaja con esos archivos.
3. Primer mensaje sugerido:
   > Lee `vault/output/leeme-output.md` y `vault/output/sdd/tareas/tareas-fase-0.md`. Luego ejecuta `/implementar-spec T-001`.
4. Ciclo por tarea: `/implementar-spec T-###` → revisar el resultado → commit con el ID de la tarea. Para cambiar una regla, un valor o un texto: `/cambiar-regla`. Al cerrar cada hito: `/lint-trazabilidad --codigo`.

## 3. Verificar la trazabilidad

```bash
python3 herramientas/lint_trazabilidad.py            # enlaces, fuentes F##, reglas RN, parámetros P, historias HU, observaciones FB
python3 herramientas/lint_trazabilidad.py --codigo   # además: pruebas por regla y parámetros en parameters.ts
python3 herramientas/lint_trazabilidad.py --corregir # completa la lista `fuentes` del frontmatter
python3 herramientas/generar_mapa_trazabilidad.py    # regenera el lienzo al crear o renombrar páginas
```

El lint sale con código 1 si encuentra errores, así que puede ir en la integración continua (T-006).

## 4. Antes de abrir la alfa a otras personas

- Firma de un nutricionista y un entrenador certificado sobre todo lo marcado `[VALIDAR-PROFESIONAL]` o `[V]` (Q4).
- Recursos de ayuda verificados y vigentes para Colombia en las respuestas de cuidado (`{recurso_local}`).
- Política de tratamiento de datos, responsable designado y registro de autorizaciones (Ley 1581; RN-DAT-007).

## 5. Privacidad del repositorio

Si el repositorio se comparte o se publica, activar en `.gitignore` las líneas que excluyen entrevistas y datos del N-de-1 (`vault/raw/leeme-raw.md`).
