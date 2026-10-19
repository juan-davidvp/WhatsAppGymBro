---
name: cambiar-regla
description: Cambia una regla de negocio (RN-…), un parámetro (P-…) o una plantilla de texto de Gym Bro manteniendo la trazabilidad bóveda → prueba → código en un mismo commit. Úsala cuando el PO pida modificar un comportamiento, un valor o un texto del bot.
argument-hint: "[RN-XXX-### | P-### | ID de plantilla] [cambio deseado]"
disable-model-invocation: true
---

# Cambiar una regla, un parámetro o un texto

Petición: $ARGUMENTS

## 1. Entender el cambio

1. Localizar la definición actual buscando el ID en `vault/output/sdd/` (reglas en `reglas-de-negocio.md`, valores en `parametros.md`, textos en `contenido/plantillas-de-mensajes.md`).
2. Si es una regla `[VALIDAR-PROFESIONAL]`, un parámetro `[V]` o un parámetro con "Duro: Sí": advertir que necesita aprobación explícita del PO (y firma profesional antes de la alfa). Si la petición no la trae, pedirla.
3. Contrastar con la constitución (`vault/output/sdd/constitucion.md`). Si el cambio viola un principio —por ejemplo, castigar un fallo, añadir charla libre o relajar un límite de seguridad—, detenerse y explicar cuál. Solo el PO enmienda la constitución.

## 2. Análisis de impacto (mostrarlo antes de editar)

Buscar el ID en todo el repositorio (`vault/` y `app/`) y presentar una tabla: archivo · qué cambia · riesgo. Incluir specs, pruebas, eventos y métricas afectados.

## 3. Aplicar en este orden, en un solo commit

1. **Bóveda:** editar la fila de la regla, del parámetro o la plantilla; subir `version` del archivo (menor si cambia el comportamiento, parche si solo cambia la redacción) y `actualizado`.
2. **Specs** que la citan: ajustar escenarios o criterios si el comportamiento cambió (se referencia la regla, no se copia).
3. **Decisión:** si responde a una decisión de producto, añadir o actualizar el ADR en `vault/wiki/decisiones/registro-de-decisiones.md`.
4. **Log:** `## [AAAA-MM-DD] decision | <ID>: <resumen>` en `vault/wiki/log.md`, con valor anterior → nuevo y motivo.
5. **Pruebas:** ajustar o añadir las pruebas cuyo nombre empieza por el ID; deben fallar con el código anterior.
6. **Código:** `app/packages/domain/src/config/parameters.ts` (parámetro), el módulo del dominio (regla) o `app/packages/content` (plantilla).
7. **Verificar:** `pnpm test`, `pnpm typecheck` y `python3 herramientas/lint_trazabilidad.py --codigo`.

## 4. Cierre

Resumen en el chat: qué cambió y dónde, pruebas afectadas y mensaje de commit propuesto (`<ID>: <resumen>`).
