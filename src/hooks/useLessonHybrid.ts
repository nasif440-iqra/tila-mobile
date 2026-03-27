import { useState, useCallback, useEffect, useRef } from "react";
import { generateHybridExercises } from "../engine/questions/index.js";

// ── Stage classification ──

const GUIDED_TYPES = new Set([
  "guided_reveal",
  "form_intro",
  "letter_in_context",
  "tap_in_order",
]);
const BUILDUP_TYPES = new Set(["buildup", "buildup_pair", "buildup_word"]);
const FREE_TYPES = new Set(["free_read", "comprehension", "spot_the_break"]);

export type Stage = "guided" | "buildup" | "free";

function classifyStage(type: string): Stage {
  if (GUIDED_TYPES.has(type)) return "guided";
  if (BUILDUP_TYPES.has(type)) return "buildup";
  if (FREE_TYPES.has(type)) return "free";
  return "guided";
}

function buildLessonStages(exercises: any[]): any[] {
  return exercises.map((ex) => ({
    ...ex,
    stage: classifyStage(ex.type),
  }));
}

// ── Progress computation ──

export function computeHybridProgress(
  currentIndex: number,
  totalExercises: number
): number {
  if (totalExercises <= 0) return 0;
  return Math.min(100, Math.max(0, (currentIndex / totalExercises) * 100));
}

// ── Hook ──

export default function useLessonHybrid(lesson: any) {
  const [exercises, setExercises] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const generatedRef = useRef(false);

  useEffect(() => {
    if (!lesson || generatedRef.current) return;
    generatedRef.current = true;
    const generated = generateHybridExercises(lesson, {});
    const staged = buildLessonStages(generated);
    setExercises(staged);
  }, [lesson]);

  const advance = useCallback(
    (result: any) => {
      setResults((prev) => [...prev, result]);
      const nextIndex = currentIndex + 1;
      if (nextIndex >= exercises.length) {
        setIsComplete(true);
      } else {
        setCurrentIndex(nextIndex);
      }
    },
    [currentIndex, exercises.length]
  );

  const currentExercise = exercises[currentIndex] || null;
  const currentStage: Stage = currentExercise?.stage ?? "guided";
  const correctCount = results.filter((r) => r.correct).length;
  const progress = computeHybridProgress(currentIndex, exercises.length);

  return {
    currentExercise,
    currentStage,
    exerciseIndex: currentIndex,
    totalExercises: exercises.length,
    progress,
    advance,
    isComplete,
    results: {
      correct: correctCount,
      total: results.length,
      questions: results,
    },
  };
}
