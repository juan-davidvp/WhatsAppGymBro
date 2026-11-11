import { renderTemplate, templateById } from '@gymbro/content';
import { PARAMETERS, operationalDate, weightGoalOffers, type GoalType } from '@gymbro/domain';
import type { CallbackAction } from '../bot/callback-data.js';
import {
  goalProposalReply,
  resolveGoalProposal,
  weightGoalInputs,
} from '../onboarding/profile-steps.js';
import { formatKg } from '../progress/progress-screen.js';
import { GOAL_BY_LABEL, button, type Reply } from '../onboarding/replies.js';
import { METRIC_BY_GOAL } from '../onboarding/summary.js';
import type { UserRecord } from '../ports/repositories.js';
import {
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

const gl = (value: string): CallbackAction => ({ action: 'gl', value });
const proposalAct = (value: string) => gl(`p_${value}`);
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

/** Propuesta de meta de peso (ON-06) para el objetivo del perfil, o null si no aplica. */
async function weightProposal(user: UserRecord, deps: GoalDeps): Promise<Reply | null> {
  if (user.settings.numberFreeMode) return null;
  const inputs = await weightGoalInputs(user, deps);
  if (!inputs) return null;
  return { ...goalProposalReply(weightGoalOffers(inputs).proposal, proposalAct), edit: true };
}

async function chooseObjective(user: UserRecord, type: GoalType, deps: GoalDeps): Promise<Reply[]> {
  const today = operationalDate(deps.clock(), user.timezone);
  if (type === 'maintain') {
    return [maintenanceReply(await enterMaintenanceMode(user, today, 'choice', deps))];
  }
  await deps.users.updateProfile(user.id, { goalType: type });
  const updated: UserRecord = { ...user, profile: { ...user.profile, goalType: type } };
  const proposal = await weightProposal(updated, deps);
  if (proposal) return [proposal];
  await deps.goals.activate({
    userId: user.id,
    type,
    metric: METRIC_BY_GOAL[type],
    startValue: null,
    targetValue: null,
    startDate: today,
    horizonWeeks: PARAMETERS.goal.horizonWeeksDefault,
  });
  await deps.events.emit('goal_set', subjectOf(user), {
    type,
    horizonWeeks: PARAMETERS.goal.horizonWeeksDefault,
    withTarget: false,
  });
  return [done(renderTemplate('GO-07', { objetivo: LABEL_BY_GOAL[type] ?? '' }))];
}

async function answerProposal(user: UserRecord, value: string, deps: GoalDeps): Promise<Reply[]> {
  const inputs = await weightGoalInputs(user, deps);
  if (!inputs || user.settings.numberFreeMode) return [objectiveChooser(user)];
  const outcome = await resolveGoalProposal(inputs, value, proposalAct, deps, user);
  if ('reply' in outcome) return [{ ...outcome.reply, edit: true }];
  const { targetKg, horizonWeeks } = outcome.accepted;
  await deps.goals.activate({
    userId: user.id,
    type: inputs.type,
    metric: 'weight_kg',
    startValue: inputs.weightKg,
    targetValue: targetKg,
    startDate: operationalDate(deps.clock(), user.timezone),
    horizonWeeks,
  });
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

/** [Extender] y [Extender plazo]: P-001 semanas más (el activo, o el que cerró parcial). */
async function extend(user: UserRecord, deps: GoalDeps): Promise<Reply[]> {
  const extra = PARAMETERS.goal.horizonWeeksDefault;
  if (!(await deps.goals.extendActive(user.id, extra))) {
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

/** [Mover mi zona]: la zona se centra en el peso actual (RN-MAN-002). */
async function moveZone(user: UserRecord, deps: GoalDeps): Promise<Reply[]> {
  const active = await deps.goals.active(user.id);
  const current = await deps.bodyMeasurements.latestWeightKg(user.id);
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
  deps: GoalDeps,
): Promise<Reply[]> {
  const today = operationalDate(deps.clock(), user.timezone);
  if (value === 'keep') {
    return [maintenanceReply(await enterMaintenanceMode(user, today, 'choice', deps))];
  }
  if (value === 'new') return [objectiveChooser(user)];
  if (value === 'ext') return extend(user, deps);
  if (value === 'adj') return [(await weightProposal(user, deps)) ?? objectiveChooser(user)];
  if (value === 'opt') return [maintenanceOptions()];
  if (value === 'zone') return moveZone(user, deps);
  if (value.startsWith('p_')) return answerProposal(user, value.slice(2), deps);
  const type = value.startsWith('t_') ? (value.slice(2) as GoalType) : null;
  if (type && Object.values(GOAL_BY_LABEL).includes(type)) return chooseObjective(user, type, deps);
  return [];
}
