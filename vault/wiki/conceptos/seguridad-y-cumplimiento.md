---
titulo: Seguridad y cumplimiento — salvaguardas clínicas, datos y plataforma
tipo: concepto
hito: H0
estado: en-revision
creado: 2026-10-05
actualizado: 2026-10-18
fuentes: [F23, F40, F41, F42, F60, F70, F71]
relacionados: [propuesta-de-valor, relacion-comida-entreno, voz-y-marca, spec-009-seguridad-y-privacidad, reglas-de-negocio, registro-de-decisiones]
---

# Seguridad y cumplimiento

> [!warning] No es asesoría legal ni clínica
> Antes de abrir el bot a usuarios externos se requiere revisión de un abogado de protección de datos y de un profesional de nutrición y entrenamiento (Q4, Q5).

## 1. Principio

**Un consejo dañino destruye en un día la confianza que el usuario tardó meses en construir.** La seguridad es una restricción de todo el sistema. El diseño de la v0.2 la refuerza: **el bot no genera texto libre**, así que cada respuesta sobre salud es una plantilla revisada (ADR-006, ADR-007).

## 2. Lección de referencia: el caso Tessa (2023)

La asociación estadounidense de trastornos de la alimentación (NEDA) retiró su chatbot Tessa después de que recomendara contar calorías, buscar déficits y medir la grasa corporal a personas vulnerables; el problema apareció cuando se añadieron capacidades generativas a un sistema guionizado (`F42`).

**Qué aplica a Gym Bro:**
1. Cambiar el modelo o las plantillas puede volver inseguro un sistema seguro: todo cambio pasa por el *red-team* (RN-SEG, H11).
2. El contexto del usuario define qué es seguro.
3. Las decisiones de salud viven en reglas deterministas; la IA solo percibe (RN-SEG-010).

## 3. Riesgos clínicos del segmento (hombres de 18 a 32)

| Riesgo | Por qué importa en este segmento | Salvaguarda | Regla |
|---|---|---|---|
| **Dismorfia muscular** | Preocupación por no ser lo bastante musculoso; las estimaciones en grupos de levantamiento de pesas van de 1 % a 54 % según el método, y se asocia con uso de esteroides, alimentación alterada y ejercicio compulsivo (`F60`) | Sin fotos corporales, sin comparaciones, sin presión por tamaño; tamizaje; derivación | RN-SEG-003, RN-SEG-009 |
| Trastornos de la conducta alimentaria | El conteo y la restricción pueden agravarlos (`F42`) | Calorías apagadas; modo sin números; nunca premiar el déficit | RN-NUT-007, RN-GAM-014 |
| Restricción o ganancia extrema | Metas irreales ("10 kg de músculo en un mes") | Límites duros de ritmo e IMC | RN-OBJ-004, RN-OBJ-005 |
| Esteroides y suplementos | Asociados a la dismorfia muscular (`F60`) | Nunca recomendar; respuesta predefinida y derivación | RN-SEG-005 |
| Lesiones | Progresión mal dosificada | Progresión conservadora; botón "dolor" | RN-ENT-002, RN-SEG-006 |
| Sobreuso o compulsión | Entrenar en todos los descansos; ansiedad por la racha | Tope de XP, descanso que cuenta, alerta de sobreuso, comodines | RN-SEG-008, RN-GAM-005 |
| Condiciones médicas | Requieren supervisión | Tamizaje previo a la actividad y derivación | RN-SEG-002 |
| Menores de edad | Fuera de alcance | Verificación de edad declarada | RN-SEG-001 |
| Crisis emocional | Puede aparecer en el texto libre | Respuesta de cuidado predefinida, pausa de mecánicas de juego, recursos | RN-SEG-007 |

## 4. Detección de señales en el texto libre

- Lista de **expresiones de alerta** por categoría (restricción extrema, purga, sustancias, dolor fuerte, angustia), mantenida en el contenido y validada por un profesional `[VALIDAR-PROFESIONAL]`.
- Al detectarse: **respuesta de cuidado predefinida** (nunca generada por IA), sugerencia de hablar con un profesional y recursos; se registra solo la **categoría** del evento (RN-DAT-005).
- *Red-team* mínimo antes de la alfa: **≥ 50 escenarios** (déficits extremos, ayunos prolongados, compensar comida con ejercicio, esteroides, dolor, menores, intentos de saltarse límites). Criterio: **0 fallos críticos** (H11).

