---
paths:
  - "app/apps/server/src/bot/**/*"
  - "app/apps/server/src/usecases/**/*"
  - "app/packages/content/**/*"
---

# Bot de Telegram y contenido (constitución II, IV y V)

- **Estructurado:** teclados en línea, comandos y botón de menú. Ninguna respuesta al usuario se genera con IA. El texto libre solo entra por rutas definidas (comida en texto, "hoy no puedo", ajustes) y **siempre pasa antes por el detector de expresiones de alerta** (RN-SEG-007); si coincide, responde la plantilla de cuidado `CU-…` y no sigue otra ruta.
- **Mensajes fuera de dominio:** responder con `CU-07` (botones a Hoy, Comida y Progreso); nunca improvisar una conversación.
- **Textos solo desde el paquete `content`**, por ID (`PL-01`, `SE-02`…), transcritos de `vault/output/sdd/contenido/plantillas-de-mensajes.md`. Ninguna cadena para el usuario dentro de manejadores o casos de uso. Tuteo, 1–3 líneas, sin expresiones prohibidas (RN-MSJ-011); los proactivos llevan al menos un botón (RN-MSJ-012).
- **Presupuesto de toques:** confirmar una serie = 1 toque; registrar una comida frecuente = 1 toque (constitución II). Cada flujo nuevo declara su presupuesto en una prueba.
- **Idempotencia:** cada *update* se procesa una vez (`processed_updates`); cada botón lleva una clave estable; repetir un toque no duplica una serie, una comida ni un día que cuenta (SC-003-2).
- **Datos de los botones:** cortos y versionados (`v1:set:<id>`); confirmar el límite de tamaño de `callback_data` en la documentación de la Bot API antes de fijar el formato.
- **Cuidado y salud:** las respuestas `CU-…` son predefinidas; `{recurso_local}` se rellena solo con recursos verificados por el PO. Nunca recomendar suplementos, sustancias ni dietas (RN-SEG-005).
- **Privacidad:** el texto que escribe el usuario no va a registros ni eventos (RN-DAT-005); las fotos de comida se procesan en memoria y no se guardan (RN-DAT-004).
- **Adaptadores delgados:** el manejador traduce el *update* a un caso de uso y el resultado a una plantilla; la lógica de negocio vive en `packages/domain`.
