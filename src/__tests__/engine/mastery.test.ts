import { describe, it, expect } from "vitest";
import type { ExerciseStep } from "@/src/types/curriculum-v2";
import {
  createEntityMastery,
  recordAttempt,
  applyDemotion,
  recordConfusion,
} from "@/src/engine/v2/mastery";
import type { RecentAttempt } from "@/src/engine/v2/mastery";

// ── Helpers ──

const TS = "2026-01-01T00:00:00.000Z";

function makeAttempt(
  correct: boolean,
  type: ExerciseStep["type"] = "tap",
  answerMode = "arabic",
  timestamp = TS,
): RecentAttempt {
  return { correct, exerciseType: type, answerMode, timestamp };
}

// Build an EntityMastery in a given state with a specific intervalDays
function masteryInState(
  state: "not_started" | "introduced" | "unstable" | "accurate" | "retained",
  intervalDays = 1,
) {
  return {
    ...createEntityMastery("letter:1"),
    state,
    intervalDays,
  };
}

// ── createEntityMastery ──

describe("createEntityMastery", () => {
  it("produces correct initial state", () => {
    const m = createEntityMastery("letter:1");
    expect(m.entityId).toBe("letter:1");
    expect(m.state).toBe("not_started");
    expect(m.correctCount).toBe(0);
    expect(m.attemptCount).toBe(0);
    expect(m.recentAttempts).toHaveLength(0);
    expect(m.intervalDays).toBe(0);
    expect(m.sessionStreak).toBe(0);
    expect(m.confusionPairs).toHaveLength(0);
    expect(typeof m.nextReview).toBe("string");
  });
});

// ── not_started stays not_started on failed lesson ──

describe("not_started state", () => {
  it("stays not_started after failed lesson but records evidence", () => {
    const m = createEntityMastery("letter:1");
    const attempt = makeAttempt(true);
    const result = recordAttempt(m, attempt, false); // lessonPassed = false
    expect(result.state).toBe("not_started");
    expect(result.attemptCount).toBe(1);
    expect(result.correctCount).toBe(1);
    expect(result.recentAttempts).toHaveLength(1);
  });

  it("records failed attempts in not_started without promoting", () => {
    const m = createEntityMastery("letter:1");
    const attempt = makeAttempt(false);
    const result = recordAttempt(m, attempt, false);
    expect(result.state).toBe("not_started");
    expect(result.attemptCount).toBe(1);
    expect(result.correctCount).toBe(0);
  });
});

// ── not_started → introduced ──

describe("not_started → introduced", () => {
  it("promotes to introduced on passed lesson", () => {
    const m = createEntityMastery("letter:1");
    const attempt = makeAttempt(true);
    const result = recordAttempt(m, attempt, true); // lessonPassed = true
    expect(result.state).toBe("introduced");
  });

  it("promotes even on incorrect attempt if lesson passed", () => {
    const m = createEntityMastery("letter:1");
    const attempt = makeAttempt(false);
    const result = recordAttempt(m, attempt, true);
    expect(result.state).toBe("introduced");
  });
});

// ── introduced → unstable ──

describe("introduced → unstable", () => {
  it("promotes to unstable after 2 correct attempts", () => {
    let m = masteryInState("introduced");
    m = recordAttempt(m, makeAttempt(true), false);
    expect(m.state).toBe("introduced"); // only 1 correct
    m = recordAttempt(m, makeAttempt(true), false);
    expect(m.state).toBe("unstable"); // 2 correct
  });

  it("does not promote with only 1 correct", () => {
    let m = masteryInState("introduced");
    m = recordAttempt(m, makeAttempt(false), false);
    m = recordAttempt(m, makeAttempt(true), false);
    expect(m.state).toBe("introduced"); // still only 1 correct total
  });
});

// ── unstable → accurate ──