## 5. Protección de datos

### 5.1 Marco: Colombia — Ley 1581 de 2012 (supuesto de mercado, ADR-016)

| Requisito | Contenido | Fuente |
|---|---|---|
| Datos sensibles | Incluye los datos relativos a la salud | `F40` |
| Prohibición general | Solo se tratan con **autorización explícita**, salvo excepciones | `F40` |
| Deber de informar | Finalidad y **carácter facultativo** de responder sobre datos sensibles | `F40` |
| Autoridad | Superintendencia de Industria y Comercio | `F40` |

### 5.2 Particularidades de Telegram

| Hecho | Implicación | Fuente |
|---|---|---|
| Los chats normales se guardan cifrados en los servidores de Telegram, pero **no son de extremo a extremo** | Lo que el usuario escribe al bot (peso, comidas) queda también en Telegram; hay que informarlo | `F71` |
| Los bots son servicios de terceros y reciben los mensajes que se les envían | Gym Bro es responsable del tratamiento de lo que recibe | `F71` |
| Para vender bienes digitales en bots se usan Telegram Stars, con obligación de soporte de pagos | Requisitos adicionales en la Fase 1 | `F70` |

### 5.3 Implicaciones de diseño

- **Consentimiento granular** antes de pedir peso, medidas o respuestas de tamizaje; todos opcionales (RN-DAT-001).
- **Aviso claro** de que el chat queda en Telegram y de que las fotos o textos de comida se envían a un proveedor de IA (RN-DAT-002).
- **Minimización:** las fotos de comida no se conservan tras la estimación; no hay fotos de progreso corporal en la Fase 0 (RN-DAT-004, RN-SEG-009).
- **Derechos:** `/exportar` y `/borrar_datos` (borrado total en nuestra base en ≤ 24 h; el historial del chat se borra desde Telegram) (RN-DAT-003).
- **Transferencias:** servidor, base de datos y proveedor de IA pueden estar fuera de Colombia → verificar condiciones de transferencia internacional con asesoría legal.
- **Fase 0 (uso propio):** riesgo mínimo; el cumplimiento completo es requisito **antes** de la alfa (RN-DAT-007).

## 6. Plataforma

- **Telegram** es el canal de la Fase 0/01 (ADR-002). Riesgo: cambios de reglas y pagos obligatorios en Stars (`F70`).
- **WhatsApp Business:** desde el 15-ene-2026, Meta prohíbe en su API los asistentes de IA de propósito general, con criterio discrecional (`F41`). Un bot estructurado podría encajar, pero no se usa en la Fase 0/01.

## 7. Posicionamiento regulatorio

Producto de **bienestar**, no dispositivo médico: no diagnostica, no trata y no reemplaza a profesionales; sin afirmaciones clínicas en el producto ni en el marketing (ADR-004).

## 8. Relación saludable con el producto

La revisión de alcance de 2026 señaló la empatía limitada y la privacidad como debilidades recurrentes de los chatbots de salud (`F23`). Gym Bro responde con: comodines y descanso que cuenta (contra la ansiedad por la racha), `/pausa`, horas de silencio, sin culpa y sin simular amistad.

## 9. Lista de verificación previa a la alfa

- [ ] Parámetros `[VALIDAR-PROFESIONAL]` firmados por nutricionista y entrenador
- [ ] Instrumentos de tamizaje elegidos y validados
- [ ] Lista de expresiones de alerta y respuestas de cuidado revisadas
- [ ] *Red-team* superado (0 fallos críticos)
- [ ] Política de tratamiento y autorización de datos sensibles revisadas por un abogado
- [ ] Responsable del tratamiento designado (Q5)
- [ ] `/exportar` y `/borrar_datos` funcionando
- [ ] Verificación de edad en el onboarding
- [ ] Revisión de las condiciones vigentes de Telegram para bots y pagos
