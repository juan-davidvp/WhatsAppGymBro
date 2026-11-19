import { renderTemplate, templateById } from '@gymbro/content';
import {
  PARAMETERS,
  WEEK_DAYS,
  addDays,
  foodBodyScreeningOutcome,
  operationalDate,
  weekStartOf,
  weightGoalOffers,
  type GoalType,
  type LocalDate,
} from '@gymbro/domain';
import type { CallbackAction } from '../bot/callback-data.js';
import { settingsMenu } from '../messaging/message-settings.js';
import {
  goalProposalReply,
  resolveGoalProposal,
  weightGoalInputs,
} from '../onboarding/profile-steps.js';
import { formatKg } from '../progress/progress-screen.js';
import { GOAL_BY_LABEL, button, type Reply } from '../onboarding/replies.js';
import { METRIC_BY_GOAL } from '../onboarding/summary.js';
import { ensureWeek, regenerateWeek, type PlanDeps } from '../plans/weekly-plan.js';
import type { GoalRecord, UserRecord, WorkoutSessionsRepository } from '../ports/repositories.js';
import {
  averageOn,
  enterMaintenanceMode,
  maintenanceBand,
  maintenanceReply,
  type GoalDeps,
} from './goal-review.js';

/**
 * Botones de objetivo y mantenimiento (T-082; decisión del PO, 2026-11-11):
 * [Mantener], [Nueva meta], [Extender], [Ajustar], [Ver opciones] y [Mover mi zona].
 * Fijar una meta reutiliza la propuesta del onboarding (ON-05, ON-06/07); el
 * objetivo anterior queda con su estado y el historial se conserva (RN-OBJ-007).
 */

export interface GoalActionDeps extends GoalDeps, PlanDeps {
  workouts: WorkoutSessionsRepository;
}

const gl = (value: string): CallbackAction => ({ action: 'gl', value });
/** El objetivo de la propuesta viaja en el botón: el perfil cambia solo al aceptarla. */
const PROPOSAL_CODE = { gain_muscle: 'm', lose_fat: 'f' } as const;
const PROPOSAL_VALUE = /^([mf])_(.+)$/;
const proposalAct = (type: keyof typeof PROPOSAL_CODE) => (value: string) =>
  gl(`p_${PROPOSAL_CODE[type]}_${value}`);
const DISMISS: CallbackAction = { action: 'td', value: 'dismiss' };

const LABEL_BY_GOAL: Readonly<Partial<Record<GoalType, string>>> = Object.fromEntries(
  Object.entries(GOAL_BY_LABEL).map(([label, type]) => [type, label]),
);

const subjectOf = (user: UserRecord) => ({ userId: user.id, timezone: user.timezone });
const done = (text: string): Reply => ({ text, buttons: [], edit: true });

/** ON-05 (u ON-21 en el modo sin números, RN-SEG-003: sin perder grasa). */
function objectiveChooser(user: UserRecord): Reply {
  const withoutWeightLoss = user.settings.numberFreeMode;
  const labels = templateById('ON-05').buttons.filter(
    (label) => !(withoutWeightLoss && GOAL_BY_LABEL[label] === 'lose_fat'),
  );
  return {
    text: renderTemplate(withoutWeightLoss ? 'ON-21' : 'ON-05'),
    buttons: labels.map((label) => button(label, gl(`t_${GOAL_BY_LABEL[label] ?? ''}`))),
    rowSize: 2,
    edit: true,
  };
}

const withGoal = (user: UserRecord, goalType: GoalType): UserRecord => ({
  ...user,
  profile: { ...user.profile, goalType },
});

/** Propuesta de meta de peso (ON-06) para ese objetivo, o null si no aplica. */
async function weightProposal(
  user: UserRecord,
  type: GoalType | null,
  deps: GoalDeps,
): Promise<Reply | null> {
  if (user.settings.numberFreeMode || !type) return null;
  const inputs = await weightGoalInputs(withGoal(user, type), deps);
  if (!inputs) return null;
  const offer = weightGoalOffers(inputs).proposal;
  return { ...goalProposalReply(offer, proposalAct(inputs.type)), edit: true };
}

