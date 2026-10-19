---
paths:
  - "app/apps/server/src/scheduler/**/*"
  - "app/packages/domain/src/messaging/**/*"
---

# Mensajes proactivos y planificador (constitución III, SPEC-007)

- **Un solo camino:** candidato → motor de política de mensajes (función pura del dominio) → bandeja de salida (`outbox`) → envío. Ningún módulo llama a Telegram para un mensaje no solicitado por fuera de este camino (RN-MSJ-015).
- **Prioridad:** `regreso` > `plan_listo` > `cierre_del_dia` > `reconocimiento` > `recordatorio_contextual`. El `resumen_semanal` y `mantenimiento` siguen las reglas de su spec.
- **Motivos de supresión** (se registran como evento `message_suppressed`): `budget`, `quiet_hours`, `min_gap`, `paused`, `inactive`, `day_already_counts`, `disabled_purpose`, `cooldown`, `stale`.
- **Valores** de presupuesto, silencio, separación, hora habitual, retroceso, inactividad, desvanecimiento, rotación, pausa y horarios: solo desde `parameters.ts` (P-045 a P-060, P-066, P-067).
- **Planificador:** corre cada minuto, es idempotente (una clave por usuario + propósito + día operativo), re-evalúa al reiniciar y descarta salidas viejas en lugar de enviarlas tarde.
- **Cierres de día y de semana:** idempotentes; nunca restan días que cuentan ni XP.
- **Bloqueo:** si Telegram responde que el usuario bloqueó el bot, cancelar pendientes, marcar al usuario y registrar `bot_blocked` (RN-MSJ-014).
- **Prueba obligatoria:** simulación de 60 días con usuarios sintéticos y 0 violaciones de presupuesto, silencio o separación (SC-007-1, salvaguarda G06).
