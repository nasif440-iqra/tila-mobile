import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "../db/provider";
import {
  loadProgress,
  saveCompletedLesson,
  saveQuestionAttempts,
  saveUserProfile,
  type ProgressState,
  type QuestionAttempt,
  type UserProfileUpdate,
} from "../engine/progress";

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

  const completeLesson = useCallback(
    async (
      lessonId: number,
      accuracy: number,
      passed: boolean,
      durationSeconds: number,
      questions: QuestionAttempt[]
    ) => {
      const attemptId = await saveCompletedLesson(
        db,
        lessonId,
        accuracy,
        passed,
        durationSeconds
      );
      if (questions.length > 0) {
        await saveQuestionAttempts(db, attemptId, questions);
      }
      await refresh();
      return attemptId;
    },
    [db, refresh]
  );

  const updateProfile = useCallback(
    async (profile: UserProfileUpdate) => {
      await saveUserProfile(db, profile);
      await refresh();
    },
    [db, refresh]
  );

  return {
    ...state,
    loading,
    completeLesson,
    updateProfile,
    refresh,
  };
}
