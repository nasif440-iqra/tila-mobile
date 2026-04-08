import { describe, it, expect } from "vitest";
import { evaluateLesson } from "@/src/engine/v2/scoring";
import type { ScoredItem } from "@/src/types/exercise";
import type { MasteryPolicy } from "@/src/types/curriculum-v2";

// ── Helpers ──

function makeItem(
  correct: boolean,
  isDecodeItem: boolean,
  assessmentBucket?: string,
): ScoredItem {
  return {
    item: {
      type: "tap",
      prompt: { arabicDisplay: "ب" },
      correctAnswer: { kind: "single", value: "ba" },
      targetEntityId: "letter:ba",
      isDecodeItem,
      answerMode: "transliteration",
      assessmentBucket,
    },
    correct,
    responseTimeMs: 1000,
    generatedBy: "tap",
    assessmentBucket,
    answerMode: "transliteration",
  };
}

const BASE_POLICY: MasteryPolicy = {
  passThreshold: 0.8,
};

// ── Tests ──

describe("evaluateLesson", () => {
  it("passes when all thresholds met", () => {
    const items = [
      makeItem(true, false),
      makeItem(true, false),
      makeItem(true, true),
      makeItem(true, true),
      makeItem(true, true),
    ];
    const result = evaluateLesson(1, items, BASE_POLICY);

    expect(result.passed).toBe(true);
    expect(result.failureReasons).toHaveLength(0);
    expect(result.totalItems).toBe(5);
    expect(result.correctItems).toBe(5);
    expect(result.overallPercent).toBeCloseTo(1.0);
  });

  it("fails below overall threshold with correct failure reason", () => {
    const items = [
      makeItem(true, false),
      makeItem(false, false),
      makeItem(false, false),
      makeItem(false, false),
      makeItem(false, false),
    ];
    const result = evaluateLesson(1, items, BASE_POLICY);

    expect(result.passed).toBe(false);
    expect(result.failureReasons).toHaveLength(1);
    const reason = result.failureReasons[0];
    expect(reason.reason).toBe("below-pass-threshold");
    if (reason.reason === "below-pass-threshold") {
      expect(reason.actual).toBeCloseTo(0.2);
      expect(reason.required).toBe(0.8);
    }
  });

  it("fails on decode streak miss with correct failure reason", () => {
    const policy: MasteryPolicy = {
      passThreshold: 0.6,
      decodePassRequired: 3,
    };
    // 4 correct out of 5, but last 3 items: correct, incorrect, correct => streak=1
    const items = [
      makeItem(true, false),
      makeItem(true, true),
      makeItem(true, true),
      makeItem(false, true), // breaks streak
      makeItem(true, true),
    ];
    const result = evaluateLesson(1, items, policy);

    expect(result.passed).toBe(false);
    const streakFailure = result.failureReasons.find(
      (r) => r.reason === "decode-streak-broken",
    );
    expect(streakFailure).toBeDefined();
    if (streakFailure?.reason === "decode-streak-broken") {
      expect(streakFailure.required).toBe(3);
      expect(streakFailure.achieved).toBe(1);
    }
  });

  it("fails on decode percent miss with correct failure reason", () => {
    const policy: MasteryPolicy = {
      passThreshold: 0.5,
      decodeMinPercent: 0.9,
    };
    // overall 6/10 = 0.6 >= 0.5, but decode 1/4 = 0.25 < 0.9
    const items = [
      makeItem(true, false),
      makeItem(true, false),
      makeItem(true, false),
      makeItem(true, false),
      makeItem(true, false),
      makeItem(true, false),
      makeItem(true, true),
      makeItem(false, true),
      makeItem(false, true),
      makeItem(false, true),
    ];
    const result = evaluateLesson(1, items, policy);

    expect(result.passed).toBe(false);
    const decodeFailure = result.failureReasons.find(
      (r) => r.reason === "decode-percent-low",
    );
    expect(decodeFailure).toBeDefined();
    if (decodeFailure?.reason === "decode-percent-low") {
      expect(decodeFailure.actual).toBeCloseTo(0.25);
      expect(decodeFailure.required).toBe(0.9);
    }
  });

  it("collects multiple failure reasons simultaneously", () => {
    const policy: MasteryPolicy = {
      passThreshold: 0.9,
      decodePassRequired: 3,
      decodeMinPercent: 0.8,
    };
    // overall 1/5 = 0.2 < 0.9, decode 1/3, streak = 1 (ends with 1 correct), decodePercent 1/3 < 0.8
    const items = [
      makeItem(false, false),
      makeItem(false, false),
      makeItem(false, true),
      makeItem(false, true),
      makeItem(true, true),
    ];
    const result = evaluateLesson(1, items, policy);

    expect(result.passed).toBe(false);
    const reasons = result.failureReasons.map((r) => r.reason);
    expect(reasons).toContain("below-pass-threshold");
    expect(reasons).toContain("decode-streak-broken");
    expect(reasons).toContain("decode-percent-low");
    expect(result.failureReasons).toHaveLength(3);
  });

  it("calculates bucket scores correctly", () => {
    const items = [
      makeItem(true, false, "vowels"),
      makeItem(true, false, "vowels"),
      makeItem(false, false, "vowels"),
      makeItem(true, false, "letters"),
      makeItem(false, false, "letters"),
      makeItem(true, false), // no bucket — excluded
    ];
    const result = evaluateLesson(1, items, BASE_POLICY);

    expect(result.bucketScores["vowels"]).toEqual({ correct: 2, total: 3 });
    expect(result.bucketScores["letters"]).toEqual({ correct: 1, total: 2 });
    expect(Object.keys(result.bucketScores)).toHaveLength(2);
  });

  it("passes with no decode items and no decode policy, on overall alone", () => {
    const items = [
      makeItem(true, false),
      makeItem(true, false),
      makeItem(true, false),
      makeItem(true, false),
      makeItem(false, false),
    ];
    const result = evaluateLesson(1, items, BASE_POLICY);

    expect(result.passed).toBe(true);
    expect(result.decodeItems).toBe(0);
    expect(result.decodeCorrect).toBe(0);
    expect(result.decodePercent).toBe(0);
    expect(result.finalDecodeStreak).toBe(0);
  });

  it("100% score passes", () => {
    const items = Array.from({ length: 10 }, () => makeItem(true, false));
    const result = evaluateLesson(1, items, BASE_POLICY);

    expect(result.passed).toBe(true);
    expect(result.overallPercent).toBeCloseTo(1.0);
    expect(result.correctItems).toBe(10);
  });

  it("0% score fails", () => {
    const items = Array.from({ length: 5 }, () => makeItem(false, false));
    const result = evaluateLesson(1, items, BASE_POLICY);

    expect(result.passed).toBe(false);
    expect(result.overallPercent).toBeCloseTo(0.0);
    expect(result.correctItems).toBe(0);
  });

  it("empty scored items produces 0%", () => {
    const result = evaluateLesson(1, [], BASE_POLICY);

    expect(result.totalItems).toBe(0);
    expect(result.correctItems).toBe(0);
    expect(result.overallPercent).toBe(0);
    expect(result.decodePercent).toBe(0);
    expect(result.finalDecodeStreak).toBe(0);
    // 0 / 0 is treated as 0%, which is below 0.8 threshold
    expect(result.passed).toBe(false);
  });

  it("finalDecodeStreak counts consecutive correct decode items from end", () => {
    const policy: MasteryPolicy = {
      passThreshold: 0.5,
      decodePassRequired: 3,
    };
    // Items in order — last 3 decode items are all correct => streak = 3
    const items = [
      makeItem(false, true), // decode, wrong (breaks earlier streak)
      makeItem(false, false), // non-decode, irrelevant to streak
      makeItem(true, true), // decode, correct
      makeItem(true, true), // decode, correct
      makeItem(true, true), // decode, correct <-- streak starts here from end
    ];
    const result = evaluateLesson(1, items, policy);

    expect(result.finalDecodeStreak).toBe(3);
    expect(result.passed).toBe(true);
  });

  it("finalDecodeStreak stops at first incorrect decode item from end", () => {
    const policy: MasteryPolicy = {
      passThreshold: 0.5,
      decodePassRequired: 4,
    };
    const items = [
      makeItem(true, true),
      makeItem(true, true),
      makeItem(true, true),
      makeItem(false, true), // breaks streak
      makeItem(true, true),
      makeItem(true, true),
    ];
    const result = evaluateLesson(1, items, policy);

    // Only 2 consecutive correct from end before the break at index 3
    expect(result.finalDecodeStreak).toBe(2);
    expect(result.passed).toBe(false);
    const streakFailure = result.failureReasons.find(
      (r) => r.reason === "decode-streak-broken",
    );
    expect(streakFailure).toBeDefined();
  });

  it("non-decode items do not interrupt finalDecodeStreak", () => {
    const policy: MasteryPolicy = {
      passThreshold: 0.5,
      decodePassRequired: 2,
    };
    // Last decode item is correct, and the one before (also correct), with non-decode in between
    const items = [
      makeItem(true, true),   // decode correct
      makeItem(false, false), // non-decode (irrelevant to streak)
      makeItem(true, true),   // decode correct
    ];
    const result = evaluateLesson(1, items, policy);

    expect(result.finalDecodeStreak).toBe(2);
    expect(result.passed).toBe(true);
  });

  it("returns correct lessonId in result", () => {
    const result = evaluateLesson(42, [], BASE_POLICY);
    expect(result.lessonId).toBe(42);
  });
});
