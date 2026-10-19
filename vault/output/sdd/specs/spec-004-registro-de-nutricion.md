---
titulo: SPEC-004 · Registro de nutrición fácil y accesible
tipo: sdd-spec
id: SPEC-004
hito: H3
estado: borrador
version: 0.1.0
fase: 0
prioridad: P1
depende_de: [SPEC-001]
creado: 2026-10-18
actualizado: 2026-10-18
deriva_de: [relacion-comida-entreno, registro-sin-friccion, registro-nutricional-por-imagen, seguridad-y-cumplimiento]
fuentes: [F56, F61]
relacionados: [spec-005-dia-que-cuenta-y-gamificacion, alimentos-accesibles-base, reglas-de-negocio]
---

# SPEC-004 · Registro de nutrición fácil y accesible

## 1. Propósito

Registrar lo que se come **fácil y con comida accesible** (JTBD-02; FB-001-16) y unir comida y entreno en un solo día (FB-001-04), con la **proteína** como puente y **sin contar calorías** (ADR-012).

## 2. Historias de usuario

### HU-004-1 · Registrar por porciones con la mano (P1)
1. **Dado** `🍽️ Comida` → [Porciones], **cuando** se muestra el teclado, **entonces** tiene contadores para palma (proteína), mano ahuecada (carbohidrato), puño (verdura) y pulgar (grasa), con [Guardar] y [Guardar como frecuente] (RN-NUT-001).
2. **Dado** que ajusta los contadores, **cuando** toca [Guardar], **entonces** la comida se registra en ≤ 6 toques, la proteína del día se actualiza y el mismo mensaje muestra la barra de proteína.

### HU-004-2 · "Lo de siempre" y "repetir ayer" (P1)
1. **Dado** una comida guardada como frecuente, **cuando** toca `🍽️ Comida`, **entonces** ve sus frecuentes como botones y registra una con 1 toque (RN-NUT-004).
2. **Dado** que ayer registró comidas, **cuando** toca [Repetir ayer], **entonces** se proponen las comidas de ayer para confirmar con 1 toque.

### HU-004-3 · Ver mi proteína del día (P1)
1. **Dado** su meta en palmas (RN-NUT-002), **cuando** registra una comida, **entonces** ve `▓▓▓▓▓▓░░░░ 82/130 g (3/4,5 palmas)` y si cumplió la mitad de comida (RN-NUT-003).
2. **Dado** el modo sin números (SPEC-009), **cuando** registra, **entonces** no ve gramos ni palmas numéricas, solo "Comida registrada ✅" y el estado del día.

### HU-004-4 · Foto → propuesta de porciones (P2, Should)
1. **Dado** que envía una foto, **cuando** la IA responde, **entonces** ve una propuesta de porciones editable con [✅ Confirmar] [✏️ Ajustar] y nada se registra sin confirmar (RN-NUT-005).
2. **Dado** incertidumbre alta, **cuando** la IA lo indica, **entonces** se hace **una** pregunta con botones (porción o método de cocción).
3. **Dado** que confirma, **cuando** se guarda, **entonces** la imagen no se conserva (RN-DAT-004).
4. **Dado** que superó P-068 fotos en el día, **cuando** envía otra, **entonces** se le ofrece el teclado de porciones.

### HU-004-5 · Texto libre → propuesta (P3, Could)
1. **Dado** que escribe "2 huevos y una arepa", **cuando** no coincide con una expresión de alerta, **entonces** recibe una propuesta de porciones para confirmar (RN-NUT-005, RN-SEG-007).

### HU-004-6 · Sugerencias según el día (P2)
1. **Dado** un día de entreno, **cuando** abre `🍽️ Comida` antes de su hora habitual, **entonces** ve una sugerencia previa con alimentos del catálogo accesible (RN-NUT-006).
2. **Dado** un día de descanso, **cuando** abre `🏋️ Hoy`, **entonces** ve "Hoy tu misión es la proteína o la recuperación activa" (RN-DQC-003).

## 3. Requisitos funcionales

| ID | Requisito |
|---|---|
| FR-004-01 | El sistema DEBE calcular la meta de proteína según RN-NUT-002 y recalcularla al registrar un nuevo peso. |
| FR-004-02 | El registro por porciones DEBE completarse sin teclado en ≤ 6 toques. |
| FR-004-03 | Las comidas frecuentes DEBEN registrarse con 1 toque y ser editables y borrables. |
| FR-004-04 | La estimación de proteína por porción DEBE salir del parámetro P-027 y del catálogo de alimentos (para alimentos con equivalencia propia, por ejemplo, 1 huevo). |
| FR-004-05 | Las propuestas de IA DEBEN validarse contra un esquema (componentes, porciones, confianza) y descartarse si no cumplen (RN-SEG-010). |
| FR-004-06 | El sistema NO DEBE mostrar ni calcular calorías en la Fase 0 (RN-NUT-007). |
| FR-004-07 | Cada comida DEBE asociarse al día operativo correcto (corte P-029 y gracia P-030). |
| FR-004-08 | El sistema DEBE registrar duración y toques de cada registro para medir la fricción. |

## 4. Reglas aplicables

RN-NUT-001 a RN-NUT-008 · RN-DQC-001 · RN-DQC-003 · RN-DQC-005 · RN-SEG-003 · RN-SEG-007 · RN-SEG-010 · RN-DAT-004.

## 5. Entidades

`Meal`, `PortionCount`, `FavoriteMeal`, `ProteinTarget`, `PortionProposal`, `Food` (catálogo).

## 6. Criterios de éxito

| ID | Criterio |
|---|---|
| SC-004-1 | Mediana ≤ 5 s con comida frecuente y ≤ 20 s por porciones (H04). |
| SC-004-2 | ≥ 70 % de 20 comidas pesadas con proteína dentro de ±25 % de la referencia (H14). |
| SC-004-3 | 0 registros creados por la IA sin confirmación. |

## 7. Eventos

`meal_logged` (método, duración_ms, toques, proteína_g estimada) · `favorite_meal_saved` · `meal_repeated` · `photo_estimate_requested` (latencia_ms, costo_tokens) · `photo_estimate_confirmed` (¿editada?) · `nutrition_half_completed`.

## 8. Casos límite

- Comida registrada después de las 03:00 pero antes de las 12:00: el usuario elige [Hoy] o [Ayer] (gracia).
- Foto que no es comida: "No veo comida en la foto" + teclado de porciones.
- Peso no declarado: la meta usa un valor por defecto de palmas (4 al día) `[VALIDAR-PROFESIONAL]` y pide el peso en `/progreso`.

## 9. Fuera de alcance

Calorías, micronutrientes, código de barras, voz, planes de comida completos, recetas.

## 10. Aclaraciones pendientes

- `[NEEDS CLARIFICATION: Q4]` Validación del catálogo de alimentos y de P-026/P-027.
- `[NEEDS CLARIFICATION]` Proveedor de IA para la foto y su política de retención de imágenes (RN-DAT-004).
