// src/curriculum/runtime/outcome.ts

import type { LessonData, Screen } from "../types";

export interface ScreenOutcome {
  screenId: string;
  correct: boolean;
  entityAttempts: Array<{
    entityKey: string;
    itemId: string;
    correct: boolean;
  }>;
}

export interface LessonOutcome {
  lessonId: string;
  passed: boolean;
  itemsTotal: number;
  itemsCorrect: number;
  decodingRuleSatisfied: boolean;
}

function isScored(screen: Screen): boolean {
  return screen.kind === "exercise" && screen.scored !== false;
}

function isDecoding(screen: Screen): boolean {
  return screen.kind === "exercise" && screen.countsAsDecoding === true;
}

export function computeLessonOutcome(
  lesson: LessonData,
  outcomes: Map<string, ScreenOutcome>
): LessonOutcome {
  const scoredScreens = lesson.screens.filter(isScored);
  const itemsTotal = scoredScreens.length;
  const itemsCorrect = scoredScreens.filter((s) => {
    const o = outcomes.get(s.id);
    return o?.correct === true;
  }).length;

  const decodingRuleSatisfied = (() => {
    if (!lesson.passCriteria.requireCorrectLastTwoDecoding) return true;
    const decodingScreens = lesson.screens.filter(isDecoding);
    const lastTwo = decodingScreens.slice(-2);
    if (lastTwo.length < 2) return true;
    return lastTwo.every((s) => outcomes.get(s.id)?.correct === true);
  })();

  const passed = (() => {
    if (itemsTotal === 0) return true;
    const ratio = itemsCorrect / itemsTotal;
    return ratio >= lesson.passCriteria.threshold && decodingRuleSatisfied;
  })();

  return {
    lessonId: lesson.id,
    passed,
    itemsTotal,
    itemsCorrect,
    decodingRuleSatisfied,
  };
}
