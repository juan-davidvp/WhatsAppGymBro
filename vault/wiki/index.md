---
titulo: Índice del wiki — Gym Bro
tipo: indice
hito: H3
estado: vigente
creado: 2026-10-05
actualizado: 2026-10-19
fuentes: []
relacionados: [inicio, log, leeme-output]
---

# Índice

> **Leer primero.** Una línea por página: enlace, resumen y estado. Se actualiza en cada *ingest*, creación o archivo de página (`vault/CLAUDE.md` §6). El producto de la Fase 0 es un **bot de Telegram estructurado**, sin personaje, para hombres de 18 a 32 años que entrenan solos (ADR-002, ADR-006, ADR-008).

## Navegación
- [[inicio]] — Portada de la bóveda: qué es Gym Bro, por dónde empezar y estado de los hitos. `[vigente]`
- [[log]] — Bitácora cronológica de hitos, *ingests*, decisiones, derivaciones y *lints*. `[solo se añade]`
- [[leeme-output]] — Contenido del paquete SDD y cómo usarlo con Claude Code. `[en revisión]`
- [[mapa-de-trazabilidad.canvas]] — Lienzo de la cadena raw → wiki → output → código. `[generado]`

## Fuentes crudas
- [[leeme-raw]] — Convenciones de la capa inmutable. `[vigente]`
- [[FB-001_2026-10-18_observaciones-po]] — 22 observaciones del PO sobre la propuesta v0.1, más la corrección de canal (bot de Telegram). `[inmutable]`

## Producto
- [[propuesta-de-valor]] — v0.2: problema con la fricción de registro como causa n.º 1, segmento y tamaño en Colombia, JTBD, pilares P1–P6, módulos, MoSCoW, piloto N-de-1, modelo de negocio con Telegram Stars, métricas, lemas, hipótesis H01–H14, riesgos R01–R14 y preguntas Q1–Q9. `[en revisión]`
- [[objetivos-y-progreso]] — Catálogo de objetivos, tres capas de medición, fórmulas (media móvil, e1RM, % de progreso), estancamientos, modo mantenimiento y bitácora de logros. `[en revisión]`
- [[estrategia-anti-novedad]] — Diez palancas contra el efecto novedad, curva de 90 días, pre-mortem, alertas S1–S4 e índice de sostenimiento. `[en revisión]`

## Usuarios
- [[usuario-cabeza-01]] — Proto-persona "Mateo, 24, Bogotá", que entrena solo; filtro de reclutamiento, anti-persona y supuestos ligados a hipótesis. `[borrador · validar en H1]`
- [[jobs-to-be-done]] — Trabajo principal, JTBD-01 a JTBD-07, mapa del trabajo y resultados deseados RD-01 a RD-13 con puntaje de oportunidad. `[borrador]`

## Experiencia
- [[cada-dia-cuenta]] — Día que cuenta (entreno + comida), día completo, misión de descanso y visualizaciones V1–V10. `[en revisión]`
- [[sistema-de-gamificacion]] — Racha con comodines y reparación, XP, diez niveles de identidad, misiones, liga personal, temporadas, Reto 66 y reglas éticas. `[en revisión]`
- [[registro-sin-friccion]] — Confirmar en vez de escribir: patrones de Telegram y presupuestos de toques y segundos para series y comidas. `[en revisión]`
- [[proactividad-sin-spam]] — Motor de política de mensajes: propósitos, presupuesto, horas de silencio, retroceso, pausa, desvanecimiento y rotación. `[en revisión]`
- [[relacion-comida-entreno]] — Un día, dos mitades: porciones con la mano, meta de proteína y calorías apagadas por defecto. `[en revisión]`
- [[constancia-en-cualquier-lugar]] — Versiones A (gym), B (casa) y C (exprés de 15 min) que cuentan igual. `[en revisión]`
- [[flujos-de-usuario]] — Arquitectura de comandos y menús, manejo del texto libre, flujos F1–F8 e inventario de mensajes clave. `[borrador]`
- [[voz-y-marca]] — Voz de "mejor amigo" sin personaje, lemas candidatos, tono por momento y lista de expresiones prohibidas. `[en revisión]`

