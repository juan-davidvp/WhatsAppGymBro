---
titulo: Tareas de la Fase 0
tipo: sdd-tareas
hito: H4
estado: borrador
version: 0.1.0
creado: 2026-10-18
actualizado: 2026-10-18
deriva_de: [spec-000-vision-fase-0, plan-tecnico, estrategia-de-pruebas]
fuentes: []
relacionados: [plan-tecnico, modelo-de-datos, plan-de-medicion, reglas-de-negocio]
---

# Tareas de la Fase 0

> Desglose ejecutable para Claude Code. `[P]` = puede hacerse en paralelo con otras `[P]` del mismo hito. Cada tarea termina cuando cumple su criterio **y** la Definición de terminado de la [[constitucion]] (pruebas de las RN en verde, eventos emitidos, spec actualizada). Prioridad: Must salvo que se indique *Should* o *Could*.
>
> **Al terminar una tarea**, añadir ✅ después de su ID (`| T-014 [P] ✅ |`). Desde ese momento, `lint_trazabilidad.py --codigo` exige una prueba para cada RN citada en la fila. Skill: `/implementar-spec T-###`.

## M0 · Preparación

| ID | Tarea | Referencias | Depende | Terminado cuando… |
|---|---|---|---|---|
| T-001 ✅ | Crear `app/` como monorepo (pnpm *workspaces*, TypeScript estricto, ESLint, Prettier, Vitest) | [[plan-tecnico]] §3 | — | `pnpm test` y `pnpm typecheck` corren en verde con un paquete vacío |
| T-002 [P] ✅ | `packages/domain` con `config/parameters.ts` que replica [[parametros]] | P-001 a P-070 | T-001 | Una prueba verifica que cada `P-###` de la tabla existe en el archivo con el mismo valor |
| T-003 [P] ✅ | `packages/content` con esquemas zod para plantillas, logros, niveles, ejercicios, alimentos y expresiones de alerta; transcribir los catálogos de `vault/output/sdd/contenido/` | RN-MSJ-010/011/012, RN-PLAN-010, RN-NUT-008 | T-001 | Pruebas de contenido de [[estrategia-de-pruebas]] §4 en verde |
| T-004 [P] ✅ | `apps/server`: grammY con *long polling*, configuración por variables de entorno, registros con redacción | NFR-07, RN-DAT-006 | T-001 | El bot responde `/start` en local |
| T-005 [P] ✅ | `infra/docker-compose.yml` (Mongo) y `.env.example` | [[plan-tecnico]] §10 | T-001 | `docker compose up` levanta la base |
| T-006 ✅ | Integración continua: tipos, estilo, pruebas y `herramientas/lint_trazabilidad.py` | Constitución | T-001 | El *pipeline* falla si una RN no tiene prueba |

## M1 · Dominio (pruebas primero)

| ID | Tarea | Referencias | Depende | Terminado cuando… |
|---|---|---|---|---|
| T-010 [P] ✅ | `goals/`: meta propuesta, límites, media móvil, progreso, cumplimiento, cierres | RN-OBJ-001 a 013, RN-MAN-001 a 005 | T-002 | Cada RN con pruebas nombradas por su ID |
| T-011 [P] | `plan/`: generador A/B/C, divisiones, volumen, duración, descanso, sin deuda | RN-PLAN-001 a 010 | T-002, T-003 | Pruebas por RN + propiedad "ningún plan viola el descanso" |
| T-012 [P] ✅ | `training/`: completitud, progresión doble, estancamiento, e1RM y récords | RN-ENT-001 a 006 | T-002 | Pruebas por RN |
| T-013 [P] | `nutrition/`: meta en palmas, mitad de comida, modo sin números | RN-NUT-001 a 008 | T-002, T-003 | Pruebas por RN |
| T-014 [P] ✅ | `day/`: día operativo, cuenta, completo, gracia, total | RN-DQC-001 a 007 | T-002 | Pruebas por RN + propiedad "el total nunca baja" |
| T-015 [P] ✅ | `gamification/`: racha, comodines, reparación, semana, XP, niveles, misiones, Reto 66, regreso | RN-GAM-001 a 014 | T-014 | Pruebas por RN + propiedades de XP |
| T-016 [P] | `messaging/`: motor de política puro + simulación de 60 días | RN-MSJ-001 a 017 | T-002 | SC-007-1 (0 violaciones) |
| T-017 [P] | `safety/`: detector de expresiones de alerta, límites duros, sobreuso | RN-SEG-001 a 010 | T-003 | Pruebas por RN + primeros 50 casos de *red-team* |

