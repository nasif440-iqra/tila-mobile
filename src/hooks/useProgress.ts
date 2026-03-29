import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "../db/provider";
import {
  loadProgress,
  saveCompletedLesson,
  saveQuestionAttempts,
  saveMasteryEntity,
  saveMasterySkill,
  saveMasteryConfusion,
  saveUserProfile,
  type ProgressState,
  type UserProfileUpdate,
} from "../engine/progress";
import {
  mergeQuizResultsIntoMastery,
  normalizeEntityKey,
} from "../engine/mastery";
import type { QuestionAttempt, QuizResultItem } from "../types/quiz";

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
      questions: QuestionAttempt[],
      quizResultItems?: QuizResultItem[]
    ) => {
      const attemptId = await saveCompletedLesson(
        db,
        lessonId,
        accuracy,
        passed
      );
      if (questions.length > 0) {
        await saveQuestionAttempts(db, attemptId, questions);
      }
      await refresh();

      // Wire mastery pipeline (Phase 5: CEL-03 prerequisite)
      if (quizResultItems && quizResultItems.length > 0) {
        const today = new Date().toISOString().slice(0, 10);
        const currentMastery = state?.mastery ?? {
          entities: {},
          skills: {},
          confusions: {},
        };

        // Enrich quiz results with keys needed by mastery engine
        const enrichedResults = quizResultItems.map((r) => ({
          ...r,
          targetKey: normalizeEntityKey(r.targetId, r),
          skillKeys: [] as string[],
        }));

        const updatedMastery = mergeQuizResultsIntoMastery(
          currentMastery,
          enrichedResults,
          today
        );

        // Persist updated entities
        for (const [key, entityState] of Object.entries(
          updatedMastery.entities
        )) {
          await saveMasteryEntity(db, key, entityState as any);
        }
        // Persist updated skills
        for (const [key, skillState] of Object.entries(
          updatedMastery.skills
        )) {
          await saveMasterySkill(db, key, skillState as any);
        }
        // Persist updated confusions
        for (const [key, confusionState] of Object.entries(
          updatedMastery.confusions
        )) {
          await saveMasteryConfusion(db, key, confusionState as any);
        }

        // Refresh again to pick up mastery changes
        await refresh();
      }

      return attemptId;
    },
    [db, refresh, state]
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