## Conceptos (evidencia)
- [[fundamentos-de-entrenamiento]] — Hallazgos sobre frecuencia, volumen, progresión, cargas para novatos y proteína, y su traducción a reglas. `[borrador]`
- [[gamificacion-y-habitos]] — Formación de hábitos, intervenciones digitales para la actividad física, lecciones de Duolingo y Finch como contra-referente. `[en revisión]`
- [[registro-nutricional-por-imagen]] — Estado del arte de la estimación por foto, fuentes de error, bucle estimación + confirmación y umbral de H14. `[en revisión]`
- [[integraciones-y-ecosistema]] — Qué se puede integrar desde un bot (Mini App, exportación, puente de ingesta, servicios en la nube) y qué no (Health Connect y HealthKit viven en el teléfono). `[en revisión]`
- [[seguridad-y-cumplimiento]] — Caso Tessa, riesgos clínicos del segmento, detección de señales, Ley 1581, privacidad de Telegram y lista previa a la alfa. `[en revisión]`

## Mercado y competencia
- [[panorama-de-mercado]] — Tamaño global, señales de demanda, monetización y retención en Salud y Fitness, y dimensionamiento en Colombia (con el alcance de Telegram como incógnita, H10). `[en revisión]`
- [[benchmark-competitivo]] — Conjunto competitivo, fichas, matriz de capacidades, mapa de posicionamiento y oportunidades en constancia, registro y proactividad. `[en revisión · vigencia 3 meses]`

## Decisiones y fuentes
- [[registro-de-decisiones]] — ADR-001 a ADR-018: aceptados 001, 002, 006, 008 y 009; 003 reemplazado por 007; el resto, propuestos. `[en revisión]`
- [[registro-de-fuentes]] — F01–F81 con confianza, fecha y URL, más la lista de fuentes pendientes de contraste. `[borrador · crece en cada ingest]`

## Output · paquete SDD (lo que se construye)
- [[constitucion]] — Principios I–XI, restricciones, flujo de trabajo, definición de terminado y gobernanza. `[en revisión v1.0.0]`
- [[glosario]] — Lenguaje ubicuo y nombres en código. `[en revisión]`
- [[reglas-de-negocio]] — Fuente única de las 103 reglas `RN` (14 por validar con un profesional). `[en revisión]`
- [[parametros]] — Los 79 valores `P-001…P-079` que el código replica en `parameters.ts`. `[en revisión]`
- [[spec-000-vision-fase-0]] — Mapa de specs, orden de implementación, MoSCoW, requisitos no funcionales y criterios globales. `[borrador]`
- Specs por módulo: [[spec-001-onboarding-y-objetivo]] · [[spec-002-plan-y-sesion-del-dia]] · [[spec-003-registro-de-entrenamiento]] · [[spec-004-registro-de-nutricion]] · [[spec-005-dia-que-cuenta-y-gamificacion]] · [[spec-006-progreso-logros-y-mantenimiento]] · [[spec-007-proactividad-y-mensajes]] · [[spec-008-integraciones]] · [[spec-009-seguridad-y-privacidad]]. `[borrador]`
- Plan: [[plan-tecnico]] · [[modelo-de-datos]] · [[plan-de-medicion]] · [[estrategia-de-pruebas]]. `[borrador]`
- Contenido: [[plantillas-de-mensajes]] · [[catalogo-de-logros-y-niveles]] · [[catalogo-de-ejercicios-base]] · [[alimentos-accesibles-base]] · [[expresiones-de-alerta]]. `[borrador]`
- [[tareas-fase-0]] — Tareas por hito (M0–M10) con dependencias, paralelismo y criterio de terminado. `[borrador]`

## Archivo
- [[propuesta-de-valor-v0-1]] — Versión 0.1 (compañero de entrenamiento con IA y personalidad propia, 18 a 35 años), reemplazada por la v0.2 tras FB-001. `[obsoleto]`

## Páginas pendientes (enlaces a crear)
- [[guia-de-entrevistas]] — H1: guion para entrevistar a usuarios como el usuario cabeza 01 y contrastar H01–H14.
- [[customer-journey]] — H1: recorrido de 90 días con momentos de abandono, después de las entrevistas.
