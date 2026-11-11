import type { AnalyticsEvent } from '../events/schema.js';
import type {
  ConsentCategory,
  DayStatus,
  DayType,
  ExerciseAdjustment,
  ExperienceLevel,
  GoalMetric,
  GoalType,
  Intensity,
  LocalDate,
  LocalTime,
  OnboardingStep,
  PlannedSession,
  PlayerState,
  SessionProgress,
  SessionTemplate,
  SessionVariant,
  TrainingPlace,
  WeeklyPlan,
  Weekday,
  WeeklyQuest,
  QuestKind,
  MessagePurpose,
  SentMessage,
  XpLedgerEntry,
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
    /** RN-MSJ-001 · `/ajustes`: propósito → encendido; uno que falta está encendido. */
    readonly purposesEnabled?: Readonly<Partial<Record<MessagePurpose, boolean>>>;
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
  /** RN-MSJ-014: `blocked` si bloqueó el bot; `active` si vuelve a escribir. */
  setStatus(userId: string, status: UserStatus): Promise<void>;
  /** Usuarios activos que terminaron el onboarding (para el cierre programado, T-060). */
  listActive(): Promise<UserRecord[]>;
  /** "Empezar de nuevo" (SPEC-001 §8): borra lo declarado y vuelve a `step`. */
  restartOnboarding(userId: string, step: OnboardingStep): Promise<void>;
}

export interface BodyMeasurementsRepository {
  /** RN-OBJ-012: el peso es opcional; un registro por día (el último gana). */
  recordWeight(userId: string, date: LocalDate, weightKg: number): Promise<void>;
  latestWeightKg(userId: string): Promise<number | null>;
  /** RN-OBJ-010: pesos desde `from` (incluido), del más viejo al más reciente. */
  weightsSince(userId: string, from: LocalDate): Promise<{ date: LocalDate; kg: number }[]>;
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
  /** Hábito del usuario (hora declarada por día), para los mensajes (RN-MSJ-005). */
  get(userId: string): Promise<TrainingHabitRecord | null>;
}

// ── Mensajes proactivos (SPEC-007) ───────────────────────────────────────────

/** `sending`: reclamada para enviar; `failed`: Telegram no la aceptó (no se reintenta). */
export type OutboxStatus = 'pending' | 'sending' | 'sent' | 'suppressed' | 'cancelled' | 'failed';

/**
 * Resultado de una enviada al cerrar su ventana P-067 (RN-MSJ-007): con acción en
 * uno de sus botones, con otra interacción del usuario o ignorada (PO, 2026-11-11).
 */
export type OutboxOutcome = 'actioned' | 'interacted' | 'ignored';

/** Salida de la bandeja (`proactive_messages`, FR-007-02). */
export interface OutboxMessage {
  readonly id: string;
  readonly userId: string;
  /** Propósito + día operativo: una salida por propósito y día. */
  readonly key: string;
  readonly purpose: MessagePurpose;
  readonly scheduledFor: Date;
  readonly notAfter: Date | null;
  readonly reactivation: boolean;
  readonly status: OutboxStatus;
  readonly suppressedReason: string | null;
  readonly templateId: string | null;
  readonly sentAt: Date | null;
  readonly telegramMessageId: number | null;
  readonly actionedAt: Date | null;
  /** null mientras corre la ventana P-067. */
  readonly outcome: OutboxOutcome | null;
}

export type NewOutboxMessage = Pick<
  OutboxMessage,
  'userId' | 'key' | 'purpose' | 'scheduledFor' | 'notAfter' | 'reactivation'
>;

