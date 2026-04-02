// src/analytics/events.ts

export interface AppOpenedProps {
  first_open: boolean;
  days_since_install: number;
}

export interface OnboardingStepViewedProps {
  step_index: number;
  step_name: 'welcome' | 'tilawat' | 'hadith' | 'starting_point' | 'bismillah' | 'letter_reveal' | 'letter_audio' | 'letter_quiz' | 'name_motivation' | 'finish';
}

export interface OnboardingCompletedProps {
  starting_point: string;
  motivation: string;
  has_name: boolean;
  duration_seconds: number;
}

export interface LessonStartedProps {
  lesson_id: number;
  phase: number;
  lesson_mode: string;
  is_retry: boolean;
}

export interface LessonCompletedProps {
  lesson_id: number;
  phase: number;
  accuracy: number;
  duration_seconds: number;
  total_questions: number;
  streak_peak: number;
}

export interface LessonFailedProps {
  lesson_id: number;
  phase: number;
  accuracy: number;
  duration_seconds: number;
  total_questions: number;
}

export interface PhaseCompletedProps {
  phase: number;
  total_lessons: number;
}

export interface LetterAudioPlayedProps {
  letter_id: number;
  audio_type: 'name' | 'sound';
  context: 'quiz' | 'onboarding' | 'review';
}

export interface MasteryStateChangedProps {
  letter_id: number;
  from_state: 'not_started' | 'introduced' | 'unstable' | 'accurate' | 'retained';
  to_state: 'not_started' | 'introduced' | 'unstable' | 'accurate' | 'retained';
  attempts_at_transition: number;
}

export interface ReturnWelcomeShownProps {
  days_since_last_practice: number;
  current_wird: number;
  streak_broke: boolean;
  longest_wird: number;
}

export interface PaywallShownProps {
  trigger: "lesson_7_summary" | "lesson_locked" | "expired_card" | "home_upsell";
  offering_id?: string;
}

export interface PaywallResultProps {
  trigger: "lesson_7_summary" | "lesson_locked" | "expired_card" | "home_upsell";
  result: "purchased" | "restored" | "cancelled" | "error" | "not_presented";
}

export interface PurchaseCompletedProps {
  product_id: string;
  plan: "monthly" | "annual";
  is_trial: boolean;
  price?: number;
  currency?: string;
}

export interface PurchaseFailedProps {
  product_id: string;
  error_code?: string;
  error_message?: string;
}

export interface RestoreCompletedProps {
  success: boolean;
  entitlements_restored: number;
}

export interface RestoreFailedProps {
  error_code?: string;
  error_message?: string;
}

export interface TrialExpiredProps {
  days_used: number;
  lessons_completed_during_trial: number;
}

export interface EntitlementChangedProps {
  old_stage: "free" | "trial" | "paid" | "expired" | "unknown";
  new_stage: "free" | "trial" | "paid" | "expired" | "unknown";
}

export interface ScholarshipLinkTappedProps {
  trigger: string;
}

export interface AuthSignInProps {
  method: 'email' | 'apple' | 'google';
}

export interface AuthSignOutProps {
  had_synced_data: boolean;
}

export interface SyncCompletedProps {
  pushed: number;
  pulled: number;
  errors: number;
  duration_ms: number;
}

export interface SyncFailedProps {
  error_message: string;
  table?: string;
}

export interface EventMap {
  app_opened: AppOpenedProps;
  onboarding_step_viewed: OnboardingStepViewedProps;
  onboarding_completed: OnboardingCompletedProps;
  lesson_started: LessonStartedProps;
  lesson_completed: LessonCompletedProps;
  lesson_failed: LessonFailedProps;
  phase_completed: PhaseCompletedProps;
  letter_audio_played: LetterAudioPlayedProps;
  mastery_state_changed: MasteryStateChangedProps;
  return_welcome_shown: ReturnWelcomeShownProps;
  paywall_shown: PaywallShownProps;
  paywall_result: PaywallResultProps;
  purchase_completed: PurchaseCompletedProps;
  purchase_failed: PurchaseFailedProps;
  restore_completed: RestoreCompletedProps;
  restore_failed: RestoreFailedProps;
  trial_expired: TrialExpiredProps;
  entitlement_changed: EntitlementChangedProps;
  scholarship_link_tapped: ScholarshipLinkTappedProps;
  auth_sign_in: AuthSignInProps;
  auth_sign_out: AuthSignOutProps;
  sync_completed: SyncCompletedProps;
  sync_failed: SyncFailedProps;
}

export type EventName = keyof EventMap;