/**
 * RN-OBJ-007 y HU-001-6: fija el objetivo nuevo. La semana en curso queda con el
 * anterior y el plan nuevo empieza el lunes siguiente.
 */
async function switchGoal(user: UserRecord, goal: GoalRecord, deps: GoalActionDeps): Promise<void> {
  const monday = weekStartOf(goal.startDate);
  await ensureWeek(user, monday, deps);
  await deps.users.updateProfile(user.id, { goalType: goal.type });
  await deps.goals.activate(goal);
  await regenerateWeek(withGoal(user, goal.type), addDays(monday, WEEK_DAYS.length), deps);
}

async function chooseObjective(
  user: UserRecord,
  type: GoalType,
  deps: GoalActionDeps,
): Promise<Reply[]> {
  const today = operationalDate(deps.clock(), user.timezone);
  // RN-SEG-003: tras un tamizaje positivo (modo sin números) no hay objetivo de perder grasa.
  if (
    user.settings.numberFreeMode &&
    !foodBodyScreeningOutcome(true).allowedGoalTypes.includes(type)
  ) {
    return [objectiveChooser(user)];
  }
  if (type === 'maintain') return keepMaintaining(user, today, deps);
  // HU-001-6: solo cambia si elige otro; repetir el mismo no reinicia su plazo.
  if ((await deps.goals.active(user.id))?.type === type) return [settingsMenu(true)];
  const proposal = await weightProposal(user, type, deps);
  if (proposal) return [proposal];
  const goal: GoalRecord = {
    userId: user.id,
    type,
    metric: METRIC_BY_GOAL[type],
    startValue: null,
    targetValue: null,
    startDate: today,
    horizonWeeks: PARAMETERS.goal.horizonWeeksDefault,
  };
  await switchGoal(user, goal, deps);
  await deps.events.emit('goal_set', subjectOf(user), {
    type,
    horizonWeeks: PARAMETERS.goal.horizonWeeksDefault,
    withTarget: false,
  });
  return [done(renderTemplate('GO-07', { objetivo: LABEL_BY_GOAL[type] ?? '' }))];
}

async function answerProposal(
  user: UserRecord,
  value: string,
  deps: GoalActionDeps,
): Promise<Reply[]> {
  const [, code, answer = ''] = PROPOSAL_VALUE.exec(value) ?? [];
  const proposed: GoalType | null = code === 'm' ? 'gain_muscle' : code === 'f' ? 'lose_fat' : null;
  const inputs = proposed ? await weightGoalInputs(withGoal(user, proposed), deps) : null;
  if (!inputs || user.settings.numberFreeMode) return [objectiveChooser(user)];
  const outcome = await resolveGoalProposal(inputs, answer, proposalAct(inputs.type), deps, user);
  if ('reply' in outcome) return [{ ...outcome.reply, edit: true }];
  const { targetKg, horizonWeeks } = outcome.accepted;
  const goal: GoalRecord = {
    userId: user.id,
    type: inputs.type,
    metric: 'weight_kg',
    startValue: inputs.weightKg,
    targetValue: targetKg,
    startDate: operationalDate(deps.clock(), user.timezone),
    horizonWeeks,
  };
  await switchGoal(user, goal, deps);
  await deps.events.emit('goal_set', subjectOf(user), {
    type: inputs.type,
    horizonWeeks,
    withTarget: true,
  });
  return [
    done(
      renderTemplate('GO-08', {
        objetivo: LABEL_BY_GOAL[inputs.type] ?? '',
        meta: formatKg(targetKg),
        semanas: horizonWeeks,
      }),
    ),
  ];
}

/**
 * [Mantener]: entra en mantenimiento; si ya está, solo repite GO-04/GO-05 (no
 * vuelve a centrar la zona ni a cambiar la intensidad que el usuario eligió).
 */
