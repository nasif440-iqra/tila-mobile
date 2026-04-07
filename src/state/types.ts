import type { ProgressState, HabitState, UserProfileUpdate } from '../engine/progress';
import type { SubscriptionState } from '../monetization/provider';
import type { QuestionAttempt, QuizResultItem } from '../types/quiz';

export interface AppState {
  progress: ProgressState | null;
  habit: HabitState | null;
  subscription: SubscriptionState | null;
  loading: boolean;
}

export interface AppStateContextValue extends AppState {
  refreshAll: () => Promise<void>;
  /** Update user profile flags (optimistic local patch + DB write). */
  updateProfile: (profile: UserProfileUpdate) => Promise<void>;
  /** Record a completed lesson + mastery updates in a single transaction. */
  completeLesson: (
    lessonId: number,
    accuracy: number,
    passed: boolean,
    questions: QuestionAttempt[],
    quizResultItems?: QuizResultItem[]
  ) => Promise<{ attemptId: number; updatedMastery: ProgressState['mastery'] }>;
  /** Save mastery results without a lesson completion. */
  saveMasteryOnly: (quizResultItems: QuizResultItem[]) => Promise<void>;
  /** Record a practice session (updates habit streak). */
  recordPractice: () => Promise<void>;
  /** Force a full refresh from DB. */
  refresh: () => Promise<void>;
}
