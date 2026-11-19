---
titulo: Guía del protocolo N-de-1
tipo: sdd-plan
hito: H4
estado: borrador
version: 0.1.0
creado: 2026-11-18
actualizado: 2026-11-18
deriva_de: [plan-de-medicion, propuesta-de-valor, spec-000-vision-fase-0]
fuentes: []
relacionados: [plan-de-medicion, spec-000-vision-fase-0, tareas-fase-0, estrategia-de-pruebas]
---

# Guía del protocolo N-de-1

> Cómo correr las 10 semanas de uso propio y qué anotar en cada una. El diseño viene de [[plan-de-medicion]] §5 y de [[propuesta-de-valor]] §12.3. La hoja de registro es `hoja-protocolo-n-de-1.xlsx`, en esta misma carpeta.

## 1. Las tres fases

| Fase | Duración | Condición | Dónde se registra |
|---|---|---|---|
| **A1 · Línea base** | 2 semanas | Tu método actual, sin el bot | Hoja `A1`, una fila por día |
| **B · Intervención** | 6 semanas | Con Gym Bro | Hoja `B`, una fila por semana |
| **A2 · Retiro** | 2 semanas | Sin el bot | Hoja `A2`, una fila por día |

## 2. Antes de empezar

- [ ] Terminar la prueba manual en el gym (T-103), para que usar el bot no se mezcle con la línea base.
- [ ] Elegir el lunes en que empieza A1 y escribirlo en la hoja `Leeme`. Las demás fechas salen solas.
- [ ] Guardar una copia de la hoja fuera del repositorio: va a tener tus datos personales.
- [ ] Apagar el bot durante A1 y no abrirlo hasta que empiece B.

## 3. A1 y A2: registro diario

Cada noche, una fila:

| Columna | Qué anotar |
|---|---|
| Sesión planificada | 1 si ese día tenías sesión. Se marca al empezar la semana y no se cambia después. |
| Sesión completada | 1 si la hiciste. |
| Proteína registrada | 1 si anotaste tu proteína ese día, con el método que uses. |
| Motivación | El domingo, de 1 a 7. |
| Notas | Lo que explique una semana rara: viaje, enfermedad, exámenes. |

## 4. B: registro semanal

Antes del primer día de B, confirmar que el servicio tiene `STUDY_PHASE=n1_B` y `FOUNDER_TELEGRAM_ID` con tu cuenta. Cada domingo, una fila:

| Columna | De dónde sale |
|---|---|
| Sesiones planificadas | `/plan` |
| Sesiones completadas | `sesiones.csv` de `/exportar` |
| Días con proteína registrada | `comidas.csv` de `/exportar` |
| Motivación | Tu valoración de la semana, de 1 a 7 |
| M03 · Tasa de acción | Línea M03 de `/lab` |
| M04 · Toques por serie y segundos por comida | Línea M04 de `/lab` |
| Comodines usados | Veces que llegó el aviso de comodín usado (RA-01) |
| Costo de IA | Vacío mientras la comida con IA siga apagada (T-053 y T-054) |

La línea G06 de `/lab` debe estar en 0 todas las semanas (SC-000-5). Si no lo está, anotarlo en Notas y revisar el motor antes de seguir.

## 5. Al pasar a A2

1. Exportar los datos con `/exportar`.
2. Apagar el servicio del bot, sin borrar la base de datos.
3. Seguir con la hoja `A2` hasta terminar las dos semanas.

## 6. Cómo leer el resultado

La hoja `Resumen` compara las tres fases. Describe una tendencia: con una sola persona no hay inferencia estadística.

| Criterio | Umbral | Medida en la hoja |
|---|---|---|
| SC-000-1 | B ≥ 20 % por encima de A1 | Sesiones completadas por semana |
| SC-000-2 | Mediana de 1 toque por serie y ≤ 20 s por comida | Mediana de las semanas de B |
| Persistencia | Sin umbral definido | Sesiones por semana de A2 frente a A1 |

> [!note] Por qué sesiones por semana
> SC-000-1 habla de sesiones completadas y las fases duran distinto, así que se normaliza por semana. La razón completadas ÷ planificadas también aparece en `Resumen`, pero se satura en 100 % y no serviría si A1 ya está cerca de ese valor. `[supuesto]` Esta lectura queda para revisión del PO.

SC-000-3 (20 comidas pesadas), SC-000-4 (*red-team*) y SC-000-7 (resultados de H1) se miden fuera de esta hoja.

## 7. Al terminar

Guardar la hoja llena y los archivos exportados en `vault/raw/` y escribir la síntesis en `vault/wiki/`, como indica [[plan-de-medicion]] §5.
