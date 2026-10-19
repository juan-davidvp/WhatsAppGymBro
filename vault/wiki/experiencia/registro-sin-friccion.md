---
titulo: Registro sin fricción — confirmar en vez de escribir
tipo: diseno
hito: H2
estado: en-revision
creado: 2026-10-18
actualizado: 2026-10-18
fuentes: [F18, F19, F31, F61, F69]
relacionados: [relacion-comida-entreno, registro-nutricional-por-imagen, cada-dia-cuenta, flujos-de-usuario, spec-003-registro-de-entrenamiento, spec-004-registro-de-nutricion]
---

# Registro sin fricción

> Responde a FB-001-08: *"Fricción de registro… La más fuerte."* Es la **causa raíz n.º 1** del abandono y por eso el principio de diseño que manda sobre todos los demás en las pantallas de registro.

## 1. Evidencia

- Incluso en la app de calorías por foto más popular, solo ~30 % de las calorías registradas venían de la foto; el resto seguía siendo registro por otros medios (`F31`).
- La foto sola subestimó la energía y la grasa en ~1/3 frente a comidas pesadas (`F18`); con el contexto de ingredientes, el error de un modelo de visión bajó de 30,5 % a 13,9 % (`F19`, C).
- Estimar porciones con la mano fue más preciso que con medidas caseras (tazas, cucharas) para alimentos de forma geométrica: 80 % de las estimaciones con el método de los dedos quedó dentro de ±25 % del peso real (`F61`).

## 2. Principios

1. **Confirmar, no escribir.** Todo lo que el sistema puede predecir aparece precargado; el usuario solo confirma o corrige lo distinto.
2. **Lo de siempre en un toque.** Lo que se repite (desayuno, corrientazo, la sesión de los martes) se registra con un botón.
3. **Precisión suficiente, no perfecta.** El objetivo es la tendencia de varias semanas, no el gramo exacto.
4. **Sin teclado en el gym.** Botones grandes, nada de escribir números con las manos sudadas.
5. **Si se olvidó, que no se pierda.** Gracia hasta las 12:00 del día siguiente y "la hice tal cual" en un toque.

## 3. Entrenamiento en Telegram

### 3.1 Tarjeta de sesión

Un **único mensaje** por sesión que el bot **edita** a medida que avanza (sin llenar el chat de mensajes):

```
🏋️ Torso A · Gym · 45 min
Press de banca — serie 2 de 3
Objetivo: 10 reps · 40 kg
[✅ Hecha] [−1 rep] [+1 rep] [−2,5 kg] [+2,5 kg]
[⏭️ Siguiente ejercicio] [⚠️ Dolor] [🏁 Terminar]
Progreso: ▓▓▓▓░░░░░░ 4/12 series
```

| Acción | Toques | Regla |
|---|---|---|
| Confirmar una serie tal cual | **1** | RN-ENT-001 |
| Corregir repeticiones o peso y confirmar | 2–3 | RN-ENT-001 |
| Registrar la **sesión completa tal como estaba planeada** ("La hice tal cual") | **1** | RN-ENT-001 |
| Marcar dolor | 1 (+ elegir zona) | RN-SEG-006 |
| Terminar y ver lo sumado | 1 | RN-ENT-004 |

- El peso y las repeticiones de la próxima sesión ya vienen con la **progresión aplicada** (RN-ENT-002).
- **Sin temporizador automático** de descanso que mande mensajes (sería ruido). El temporizador con vibración vive en la Mini App (Should) usando la háptica de Telegram (`F69`).
- **Sin señal en el gym:** Telegram envía los toques cuando vuelve la conexión, pero el bot responde tarde. Por eso existe "La hice tal cual" para registrar después en un toque, y la gracia de registro (RN-DQC-005).

### 3.2 Importados
Una actividad importada de ≥ 20 min cuenta para el día sin registrar nada (RN-ENT-006). Ver [[integraciones-y-ecosistema]].

## 4. Comida en Telegram

| Método | Cuándo | Toques / tiempo objetivo | Fase |
|---|---|---|---|
| **Comida frecuente** ("Lo de siempre: desayuno") | Comidas que se repiten | 1 toque · ≤ 5 s | 0 · Must |
| **Repetir ayer** | Rutina estable | 1 toque | 0 · Must |
| **Porciones con la mano** (palma de proteína, puño de verdura, mano ahuecada de carbohidrato, pulgar de grasa) | Cualquier comida | 3–6 toques · ≤ 20 s | 0 · Must |
| **Foto → propuesta de porciones** | Comida nueva o mixta | Foto + 1–2 toques · ≤ 30 s | 0 · Should |
| **Texto libre** ("2 huevos y una arepa") → propuesta | Quien prefiere escribir | 1 mensaje + 1 toque | 0 · Could |
| Código de barras | Productos empacados | — | 1 |
| Voz | Manos ocupadas | — | 1 |

**Porciones con la mano (teclado del bot):**

```
🍽️ Almuerzo
🥩 Proteína (palmas)    [−] 1 [+]
🍚 Carbohidrato (manos) [−] 2 [+]
🥦 Verdura (puños)      [−] 1 [+]
🥑 Grasa (pulgares)     [−] 0 [+]
[💾 Guardar]  [⭐ Guardar como frecuente]
```

- La IA (foto o texto) **solo propone** porciones; nada se registra sin confirmación (RN-NUT-005).
- La foto no se guarda después de la estimación (RN-DAT-004).

## 5. Presupuestos de fricción (criterios verificables)

| Acción | Máximo de toques | Tiempo objetivo (mediana) | Se mide con |
|---|---|---|---|
| Confirmar una serie | 1 | ≤ 2 s | `serie_confirmada.toques` |
| Registrar una sesión ya hecha | 1 | ≤ 5 s | `sesion_registrada_tal_cual` |
| Registrar una comida frecuente | 1 | ≤ 5 s | `comida_registrada.metodo=frecuente` |
| Registrar una comida por porciones | 6 | ≤ 20 s | `comida_registrada.duracion_ms` |
| Registrar una comida por foto | 3 | ≤ 30 s | `comida_registrada.metodo=foto` |
| Onboarding completo | ≈ 20 | ≤ 3 min | `onboarding_completado.duracion_ms` |

Si una mediana supera su presupuesto durante la Fase 0, el diseño de ese flujo se revisa antes de la alfa (compuerta §12.4 de [[propuesta-de-valor]]).

## 6. Patrones de interfaz

- **Teclado persistente** con 3–4 accesos: `🏋️ Hoy` · `🍽️ Comida` · `📈 Progreso`.
- **Editar en lugar de enviar:** la tarjeta de sesión y el registro de comida se actualizan en el mismo mensaje.
- **Deshacer** en cada confirmación durante 10 s (botón "↩️ Deshacer").
- **Valores por defecto inteligentes:** la última porción usada, el último peso registrado.
- **Nada de formularios largos:** una pregunta por mensaje, con botones.
