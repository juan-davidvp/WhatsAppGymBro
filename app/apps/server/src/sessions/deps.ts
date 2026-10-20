import type { EventEmitter } from '../events/emitter.js';
import type { PlanDeps } from '../plans/weekly-plan.js';
import type {
  DaysRepository,
  SetEntriesRepository,
  WorkoutSessionsRepository,
} from '../ports/repositories.js';

/** Dependencias de Hoy y de la tarjeta de sesión (M4). */
export interface TrainingDeps extends PlanDeps {
  days: DaysRepository;
  workouts: WorkoutSessionsRepository;
  setEntries: SetEntriesRepository;
  events: EventEmitter;
  clock: () => Date;
}
