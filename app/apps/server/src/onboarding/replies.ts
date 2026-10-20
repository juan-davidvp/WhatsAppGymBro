import { renderTemplate, templateById } from '@gymbro/content';
import type { GoalType } from '@gymbro/domain';
import { encodeCallbackData, type CallbackAction } from '../bot/callback-data.js';

/**
 * Respuestas que devuelven los casos de uso: texto y botones, ya listos para el
 * adaptador de Telegram. Los textos salen del paquete `content` por ID.
 */

export interface Button {
  readonly label: string;
  readonly data: string;
}

export interface Reply {
  readonly text: string;
  readonly buttons: readonly Button[];
  /** Reemplaza el mensaje del botón tocado en vez de enviar uno nuevo (selección múltiple). */
  readonly edit?: boolean;
  /** Botones por fila (por defecto, uno). */
  readonly rowSize?: number;
}

/** Objetivo de cada botón de ON-05, por su texto en la bóveda. */
export const GOAL_BY_LABEL: Readonly<Record<string, GoalType>> = {
  'Ganar músculo': 'gain_muscle',
  'Perder grasa': 'lose_fat',
  'Ganar fuerza': 'gain_strength',
  Recomposición: 'recomposition',
  'Ser constante': 'consistency',
  Mantener: 'maintain',
};

/** Valor de cada botón de las plantillas, por su texto en la bóveda. */
const BUTTON_VALUES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  'ON-02': { Acepto: 'accept', 'Ver política': 'policy', 'No acepto': 'decline' },
  'PV-01': { Acepto: 'accept', 'No acepto': 'decline' },
  'ON-03': { Sí: 'yes', No: 'no' },
  'ON-05': GOAL_BY_LABEL,
  'ON-06': { 'Me sirve': 'ok', 'Más conservadora': 'cons', 'Más ambiciosa': 'amb' },
  'ON-07': { 'Opción 1': 'opt1', 'Opción 2': 'opt2' },
  'ON-09': {
    Nunca: 'never',
    'Menos de 6 meses': 'under_6_months',
    '6 meses o más': 'six_months_plus',
  },
  'ON-13': { Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', Noche: 'evening' },
  'ON-14': { Gym: 'gym', Casa: 'home', Ambos: 'both' },
  'ON-17': { 'Prefiero no decirlo': 'skip' },
  'ON-18': { 'Prefiero no decirlo': 'skip' },
  'ON-19': { 'Sí, es correcto': 'confirm' },
  'ON-20': { 'Prefiero no decirlo': 'skip' },
  'ON-22': { Poco: 'low', Normal: 'normal', Más: 'high' },
  'ON-24': { Empezar: 'today', 'Ver plan': 'plan' },
  'ON-25': { Continuar: 'continue', 'Empezar de nuevo': 'restart' },
  'TZ-01': { 'Todo NO': 'all_no', 'Algún SÍ': 'some_yes', 'No lo hice': 'not_done' },
  'TZ-02': { 'Ya tengo autorización': 'authorized' },
  'TZ-03': { 'Todo NO': 'all_no', 'Algún SÍ': 'some_yes' },
  'BD-01': { 'Sí, borrar': 'confirm', Cancelar: 'cancel' },
  'BD-02': { 'Borrar todo': 'erase', Cancelar: 'cancel' },
};

/** Valor del botón con ese texto en esa plantilla (para pruebas y respuestas compuestas). */
export function buttonValue(templateId: string, label: string): string {
  const value = BUTTON_VALUES[templateId]?.[label];
  if (!value) throw new Error(`Botón sin valor: ${templateId} · ${label}`);
  return value;
}

/** Respuesta con la plantilla y sus botones; cada botón lleva su valor. */
export function templateReply(
  id: string,
  toAction: (value: string, label: string) => CallbackAction,
  text: string = renderTemplate(id),
): Reply {
  const buttons = templateById(id).buttons.map((label) => ({
    label,
    data: encodeCallbackData(toAction(buttonValue(id, label), label)),
  }));
  return { text, buttons };
}

export function plain(id: string, variables?: Readonly<Record<string, string | number>>): Reply {
  return { text: renderTemplate(id, variables), buttons: [] };
}

/** Botones generados por el código (los que la bóveda describe en la nota de §3). */
export function button(label: string, action: CallbackAction): Button {
  return { label, data: encodeCallbackData(action) };
}