async function keepMaintaining(
  user: UserRecord,
  today: LocalDate,
  deps: GoalDeps,
): Promise<Reply[]> {
  const active = await deps.goals.active(user.id);
  if (active?.type !== 'maintain') {
    return [maintenanceReply(await enterMaintenanceMode(user, today, 'choice', deps))];
  }
  const sesiones = PARAMETERS.maintenance.minWeeklySessions;
  if (active.startValue === null || user.settings.numberFreeMode) {
    return [maintenanceReply({ templateId: 'GO-05', variables: { sesiones } })];
  }
  const band = maintenanceBand(active.startValue);
  return [
    maintenanceReply({
      templateId: 'GO-04',
      variables: { sesiones, bajo: formatKg(band.lowKg), alto: formatKg(band.highKg) },
    }),
  ];
}

/**
 * [Extender] y [Extender plazo]: P-001 semanas más al objetivo con meta activo, o
 * al que cerró parcial si no hay otro activo. El mantenimiento no se extiende.
 */
async function extend(user: UserRecord, deps: GoalDeps): Promise<Reply[]> {
  const extra = PARAMETERS.goal.horizonWeeksDefault;
  const active = await deps.goals.active(user.id);
  if (active?.type === 'maintain') return [];
  if (!active || !(await deps.goals.extendActive(user.id, extra))) {
    const latest = await deps.goals.latest(user.id);
    if (latest?.status !== 'partially_completed') return [];
    await deps.goals.activate({
      userId: latest.userId,
      type: latest.type,
      metric: latest.metric,
      startValue: latest.startValue,
      targetValue: latest.targetValue,
      startDate: latest.startDate,
      horizonWeeks: latest.horizonWeeks + extra,
    });
  }
  return [done(renderTemplate('GO-06', { semanas: extra }))];
}

/** GO-09: [Mover mi zona] [Nueva meta] [Está bien así]. */
function maintenanceOptions(): Reply {
  const [move = '', newGoal = '', fine = ''] = templateById('GO-09').buttons;
  return {
    text: renderTemplate('GO-09'),
    buttons: [button(move, gl('zone')), button(newGoal, gl('new')), button(fine, DISMISS)],
  };
}

/** [Mover mi zona]: la zona se centra en la media móvil actual (RN-MAN-002, RN-OBJ-010). */
async function moveZone(user: UserRecord, deps: GoalDeps): Promise<Reply[]> {
  if (user.settings.numberFreeMode) return [];
  const active = await deps.goals.active(user.id);
  const today = operationalDate(deps.clock(), user.timezone);
  const current =
    (await averageOn(user, today, deps)) ?? (await deps.bodyMeasurements.latestWeightKg(user.id));
  if (active?.type !== 'maintain' || current === null) return [];
  await deps.goals.activate({ ...active, startValue: current, targetValue: current });
  const band = maintenanceBand(current);
  return [
    done(renderTemplate('GO-10', { bajo: formatKg(band.lowKg), alto: formatKg(band.highKg) })),
  ];
}

/** Botones `gl` de GO-01 a GO-03, GO-09, MA-01 a MA-03 y de la propuesta de meta. */
export async function answerGoal(
  user: UserRecord,
  value: string,
  deps: GoalActionDeps,
): Promise<Reply[]> {
  const today = operationalDate(deps.clock(), user.timezone);
  if (value === 'keep') return keepMaintaining(user, today, deps);
  if (value === 'new') return [objectiveChooser(user)];
  if (value === 'ext') return extend(user, deps);
  if (value === 'adj') {
    return [(await weightProposal(user, user.profile.goalType, deps)) ?? objectiveChooser(user)];
  }
  if (value === 'opt') return [maintenanceOptions()];
  if (value === 'zone') return moveZone(user, deps);
  if (value.startsWith('p_')) return answerProposal(user, value.slice(2), deps);
  const type = value.startsWith('t_') ? (value.slice(2) as GoalType) : null;
  if (type && Object.values(GOAL_BY_LABEL).includes(type)) return chooseObjective(user, type, deps);
  return [];
}
