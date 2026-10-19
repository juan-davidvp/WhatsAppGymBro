import { ONBOARDING_STEPS, type OnboardingStep } from '@gymbro/domain';

/**
 * Datos de los botones (plan técnico §5): formato compacto y versionado
 * `v1:<acción>:<arg>[:<valor>]`. La Bot API admite 1–64 bytes en `callback_data`
 * (verificado en core.telegram.org/bots/api, InlineKeyboardButton, 2026-10-19).
 */

export const CALLBACK_DATA_MAX_BYTES = 64;
const VERSION = 'v1';
/** Valor de un botón: corto, en minúsculas, sin `:`. */
const VALUE = /^[a-z0-9_]{1,24}$/;

/** Destinos de navegación de los botones de CU-07 (Hoy, Comida, Progreso). */
export const NAV_TARGETS = ['today', 'food', 'progress'] as const;
export type NavTarget = (typeof NAV_TARGETS)[number];

export type CallbackAction =
  | { action: 'nav'; target: NavTarget }
  /** Respuesta a una pregunta del onboarding. */
  | { action: 'ob'; step: OnboardingStep; value: string }
  /** Decisión sobre la política desde /privacidad (fuera del onboarding). */
  | { action: 'pv'; value: string }
  /** Tamizaje previo a la actividad fuera de su paso: autorización o resultado tardío. */
  | { action: 'sc'; value: string };

function checkSize(data: string): string {
  const bytes = new TextEncoder().encode(data).length;
  if (bytes < 1 || bytes > CALLBACK_DATA_MAX_BYTES) {
    throw new Error(`callback_data de ${bytes} bytes (máximo ${CALLBACK_DATA_MAX_BYTES})`);
  }
  return data;
}

function checkValue(value: string): string {
  if (!VALUE.test(value)) throw new Error(`Valor de botón inválido: ${value}`);
  return value;
}

export function encodeCallbackData(action: CallbackAction): string {
  switch (action.action) {
    case 'nav':
      return checkSize(`${VERSION}:nav:${action.target}`);
    case 'ob':
      return checkSize(`${VERSION}:ob:${action.step}:${checkValue(action.value)}`);
    case 'pv':
    case 'sc':
      return checkSize(`${VERSION}:${action.action}:${checkValue(action.value)}`);
  }
}

/** null si los datos no son de este formato o de esta versión (botón viejo o ajeno). */
export function parseCallbackData(data: string): CallbackAction | null {
  const [version, action, arg, value, ...rest] = data.split(':');
  if (version !== VERSION || rest.length > 0) return null;
  if (action === 'nav' && value === undefined && NAV_TARGETS.includes(arg as NavTarget)) {
    return { action: 'nav', target: arg as NavTarget };
  }
  if (
    action === 'ob' &&
    ONBOARDING_STEPS.includes(arg as OnboardingStep) &&
    value !== undefined &&
    VALUE.test(value)
  ) {
    return { action: 'ob', step: arg as OnboardingStep, value };
  }
  if (
    (action === 'pv' || action === 'sc') &&
    arg !== undefined &&
    value === undefined &&
    VALUE.test(arg)
  ) {
    return { action, value: arg };
  }
  return null;
}
