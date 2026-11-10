/**
 * Teclado persistente y comandos del menú (FR-001-11), transcritos de
 * `plantillas-de-mensajes.md` §2.2 y §2.3. `navigation.test.ts` compara ambos lados.
 */

/** Botones del teclado persistente, en orden. */
export const MAIN_KEYBOARD = ['🏋️ Hoy', '🍽️ Comida', '📈 Progreso'] as const;

/** Comandos que el bot registra en Telegram, con su descripción. */
export const BOT_COMMANDS = [
  { command: 'start', description: 'Empezar o retomar' },
  { command: 'hoy', description: 'Tu sesión de hoy' },
  { command: 'plan', description: 'Tu plan de la semana' },
  { command: 'privacidad', description: 'Tu autorización y la política de datos' },
  { command: 'borrar_datos', description: 'Borrar todos tus datos' },
] as const;
