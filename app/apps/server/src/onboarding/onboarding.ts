import {
  PRIVACY_POLICY_VERSION,
  SCOFF_QUESTION_TEMPLATE_IDS,
  renderFoodBodyPositive,
  renderPreActivityPrompt,
  renderTemplate,
  templateById,
} from '@gymbro/content';
import {
  PARAMETERS,
  canCreateProfile,
  consentDecision,
  foodBodyScreeningOutcome,
  goalUsesWeight,
  isScoffPositive,
  nextOnboardingStep,
  preActivityScreeningOutcome,
  type GoalType,
  type OnboardingContext,
  type OnboardingStep,
  type PreActivityReport,
} from '@gymbro/domain';
import { encodeCallbackData, type CallbackAction } from '../bot/callback-data.js';
import type { ScreeningType, UserRecord } from '../ports/repositories.js';
import { reload, subjectOf, type OnboardingDeps } from './deps.js';
import {
  answerProfileStep,
  answerProfileText,
  goalWithoutWeightLossReply,
  profilePrompt,
  type StepOutcome,
} from './profile-steps.js';
import { plain, templateReply, type Reply } from './replies.js';
import { completeOnboarding } from './summary.js';

export type { OnboardingDeps } from './deps.js';
export { templateReply, type Button, type Reply } from './replies.js';

/**
 * Casos de uso del onboarding (SPEC-001, SPEC-009). Devuelven las respuestas que
 * el bot debe enviar; el adaptador de Telegram solo las traduce. Cada respuesta
 * se guarda al momento, así se puede retomar donde quedó (FR-001-01).
 */

const policyText = () =>
  renderTemplate('PV-01', { horas_borrado: PARAMETERS.data.deletionMaxHours });

const ob =
  (step: OnboardingStep) =>
  (value: string): CallbackAction => ({ action: 'ob', step, value });

// ── SCOFF: la cuenta viaja en el botón; las respuestas no se guardan ─────────

/** Valor de un botón del SCOFF: pregunta respondida, "sí" previos y respuesta. */
const SCOFF_VALUE = /^q([1-5])_([0-4])_(y|n)$/;

function scoffQuestion(index: number, yesSoFar: number): Reply {
  const id = SCOFF_QUESTION_TEMPLATE_IDS[index - 1];
  if (!id) throw new Error(`Pregunta del SCOFF fuera de rango: ${index}`);
  const { text, buttons } = templateById(id);
  return {
    text,
    buttons: buttons.map((label) => ({
      label,
      data: encodeCallbackData(
        ob('food_body_screening')(`q${index}_${yesSoFar}_${label === 'Sí' ? 'y' : 'n'}`),
      ),
    })),
  };
}

// ── Flujo ────────────────────────────────────────────────────────────────────

export function isOnboardingComplete(user: UserRecord): boolean {
  return user.onboarding.completedAt !== null;
}

/** Pregunta del paso en que está la persona. */
export async function onboardingPrompt(user: UserRecord, deps: OnboardingDeps): Promise<Reply[]> {
  const step = user.onboarding.step;
  switch (step) {
    case 'privacy':
      return [templateReply('ON-02', ob(step))];
    case 'age':
      return [templateReply('ON-03', ob(step))];
    case 'pre_activity_screening':
      return [templateReply('TZ-01', ob(step), renderPreActivityPrompt())];
    case 'food_body_screening':
      return [plain('TZ-05'), scoffQuestion(1, 0)];
    case 'summary':
      return [];
    default:
      return (await profilePrompt(step, user, deps)) ?? [];
  }
}

/** Lo que el flujo sabe de la persona para elegir el siguiente paso. */
async function contextFor(user: UserRecord, deps: OnboardingDeps): Promise<OnboardingContext> {
  const decided = await deps.consents.hasDecided(user.id);
  const granted = decided ? await deps.consents.grantedCategories(user.id) : [];
  return {
    consentGiven: decided ? granted.length > 0 : null,
    place: user.profile.place,
    goalUsesWeight: goalUsesWeight(user.profile.goalType),
    weightKg: await deps.bodyMeasurements.latestWeightKg(user.id),
    heightCm: user.profile.heightCm,
    numberFreeMode: user.settings.numberFreeMode,
  };
}