## M2 · Servidor base

| ID | Tarea | Referencias | Depende | Terminado cuando… |
|---|---|---|---|---|
| T-020 | Repositorios MongoDB, índices e idempotencia (`processed_updates`, claves por serie y comida) | [[modelo-de-datos]] | T-005, M1 | Pruebas con base en memoria; SC-003-2 |
| T-021 | Middleware: deduplicación → usuario → detector de riesgo → enrutador | [[plan-tecnico]] §5, RN-SEG-007 | T-020 | Un texto de alerta nunca llega a otra ruta (prueba) |
| T-022 [P] | Emisor de eventos sin texto libre | [[plan-de-medicion]], RN-DAT-005 | T-020 | Revisión automática de esquemas de eventos (SC-009-3) |

## M3 · Seguridad y onboarding (SPEC-009, SPEC-001)

| ID | Tarea | Referencias | Depende | Terminado cuando… |
|---|---|---|---|---|
| T-030 | Consentimiento y aviso de privacidad | HU-009-1, RN-DAT-001/002 | T-021 | Escenarios de HU-009-1 pasan |
| T-031 | Edad, tamizajes y modo sin números | HU-009-2/3, RN-SEG-001 a 003 | T-030 | Escenarios pasan; sin respuestas de tamizaje guardadas |
| T-032 | Onboarding completo con reanudación | HU-001-1 a 5 | T-031, T-010, T-011 | SC-001-1 medido en local |
| T-033 | Respuestas de cuidado y suite de *red-team* | HU-009-4/7 | T-017, T-021 | 0 fallos críticos en ≥ 50 casos |
| T-034 | `/borrar_datos` con borrado total | HU-009-6, RN-DAT-003 | T-020 | SC-009-2 |
| T-035 | *Could:* cambiar de objetivo conservando el historial | HU-001-6, RN-OBJ-007 | T-032 | Escenarios pasan; el objetivo anterior queda `cambiado` |

## M4 · Plan y entrenamiento (SPEC-002, SPEC-003)

| ID | Tarea | Referencias | Depende | Terminado cuando… |
|---|---|---|---|---|
| T-040 | Plan semanal y `/plan` | HU-002-1 | T-032 | Escenarios pasan |
| T-041 | `🏋️ Hoy`, elección de versión y "Hoy no puedo" sin deuda | HU-002-2/3 | T-040 | Escenarios pasan |
| T-042 | Tarjeta de sesión editable, 1 toque por serie, deshacer, idempotencia | HU-003-1, FR-003-01 a 04 | T-041 | SC-003-1 y SC-003-2 |
| T-043 | "La hice tal cual" y terminar sesión | HU-003-2/3 | T-042 | Escenarios pasan |
| T-044 | *Should:* récords, progresión, estancamiento y dolor | HU-003-4 a 6 | T-043 | Escenarios pasan |
| T-045 | *Should:* ajustar días disponibles y regenerar el plan sin perder el progreso | HU-002-4, RN-PLAN-001/004 | T-040 | Escenarios pasan |

## M5 · Nutrición (SPEC-004)

| ID | Tarea | Referencias | Depende | Terminado cuando… |
|---|---|---|---|---|
| T-050 | Teclado de porciones y barra de proteína | HU-004-1/3 | T-032 | SC-004-1 (porciones) |
| T-051 | Comidas frecuentes, plantillas predefinidas y "repetir ayer" | HU-004-2 | T-050 | SC-004-1 (frecuente) |
| T-052 [P] | Sugerencias según el tipo de día | HU-004-6 | T-050 | Escenarios pasan |
| T-053 | *Should:* foto → propuesta de porciones (adaptador de IA, esquema, límite diario, costo) | HU-004-4 | T-050 | SC-004-3; costo registrado |
| T-054 | *Could:* texto → propuesta de porciones | HU-004-5 | T-053 | Escenarios pasan |

## M6 · Día que cuenta y juego (SPEC-005)

