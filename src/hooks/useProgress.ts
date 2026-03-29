import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "../db/provider";
import {
  loadProgress,
  saveCompletedLesson,
  saveQuestionAttempts,
  saveUserProfile,
  type ProgressState,
  type UserProfileUpdate,
} from "../engine/progress";
import type { QuestionAttempt, QuizResultItem } from "../types/quiz";
import { normalizeEntityKey, mergeQuizResultsIntoMastery } from "../engine/mastery.js";
import {
  saveMasteryEntity,
  saveMasterySkill,
  saveMasteryConfusion,
  type EntityState,
  type SkillState,
  type ConfusionState,
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

      // Wire mastery pipeline if quizResultItems provided
      if (quizResultItems && quizResultItems.length > 0) {
        const today = new Date().toISOString().slice(0, 10);
        const currentMastery = state?.mastery ?? { entities: {}, skills: {}, confusions: {} };

        // Enrich results with targetKey
        const enriched = quizResultItems.map((r) => ({
          ...r,
          targetKey: normalizeEntityKey(r.targetId, r),
        }));

        const updatedMastery = mergeQuizResultsIntoMastery(currentMastery, enriched, today);

        // Persist updated entities
        for (const [key, entity] of Object.entries(updatedMastery.entities)) {
          await saveMasteryEntity(db, key, entity as EntityState);
        }
        for (const [key, skill] of Object.entries(updatedMastery.skills)) {
          await saveMasterySkill(db, key, skill as SkillState);
        }
        for (const [key, confusion] of Object.entries(updatedMastery.confusions)) {
          await saveMasteryConfusion(db, key, confusion as ConfusionState);
        }
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
