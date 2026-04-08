import { useState, useEffect, useCallback, useRef } from "react";

import type { LessonV2 } from "@/src/types/curriculum-v2";
import type { ExerciseItem, ScoredItem } from "@/src/types/exercise";
import type { LessonResult } from "@/src/engine/v2/scoring";
import { evaluateLesson } from "@/src/engine/v2/scoring";
import { recordAttempt, createEntityMastery } from "@/src/engine/v2/mastery";
import type { EntityMastery, RecentAttempt } from "@/src/engine/v2/mastery";
import { generateV2Exercises } from "@/src/engine/questions-v2/index";
import { resolveAll } from "@/src/engine/v2/entityRegistry";
import type { useProgressV2 } from "./useProgressV2";
import type { useMasteryV2 } from "./useMasteryV2";

// ── Types ──

type QuizPhase = "generating" | "active" | "scoring" | "complete";

export interface UseLessonQuizV2Return {
  phase: QuizPhase;
  currentItem: ExerciseItem | null;
  itemIndex: number;
  totalItems: number;
  isExitBlock: boolean;
  isComplete: boolean;
  result: LessonResult | null;
  error: string | null;
  handleAnswer: (correct: boolean, answerId: string) => void;
}

// ── Hook ──

export function useLessonQuizV2(
  lesson: LessonV2,
  progressHook: ReturnType<typeof useProgressV2>,
  masteryHook: ReturnType<typeof useMasteryV2>,
): UseLessonQuizV2Return {
  const [phase, setPhase] = useState<QuizPhase>("generating");
  const [items, setItems] = useState<ExerciseItem[]>([]);
  const [itemIndex, setItemIndex] = useState(0);
  const [scoredItems, setScoredItems] = useState<ScoredItem[]>([]);
  const [result, setResult] = useState<LessonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track per-item start time for responseTimeMs
  const itemStartRef = useRef<number>(Date.now());
  // Guard against double-generation in strict mode / concurrent renders
  const generatedRef = useRef(false);

  // ── Phase 1: generating ──
  useEffect(() => {
    if (generatedRef.current) return;
    generatedRef.current = true;

    async function generate() {
      try {
        // Resolve all unlocked entities from teach + review IDs
        const allEntityIds = [...lesson.teachEntityIds, ...lesson.reviewEntityIds];
        const allUnlockedEntities = await resolveAll(allEntityIds);

        const generated = await generateV2Exercises(
          lesson,
          allUnlockedEntities,
          masteryHook.snapshot,
        );

        if (!generated || generated.length === 0) {
          setError(
            "No exercises could be generated for this lesson. Please try a different lesson or contact support.",
          );
          return;
        }

        setItems(generated);
        itemStartRef.current = Date.now();
        setPhase("active");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(`Failed to generate exercises: ${message}`);
      }
    }

    generate();
  }, [lesson, masteryHook.snapshot]);

  // ── Phase 3: scoring (triggered when scoredItems reaches totalItems) ──
  useEffect(() => {
    if (phase !== "scoring") return;

    async function score() {
      try {
        // Evaluate the lesson
        const lessonResult = evaluateLesson(lesson.id, scoredItems, lesson.masteryPolicy);

        // Build mastery updates — one per unique entity across all scored items
        const masteryMap = new Map<string, EntityMastery>();

        for (const scored of scoredItems) {
          const entityId = scored.item.targetEntityId;

          // Get or initialise mastery for this entity
          let mastery = masteryMap.get(entityId);
          if (!mastery) {
            mastery = await masteryHook.getOrCreateMastery(entityId);
          }

          const attempt: RecentAttempt = {
            correct: scored.correct,
            exerciseType: scored.generatedBy,
            answerMode: scored.answerMode,
            timestamp: new Date().toISOString(),
          };

          mastery = recordAttempt(mastery, attempt, lessonResult.passed);
          masteryMap.set(entityId, mastery);
        }

        // Persist mastery updates
        await masteryHook.saveMasteryUpdates(Array.from(masteryMap.values()));

        // Persist lesson completion
        await progressHook.completeLesson(lesson.id, lessonResult, scoredItems);

        setResult(lessonResult);
        setPhase("complete");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(`Failed to save lesson results: ${message}`);
      }
    }

    score();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── handleAnswer ──

  const handleAnswer = useCallback(
    (correct: boolean, answerId: string) => {
      const currentItem = items[itemIndex];
      if (!currentItem || phase !== "active") return;

      const responseTimeMs = Date.now() - itemStartRef.current;
      itemStartRef.current = Date.now();

      const scored: ScoredItem = {
        item: currentItem,
        correct,
        responseTimeMs,
        generatedBy: currentItem.generatedBy ?? currentItem.type,
        assessmentBucket: currentItem.assessmentBucket,
        answerMode: currentItem.answerMode,
      };

      const nextIndex = itemIndex + 1;

      setScoredItems((prev) => {
        const updated = [...prev, scored];

        if (nextIndex >= items.length) {
          // All items answered — transition to scoring using updated array
          setPhase("scoring");
          // Store the final scored list so the scoring effect can use it
          return updated;
        }

        return updated;
      });

      if (nextIndex < items.length) {
        setItemIndex(nextIndex);
      }
    },
    [items, itemIndex, phase],
  );

  // ── Exit block detection ──
  // An item is in the exit block if it has isDecodeItem=true and is among the
  // last N items in the plan, where N = decodePassRequired (if set).
  const decodePassRequired = lesson.masteryPolicy.decodePassRequired;

  let isExitBlock = false;
  if (decodePassRequired !== undefined && items.length > 0) {
    const exitBlockStart = items.length - decodePassRequired;
    if (itemIndex >= exitBlockStart && items[itemIndex]?.isDecodeItem) {
      isExitBlock = true;
    }
  }

  // ── Derived values ──

  const currentItem = phase === "active" ? (items[itemIndex] ?? null) : null;

  return {
    phase,
    currentItem,
    itemIndex,
    totalItems: items.length,
    isExitBlock,
    isComplete: phase === "complete",
    result,
    error,
    handleAnswer,
  };
}
