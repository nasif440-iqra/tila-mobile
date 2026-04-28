import { describe, it, expect } from "vitest";
import { computeLessonOutcome } from "../../curriculum/runtime/outcome";
import type {
  LessonData,
  ExerciseScreen,
  TapExercise,
} from "../../curriculum/types";

function tap(): TapExercise {
  return {
    type: "tap",
    prompt: "pick one",
    target: "letter:alif",
    options: [
      { display: "ا", entityKey: "letter:alif", correct: true },
      { display: "ب", entityKey: "letter:ba", correct: false },
    ],
  };
}

function scoredScreen(id: string): ExerciseScreen {
  return {
    kind: "exercise",
    id,
    part: "practice",
    exercise: tap(),
    scored: true,
    countsAsDecoding: false,
  };
}

function unscoredScreen(id: string): ExerciseScreen {
  return {
    kind: "exercise",
    id,
    part: "practice",
    exercise: tap(),
    scored: false,
    countsAsDecoding: false,
  };
}

function lesson(screens: ExerciseScreen[]): LessonData {
  return {
    id: "lesson-test",
    phase: 1,
    module: "1.1",
    title: "Test",
    outcome: "test",
    durationTargetSeconds: 60,
    introducedEntities: [],
    reviewEntities: [],
    passCriteria: { threshold: 0.5, requireCorrectLastTwoDecoding: false },
    screens,
  };
}

describe("computeLessonOutcome.firstTryCorrectRate", () => {
  it("is 1.0 when every scored screen is correct with no recorded retries", () => {
    const l = lesson([scoredScreen("a"), scoredScreen("b")]);
    const outcomes = new Map([
      ["a", { screenId: "a", correct: true, entityAttempts: [] }],
      ["b", { screenId: "b", correct: true, entityAttempts: [] }],
    ]);
    const result = computeLessonOutcome(l, outcomes);
    expect(result.firstTryCorrectRate).toBeCloseTo(1.0, 5);
  });

  it("is 0.5 when half of scored screens needed retries", () => {
    const l = lesson([scoredScreen("a"), scoredScreen("b")]);
    const outcomes = new Map([
      ["a", { screenId: "a", correct: true, entityAttempts: [] }],
      ["b", {
        screenId: "b",
        correct: true,
        entityAttempts: [
          { entityKey: "letter:alif", itemId: "i1", correct: false },
          { entityKey: "letter:alif", itemId: "i2", correct: true },
        ],
      }],
    ]);
    const result = computeLessonOutcome(l, outcomes);
    expect(result.firstTryCorrectRate).toBeCloseTo(0.5, 5);
  });

  it("is 0 when no scored screens passed on first try", () => {
    const l = lesson([scoredScreen("a"), scoredScreen("b")]);
    const outcomes = new Map([
      ["a", {
        screenId: "a",
        correct: true,
        entityAttempts: [
          { entityKey: "letter:alif", itemId: "i1", correct: false },
          { entityKey: "letter:alif", itemId: "i2", correct: true },
        ],
      }],
      ["b", { screenId: "b", correct: false, entityAttempts: [] }],
    ]);
    const result = computeLessonOutcome(l, outcomes);
    expect(result.firstTryCorrectRate).toBeCloseTo(0, 5);
  });

  it("is 0 when there are no scored screens", () => {
    const l = lesson([unscoredScreen("a")]);
    const outcomes = new Map();
    const result = computeLessonOutcome(l, outcomes);
    expect(result.firstTryCorrectRate).toBe(0);
  });

  it("counts a screen as first-try-correct when entityAttempts has only the correct first attempt", () => {
    const l = lesson([scoredScreen("a")]);
    const outcomes = new Map([
      ["a", {
        screenId: "a",
        correct: true,
        entityAttempts: [
          { entityKey: "letter:alif", itemId: "i1", correct: true },
        ],
      }],
    ]);
    const result = computeLessonOutcome(l, outcomes);
    expect(result.firstTryCorrectRate).toBeCloseTo(1.0, 5);
  });

  it("counts as first-try-correct when first attempt is correct even if subsequent attempts exist", () => {
    const l = lesson([scoredScreen("a")]);
    const outcomes = new Map([
      ["a", {
        screenId: "a",
        correct: true,
        entityAttempts: [
          { entityKey: "letter:alif", itemId: "i1", correct: true },
          { entityKey: "letter:alif", itemId: "i2", correct: true },
        ],
      }],
    ]);
    const result = computeLessonOutcome(l, outcomes);
    expect(result.firstTryCorrectRate).toBeCloseTo(1.0, 5);
  });
});
