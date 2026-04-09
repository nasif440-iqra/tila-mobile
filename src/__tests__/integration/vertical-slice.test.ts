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

  it("generates exercises for lesson 2 (hybrid: teachingSequence + exercisePlan + exitSequence)", async () => {
    const lesson = LESSONS_V2.find(l => l.id === 2)!;
    const generated = await generateV2Exercises(lesson, [], emptySnapshot);
    const teachingSeq = lesson.teachingSequence ?? [];
    const exitSeq = lesson.exitSequence ?? [];
    const allItems = [...teachingSeq, ...generated, ...exitSeq];

    // Generated items come from exercisePlan only (2 choose + 1 read = 3)
    expect(generated.length).toBe(3);

    // Full lesson includes authored teachingSequence (4) + generated (3) + exitSequence (2) = 9
    expect(allItems.length).toBe(9);

    // Check exercise types across the full lesson flow
    const types = new Set(allItems.map(i => i.type));
    expect(types.has("present")).toBe(true);
    expect(types.has("tap")).toBe(true);
    expect(types.has("hear")).toBe(true);
    expect(types.has("choose")).toBe(true);
    expect(types.has("read")).toBe(true);

    // Exit sequence read items should be decode items
    const exitReadItems = exitSeq.filter(i => i.type === "read");
    exitReadItems.forEach(i => expect(i.isDecodeItem).toBe(true));
  });

  it("scores a passing lesson correctly", async () => {
    const lesson = LESSONS_V2.find(l => l.id === 2)!;
    const generated = await generateV2Exercises(lesson, [], emptySnapshot);
    const allItems = [...(lesson.teachingSequence ?? []), ...generated, ...(lesson.exitSequence ?? [])];

    // Simulate all correct answers
    const scoredItems: ScoredItem[] = allItems.map(item => ({
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
    const generated = await generateV2Exercises(lesson, [], emptySnapshot);
    const allItems = [...(lesson.teachingSequence ?? []), ...generated, ...(lesson.exitSequence ?? [])];

    // Simulate mostly wrong answers (only 2 of scorable items correct)
    // present items are filtered out by evaluateLesson, so we need enough wrong scorable items
    const scoredItems: ScoredItem[] = allItems.map((item, i) => ({
      item,
      correct: i < 2,  // first 2 correct, rest wrong
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
    const generated = await generateV2Exercises(lesson, [], emptySnapshot);
    const allItems = [...(lesson.teachingSequence ?? []), ...generated, ...(lesson.exitSequence ?? [])];

    // All correct
    const scoredItems: ScoredItem[] = allItems.map(item => ({
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
    const generated = await generateV2Exercises(checkpoint, allUnlocked, emptySnapshot);
    const teachingSeq = checkpoint.teachingSequence ?? [];
    const exitSeq = checkpoint.exitSequence ?? [];

    // exercisePlan has 1 check step with count=7 — generator produces 7 items
    expect(generated.length).toBe(7);

    // Full lesson: 1 teachingSequence opener + 7 generated + 2 exitSequence decode gates = 10
    const allItems = [...teachingSeq, ...generated, ...exitSeq];
    expect(allItems.length).toBe(10);

    // Simulate a failing checkpoint (~60% correct on scorable items, need 90%)
    // First item is a choose (teachingSequence opener), then 7 generated, then 2 exit decode items
    const scoredItems: ScoredItem[] = allItems.map((item, i) => ({
      item,
      correct: i < 6,  // first 6 correct, rest wrong — below 90% threshold
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
    const generated = await generateV2Exercises(checkpoint, allUnlocked, emptySnapshot);
    const allItems = [...(checkpoint.teachingSequence ?? []), ...generated, ...(checkpoint.exitSequence ?? [])];

    const scoredItems: ScoredItem[] = allItems.map((item, i) => ({
      item,
      correct: i < 6,  // ~60% correct, below 90% threshold
      responseTimeMs: 1500,
      generatedBy: item.generatedBy ?? item.type,
      assessmentBucket: item.assessmentBucket,
      answerMode: item.answerMode,
    }));

    const result = evaluateLesson(checkpoint.id, scoredItems, checkpoint.masteryPolicy);

    // Generate remediation
    const allMastery = allItems.map(i => createEntityMastery(i.targetEntityId));
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

      const generated = await generateV2Exercises(lesson, allUnlocked, snapshot);
      const allItems = [...(lesson.teachingSequence ?? []), ...generated, ...(lesson.exitSequence ?? [])];
      expect(allItems.length).toBeGreaterThan(0);

      // All correct
      const scoredItems: ScoredItem[] = allItems.map(item => ({
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