/** Marca el paso como hecho, guarda el siguiente y devuelve su pregunta (o el resumen). */
async function advance(
  user: UserRecord,
  from: OnboardingStep,
  deps: OnboardingDeps,
): Promise<Reply[]> {
  await deps.events.emit('onboarding_step_completed', subjectOf(user), { step: from });
  const fresh = await reload(user, deps);
  const next = nextOnboardingStep(from, await contextFor(fresh, deps)) ?? 'summary';
  await deps.users.setOnboardingStep(fresh.id, next);
  if (next === 'summary') return completeOnboarding(fresh, deps);
  return onboardingPrompt({ ...fresh, onboarding: { ...fresh.onboarding, step: next } }, deps);
}

async function settle(
  user: UserRecord,
  step: OnboardingStep,
  outcome: StepOutcome,
  deps: OnboardingDeps,
): Promise<Reply[]> {
  return outcome.done
    ? [...outcome.replies, ...(await advance(user, step, deps))]
    : outcome.replies;
}

/**
 * `/start`: bienvenida y aviso la primera vez. Si ya empezó y decidió sobre la
 * privacidad, ofrece continuar o empezar de nuevo (SPEC-001 §8).
 */
export async function startOnboarding(user: UserRecord, deps: OnboardingDeps): Promise<Reply[]> {
  if (!(await deps.consents.hasDecided(user.id))) {
    if (user.onboarding.step === 'privacy') {
      await deps.events.emit('onboarding_started', subjectOf(user));
      return [plain('ON-01'), ...(await onboardingPrompt(user, deps))];
    }
    return onboardingPrompt(user, deps);
  }
  return [templateReply('ON-25', (value) => ({ action: 'rs', value }))];
}

/** ON-25: continuar donde quedó o empezar de nuevo (sin repetir privacidad ni edad). */
export async function answerResume(
  user: UserRecord,
  value: string,
  deps: OnboardingDeps,
): Promise<Reply[]> {
  if (isOnboardingComplete(user)) return [];
  if (value !== 'restart') return onboardingPrompt(user, deps);
  const context = await contextFor(user, deps);
  const step = nextOnboardingStep('age', { ...context, place: null, heightCm: null }) ?? 'goal';
  await deps.users.restartOnboarding(user.id, step);
  // HU-009-1: sin autorización el objetivo sigue siendo ser constante.
  if (context.consentGiven === false) {
    await deps.users.updateProfile(user.id, { goalType: 'consistency' });
  }
  return onboardingPrompt(await reload(user, deps), deps);
}

/** Respuesta a un botón del onboarding. Un botón de otro paso repite la pregunta actual. */
export async function answerOnboarding(
  user: UserRecord,
  step: OnboardingStep,
  value: string,
  deps: OnboardingDeps,
): Promise<Reply[]> {
  if (isOnboardingComplete(user)) return [];
  if (step !== user.onboarding.step) return onboardingPrompt(user, deps);
  await deps.users.recordOnboardingInteraction(user.id, deps.clock());
  switch (step) {
    case 'privacy':
      return answerPrivacyStep(user, value, deps);
    case 'age':
      return answerAge(user, value, deps);
    case 'pre_activity_screening':
      return answerPreActivity(user, value, deps);
    case 'food_body_screening':
      return answerFoodBody(user, value, deps);
    default: {
      const outcome = await answerProfileStep(step, user, value, deps);
      return outcome ? settle(user, step, outcome, deps) : onboardingPrompt(user, deps);
    }
  }
}

/**
 * Texto durante el onboarding: el peso y la estatura se escriben; en cualquier
 * otro paso se repite la pregunta con sus botones (SPEC-001 §8).
 */
