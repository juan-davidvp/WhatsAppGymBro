import type { EventEmitter } from '../events/emitter.js';
import type { PlanDeps } from '../plans/weekly-plan.js';
import type {
  AchievementsRepository,
  ExerciseAdjustmentsRepository,
  PainFlagsRepository,
  PersonalRecordsRepository,
  DaysRepository,
  NoticesRepository,
  RiskSignalsRepository,
  SetEntriesRepository,
  StreakStatesRepository,
  XpLedgerRepository,
  WorkoutSessionsRepository,
} from '../ports/repositories.js';

/** Dependencias de Hoy y de la tarjeta de sesión (M4) y del día que cuenta (M6). */
export interface TrainingDeps extends PlanDeps {
  days: DaysRepository;
  /** Estado del juego guardado por el cierre (T-060, T-061). */
  streaks: StreakStatesRepository;
  /** Avisos del cierre para la próxima interacción (T-061). */
  notices: NoticesRepository;
  /** FR-005-07: un día con señal de riesgo pausa las mecánicas de juego. */
  riskSignals: RiskSignalsRepository;
  /** Libro de XP (T-062). */
  xp: XpLedgerRepository;
  workouts: WorkoutSessionsRepository;
  setEntries: SetEntriesRepository;
  records: PersonalRecordsRepository;
  achievements: AchievementsRepository;
  painFlags: PainFlagsRepository;
  adjustments: ExerciseAdjustmentsRepository;
  events: EventEmitter;
  clock: () => Date;
}