describe("unstable → accurate", () => {
  it("promotes to accurate at 80%+ over 8 recent with no confusions", () => {
    // Build 7 correct + 1 incorrect = 87.5% over 8 attempts
    let m = masteryInState("unstable");
    for (let i = 0; i < 7; i++) {
      m = recordAttempt(m, makeAttempt(true), false);
    }
    m = recordAttempt(m, makeAttempt(false), false);
    // recentAttempts has 8 items, 7/8 = 87.5%
    expect(m.recentAttempts).toHaveLength(8);
    expect(m.state).toBe("accurate");
  });

  it("stays unstable below 80% (6 correct + 2 incorrect = 75%)", () => {
    let m = masteryInState("unstable");
    for (let i = 0; i < 6; i++) {
      m = recordAttempt(m, makeAttempt(true), false);
    }
    m = recordAttempt(m, makeAttempt(false), false);
    m = recordAttempt(m, makeAttempt(false), false);
    expect(m.recentAttempts).toHaveLength(8);
    expect(m.state).toBe("unstable");
  });

  it("stays unstable with confusion pairs even at 80%+", () => {
    let m = masteryInState("unstable");
    // Add a confusion pair first
    m = recordConfusion(m, "letter:2", TS);
    // Then record 8 correct attempts
    for (let i = 0; i < 8; i++) {
      m = recordAttempt(m, makeAttempt(true), false);
    }
    // 100% correct but confusion pair exists
    expect(m.state).toBe("unstable");
  });

  it("does not promote with fewer than 8 recent attempts even at 100%", () => {
    let m = masteryInState("unstable");
    // Only 4 attempts — not enough window
    for (let i = 0; i < 4; i++) {
      m = recordAttempt(m, makeAttempt(true), false);
    }
    expect(m.state).toBe("unstable");
  });
});

// ── accurate → retained ──

describe("accurate → retained", () => {
  it("promotes to retained on correct review at 7+ day interval", () => {
    let m = masteryInState("accurate", 7);
    m = recordAttempt(m, makeAttempt(true), false);
    expect(m.state).toBe("retained");
  });

  it("does not promote accurate → retained at interval < 7", () => {
    let m = masteryInState("accurate", 3);
    m = recordAttempt(m, makeAttempt(true), false);
    expect(m.state).toBe("accurate");
  });

  it("does not promote accurate → retained on incorrect attempt", () => {
    let m = masteryInState("accurate", 7);
    m = recordAttempt(m, makeAttempt(false), false);
    expect(m.state).toBe("accurate");
  });
});

// ── applyDemotion ──

describe("applyDemotion", () => {
  it("resets intervalDays to 1 for introduced state", () => {
    const m = { ...masteryInState("introduced"), intervalDays: 3 };
    const result = applyDemotion(m);
    expect(result.intervalDays).toBe(1);
    expect(result.state).toBe("introduced");
  });

  it("resets intervalDays to 1 for unstable state", () => {
    const m = { ...masteryInState("unstable"), intervalDays: 7 };
    const result = applyDemotion(m);
    expect(result.intervalDays).toBe(1);
    expect(result.state).toBe("unstable");
  });

  it("steps back one interval level for accurate state (14 → 7)", () => {
    const m = { ...masteryInState("accurate"), intervalDays: 14 };
    const result = applyDemotion(m);
    expect(result.intervalDays).toBe(7);
    expect(result.state).toBe("accurate");
  });

  it("steps back one interval level for accurate state (7 → 3)", () => {
    const m = { ...masteryInState("accurate"), intervalDays: 7 };
    const result = applyDemotion(m);
    expect(result.intervalDays).toBe(3);
  });

  it("steps back two interval levels for retained state (30 → 7)", () => {
    const m = { ...masteryInState("retained"), intervalDays: 30 };
    const result = applyDemotion(m);
    expect(result.intervalDays).toBe(7);
    expect(result.state).toBe("retained");
  });

  it("steps back two interval levels for retained state (14 → 3)", () => {
    const m = { ...masteryInState("retained"), intervalDays: 14 };
    const result = applyDemotion(m);
    expect(result.intervalDays).toBe(3);
  });

  it("full reset to intervalDays=1 on 2 consecutive failures in recentAttempts", () => {
    let m = masteryInState("accurate", 14);
    m = {
      ...m,
      recentAttempts: [makeAttempt(false), makeAttempt(false)],
    };
    const result = applyDemotion(m);
    expect(result.intervalDays).toBe(1);
  });

  it("retained entity stays retained after applyDemotion — interval-only demotion", () => {
    // DESIGN DECISION: demotion never regresses state, only shortens interval
    const m = { ...masteryInState("retained"), intervalDays: 14 };
    const result = applyDemotion(m);
    expect(result.state).toBe("retained");
    expect(result.intervalDays).toBeLessThan(14);
  });
});

