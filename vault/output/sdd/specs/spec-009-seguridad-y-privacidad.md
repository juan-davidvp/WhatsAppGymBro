---
titulo: SPEC-009 · Seguridad, privacidad y datos
tipo: sdd-spec
id: SPEC-009
hito: H3
estado: borrador
version: 0.1.2
fase: 0
prioridad: P1
depende_de: []
creado: 2026-10-18
actualizado: 2026-10-19
deriva_de: [seguridad-y-cumplimiento, voz-y-marca, relacion-comida-entreno]
fuentes: [F40, F42, F60, F71, F82, F91, F92, F93]
relacionados: [spec-001-onboarding-y-objetivo, plantillas-de-mensajes, estrategia-de-pruebas, reglas-de-negocio]
---

# SPEC-009 · Seguridad, privacidad y datos

## 1. Propósito

Que ningún usuario reciba un consejo dañino, que los datos sensibles se traten con autorización y minimización, y que el usuario pueda **llevarse o borrar** sus datos en cualquier momento (Constitución V y VI).

## 2. Historias de usuario

### HU-009-1 · Consentimiento y aviso de privacidad (P1)
1. **Dado** `/start`, **cuando** llega al paso de privacidad, **entonces** lee en ≤ 5 líneas: qué datos se piden (todos opcionales), para qué, que el chat se guarda en Telegram sin cifrado de extremo a extremo y que las fotos o textos de comida se envían a un proveedor de IA; con [Acepto] [Ver política] [No acepto] (RN-DAT-001, RN-DAT-002; `F71`). [Ver política] y `/privacidad` muestran la política provisional PV-01 de la Fase 0 (RN-DAT-007), que se reemplaza por el texto legal antes de la alfa (Q5).
2. **Dado** que no acepta, **cuando** toca [No acepto], **entonces** puede usar el bot sin datos sensibles (sin peso ni tamizaje de comida): objetivo `ser_constante`, sin metas de peso.
3. **Dado** que ya decidió, **cuando** usa `/privacidad`, **entonces** puede dar o retirar la autorización; queda el historial y vale la decisión más reciente (PV-02, PV-03).

### HU-009-2 · Mayoría de edad y tamizaje previo a la actividad (P1)
1. **Dado** la pregunta de edad, **cuando** responde que es menor de 18, **entonces** recibe un cierre amable y no se crea el perfil (RN-SEG-001).
2. **Dado** el tamizaje previo a la actividad, **cuando** alguna respuesta es positiva, **entonces** se le recomienda consultar a un médico antes de empezar y el plan inicia con intensidad baja hasta que confirme [Ya tengo autorización] (RN-SEG-002).

### HU-009-3 · Tamizaje de relación con la comida y el cuerpo (P1)
1. **Dado** el tamizaje breve, **cuando** es positivo, **entonces** se activa el **modo sin números**, se ocultan gramos, peso y calorías, se desactivan objetivos de pérdida de peso y se muestran recursos de ayuda profesional (RN-SEG-003).

### HU-009-4 · Respuesta de cuidado ante señales de riesgo (P1)
1. **Dado** un texto libre con una expresión de alerta (p. ej., sobre dejar de comer, purgarse, esteroides o dolor fuerte), **cuando** llega, **entonces** antes de cualquier otra ruta se responde con la **respuesta de cuidado predefinida** de su categoría y se pausan las mecánicas de juego ese día (RN-SEG-007).
2. **Dado** una pregunta sobre suplementos o sustancias, **cuando** llega, **entonces** se responde que el bot no los recomienda y se sugiere un profesional (RN-SEG-005).

### HU-009-5 · Sobreuso (P2)
1. **Dado** más de P-063 sesiones en un día o entrenar todos los descansos durante P-064 semanas, **cuando** se detecta, **entonces** recibe un mensaje de cuidado que sugiere descansar (RN-SEG-008).

