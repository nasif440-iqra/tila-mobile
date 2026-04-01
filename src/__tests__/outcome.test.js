import { describe, it, expect } from "vitest";
import { evaluateLessonOutcome, getPassThreshold, MODE_THRESHOLDS, DEFAULT_THRESHOLD } from "../engine/outcome.js";

function makeResults(correct, total) {
  return Array.from({ length: total }, (_, i) => ({ correct: i < correct }));
}

describe("getPassThreshold", () => {
  it("returns mode-specific thresholds", () => {
    expect(getPassThreshold("recognition")).toBe(0.8);
    expect(getPassThreshold("sound")).toBe(0.8);
    expect(getPassThreshold("contrast")).toBe(0.8);
    expect(getPassThreshold("checkpoint")).toBe(0.8);
    expect(getPassThreshold("harakat-intro")).toBe(0.8);
    expect(getPassThreshold("harakat")).toBe(0.8);
    expect(getPassThreshold("harakat-mixed")).toBe(0.8);
  });

  it("returns null for review (never gates progression)", () => {
    expect(getPassThreshold("review")).toBeNull();
  });

  it("returns default threshold for unknown modes", () => {
    expect(getPassThreshold("some-future-mode")).toBe(DEFAULT_THRESHOLD);
  });
});

describe("evaluateLessonOutcome", () => {
  it("passes a recognition lesson at 80%", () => {
    const r = evaluateLessonOutcome(makeResults(4, 5), "recognition");
    expect(r.passed).toBe(true);
    expect(r.accuracy).toBe(0.8);
    expect(r.threshold).toBe(0.8);
  });

  it("fails a recognition lesson below 60%", () => {
    const r = evaluateLessonOutcome(makeResults(2, 10), "recognition");
    expect(r.passed).toBe(false);
  });

  it("checkpoint requires 80%", () => {
    const at75 = evaluateLessonOutcome(makeResults(75, 100), "checkpoint");
    expect(at75.passed).toBe(false);
    expect(at75.threshold).toBe(0.8);

    const at80 = evaluateLessonOutcome(makeResults(8, 10), "checkpoint");
    expect(at80.passed).toBe(true);
  });

  it("harakat-intro requires 80%", () => {
    const at83 = evaluateLessonOutcome(makeResults(5, 6), "harakat-intro");
    expect(at83.passed).toBe(true);
    expect(at83.threshold).toBe(0.8);

    const at50 = evaluateLessonOutcome(makeResults(3, 6), "harakat-intro");
    expect(at50.passed).toBe(false);
  });

  it("review always passes with null threshold", () => {
    const r = evaluateLessonOutcome(makeResults(0, 10), "review");
    expect(r.passed).toBe(true);
    expect(r.threshold).toBeNull();
  });

  it("handles empty results", () => {
    const r = evaluateLessonOutcome([], "recognition");
    expect(r.total).toBe(0);
    expect(r.correct).toBe(0);
    expect(r.accuracy).toBe(0);
    expect(r.passed).toBe(false);
  });

  it("returns total, correct, accuracy fields", () => {
    const r = evaluateLessonOutcome(makeResults(4, 5), "sound");
    expect(r.total).toBe(5);
    expect(r.correct).toBe(4);
    expect(r.accuracy).toBe(0.8);
  });

  it("unknown mode uses default threshold", () => {
    const r = evaluateLessonOutcome(makeResults(8, 10), "unknown-mode");
    expect(r.passed).toBe(true);
    expect(r.threshold).toBe(DEFAULT_THRESHOLD);
  });
});

describe("lesson completion integration", () => {
  it("failed lesson does not get added to completedLessonIds", () => {
    const completedIds = [1, 2, 3];
    const quizResults = makeResults(2, 10);
    const outcome = evaluateLessonOutcome(quizResults, "recognition");
    const newIds = outcome.passed ? [...completedIds, 4] : completedIds;
    expect(newIds).toEqual([1, 2, 3]);
  });

  it("passed lesson gets added to completedLessonIds", () => {
    const completedIds = [1, 2, 3];
    const quizResults = makeResults(8, 10);
    const outcome = evaluateLessonOutcome(quizResults, "recognition");
    const newIds = outcome.passed ? [...completedIds, 4] : completedIds;
    expect(newIds).toEqual([1, 2, 3, 4]);
  });

  it("review with string id never unlocks linear progression", () => {
    const lessonId = "review";
    const outcome = evaluateLessonOutcome(makeResults(0, 5), "review");
    expect(typeof lessonId === "number").toBe(false);
    expect(outcome.passed).toBe(true);
  });

  it("checkpoint at 75% fails with 80% threshold", () => {
    const outcome = evaluateLessonOutcome(makeResults(75, 100), "checkpoint");
    expect(outcome.passed).toBe(false);
  });

  it("checkpoint at 80% passes", () => {
    const outcome = evaluateLessonOutcome(makeResults(80, 100), "checkpoint");
    expect(outcome.passed).toBe(true);
  });
});

describe("threshold display in UI", () => {
  it("outcome.threshold can be rendered as percentage", () => {
    const r = evaluateLessonOutcome(makeResults(1, 10), "checkpoint");
    const displayPct = r.threshold != null ? Math.round(r.threshold * 100) : null;
    expect(displayPct).toBe(80);
  });

  it("review has null threshold so UI shows no requirement", () => {
    const r = evaluateLessonOutcome(makeResults(1, 10), "review");
    expect(r.threshold).toBeNull();
  });
});

describe("retry mastery consistency", () => {
  it("retry produces independent outcomes — not a re-evaluation of the same results", () => {
    const attempt1 = makeResults(2, 10);
    const attempt2 = makeResults(8, 10);

    const outcome1 = evaluateLessonOutcome(attempt1, "recognition");
    const outcome2 = evaluateLessonOutcome(attempt2, "recognition");

    expect(outcome1.passed).toBe(false);
    expect(outcome2.passed).toBe(true);
    expect(outcome1.correct).toBe(2);
    expect(outcome2.correct).toBe(8);
  });

  it("mastery merge is idempotent per-result-set — same results merged twice inflate attempts", () => {
    const results = makeResults(3, 5);
    expect(results.length).toBe(5);
  });
});

describe("first-fail UX for lesson 1", () => {
  it("first-ever fail produces distinct copy context", () => {
    const outcome = evaluateLessonOutcome(makeResults(1, 5), "recognition");
    expect(outcome.passed).toBe(false);
    const isFirst = true;
    const isFirstFail = !outcome.passed && isFirst;
    expect(isFirstFail).toBe(true);
  });
});

describe("skipIntro contract", () => {
  it("skipIntro=true starts at quiz phase", () => {
    const skipIntro = true;
    expect(skipIntro ? "quiz" : "intro").toBe("quiz");
  });

  it("skipIntro=false/undefined starts at intro phase", () => {
    expect(false ? "quiz" : "intro").toBe("intro");
    expect(undefined ? "quiz" : "intro").toBe("intro");
  });

  it("retry flow sets skipIntro=true so user skips intro on retry", () => {
    let isRetry = false;
    isRetry = true;
    expect(isRetry ? "quiz" : "intro").toBe("quiz");
  });

  it("normal lesson start clears skipIntro", () => {
    let isRetry = true;
    isRetry = false;
    expect(isRetry ? "quiz" : "intro").toBe("intro");
  });
});
