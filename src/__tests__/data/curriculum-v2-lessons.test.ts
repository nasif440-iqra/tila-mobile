import { describe, it, expect } from "vitest";
import { LESSONS_V2, PHASES_V2 } from "@/src/data/curriculum-v2";

describe("curriculum-v2 lesson data", () => {
  it("has at least 6 lessons for vertical slice", () => {
    expect(LESSONS_V2.length).toBeGreaterThanOrEqual(6);
  });

  it("all lessons have unique IDs", () => {
    const ids = LESSONS_V2.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all lessons have non-empty exercisePlan or non-empty teachingSequence", () => {
    LESSONS_V2.forEach((lesson) => {
      const hasExercisePlan = lesson.exercisePlan.length > 0;
      const hasTeachingSequence = (lesson.teachingSequence?.length ?? 0) > 0;
      expect(hasExercisePlan || hasTeachingSequence).toBe(true);
    });
  });

  it("all lessons have valid passThreshold between 0 and 1", () => {
    LESSONS_V2.forEach((lesson) => {
      expect(lesson.masteryPolicy.passThreshold).toBeGreaterThan(0);
      expect(lesson.masteryPolicy.passThreshold).toBeLessThanOrEqual(1);
    });
  });

  it("all entity IDs follow prefix convention", () => {
    const validPrefixes = ["letter:", "combo:", "chunk:", "word:", "pattern:", "rule:", "orthography:"];
    LESSONS_V2.forEach((lesson) => {
      [...lesson.teachEntityIds, ...lesson.reviewEntityIds].forEach((id) => {
        const hasValidPrefix = validPrefixes.some((p) => id.startsWith(p));
        expect(hasValidPrefix).toBe(true);
      });
    });
  });

  it("checkpoint lesson has assessmentProfile", () => {
    const checkpoints = LESSONS_V2.filter((l) =>
      l.exercisePlan.some((s) => s.type === "check")
    );
    expect(checkpoints.length).toBeGreaterThanOrEqual(1);
    checkpoints.forEach((cp) => {
      const checkStep = cp.exercisePlan.find((s) => s.type === "check");
      expect(checkStep).toBeDefined();
      if (checkStep?.type === "check") {
        expect(checkStep.assessmentProfile).toBeTruthy();
      }
    });
  });

  it("lessons with decodePassRequired end with decode-capable steps", () => {
    LESSONS_V2.filter((l) => l.masteryPolicy.decodePassRequired).forEach((lesson) => {
      const required = lesson.masteryPolicy.decodePassRequired!;

      // Decode steps may live in exitSequence (hybrid model) or at the end of exercisePlan
      const exitSeq = lesson.exitSequence ?? [];
      if (exitSeq.length > 0) {
        // Count decode items in exitSequence
        const decodeItemCount = exitSeq.filter(
          (item) => item.isDecodeItem
        ).length;
        expect(decodeItemCount).toBeGreaterThanOrEqual(required);
      } else {
        // Fall back to checking exercisePlan tail
        const plan = lesson.exercisePlan;
        let decodeItemCount = 0;
        for (let i = plan.length - 1; i >= 0; i--) {
          const step = plan[i];
          if (step.type === "read" || step.type === "check") {
            decodeItemCount += step.count;
          } else {
            break;
          }
        }
        expect(decodeItemCount).toBeGreaterThanOrEqual(required);
      }
    });
  });

  it("has 6 phase definitions", () => {
    expect(PHASES_V2).toHaveLength(6);
  });

  it("phases are numbered 1-6 in order", () => {
    PHASES_V2.forEach((phase, i) => {
      expect(phase.phase).toBe(i + 1);
    });
  });

  it("phase 1 has no prerequisites", () => {
    expect(PHASES_V2[0].unlockPolicy.requirePhase).toBe(0);
    expect(PHASES_V2[0].unlockPolicy.requireCheckpointPass).toBe(false);
  });

  it("phases 2-6 require previous phase", () => {
    PHASES_V2.slice(1).forEach((phase) => {
      expect(phase.unlockPolicy.requirePhase).toBe(phase.phase - 1);
      expect(phase.unlockPolicy.requireCheckpointPass).toBe(true);
    });
  });
});