export interface OutboxRepository {
  /** Programa una salida una sola vez por clave; `created` es false si ya existía. */
  schedule(message: NewOutboxMessage, at: Date): Promise<{ created: boolean }>;
  /** Salidas pendientes cuya hora ya llegó, en orden de hora. */
  due(now: Date): Promise<OutboxMessage[]>;
  /**
   * Reclama una pendiente para enviarla (pasa a `sending`); false si otro ya la
   * reclamó. Así un mensaje sale como mucho una vez, aunque el proceso caiga.
   */
  claim(id: string): Promise<boolean>;
  /** Pasa una salida reclamada a enviada; false si ya no estaba reclamada. */
  markSent(
    id: string,
    sent: { templateId: string; sentAt: Date; telegramMessageId: number },
  ): Promise<boolean>;
  markSuppressed(id: string, reason: string): Promise<boolean>;
  /** Una reclamada que Telegram no aceptó después de los reintentos. */
  markFailed(id: string): Promise<boolean>;
  /** RN-MSJ-014: cancela las pendientes y reclamadas del usuario; devuelve cuántas. */
  cancelPending(userId: string): Promise<number>;
  /** Enviadas desde `since` (presupuesto, separación y rotación). */
  sentSince(userId: string, since: Date): Promise<SentMessage[]>;
  /** Enviada que corresponde a un mensaje de Telegram (para registrar la acción). */
  byTelegramMessage(userId: string, telegramMessageId: number): Promise<OutboxMessage | null>;
  markActioned(id: string, at: Date): Promise<boolean>;
  /** Enviadas antes de `sentBefore` sin resultado todavía, en orden de envío. */
  awaitingOutcome(sentBefore: Date): Promise<OutboxMessage[]>;
  /** Fija el resultado una sola vez; false si ya lo tenía. */
  setOutcome(id: string, outcome: OutboxOutcome): Promise<boolean>;
  /** Enviadas con su ventana P-067 cerrada y, de ellas, con acción (tasa de acción, RN-MSJ-009, M03). */
  purposeStats(
    userId: string,
    purpose: MessagePurpose,
  ): Promise<{ sent: number; actioned: number }>;
}

/** `message_stats` (RN-MSJ-007, 008, 013, 014). */
export interface MessageStatsRecord {
  readonly consecutiveIgnored: number;
  readonly backoffUntil: Date | null;
  /** FR-007-06: último toque o comando del usuario. */
  readonly lastInteractionAt: Date | null;
  /** RN-MSJ-013: inicio de la última `/pausa` (con `pausedUntil`, la semana que toca). */
  readonly pausedAt: Date | null;
  readonly inactivityPausedAt: Date | null;
  readonly reactivationsUsed: number;
  readonly lastReactivationDate: LocalDate | null;
  readonly pausedUntil: Date | null;
  readonly blockedAt: Date | null;
}

export const EMPTY_MESSAGE_STATS: MessageStatsRecord = {
  consecutiveIgnored: 0,
  backoffUntil: null,
  lastInteractionAt: null,
  pausedAt: null,
  inactivityPausedAt: null,
  reactivationsUsed: 0,
  lastReactivationDate: null,
  pausedUntil: null,
  blockedAt: null,
};

export interface MessageStatsRepository {
  get(userId: string): Promise<MessageStatsRecord>;
  update(userId: string, changes: Partial<MessageStatsRecord>): Promise<void>;
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
  /** FR-003-04: deshace una serie registrada. */
  remove(sessionId: string, exerciseCode: string, setIndex: number): Promise<void>;
  /** FR-002-04: última carga registrada de cada ejercicio (para precargar el plan). */
  lastLoads(userId: string): Promise<Record<string, number>>;
  /** Todas las series de un ejercicio, en orden (récords, progresión y estancamiento). */
  exerciseHistory(userId: string, exerciseCode: string): Promise<ExerciseSet[]>;
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
  /** FR-004-08: duración desde que se abrió `🍽️ Comida` y toques del registro. */
  readonly durationMs: number;
  readonly taps: number;
  /** Clave estable del toque que originó el registro (`mealIdempotencyKey`). */
  readonly idempotencyKey: string;
}

export interface MealsRepository {
  /** SC-003-2: el mismo toque repetido no duplica la comida. */
  record(meal: MealRecord): Promise<{ inserted: boolean }>;
  /** Comidas de un día, en el orden en que se registraron. */
  onDate(userId: string, date: LocalDate): Promise<MealRecord[]>;
}

export type MealPortions = MealRecord['portions'];

/** `FavoriteMeal` del glosario (RN-NUT-004). */
export interface FavoriteMealRecord {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly portions: MealPortions;
  readonly foodCodes: readonly string[];
}

export interface FavoriteMealsRepository {
  create(input: Omit<FavoriteMealRecord, 'id'>): Promise<FavoriteMealRecord>;
  /** En el orden en que se guardaron. */
  list(userId: string): Promise<FavoriteMealRecord[]>;
  byId(userId: string, id: string): Promise<FavoriteMealRecord | null>;
  /** FR-004-03: ajustar las porciones de una frecuente. */
  updatePortions(userId: string, id: string, portions: MealPortions): Promise<void>;
  remove(userId: string, id: string): Promise<void>;
}