// ── recentAttempts cap ──

describe("recentAttempts", () => {
  it("caps recentAttempts at 8 (FIFO)", () => {
    let m = masteryInState("introduced");
    const timestamps = [
      "2026-01-01T00:00:00.000Z",
      "2026-01-02T00:00:00.000Z",
      "2026-01-03T00:00:00.000Z",
      "2026-01-04T00:00:00.000Z",
      "2026-01-05T00:00:00.000Z",
      "2026-01-06T00:00:00.000Z",
      "2026-01-07T00:00:00.000Z",
      "2026-01-08T00:00:00.000Z",
      "2026-01-09T00:00:00.000Z",
      "2026-01-10T00:00:00.000Z",
    ];
    for (const ts of timestamps) {
      m = recordAttempt(m, makeAttempt(true, "tap", "arabic", ts), false);
    }
    expect(m.recentAttempts).toHaveLength(8);
    // First 2 should be dropped; newest is last
    expect(m.recentAttempts[0].timestamp).toBe("2026-01-03T00:00:00.000Z");
    expect(m.recentAttempts[7].timestamp).toBe("2026-01-10T00:00:00.000Z");
  });
});

// ── recordConfusion ──

describe("recordConfusion", () => {
  it("tracks a confusion pair correctly", () => {
    const m = createEntityMastery("letter:1");
    const result = recordConfusion(m, "letter:2", TS);
    expect(result.confusionPairs).toHaveLength(1);
    expect(result.confusionPairs[0].entityId).toBe("letter:2");
    expect(result.confusionPairs[0].count).toBe(1);
    expect(result.confusionPairs[0].lastSeen).toBe(TS);
  });

  it("increments count on repeated confusion with same entity", () => {
    let m = createEntityMastery("letter:1");
    const ts2 = "2026-01-02T00:00:00.000Z";
    m = recordConfusion(m, "letter:2", TS);
    m = recordConfusion(m, "letter:2", ts2);
    expect(m.confusionPairs).toHaveLength(1);
    expect(m.confusionPairs[0].count).toBe(2);
    expect(m.confusionPairs[0].lastSeen).toBe(ts2);
  });

  it("tracks multiple distinct confusion pairs", () => {
    let m = createEntityMastery("letter:1");
    m = recordConfusion(m, "letter:2", TS);
    m = recordConfusion(m, "letter:3", TS);
    expect(m.confusionPairs).toHaveLength(2);
  });
});

// ── Immutability ──

describe("immutability", () => {
  it("recordAttempt returns a new object", () => {
    const m = createEntityMastery("letter:1");
    const result = recordAttempt(m, makeAttempt(true), true);
    expect(result).not.toBe(m);
  });

  it("applyDemotion returns a new object", () => {
    const m = masteryInState("accurate", 14);
    const result = applyDemotion(m);
    expect(result).not.toBe(m);
  });

  it("recordConfusion returns a new object", () => {
    const m = createEntityMastery("letter:1");
    const result = recordConfusion(m, "letter:2", TS);
    expect(result).not.toBe(m);
  });
});
