import { describe, it, expect } from "vitest";
import {
  getDueEntities,
  prioritizeForReview,
  advanceInterval,
  stepBackInterval,
} from "@/src/engine/v2/review";
import { createEntityMastery } from "@/src/engine/v2/mastery";
import type { EntityMastery } from "@/src/engine/v2/mastery";

// ── Helpers ──

function makeEntity(
  entityId: string,
  state: EntityMastery["state"],
  intervalDays: number,
  nextReview: string,
  confusionPairCount = 0,
  recentAttempts: EntityMastery["recentAttempts"] = [],
): EntityMastery {
  return {
    ...createEntityMastery(entityId),
    state,
    intervalDays,
    nextReview,
    confusionPairs: Array.from({ length: confusionPairCount }, (_, i) => ({
      entityId: `letter:${i + 100}`,
      count: 1,
      lastSeen: "2026-01-01T00:00:00.000Z",
    })),
    recentAttempts,
  };
}

const TODAY = "2026-04-07";
const YESTERDAY = "2026-04-06";
const TOMORROW = "2026-04-08";
const FIVE_DAYS_AGO = "2026-04-02";

// ── getDueEntities ──

describe("getDueEntities", () => {
  it("returns entities with nextReview <= today", () => {
    const mastery: EntityMastery[] = [
      makeEntity("letter:1", "introduced", 1, `${YESTERDAY}T00:00:00.000Z`),
      makeEntity("letter:2", "unstable", 3, `${TODAY}T00:00:00.000Z`),
      makeEntity("letter:3", "accurate", 7, `${TOMORROW}T00:00:00.000Z`),
    ];
    const due = getDueEntities(mastery, TODAY);
    expect(due.map((m) => m.entityId)).toEqual(["letter:1", "letter:2"]);
  });

  it("does not return not_started entities", () => {
    const mastery: EntityMastery[] = [
      makeEntity("letter:1", "not_started", 0, `${YESTERDAY}T00:00:00.000Z`),
      makeEntity("letter:2", "introduced", 1, `${YESTERDAY}T00:00:00.000Z`),
    ];
    const due = getDueEntities(mastery, TODAY);
    expect(due.map((m) => m.entityId)).toEqual(["letter:2"]);
  });

  it("returns empty array when nothing is due", () => {
    const mastery: EntityMastery[] = [
      makeEntity("letter:1", "introduced", 1, `${TOMORROW}T00:00:00.000Z`),
    ];
    const due = getDueEntities(mastery, TODAY);
    expect(due).toHaveLength(0);
  });
});

// ── prioritizeForReview ──

describe("prioritizeForReview", () => {
  it("places most overdue entities first", () => {
    const mastery: EntityMastery[] = [
      makeEntity("letter:1", "accurate", 7, `${TODAY}T00:00:00.000Z`), // 0 days overdue
      makeEntity("letter:2", "accurate", 7, `${FIVE_DAYS_AGO}T00:00:00.000Z`), // 5 days overdue
      makeEntity("letter:3", "accurate", 7, `${YESTERDAY}T00:00:00.000Z`), // 1 day overdue
    ];
    const prioritized = prioritizeForReview(mastery, 10);
    expect(prioritized[0].entityId).toBe("letter:2");
    expect(prioritized[1].entityId).toBe("letter:3");
  });

  it("ranks weaker states higher when equally overdue", () => {
    const mastery: EntityMastery[] = [
      makeEntity("letter:1", "retained", 14, `${YESTERDAY}T00:00:00.000Z`),
      makeEntity("letter:2", "introduced", 1, `${YESTERDAY}T00:00:00.000Z`),
      makeEntity("letter:3", "accurate", 7, `${YESTERDAY}T00:00:00.000Z`),
      makeEntity("letter:4", "unstable", 3, `${YESTERDAY}T00:00:00.000Z`),
    ];
    const prioritized = prioritizeForReview(mastery, 10);
    expect(prioritized[0].entityId).toBe("letter:2"); // introduced = weakest
    expect(prioritized[1].entityId).toBe("letter:4"); // unstable
    expect(prioritized[2].entityId).toBe("letter:3"); // accurate
    expect(prioritized[3].entityId).toBe("letter:1"); // retained
  });

  it("caps results at maxPerSession", () => {
    const mastery: EntityMastery[] = [
      makeEntity("letter:1", "introduced", 1, `${YESTERDAY}T00:00:00.000Z`),
      makeEntity("letter:2", "introduced", 1, `${YESTERDAY}T00:00:00.000Z`),
      makeEntity("letter:3", "introduced", 1, `${YESTERDAY}T00:00:00.000Z`),
      makeEntity("letter:4", "introduced", 1, `${YESTERDAY}T00:00:00.000Z`),
      makeEntity("letter:5", "introduced", 1, `${YESTERDAY}T00:00:00.000Z`),
    ];
    const prioritized = prioritizeForReview(mastery, 3);
    expect(prioritized).toHaveLength(3);
  });

  it("uses confusion pair count as tiebreaker", () => {
    const mastery: EntityMastery[] = [
      makeEntity("letter:1", "unstable", 3, `${YESTERDAY}T00:00:00.000Z`, 0),
      makeEntity("letter:2", "unstable", 3, `${YESTERDAY}T00:00:00.000Z`, 3),
    ];
    const prioritized = prioritizeForReview(mastery, 10);
    expect(prioritized[0].entityId).toBe("letter:2"); // more confusion pairs = higher priority
  });
});

