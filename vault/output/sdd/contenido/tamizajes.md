---
titulo: Tamizajes del onboarding (contenido versionado)
tipo: sdd-contenido
hito: H3
estado: borrador
version: 0.1.0
creado: 2026-10-19
actualizado: 2026-10-19
deriva_de: [seguridad-y-cumplimiento, spec-009-seguridad-y-privacidad, plantillas-de-mensajes]
fuentes: [F96, F97, F98, F99, F100, F101, F102]
relacionados: [spec-009-seguridad-y-privacidad, spec-001-onboarding-y-objetivo, reglas-de-negocio, parametros, plantillas-de-mensajes, expresiones-de-alerta]
---

# Tamizajes del onboarding

> [!warning] `[VALIDAR-PROFESIONAL]`: instrumentos elegidos a partir de fuentes, no de criterio clínico
> El PO decidió el 2026-10-19 usar instrumentos validados y públicos en la Fase 0 (uso propio). **Antes de la alfa**:
> - un profesional los revisa y firma (Q4);
> - se piden los permisos de uso pendientes (§4).
>
> Son **tamizajes, no diagnósticos**: un resultado positivo cambia el plan o la forma de mostrar el progreso. Un resultado negativo no significa "sin riesgo" (`F101`).

Este es el contenido que el código carga desde `app/packages/content/`. Lo usan RN-SEG-002 y RN-SEG-003. Los textos para el usuario (`TZ-…`) están en [[plantillas-de-mensajes]] §3.1.

## 1. Previo a la actividad física: PAR-Q+ por enlace (RN-SEG-002)

**Por qué por enlace.** Las condiciones de la PAR-Q+ Collaboration (`F97`) impiden dos cosas:
- cambiar el texto del formulario;
- incorporarlo en encuestas electrónicas o productos sin consentimiento escrito.

Por eso el bot **no copia las preguntas**. Hace tres cosas:
1. Enlaza al **PAR-Q+ oficial en español** (`F96`; adaptación con fiabilidad test-retest publicada, `F98`): https://eparmedx.com/wp-content/uploads/2023/12/Spanish.pdf
2. Pregunta solo el resultado de la página 1, que tiene 7 preguntas de sí o no: **[Todo NO] [Algún SÍ] [No lo hice]**.
3. Guarda solo el resultado (§3).

| Respuesta | Resultado | Consecuencia (RN-SEG-002) |
|---|---|---|
| Todo NO | `clear` | Plan normal. |
| Algún SÍ | `flag` | Se recomienda consultar a un médico antes de empezar (`F96`: con algún SÍ se completan las páginas 2 y 3 o se consulta a un profesional). El plan arranca con intensidad baja hasta que toque [Ya tengo autorización]. |
| No lo hice | sin resultado | Se trata como si no hubiera autorización: el plan arranca con intensidad baja. Puede contar el resultado después [Todo NO] [Algún SÍ]. `[inferencia]`: lectura más prudente de RN-SEG-002. |

**Pendiente.** No está claro si enlazar al formulario desde un producto requiere licencia. La política de hipervínculos de `F97` la exige a organizaciones con ánimo de lucro que enlazan desde su sitio web. Hay que confirmarlo por escrito antes de la alfa (eparmedx@gmail.com).

## 2. Relación con la comida y el cuerpo: SCOFF (RN-SEG-003)

**Instrumento.** SCOFF (`F99`): 5 preguntas de sí o no. Es **positivo con P-082 o más respuestas "sí"**, que es el punto de corte original. Los autores piden no cambiarlo sin una validación nueva (`F101`).

**Versión elegida.** La traducción colombiana de Rueda et al. (`F100`, artículo CC BY). Pregunta directamente por el vómito provocado y usa 7 kg. Se reproduce con atribución (licencia CC BY) y se adaptó en dos aspectos `[adaptación propia]`:
- **Masculino:** la versión validada está en femenino ("llena", "gorda", "delgada").
- **Tuteo:** lo exige la constitución; la versión validada usa "usted".
- **Pregunta 4 sin la palabra "gordo":** las plantillas no pueden usarla (RN-MSJ-011), así que se pregunta si "siente que le sobra peso". La idea es la misma (creerse con exceso de peso pese a lo que dicen los demás), pero la redacción cambia.

Ninguna de las dos adaptaciones está validada.

| N.º | Pregunta (adaptada de `F100`) |
|---|---|
| 1 | ¿Te provocas el vómito porque te sientes muy lleno? |
| 2 | ¿Te preocupa haber perdido el control sobre la cantidad de comida que comes? |
| 3 | ¿Has perdido recientemente más de 7 kg en un período de 3 meses? |
| 4 | ¿Sientes que te sobra peso aunque los demás digan que estás demasiado delgado? |
| 5 | ¿Dirías que la comida domina tu vida? |

**Si es positivo (RN-SEG-003):**
- se activa el modo sin números;
- se muestran recursos profesionales, con el mismo recurso verificado de la categoría `extreme_restriction` de [[expresiones-de-alerta]] §4;
- no se permiten objetivos de pérdida de peso.

**Limitaciones conocidas** (para la revisión profesional):
- El SCOFF se validó en mujeres (`F99`, `F100`).
- En estudios con más hombres, la sensibilidad es menor (`F102`).
- No se encontró una validación en hombres jóvenes de Colombia.
- Un falso positivo solo activa el modo sin números, que es reversible. Un falso negativo pasa sin aviso.
- **Pregunta abierta para el profesional:** ¿un "sí" a la pregunta 1 (vómito provocado) debería disparar por sí solo la respuesta de cuidado CU-02, aunque el total no llegue a P-082?

## 3. Qué se guarda (minimización)

- **Las respuestas no se guardan nunca.**
  - El PAR-Q+ se responde fuera del bot.
  - Las respuestas del SCOFF viajan solo en los datos de los botones del mensaje siguiente, para llevar la cuenta, y se descartan.
- **Con autorización de la categoría `screening`** (RN-DAT-001), se guarda en `screenings` el tipo (`pre_activity` · `food_body`), el resultado (`clear` · `flag`) y la fecha ([[modelo-de-datos]]).
- **Siempre**, porque es una consecuencia de seguridad y no un dato de salud, se guarda:
  - el arranque suave del plan (`users.settings.lowIntensityStart`);
  - el modo sin números (`users.settings.numberFreeMode`).
- **Eventos:** `screening_completed` lleva el tipo y el resultado, nunca las respuestas (RN-DAT-005).

## 4. Permisos pendientes antes de la alfa

- **PAR-Q+:** consentimiento escrito de la PAR-Q+ Collaboration para el uso por enlace, y confirmar si aplica una licencia comercial (`F97`).
- **SCOFF:** no hay una licencia formal publicada. Pedir permiso a los autores (J. F. Morgan para el original; Rueda et al. para la traducción) y citarlos siempre (`F99`, `F100`).
