import { useState, useEffect, useCallback } from "react";

import { useDatabase } from "../db/provider";
import type { LessonResult } from "../engine/v2/scoring";
import type { ScoredItem } from "../types/exercise";

// ── Types ──

interface UseProgressV2Return {
  completedLessonIds: number[];
  loading: boolean;
  completeLesson: (lessonId: number, result: LessonResult, scoredItems: ScoredItem[]) => Promise<void>;
  phaseCompleted: (phase: number) => boolean;
  markPhaseComplete: (phase: number) => Promise<void>;
  reload: () => Promise<void>;
}

// ── Hook ──

export function useProgressV2(): UseProgressV2Return {
  const db = useDatabase();
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
  const [completedPhases, setCompletedPhases] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);

    const lessons = await db.getAllAsync<{ lesson_id: number }>(
      "SELECT DISTINCT lesson_id FROM v2_lesson_attempts WHERE passed = 1 AND profile_id = 'local'"
    );
    setCompletedLessonIds(lessons.map((r) => r.lesson_id));

    const phases = await db.getAllAsync<{ phase: number }>(
      "SELECT phase FROM v2_phase_completion WHERE profile_id = 'local'"
    );
    setCompletedPhases(new Set(phases.map((r) => r.phase)));

    setLoading(false);
  }, [db]);

  // Load on mount
  useEffect(() => {
    reload();
  }, [reload]);

  const completeLesson = useCallback(
    async (lessonId: number, result: LessonResult, scoredItems: ScoredItem[]) => {
      await db.withExclusiveTransactionAsync(async () => {
        // Write lesson attempt
        await db.runAsync(
          `INSERT INTO v2_lesson_attempts (
            profile_id, lesson_id, passed, overall_percent, decode_percent,
            final_decode_streak, failure_reasons, bucket_scores,
            total_items, correct_items, decode_items, decode_correct
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            "local",
            lessonId,
            result.passed ? 1 : 0,
            result.overallPercent,
            result.decodePercent,
            result.finalDecodeStreak,
            JSON.stringify(result.failureReasons),
            JSON.stringify(result.bucketScores),
            result.totalItems,
            result.correctItems,
            result.decodeItems,
            result.decodeCorrect,
          ]
        );

        // Write question attempts
        for (const scored of scoredItems) {
          await db.runAsync(
            `INSERT INTO v2_question_attempts (
              profile_id, lesson_id, entity_id, exercise_type, answer_mode,
              correct, response_time_ms, assessment_bucket
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              "local",
              lessonId,
              scored.item.targetEntityId,
              scored.generatedBy,
              scored.answerMode,
              scored.correct ? 1 : 0,
              scored.responseTimeMs,
              scored.assessmentBucket ?? null,
            ]
          );
        }
      });

      await reload();
    },
    [db, reload]
  );

  const phaseCompleted = useCallback(
    (phase: number) => completedPhases.has(phase),
    [completedPhases]
  );

  const markPhaseComplete = useCallback(
    async (phase: number) => {
      await db.runAsync(
        "INSERT OR IGNORE INTO v2_phase_completion (phase, profile_id) VALUES (?, ?)",
        [phase, "local"]
      );
      await reload();
    },
    [db, reload]
  );

  return {
    completedLessonIds,
    loading,
    completeLesson,
    phaseCompleted,
    markPhaseComplete,
    reload,
  };
}
