import { PARAMETERS, rescheduleSession, type LocalDate } from '@gymbro/domain';
import { SESSION_NAMES, renderTemplate } from '@gymbro/content';
import { MOBILITY_SOURCE, dayCounts, recordDayActivity } from '../days/day-status.js';
import { plain, templateReply, button, type Reply } from '../onboarding/replies.js';
import { dayLabel } from '../plans/plan-view.js';
import { currentWeek } from '../plans/weekly-plan.js';
import type { UserRecord } from '../ports/repositories.js';
import type { TrainingDeps } from '../sessions/deps.js';
import { logYesterdayAsPlanned, yesterdayPrompt } from '../sessions/finish.js';
import {
  VARIANT_BY_VALUE,
  planDayToday,
  resumeSession,
  startSession,
  today,
} from '../sessions/session.js';

/**
 * 🏋️ Hoy (HU-002-2, HU-002-3): la sesión del día con [Gym] [Casa] [Exprés 15']
 * [Hoy no puedo], el descanso con su misión y "Hoy no puedo" sin deuda.
 */

const td = (value: string) => ({ action: 'td' as const, value });

/** `🏋️ Hoy`, `/hoy` y [Empezar]. */
export async function todayScreen(user: UserRecord, deps: TrainingDeps): Promise<Reply[]> {
  if (!user.onboarding.completedAt) return [plain('PN-04')];
  const resumed = await resumeSession(user, deps);
  if (resumed.length > 0) return resumed;
  const day = await planDayToday(user, deps);
  if (!day) return [plain('PN-04')];
  // HU-003-2: ayer sin registrar, dentro de la gracia → [La hice tal cual] antes que hoy.
  const yesterday = await yesterdayPrompt(user, deps);
  return [...yesterday, ...(await todayFor(user, day, deps))];
}

async function todayFor(
  user: UserRecord,
  day: NonNullable<Awaited<ReturnType<typeof planDayToday>>>,
  deps: TrainingDeps,
): Promise<Reply[]> {
  if (await dayCounts(user, day.date, deps)) return [plain('HY-03')];
  if (!day.session) {
    return [
      templateReply(
        'HY-01',
        td,
        renderTemplate('HY-01', { minutos: PARAMETERS.day.restMobilityMinutes }),
      ),
    ];
  }
  const minutes = Math.round(day.session.versions.GYM.estimatedMinutes);
  return [
    templateReply(
      'PL-01',
      td,
      renderTemplate('PL-01', { sesion: SESSION_NAMES[day.session.template], minutos: minutes }),
    ),
  ];
}

/** Días de esta semana a los que se puede mover la sesión de hoy (RN-PLAN-007, RN-PLAN-008). */
async function moveTargets(user: UserRecord, deps: TrainingDeps): Promise<LocalDate[]> {
  const week = await currentWeek(user, deps);
  const date = today(user, deps);
  if (!week || !user.profile.level) return [];
  const level = user.profile.level;
  return week.days
    .filter((d) => d.date > date && d.type === 'REST')
    .map((d) => d.date)
    .filter((to) => {
      try {
        rescheduleSession({ ...week, days: week.days }, date, to, level);
        return true;
      } catch {
        return false;
      }
    });
}

const compactDate = (date: LocalDate) => date.replaceAll('-', '');
const fromCompact = (value: string): LocalDate | null => {
  const m = /^mv_(\d{4})(\d{2})(\d{2})$/.exec(value);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
};

/** Botones de la pantalla Hoy y de "Hoy no puedo". */
export async function answerToday(
  user: UserRecord,
  value: string,
  deps: TrainingDeps,
): Promise<Reply[]> {
  const subject = { userId: user.id, timezone: user.timezone };
  const variant = VARIANT_BY_VALUE[value];
  if (variant) return startSession(user, variant, deps);
  const fresh = /^new_(gym|home|express)$/.exec(value)?.[1];
  if (fresh) return startSession(user, VARIANT_BY_VALUE[fresh] ?? 'GYM', deps, true);

  switch (value) {
    case 'resume':
      return resumeSession(user, deps);
    case 'asis_yesterday':
      return logYesterdayAsPlanned(user, deps);
    case 'cant':
      return [templateReply('HN-01', (v) => td(v === 'express' ? 'express_now' : v))];
    case 'express_now':
      await deps.events.emit('cant_today_selected', subject, { option: 'express' });
      return startSession(user, 'EXPRESS', deps);
    case 'rest':
      await deps.events.emit('cant_today_selected', subject, { option: 'rest' });
      return [plain('HN-02')];
    case 'move': {
      await deps.events.emit('cant_today_selected', subject, { option: 'move' });
      const targets = await moveTargets(user, deps);
      if (targets.length === 0) return [plain('HN-04')];
      return [
        {
          text: renderTemplate('HN-03'),
          buttons: targets.map((d) => button(dayLabel(d), td(`mv_${compactDate(d)}`))),
        },
      ];
    }
    case 'mobility': {
      const day = await planDayToday(user, deps);
      if (!day || day.session) return todayScreen(user, deps);
      const result = await recordDayActivity(user, day.date, 'REST', MOBILITY_SOURCE, deps);
      return [plain('HY-02', { n: result.total, racha: result.streak })];
    }
    default: {
      const to = fromCompact(value);
      const day = to ? await planDayToday(user, deps) : null;
      if (!to || !day?.session) return todayScreen(user, deps);
      // Se revalida: un botón viejo no puede romper el descanso mínimo.
      if (!(await moveTargets(user, deps)).includes(to)) return [plain('HN-04')];
      const week = await currentWeek(user, deps);
      if (!week) return [];
      await deps.plans.moveSession(user.id, week.weekStart, day.date, to);
      await deps.events.emit('session_rescheduled', subject, {});
      return [
        plain('HN-05', {
          sesion: SESSION_NAMES[day.session.template],
          dia: dayLabel(to).toLowerCase(),
        }),
      ];
    }
  }
}