| ID | Tarea | Referencias | Depende | Terminado cuando… |
|---|---|---|---|---|
| T-060 | Cierre de día programado e idempotente; mensajes de día que cuenta y línea de la semana | HU-005-1 | T-043, T-050 | Escenarios pasan |
| T-061 | Racha, comodines, reparación y bonificación de regreso | HU-005-2/4 | T-060 | Escenarios pasan |
| T-062 | XP, niveles y semana cumplida | HU-005-3/5 | T-060 | Escenarios pasan |
| T-063 | *Should:* misiones semanales, Reto 66 y logros | HU-005-6/7 | T-062 | Escenarios pasan |
| T-064 | *Could:* liga personal y temporadas | HU-005-8 | T-063 | Escenarios pasan |
| T-065 | *Should:* señal de sobreuso y respuesta de cuidado `CU-06` | HU-009-5, RN-SEG-008 | T-017, T-060 | Escenarios pasan; evento `overuse_signal` emitido |

## M7 · Mensajes proactivos (SPEC-007)

| ID | Tarea | Referencias | Depende | Terminado cuando… |
|---|---|---|---|---|
| T-070 | Bandeja de salida, planificador cada minuto, envío con reintentos y supresión de salidas viejas; el motor aplica presupuesto, silencio y separación | HU-007-2, FR-007-02/03/08 | T-016, T-020 | Prueba de integración del ciclo; G06 = 0 |
| T-071 | Candidatos: `plan_listo`, `cierre_del_dia`, `regreso`, `resumen_semanal`, `reconocimiento`, `mantenimiento` | HU-007-1/5 | T-070, T-041 | Escenarios pasan |
| T-072 | Hora habitual aprendida, retroceso, inactividad, desvanecimiento, rotación | HU-007-1/3/6 | T-071 | SC-007-1 con datos reales simulados |
| T-073 | `/pausa`, ajustes de mensajes y detección de bloqueo | HU-007-4/7 | T-071 | Escenarios pasan |

## M8 · Progreso (SPEC-006)

| ID | Tarea | Referencias | Depende | Terminado cuando… |
|---|---|---|---|---|
| T-080 | Imagen del muro (SVG → PNG) y resumen semanal | HU-006-1 | T-062, T-071 | Imagen generada y enviada en local |
| T-081 | `/progreso`, registro de peso y `/logros` | HU-006-2/3 | T-062 | Escenarios pasan |
| T-082 | *Should:* objetivo cumplido, revisión de fase y mantenimiento | HU-006-4 a 6 | T-081 | Escenarios pasan |
| T-083 | *Should:* Mini App de progreso con validación de datos de inicio | HU-006-7 | T-081 | Abre desde el botón de menú y rechaza datos no válidos |
| T-084 | *Could:* vista "tu relación comida–entreno" | HU-006-8 | T-081, T-052 | Escenarios pasan |

## M9 · Integraciones (SPEC-008)

| ID | Tarea | Referencias | Depende | Terminado cuando… |
|---|---|---|---|---|
| T-090 | `/exportar` (CSV + JSON) | HU-008-1 | T-020 | SC-008-1 |
| T-091 | *Could:* puente de ingesta con token, validación y límite de tasa + guía | HU-008-2 | T-060 | Escenarios pasan |

## M10 · Despliegue y validación

| ID | Tarea | Referencias | Depende | Terminado cuando… |
|---|---|---|---|---|
| T-100 | Despliegue en un servidor siempre encendido + MongoDB Atlas + *webhook* con secreto | [[plan-tecnico]] §10 | M3–M7 | El bot funciona 72 h sin intervención |
| T-101 [P] | Hoja de línea base A1 y guía del protocolo N-de-1 | [[plan-de-medicion]] §5 | — | Hoja lista antes de iniciar A1 |
| T-102 | *Could:* comando `/lab` para el fundador | [[plan-de-medicion]] §6 | T-022 | Muestra M01, M03, M04 y G06 |
| T-103 | Prueba de aceptación manual en el gym | [[estrategia-de-pruebas]] §6 | T-043, T-051 | Presupuestos de toques y segundos cumplidos |
| T-104 | Lint final y actualización de la bóveda (estado de las specs, `wiki/log.md`) | Constitución | Todas | `lint_trazabilidad.py --codigo` sin errores |

## Fuera de la Fase 0

- HU-008-3 (fuentes nube a nube: Strava, Hevy, calendario) pasa a la Fase 1 según [[spec-008-integraciones]] y [[integraciones-y-ecosistema]].
- Pagos con Telegram Stars, analítica con seudonimización y alfa con otros usuarios: requieren cerrar Q4 y Q5 (ver [[propuesta-de-valor]]).
