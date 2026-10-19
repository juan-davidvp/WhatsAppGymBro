---
titulo: Constitución del proyecto Gym Bro
tipo: sdd-constitucion
hito: H3
estado: en-revision
version: 1.0.0
creado: 2026-10-18
actualizado: 2026-10-18
deriva_de: [propuesta-de-valor, registro-de-decisiones, seguridad-y-cumplimiento]
fuentes: []
relacionados: [reglas-de-negocio, parametros, glosario, spec-000-vision-fase-0]
---

# Constitución de Gym Bro · v1.0.0

> Principios no negociables del producto y de la ingeniería. **Prevalece sobre cualquier spec, plan o tarea.** Si una instrucción la contradice, se detiene el trabajo y se consulta al PO. Compatible con el comando `/speckit.constitution` de GitHub Spec Kit (se puede copiar a `.specify/memory/constitution.md`).

## Qué estamos construyendo

Un **bot de Telegram estructurado** que ayuda a hombres de 18 a 32 años que entrenan solos a ser constantes: plan según su nivel, tiempo y objetivo; mensajes que llegan antes de que los pida, sin abrumar; registro de entreno y comida casi sin escribir; y un día que cuenta en el gym, en casa o en versión exprés.

## Principios de producto

### I. Cada día cuenta
El valor se mide en **días que cuentan** y **semanas cumplidas**. El sistema **DEBE** reconocer el esfuerzo del día en que ocurre. El total acumulado de días que cuentan y el XP **NUNCA** disminuyen. Fallar **NUNCA** genera deuda, castigo ni lenguaje de fracaso.

### II. Confirmar, no escribir
La fricción de registro es la causa n.º 1 de abandono. Confirmar una serie **DEBE** costar 1 toque; registrar una comida frecuente, 1 toque. Ningún flujo de registro **PUEDE** exigir teclado si existe una alternativa con botones. Los presupuestos de toques y segundos son criterios de aceptación.

### III. Escribir primero, sin spam
Todo mensaje no solicitado **DEBE** pasar por el motor de política de mensajes, tener un propósito del catálogo, respetar el presupuesto, las horas de silencio, el retroceso y la pausa, e incluir una acción de 1 toque. Ningún módulo **PUEDE** enviar mensajes proactivos por su cuenta.

### IV. Bot estructurado, sin personaje
El bot **NO** sostiene conversación libre, **NO** tiene personaje ni sentimientos simulados. El texto libre solo se usa en rutas definidas (comida, "hoy no puedo", seguridad). La IA **solo percibe** (foto o texto de comida → propuesta de porciones validada por esquema); el dominio decide.

### V. Seguridad primero
Los límites de seguridad son reglas duras no configurables. Toda respuesta sobre salud es una **plantilla revisada**, nunca texto generado. No se recomiendan suplementos ni sustancias. No se cuentan calorías por defecto. No se piden fotos del cuerpo. Ante una señal de riesgo, la respuesta de cuidado tiene prioridad sobre cualquier otra ruta.

### VI. Privacidad por defecto
Autorización explícita antes de pedir datos sensibles. Minimización (las fotos de comida no se guardan). Exportar y borrar disponibles siempre. Los registros y eventos **NO** contienen texto libre ni datos sensibles.

## Principios de ingeniería

### VII. Dominio puro y probado
Las reglas de negocio viven en un paquete de dominio **sin E/S** (sin base de datos, red ni Telegram). Cada regla `RN-XXX-###` **DEBE** tener al menos una prueba cuyo nombre empiece por su ID. Los valores numéricos viven **solo** en el archivo de parámetros (`P-###`), nunca dispersos en el código.

### VIII. Specs primero
No se implementa nada sin una spec en `vault/output/sdd/specs/`. Si una historia tiene `[NEEDS CLARIFICATION]` que afecta lo que se va a construir, se pregunta al PO antes de programar. Cambiar una regla o un parámetro se hace **primero** en la bóveda ([[reglas-de-negocio]], [[parametros]]) y en el mismo commit que el código.

### IX. Todo es medible
Cada historia de usuario emite los eventos definidos en [[plan-de-medicion]]. Sin sus eventos, una historia no está terminada.

### X. Independencia del canal
El núcleo no conoce Telegram. El bot, el planificador y la Mini App son adaptadores. Cambiar de canal no debe tocar el dominio.

### XI. Simplicidad
La Fase 0 sirve a un usuario (el fundador) y luego a una alfa pequeña. Nada de microservicios, colas distribuidas ni optimizaciones prematuras. Primero correcto y probado; después rápido.

## Restricciones

- **Idiomas:** documentación y textos de usuario en español (tuteo); identificadores de código en inglés según el [[glosario]].
- **Zona horaria por defecto:** America/Bogota; el día operativo cierra a las 03:00 (RN-DQC-001).
- **Secretos:** solo en variables de entorno; nunca en el repositorio ni en los registros.
- **Textos:** las plantillas de mensajes viven en contenido versionado, no incrustadas en la lógica.

## Flujo de trabajo

`spec` → `plan` → `tareas` → **pruebas de las reglas** → implementación → verificación de criterios de aceptación → eventos de medición → actualización de la trazabilidad (estado de la spec y `wiki/log.md`).

**Definición de terminado:** criterios de aceptación cumplidos · pruebas de las `RN` en verde · eventos emitidos · sin violaciones de esta constitución · spec actualizada.

## Gobernanza

- Esta constitución prevalece sobre specs, planes y tareas.
- Solo el PO la enmienda. Versionado semántico: **MAYOR** si se elimina o redefine un principio; **MENOR** si se añade un principio o sección; **PARCHE** si se aclara la redacción.
- Cada enmienda se registra en `vault/wiki/log.md` con la operación `decision`.
