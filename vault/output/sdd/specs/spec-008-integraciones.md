---
titulo: SPEC-008 · Exportación e integraciones
tipo: sdd-spec
id: SPEC-008
hito: H3
estado: borrador
version: 0.1.0
fase: 0
prioridad: P1
depende_de: [SPEC-005]
creado: 2026-10-18
actualizado: 2026-10-18
deriva_de: [integraciones-y-ecosistema, registro-sin-friccion]
fuentes: [F62, F63, F73]
relacionados: [spec-009-seguridad-y-privacidad, plan-tecnico, reglas-de-negocio]
---

# SPEC-008 · Exportación e integraciones

## 1. Propósito

Ir **más allá del chat** (FB-001-05) dentro de lo que un bot puede hacer: datos portables desde el primer día y una vía para que **el día cuente con datos que llegan solos**, sin depender de una app nativa (ADR-014).

## 2. Historias de usuario

### HU-008-1 · Exportar mis datos (P1)
1. **Dado** `/exportar`, **cuando** confirma, **entonces** recibe un archivo ZIP con CSV (sesiones, series, comidas, días, logros, mediciones) y un JSON completo (RN-INT-002).
2. **Dado** el archivo, **cuando** lo abre, **entonces** no contiene tokens, claves ni datos de otros usuarios.

### HU-008-2 · Puente de ingesta de pasos y actividades (P3, Could en Fase 0)
1. **Dado** `/ajustes` → Conexiones → [Puente de pasos], **cuando** lo activa, **entonces** recibe una URL con su token personal y una guía según su dispositivo (Atajos de iOS o automatización en Android) (RN-INT-003).
2. **Dado** un envío válido con pasos del día, **cuando** llega, **entonces** se guarda como actividad importada y se re-evalúa el día (RN-DQC-003).
3. **Dado** una actividad importada de ≥ P-025 minutos en un día de entreno, **cuando** llega, **entonces** el día cuenta como entreno alternativo (RN-ENT-006).
4. **Dado** una sesión registrada en Gym Bro y una actividad importada del mismo tipo con inicio en ± P-061 minutos, **cuando** se reconcilian, **entonces** prevalece la de Gym Bro (RN-INT-004).
5. **Dado** [Revocar], **cuando** confirma, **entonces** el token deja de funcionar y el producto sigue con registro manual (RN-INT-005).

### HU-008-3 · Fuentes nube a nube (Fase 1)
Hevy (clave del usuario, `F73`), Strava y Google Calendar (OAuth), en solo lectura salvo eventos de calendario autorizados (RN-INT-006). Fuera de la Fase 0.

## 3. Requisitos funcionales

| ID | Requisito |
|---|---|
| FR-008-01 | La exportación DEBE generarse a demanda y enviarse como documento por Telegram. |
| FR-008-02 | El *endpoint* de ingesta DEBE autenticar con un token por usuario (aleatorio, guardado como *hash*), validar el cuerpo con un esquema y aplicar límite de tasa. |
| FR-008-03 | Los datos importados DEBEN marcarse con su fuente y nunca sobrescribir registros manuales (RN-INT-004). |
| FR-008-04 | El sistema NO DEBE intentar leer Health Connect, Apple Health ni la API de Fitbit desde el servidor (`F62`, `F63`). |

## 4. Reglas aplicables

RN-INT-001 a RN-INT-006 · RN-ENT-006 · RN-DQC-002 · RN-DQC-003 · RN-DAT-005.

## 5. Entidades

`ImportedActivity`, `IngestionToken`, `ExportJob`.

## 6. Criterios de éxito

| ID | Criterio |
|---|---|
| SC-008-1 | Exportación completa en ≤ 30 s para 12 semanas de datos. |
| SC-008-2 | % de días que cuentan con datos pasivos (alfa, si se activa el puente). |

## 7. Eventos

`export_requested` · `export_delivered` · `ingestion_token_created` · `ingestion_received` (tipo, fuente) · `ingestion_rejected` (motivo) · `ingestion_token_revoked`.

## 8. Casos límite

- Envío con fecha futura o pasos imposibles (> 100.000): rechazo con motivo.
- Token filtrado: el usuario lo revoca y genera otro.

## 9. Fuera de alcance

App nativa, Health Connect, Apple Health, wearables directos, OAuth (Fase 1).

## 10. Aclaraciones pendientes

- `[NEEDS CLARIFICATION: Q6]` Dispositivo del usuario cero, para escribir la guía del puente de ingesta.