### HU-009-6 · Borrar mis datos (P1)
1. **Dado** `/borrar_datos`, **cuando** confirma dos veces, **entonces** todos sus datos se eliminan de la base de Gym Bro en ≤ P-065 horas y recibe instrucciones para borrar el chat en Telegram (RN-DAT-003).

### HU-009-7 · Red-team (P1, interno)
1. **Dado** el conjunto de ≥ 50 escenarios adversariales, **cuando** se ejecuta la batería de pruebas, **entonces** 0 respuestas recomiendan algo inseguro y todas las señales se derivan (H11).

## 3. Requisitos funcionales

| ID | Requisito |
|---|---|
| FR-009-01 | El detector de señales de riesgo DEBE ejecutarse sobre todo texto libre **antes** del enrutamiento (RN-SEG-007). |
| FR-009-02 | Las respuestas de cuidado DEBEN ser plantillas versionadas y revisadas; nunca texto generado (RN-SEG-010). |
| FR-009-03 | Los límites de seguridad DEBEN validarse en el dominio y no tener opción de anulación por el usuario (RN-SEG-004). |
| FR-009-04 | El sistema NO DEBE pedir ni aceptar fotos del cuerpo; si llega una foto que no es comida, no se almacena (RN-SEG-009, RN-DAT-004). |
| FR-009-05 | Los registros técnicos y los eventos NO DEBEN contener texto libre del usuario (RN-DAT-005). |
| FR-009-06 | Los secretos DEBEN leerse de variables de entorno y nunca registrarse (RN-DAT-006). |
| FR-009-07 | El borrado DEBE ser total (usuario, días, sesiones, comidas, logros, salidas, eventos asociados) y verificable por prueba. |

## 4. Reglas aplicables

RN-SEG-001 a RN-SEG-010 · RN-DAT-001 a RN-DAT-007 · RN-NUT-007.

## 5. Entidades

`Consent`, `Screening`, `RiskSignal` (solo categoría y fecha), `CareResponse` (plantilla), `DeletionRequest`.

## 6. Criterios de éxito

| ID | Criterio |
|---|---|
| SC-009-1 | 0 fallos críticos en el *red-team* (H11). |
| SC-009-2 | Prueba automática: tras el borrado, ninguna colección contiene el identificador del usuario. |
| SC-009-3 | 0 eventos o registros con texto libre (revisión automática de esquemas de eventos). |

## 7. Eventos

`consent_given` (categorías) · `consent_declined` · `age_gate_failed` · `screening_completed` (resultado por categoría) · `number_free_mode_enabled` · `risk_signal_detected` (categoría) · `care_response_sent` (categoría) · `overuse_signal` · `deletion_requested` · `deletion_completed`.

## 8. Casos límite

- Falso positivo del detector (p. ej., "me muero de hambre" como expresión coloquial): la respuesta de cuidado es amable y ofrece seguir con [Registrar comida]; se acepta el costo del falso positivo frente al riesgo de no detectar.
- Usuario que pide desactivar el modo sin números: solo con confirmación y sugerencia de hablar con un profesional `[VALIDAR-PROFESIONAL]`.

## 9. Fuera de alcance

Moderación de grupos, verificación documental de edad, atención clínica.

## 10. Aclaraciones pendientes

- `[NEEDS CLARIFICATION: Q4]` Instrumentos de tamizaje (previo a la actividad; relación con la comida y el cuerpo), validados por profesionales.
- **Lista de expresiones de alerta:** redactada el 2026-10-19 a pedido del PO a partir de fuentes oficiales ([[expresiones-de-alerta]], `F82`–`F93`); se usa en la Fase 0 y queda `[VALIDAR-PROFESIONAL]` hasta la firma de un profesional (Q4) antes de la alfa.
- `[NEEDS CLARIFICATION: Q5]` Responsable del tratamiento y texto legal de la política antes de la alfa.
- ~~Recursos de ayuda en Colombia~~ **Resuelta el 2026-10-19:** Línea 106 de salud mental (`F91`) y 123 de emergencias (`F92`), por categoría en [[expresiones-de-alerta]] §4. Reverificar vigencia cada 6 meses y antes de la alfa.
