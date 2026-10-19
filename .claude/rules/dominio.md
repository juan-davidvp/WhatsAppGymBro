---
paths:
  - "app/packages/domain/**/*"
---

# Dominio puro (constitución VII y X)

- **Sin E/S:** nada de base de datos, red, Telegram, variables de entorno, `Date.now()` ni `Math.random()`. El reloj, la zona horaria del usuario y la fuente de aleatoriedad (rotación de plantillas) se reciben como parámetros.
- **Números solo desde `src/config/parameters.ts`**, que replica `vault/output/sdd/parametros.md` con el ID `P-###` en un comentario junto a cada valor. Si falta un valor, se añade primero en la bóveda (`/cambiar-regla`).
- **Cada función que implementa una regla cita su ID** en JSDoc (`/** RN-DQC-003: … */`) y tiene al menos una prueba cuyo nombre empieza por ese ID.
- **Invariantes con fast-check** (ver `vault/output/sdd/plan/estrategia-de-pruebas.md` §3): el total de días que cuentan y el XP nunca bajan; ningún plan viola el descanso mínimo; el motor de mensajes nunca excede el presupuesto ni envía en horas de silencio; ninguna meta guardada viola RN-OBJ-004/005.
- **Día operativo:** siempre con la zona horaria del usuario y el corte P-029 (RN-DQC-001); nunca con la fecha del servidor. En la base, todo en UTC.
- **Funciones que deciden, no que actúan:** devuelven resultados explícitos (por ejemplo, una decisión del motor de mensajes con su motivo de supresión) y el caso de uso ejecuta los efectos.
- **Nombres** según `vault/output/sdd/glosario.md`: inglés en el código, español en los textos para el usuario.
- **Fallar no castiga:** ningún cálculo resta días que cuentan, XP ni logros, ni genera deuda de sesiones (constitución I, RN-PLAN-007).
