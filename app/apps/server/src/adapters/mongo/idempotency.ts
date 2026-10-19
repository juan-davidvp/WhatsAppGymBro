/**
 * Claves de idempotencia estables (NFR-03, SC-003-2, `.claude/rules/bot-y-contenido.md`).
 * Un toque repetido produce la misma clave aunque Telegram mande otro update.
 */

/** Serie: una por sesión, ejercicio y número de serie. */
export function setIdempotencyKey(
  sessionId: string,
  exerciseCode: string,
  setIndex: number,
): string {
  return `set:${sessionId}:${exerciseCode}:${setIndex}`;
}

/** Comida: el mensaje y el botón que la registraron (el mismo botón tocado dos veces). */
export function mealIdempotencyKey(
  chatId: number,
  messageId: number,
  callbackData: string,
): string {
  return `meal:${chatId}:${messageId}:${callbackData}`;
}