// ── advanceInterval ──

describe("advanceInterval", () => {
  it("advances from 0 to 1", () => {
    const m = makeEntity("letter:1", "introduced", 0, `${TODAY}T00:00:00.000Z`);
    const updated = advanceInterval(m);
    expect(updated.intervalDays).toBe(1);
  });

  it("advances from 1 to 3", () => {
    const m = makeEntity("letter:1", "unstable", 1, `${TODAY}T00:00:00.000Z`);
    const updated = advanceInterval(m);
    expect(updated.intervalDays).toBe(3);
  });

  it("advances through full sequence: 0→1→3→7→14→30", () => {
    const INTERVAL_LEVELS = [0, 1, 3, 7, 14, 30];
    let m = makeEntity("letter:1", "introduced", 0, `${TODAY}T00:00:00.000Z`);
    for (let i = 1; i < INTERVAL_LEVELS.length; i++) {
      m = advanceInterval(m);
      expect(m.intervalDays).toBe(INTERVAL_LEVELS[i]);
    }
  });

  it("stays at 30 when already at max", () => {
    const m = makeEntity("letter:1", "retained", 30, `${TODAY}T00:00:00.000Z`);
    const updated = advanceInterval(m);
    expect(updated.intervalDays).toBe(30);
  });

  it("updates nextReview when advancing", () => {
    const m = makeEntity("letter:1", "introduced", 0, `${TODAY}T00:00:00.000Z`);
    const updated = advanceInterval(m);
    expect(updated.nextReview).not.toBe(m.nextReview);
  });
});

// ── stepBackInterval ──

describe("stepBackInterval", () => {
  it("resets introduced entity interval to 1", () => {
    const m = makeEntity("letter:1", "introduced", 3, `${TODAY}T00:00:00.000Z`);
    const updated = stepBackInterval(m);
    expect(updated.intervalDays).toBe(1);
  });

  it("resets unstable entity interval to 1", () => {
    const m = makeEntity("letter:1", "unstable", 7, `${TODAY}T00:00:00.000Z`);
    const updated = stepBackInterval(m);
    expect(updated.intervalDays).toBe(1);
  });

  it("steps accurate entity back one level", () => {
    const m = makeEntity("letter:1", "accurate", 14, `${TODAY}T00:00:00.000Z`);
    const updated = stepBackInterval(m);
    expect(updated.intervalDays).toBe(7); // 14 → 7
  });

  it("steps retained entity back two levels", () => {
    const m = makeEntity("letter:1", "retained", 30, `${TODAY}T00:00:00.000Z`);
    const updated = stepBackInterval(m);
    // INTERVAL_LEVELS = [0, 1, 3, 7, 14, 30]: index 5 → two back → index 3 = 7
    expect(updated.intervalDays).toBe(7);
  });

  it("applies full reset to 1 on 2 consecutive failures", () => {
    const recentAttempts: EntityMastery["recentAttempts"] = [
      { correct: true, exerciseType: "tap", answerMode: "arabic", timestamp: "2026-04-01T00:00:00.000Z" },
      { correct: false, exerciseType: "tap", answerMode: "arabic", timestamp: "2026-04-05T00:00:00.000Z" },
      { correct: false, exerciseType: "tap", answerMode: "arabic", timestamp: "2026-04-06T00:00:00.000Z" },
    ];
    const m = makeEntity("letter:1", "retained", 30, `${TODAY}T00:00:00.000Z`, 0, recentAttempts);
    const updated = stepBackInterval(m);
    expect(updated.intervalDays).toBe(1);
  });

  it("graduated reset applies when only 1 recent failure (not 2 consecutive)", () => {
    const recentAttempts: EntityMastery["recentAttempts"] = [
      { correct: true, exerciseType: "tap", answerMode: "arabic", timestamp: "2026-04-05T00:00:00.000Z" },
      { correct: false, exerciseType: "tap", answerMode: "arabic", timestamp: "2026-04-06T00:00:00.000Z" },
    ];
    const m = makeEntity("letter:1", "retained", 30, `${TODAY}T00:00:00.000Z`, 0, recentAttempts);
    const updated = stepBackInterval(m);
    // Should do graduated reset (two levels back from 30), not full reset
    // INTERVAL_LEVELS = [0, 1, 3, 7, 14, 30]: index 5 → two back → index 3 = 7
    expect(updated.intervalDays).toBe(7);
  });
});
