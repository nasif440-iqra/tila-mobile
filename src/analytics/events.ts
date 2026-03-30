// src/analytics/events.ts

export interface AppOpenedProps {
  first_open: boolean;
  days_since_install: number;
}

export interface OnboardingStepViewedProps {
  step_index: number;
  step_name: 'welcome' | 'tilawat' | 'hadith' | 'starting_point' | 'bismillah' | 'letter_reveal' | 'letter_audio' | 'letter_quiz' | 'finish';
}

export interface OnboardingCompletedProps {
  starting_point: string;
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
}

export type EventName = keyof EventMap;
