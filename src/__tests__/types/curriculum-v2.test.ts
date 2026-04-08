import { describe, it, expect } from "vitest";
import type {
  LessonV2,
  ExerciseStep,
  ExerciseSource,
  PhaseV2,
  MasteryPolicy,
} from "@/src/types/curriculum-v2";
import type {
  EntityBase,
  EntityCapability,
  ChunkEntity,
  WordEntity,
  PatternEntity,
  RuleEntity,
  OrthographyEntity,
} from "@/src/types/entity";
import type { AssessmentProfile } from "@/src/types/assessment";

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

describe("entity types", () => {
  it("accepts a ChunkEntity", () => {
    const chunk: ChunkEntity = {
      id: "chunk:bama",
      displayArabic: "\u0628\u064E\u0645\u064E",
      transliteration: "bama",
      capabilities: ["hearable", "readable", "buildable"],
      teachingBreakdownIds: ["combo:ba-fatha", "combo:ma-fatha"],
      breakdownType: "teaching",
      syllableCount: 2,
      audioKey: "chunk_bama",
    };
    expect(chunk.capabilities).toContain("readable");
  });

  it("accepts a WordEntity", () => {
    const word: WordEntity = {
      id: "word:allah",
      displayArabic: "\u0627\u0644\u0644\u0647",
      displayArabicAlt: "\u0671\u0644\u0644\u0651\u064E\u0647\u0650",
      transliteration: "allah",
      capabilities: ["hearable", "readable", "buildable", "quran-renderable"],
      teachingBreakdownIds: ["combo:alif-laam", "rule:shaddah", "combo:la-fatha", "combo:ha-kasra"],
      breakdownType: "teaching",
      connectedForm: "\u0627\u0644\u0644\u0647",
      quranScriptForm: "\u0671\u0644\u0644\u0651\u064E\u0647\u0650",
      frequency: "high",
      teachingPriority: "core",
      surahReferences: ["1:1", "1:2"],
      audioKey: "word_allah",
    };
    expect(word.frequency).toBe("high");
  });

  it("accepts a RuleEntity", () => {
    const rule: RuleEntity = {
      id: "rule:shaddah",
      displayArabic: "\u0651",
      capabilities: ["hearable", "readable", "fixable"],
      ruleType: "mark",
      description: "Doubles the consonant it sits on",
      appliesTo: ["combo", "word"],
      exampleEntityIds: ["word:allah"],
    };
    expect(rule.ruleType).toBe("mark");
  });

  it("accepts an AssessmentProfile", () => {
    const profile: AssessmentProfile = {
      id: "phase-1-checkpoint",
      description: "Confirm decoding of tiny unseen items",
      targetCapabilities: ["readable", "hearable"],
      exerciseWeights: [
        { type: "read", weight: 0.5 },
        { type: "choose", weight: 0.2 },
        { type: "hear", weight: 0.2 },
        { type: "build", weight: 0.1 },
      ],
      minimumReadPercent: 0.4,
      scaffoldingLevel: "none",
      diagnosticTags: ["vowel-confusion", "letter-confusion", "audio-mapping"],
      bucketThresholds: { "vowel-confusion": 0.6, "letter-confusion": 0.6 },
    };
    expect(profile.scaffoldingLevel).toBe("none");
  });
});