export interface DaysRepository {
  /** Guarda el estado del día mientras está abierto (RN-DQC-005); uno cerrado no cambia. */
  saveStatus(userId: string, date: LocalDate, dayType: DayType, status: DayStatus): Promise<void>;
  /**
   * Cierra el día una sola vez con su estado final (FR-005-02); lo crea si no
   * tenía registros. Un día ya cerrado no cambia.
   */
  close(
    userId: string,
    date: LocalDate,
    dayType: DayType,
    status: DayStatus,
    at: Date,
  ): Promise<{ closedNow: boolean }>;
  /**
   * Añade una fuente al día abierto (`session:<id>`, `mobility`) sin repetirla y
   * devuelve todas sus fuentes; en un día cerrado no cambia nada (RN-DQC-005).
   */
  addSource(userId: string, date: LocalDate, dayType: DayType, source: string): Promise<string[]>;
  sources(userId: string, date: LocalDate): Promise<string[]>;
  /** Tipo con el que se registró el día (null si no tiene registros). */
  dayType(userId: string, date: LocalDate): Promise<DayType | null>;
  /** Días guardados: si cuentan, si son completos y si cumplieron la mitad de comida. */
  history(
    userId: string,
  ): Promise<{ date: LocalDate; counted: boolean; complete: boolean; nutritionHalf: boolean }[]>;
}

export type WorkoutStatus = 'active' | 'completed' | 'partial' | 'abandoned';

export interface WorkoutSessionRecord {
  readonly id: string;
  readonly userId: string;
  readonly date: LocalDate;
  readonly plannedSessionId: string;
  readonly template: SessionTemplate;
  readonly variant: SessionVariant;
  readonly status: WorkoutStatus;
  readonly startedAt: Date;
  readonly endedAt: Date | null;
  readonly loggedAsPlanned: boolean;
  /** Estado de la tarjeta (dominio `SessionProgress`). */
  readonly progress: SessionProgress;
  /** Versión del estado: un toque de una tarjeta vieja no lo cambia (FR-003-03). */
  readonly rev: number;
  readonly lastConfirmedAt: Date | null;
  /** Toques desde la última serie confirmada (SC-003-1: toques por serie). */
  readonly pendingTaps: number;
}

export interface WorkoutSessionsRepository {
  create(session: Omit<WorkoutSessionRecord, 'id' | 'rev'>): Promise<WorkoutSessionRecord>;
  byId(id: string): Promise<WorkoutSessionRecord | null>;
  /** Sesión activa del usuario en esa fecha, si hay. */
  activeOn(userId: string, date: LocalDate): Promise<WorkoutSessionRecord | null>;
  onDate(userId: string, date: LocalDate): Promise<WorkoutSessionRecord[]>;
  /** RN-MSJ-006: las últimas `limit` sesiones completas o parciales, de la más reciente a la más vieja. */
  recentStarted(userId: string, limit: number): Promise<WorkoutSessionRecord[]>;
  /** Guarda cambios solo si `rev` sigue igual; devuelve la sesión nueva o null si cambió antes. */
  update(
    id: string,
    rev: number,
    changes: Partial<Omit<WorkoutSessionRecord, 'id' | 'rev' | 'userId'>>,
  ): Promise<WorkoutSessionRecord | null>;
}

/** Estado del juego guardado y su versión (`rev` = 0 si todavía no existe). */
export interface StoredPlayerState {
  readonly state: PlayerState;
  readonly rev: number;
}

export interface StreakStatesRepository {
  get(userId: string): Promise<StoredPlayerState | null>;
  /**
   * Guarda el estado solo si `rev` sigue igual (FR-005-02): si otro proceso cerró
   * el día o reparó la racha antes, devuelve false y no cambia nada. El dominio
   * garantiza que el total nunca baja (RN-DQC-007).
   */
  save(userId: string, rev: number, state: PlayerState): Promise<boolean>;
}

/** Movimiento del libro de XP con lo que lo originó (FR-005-03). */
export interface XpLedgerRecord extends XpLedgerEntry {
  /** Qué dio el XP (`session:<id>`, `nutrition:<fecha>`, `week:<lunes>`…). */
  readonly refId: string;
  readonly at: Date;
}

export interface XpLedgerRepository {
  /** RN-GAM-006: solo inserciones; el mismo `refId` no suma dos veces. */
  add(userId: string, entry: XpLedgerRecord): Promise<{ inserted: boolean }>;
  /** Movimientos del día operativo `date` (tope diario P-039). */
  onDate(userId: string, date: LocalDate): Promise<XpLedgerEntry[]>;
  total(userId: string): Promise<number>;
}

