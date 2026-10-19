import type { AnalyticsEvent } from '../events/schema.js';
import type { DayStatus, DayType, Intensity, LocalDate, LocalTime } from '@gymbro/domain';

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
  readonly settings: {
    readonly intensity: Intensity;
    readonly quietHours: { readonly start: LocalTime; readonly end: LocalTime };
    readonly gamificationEnabled: boolean;
    readonly numberFreeMode: boolean;
  };
  readonly onboarding: { readonly step: string; readonly completedAt: Date | null };
  readonly createdAt: Date;
}

export interface UsersRepository {
  /** Busca por `telegramUserId` o crea el usuario con los valores por defecto. */
  findOrCreate(input: { telegramUserId: number; chatId: number; now: Date }): Promise<UserRecord>;
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
