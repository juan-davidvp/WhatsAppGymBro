import type { EventEmitter } from '../events/emitter.js';
import type { PlanDeps } from '../plans/weekly-plan.js';
import type {
  AchievementsRepository,
  ExerciseAdjustmentsRepository,
  PainFlagsRepository,
  PersonalRecordsRepository,
  DaysRepository,
  SetEntriesRepository,
  WorkoutSessionsRepository,
} from '../ports/repositories.js';

/** Dependencias de Hoy y de la tarjeta de sesión (M4). */
export interface TrainingDeps extends PlanDeps {
  days: DaysRepository;
  workouts: WorkoutSessionsRepository;
  setEntries: SetEntriesRepository;
  records: PersonalRecordsRepository;
  achievements: AchievementsRepository;
  painFlags: PainFlagsRepository;
  adjustments: ExerciseAdjustmentsRepository;
  events: EventEmitter;
  clock: () => Date;
}
