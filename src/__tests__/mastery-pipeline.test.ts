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

  it("mergeQuizResultsIntoMastery builds on existing mastery rather than overwriting it", () => {
    // Simulate the state that should exist after a previous lesson — an entity
    // with accumulated attempts.
    const existingMastery = {
      entities: {
        "letter:1": {
          attempts: 5,
          correct: 4,
          lastSeen: "2026-03-27",
          sessionStreak: 1,
          intervalDays: 1,
          nextReview: "2026-03-28",
          lastLatencyMs: null,
        },
      },
      skills: {},
      confusions: {},
    };

    const newResults = [
      {
        targetId: 1,
        targetKey: "letter:1",
        correct: true,
        selectedId: "1",
        questionType: "tap",
        correctId: "1",
        isHarakat: false,
        hasAudio: false,
        responseTimeMs: 400,
        skillKeys: [],
      },
    ];

    const result = mergeQuizResultsIntoMastery(existingMastery, newResults, "2026-03-29");
    const entity = (result.entities as Record<string, any>)["letter:1"];

    // The existing 5 attempts MUST be preserved — the merge must not reset to 0
    expect(entity.attempts).toBe(6);
    expect(entity.correct).toBe(5);
    expect(entity.lastSeen).toBe("2026-03-29");
  });

  it("mergeQuizResultsIntoMastery with empty mastery creates entities from scratch", () => {
    const empty = emptyMastery();
    const results = [
      {
        targetId: 3,
        targetKey: "letter:3",
        correct: false,
        selectedId: "2",
        questionType: "tap",
        correctId: "3",
        isHarakat: false,
        hasAudio: false,
        responseTimeMs: 1200,
        skillKeys: [],
      },
    ];

    const result = mergeQuizResultsIntoMastery(empty, results, "2026-03-29");
    const entity = (result.entities as Record<string, any>)["letter:3"];

    expect(entity).toBeDefined();
    expect(entity.attempts).toBe(1);
    expect(entity.correct).toBe(0);
    expect(entity.lastSeen).toBe("2026-03-29");
  });

  it("mergeQuizResultsIntoMastery accumulates multiple results across different entities", () => {
    const mastery = emptyMastery();
    const results = [
      {
        targetId: 1,
        targetKey: "letter:1",
        correct: true,
        selectedId: "1",
        questionType: "tap",
        correctId: "1",
        isHarakat: false,
        hasAudio: false,
        responseTimeMs: 300,
        skillKeys: [],
      },
      {
        targetId: 2,
        targetKey: "letter:2",
        correct: true,
        selectedId: "2",
        questionType: "tap",
        correctId: "2",
        isHarakat: false,
        hasAudio: false,
        responseTimeMs: 350,
        skillKeys: [],
      },
      {
        targetId: 1,
        targetKey: "letter:1",
        correct: false,
        selectedId: "3",
        questionType: "tap",
        correctId: "1",
        isHarakat: false,
        hasAudio: false,
        responseTimeMs: 900,
        skillKeys: [],
      },
    ];

    const result = mergeQuizResultsIntoMastery(mastery, results, "2026-03-29");
    const entities = result.entities as Record<string, any>;

    // letter:1 appeared twice
    expect(entities["letter:1"].attempts).toBe(2);
    expect(entities["letter:1"].correct).toBe(1);

    // letter:2 appeared once
    expect(entities["letter:2"].attempts).toBe(1);
    expect(entities["letter:2"].correct).toBe(1);
  });
});
