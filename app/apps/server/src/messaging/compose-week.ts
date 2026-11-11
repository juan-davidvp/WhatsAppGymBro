import { WEEKLY_PHRASES } from '@gymbro/content';
import {
  WEEK_DAYS,
  addDays,
  comebackAction,
  evaluateWeek,
  wallGrid,
  weekStartOf,
  weekdayOf,
  type LocalDate,
} from '@gymbro/domain';
import { plannedWeekDays } from '../plans/weekly-plan.js';
import { weekAchieved } from '../scheduler/close-week.js';
import { comebackInputs, contextualReminderApplies } from './comeback.js';
import { dayContext, type Composer, type TemplateOption } from './compose.js';

/** Total de días que cuentan del usuario (nunca baja, RN-DQC-007). */
async function countedTotal(userId: string, deps: Parameters<Composer>[2]): Promise<number> {
  return (await deps.streaks.get(userId))?.state.counted.total ?? 0;
}

/**
 * RN-MSJ-008 · `regreso`. Se vuelve a decidir al enviar: si entrenó, comió o
 * tocó algo entretanto, no queda nada que decir.
 * - Tras P-052 días de entreno planificados sin actividad: RG-01 o RG-02 (si ya
 *   hay días que cuentan), con [Exprés 15'] [Ajustar plan]. RG-03 queda fuera
 *   hasta T-045 (PO, 2026-11-10).
 * - Tras P-053 días sin actividad: el final (RG-04, RG-05) y la pausa.
 * - En pausa, el lunes RG-06 y el día 1 del mes RG-07 (reactivación).
 */
export const comeback: Composer = async (user, date, deps) => {
  const day = await dayContext(user, date, deps);
  if (day.dayCounts || day.sessionStarted) return { day, options: [] };
  const stats = await deps.messageStats.get(user.id);
  const inputs = await comebackInputs(user, date, deps);
  const action = comebackAction({
    today: date,
    ...inputs,
    inactivityPaused: stats.inactivityPausedAt !== null,
    reactivationsUsed: stats.reactivationsUsed,
    lastReactivationDate: stats.lastReactivationDate,
  });
  switch (action) {
    case 'send_comeback': {
      const total = await countedTotal(user.id, deps);
      const options: TemplateOption[] = [{ templateId: 'RG-01', variables: {} }];
      if (total > 0) options.push({ templateId: 'RG-02', variables: { dias_que_cuentan: total } });
      return { day, options };
    }
    case 'send_final_and_pause':
      return {
        day,
        options: [
          { templateId: 'RG-04', variables: {} },
          { templateId: 'RG-05', variables: {} },
        ],
        effect: { kind: 'inactivity_pause', inactiveDays: inputs.daysWithoutActivity },
      };
    case 'send_reactivation':
      return { day, options: reactivationOptions(date), effect: { kind: 'reactivation' } };
    case 'none':
      return { day, options: [] };
  }
};

/** RG-06 habla de la semana nueva (lunes) y RG-07 del mes nuevo (día 1). */
function reactivationOptions(date: LocalDate): TemplateOption[] {
  return [
    ...(weekdayOf(date) === 'monday' ? [{ templateId: 'RG-06', variables: {} }] : []),
    ...(date.endsWith('-01') ? [{ templateId: 'RG-07', variables: {} }] : []),
  ];
}

/**
 * `recordatorio_contextual` (PO, 2026-11-10): ayer era de entreno y no contó, y
 * hoy es descanso, así que hay hueco para una exprés. Si hoy ya cuenta, nada.
 */
export const contextualReminder: Composer = async (user, date, deps) => {
  const day = await dayContext(user, date, deps);
  if (day.dayCounts || day.sessionStarted || !(await contextualReminderApplies(user, date, deps))) {
    return { day, options: [] };
  }
  return {
    day,
    options: [
      { templateId: 'RC-01', variables: {} },
      { templateId: 'RC-02', variables: {} },
      { templateId: 'RC-03', variables: {} },
    ],
  };
};

const WEEK_LENGTH = WEEK_DAYS.length;
const DAY_MS = 86_400_000;

/** `{frase_semana}`: rota por semana, sin repetir la de la semana anterior. */
export function weeklyPhrase(weekStart: LocalDate): string {
  const weekIndex = Math.floor(Date.parse(`${weekStart}T00:00:00Z`) / (WEEK_LENGTH * DAY_MS));
  return WEEKLY_PHRASES[weekIndex % WEEKLY_PHRASES.length] ?? '';
}

/**
 * RN-MSJ-017 · `resumen_semanal` en texto (PO, 2026-11-10): RS-01 con los números
 * de la semana (si hay semana anterior y comidas registradas) o RS-04; en el modo
 * sin números, solo RS-04. Sin días que cuentan no sale [supuesto, para el PO].
 * RS-02 queda fuera (las misiones nuevas se generan
 * después del cierre del domingo) y RS-03 espera al muro (T-080). [Ver plan]
 * muestra la semana siguiente (RN-PLAN-009).
 */
export const weeklySummary: Composer = async (user, date, deps) => {
  const day = await dayContext(user, date, deps);
  const weekStart = weekStartOf(date);
  const achieved = await weekAchieved(user, weekStart, date, deps);
  // Una semana sin días que cuentan no tiene nada que reconocer; de eso se ocupa `regreso`.
  if (achieved.countedDays === 0) return { day, options: [] };
  const frase = weeklyPhrase(weekStart);
  const wall = wallGrid(await deps.days.history(user.id), date);
  const options: TemplateOption[] = [
    { templateId: 'RS-04', variables: { dqc: achieved.countedDays, frase_semana: frase } },
    // T-080: con la imagen del muro entra RS-03.
    { templateId: 'RS-03', variables: { frase_semana: frase }, needsImage: true },
  ];
  if (user.settings.numberFreeMode) return { day, options, wall };

  const previous = (await deps.weeks.list(user.id)).find(
    (w) => w.weekStart === addDays(weekStart, -WEEK_LENGTH),
  );
  const proteinByDay: number[] = [];
  for (let d = weekStart; d <= date; d = addDays(d, 1)) {
    const meals = await deps.meals.onDate(user.id, d);
    if (meals.length > 0) proteinByDay.push(meals.reduce((sum, m) => sum + m.proteinG, 0));
  }
  const planned = (await plannedWeekDays(user, weekStart, deps)).filter(
    (d) => d.type === 'TRAINING',
  ).length;
  const week = evaluateWeek({ planned, completed: achieved.sessions, paused: false });
  if (previous && proteinByDay.length > 0 && week.evaluated) {
    const average = proteinByDay.reduce((a, b) => a + b, 0) / proteinByDay.length;
    options.push({
      templateId: 'RS-01',
      variables: {
        dqc: achieved.countedDays,
        dqc_anterior: previous.countedDays,
        sesiones: achieved.sessions,
        compromiso: week.commitment,
        proteina_media: Math.round(average),
        frase_semana: frase,
      },
    });
  }
  return { day, options, wall };
};
