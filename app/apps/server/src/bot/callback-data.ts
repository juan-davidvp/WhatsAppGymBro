/**
 * Datos de los botones (plan técnico §5): formato compacto y versionado
 * `v1:<acción>:<arg>`. La Bot API admite 1–64 bytes en `callback_data`
 * (verificado en core.telegram.org/bots/api, InlineKeyboardButton, 2026-10-19).
 */

export const CALLBACK_DATA_MAX_BYTES = 64;
const VERSION = 'v1';

/** Destinos de navegación de los botones de CU-07 (Hoy, Comida, Progreso). */
export const NAV_TARGETS = ['today', 'food', 'progress'] as const;
export type NavTarget = (typeof NAV_TARGETS)[number];

export type CallbackAction = { action: 'nav'; target: NavTarget };

function checkSize(data: string): string {
  const bytes = new TextEncoder().encode(data).length;
  if (bytes < 1 || bytes > CALLBACK_DATA_MAX_BYTES) {
    throw new Error(`callback_data de ${bytes} bytes (máximo ${CALLBACK_DATA_MAX_BYTES})`);
  }
  return data;
}

export function encodeCallbackData(action: CallbackAction): string {
  return checkSize(`${VERSION}:${action.action}:${action.target}`);
}

/** null si los datos no son de este formato o de esta versión (botón viejo o ajeno). */
export function parseCallbackData(data: string): CallbackAction | null {
  const [version, action, arg] = data.split(':');
  if (version !== VERSION) return null;
  if (action === 'nav' && NAV_TARGETS.includes(arg as NavTarget)) {
    return { action: 'nav', target: arg as NavTarget };
  }
  return null;
}
