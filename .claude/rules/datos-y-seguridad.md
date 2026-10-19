---
paths:
  - "app/apps/server/src/adapters/**/*"
  - "app/apps/server/src/http/**/*"
  - "app/infra/**/*"
  - "app/apps/miniapp/**/*"
---

# Datos, privacidad y seguridad técnica (constitución V y VI, SPEC-009)

- **Consentimiento** explícito y granular antes de pedir datos sensibles (RN-DAT-001); aviso de que el chat vive en Telegram sin cifrado de extremo a extremo y de que la comida se envía a un proveedor de IA (RN-DAT-002).
- **Borrado total** en máximo P-065 horas (RN-DAT-003). Toda colección nueva se suma a la rutina de borrado y a su prueba (`vault/output/sdd/plan/modelo-de-datos.md` §4).
- **Minimización:** las fotos de comida no se guardan (RN-DAT-004); los eventos llevan categorías, identificadores y métricas, nunca texto libre ni datos sensibles (RN-DAT-005).
- **Secretos** solo por variables de entorno (lista en `vault/output/sdd/plan/plan-tecnico.md` §10); `.env` nunca se versiona; los registros redactan secretos (RN-DAT-006).
- **Entradas externas:** *webhook* con token secreto; Mini App con validación de `initData` en el servidor; puente de ingesta con token propio, validación de esquema y límite de tasa (SPEC-008).
- **IA acotada:** adaptador del puerto `PortionEstimator`; salida validada con zod (RN-SEG-010), límite diario P-068, costo por llamada registrado. Su resultado es una propuesta que el usuario confirma; nunca texto para el usuario.
- **Fechas** en UTC en la base; el día operativo lo calcula el dominio con la zona del usuario.
- **Base de datos:** usuario con privilegios mínimos e índices definidos en el modelo de datos (incluidas las claves de idempotencia).
