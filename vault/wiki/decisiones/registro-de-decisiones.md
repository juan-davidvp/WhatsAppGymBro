---
titulo: Registro de decisiones (ADR)
tipo: decision
hito: H3
estado: en-revision
creado: 2026-10-05
actualizado: 2026-10-18
fuentes: [F01, F14, F16, F23, F41, F42, F45, F46, F47, F50, F51, F52, F56, F57, F62, F63, F64, F69, F70, F71, F72, F75, F76, F77]
relacionados: [propuesta-de-valor, reglas-de-negocio, plan-tecnico, seguridad-y-cumplimiento]
---

# Registro de decisiones

> Formato: contexto → decisión → alternativas → consecuencias. Estados: `propuesto` · `aceptado` · `rechazado` · `reemplazado por ADR-###`. Solo el PO pasa una decisión a `aceptado`.

| ID | Título | Estado | Fecha |
|---|---|---|---|
| ADR-001 | Patrón LLM Wiki para la trazabilidad | **aceptado** | 2026-10-05 |
| ADR-002 | Telegram como canal de la Fase 0/01 | **aceptado** (PO, 2026-10-18) | 2026-10-18 |
| ADR-003 | "El LLM conversa; el dominio decide" | reemplazado por ADR-007 | 2026-10-18 |
| ADR-004 | Producto de bienestar, no médico | propuesto | 2026-10-05 |
| ADR-005 | Semanas cumplidas como Estrella del Norte | propuesto | 2026-10-18 |
| ADR-006 | Bot estructurado, sin charla libre ni personaje compañero | **aceptado** (FB-001-11) | 2026-10-18 |
| ADR-007 | IA acotada a percepción; el dominio decide | propuesto | 2026-10-18 |
| ADR-008 | Segmento de la Fase 01: hombres de 18 a 32 que entrenan solos | **aceptado** (FB-001-01, 09, 12) | 2026-10-18 |
| ADR-009 | Gamificación individual sin núcleo social | **aceptado** (FB-001-09) | 2026-10-18 |
| ADR-010 | "Día que cuenta" como unidad diaria de valor | propuesto | 2026-10-18 |
| ADR-011 | Presupuesto de mensajes, retroceso y desvanecimiento | propuesto | 2026-10-18 |
| ADR-012 | Nutrición mínima viable: proteína y porciones; calorías apagadas | propuesto | 2026-10-18 |
| ADR-013 | Más allá del chat dentro de Telegram: imágenes y Mini App | propuesto | 2026-10-18 |
| ADR-014 | Integraciones nube a nube y puente de ingesta; app nativa diferida | propuesto | 2026-10-18 |
| ADR-015 | Stack: Node.js + TypeScript + grammY, dominio puro, MongoDB | propuesto (Q8) | 2026-10-18 |
| ADR-016 | Colombia como mercado cabeza de playa | propuesto (supuesto, Q1) | 2026-10-18 |
| ADR-017 | Un solo repositorio: bóveda + código | propuesto | 2026-10-18 |
| ADR-018 | Modo mantenimiento como objetivo de primera clase | propuesto | 2026-10-18 |

---

## ADR-001 · Patrón LLM Wiki para la trazabilidad
- **Contexto:** el producto se conceptualiza y construye con LLM; el conocimiento de las conversaciones se pierde si no se compila.
- **Decisión:** patrón de Karpathy (`F01`) con `raw/` inmutable, `wiki/` mantenido por el agente, esquema en `CLAUDE.md`, `index.md` y `log.md`; extendido el 2026-10-18 con la capa `output/` para SDD.
- **Consecuencias:** (+) trazabilidad y contexto listo para Claude Code; (−) exige disciplina de log y lint.

## ADR-002 · Telegram como canal de la Fase 0/01
- **Contexto:** el PO corrigió el 2026-10-18: *"por ahora no es una app móvil, es un chatbot en Telegram"*.
- **Decisión:** el producto de la Fase 0/01 es un bot de Telegram, detrás de un adaptador de canal (arquitectura hexagonal).
- **Alternativas:** WhatsApp Business (mayor adopción en Colombia, `F75`, pero desde el 15-ene-2026 prohíbe asistentes de IA de propósito general con criterio discrecional, `F41`); app móvil (más costo antes de validar).
- **Consecuencias:** (+) costo cero por mensaje, botones, fotos, comandos, mensajes iniciados por el bot tras `/start`, Mini Apps (`F69`); (−) adopción de Telegram en Colombia incierta (`F76`, H10); (−) cobrar bienes digitales exige Telegram Stars (`F70`); (−) sin acceso directo a datos de salud del teléfono (ADR-014); (−) los chats quedan en servidores de Telegram (`F71`).

