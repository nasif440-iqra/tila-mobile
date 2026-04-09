import { describe, it, expect } from "vitest";
import { evaluateLesson } from "@/src/engine/v2/scoring";
import type { ScoredItem } from "@/src/types/exercise";

describe("evaluateLesson (v2 scoring)", () => {
  it("excludes present items from scoring math", () => {
    const items: ScoredItem[] = [
      {
        item: { type: "present", isDecodeItem: false } as any,
        correct: true,
        responseTimeMs: 0,
        generatedBy: "present" as any,
        answerMode: "arabic",
      },
      {
        item: { type: "tap", isDecodeItem: false } as any,
        correct: true,
        responseTimeMs: 100,
        generatedBy: "tap",
        answerMode: "arabic",
      },
      {
        item: { type: "read", isDecodeItem: true } as any,
        correct: false,
        responseTimeMs: 200,
        generatedBy: "read",
        answerMode: "transliteration",
      },
    ];
    const result = evaluateLesson(1, items, { passThreshold: 0.5 });
    expect(result.totalItems).toBe(2);
    expect(result.correctItems).toBe(1);
    expect(result.overallPercent).toBe(0.5);
  });

  it("handles all-present items gracefully", () => {
    const items: ScoredItem[] = [
      {
        item: { type: "present", isDecodeItem: false } as any,
        correct: true,
        responseTimeMs: 0,
        generatedBy: "present" as any,
        answerMode: "arabic",
      },
    ];
    const result = evaluateLesson(1, items, { passThreshold: 0.5 });
    expect(result.totalItems).toBe(0);
    expect(result.correctItems).toBe(0);
    expect(result.overallPercent).toBe(0);
    // With 0 scorable items and passThreshold > 0, should fail
    expect(result.passed).toBe(false);
  });

  it("does not count present items in decode streak", () => {
    const items: ScoredItem[] = [
      {
        item: { type: "present", isDecodeItem: false } as any,
        correct: true,
        responseTimeMs: 0,
        generatedBy: "present" as any,
        answerMode: "arabic",
      },
      {
        item: { type: "read", isDecodeItem: true } as any,
        correct: true,
        responseTimeMs: 150,
        generatedBy: "read",
        answerMode: "transliteration",
      },
      {
        item: { type: "read", isDecodeItem: true } as any,
        correct: true,
        responseTimeMs: 200,
        generatedBy: "read",
        answerMode: "transliteration",
      },
    ];
    const result = evaluateLesson(1, items, { passThreshold: 0.5 });
    expect(result.finalDecodeStreak).toBe(2);
    expect(result.decodeItems).toBe(2);
    expect(result.decodeCorrect).toBe(2);
  });

  it("does not count present items in bucket scores", () => {
    const items: ScoredItem[] = [
      {
        item: { type: "present", isDecodeItem: false, assessmentBucket: "visual" } as any,
        correct: true,
        responseTimeMs: 0,
        generatedBy: "present" as any,
        answerMode: "arabic",
        assessmentBucket: "visual",
      },
      {
        item: { type: "tap", isDecodeItem: false, assessmentBucket: "visual" } as any,
        correct: false,
        responseTimeMs: 100,
        generatedBy: "tap",
        answerMode: "arabic",
        assessmentBucket: "visual",
      },
    ];
    const result = evaluateLesson(1, items, { passThreshold: 0.5 });
    expect(result.bucketScores["visual"]).toEqual({ correct: 0, total: 1 });
  });
});
