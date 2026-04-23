import { useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { advanceCursor, retreatCursor } from "./cursor";
import { computeLessonOutcome, type ScreenOutcome, type LessonOutcome } from "./outcome";
import type { MasteryRecorder } from "./mastery-recorder";
import type { LessonData, Screen, EntityKey } from "../types";

export interface EntityAttempt {
  entityKey: EntityKey;
  itemId: string;
  correct: boolean;
}

export type { ScreenOutcome, LessonOutcome };

export interface LessonRunnerProps {
  lesson: LessonData;
  masteryRecorder: MasteryRecorder;
  onComplete: (outcome: LessonOutcome) => void;
  renderScreen: (args: {
    screen: Screen;
    advance: (outcome?: ScreenOutcome) => void;
    reportAttempt: (attempts: EntityAttempt[]) => void;
    goBack: () => void;
    canGoBack: boolean;
    index: number;
    total: number;
  }) => ReactNode;
}

// Note: the runner does NOT expose an onExit prop. Hardware-back + close-button
// confirm/exit is a chrome+route concern (LessonChrome fires onExitRequested,
// which the route wires to router.replace("/(tabs)")). Keeping that boundary
// clean means the runner never handles routing.
export function LessonRunner({
  lesson,
  masteryRecorder,
  onComplete,
  renderScreen,
}: LessonRunnerProps) {
  const [index, setIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const outcomesRef = useRef<Map<string, ScreenOutcome>>(new Map());

  const total = lesson.screens.length;
  const currentScreen = lesson.screens[index];
  const canGoBack =
    index > 0 && currentScreen?.allowBack !== false && !isComplete;

  const emitEntityAttempts = useCallback(
    (attempts: EntityAttempt[]) => {
      const now = Date.now();
      for (const a of attempts) {
        void masteryRecorder.recordEntityAttempt({
          entityKey: a.entityKey,
          correct: a.correct,
          lessonId: lesson.id,
          itemId: a.itemId,
          attemptedAt: now,
        });
      }
    },
    [masteryRecorder, lesson.id]
  );

  const reportAttempt = useCallback(
    (attempts: EntityAttempt[]) => {
      emitEntityAttempts(attempts);
    },
    [emitEntityAttempts]
  );

  const advance = useCallback(
    (outcome?: ScreenOutcome) => {
      if (isComplete) return;

      if (outcome) {
        outcomesRef.current.set(outcome.screenId, outcome);
        emitEntityAttempts(outcome.entityAttempts);
      }

      const result = advanceCursor(index, total);
      if (result.complete) {
        setIsComplete(true);
        const lessonOutcome = computeLessonOutcome(lesson, outcomesRef.current);
        void masteryRecorder.recordLessonOutcome({
          lessonId: lessonOutcome.lessonId,
          passed: lessonOutcome.passed,
          itemsTotal: lessonOutcome.itemsTotal,
          itemsCorrect: lessonOutcome.itemsCorrect,
          completedAt: Date.now(),
        });
        onComplete(lessonOutcome);
      } else if (result.nextIndex !== null) {
        setIndex(result.nextIndex);
      }
    },
    [isComplete, index, total, lesson, masteryRecorder, onComplete, emitEntityAttempts]
  );

  const goBack = useCallback(() => {
    if (isComplete) return;
    if (!canGoBack) return;
    const result = retreatCursor(index, total);
    if (result.prevIndex !== null) setIndex(result.prevIndex);
  }, [isComplete, canGoBack, index, total]);

  if (total === 0 || !currentScreen) return null;

  return (
    <>
      {renderScreen({
        screen: currentScreen,
        advance,
        reportAttempt,
        goBack,
        canGoBack,
        index,
        total,
      })}
    </>
  );
}
