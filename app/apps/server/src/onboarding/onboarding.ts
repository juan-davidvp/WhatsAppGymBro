import { PRIVACY_POLICY_VERSION, renderTemplate, templateById } from '@gymbro/content';
import {
  PARAMETERS,
  consentDecision,
  nextOnboardingStep,
  type OnboardingStep,
} from '@gymbro/domain';
import { encodeCallbackData, type CallbackAction } from '../bot/callback-data.js';
import type { EventEmitter } from '../events/emitter.js';
import type { ConsentsRepository, UserRecord, UsersRepository } from '../ports/repositories.js';

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
  events: EventEmitter;
  clock: () => Date;
}

/** Valor de cada botón de las plantillas del onboarding, por su texto en la bóveda. */
const BUTTON_VALUES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  'ON-02': { Acepto: 'accept', 'Ver política': 'policy', 'No acepto': 'decline' },
  'PV-01': { Acepto: 'accept', 'No acepto': 'decline' },
  'ON-03': { Sí: 'yes', No: 'no' },
};

/** Respuesta con la plantilla y sus botones; cada botón lleva su valor. */
export function templateReply(
  id: string,
  toAction: (value: string) => CallbackAction,
  variables?: Readonly<Record<string, string | number>>,
): Reply {
  const values = BUTTON_VALUES[id] ?? {};
  const buttons = templateById(id).buttons.map((label) => {
    const value = values[label];
    if (!value) throw new Error(`Botón sin valor: ${id} · ${label}`);
    return { label, data: encodeCallbackData(toAction(value)) };
  });
  return { text: renderTemplate(id, variables), buttons };
}

function plain(id: string): Reply {
  return { text: renderTemplate(id), buttons: [] };
}

const policyVariables = { horas_borrado: PARAMETERS.data.deletionMaxHours };

/** Pregunta de cada paso; null si el paso aún no tiene pantalla (llega con su tarea). */
export function promptFor(step: OnboardingStep): Reply | null {
  const ob = (value: string): CallbackAction => ({ action: 'ob', step, value });
  switch (step) {
    case 'privacy':
      return templateReply('ON-02', ob);
    case 'age':
      return templateReply('ON-03', ob);
    default:
      return null;
  }
}

export function isOnboardingComplete(user: UserRecord): boolean {
  return user.onboarding.completedAt !== null;
}

/** `/start`: bienvenida y aviso la primera vez; si ya empezó, retoma su paso. */
export async function startOnboarding(user: UserRecord, deps: OnboardingDeps): Promise<Reply[]> {
  const subject = { userId: user.id, timezone: user.timezone };
  if (user.onboarding.step === 'privacy' && !(await deps.consents.hasDecided(user.id))) {
    await deps.events.emit('onboarding_started', subject);
    return [plain('ON-01'), ...compact([promptFor('privacy')])];
  }
  return compact([promptFor(user.onboarding.step)]);
}

/** Respuesta a un botón del onboarding. Un botón de un paso ya pasado repite la pregunta actual. */
export async function answerOnboarding(
  user: UserRecord,
  step: OnboardingStep,
  value: string,
  deps: OnboardingDeps,
): Promise<Reply[]> {
  if (isOnboardingComplete(user) || step !== user.onboarding.step) {
    return compact([promptFor(user.onboarding.step)]);
  }
  switch (step) {
    case 'privacy':
      return answerPrivacyStep(user, value, deps);
    default:
      return compact([promptFor(step)]);
  }
}

async function answerPrivacyStep(
  user: UserRecord,
  value: string,
  deps: OnboardingDeps,
): Promise<Reply[]> {
  const ob = (v: string): CallbackAction => ({ action: 'ob', step: 'privacy', value: v });
  if (value === 'policy') return [templateReply('PV-01', ob, policyVariables)];
  if (value !== 'accept' && value !== 'decline') return compact([promptFor('privacy')]);

  const accepted = value === 'accept';
  await recordConsent(user, accepted, deps);
  await deps.events.emit(
    'onboarding_step_completed',
    { userId: user.id, timezone: user.timezone },
    { step: 'privacy' },
  );
  const next =
    nextOnboardingStep('privacy', {
      consentGiven: accepted,
      place: null,
      goalUsesWeight: false,
      weightKg: null,
    }) ?? 'summary';
  await deps.users.setOnboardingStep(user.id, next);
  return [...(accepted ? [] : [plain('ON-08')]), ...compact([promptFor(next)])];
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
  const subject = { userId: user.id, timezone: user.timezone };
  await (accepted
    ? deps.events.emit('consent_given', subject, { categories: [...decision.granted] })
    : deps.events.emit('consent_declined', subject, { categories: [...decision.declined] }));
}

/** `/privacidad`: la política; durante el paso de privacidad sus botones son los del onboarding. */
export function privacyCommand(user: UserRecord): Reply {
  if (!isOnboardingComplete(user) && user.onboarding.step === 'privacy') {
    return templateReply(
      'PV-01',
      (value) => ({ action: 'ob', step: 'privacy', value }),
      policyVariables,
    );
  }
  return templateReply('PV-01', (value) => ({ action: 'pv', value }), policyVariables);
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

function compact(replies: readonly (Reply | null)[]): Reply[] {
  return replies.filter((reply): reply is Reply => reply !== null);
}
