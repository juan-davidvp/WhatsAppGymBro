import type { AnalyticsEvent } from '../events/schema.js';
import type {
  ConsentCategory,
  DayStatus,
  DayType,
  Intensity,
  LocalDate,
  LocalTime,
  OnboardingStep,
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
  readonly onboarding: { readonly step: OnboardingStep; readonly completedAt: Date | null };
  readonly createdAt: Date;
}

export interface UsersRepository {
  /** Busca por `telegramUserId` o crea el usuario con los valores por defecto. */
  findOrCreate(input: { telegramUserId: number; chatId: number; now: Date }): Promise<UserRecord>;
  /** Guarda el paso del onboarding en el que quedó (FR-001-01: reanudar). */
  setOnboardingStep(userId: string, step: OnboardingStep): Promise<void>;
  confirmAdult(userId: string, at: Date): Promise<void>;
  /** Consecuencias de seguridad de los tamizajes (tamizajes §3). */
  updateSettings(
    userId: string,
    settings: Partial<Pick<UserRecord['settings'], 'lowIntensityStart' | 'numberFreeMode'>>,
  ): Promise<void>;
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
}

export interface EventsRepository {
  /** Guarda un evento ya validado (`validateEvent`). */
  insert(event: AnalyticsEvent): Promise<void>;
}
