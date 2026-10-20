import {
  HOME_EQUIPMENT_OPTIONS,
  WEEKDAY_BUTTON_LABELS,
  renderTemplate,
  templateById,
} from '@gymbro/content';
import {
  PARAMETERS,
  WEEK_DAYS,
  experienceLevelFor,
  isPlausibleHeightCm,
  isPlausibleWeightKg,
  isSafeWeightGoal,
  mayAskFor,
  operationalDate,
  trainingDaysFor,
  weightGoalOffers,
  type GoalType,
  type Intensity,
  type OnboardingStep,
  type TrainingExperience,
  type TrainingPlace,
  type WeightGoalOffer,
} from '@gymbro/domain';
import type { CallbackAction } from '../bot/callback-data.js';
import type { TimeSlot, UserRecord } from '../ports/repositories.js';
import { subjectOf, type OnboardingDeps } from './deps.js';
import { GOAL_BY_LABEL, button, buttonValue, plain, templateReply, type Reply } from './replies.js';

/**
 * Pasos del perfil del onboarding (T-032, SPEC-001 HU-001-1 a 5): objetivo, nivel,
 * días, franja, lugar, minutos, equipamiento, peso, estatura, meta, intensidad y
 * horas de silencio. Cada respuesta se guarda al momento (FR-001-01: reanudar).
 * Devuelven la respuesta y si el paso quedó hecho; `onboarding.ts` avanza.
 */

export interface StepOutcome {
  readonly replies: Reply[];
  readonly done: boolean;
}

const stay = (...replies: Reply[]): StepOutcome => ({ replies, done: false });
const done = (...replies: Reply[]): StepOutcome => ({ replies, done: true });

const ob =
  (step: OnboardingStep) =>
  (value: string): CallbackAction => ({ action: 'ob', step, value });

// ── Formatos ─────────────────────────────────────────────────────────────────

/** Una cifra decimal con coma (plantillas §3: metas en kg). */
export function formatKg(kg: number): string {
  return `${kg.toFixed(1).replace('.', ',')} kg`;
}

