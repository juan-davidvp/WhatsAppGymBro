/**
 * Catálogo de eventos de medición: réplica de `plan-de-medicion.md` §2.
 * `catalog.test.ts` compara ambos lados; un evento nuevo se añade primero en la bóveda.
 */
export const EVENT_NAMES_BY_MODULE = {
  onboarding: [
    'onboarding_started',
    'onboarding_step_completed',
    'consent_given',
    'consent_declined',
    'age_gate_failed',
    'screening_completed',
    'goal_set',
    'goal_adjusted',
    'habit_declared',
    'onboarding_completed',
  ],
  plan: [
    'plan_generated',
    'plan_viewed',
    'session_variant_chosen',
    'cant_today_selected',
    'session_rescheduled',
    'plan_days_changed',
  ],
  training: [
    'session_started',
    'set_confirmed',
    'set_undone',
    'session_logged_as_planned',
    'session_completed',
    'session_partial',
    'pr_detected',
    'progression_suggested',
    'plateau_detected',
    'pain_flagged',
  ],
  nutrition: [
    'meal_logged',
    'favorite_meal_saved',
    'meal_repeated',
    'photo_estimate_requested',
    'photo_estimate_confirmed',
    'nutrition_half_completed',
  ],
  dayAndGame: [
    'day_closed',
    'streak_extended',
    'freeze_earned',
    'freeze_used',
    'streak_reset',
    'streak_repair_offered',
    'streak_repaired',
    'xp_awarded',
    'level_up',
    'week_closed',
    'quest_generated',
    'quest_completed',
    'achievement_unlocked',
    'season_started',
    'season_closed',
  ],
  progress: [
    'weekly_summary_sent',
    'progress_viewed',
    'weight_logged',
    'achievement_log_viewed',
    'goal_completed',
    'goal_partially_completed',
    'maintenance_entered',
    'maintenance_band_exited',
    'phase_reviewed',
    'miniapp_opened',
  ],
  messages: [
    'message_scheduled',
    'message_suppressed',
    'message_sent',
    'message_actioned',
    'message_ignored',
    'backoff_applied',
    'inactivity_pause_started',
    'reactivation_sent',
    'pause_set',
    'message_settings_changed',
    'bot_blocked',
  ],
  integrations: [
    'export_requested',
    'export_delivered',
    'ingestion_token_created',
    'ingestion_received',
    'ingestion_rejected',
    'ingestion_token_revoked',
  ],
  safety: [
    'number_free_mode_enabled',
    'risk_signal_detected',
    'care_response_sent',
    'overuse_signal',
    'deletion_requested',
    'deletion_completed',
  ],
} as const;

export type EventName = (typeof EVENT_NAMES_BY_MODULE)[keyof typeof EVENT_NAMES_BY_MODULE][number];

export const EVENT_NAMES: readonly EventName[] = Object.values(EVENT_NAMES_BY_MODULE).flat();

/** Fase del protocolo N-de-1 o de la alfa (plan de medición §1 y §5). */
export const STUDY_PHASES = ['n1_A1', 'n1_B', 'n1_A2', 'alpha'] as const;
export type StudyPhase = (typeof STUDY_PHASES)[number];
