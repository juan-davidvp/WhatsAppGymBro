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
  isScoffPositive,
  nextOnboardingStep,
  preActivityScreeningOutcome,
  type OnboardingContext,
  type OnboardingStep,
  type PreActivityReport,
} from '@gymbro/domain';
import { encodeCallbackData, type CallbackAction } from '../bot/callback-data.js';
import type { EventEmitter, EventSubject } from '../events/emitter.js';
import type {
  ConsentsRepository,
  ScreeningType,
  ScreeningsRepository,
  UserDataEraser,
  UserRecord,
  UsersRepository,
} from '../ports/repositories.js';

/**
 * Casos de uso del onboarding (SPEC-001, SPEC-009). Devuelven las respuestas que
 * el bot debe enviar; el adaptador de Telegram solo las traduce. Los textos salen
 * del paquete `content` por ID.
 */

export interface Button {
  readonly label: string;
  readonly data: string;
}

export interface Reply {
  readonly text: string;
  readonly buttons: readonly Button[];
}

export interface OnboardingDeps {
  users: UsersRepository;
  consents: ConsentsRepository;
  screenings: ScreeningsRepository;
  eraser: UserDataEraser;
  events: EventEmitter;
  clock: () => Date;
}

/** Valor de cada botón de las plantillas, por su texto en la bóveda. */
const BUTTON_VALUES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  'ON-02': { Acepto: 'accept', 'Ver política': 'policy', 'No acepto': 'decline' },
  'PV-01': { Acepto: 'accept', 'No acepto': 'decline' },
  'ON-03': { Sí: 'yes', No: 'no' },
  'TZ-01': { 'Todo NO': 'all_no', 'Algún SÍ': 'some_yes', 'No lo hice': 'not_done' },
  'TZ-02': { 'Ya tengo autorización': 'authorized' },
  'TZ-03': { 'Todo NO': 'all_no', 'Algún SÍ': 'some_yes' },
  'BD-01': { 'Sí, borrar': 'confirm', Cancelar: 'cancel' },
  'BD-02': { 'Borrar todo': 'erase', Cancelar: 'cancel' },
};

/** Respuesta con la plantilla y sus botones; cada botón lleva su valor. */
export function templateReply(
  id: string,
  toAction: (value: string, label: string) => CallbackAction,
  text: string = renderTemplate(id),
): Reply {
  const values = BUTTON_VALUES[id] ?? {};
  const buttons = templateById(id).buttons.map((label) => {
    const value = values[label];
    if (!value) throw new Error(`Botón sin valor: ${id} · ${label}`);
    return { label, data: encodeCallbackData(toAction(value, label)) };
  });
  return { text, buttons };
}

function plain(id: string): Reply {
  return { text: renderTemplate(id), buttons: [] };
}

const policyText = () =>
  renderTemplate('PV-01', { horas_borrado: PARAMETERS.data.deletionMaxHours });

const subjectOf = (user: UserRecord): EventSubject => ({
  userId: user.id,
  timezone: user.timezone,
});

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
      data: encodeCallbackData({
        action: 'ob',
        step: 'food_body_screening',
        value: `q${index}_${yesSoFar}_${label === 'Sí' ? 'y' : 'n'}`,
      }),
    })),
  };
}

/** Pregunta de cada paso; vacío si el paso aún no tiene pantalla (llega con su tarea). */
export function promptFor(step: OnboardingStep): Reply[] {
  const ob = (value: string): CallbackAction => ({ action: 'ob', step, value });
  switch (step) {
    case 'privacy':
      return [templateReply('ON-02', ob)];
    case 'age':
      return [templateReply('ON-03', ob)];
    case 'pre_activity_screening':
      return [templateReply('TZ-01', ob, renderPreActivityPrompt())];
    case 'food_body_screening':
      return [plain('TZ-05'), scoffQuestion(1, 0)];
    default:
      return [];
  }
}

export function isOnboardingComplete(user: UserRecord): boolean {
  return user.onboarding.completedAt !== null;
}

/** Lo que el flujo sabe de la persona para elegir el siguiente paso. */
async function contextFor(user: UserRecord, deps: OnboardingDeps): Promise<OnboardingContext> {
  const decided = await deps.consents.hasDecided(user.id);
  const granted = decided ? await deps.consents.grantedCategories(user.id) : [];
  // Objetivo, lugar y peso llegan con T-032.
  return {
    consentGiven: decided ? granted.length > 0 : null,
    place: null,
    goalUsesWeight: false,
    weightKg: null,
  };
}

