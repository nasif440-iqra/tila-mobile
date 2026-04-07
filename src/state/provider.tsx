import { createContext, useCallback, useMemo, type ReactNode } from 'react';
import { useProgress } from '../hooks/useProgress';
import { useDatabase } from '../db/provider';
import { getTodayDateString, getDayDifference } from '../engine/dateUtils';
import type { HabitState } from '../engine/progress';
import type { AppStateContextValue, AppState } from './types';

export const AppStateContext = createContext<AppStateContextValue | null>(null);

const DEFAULT_HABIT: HabitState = {
  lastPracticeDate: null,
  currentWird: 0,
  longestWird: 0,
  todayLessonCount: 0,
};

export function AppStateProvider({ children }: { children: ReactNode }) {
  const db = useDatabase();
  const progressHook = useProgress();

  // Habit reads come from loadProgress() — no separate useHabit() needed.
  // recordPractice is the only habit mutation the provider must expose.
  const habit = progressHook.habit ?? DEFAULT_HABIT;

  const recordPractice = useCallback(async () => {
    await db.withExclusiveTransactionAsync(async (txn) => {
      const row = await txn.getFirstAsync<{
        last_practice_date: string | null;
        current_wird: number;
        longest_wird: number;
        today_lesson_count: number;
      }>('SELECT last_practice_date, current_wird, longest_wird, today_lesson_count FROM habit WHERE id = 1');

      if (!row) return;

      const today = getTodayDateString();
      const gap = row.last_practice_date ? getDayDifference(today, row.last_practice_date) : -1;

      let newWird = row.current_wird;
      let newLongest = row.longest_wird;
      let newTodayCount = row.today_lesson_count;

      if (gap === 0) {
        newTodayCount += 1;
      } else if (gap === 1) {
        newWird += 1;
        newTodayCount = 1;
      } else {
        newWird = 1;
        newTodayCount = 1;
      }

      if (newWird > newLongest) {
        newLongest = newWird;
      }

      await txn.runAsync(
        `UPDATE habit SET last_practice_date = ?, current_wird = ?, longest_wird = ?, today_lesson_count = ?, updated_at = datetime('now') WHERE id = 1`,
        today, newWird, newLongest, newTodayCount,
      );
    });

    // Reload progress (includes habit) after the write
    await progressHook.refresh();
  }, [db, progressHook.refresh]);

  // SubscriptionState comes from SubscriptionProvider above us in the tree.
  // We don't duplicate it -- consumers use useSubscription() directly.

  const progress: AppState['progress'] = progressHook.loading
    ? null
    : {
        completedLessonIds: progressHook.completedLessonIds ?? [],
        mastery: progressHook.mastery ?? { entities: {}, skills: {}, confusions: {} },
        habit,
        onboarded: progressHook.onboarded ?? false,
        onboardingStartingPoint: progressHook.onboardingStartingPoint ?? null,
        onboardingMotivation: progressHook.onboardingMotivation ?? null,
        onboardingDailyGoal: progressHook.onboardingDailyGoal ?? null,
        onboardingCommitmentComplete: progressHook.onboardingCommitmentComplete ?? false,
        onboardingVersion: progressHook.onboardingVersion ?? 0,
        userName: progressHook.userName ?? null,
        wirdIntroSeen: progressHook.wirdIntroSeen ?? false,
        postLessonOnboardSeen: progressHook.postLessonOnboardSeen ?? false,
        returnHadithLastShown: progressHook.returnHadithLastShown ?? null,
        analyticsConsent: progressHook.analyticsConsent ?? null,
      };

  const value = useMemo<AppStateContextValue>(() => ({
    progress,
    habit,
    subscription: null, // Accessed via useSubscription() directly
    loading: progressHook.loading,
    refreshAll: progressHook.refresh,
    updateProfile: progressHook.updateProfile,
    completeLesson: progressHook.completeLesson,
    saveMasteryOnly: progressHook.saveMasteryOnly,
    recordPractice,
    refresh: progressHook.refresh,
  }), [progress, habit, progressHook.loading, progressHook.refresh,
       progressHook.updateProfile, progressHook.completeLesson,
       progressHook.saveMasteryOnly, recordPractice]);

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}
