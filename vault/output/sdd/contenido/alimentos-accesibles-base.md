---
titulo: Catálogo base de alimentos accesibles (Colombia)
tipo: sdd-contenido
hito: H3
estado: borrador
version: 0.2.0
creado: 2026-10-18
actualizado: 2026-10-20
deriva_de: [relacion-comida-entreno, usuario-cabeza-01]
fuentes: [F61]
relacionados: [spec-004-registro-de-nutricion, parametros, reglas-de-negocio]
---

# Catálogo base de alimentos accesibles

> [!warning] `[VALIDAR-PROFESIONAL]` — valores aproximados
> La proteína por porción es **aproximada** y debe contrastarse con la **Tabla de Composición de Alimentos Colombianos del ICBF** (verificar edición y licencia) y ser validada por un nutricionista antes de la alfa (Q4). Sirve para que el registro por porciones con la mano (`F61`) sea fácil y para sugerir comida que el usuario ya come y puede pagar (JTBD-02). El costo relativo es un `[supuesto]` a validar con precios locales.

## 1. Fuentes de proteína (cuentan para la meta)

| Código | Alimento | Porción de referencia | Equivalencia en manos | Proteína aprox. (g) | Costo relativo |
|---|---|---|---|---|---|
| `EGG` | Huevo | 1 unidad grande | 0,25 palma | 6 | $ |
| `EGG_3` | Huevos (perico o cocidos) | 3 unidades | 0,75 palma | 18 | $ |
| `CHICKEN_BREAST` | Pechuga de pollo cocida | 1 palma (~100 g) | 1 palma | 30 | $$ |
| `CHICKEN_THIGH` | Muslo o contramuslo de pollo cocido | 1 palma | 1 palma | 24 | $ |
| `BEEF_LEAN` | Carne de res magra cocida | 1 palma | 1 palma | 26 | $$ |
| `BEEF_GROUND` | Carne molida cocida | 1 palma | 1 palma | 24 | $$ |
| `PORK_LEAN` | Lomo de cerdo cocido | 1 palma | 1 palma | 25 | $$ |
| `LIVER` | Hígado de res cocido | 1 palma | 1 palma | 26 | $ |
| `TILAPIA` | Pescado blanco (tilapia, bagre) cocido | 1 palma | 1 palma | 22 | $$ |
| `TUNA_CAN` | Atún en lata escurrido | 1 lata | 1 palma | 25 | $$ |
| `SARDINES_CAN` | Sardinas en lata | 1 lata | 1 palma | 22 | $ |
| `LENTILS` | Lentejas cocidas | 1 taza | 0,75 palma + 1 mano ahuecada | 18 | $ |
| `BEANS` | Fríjoles cocidos | 1 taza | 0,5 palma + 1 mano ahuecada | 15 | $ |
| `CHICKPEAS` | Garbanzos cocidos | 1 taza | 0,5 palma + 1 mano ahuecada | 15 | $ |
| `MILK` | Leche | 1 vaso (250 ml) | 0,33 palma | 8 | $ |
| `KUMIS` | Kumis o yogur | 1 vaso (200 ml) | 0,25 palma | 6 | $ |
| `GREEK_YOGURT` | Yogur griego natural | 1 taza (170 g) | 0,66 palma | 16 | $$ |
| `QUESO_CAMPESINO` | Queso campesino | 1 tajada (~50 g) | 0,33 palma | 9 | $ |
| `CUAJADA` | Cuajada o quesito | 1 porción (~50 g) | 0,33 palma | 8 | $ |

## 2. Carbohidratos, verduras y grasas (no cuentan para la meta de proteína)

| Código | Alimento | Porción de referencia | Equivalencia | Proteína aprox. (g) |
|---|---|---|---|---|
| `AREPA` | Arepa de maíz | 1 mediana | 1 mano ahuecada | 4 |
| `RICE` | Arroz blanco cocido | 1 taza | 1–2 manos ahuecadas | 4 |
| `POTATO` | Papa cocida | 1 mediana | 1 mano ahuecada | 3 |
| `PLANTAIN` | Plátano (maduro o verde) | 1/2 unidad | 1 mano ahuecada | 1 |
| `YUCA` | Yuca cocida | 1 porción | 1 mano ahuecada | 1 |
| `BREAD` | Pan | 2 tajadas | 1 mano ahuecada | 6 |
| `OATS` | Avena en hojuelas | 1/2 taza en seco | 1 mano ahuecada | 5 |
| `FRUIT` | Fruta (banano, mango, naranja…) | 1 unidad o 1 taza | 1 mano ahuecada | 1 |
| `SALAD` | Ensalada o verduras | 1 puño | 1 puño | 1 |
| `AVOCADO` | Aguacate | 1/4 de unidad | 1 pulgar | 1 |
| `PEANUTS` | Maní | 1 puñado pequeño (~30 g) | 1–2 pulgares | 7 |
| `OIL` | Aceite para cocinar | 1 cucharada | 1 pulgar | 0 |

## 3. Comidas frecuentes predefinidas (plantillas)

| Código | Comida | Nombre corto | Porciones propuestas | Proteína aprox. (g) |
|---|---|---|---|---|
| `CORRIENTAZO` | Almuerzo corrientazo (sopa, arroz, fríjoles o lentejas, una proteína, ensalada, tajada) | Corrientazo | 1 palma + 2–3 manos ahuecadas + 1 puño + 1 pulgar | 30–40 |
| `DESAYUNO_AREPA_HUEVO` | Arepa con huevos y chocolate o café con leche | Arepa con huevo | 0,75 palma + 1–2 manos ahuecadas + 1 pulgar | 20–25 |
| `CALENTADO` | Calentado con huevo | Calentado | 0,5 palma + 2 manos ahuecadas + 1 pulgar | 15–20 |
| `CENA_POLLO_ARROZ` | Pollo con arroz y ensalada | Pollo con arroz | 1 palma + 1–2 manos ahuecadas + 1 puño | 30–35 |

El usuario puede ajustar cada plantilla y guardarla como su comida frecuente (RN-NUT-004).

> [!note] Uso en el bot (T-051, decisión del PO 2026-10-20)
> - El **nombre corto** es el texto del botón y el nombre de la frecuente que se guarda desde la plantilla.
> - Cuando la plantilla da un rango de porciones, el teclado se abre con el **valor bajo**.
> - La proteína que se suma es la de toda comida: **palmas × P-027** (FR-004-04). La columna "Proteína aprox." es una referencia; no se suma.

## 4. Fuera del catálogo

Suplementos de proteína, quemadores y cualquier producto para "acelerar resultados": Gym Bro no los recomienda (RN-SEG-005).
