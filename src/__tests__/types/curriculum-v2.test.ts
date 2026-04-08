import { describe, it, expect } from "vitest";
import type {
  LessonV2,
  ExerciseStep,
  ExerciseSource,
  PhaseV2,
  MasteryPolicy,
} from "@/src/types/curriculum-v2";

describe("curriculum-v2 types", () => {
  it("accepts a valid LessonV2 with exercisePlan", () => {
    const lesson: LessonV2 = {
      id: 1,
      phase: 1,
      module: "1.1",
      moduleTitle: "First Real Decoding Wins",
      title: "Arabic Starts Here",
      description: "Orient to right-to-left reading",
      teachEntityIds: ["letter:1", "letter:2"],
      reviewEntityIds: [],
      exercisePlan: [
        { type: "tap", count: 2, target: "letter", source: { from: "teach" } },
        {
          type: "hear",
          count: 2,
          target: "letter",
          source: { from: "teach" },
          direction: "audio-to-script",
        },
      ],
      masteryPolicy: { passThreshold: 0.85 },
    };
    expect(lesson.id).toBe(1);
    expect(lesson.exercisePlan).toHaveLength(2);
  });

  it("accepts a LessonV2 with decode gating", () => {
    const lesson: LessonV2 = {
      id: 7,
      phase: 1,
      module: "1.1",
      title: "Checkpoint 1: Tiny Chunks",
      description: "Confirm decoding ability",
      teachEntityIds: ["letter:1", "letter:2", "combo:ba-fatha"],
      reviewEntityIds: [],
      exercisePlan: [
        {
          type: "check",
          count: 10,
          target: "mixed",
          source: { from: "all" },
          assessmentProfile: "phase-1-checkpoint",
        },
      ],
      masteryPolicy: {
        passThreshold: 0.9,
        decodePassRequired: 2,
        decodeMinPercent: 0.8,
      },
      renderProfile: "isolated",
    };
    expect(lesson.masteryPolicy.passThreshold).toBe(0.9);
  });

  it("accepts all ExerciseSource variants", () => {
    const sources: ExerciseSource[] = [
      { from: "teach" },
      { from: "review" },
      { from: "mixed", mix: { teach: 3, review: 1 } },
      { from: "all" },
      { from: "explicit", entityIds: ["letter:1", "combo:ba-fatha"] },
    ];
    expect(sources).toHaveLength(5);
  });

  it("accepts a valid PhaseV2", () => {
    const phase: PhaseV2 = {
      phase: 1,
      title: "First Real Decoding Wins",
      goal: "Get the learner from zero to tiny Arabic chunk decoding",
      unlockRuleText: "No prerequisite — this is the first phase",
      unlockPolicy: {
        requirePhase: 0,
        requireCheckpointPass: false,
      },
    };
    expect(phase.phase).toBe(1);
  });

  it("accepts a PhaseV2 with review queue policy", () => {
    const phase: PhaseV2 = {
      phase: 3,
      title: "Core Word Reading",
      goal: "Turn chunk reading into word reading",
      unlockRuleText: "Pass Phase 2 checkpoint, review queue clear",
      unlockPolicy: {
        requirePhase: 2,
        requireCheckpointPass: true,
        reviewQueuePolicy: {
          maxOverdueCritical: 3,
          overdueDaysThreshold: 7,
          scopeTag: "phase-2-core",
        },
        minRetainedEntities: 10,
      },
    };
    expect(phase.unlockPolicy.reviewQueuePolicy?.maxOverdueCritical).toBe(3);
  });
});
