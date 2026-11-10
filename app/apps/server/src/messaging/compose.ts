import { SESSION_NAMES, WEEKDAY_NAMES, templateById } from '@gymbro/content';
import {
  WEEK_DAYS,
  weekStartOf,
  weekdayOf,
  type DayContext,
  type LocalDate,
  type MessagePurpose,
} from '@gymbro/domain';
import type { CallbackAction } from '../bot/callback-data.js';
import { button, type Button } from '../onboarding/replies.js';
import { ensureWeek, plannedDayType } from '../plans/weekly-plan.js';
import type { UserRecord } from '../ports/repositories.js';
import type { TrainingDeps } from '../sessions/deps.js';

/**
 * Contenido de cada mensaje proactivo (T-070, T-071): el estado del día que
 * evalúa el motor (RN-MSJ-005, RN-MSJ-016), las plantillas posibles con sus
 * variables (la rotación elige una, RN-MSJ-010) y los botones de 1 toque
 * (RN-MSJ-012). Se arma al enviar, con el estado de ese momento (plan técnico §6).
 */

export type ComposeDeps = TrainingDeps;

export interface TemplateOption {
  readonly templateId: string;
  readonly variables: Readonly<Record<string, string | number>>;
}

export interface Composition {
  readonly day: DayContext;
  /** Vacío si hoy no hay nada que decir (p. ej., no hay sesión planificada). */
  readonly options: readonly TemplateOption[];
}

export type Composer = (
  user: UserRecord,
  date: LocalDate,
  deps: ComposeDeps,
) => Promise<Composition>;

/** Estado del día que el motor necesita (RN-MSJ-005). */
export async function dayContext(
  user: UserRecord,
  date: LocalDate,
  deps: ComposeDeps,
): Promise<DayContext> {
  const history = await deps.days.history(user.id);
  const sessions = await deps.workouts.onDate(user.id, date);
  return {
    dayType: await plannedDayType(user, date, deps),
    dayCounts: history.some((d) => d.date === date && d.counted),
    sessionStarted: sessions.length > 0,
    missingActionTaps: null,
  };
}

/** "Miércoles" para `{dia_semana}`. */
function weekdayName(date: LocalDate): string {
  const name = WEEKDAY_NAMES[WEEK_DAYS.indexOf(weekdayOf(date))] ?? '';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * RN-MSJ-005 · `plan_listo`: la sesión del día con [Gym] [Casa] [Exprés 15']
 * [Hoy no puedo]. PL-04 necesita el ejercicio en el que subió la última vez y
 * PL-05 al menos un día que cuenta: si no hay dato, la plantilla no entra.
 */
const planReady: Composer = async (user, date, deps) => {
  const day = await dayContext(user, date, deps);
  const week = await ensureWeek(user, weekStartOf(date), deps);
  const planned = week?.days.find((d) => d.date === date)?.session;
  if (!planned) return { day, options: [] };
  const sesion = SESSION_NAMES[planned.template];
  const total = (await deps.streaks.get(user.id))?.state.counted.total ?? 0;
  const options: TemplateOption[] = [
    {
      templateId: 'PL-01',
      variables: { sesion, minutos: Math.round(planned.versions.GYM.estimatedMinutes) },
    },
    { templateId: 'PL-02', variables: { sesion } },
    { templateId: 'PL-03', variables: { dia_semana: weekdayName(date), sesion } },
  ];
  if (total > 0)
    options.push({ templateId: 'PL-05', variables: { dias_que_cuentan: total, sesion } });
  return { day, options };
};

export const COMPOSERS: Partial<Readonly<Record<MessagePurpose, Composer>>> = {
  plan_listo: planReady,
};

const td = (value: string): CallbackAction => ({ action: 'td', value });

/**
 * Acción de cada botón de las plantillas proactivas, por su texto. [Exprés 15']
 * de `regreso` y `recordatorio_contextual` abre la exprés de la sesión que faltó
 * (RN-GAM-003); [Ajustar plan] y [Ajustar días] muestran el plan mientras no
 * exista T-045 (decisión del PO, 2026-11-10).
 */
const BUTTON_ACTIONS: Readonly<Record<string, CallbackAction>> = {
  Gym: td('gym'),
  Casa: td('home'),
  "Exprés 15'": td('express'),
  'Hoy no puedo': td('cant'),
  'Hoy descanso': td('care_rest'),
  'Ajustar plan': { action: 'nav', target: 'plan' },
  'Ajustar días': { action: 'nav', target: 'plan' },
  'Ver plan': { action: 'nav', target: 'plan' },
  'Lo de siempre': { action: 'nav', target: 'food' },
  Porciones: { action: 'nav', target: 'food' },
  Registrar: { action: 'nav', target: 'food' },
  'Hoy no': td('dismiss'),
  'Ahora no': td('dismiss'),
  Volver: { action: 'nav', target: 'today' },
  Sí: { action: 'nav', target: 'today' },
  Retomar: { action: 'nav', target: 'today' },
  'Ver misiones': td('quests'),
};

const COMEBACK_PURPOSES: readonly MessagePurpose[] = ['regreso', 'recordatorio_contextual'];

/** RN-MSJ-012: botones de 1 toque de la plantilla elegida. */
export function proactiveButtons(templateId: string, purpose: MessagePurpose): Button[] {
  return templateById(templateId).buttons.map((label) => {
    const action =
      label === "Exprés 15'" && COMEBACK_PURPOSES.includes(purpose)
        ? td('repair')
        : BUTTON_ACTIONS[label];
    if (!action) throw new Error(`Botón proactivo sin acción: ${templateId} · ${label}`);
    return button(label, action);
  });
}
