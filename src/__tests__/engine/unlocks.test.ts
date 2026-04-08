import { describe, it, expect } from "vitest";
import { canUnlockPhase } from "@/src/engine/v2/unlocks";
import type { ProgressSnapshot } from "@/src/engine/v2/unlocks";
import { PHASES_V2 } from "@/src/data/curriculum-v2/phases";
import { createEntityMastery } from "@/src/engine/v2/mastery";
import type { EntityMastery } from "@/src/engine/v2/mastery";

// ── Helpers ──

function makeProgress(overrides: Partial<ProgressSnapshot> = {}): ProgressSnapshot {
  return {
    phaseCompleted: () => true,
    lessonPassed: () => true,
    getOverdueEntities: () => [],
    countRetainedEntities: () => 999,
    ...overrides,
  };
}

function makeOverdueEntity(entityId: string, daysOverdue: number): EntityMastery {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() - daysOverdue);
  return {
    ...createEntityMastery(entityId),
    state: "accurate",
    intervalDays: 7,
    nextReview: dueDate.toISOString(),
  };
}

// ── Tests ──

describe("canUnlockPhase", () => {
  it("Phase 1 is always unlocked (requirePhase: 0)", () => {
    const phase1 = PHASES_V2.find((p) => p.phase === 1)!;
    const progress = makeProgress({ phaseCompleted: () => false });
    const result = canUnlockPhase(phase1, progress);
    expect(result.unlocked).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it("Phase 2 is blocked if Phase 1 is not completed", () => {
    const phase2 = PHASES_V2.find((p) => p.phase === 2)!;
    const progress = makeProgress({
      phaseCompleted: (phase) => phase !== 1,
    });
    const result = canUnlockPhase(phase2, progress);
    expect(result.unlocked).toBe(false);
    expect(result.reasons).toHaveLength(1);
    expect(result.reasons[0]).toContain("Phase 1");
  });

  it("Phase with review queue policy: blocked if too many critical overdue entities", () => {
    const phase3 = PHASES_V2.find((p) => p.phase === 3)!;
    // phase3 has maxOverdueCritical: 3, overdueDaysThreshold: 7
    // Create 5 entities overdue by 8 days (more than threshold 7)
    const overdueEntities = Array.from({ length: 5 }, (_, i) =>
      makeOverdueEntity(`letter:${i + 1}`, 8),
    );
    const progress = makeProgress({
      phaseCompleted: () => true,
      getOverdueEntities: () => overdueEntities,
    });
    const result = canUnlockPhase(phase3, progress);
    expect(result.unlocked).toBe(false);
    expect(result.reasons.some((r) => r.includes("Too many overdue"))).toBe(true);
  });

  it("Phase with review queue policy: allowed if overdue count within threshold", () => {
    const phase3 = PHASES_V2.find((p) => p.phase === 3)!;
    // Only 2 critical overdue entities — maxOverdueCritical is 3, so within limit
    const overdueEntities = Array.from({ length: 2 }, (_, i) =>
      makeOverdueEntity(`letter:${i + 1}`, 8),
    );
    const progress = makeProgress({
      phaseCompleted: () => true,
      getOverdueEntities: () => overdueEntities,
    });
    const result = canUnlockPhase(phase3, progress);
    expect(result.unlocked).toBe(true);
  });

  it("Phase with minRetainedEntities: blocked if threshold not met", () => {
    const phase4 = PHASES_V2.find((p) => p.phase === 4)!;
    // phase4 minRetainedEntities: 10
    const progress = makeProgress({
      phaseCompleted: () => true,
      getOverdueEntities: () => [],
      countRetainedEntities: () => 5, // below 10
    });
    const result = canUnlockPhase(phase4, progress);
    expect(result.unlocked).toBe(false);
    expect(result.reasons.some((r) => r.includes("Not enough retained"))).toBe(true);
  });

  it("All conditions pass = unlocked", () => {
    const phase4 = PHASES_V2.find((p) => p.phase === 4)!;
    // phase4: requirePhase 3, reviewQueuePolicy, minRetainedEntities: 10
    const progress = makeProgress({
      phaseCompleted: () => true,
      getOverdueEntities: () => [],
      countRetainedEntities: () => 15, // >= 10
    });
    const result = canUnlockPhase(phase4, progress);
    expect(result.unlocked).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it("Returns specific failure reason strings", () => {
    const phase4 = PHASES_V2.find((p) => p.phase === 4)!;
    const overdueEntities = Array.from({ length: 10 }, (_, i) =>
      makeOverdueEntity(`letter:${i + 1}`, 10),
    );
    const progress = makeProgress({
      phaseCompleted: (phase) => phase !== 3,
      getOverdueEntities: () => overdueEntities,
      countRetainedEntities: () => 3,
    });
    const result = canUnlockPhase(phase4, progress);
    expect(result.unlocked).toBe(false);
    // Should have reason for phase not completed
    expect(result.reasons.some((r) => r.includes("Phase 3"))).toBe(true);
    // Should have reason for retained entities
    expect(result.reasons.some((r) => r.includes("Not enough retained"))).toBe(true);
    // Should have reason for overdue
    expect(result.reasons.some((r) => r.includes("Too many overdue"))).toBe(true);
  });
});