## ADR-003 · "El LLM conversa; el dominio decide"
- **Estado:** reemplazado por ADR-007. El LLM ya no conversa (ADR-006); se conserva el principio de que el dominio decide.

## ADR-004 · Producto de bienestar, no médico
- **Decisión (propuesta):** no diagnostica, no trata y no reemplaza a profesionales; excluye menores; deriva condiciones médicas y señales de riesgo.
- **Consecuencias:** (+) menor carga regulatoria; (−) excluye segmentos con supervisión clínica.

## ADR-005 · Semanas cumplidas como Estrella del Norte
- **Contexto:** la categoría convierte bien y renueva mal (`F14`); las apps con IA retienen peor (`F16`); el bajo *engagement* es la limitación principal de los chatbots de salud (`F23`).
- **Decisión (propuesta):** M00 = semanas cumplidas por usuario activo en las últimas 4 semanas; el **día que cuenta** es la unidad diaria (ADR-010).
- **Alternativas:** usuarios diarios (premia abrir, no cumplir); peso perdido (inseguro).
- **Consecuencias:** (+) alinea valor y retención; (−) exige definir bien el compromiso semanal (RN-GAM-004).

## ADR-006 · Bot estructurado, sin charla libre ni personaje compañero
- **Contexto:** FB-001-11: *"El producto no es un bot de IA. Jamás necesitamos crear un compañero."*
- **Decisión:** la interacción es por **botones, comandos y flujos**; el texto libre solo se usa para registrar comida, pedir algo del dominio o activar respuestas de seguridad. Sin personaje, sin sentimientos simulados; la voz de "mejor amigo" es el tono de los mensajes.
- **Alternativas:** asistente conversacional con LLM; mascota o avatar.
- **Consecuencias:** (+) comportamiento predecible y testeable; (+) seguridad reforzada (sin texto generado sobre salud, `F42`); (+) costo de IA bajo; (−) menos flexibilidad ante preguntas abiertas (se responde con opciones).

## ADR-007 · IA acotada a percepción; el dominio decide
- **Decisión (propuesta):** la IA solo convierte **foto o texto de comida en una propuesta de porciones** con salida validada por esquema. Plan, progresión, metas, rachas, límites y mensajes salen de reglas deterministas con pruebas y de plantillas revisadas.
- **Consecuencias:** (+) auditable; (+) límites no negociables por manipulación del texto; (+) cambiar de proveedor de IA no cambia la lógica; (−) más trabajo de reglas y contenido.

## ADR-008 · Segmento de la Fase 01
- **Decisión:** hombres de 18 a 32 años que entrenan solos y han abandonado antes. Mujeres en una fase futura.
- **Consecuencias:** (+) foco y mensaje claros; (−) mercado inicial más pequeño; el modelo de datos guarda el sexo como dato y no lo asume, para permitir la expansión.

## ADR-009 · Gamificación individual sin núcleo social
- **Decisión:** competencia solo contra uno mismo (semana anterior y mejor semana); sin rankings ni feed en las Fases 0–1.
- **Consecuencias:** (+) encaja con quien entrena solo; (−) se renuncia al efecto de las ligas sociales de Duolingo (`F51`), mitigado con la liga personal.

## ADR-010 · "Día que cuenta" como unidad diaria de valor
- **Decisión (propuesta):** cada día tiene dos mitades (entreno y comida); cuenta con la mitad que corresponde al tipo de día; es completo con ambas; el total acumulado nunca baja.
- **Fundamento:** un día fallado no deshace el hábito (`F45`); premiar el regreso funciona (`F46`); relación comida–entreno (FB-001-04).
- **Consecuencias:** (+) cada día suma; descanso y casa cuentan; (−) requiere definir bien la misión de descanso (RN-DQC-003).

