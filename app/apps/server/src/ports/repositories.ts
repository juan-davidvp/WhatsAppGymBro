import type { AnalyticsEvent } from '../events/schema.js';
import type {
  ConsentCategory,
  DayStatus,
  DayType,
  ExperienceLevel,
  GoalMetric,
  GoalType,
  Intensity,
  LocalDate,
  LocalTime,
  OnboardingStep,
  PlannedSession,
  TrainingPlace,
  WeeklyPlan,
  Weekday,
} from '@gymbro/domain';

/**
 * Puertos de persistencia (arquitectura hexagonal, plan técnico §2): los casos de
 * uso dependen de estas interfaces; `adapters/mongo` las implementa. Fechas en UTC;
 * el día operativo es una `LocalDate` calculada en el dominio.
 */

export type UserStatus = 'active' | 'paused' | 'blocked' | 'deleted';

export interface UserRecord {
  readonly id: string;
  readonly telegramUserId: number;
  readonly chatId: number;
  readonly status: UserStatus;
  readonly timezone: string;
  /** RN-SEG-001: solo la confirmación de mayoría de edad, nunca la fecha de nacimiento. */
  readonly isAdultConfirmedAt: Date | null;
  readonly settings: {
    readonly intensity: Intensity;
    readonly quietHours: { readonly start: LocalTime; readonly end: LocalTime };
    readonly gamificationEnabled: boolean;
    readonly numberFreeMode: boolean;
    /** RN-SEG-002: el plan arranca con intensidad baja hasta que haya autorización. */
    readonly lowIntensityStart: boolean;
  };
  /** Lo que declara en el onboarding (SPEC-001); el hábito y el objetivo se guardan aparte al terminar. */
  readonly profile: UserProfile;
  readonly onboarding: {
    readonly step: OnboardingStep;
    readonly startedAt: Date | null;
    /** Toques y respuestas escritas durante el onboarding (SC-001-1). */
    readonly interactions: number;
    readonly completedAt: Date | null;
  };
  readonly createdAt: Date;
}

export type TimeSlot = 'morning' | 'midday' | 'afternoon' | 'evening';

export interface UserProfile {
  readonly goalType: GoalType | null;
  readonly level: ExperienceLevel | null;
  readonly availableDays: readonly Weekday[];
  readonly timeSlot: TimeSlot | null;
  readonly place: TrainingPlace | null;
  readonly sessionMinutes: number | null;
  readonly homeEquipment: readonly string[];
  /** Opcional y solo con autorización `body_measurements` (RN-OBJ-005, RN-DAT-001). */
  readonly heightCm: number | null;
}

export const EMPTY_PROFILE: UserProfile = {
  goalType: null,
  level: null,
  availableDays: [],
  timeSlot: null,
  place: null,
  sessionMinutes: null,
  homeEquipment: [],
  heightCm: null,
};

export interface UsersRepository {
  /** Busca por `telegramUserId` o crea el usuario con los valores por defecto. */
  findOrCreate(input: { telegramUserId: number; chatId: number; now: Date }): Promise<UserRecord>;
  /** Guarda el paso del onboarding en el que quedó (FR-001-01: reanudar). */
  setOnboardingStep(userId: string, step: OnboardingStep): Promise<void>;
  confirmAdult(userId: string, at: Date): Promise<void>;
  /** Consecuencias de seguridad de los tamizajes (tamizajes §3). */
  updateSettings(userId: string, settings: Partial<UserRecord['settings']>): Promise<void>;
  updateProfile(userId: string, profile: Partial<UserProfile>): Promise<void>;
  /** Cuenta una interacción del onboarding; la primera fija `startedAt`. */
  recordOnboardingInteraction(userId: string, at: Date): Promise<void>;
  completeOnboarding(userId: string, at: Date): Promise<void>;
  /** "Empezar de nuevo" (SPEC-001 §8): borra lo declarado y vuelve a `step`. */
  restartOnboarding(userId: string, step: OnboardingStep): Promise<void>;
}

export interface BodyMeasurementsRepository {
  /** RN-OBJ-012: el peso es opcional; un registro por día (el último gana). */
  recordWeight(userId: string, date: LocalDate, weightKg: number): Promise<void>;
  latestWeightKg(userId: string): Promise<number | null>;
}

export interface TrainingHabitRecord {
  readonly userId: string;
  readonly days: readonly {
    readonly weekday: Weekday;
    readonly declaredStart: LocalTime;
    readonly learnedStart: LocalTime | null;
    readonly location: TrainingPlace;
  }[];
}

export interface TrainingHabitsRepository {
  /** RN-PLAN-002: un hábito por usuario; se reemplaza. */
  save(habit: TrainingHabitRecord): Promise<void>;
}

export interface GoalRecord {
  readonly userId: string;
  readonly type: GoalType;
  readonly metric: GoalMetric;
  /** null mientras no haya dato inicial (objetivos sin meta de peso en el onboarding). */
  readonly startValue: number | null;
  readonly targetValue: number | null;
  readonly startDate: LocalDate;
  readonly horizonWeeks: number;
}

