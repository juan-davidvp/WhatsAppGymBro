---
titulo: Relación comida–entreno — un solo día, dos mitades
tipo: diseno
hito: H2
estado: en-revision
creado: 2026-10-18
actualizado: 2026-10-18
fuentes: [F56, F57, F59, F61]
relacionados: [cada-dia-cuenta, registro-sin-friccion, registro-nutricional-por-imagen, objetivos-y-progreso, seguridad-y-cumplimiento, spec-004-registro-de-nutricion, alimentos-accesibles-base]
---

# Relación comida–entreno

> Responde a FB-001-04 (*"cómo hacer que la comida y el ejercicio sean una relación"*) y a JTBD-02 (*"fácil y accesible"*). Reglas: RN-NUT en [[reglas-de-negocio]].

## 1. La idea

> **Comes para entrenar y entrenas para lo que comes.** El día no tiene dos registros separados: tiene **dos mitades** del mismo día que cuenta.

En la mayoría de herramientas, la comida y el entreno viven en apps distintas y nunca se encuentran. En Gym Bro, el **tipo de día** (entreno o descanso) cambia lo que la comida significa, y la **proteína** es el puente entre lo que se come y el músculo que se construye.

## 2. Mecanismos

| # | Mecanismo | Cómo se ve |
|---|---|---|
| M1 | **Día con dos mitades** | El día cuenta con la mitad que corresponde y es completo con ambas ([[cada-dia-cuenta]]) |
| M2 | **La comida depende del tipo de día** | En día de entreno: sugerencia antes y después con alimentos de casa. En día de descanso: "Hoy tu misión es la proteína: el músculo crece mientras descansas" |
| M3 | **La proteína como puente** | Meta diaria en palmas ligada al objetivo y al peso |
| M4 | **El descanso se gana en la cocina** | En días de descanso, cumplir la proteína hace que el día cuente |
| M5 | **Tu relación en datos** | Desde la semana 4: "Las semanas en que cumpliste tu proteína 5+ días completaste el 90 % de tus sesiones" (observación, no causa) |
| M6 | **Comida accesible** | Sugerencias con alimentos baratos y comunes en Colombia ([[alimentos-accesibles-base]]) |

## 3. Evidencia

| Hallazgo | Fuente |
|---|---|
| Para construir y mantener músculo, la ingesta recomendada en personas que entrenan es de 1,4 a 2,0 g de proteína por kg al día; por comida, unos 20–40 g, repartidos cada 3–4 horas | `F56` |
| El efecto anabólico del ejercicio dura al menos 24 horas, y la ventana óptima de consumo varía entre personas | `F56` |
| En 49 ensayos (1.863 participantes), por encima de ~1,62 g/kg/día no hubo ganancias adicionales de masa libre de grasa | `F57` |
| Para ganar músculo en "volumen", una revisión sugiere 1,6–2,2 g/kg/día, repartidos en 3–6 comidas | `F59` |
| Estimar porciones con la mano fue más preciso que con tazas y cucharas en alimentos de forma geométrica | `F61` |

**Implicaciones de diseño:**
1. La métrica principal es la **proteína total del día**, no el horario exacto. El mensaje es simple: "reparte tu proteína en 3–4 comidas".
2. Meta por defecto **1,6 g/kg/día** (punto donde la evidencia deja de mostrar beneficio adicional, `F57`), configurable entre 1,4 y 2,2 `[VALIDAR-PROFESIONAL]`.
3. **Sin obsesión por la "ventana anabólica":** el efecto del entreno dura al menos un día (`F56`).

## 4. Meta de proteína en palmas

| Paso | Cálculo (valores por defecto) |
|---|---|
| Meta en gramos | peso (kg) × 1,6 |
| Gramos por palma | 25 g `[VALIDAR-PROFESIONAL, rango 20–30]` |
| Meta en palmas | meta ÷ 25, redondeada al medio más cercano |

> Ejemplo: Mateo, 68 kg → 109 g → **4,5 palmas al día**. "Un huevo" o "un vaso de leche" se registran como fracciones de palma según el catálogo.

## 5. Sugerencias según el día (borrador de contenido)

| Momento | Sugerencia tipo | Estado |
|---|---|---|
| Antes de entrenar (1–3 h) | "Algo con carbohidrato y algo de proteína: arepa con huevo, pan con queso" | `[VALIDAR-PROFESIONAL]` |
| Después de entrenar | "Tu siguiente comida con 1–2 palmas de proteína: pollo, huevos, lentejas o atún" | `[VALIDAR-PROFESIONAL]` |
| Día de descanso | "Hoy tu misión es la proteína" + lista de opciones accesibles | `[VALIDAR-PROFESIONAL]` |
| Le faltan 20 g a las 20:00 | "Un vaso de leche o dos huevos y cierras el día completo" | `[VALIDAR-PROFESIONAL]` |

## 6. Lo que no hace

- **No cuenta calorías por defecto** (ADR-012). El modo detallado llega en la Fase 1 y nunca se activa para usuarios con señales de riesgo.
- **No recomienda suplementos** (RN-SEG-005): la proteína se cubre con comida accesible.
- **No juzga** lo que se come: no hay comidas "malas" ni colores rojos.
- En **modo sin números**, la mitad de comida se cumple registrando 3 comidas con al menos una porción de proteína, sin mostrar gramos (RN-SEG-003).

## 7. Medición

| Métrica | Hipótesis |
|---|---|
| M05 · % de días con la mitad de comida cumplida | — |
| Proteína estimada vs. referencia en 20 comidas pesadas | H14 |
| Asociación entre semanas con proteína cumplida y semanas cumplidas | H07 |
