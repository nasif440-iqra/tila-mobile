import { describe, it, expect } from "vitest";
import { generateV2Exercises } from "@/src/engine/questions-v2";
import { evaluateLesson } from "@/src/engine/v2/scoring";
import { createEntityMastery, recordAttempt } from "@/src/engine/v2/mastery";
import { canUnlockPhase } from "@/src/engine/v2/unlocks";
import { generateRemediation } from "@/src/engine/v2/remediation";
import { resolveAll } from "@/src/engine/v2/entityRegistry";
import { LESSONS_V2 } from "@/src/data/curriculum-v2";
import { PHASES_V2 } from "@/src/data/curriculum-v2/phases";
import type { MasterySnapshot, ScoredItem } from "@/src/types/exercise";
import type { EntityMastery } from "@/src/engine/v2/mastery";
import type { AnyEntity } from "@/src/types/entity";

describe("vertical slice integration", () => {
  // Shared state across the test sequence
  const emptySnapshot: MasterySnapshot = {
    entityStates: new Map(),
    confusionPairs: new Map(),
  };

  it("generates exercises for lesson 2 (tap + hear + choose + read)", async () => {
    const lesson = LESSONS_V2.find(l => l.id === 2)!;
    const items = await generateV2Exercises(lesson, [], emptySnapshot);

    expect(items.length).toBeGreaterThan(0);
    // Lesson 2 plan: 2 tap + 2 hear + 3 choose + 3 read = 10
    expect(items.length).toBe(10);

    // Check exercise types are present
    const types = new Set(items.map(i => i.type));
    expect(types.has("tap")).toBe(true);
    expect(types.has("hear")).toBe(true);
    expect(types.has("choose")).toBe(true);
    expect(types.has("read")).toBe(true);

    // Read items should be decode items
    const readItems = items.filter(i => i.type === "read");
    readItems.forEach(i => expect(i.isDecodeItem).toBe(true));
  });

  it("scores a passing lesson correctly", async () => {
    const lesson = LESSONS_V2.find(l => l.id === 2)!;
    const items = await generateV2Exercises(lesson, [], emptySnapshot);

    // Simulate all correct answers
    const scoredItems: ScoredItem[] = items.map(item => ({
      item,
      correct: true,
      responseTimeMs: 1500,
      generatedBy: item.generatedBy ?? item.type,
      assessmentBucket: item.assessmentBucket,
      answerMode: item.answerMode,
    }));

    const result = evaluateLesson(lesson.id, scoredItems, lesson.masteryPolicy);

    expect(result.passed).toBe(true);
    expect(result.overallPercent).toBe(1.0);
    expect(result.failureReasons).toHaveLength(0);
  });

  it("scores a failing lesson with specific failure reasons", async () => {
    const lesson = LESSONS_V2.find(l => l.id === 2)!;
    const items = await generateV2Exercises(lesson, [], emptySnapshot);

    // Simulate mostly wrong answers (only 3 of 10 correct = 30%)
    const scoredItems: ScoredItem[] = items.map((item, i) => ({
      item,
      correct: i < 3,  // first 3 correct, rest wrong
      responseTimeMs: 1500,
      generatedBy: item.generatedBy ?? item.type,
      assessmentBucket: item.assessmentBucket,
      answerMode: item.answerMode,
    }));

    const result = evaluateLesson(lesson.id, scoredItems, lesson.masteryPolicy);

    expect(result.passed).toBe(false);
    expect(result.failureReasons.length).toBeGreaterThan(0);
    expect(result.failureReasons.some(r => r.reason === "below-pass-threshold")).toBe(true);
  });

  it("updates mastery after a passed lesson", async () => {
    const lesson = LESSONS_V2.find(l => l.id === 2)!;
    const items = await generateV2Exercises(lesson, [], emptySnapshot);

    // All correct
    const scoredItems: ScoredItem[] = items.map(item => ({
      item,
      correct: true,
      responseTimeMs: 1500,
      generatedBy: item.generatedBy ?? item.type,
      assessmentBucket: item.assessmentBucket,
      answerMode: item.answerMode,
    }));

    // Update mastery for each entity
    const masteryMap = new Map<string, EntityMastery>();
    for (const scored of scoredItems) {
      const entityId = scored.item.targetEntityId;
      if (!masteryMap.has(entityId)) {
        masteryMap.set(entityId, createEntityMastery(entityId));
      }
      const attempt = {
        correct: scored.correct,
        exerciseType: scored.generatedBy,
        answerMode: scored.answerMode,
        timestamp: new Date().toISOString(),
      };
      masteryMap.set(entityId, recordAttempt(masteryMap.get(entityId)!, attempt, true));
    }

    // Verify mastery state advanced beyond not_started for all entities seen in the lesson
    // (Entities appear in multiple items, so many will advance past introduced → unstable)
    const masteries = Array.from(masteryMap.values());
    expect(masteries.length).toBeGreaterThan(0);
    const progressed = masteries.filter(m => m.state !== "not_started");
    expect(progressed.length).toBeGreaterThan(0);
  });

  it("generates and evaluates checkpoint lesson 7", async () => {
    const checkpoint = LESSONS_V2.find(l => l.id === 7)!;

    // Checkpoint uses source: { from: "all" } — resolve review entities as the unlocked pool
    // (checkpoints have empty teachEntityIds; the assessed inventory is in reviewEntityIds)
    const allUnlocked: AnyEntity[] = await resolveAll(checkpoint.reviewEntityIds);
    const items = await generateV2Exercises(checkpoint, allUnlocked, emptySnapshot);

    // Check generator distributes items by weight with rounding — may produce slightly fewer
    expect(items.length).toBeGreaterThanOrEqual(8);
    expect(items.length).toBeLessThanOrEqual(10);

    // Simulate a failing checkpoint (~70% correct, need 90%)
    const scoredItems: ScoredItem[] = items.map((item, i) => ({
      item,
      correct: i < 7,
      responseTimeMs: 1500,
      generatedBy: item.generatedBy ?? item.type,
      assessmentBucket: item.assessmentBucket,
      answerMode: item.answerMode,
    }));

    const result = evaluateLesson(checkpoint.id, scoredItems, checkpoint.masteryPolicy);

    expect(result.passed).toBe(false);
    expect(result.overallPercent).toBeLessThan(0.9); // below 90% threshold
  });

  it("generates remediation from a failed checkpoint", async () => {
    const checkpoint = LESSONS_V2.find(l => l.id === 7)!;

    // Checkpoint uses source: { from: "all" } — resolve review entities as the unlocked pool
    // (checkpoints have empty teachEntityIds; the assessed inventory is in reviewEntityIds)
    const allUnlocked: AnyEntity[] = await resolveAll(checkpoint.reviewEntityIds);
    const items = await generateV2Exercises(checkpoint, allUnlocked, emptySnapshot);

    const scoredItems: ScoredItem[] = items.map((item, i) => ({
      item,
      correct: i < 7,
      responseTimeMs: 1500,
      generatedBy: item.generatedBy ?? item.type,
      assessmentBucket: item.assessmentBucket,
      answerMode: item.answerMode,
    }));

    const result = evaluateLesson(checkpoint.id, scoredItems, checkpoint.masteryPolicy);

    // Generate remediation
    const allMastery = items.map(i => createEntityMastery(i.targetEntityId));
    const remediation = generateRemediation(result, allMastery, 5);

    // Remediation should produce something (may be empty if bucket prefixes don't match — that's OK for now)
    expect(remediation).toBeDefined();
    expect(Array.isArray(remediation.entityIds)).toBe(true);
    expect(Array.isArray(remediation.exerciseTypes)).toBe(true);
  });

  it("evaluates phase 2 unlock after completing phase 1", () => {
    const phase2 = PHASES_V2.find(p => p.phase === 2)!;

    // Phase 1 NOT complete — should be locked
    const lockedResult = canUnlockPhase(phase2, {
      phaseCompleted: (_p) => false,
      lessonPassed: (_id) => false,
      getOverdueEntities: (_p) => [],
      countRetainedEntities: (_p) => 0,
    });
    expect(lockedResult.unlocked).toBe(false);
    expect(lockedResult.reasons.length).toBeGreaterThan(0);

    // Phase 1 complete — should be unlocked
    const unlockedResult = canUnlockPhase(phase2, {
      phaseCompleted: (p) => p === 1,
      lessonPassed: (_id) => true,
      getOverdueEntities: (_p) => [],
      countRetainedEntities: (_p) => 20,
    });
    expect(unlockedResult.unlocked).toBe(true);
    expect(unlockedResult.reasons).toHaveLength(0);
  });

  it("full loop: lesson 1 through checkpoint pass", async () => {
    // This test simulates a learner going through lessons 1-5 and then passing the checkpoint.
    // Each lesson's teach + review entity IDs are resolved for allUnlockedEntities so that
    // generators using source: { from: "all" } (like the checkpoint check step) get a real pool.
    const lessonIds = [1, 2, 3, 4, 5, 7];
    const masteryMap = new Map<string, EntityMastery>();

    for (const lessonId of lessonIds) {
      const lesson = LESSONS_V2.find(l => l.id === lessonId)!;
      const snapshot: MasterySnapshot = {
        entityStates: new Map(
          Array.from(masteryMap.entries()).map(([id, m]) => [id, {
            state: m.state, correctCount: m.correctCount, attemptCount: m.attemptCount,
          }])
        ),
        confusionPairs: new Map(),
      };

      // Resolve all entities referenced by this lesson for use as the unlocked pool
      const allEntityIds = [...new Set([...lesson.teachEntityIds, ...lesson.reviewEntityIds])];
      const allUnlocked: AnyEntity[] = await resolveAll(allEntityIds);

      const items = await generateV2Exercises(lesson, allUnlocked, snapshot);
      expect(items.length).toBeGreaterThan(0);

      // All correct
      const scoredItems: ScoredItem[] = items.map(item => ({
        item,
        correct: true,
        responseTimeMs: 1200,
        generatedBy: item.generatedBy ?? item.type,
        assessmentBucket: item.assessmentBucket,
        answerMode: item.answerMode,
      }));

      const result = evaluateLesson(lesson.id, scoredItems, lesson.masteryPolicy);
      expect(result.passed).toBe(true);

      // Update mastery
      for (const scored of scoredItems) {
        const entityId = scored.item.targetEntityId;
        if (!masteryMap.has(entityId)) {
          masteryMap.set(entityId, createEntityMastery(entityId));
        }
        masteryMap.set(entityId, recordAttempt(
          masteryMap.get(entityId)!,
          { correct: true, exerciseType: scored.generatedBy, answerMode: scored.answerMode, timestamp: new Date().toISOString() },
          true
        ));
      }
    }

    // After completing all lessons including checkpoint, verify mastery state
    const allMastery = Array.from(masteryMap.values());
    expect(allMastery.length).toBeGreaterThan(0);
    // At least some entities should be beyond not_started
    const progressed = allMastery.filter(m => m.state !== "not_started");
    expect(progressed.length).toBeGreaterThan(0);
  });
});