/** "lunes, miércoles y viernes". */
export function joinSpanish(items: readonly string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items.at(-1) ?? ''}`;
}

/** Número escrito por el usuario: "72,5", "72.5", "72 kg", "175 cm". */
export function parseNumber(text: string): number | null {
  const match = /^\s*(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:kg|kilos?|cm|cms)?\s*$/i.exec(text);
  return match?.[1] ? Number(match[1].replace(',', '.')) : null;
}

// ── Selección múltiple (días y equipamiento): la selección viaja en el botón ──

function toggleButtons(
  step: OnboardingStep,
  labels: readonly string[],
  mask: number,
): Reply['buttons'] {
  return [
    ...labels.map((label, i) =>
      button(mask & (1 << i) ? `✅ ${label}` : label, {
        action: 'ob',
        step,
        value: `t${mask}_${i}`,
      }),
    ),
    button('Listo', { action: 'ob', step, value: `ok${mask}` }),
  ];
}

/** `t<máscara>_<índice>` alterna una opción; `ok<máscara>` confirma. */
function parseToggle(
  value: string,
  count: number,
): { kind: 'toggle'; mask: number } | { kind: 'ok'; mask: number } | null {
  const limit = 1 << count;
  const toggle = /^t(\d+)_(\d)$/.exec(value);
  if (toggle) {
    const mask = Number(toggle[1]);
    const index = Number(toggle[2]);
    if (mask >= limit || index >= count) return null;
    return { kind: 'toggle', mask: mask ^ (1 << index) };
  }
  const ok = /^ok(\d+)$/.exec(value);
  if (ok && Number(ok[1]) < limit) return { kind: 'ok', mask: Number(ok[1]) };
  return null;
}

function maskOf<T>(all: readonly T[], selected: readonly T[]): number {
  return all.reduce((mask, item, i) => (selected.includes(item) ? mask | (1 << i) : mask), 0);
}

function fromMask<T>(all: readonly T[], mask: number): T[] {
  return all.filter((_, i) => mask & (1 << i));
}

const daysRange = PARAMETERS.plan.availableDaysRange;
const daysVariables = { min_dias: daysRange.min, max_dias: daysRange.max };

function daysPrompt(mask: number, edit = false): Reply {
  return {
    text: renderTemplate('ON-10', daysVariables),
    buttons: toggleButtons('days', WEEKDAY_BUTTON_LABELS, mask),
    edit,
    rowSize: WEEKDAY_BUTTON_LABELS.length,
  };
}

function equipmentPrompt(mask: number, edit = false): Reply {
  return {
    text: renderTemplate('ON-16'),
    buttons: toggleButtons('equipment', HOME_EQUIPMENT_OPTIONS, mask),
    edit,
    rowSize: 2,
  };
}

// ── Preguntas ────────────────────────────────────────────────────────────────

const slots = PARAMETERS.habit.timeSlotStarts;

export function quietHoursLabel(range: { start: string; end: string }): string {
  return `${range.start}–${range.end}`;
}

function goalProposalReply(offer: WeightGoalOffer): Reply {
  const [accept, conservative, ambitious] = templateById('ON-06').buttons;
  return {
    text: renderTemplate('ON-06', {
      meta: formatKg(offer.targetKg),
      semanas: offer.horizonWeeks,
    }),
    buttons: [
      button(accept ?? '', ob('goal_proposal')(acceptValue(offer))),
      button(conservative ?? '', ob('goal_proposal')(buttonValue('ON-06', conservative ?? ''))),
      button(ambitious ?? '', ob('goal_proposal')(buttonValue('ON-06', ambitious ?? ''))),
    ],
  };
}

/** `ok_<décimas de kg>_<semanas>`: la meta viaja en el botón y se revalida al guardarla. */
function acceptValue(offer: WeightGoalOffer): string {
  return `ok_${Math.round(offer.targetKg * 10)}_${offer.horizonWeeks}`;
}

async function weightGoalInputs(user: UserRecord, deps: OnboardingDeps) {
  const type = user.profile.goalType;
  const weightKg = await deps.bodyMeasurements.latestWeightKg(user.id);
  const heightCm = user.profile.heightCm;
  if ((type !== 'lose_fat' && type !== 'gain_muscle') || weightKg === null || heightCm === null) {
    return null;
  }
  return { type, weightKg, heightCm };
}

/** Pregunta del paso; null si no es un paso del perfil. */
export async function profilePrompt(
  step: OnboardingStep,
  user: UserRecord,
  deps: OnboardingDeps,
): Promise<Reply[] | null> {
  switch (step) {
    case 'goal':
      return [templateReply('ON-05', ob(step))];
    case 'level':
      return [templateReply('ON-09', ob(step))];
    case 'days':
      return [daysPrompt(maskOf(WEEK_DAYS, user.profile.availableDays))];
    case 'time':
      return [
        templateReply(
          'ON-13',
          ob(step),
          renderTemplate('ON-13', {
            manana: slots.morning,
            mediodia: slots.midday,
            tarde: slots.afternoon,
            noche: slots.evening,
          }),
        ),
      ];
    case 'place':
      return [templateReply('ON-14', ob(step))];
    case 'minutes':
      return [
        {
          text: renderTemplate('ON-15'),
          buttons: PARAMETERS.plan.sessionMinutesOptions.map((n) =>
            button(`${n} min`, ob(step)(`m${n}`)),
          ),
          rowSize: PARAMETERS.plan.sessionMinutesOptions.length,
        },
      ];
    case 'equipment':
      return [equipmentPrompt(maskOf(HOME_EQUIPMENT_OPTIONS, user.profile.homeEquipment))];
    case 'weight':
      return [templateReply('ON-17', ob(step))];
    case 'height':
      return [templateReply('ON-18', ob(step))];
    case 'goal_proposal': {
      const inputs = await weightGoalInputs(user, deps);
      return inputs ? [goalProposalReply(weightGoalOffers(inputs).proposal)] : [];
    }
    case 'message_intensity':
      return [templateReply('ON-22', ob(step))];
    case 'quiet_hours':
      return [
        {
          text: renderTemplate('ON-23', {
            inicio: user.settings.quietHours.start,
            fin: user.settings.quietHours.end,
          }),
          buttons: [
            button('Me sirve', ob(step)('q0')),
            ...PARAMETERS.messages.quietHoursOptions.map((range, i) =>
              button(quietHoursLabel(range), ob(step)(`q${i + 1}`)),
            ),
          ],
        },
      ];
    default:
      return null;
  }
}

// ── Respuestas con botones ───────────────────────────────────────────────────

const GOAL_TYPES = Object.values(GOAL_BY_LABEL);
const TIME_SLOTS: readonly TimeSlot[] = ['morning', 'midday', 'afternoon', 'evening'];
const PLACES: readonly TrainingPlace[] = ['gym', 'home', 'both'];
const EXPERIENCE: readonly TrainingExperience[] = ['never', 'under_6_months', 'six_months_plus'];
const INTENSITY_BY_VALUE: Readonly<Record<string, Intensity>> = {
  low: 'LOW',
  normal: 'NORMAL',
  high: 'HIGH',
};

/** Respuesta a un botón de un paso del perfil; null si no es un paso del perfil. */
export async function answerProfileStep(
  step: OnboardingStep,
  user: UserRecord,
  value: string,
  deps: OnboardingDeps,
): Promise<StepOutcome | null> {
  const again = async () => stay(...((await profilePrompt(step, user, deps)) ?? []));
  switch (step) {
    case 'goal': {
      if (!GOAL_TYPES.includes(value as GoalType)) return again();
      await deps.users.updateProfile(user.id, { goalType: value as GoalType });
      return done();
    }
    case 'level': {
      if (!EXPERIENCE.includes(value as TrainingExperience)) return again();
      const level = experienceLevelFor(value as TrainingExperience);
      await deps.users.updateProfile(user.id, { level });
      return done();
    }
    case 'days':
      return answerDays(user, value, deps);
    case 'time': {
      if (!TIME_SLOTS.includes(value as TimeSlot)) return again();
      await deps.users.updateProfile(user.id, { timeSlot: value as TimeSlot });
      return done();
    }
    case 'place': {
      if (!PLACES.includes(value as TrainingPlace)) return again();
      const place = value as TrainingPlace;
      await deps.users.updateProfile(user.id, {
        place,
        ...(place === 'gym' ? { homeEquipment: [] } : {}),
      });
      return done();
    }
    case 'minutes': {
      const minutes = Number(/^m(\d+)$/.exec(value)?.[1]);
      if (!(PARAMETERS.plan.sessionMinutesOptions as readonly number[]).includes(minutes)) {
        return again();
      }
      await deps.users.updateProfile(user.id, { sessionMinutes: minutes });
      return done();
    }
    case 'equipment': {
      const parsed = parseToggle(value, HOME_EQUIPMENT_OPTIONS.length);
      if (!parsed) return again();
      if (parsed.kind === 'toggle') return stay(equipmentPrompt(parsed.mask, true));
      await deps.users.updateProfile(user.id, {
        homeEquipment: fromMask(HOME_EQUIPMENT_OPTIONS, parsed.mask),
      });
      return done();
    }
    case 'weight':
    case 'height':
      return answerMeasurementButton(step, user, value, deps);
    case 'goal_proposal':
      return answerGoalProposal(user, value, deps);
    case 'message_intensity': {
      const intensity = INTENSITY_BY_VALUE[value];
      if (!intensity) return again();
      await deps.users.updateSettings(user.id, { intensity });
      return done();
    }
    case 'quiet_hours': {
      const index = Number(/^q(\d)$/.exec(value)?.[1]);
      const options = [user.settings.quietHours, ...PARAMETERS.messages.quietHoursOptions];
      const quietHours = Number.isInteger(index) ? options[index] : undefined;
      if (!quietHours) return again();
      await deps.users.updateSettings(user.id, { quietHours });
      return done();
    }
    default:
      return null;
  }
}

async function answerDays(
  user: UserRecord,
  value: string,
  deps: OnboardingDeps,
): Promise<StepOutcome> {
  const parsed = parseToggle(value, WEEK_DAYS.length);
  if (!parsed) return stay(daysPrompt(maskOf(WEEK_DAYS, user.profile.availableDays)));
  if (parsed.kind === 'toggle') return stay(daysPrompt(parsed.mask, true));
  const days = fromMask(WEEK_DAYS, parsed.mask);
  // RN-PLAN-001 (P-074): entre el mínimo y el máximo de días disponibles.
  if (days.length < daysRange.min || days.length > daysRange.max) {
    return stay(plain('ON-11', daysVariables));
  }
  await deps.users.updateProfile(user.id, { availableDays: days });
  // SPEC-001 §8 y RN-PLAN-004: un novato con muchos días entrena menos y se le explica.
  const level = user.profile.level ?? 'novice';
  const training = trainingDaysFor(level, days.length);
  return done(...(training < days.length ? [plain('ON-12', { dias_entreno: training })] : []));
}

// ── Peso y estatura (texto o botón) ──────────────────────────────────────────

const MEASUREMENT = {
  weight: { example: '72,5', isPlausible: isPlausibleWeightKg, unit: 'kg' },
  height: { example: '175', isPlausible: isPlausibleHeightCm, unit: 'cm' },
} as const;

async function saveMeasurement(
  step: 'weight' | 'height',
  user: UserRecord,
  value: number,
  deps: OnboardingDeps,
): Promise<StepOutcome> {
  // RN-DAT-001: solo con autorización de medidas corporales.
  if (!mayAskFor('body_measurements', await deps.consents.grantedCategories(user.id))) {
    return done();
  }
  if (step === 'weight') {
    const date = operationalDate(deps.clock(), user.timezone);
    await deps.bodyMeasurements.recordWeight(user.id, date, value);
    await deps.events.emit('weight_logged', subjectOf(user), { source: 'onboarding' });
  } else {
    await deps.users.updateProfile(user.id, { heightCm: value });
  }
  return done();
}

async function answerMeasurementButton(
  step: 'weight' | 'height',
  user: UserRecord,
  value: string,
  deps: OnboardingDeps,
): Promise<StepOutcome> {
  if (value === 'skip') return done();
  // ON-19: confirmación de un valor fuera del rango plausible (`c<décimas>`).
  const confirmed = /^c(\d{1,5})$/.exec(value);
  if (confirmed) return saveMeasurement(step, user, Number(confirmed[1]) / 10, deps);
  return stay(...((await profilePrompt(step, user, deps)) ?? []));
}

/** Respuesta escrita al peso o la estatura; null si el paso no admite texto. */
export async function answerProfileText(
  step: OnboardingStep,
  user: UserRecord,
  text: string,
  deps: OnboardingDeps,
): Promise<StepOutcome | null> {
  if (step !== 'weight' && step !== 'height') return null;
  const { example, isPlausible, unit } = MEASUREMENT[step];
  const value = parseNumber(text);
  const skip = (label: string) => button(label, ob(step)('skip'));
  if (value === null || value <= 0) {
    const [label] = templateById('ON-20').buttons;
    return stay({
      text: renderTemplate('ON-20', { ejemplo: example }),
      buttons: [skip(label ?? '')],
    });
  }
  if (!isPlausible(value)) {
    const [label] = templateById('ON-19').buttons;
    const shown = `${String(value).replace('.', ',')} ${unit}`;
    return stay({
      text: renderTemplate('ON-19', { valor: shown }),
      buttons: [button(label ?? '', ob(step)(`c${Math.round(value * 10)}`))],
    });
  }
  return saveMeasurement(step, user, value, deps);
}

// ── Meta de peso (HU-001-2) ──────────────────────────────────────────────────

async function answerGoalProposal(
  user: UserRecord,
  value: string,
  deps: OnboardingDeps,
): Promise<StepOutcome> {
  const inputs = await weightGoalInputs(user, deps);
  if (!inputs) return done();
  const offers = weightGoalOffers(inputs);
  const subject = subjectOf(user);

  const accepted = /^ok_(\d{1,5})_(\d{1,2})$/.exec(value);
  if (accepted) {
    const goal = { targetKg: Number(accepted[1]) / 10, horizonWeeks: Number(accepted[2]) };
    // RN-OBJ-004 y RN-OBJ-005: la meta del botón se revalida; una insegura no se guarda.
    if (!isSafeWeightGoal({ ...inputs, ...goal })) {
      return stay(goalProposalReply(offers.proposal));
    }
    await deps.goals.activate({
      userId: user.id,
      type: inputs.type,
      metric: 'weight_kg',
      startValue: inputs.weightKg,
      targetValue: goal.targetKg,
      startDate: operationalDate(deps.clock(), user.timezone),
      horizonWeeks: goal.horizonWeeks,
    });
    await deps.events.emit('goal_set', subject, {
      type: inputs.type,
      horizonWeeks: goal.horizonWeeks,
      withTarget: true,
    });
    return done();
  }
  if (value === 'cons') {
    await deps.events.emit('goal_adjusted', subject, {
      direction: 'conservative',
      limited: false,
    });
    return stay(goalProposalReply(offers.conservative));
  }
  if (value === 'amb') {
    const { ambitious } = offers;
    await deps.events.emit('goal_adjusted', subject, {
      direction: 'ambitious',
      limited: !('safe' in ambitious),
    });
    if ('safe' in ambitious) return stay(goalProposalReply(ambitious.safe));
    const [option1, option2] = templateById('ON-07').buttons;
    return stay({
      text: renderTemplate('ON-07', {
        meta_segura: formatKg(ambitious.saferTarget.targetKg),
        semanas: ambitious.saferTarget.horizonWeeks,
        semanas_largas: `${ambitious.longer.horizonWeeks} semanas`,
      }),
      buttons: [
        button(option1 ?? '', ob('goal_proposal')(acceptValue(ambitious.saferTarget))),
        button(option2 ?? '', ob('goal_proposal')(acceptValue(ambitious.longer))),
      ],
    });
  }
  return stay(goalProposalReply(offers.proposal));
}

/** ON-21 (RN-SEG-003): objetivos permitidos tras un SCOFF positivo, sin perder grasa. */
export function goalWithoutWeightLossReply(allowed: readonly GoalType[]): Reply {
  return {
    text: renderTemplate('ON-21'),
    buttons: templateById('ON-05')
      .buttons.filter((label) => {
        const type = GOAL_BY_LABEL[label];
        return type !== undefined && allowed.includes(type);
      })
      .map((label) => button(label, ob('food_body_screening')(`g_${GOAL_BY_LABEL[label] ?? ''}`))),
  };
}
