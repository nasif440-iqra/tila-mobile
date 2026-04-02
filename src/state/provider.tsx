import { createContext, useCallback, useMemo, type ReactNode } from 'react';
import { useProgress } from '../hooks/useProgress';
import { useHabit } from '../hooks/useHabit';
import type { AppStateContextValue, AppState } from './types';

export const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const progressHook = useProgress();
  const { habit, refresh: refreshHabit } = useHabit();

  // SubscriptionState comes from SubscriptionProvider above us in the tree.
  // We don't duplicate it -- consumers use useSubscription() directly.

  const refreshAll = useCallback(async () => {
    await Promise.all([
      progressHook.refresh(),
      refreshHabit(),
    ]);
  }, [progressHook.refresh, refreshHabit]);

  const progress: AppState['progress'] = progressHook.loading
    ? null
    : {
        completedLessonIds: progressHook.completedLessonIds ?? [],
        mastery: progressHook.mastery ?? { entities: {}, skills: {}, confusions: {} },
        habit: progressHook.habit ?? {
          lastPracticeDate: null,
          currentWird: 0,
          longestWird: 0,
          todayLessonCount: 0,
        },
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
    refreshAll,
  }), [progress, habit, progressHook.loading, refreshAll]);

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}