## ADR-011 · Presupuesto de mensajes, retroceso y desvanecimiento
- **Decisión (propuesta):** un único motor de política decide todo mensaje proactivo, con propósito obligatorio, presupuesto, silencio, retroceso, pausa por inactividad, rotación de plantillas y desvanecimiento tras consolidar el hábito.
- **Fundamento:** planes anclados a cuándo y dónde (`F47`); habituación a las plantillas (`F50`); protección del canal (`F51`).
- **Consecuencias:** (+) el valor más fuerte (escribir primero) sin desgastar el canal; (−) menos mensajes de los que "parecerían" convenientes.

## ADR-012 · Nutrición mínima viable
- **Decisión (propuesta):** meta de proteína (1,6 g/kg/día, `F56`, `F57`) en palmas; registro por porciones con la mano, comidas frecuentes y foto opcional; calorías apagadas por defecto.
- **Consecuencias:** (+) baja fricción y menor riesgo de conductas de restricción; (−) menos precisión para quien quiere conteo exacto (fuera del segmento).

## ADR-013 · Más allá del chat dentro de Telegram
- **Decisión (propuesta):** Fase 0: imágenes generadas por el servidor (muro, resumen); Should/Fase 1: Mini App (React) para progreso, bitácora y temporizador con háptica (`F69`).
- **Consecuencias:** (+) visualización del esfuerzo sin app nativa; (+) aprovecha el stack del fundador; (−) un segundo proyecto de frontend en la Fase 1.

## ADR-014 · Integraciones nube a nube y puente de ingesta
- **Contexto:** un bot no accede a Health Connect ni a Apple Health; la API en la nube de Google Fit cerró (`F62`) y la de Fitbit cierra el 30-oct-2026 (`F63`, C).
- **Decisión (propuesta):** exportar (Fase 0), puente de ingesta por *webhook* (Could/Fase 1), Hevy/Strava/Google Calendar (Fase 1); app nativa solo si se valida la necesidad (Fase 2+), Android primero (`F64`).
- **Consecuencias:** (+) integraciones viables sin app; (−) los pasos requieren que el usuario configure una automatización.

## ADR-015 · Stack de la Fase 0
- **Decisión (propuesta):** Node.js + TypeScript; grammY como framework del bot (TypeScript, plugins de conversaciones, menús, sesiones, reintentos y límites de tasa, `F72`); monorepo con un **paquete de dominio puro** sin E/S; MongoDB (afín a las habilidades del fundador) detrás de repositorios; planificador de mensajes con bandeja de salida en la base de datos; Mini App con React + Vite + Tailwind.
- **Alternativas:** Telegraf; PostgreSQL; Python (aiogram).
- **Consecuencias:** (+) un solo lenguaje en todo el sistema; (+) dominio testeable al 100 %; (−) MongoDB exige validar esquemas en la frontera (zod). **Pendiente:** confirmación del PO (Q8).

## ADR-016 · Colombia como mercado cabeza de playa
- **Decisión (propuesta, supuesto):** Colombia para la Fase 01: ley 1581, alimentos colombianos, zona horaria America/Bogota, precios locales.
- **Pendiente:** confirmación del PO (Q1).

## ADR-017 · Un solo repositorio: bóveda + código
- **Decisión (propuesta):** raíz `gym-bro/` con `vault/` (Obsidian) y `app/` (código). Claude Code se abre en la raíz; `vault/CLAUDE.md` se carga al trabajar en la bóveda y las reglas por ruta en `.claude/rules/` (`F77`).
- **Consecuencias:** (+) una fuente de verdad sin copias; (+) Obsidian no indexa el código si se abre solo `vault/`; (−) los cambios de reglas exigen tocar bóveda y código en el mismo commit (es la intención).

## ADR-018 · Modo mantenimiento como objetivo de primera clase
- **Decisión (propuesta):** al cumplir el objetivo, ofrecer mantener o nueva fase; mantenimiento con 2 sesiones/semana, banda ± 2 % y maestría.
- **Fundamento:** fuerza y tamaño se mantienen con dosis mínimas (`F52`); FB-001-10.
- **Consecuencias:** (+) el producto conserva propósito tras el éxito; (−) contenido adicional (temporadas de maestría).