/** Marca el paso como hecho, guarda el siguiente y devuelve su pregunta. */
async function advance(
  user: UserRecord,
  from: OnboardingStep,
  deps: OnboardingDeps,
): Promise<Reply[]> {
  await deps.events.emit('onboarding_step_completed', subjectOf(user), { step: from });
  const next = nextOnboardingStep(from, await contextFor(user, deps)) ?? 'summary';
  await deps.users.setOnboardingStep(user.id, next);
  return promptFor(next);
}

/** `/start`: bienvenida y aviso la primera vez; si ya empezó, retoma su paso. */
export async function startOnboarding(user: UserRecord, deps: OnboardingDeps): Promise<Reply[]> {
  if (user.onboarding.step === 'privacy' && !(await deps.consents.hasDecided(user.id))) {
    await deps.events.emit('onboarding_started', subjectOf(user));
    return [plain('ON-01'), ...promptFor('privacy')];
  }
  return promptFor(user.onboarding.step);
}

/** Respuesta a un botón del onboarding. Un botón de otro paso repite la pregunta actual. */
export async function answerOnboarding(
  user: UserRecord,
  step: OnboardingStep,
  value: string,
  deps: OnboardingDeps,
): Promise<Reply[]> {
  if (isOnboardingComplete(user) || step !== user.onboarding.step) {
    return promptFor(user.onboarding.step);
  }
  switch (step) {
    case 'privacy':
      return answerPrivacyStep(user, value, deps);
    case 'age':
      return answerAge(user, value, deps);
    case 'pre_activity_screening':
      return answerPreActivity(user, value, deps);
    case 'food_body_screening':
      return answerFoodBody(user, value, deps);
    default:
      return promptFor(step);
  }
}

// ── Privacidad (T-030) ───────────────────────────────────────────────────────

async function answerPrivacyStep(
  user: UserRecord,
  value: string,
  deps: OnboardingDeps,
): Promise<Reply[]> {
  const ob = (v: string): CallbackAction => ({ action: 'ob', step: 'privacy', value: v });
  if (value === 'policy') return [templateReply('PV-01', ob, policyText())];
  if (value !== 'accept' && value !== 'decline') return promptFor('privacy');
  const accepted = value === 'accept';
  await recordConsent(user, accepted, deps);
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
    return templateReply(
      'PV-01',
      (value) => ({ action: 'ob', step: 'privacy', value }),
      policyText(),
    );
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
  if (value !== 'yes' && value !== 'no') return promptFor('age');
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

async function mayStoreScreening(user: UserRecord, deps: OnboardingDeps): Promise<boolean> {
  return (await deps.consents.grantedCategories(user.id)).includes('screening');
}

async function recordScreening(
  user: UserRecord,
  type: ScreeningType,
  result: 'clear' | 'flag' | 'not_done',
  deps: OnboardingDeps,
) {
  if (result !== 'not_done' && (await mayStoreScreening(user, deps))) {
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
  if (!isPreActivityReport(value)) return promptFor('pre_activity_screening');
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
  const match = SCOFF_VALUE.exec(value);
  const index = Number(match?.[1]);
  const yesBefore = Number(match?.[2]);
  if (!match || yesBefore > index - 1) return promptFor('food_body_screening');
  const yes = yesBefore + (match[3] === 'y' ? 1 : 0);
  if (index < SCOFF_QUESTION_TEMPLATE_IDS.length) return [scoffQuestion(index + 1, yes)];

  const positive = isScoffPositive(yes);
  const outcome = foodBodyScreeningOutcome(positive);
  await deps.users.updateSettings(user.id, { numberFreeMode: outcome.numberFreeMode });
  await recordScreening(user, 'food_body', positive ? 'flag' : 'clear', deps);
  if (positive) await deps.events.emit('number_free_mode_enabled', subjectOf(user));
  return [
    ...(outcome.showProfessionalResources ? [{ text: renderFoodBodyPositive(), buttons: [] }] : []),
    ...(await advance(user, 'food_body_screening', deps)),
  ];
}
