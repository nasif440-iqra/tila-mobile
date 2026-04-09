import { describe, it, expect } from "vitest";
import { validateLesson } from "@/src/engine/v2/validation";
import type { LessonV2 } from "@/src/types/curriculum-v2";
import type { ExerciseItem } from "@/src/types/exercise";

function makeLesson(overrides: Partial<LessonV2>): LessonV2 {
  return {
    id: 99, phase: 1, module: "test", title: "Test", description: "Test",
    teachEntityIds: ["letter:1", "letter:2"],
    reviewEntityIds: [],
    exercisePlan: [],
    masteryPolicy: { passThreshold: 0.85 },
    ...overrides,
  };
}

function makePresent(id: string): ExerciseItem {
  return {
    type: "present",
    prompt: { arabicDisplay: "\u0628", text: "This is Ba" },
    correctAnswer: { kind: "single", value: "none" },
    targetEntityId: "letter:2",
    isDecodeItem: false,
    answerMode: "arabic",
  };
}

function makeReadExit(id: string): ExerciseItem {
  return {
    type: "read",
    prompt: { arabicDisplay: "\u0628\u064E", text: "Read this" },
    options: [
      { id: `${id}-opt-correct`, displayText: "ba", isCorrect: true },
      { id: `${id}-opt-wrong`, displayText: "ma", isCorrect: false },
    ],
    correctAnswer: { kind: "single", value: `${id}-opt-correct` },
    targetEntityId: "combo:ba-fatha",
    isDecodeItem: true,
    answerMode: "transliteration",
  };
}

describe("authored item validation", () => {
  it("rejects present items in exitSequence", async () => {
    const lesson = makeLesson({
      exitSequence: [makePresent("bad-present")],
    });
    const result = await validateLesson(lesson);
    expect(result.errors.some((e) => e.includes("present") && e.includes("exitSequence"))).toBe(true);
  });

  it("rejects exitSequence read items without isDecodeItem", async () => {
    const item = makeReadExit("exit-1");
    item.isDecodeItem = false;
    const lesson = makeLesson({ exitSequence: [item] });
    const result = await validateLesson(lesson);
    expect(result.errors.some((e) => e.includes("isDecodeItem"))).toBe(true);
  });

  it("rejects authored quiz items with empty options", async () => {
    const item: ExerciseItem = {
      type: "tap",
      prompt: { arabicDisplay: "\u0628", text: "Find Ba" },
      options: [],
      correctAnswer: { kind: "single", value: "opt-1" },
      targetEntityId: "letter:2",
      isDecodeItem: false,
      answerMode: "arabic",
    };
    const lesson = makeLesson({ teachingSequence: [item] });
    const result = await validateLesson(lesson);
    expect(result.errors.some((e) => e.includes("empty options"))).toBe(true);
  });

  it("rejects correctAnswer that does not match any option ID", async () => {
    const item: ExerciseItem = {
      type: "choose",
      prompt: { arabicDisplay: "\u0628", text: "Which?" },
      options: [
        { id: "opt-a", displayArabic: "\u0628", isCorrect: true },
        { id: "opt-b", displayArabic: "\u0645", isCorrect: false },
      ],
      correctAnswer: { kind: "single", value: "opt-nonexistent" },
      targetEntityId: "letter:2",
      isDecodeItem: false,
      answerMode: "arabic",
    };
    const lesson = makeLesson({ teachingSequence: [item] });
    const result = await validateLesson(lesson);
    expect(result.errors.some((e) => e.includes("correctAnswer"))).toBe(true);
  });

  it("rejects duplicate option IDs within authored items", async () => {
    const item1: ExerciseItem = {
      type: "tap",
      prompt: { arabicDisplay: "\u0628", text: "Find Ba" },
      options: [
        { id: "dup-opt", displayArabic: "\u0627", isCorrect: false },
        { id: "dup-opt", displayArabic: "\u0628", isCorrect: true },
      ],
      correctAnswer: { kind: "single", value: "dup-opt" },
      targetEntityId: "letter:2",
      isDecodeItem: false,
      answerMode: "arabic",
    };
    const lesson = makeLesson({ teachingSequence: [item1] });
    const result = await validateLesson(lesson);
    expect(result.errors.some((e) => e.includes("duplicate"))).toBe(true);
  });

  it("accepts valid teachingSequence and exitSequence", async () => {
    const lesson = makeLesson({
      teachingSequence: [makePresent("intro")],
      exitSequence: [makeReadExit("exit-1")],
    });
    const result = await validateLesson(lesson);
    const authoredErrors = result.errors.filter(
      (e) => e.includes("present") || e.includes("exitSequence") || e.includes("authored") || e.includes("duplicate") || e.includes("correctAnswer") || e.includes("empty options") || e.includes("isDecodeItem")
    );
    expect(authoredErrors).toHaveLength(0);
  });
});
