import { SESSION_NAMES, WEEKDAY_NAMES } from '@gymbro/content';
import {
  WEEK_DAYS,
  dailyProteinGoal,
  evaluateDay,
  operationalDate,
  weekStartOf,
  weekdayOf,
  type LocalDate,
} from '@gymbro/domain';
import { dayInputsFrom } from '../days/day-status.js';
import { ensureWeek, plannedDayType } from '../plans/weekly-plan.js';
import { dayContext, type Composer, type TemplateOption } from './compose.js';

/** "Miércoles" para `{dia_semana}`. */
function weekdayName(date: LocalDate): string {
  const name = WEEKDAY_NAMES[WEEK_DAYS.indexOf(weekdayOf(date))] ?? '';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * RN-MSJ-005 · `plan_listo`: la sesión del día con [Gym] [Casa] [Exprés 15']
 * [Hoy no puedo]. PL-04 necesita el ejercicio en el que subió la última vez y
 * PL-05 al menos un día que cuenta: si no hay dato, esa plantilla no entra.
 * Si sale la noche anterior (el aviso caería en silencio), PL-06 a PL-08 con
 * [Ver plan]: esa noche todavía es el día operativo anterior.
 */
export const planReady: Composer = async (user, date, deps) => {
  const today = operationalDate(deps.clock(), user.timezone);
  const week = await ensureWeek(user, weekStartOf(date), deps);
  const planned = week?.days.find((d) => d.date === date)?.session;
  const sesion = planned ? SESSION_NAMES[planned.template] : '';
  const minutos = planned ? Math.round(planned.versions.GYM.estimatedMinutes) : 0;

  if (today < date) {
    // La víspera: el estado que importa para el presupuesto es el del día de envío.
    const day = {
      dayType: await plannedDayType(user, today, deps),
      dayCounts: false,
      sessionStarted: false,
      missingActionTaps: null,
    };
    if (!planned) return { day, options: [] };
    return {
      day,
      options: [
        { templateId: 'PL-06', variables: { sesion } },
        { templateId: 'PL-07', variables: { sesion, minutos } },
        { templateId: 'PL-08', variables: { sesion } },
      ],
    };
  }

  const day = await dayContext(user, date, deps);
  if (!planned) return { day, options: [] };
  const total = (await deps.streaks.get(user.id))?.state.counted.total ?? 0;
  const options: TemplateOption[] = [
    { templateId: 'PL-01', variables: { sesion, minutos } },
    { templateId: 'PL-02', variables: { sesion } },
    { templateId: 'PL-03', variables: { dia_semana: weekdayName(date), sesion } },
  ];
  if (total > 0) {
    options.push({ templateId: 'PL-05', variables: { dias_que_cuentan: total, sesion } });
  }
  return { day, options };
};

/** Toques de [Lo de siempre]: abre 🍽️ Comida y registra la frecuente (constitución II). */
const FAVORITE_MEAL_TAPS = 2;

/**
 * RN-MSJ-016 (ampliada) · `cierre_del_dia`: si el día no cuenta y es de descanso
 * (la misión es la comida) o si ya cuenta y solo le falta la mitad de comida
 * para quedar completo. Hace falta una comida frecuente: con ella se registra en
 * P-073 toques; sin ella no se puede y el motor lo suprime (`not_doable`). En el
 * modo sin números solo van las plantillas sin gramos (CD-02, CD-04).
 */
export const dayClosing: Composer = async (user, date, deps) => {
  const base = await dayContext(user, date, deps);
  const sources = await deps.days.sources(user.id, date);
  const status = evaluateDay(dayInputsFrom(base.dayType, sources));
  const missingNutrition = !status.nutritionHalf;
  const onlyNutritionMissingForComplete =
    status.counts &&
    !status.complete &&
    missingNutrition &&
    (base.dayType === 'TRAINING' || status.activeRecovery);
  const restMissionMissing = !status.counts && base.dayType === 'REST';
  const favorites = await deps.favorites.list(user.id);
  const doable = (onlyNutritionMissingForComplete || restMissionMissing) && favorites.length > 0;
  const day = {
    ...base,
    dayCounts: status.counts,
    missingActionTaps: doable ? FAVORITE_MEAL_TAPS : null,
    onlyNutritionMissingForComplete,
  };

  const meals = await deps.meals.onDate(user.id, date);
  const protein = meals.reduce((sum, m) => sum + m.proteinG, 0);
  const goal = dailyProteinGoal(await deps.bodyMeasurements.latestWeightKg(user.id));
  const faltanG = Math.max(0, Math.round(goal.grams - protein));
  const numbers = !user.settings.numberFreeMode;
  const [withGrams, withoutGrams] = status.counts ? ['CD-03', 'CD-04'] : ['CD-01', 'CD-02'];
  const options: TemplateOption[] = [
    ...(numbers ? [{ templateId: withGrams, variables: { faltan_g: faltanG } }] : []),
    { templateId: withoutGrams, variables: {} },
  ];
  return { day, options };
};
