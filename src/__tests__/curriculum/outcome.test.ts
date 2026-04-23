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

function scored(id: string, opts?: Partial<ExerciseScreen>): ExerciseScreen {
  return {
    kind: "exercise",
    id,
    part: "practice",
    exercise: tap(),
    scored: true,
    countsAsDecoding: false,
    ...opts,
  };
}

function lesson(screens: ExerciseScreen[], threshold = 0.85, requireDecoding = false): LessonData {
  return {
    id: "lesson-test",
    phase: 1,
    module: "1.1",
    title: "Test",
    outcome: "test",
    durationTargetSeconds: 180,
    introducedEntities: [],
    reviewEntities: [],
    passCriteria: { threshold, requireCorrectLastTwoDecoding: requireDecoding },
    screens,
  };
}

describe("computeLessonOutcome", () => {
  it("trivial pass when no scored screens exist", () => {
    const l = lesson([scored("a", { scored: false })]);
    const outcome = computeLessonOutcome(l, new Map());
    expect(outcome.passed).toBe(true);
    expect(outcome.itemsTotal).toBe(0);
    expect(outcome.itemsCorrect).toBe(0);
    expect(outcome.decodingRuleSatisfied).toBe(true);
  });

  it("passes when all scored screens are correct", () => {
    const screens = [scored("a"), scored("b"), scored("c"), scored("d")];
    const l = lesson(screens);
    const map = new Map(screens.map((s) => [s.id, { screenId: s.id, correct: true, entityAttempts: [] }]));
    const outcome = computeLessonOutcome(l, map);
    expect(outcome.passed).toBe(true);
    expect(outcome.itemsTotal).toBe(4);
    expect(outcome.itemsCorrect).toBe(4);
  });

  it("fails below threshold", () => {
    const screens = [scored("a"), scored("b"), scored("c"), scored("d")];
    const l = lesson(screens, 0.85);
    const map = new Map([
      ["a", { screenId: "a", correct: true, entityAttempts: [] }],
      ["b", { screenId: "b", correct: false, entityAttempts: [] }],
      ["c", { screenId: "c", correct: true, entityAttempts: [] }],
      ["d", { screenId: "d", correct: true, entityAttempts: [] }],
    ]);
    const outcome = computeLessonOutcome(l, map);
    expect(outcome.passed).toBe(false);
    expect(outcome.itemsCorrect).toBe(3);
  });

  it("ignores unscored screens in tally", () => {
    const screens: ExerciseScreen[] = [scored("a"), scored("b", { scored: false })];
    const l = lesson(screens);
    const map = new Map([
      ["a", { screenId: "a", correct: true, entityAttempts: [] }],
      ["b", { screenId: "b", correct: false, entityAttempts: [] }],
    ]);
    const outcome = computeLessonOutcome(l, map);
    expect(outcome.itemsTotal).toBe(1);
    expect(outcome.itemsCorrect).toBe(1);
    expect(outcome.passed).toBe(true);
  });

  it("decoding rule: satisfied when requireCorrectLastTwoDecoding is false", () => {
    const screens: ExerciseScreen[] = [
      scored("a", { countsAsDecoding: true }),
      scored("b", { countsAsDecoding: true }),
    ];
    const l = lesson(screens, 0.85, false);
    const map = new Map([
      ["a", { screenId: "a", correct: false, entityAttempts: [] }],
      ["b", { screenId: "b", correct: false, entityAttempts: [] }],
    ]);
    expect(computeLessonOutcome(l, map).decodingRuleSatisfied).toBe(true);
  });

  it("decoding rule: enforced over last two decoding screens by sequence order", () => {
    const screens: ExerciseScreen[] = [
      scored("a", { countsAsDecoding: true }),
      scored("b", { countsAsDecoding: false }),
      scored("c", { countsAsDecoding: true }),
      scored("d", { countsAsDecoding: true }),
    ];
    const l = lesson(screens, 0.0, true);
    const passingMap = new Map([
      ["a", { screenId: "a", correct: false, entityAttempts: [] }],
      ["b", { screenId: "b", correct: true, entityAttempts: [] }],
      ["c", { screenId: "c", correct: true, entityAttempts: [] }],
      ["d", { screenId: "d", correct: true, entityAttempts: [] }],
    ]);
    expect(computeLessonOutcome(l, passingMap).decodingRuleSatisfied).toBe(true);

    const failingMap = new Map([
      ["a", { screenId: "a", correct: true, entityAttempts: [] }],
      ["b", { screenId: "b", correct: true, entityAttempts: [] }],
      ["c", { screenId: "c", correct: true, entityAttempts: [] }],
      ["d", { screenId: "d", correct: false, entityAttempts: [] }],
    ]);
    expect(computeLessonOutcome(l, failingMap).decodingRuleSatisfied).toBe(false);
  });

  it("missing outcome for a scored screen counts as incorrect", () => {
    const screens = [scored("a"), scored("b")];
    const l = lesson(screens);
    const map = new Map([["a", { screenId: "a", correct: true, entityAttempts: [] }]]);
    const outcome = computeLessonOutcome(l, map);
    expect(outcome.itemsTotal).toBe(2);
    expect(outcome.itemsCorrect).toBe(1);
  });
});
