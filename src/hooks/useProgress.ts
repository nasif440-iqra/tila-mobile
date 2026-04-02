import { useState, useEffect, useCallback } from "react";
import { useDatabase } from "../db/provider";
import {
  loadProgress,
  saveCompletedLesson,
  saveQuestionAttempts,
  saveUserProfile,
  saveMasteryResults,
  type ProgressState,
  type UserProfileUpdate,
} from "../engine/progress";
import type { QuestionAttempt, QuizResultItem } from "../types/quiz";
import { normalizeEntityKey, mergeQuizResultsIntoMastery } from "../engine/mastery";
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
    ): Promise<{ attemptId: number; updatedMastery: ProgressState['mastery'] }> => {
      let attemptId = 0;
      let updatedMastery = {
        entities: {},
        skills: {},
        confusions: {},
      } as ProgressState['mastery'];

      await db.withExclusiveTransactionAsync(async (txn) => {
        // Write 1: lesson attempt — pass txn instead of db
        attemptId = await saveCompletedLesson(txn, lessonId, accuracy, passed);

        // Write 2..N: question attempts — pass txn instead of db
        if (questions.length > 0) {
          await saveQuestionAttempts(txn, attemptId, questions);
        }

        // Mastery pipeline
        if (quizResultItems && quizResultItems.length > 0) {
          const today = new Date().toISOString().slice(0, 10);
          // Read fresh mastery through txn (sees uncommitted writes in this transaction)
          const freshProgress = await loadProgress(txn);
          const currentMastery = freshProgress.mastery;

          // Enrich results with targetKey
          const enriched = quizResultItems.map((r) => ({
            ...r,
            targetKey: normalizeEntityKey(r.targetId, r),
          }));

          updatedMastery = mergeQuizResultsIntoMastery(currentMastery, enriched, today) as ProgressState['mastery'];

          // Persist updated entities through txn
          for (const [key, entity] of Object.entries(updatedMastery.entities)) {
            await saveMasteryEntity(txn, key, entity as EntityState);
          }
          for (const [key, skill] of Object.entries(updatedMastery.skills)) {
            await saveMasterySkill(txn, key, skill as SkillState);
          }
          for (const [key, confusion] of Object.entries(updatedMastery.confusions)) {
            await saveMasteryConfusion(txn, key, confusion as ConfusionState);
          }
        }
      });

      // Single refresh at the end after all writes are complete
      await refresh();

      return { attemptId, updatedMastery };
    },
    [db, refresh]
  );

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
      await refresh();
    },
    [db, refresh]
  );

  return {
    ...state,
    loading,
    completeLesson,
    saveMasteryOnly,
    updateProfile,
    refresh,
  };
}
