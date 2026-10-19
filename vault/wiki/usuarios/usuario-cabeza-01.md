---
titulo: Usuario cabeza 01 — proto-persona "Mateo, el que entrena solo"
tipo: usuario
hito: H1
estado: borrador
creado: 2026-10-18
actualizado: 2026-10-18
fuentes: [F31, F45, F60, F64, F65, F66, F67, F75, F76]
relacionados: [propuesta-de-valor, jobs-to-be-done, voz-y-marca, estrategia-anti-novedad, registro-sin-friccion]
---

# Usuario cabeza 01 · "Mateo, el que entrena solo"

> [!warning] Proto-persona
> Construida con las observaciones del PO (FB-001-09, 12, 13, 14) y evidencia secundaria, **no con entrevistas**. Cada rasgo marcado `[validar]` se prueba en H1 con el filtro de la §11. Mientras no haya evidencia primaria, esta ficha es una hipótesis de trabajo, no un hecho.

## 1. Ficha

| Campo | Valor |
|---|---|
| Nombre (ficticio) | Mateo, 24 años |
| Ciudad | Bogotá, Colombia (mercado inicial supuesto, ADR-016) |
| Ocupación | Último semestre de ingeniería y práctica de medio tiempo `[validar]` |
| Vivienda y comida | Vive con su familia; desayuna y cena en casa; entre semana almuerza un corrientazo cerca de la universidad u oficina `[validar]` |
| Gimnasio | Cadena de bajo costo cerca de su casa; va 3–4 veces por semana cuando "está en racha" `[validar]` |
| Teléfono | Android de gama media (Android tiene ~78,5 % de los móviles en Colombia, `F64`); plan de datos limitado; poca señal en algunas zonas del gym `[validar]` |
| Apps de uso diario | WhatsApp (dominante en Colombia, `F75`), Instagram, TikTok, YouTube, Spotify. Telegram: lo tiene para grupos de la universidad o lo instalaría `[validar H10]` |

**Contexto de mercado:** en Colombia hay ≈ 6,66 M de hombres de 18 a 32 años (`F65`, cálculo por prorrateo) y más de 2 M de personas que van al gym (`F66`); la cadena más grande supera las 236 sedes en 63 ciudades (`F67`).

## 2. Historia con el entrenamiento

- Ha empezado **tres veces** en dos años; la vez más larga duró cinco semanas `[validar]`.
- **Patrón de abandono:** semana pesada (parciales, trabajo) → falta 2–3 días → "ya perdí todo" → no vuelve. Es el efecto "todo o nada" que el producto debe romper; un día fallado no deshace la formación del hábito (`F45`).
- **Rutinas:** copia de TikTok o YouTube; cambia cada semana; no sabe cuánto peso usar ni cuándo subir.

## 3. Comportamiento en el gym (rasgo distintivo)

- **Entrena solo**, con audífonos, y evita las horas pico.
- **No pide ayuda** a instructores ni a otros usuarios; le da pena usar máquinas que no conoce.
- Ve que quienes van en parche se motivan entre ellos, pero coordinar horarios no le funciona y **no quiere depender de nadie** (FB-001-09).
- Si no puede ir al gym, **no hace nada**: no sabe qué hacer en casa (FB-001-13).

## 4. Comida

- Come lo que hay: arroz, arepa, huevo, fríjoles, lentejas, pollo, papa, plátano; corrientazo entre semana.
- Sabe que "debe comer proteína", pero no sabe cuánta ni cómo medirla.
- Probó una app de calorías y la dejó en una semana porque buscar cada alimento era eterno (FB-001-08). En el sector, incluso con foto, la mayor parte del registro sigue siendo manual (`F31`).
- Presupuesto ajustado: los suplementos y la comida "fit" le parecen caros (JTBD-02, "accesible").

## 5. Objetivo y motivaciones

- **Declarado:** "ganar masa muscular", "verme más grande y con más energía". **Secundario:** "bajar la barriga".
- **Profundo:** sentirse disciplinado, ganar confianza, desestresarse y demostrarse que sí puede (JTBD-04).

## 6. Dolores, en sus palabras (hipotéticas)

> "Llego al gym y no sé qué hacer."
> "Registrar todo es eterno."
> "No veo cambios y me desanimo."
> "Si fallo dos días, siento que perdí todo."
> "Las apps me llenan de notificaciones o me regañan, y las silencio."

## 7. Qué sería éxito para él

- Llegar a **tres meses** sin dejarlo.
- Subir su sentadilla y su press; que se le note en la ropa.
- Tener una bitácora para mirar atrás y ver que sí pudo.

