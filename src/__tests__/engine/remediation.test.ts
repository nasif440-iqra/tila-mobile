import { describe, it, expect } from "vitest";
import { generateRemediation } from "@/src/engine/v2/remediation";
import { createEntityMastery } from "@/src/engine/v2/mastery";
import type { EntityMastery } from "@/src/engine/v2/mastery";
import type { LessonResult } from "@/src/engine/v2/scoring";

// ── Helpers ──

function makeLessonResult(bucketScores: Record<string, { correct: number; total: number }>, passed = false): LessonResult {
  return {
    lessonId: 1,
    totalItems: 10,
    correctItems: 5,
    overallPercent: 0.5,
    decodeItems: 5,
    decodeCorrect: 3,
    decodePercent: 0.6,
    finalDecodeStreak: 2,
    bucketScores,
    passed,
    failureReasons: passed ? [] : [{ reason: "below-pass-threshold", actual: 0.5, required: 0.7 }],
  };
}

function makeEntity(
  entityId: string,
  state: EntityMastery["state"],
  confusionPairCount = 0,
): EntityMastery {
  return {
    ...createEntityMastery(entityId),
    state,
    confusionPairs: Array.from({ length: confusionPairCount }, (_, i) => ({
      entityId: `letter:${i + 100}`,
      count: 1,
      lastSeen: "2026-01-01T00:00:00.000Z",
    })),
  };
}

// ── Tests ──

describe("generateRemediation", () => {
  it("produces entity IDs from weakest buckets", () => {
    const failedResult = makeLessonResult({
      letter: { correct: 1, total: 5 }, // 20% — weak
      combo: { correct: 4, total: 5 },  // 80% — ok
    });
    const allMastery: EntityMastery[] = [
      makeEntity("letter:1", "unstable"),
      makeEntity("letter:2", "introduced"),
      makeEntity("combo:ba-fatha", "accurate"),
    ];
    const plan = generateRemediation(failedResult, allMastery, 10);
    // Should include weak-state entities
    expect(plan.entityIds.length).toBeGreaterThan(0);
  });

  it("respects maxItems cap", () => {
    const failedResult = makeLessonResult({
      letter: { correct: 0, total: 5 }, // 0% — very weak
    });
    const allMastery: EntityMastery[] = Array.from({ length: 10 }, (_, i) =>
      makeEntity(`letter:${i + 1}`, "unstable"),
    );
    const plan = generateRemediation(failedResult, allMastery, 3);
    expect(plan.entityIds).toHaveLength(3);
  });

  it("returns empty remediation when no weak buckets", () => {
    const failedResult = makeLessonResult({});
    const allMastery: EntityMastery[] = [
      makeEntity("letter:1", "unstable"),
    ];
    const plan = generateRemediation(failedResult, allMastery, 10);
    expect(plan.entityIds).toHaveLength(0);
    expect(plan.exerciseTypes).toHaveLength(0);
  });

  it("returns exercise types matching entity capabilities", () => {
    const failedResult = makeLessonResult({
      letter: { correct: 1, total: 5 }, // weak
    });
    const allMastery: EntityMastery[] = [
      makeEntity("letter:1", "introduced"),   // should produce tap, hear
      makeEntity("letter:2", "unstable"),      // should produce tap, hear, choose
    ];
    const plan = generateRemediation(failedResult, allMastery, 10);
    // Introduced entities get "tap" and "hear"
    expect(plan.exerciseTypes).toContain("tap");
    expect(plan.exerciseTypes).toContain("hear");
    // Unstable entities also get "choose"
    expect(plan.exerciseTypes).toContain("choose");
  });

  it("excludes retained and not_started entities from remediation", () => {
    const failedResult = makeLessonResult({
      letter: { correct: 0, total: 5 }, // very weak
    });
    const allMastery: EntityMastery[] = [
      makeEntity("letter:1", "retained"),
      makeEntity("letter:2", "not_started"),
      makeEntity("letter:3", "unstable"),
    ];
    const plan = generateRemediation(failedResult, allMastery, 10);
    expect(plan.entityIds).not.toContain("letter:1");
    expect(plan.entityIds).not.toContain("letter:2");
    expect(plan.entityIds).toContain("letter:3");
  });

  it("prioritizes weaker states first (introduced before accurate)", () => {
    const failedResult = makeLessonResult({
      letter: { correct: 0, total: 5 },
    });
    const allMastery: EntityMastery[] = [
      makeEntity("letter:1", "accurate"),
      makeEntity("letter:2", "introduced"),
      makeEntity("letter:3", "unstable"),
    ];
    const plan = generateRemediation(failedResult, allMastery, 2);
    expect(plan.entityIds[0]).toBe("letter:2"); // introduced first
    expect(plan.entityIds[1]).toBe("letter:3"); // unstable second
  });

  it("does NOT include all entities when bucket name has no prefix match — fallback is false", () => {
    // Bucket "audio-mapping" does not match any entityId prefix like "audio-mapping:"
    // so no entities should be included despite them being in weak states
    const failedResult = makeLessonResult({
      "audio-mapping": { correct: 0, total: 5 }, // very weak bucket
    });
    const allMastery: EntityMastery[] = [
      makeEntity("letter:1", "unstable"),
      makeEntity("letter:2", "introduced"),
      makeEntity("combo:ba-fatha", "accurate"),
    ];
    const plan = generateRemediation(failedResult, allMastery, 10);
    // None of the entity IDs start with "audio-mapping:" so none should be included
    expect(plan.entityIds).toHaveLength(0);
  });
});