/** Semana cerrada (`weeks`, RN-GAM-004). */
export interface WeekRecord {
  readonly weekStart: LocalDate;
  readonly planned: number;
  readonly completed: number;
  readonly commitment: number;
  readonly fulfilled: boolean;
  readonly countedDays: number;
  /** Días con la mitad de comida (base de la misión de comida, RN-GAM-008). */
  readonly nutritionHalfDays: number;
  /** RN-SEG-008: días de descanso del plan y en cuántos se entrenó. */
  readonly restDaysPlanned: number;
  readonly restDaysTrained: number;
}

/** Misión de la semana guardada (`quests`, RN-GAM-008). */
export interface StoredQuest extends WeeklyQuest {
  readonly done: boolean;
}

export interface QuestsRepository {
  get(userId: string, weekStart: LocalDate): Promise<StoredQuest[] | null>;
  /** Guarda las misiones de la semana una sola vez; `created` es false si ya existían. */
  create(
    userId: string,
    weekStart: LocalDate,
    quests: readonly WeeklyQuest[],
  ): Promise<{ created: boolean }>;
  /** Marca una misión cumplida; true solo la primera vez. */
  markDone(userId: string, weekStart: LocalDate, kind: QuestKind): Promise<boolean>;
}

export interface WeeksRepository {
  /** Guarda la semana una sola vez (cerrar dos veces no cambia nada). */
  save(userId: string, week: WeekRecord): Promise<void>;
  list(userId: string): Promise<WeekRecord[]>;
}

/** Aviso para la próxima interacción (decisión del PO, 2026-11-08). */
export interface NoticeRecord {
  /** Clave estable: el mismo aviso no se guarda dos veces. */
  readonly key: string;
  readonly templateId: string;
  readonly variables: Readonly<Record<string, string | number>>;
  readonly createdAt: Date;
}

export interface NoticesRepository {
  /** Guarda el aviso una sola vez por clave. */
  add(userId: string, notice: NoticeRecord): Promise<void>;
  /** Avisos sin mostrar, en orden de creación; quedan marcados como mostrados. */
  takePending(userId: string, at: Date): Promise<NoticeRecord[]>;
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
  /** Descarta una semana futura todavía sin usar, para regenerarla (RN-ENT-003). */
  discardWeek(userId: string, weekStart: LocalDate): Promise<void>;
}

export interface ExerciseSet {
  readonly sessionId: string;
  readonly setIndex: number;
  readonly reps: number;
  readonly loadKg: number;
  readonly edited: boolean;
  readonly confirmedAt: Date;
}

export interface PersonalRecordsRepository {
  /** RN-ENT-005: un récord por serie (la clave de la serie lo hace idempotente). */
  record(input: {
    userId: string;
    exerciseCode: string;
    type: 'e1rm' | 'reps';
    value: number;
    date: LocalDate;
    setKey: string;
    /** HU-006-3: carga y repeticiones de la serie, para la bitácora (T-081). */
    loadKg: number;
    reps: number;
  }): Promise<{ inserted: boolean }>;
  count(userId: string): Promise<number>;
  /** HU-006-3: récords del usuario, del más viejo al más reciente. */
  list(userId: string): Promise<PersonalRecordEntry[]>;
  /** Récords de una sesión (para el fin de sesión). */
  countForSession(userId: string, sessionId: string): Promise<number>;
}

/** Récord guardado; los anteriores a T-081 no tienen carga ni repeticiones. */
export interface PersonalRecordEntry {
  readonly exerciseCode: string;
  readonly date: LocalDate;
  readonly loadKg: number | null;
  readonly reps: number | null;
}

/** Logro de la bitácora (RN-GAM-011). */
export interface AchievementEntry {
  readonly code: string;
  readonly at: Date;
}

export interface AchievementsRepository {
  /** RN-GAM-011: cada logro del catálogo se guarda una vez en la bitácora. */
  appendOnce(input: {
    userId: string;
    code: string;
    at: Date;
    value: string | number | null;
    context: string | null;
  }): Promise<{ added: boolean }>;
  /** HU-006-3: logros del usuario, del más viejo al más reciente. */
  list(userId: string): Promise<AchievementEntry[]>;
}

export interface PainFlagsRepository {
  record(input: {
    userId: string;
    exerciseCode: string;
    zone: string;
    date: LocalDate;
    sessionId: string;
  }): Promise<void>;
  /** Sesiones distintas en las que se marcó dolor en ese ejercicio (RN-SEG-006). */
  sessionsWithPain(userId: string, exerciseCode: string): Promise<string[]>;
}

export interface ExerciseAdjustmentsRepository {
  /** RN-ENT-003: estrategia elegida ante un estancamiento. */
  save(userId: string, adjustment: ExerciseAdjustment): Promise<void>;
  list(userId: string): Promise<ExerciseAdjustment[]>;
}