## 8. Escenario: un martes con Gym Bro

1. **17:00** — recibe "Hoy toca Torso A, 45 min" con botones [Gym] [Casa] [Exprés 15'] [Hoy no puedo]. El bot aprendió que los martes entrena hacia las 18:00.
2. **18:05** — en el gym toca [Gym] y aparece la tarjeta de sesión. Cada serie ya trae repeticiones y peso: la confirma con ✅. En la tercera serie de press sube 2,5 kg porque el bot lo sugiere.
3. **18:50** — "Sesión lista: 14 series, 1 récord. Día que cuenta n.º 23. Racha 🔥 9."
4. **20:15** — toca 🍽️ → "Lo de siempre: cena" y ve la proteína del día: 118/130 g.
5. **Jueves** — tiene parcial: toca [Hoy no puedo] → el bot le ofrece la versión exprés en casa (15 min). La hace y el día cuenta igual.
6. **Domingo 19:00** — recibe la imagen de su muro de constancia y su semana contra la semana anterior.

## 9. Barreras de adopción

| Barrera | Riesgo | Respuesta |
|---|---|---|
| Puede no usar Telegram | R06 | H10 desde el reclutamiento; núcleo independiente del canal |
| Desconfía de dar peso y datos de salud | R10 | Consentimiento claro y granular; datos opcionales |
| Baja tolerancia a las notificaciones | R05 | Presupuesto de mensajes, `/pausa`, retroceso |
| Sensible al precio | — | *Freemium*; valor diario antes de pedir pago |
| Imagen corporal frágil | R01 | Sin fotos corporales; sin comparaciones; vigilancia de dismorfia muscular, más prevalente en grupos de levantamiento de pesas (`F60`) |

## 10. Anti-persona: Gym Bro (Fase 01) no es para…

- **Mujeres** — fase futura (FB-001-12); el modelo de datos no debe impedir la expansión.
- **Menores de 18** — excluidos (RN-SEG-001).
- **Atletas de competencia** o *powerlifters* avanzados — necesitan programación especializada.
- **Quien busca comunidad** o rankings — no es el núcleo (ADR-009).
- **Quien requiere supervisión clínica** — se deriva (RN-SEG-002).
- **Quien quiere conteo calórico preciso como fin** — calorías apagadas por defecto (ADR-012).

## 11. Filtro de reclutamiento para H1 (*screener*)

**Incluir si cumple todo:**
1. Hombre de 18 a 32 años, residente en Colombia.
2. Va al gym o quiere empezar en los próximos 30 días.
3. Ha empezado y abandonado al menos una vez **o** nunca ha seguido un plan más de 4 semanas.
4. Entrena solo la mayoría de las veces (≥ 70 % de sus sesiones).
5. Usa smartphone a diario.

**Excluir si:** es entrenador o profesional de nutrición; compite en un deporte de fuerza; tiene una condición médica que le impide entrenar sin supervisión.

**Cuotas sugeridas (8–12 personas):** ≥ 50 % Android · mezcla de estudiantes y trabajadores · al menos 3 personas que hoy no usan Telegram (para medir la fricción del canal, H10) · al menos 2 que entrenen en casa a veces.

**Preguntas del filtro:**
1. ¿Cuántas veces has empezado a entrenar en serio en los últimos dos años? ¿Cuánto duró la más larga?
2. ¿Con quién entrenas normalmente?
3. ¿Qué apps de mensajería usas cada semana? ¿Tienes Telegram instalado?
4. ¿Has usado alguna app para registrar entreno o comida? ¿Cuánto tiempo la usaste?

## 12. Supuestos a validar

| Rasgo | Supuesto | Hipótesis | Cómo se valida |
|---|---|---|---|
| Causa de abandono | Fricción y constancia pesan más que la falta de información | H01 | Entrevistas: "cuéntame la última vez que lo dejaste" |
| Rasgo social | Prefiere motivación sin componente social | H09 | Entrevistas + pregunta de preferencia |
| Canal | Usa Telegram o lo instala sin fricción | H10 | Prueba de canal durante el reclutamiento |
| Mensajes | Acepta 1–2 mensajes útiles al día | H03 | Concierge |
| Casa | Haría una versión en casa si no puede ir | H06 | Concierge + N-de-1 |
| Comida | Puede registrar por porciones con la mano | H04, H14 | Prueba de usabilidad con 5 personas |

## 13. Usuario cero

El fundador valida la Fase 0 en sí mismo. Debe comparar su perfil con esta ficha (Q2 de [[propuesta-de-valor]]) y declarar en qué se parece y en qué no, para no confundir su experiencia con la del segmento (R11).
