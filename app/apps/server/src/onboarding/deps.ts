import type { EventEmitter, EventSubject } from '../events/emitter.js';
import type {
  BodyMeasurementsRepository,
  ConsentsRepository,
  GoalsRepository,
  PlansRepository,
  SetEntriesRepository,
  ScreeningsRepository,
  TrainingHabitsRepository,
  UserDataEraser,
  UserRecord,
  UsersRepository,
} from '../ports/repositories.js';

/** Dependencias de los casos de uso del onboarding. */
export interface OnboardingDeps {
  users: UsersRepository;
  consents: ConsentsRepository;
  screenings: ScreeningsRepository;
  eraser: UserDataEraser;
  bodyMeasurements: BodyMeasurementsRepository;
  habits: TrainingHabitsRepository;
  goals: GoalsRepository;
  plans: PlansRepository;
  setEntries: SetEntriesRepository;
  events: EventEmitter;
  clock: () => Date;
}

export const subjectOf = (user: UserRecord): EventSubject => ({
  userId: user.id,
  timezone: user.timezone,
});

/** Vuelve a leer al usuario después de guardar algo (los registros son inmutables). */
export function reload(user: UserRecord, deps: OnboardingDeps): Promise<UserRecord> {
  return deps.users.findOrCreate({
    telegramUserId: user.telegramUserId,
    chatId: user.chatId,
    now: deps.clock(),
  });
}