export async function answerOnboardingText(
  user: UserRecord,
  text: string,
  deps: OnboardingDeps,
): Promise<Reply[]> {
  const step = user.onboarding.step;
  const outcome = await answerProfileText(step, user, text, deps);
  if (!outcome) return onboardingPrompt(user, deps);
  await deps.users.recordOnboardingInteraction(user.id, deps.clock());
  return settle(user, step, outcome, deps);
}

// ── Privacidad (T-030) ───────────────────────────────────────────────────────

async function answerPrivacyStep(
  user: UserRecord,
  value: string,
  deps: OnboardingDeps,
): Promise<Reply[]> {
  if (value === 'policy') return [templateReply('PV-01', ob('privacy'), policyText())];
  if (value !== 'accept' && value !== 'decline') return onboardingPrompt(user, deps);
  const accepted = value === 'accept';
  await recordConsent(user, accepted, deps);
  // HU-009-1: sin autorización el objetivo es ser constante, sin preguntarlo.
  if (!accepted) await deps.users.updateProfile(user.id, { goalType: 'consistency' });
  return [...(accepted ? [] : [plain('ON-08')]), ...(await advance(user, 'privacy', deps))];
}

/** RN-DAT-001: guarda la decisión por categoría y emite su evento (sin texto). */
async function recordConsent(user: UserRecord, accepted: boolean, deps: OnboardingDeps) {
  const decision = consentDecision(accepted);
  await deps.consents.record({
    userId: user.id,
    ...decision,
    at: deps.clock(),
    policyVersion: PRIVACY_POLICY_VERSION,
  });
  await (accepted
    ? deps.events.emit('consent_given', subjectOf(user), { categories: [...decision.granted] })
    : deps.events.emit('consent_declined', subjectOf(user), {
        categories: [...decision.declined],
      }));
}

/** `/privacidad`: la política; durante el paso de privacidad sus botones son los del onboarding. */
export function privacyCommand(user: UserRecord): Reply {
  if (!isOnboardingComplete(user) && user.onboarding.step === 'privacy') {
    return templateReply('PV-01', ob('privacy'), policyText());
  }
  return templateReply('PV-01', (value) => ({ action: 'pv', value }), policyText());
}

/** Cambiar la decisión desde /privacidad (fuera del paso de privacidad). */
export async function answerPrivacy(
  user: UserRecord,
  value: string,
  deps: OnboardingDeps,
): Promise<Reply[]> {
  if (value !== 'accept' && value !== 'decline') return [privacyCommand(user)];
  const accepted = value === 'accept';
  await recordConsent(user, accepted, deps);
  return [plain(accepted ? 'PV-02' : 'PV-03')];
}

// ── Edad (T-031, RN-SEG-001) ─────────────────────────────────────────────────

async function answerAge(user: UserRecord, value: string, deps: OnboardingDeps) {
  if (value !== 'yes' && value !== 'no') return onboardingPrompt(user, deps);
  if (!canCreateProfile({ declaredAdult: value === 'yes' })) {
    // No se crea el perfil: se borra lo guardado hasta ahora y el evento queda sin seudónimo.
    await deps.eraser.eraseUser(user.id);
    await deps.events.emit('age_gate_failed', null);
    return [plain('ON-04')];
  }
  await deps.users.confirmAdult(user.id, deps.clock());
  return advance(user, 'age', deps);
}

// ── Tamizajes (T-031, RN-SEG-002, RN-SEG-003) ────────────────────────────────

async function recordScreening(
  user: UserRecord,
  type: ScreeningType,
  result: 'clear' | 'flag' | 'not_done',
  deps: OnboardingDeps,
) {
  const mayStore = (await deps.consents.grantedCategories(user.id)).includes('screening');
  if (result !== 'not_done' && mayStore) {
    await deps.screenings.record({ userId: user.id, type, result, at: deps.clock() });
  }
  await deps.events.emit('screening_completed', subjectOf(user), { type, result });
}

