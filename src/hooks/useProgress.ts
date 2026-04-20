import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "../db/provider";
import {
  loadProgress,
  saveUserProfile,
  saveMasteryResults,
  type ProgressState,
  type UserProfileUpdate,
} from "../engine/progress";
import type { QuizResultItem } from "../types/quiz";

export function useProgress() {
  const db = useDatabase();
  const [state, setState] = useState<ProgressState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await loadProgress(db);
    setState(data);
    setLoading(false);
  }, [db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveMasteryOnly = useCallback(
    async (quizResultItems: QuizResultItem[]) => {
      const freshProgress = await loadProgress(db);
      await saveMasteryResults(db, quizResultItems, freshProgress.mastery);
      await refresh();
    },
    [db, refresh]
  );

  const updateProfile = useCallback(
    async (profile: UserProfileUpdate) => {
      await saveUserProfile(db, profile);
      // Optimistically patch local state instead of full DB re-read.
      // UserProfileUpdate keys map to ProgressState fields.
      setState((prev) => {
        if (!prev) return prev;
        const patched = { ...prev };
        if (profile.onboarded !== undefined) patched.onboarded = profile.onboarded;
        if (profile.onboardingVersion !== undefined) patched.onboardingVersion = profile.onboardingVersion;
        if (profile.startingPoint !== undefined) patched.onboardingStartingPoint = profile.startingPoint;
        if (profile.motivation !== undefined) patched.onboardingMotivation = profile.motivation;
        if (profile.name !== undefined) patched.userName = profile.name;
        if (profile.dailyGoal !== undefined) patched.onboardingDailyGoal = profile.dailyGoal;
        if (profile.commitmentComplete !== undefined) patched.onboardingCommitmentComplete = profile.commitmentComplete;
        if (profile.wirdIntroSeen !== undefined) patched.wirdIntroSeen = profile.wirdIntroSeen;
        if (profile.postLessonOnboardSeen !== undefined) patched.postLessonOnboardSeen = profile.postLessonOnboardSeen;
        if (profile.returnHadithLastShown !== undefined) patched.returnHadithLastShown = profile.returnHadithLastShown;
        if (profile.analyticsConsent !== undefined) patched.analyticsConsent = profile.analyticsConsent;
        return patched;
      });
    },
    [db]
  );

  return {
    ...state,
    loading,
    saveMasteryOnly,
    updateProfile,
    refresh,
  };
}
