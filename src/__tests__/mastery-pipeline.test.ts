/**
 * Mastery pipeline integration tests
 * Real assertions for existing mastery engine exports + stubs for wiring.
 */
import { describe, it, expect } from "vitest";
import {
  mergeQuizResultsIntoMastery,
  deriveMasteryState,
  normalizeEntityKey,
  emptyMastery,
} from "../engine/mastery";

describe("Mastery Pipeline", () => {
  it("mergeQuizResultsIntoMastery correctly merges a simple quiz result", () => {
    const mastery = emptyMastery();
    const quizResults = [
      {
        targetId: 1,
        targetKey: "letter:1",
        correct: true,
        selectedId: "1",
        questionType: "tap",
        correctId: "1",
        isHarakat: false,
        hasAudio: false,
        responseTimeMs: 500,
        skillKeys: [],
      },
    ];
    const today = "2026-03-28";
    const result = mergeQuizResultsIntoMastery(mastery, quizResults, today);

    expect(result.entities).toHaveProperty("letter:1");
    const entity = (result.entities as Record<string, any>)["letter:1"];
    expect(entity.attempts).toBe(1);
    expect(entity.correct).toBe(1);
    expect(entity.lastSeen).toBe(today);
  });

  it("deriveMasteryState returns 'introduced' for new entity", () => {
    const state = deriveMasteryState(null, "2026-03-28");
    expect(state).toBe("introduced");
  });

  it("deriveMasteryState returns 'introduced' for entity with few attempts", () => {
    const state = deriveMasteryState(
      { attempts: 2, correct: 2, sessionStreak: 0, intervalDays: 1 },
      "2026-03-28"
    );
    expect(state).toBe("introduced");
  });

  it("normalizeEntityKey returns 'letter:N' for numeric targetId", () => {
    const key = normalizeEntityKey(5, { isHarakat: false });
    expect(key).toBe("letter:5");
  });

  it("normalizeEntityKey returns 'combo:X' for harakat string targetId", () => {
    const key = normalizeEntityKey("ba-fatha", { isHarakat: true });
    expect(key).toBe("combo:ba-fatha");
  });

  it.todo("useProgress.completeLesson calls mergeQuizResultsIntoMastery");
  it.todo("mastery entities are persisted to DB after quiz completion");
});