const screeningAction = (value: string): CallbackAction => ({ action: 'sc', value });

/** Aplica el resultado del PAR-Q+ y devuelve el mensaje que corresponde (si hay). */
async function applyPreActivity(
  user: UserRecord,
  report: PreActivityReport,
  deps: OnboardingDeps,
): Promise<Reply[]> {
  const outcome = preActivityScreeningOutcome({ report, authorizationConfirmed: false });
  await deps.users.updateSettings(user.id, {
    lowIntensityStart: outcome.planIntensity === 'low',
  });
  await recordScreening(user, 'pre_activity', outcome.result ?? 'not_done', deps);
  if (report === 'some_yes') return [templateReply('TZ-02', screeningAction)];
  if (report === 'not_done') return [templateReply('TZ-03', screeningAction)];
  return [];
}

function isPreActivityReport(value: string): value is PreActivityReport {
  return value === 'all_no' || value === 'some_yes' || value === 'not_done';
}

async function answerPreActivity(user: UserRecord, value: string, deps: OnboardingDeps) {
  if (!isPreActivityReport(value)) return onboardingPrompt(user, deps);
  return [
    ...(await applyPreActivity(user, value, deps)),
    ...(await advance(user, 'pre_activity_screening', deps)),
  ];
}

/**
 * Botones de TZ-02 y TZ-03, válidos también después del onboarding: confirmar la
 * autorización médica, o contar el resultado del PAR-Q+ hecho más tarde.
 */
export async function answerScreening(
  user: UserRecord,
  value: string,
  deps: OnboardingDeps,
): Promise<Reply[]> {
  if (value === 'authorized') {
    await deps.users.updateSettings(user.id, { lowIntensityStart: false });
    return [plain('TZ-04')];
  }
  if (value === 'all_no') {
    await applyPreActivity(user, 'all_no', deps);
    return [plain('TZ-04')];
  }
  if (value === 'some_yes') return applyPreActivity(user, 'some_yes', deps);
  return [];
}

async function answerFoodBody(user: UserRecord, value: string, deps: OnboardingDeps) {
  // ON-21: nuevo objetivo tras un SCOFF positivo con objetivo de perder grasa (RN-SEG-003).
  const chosen = /^g_([a-z_]+)$/.exec(value)?.[1] as GoalType | undefined;
  if (chosen) {
    const allowed = foodBodyScreeningOutcome(true).allowedGoalTypes;
    if (!allowed.includes(chosen) || user.profile.goalType !== 'lose_fat') {
      return [goalWithoutWeightLossReply(allowed)];
    }
    await deps.users.updateProfile(user.id, { goalType: chosen });
    return advance(user, 'food_body_screening', deps);
  }

  const match = SCOFF_VALUE.exec(value);
  const index = Number(match?.[1]);
  const yesBefore = Number(match?.[2]);
  if (!match || yesBefore > index - 1) return onboardingPrompt(user, deps);
  const yes = yesBefore + (match[3] === 'y' ? 1 : 0);
  if (index < SCOFF_QUESTION_TEMPLATE_IDS.length) return [scoffQuestion(index + 1, yes)];

  const positive = isScoffPositive(yes);
  const outcome = foodBodyScreeningOutcome(positive);
  await deps.users.updateSettings(user.id, { numberFreeMode: outcome.numberFreeMode });
  await recordScreening(user, 'food_body', positive ? 'flag' : 'clear', deps);
  if (positive) await deps.events.emit('number_free_mode_enabled', subjectOf(user));
  const resources = outcome.showProfessionalResources
    ? [{ text: renderFoodBodyPositive(), buttons: [] }]
    : [];
  if (positive && !outcome.allowedGoalTypes.includes(user.profile.goalType ?? 'consistency')) {
    return [...resources, goalWithoutWeightLossReply(outcome.allowedGoalTypes)];
  }
  return [...resources, ...(await advance(user, 'food_body_screening', deps))];
}