export interface GoalsRepository {
  /** RN-OBJ-001 y RN-OBJ-007: un solo objetivo activo; el anterior queda `changed`. */
  activate(goal: GoalRecord): Promise<void>;
  active(userId: string): Promise<GoalRecord | null>;
}

export type ScreeningType = 'pre_activity' | 'food_body';

export interface ScreeningsRepository {
  /** Solo el resultado, nunca las respuestas (tamizajes §3). */
  record(input: {
    userId: string;
    type: ScreeningType;
    result: 'clear' | 'flag';
    at: Date;
  }): Promise<void>;
}

export interface UserDataEraser {
  /**
   * RN-DAT-003: borra todos los documentos del usuario en todas las colecciones y
   * desvincula sus eventos (`userRef` = null). También se usa cuando no es mayor de
   * edad (RN-SEG-001: no se crea el perfil).
   */
  eraseUser(userId: string): Promise<void>;
}

export interface ConsentsRepository {
  /**
   * RN-DAT-001: registra una decisión por categoría. Solo inserciones: el
   * historial de autorizaciones queda (RN-DAT-007); vale la más reciente.
   */
  record(input: {
    userId: string;
    granted: readonly ConsentCategory[];
    declined: readonly ConsentCategory[];
    at: Date;
    policyVersion: string;
  }): Promise<void>;
  /** Categorías cuya decisión más reciente es "autorizada". */
  grantedCategories(userId: string): Promise<ConsentCategory[]>;
  /** Si alguna vez decidió (aceptó o no) sobre el aviso. */
  hasDecided(userId: string): Promise<boolean>;
}

export interface ProcessedUpdatesRepository {
  /** true si el update es nuevo (y queda marcado); false si ya se procesó. */
  markIfNew(updateId: number, at: Date): Promise<boolean>;
}

export interface SetEntryRecord {
  readonly userId: string;
  readonly sessionId: string;
  readonly exerciseCode: string;
  readonly setIndex: number;
  readonly reps: number;
  readonly loadKg: number;
  readonly edited: boolean;
  readonly confirmedAt: Date;
}

export interface SetEntriesRepository {
  /** SC-003-2: repetir la confirmación de la misma serie no la duplica. */
  record(entry: SetEntryRecord): Promise<{ inserted: boolean }>;
  /** FR-002-04: última carga registrada de cada ejercicio (para precargar el plan). */
  lastLoads(userId: string): Promise<Record<string, number>>;
}

export interface MealRecord {
  readonly userId: string;
  readonly date: LocalDate;
  readonly loggedAt: Date;
  readonly method: 'portions' | 'favorite' | 'repeat' | 'photo' | 'text';
  readonly portions: {
    readonly palm: number;
    readonly cuppedHand: number;
    readonly fist: number;
    readonly thumb: number;
  };
  readonly proteinG: number;
  readonly favoriteMealId: string | null;
  /** Clave estable del toque que originó el registro (`mealIdempotencyKey`). */
  readonly idempotencyKey: string;
}

export interface MealsRepository {
  /** SC-003-2: el mismo toque repetido no duplica la comida. */
  record(meal: MealRecord): Promise<{ inserted: boolean }>;
}

export interface DaysRepository {
  /** Guarda el estado del día mientras está abierto (RN-DQC-005); uno cerrado no cambia. */
  saveStatus(userId: string, date: LocalDate, dayType: DayType, status: DayStatus): Promise<void>;
  /** Cierra el día una sola vez (FR-005-02). */
  close(userId: string, date: LocalDate, at: Date): Promise<{ closedNow: boolean }>;
}

export interface StreakStatesRepository {
  /** RN-DQC-007: suma el día cerrado al total una sola vez; el total nunca baja. */
  applyDayClose(
    userId: string,
    day: { date: LocalDate; counted: boolean },
  ): Promise<{ totalCountedDays: number }>;
}

export interface RiskSignalsRepository {
  /** RN-DAT-005: solo la categoría, nunca el texto. */
  record(userId: string, category: string, at: Date): Promise<void>;
  /** Instantes de las señales en [from, to), para pausar el juego ese día (RN-SEG-007). */
  instantsBetween(userId: string, from: Date, to: Date): Promise<Date[]>;
}

export interface EventsRepository {
  /** Guarda un evento ya validado (`validateEvent`). */
  insert(event: AnalyticsEvent): Promise<void>;
}

/** Día de un plan guardado: la sesión lleva su id (`planned_sessions`). */
export interface StoredPlanDay {
  readonly date: LocalDate;
  readonly type: DayType;
  readonly session: (PlannedSession & { readonly id: string }) | null;
}

export interface StoredWeeklyPlan extends Omit<WeeklyPlan, 'days'> {
  readonly days: readonly StoredPlanDay[];
}

export interface PlansRepository {
  /** Guarda la semana si no existe (RN-PLAN-001); devuelve la guardada. Idempotente. */
  saveWeek(userId: string, plan: WeeklyPlan): Promise<StoredWeeklyPlan>;
  week(userId: string, weekStart: LocalDate): Promise<StoredWeeklyPlan | null>;
  /** RN-PLAN-007: mueve la sesión de `from` a `to` dentro de la misma semana. */
  moveSession(userId: string, weekStart: LocalDate, from: LocalDate, to: LocalDate): Promise<void>;
}
