---
titulo: Registro nutricional por imagen — límites y papel en Gym Bro
tipo: concepto
hito: H0
estado: en-revision
creado: 2026-10-05
actualizado: 2026-10-18
fuentes: [F08, F09, F18, F19, F20, F30, F31, F61]
relacionados: [registro-sin-friccion, relacion-comida-entreno, seguridad-y-cumplimiento, spec-004-registro-de-nutricion]
---

# Registro nutricional por imagen

> **Cambio en v0.2:** la foto deja de ser el método principal. El método por defecto son las **porciones con la mano** y las **comidas frecuentes** ([[registro-sin-friccion]]); la foto es una vía *Should* que **propone porciones** para que el usuario confirme, y su meta es la **proteína**, no las calorías (ADR-012).

## 1. Estado del arte

| Hallazgo | Detalle | Fuente |
|---|---|---|
| Identificar ≠ cuantificar | En siete apps con reconocimiento de imágenes, la identificación de alimentos llegó a 97 % y 92 % en las mejores, pero la estimación automática de energía fue inexacta | `F20` |
| Subestimación sistemática | Con 102 comidas pesadas, cuatro apps subestimaron calorías y grasa en ~1/3 (250–345 kcal y ~30 g de grasa por comida); la grasa fue lo más subestimado | `F18` |
| El contexto ayuda | Indicar los ingredientes bajó el error de energía de un modelo de visión de 30,5 % a 13,9 % | `F19` (C — verificar el artículo original) |
| La foto no es todo el registro | En Cal AI, solo ~30 % de las calorías registradas vienen de la foto | `F31` |
| Las manos sirven | El método de la mano fue más preciso que tazas y cucharas en alimentos de forma geométrica (80 % dentro de ±25 %) | `F61` |
| Referente regional | Fitia combina foto, voz, texto y código de barras con platos latinoamericanos | `F08`, `F09` |

## 2. Papel de la foto en Gym Bro

```
Foto enviada al bot
  → la IA identifica componentes y propone porciones (palmas, puños, manos, pulgares)
  → ¿incertidumbre alta? → 1 pregunta de aclaración con botones (porción o método de cocción)
  → el usuario confirma o ajusta con el teclado de porciones
  → se registra la propuesta confirmada; la imagen no se conserva (RN-DAT-004)
```

- La IA **nunca** registra sin confirmación (RN-NUT-005) ni da consejos nutricionales (RN-SEG-010).
- La respuesta de la IA es una **estructura validada por esquema** (componentes y porciones), no texto libre.

## 3. Fuentes de error y su manejo

| Fuente de error | Manejo |
|---|---|
| Tamaño de la porción | Se expresa en manos, que el usuario ajusta con un toque |
| Ingredientes ocultos (aceite, salsas) | Pregunta de aclaración solo si cambia la grasa de forma importante |
| Platos mixtos colombianos (bandeja, arroces, sopas) | Catálogo base con equivalencias en porciones ([[alimentos-accesibles-base]]) `[inferencia: riesgo de error mayor que en los estudios de EE. UU., validar]` |
| Olvidos | Comidas frecuentes y gracia de registro hasta las 12:00 del día siguiente |

## 4. Umbral de validación (H14)

**≥ 70 % de las comidas con proteína estimada dentro de ±25 % del valor de referencia**, en 20 comidas pesadas (al menos 8 mixtas o fritas). Fundamento: el método de la mano dejó 80 % de las estimaciones dentro de ±25 % en alimentos geométricos (`F61`); para platos mixtos se espera menos, por eso el umbral es 70 %.

## 5. Opciones técnicas (para decidir en el plan técnico)

- Modelo multimodal por API con salida JSON validada por esquema (candidato: Claude) vs. servicio especializado de reconocimiento de alimentos.
- Tabla de referencia para el catálogo: Tabla de Composición de Alimentos Colombianos del ICBF `[verificar edición y licencia]`.
- Costo por foto medido desde la Fase 0 (H13).
