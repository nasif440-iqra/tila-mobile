import { describe, it, expect } from "vitest";
import { generateCheckItems } from "@/src/engine/questions-v2/check";
import type { GeneratorInput } from "@/src/types/exercise";
import type { LetterEntity, ComboEntity, ChunkEntity } from "@/src/types/entity";
import type { LessonV2 } from "@/src/types/curriculum-v2";

// ── Fixtures ──

const letterA: LetterEntity = {
  id: "letter:1", displayArabic: "\u0627", transliteration: "aa",
  capabilities: ["tappable", "hearable", "readable"],
};
const letterB: LetterEntity = {
  id: "letter:2", displayArabic: "\u0628", transliteration: "b",
  capabilities: ["tappable", "hearable", "readable"],
};
const letterM: LetterEntity = {
  id: "letter:24", displayArabic: "\u0645", transliteration: "m",
  capabilities: ["tappable", "hearable", "readable"],
};
const letterN: LetterEntity = {
  id: "letter:25", displayArabic: "\u0646", transliteration: "n",
  capabilities: ["tappable", "hearable", "readable"],
};
const comboBA: ComboEntity = {
  id: "combo:ba-fatha", displayArabic: "\u0628\u064E", transliteration: "ba",
  capabilities: ["hearable", "readable", "buildable", "tappable"],
};
const comboMA: ComboEntity = {
  id: "combo:ma-fatha", displayArabic: "\u0645\u064E", transliteration: "ma",
  capabilities: ["hearable", "readable", "buildable", "tappable"],
};
const comboLA: ComboEntity = {
  id: "combo:la-fatha", displayArabic: "\u0644\u064E", transliteration: "la",
  capabilities: ["hearable", "readable", "buildable", "tappable"],
};
const chunkBM: ChunkEntity = {
  id: "chunk:ba-ma", displayArabic: "\u0628\u064E\u0645\u064E", transliteration: "bama",
  capabilities: ["hearable", "readable", "buildable"],
  teachingBreakdownIds: ["combo:ba-fatha", "combo:ma-fatha"],
  breakdownType: "teaching", syllableCount: 2, audioKey: "chunk_ba-ma",
};
const chunkLM: ChunkEntity = {
  id: "chunk:la-ma", displayArabic: "\u0644\u064E\u0645\u064E", transliteration: "lama",
  capabilities: ["hearable", "readable", "buildable"],
  teachingBreakdownIds: ["combo:la-fatha", "combo:ma-fatha"],
  breakdownType: "teaching", syllableCount: 2, audioKey: "chunk_la-ma",
};

const allEntities = [letterA, letterB, letterM, letterN, comboBA, comboMA, comboLA, chunkBM, chunkLM];

const baseLesson: LessonV2 = {
  id: 7, phase: 1, module: "1.1",
  title: "Checkpoint 1: Tiny Chunks",
  description: "Confirm the learner can decode short unseen items",
  teachEntityIds: ["letter:1", "letter:2", "letter:24", "letter:23", "combo:ba-fatha", "combo:ma-fatha", "combo:la-fatha", "chunk:ba-ma", "chunk:la-ma"],
  reviewEntityIds: [],
  exercisePlan: [
    { type: "check", count: 10, target: "mixed", source: { from: "all" }, assessmentProfile: "phase-1-checkpoint" },
  ],
  masteryPolicy: { passThreshold: 0.9, decodePassRequired: 2, decodeMinPercent: 0.8 },
  renderProfile: "isolated",
};

function makeInput(overrides: Partial<GeneratorInput> = {}): GeneratorInput {
  return {
    step: {
      type: "check",
      count: 10,
      target: "mixed",
      source: { from: "all" },
      assessmentProfile: "phase-1-checkpoint",
    },
    lesson: baseLesson,
    teachEntities: [letterA, letterB, letterM, comboBA, comboMA, comboLA, chunkBM, chunkLM],
    reviewEntities: [],
    allUnlockedEntities: allEntities,
    masterySnapshot: {
      entityStates: new Map(),
      confusionPairs: new Map(),
    },
    renderProfile: "isolated",
    ...overrides,
  };
}

// ── Tests ──

describe("generateCheckItems", () => {
  it("total items match step.count", () => {
    const items = generateCheckItems(makeInput());
    expect(items).toHaveLength(10);
  });

  it("total items match step.count for other counts", () => {
    const items = generateCheckItems(makeInput({
      step: {
        type: "check",
        count: 8,
        target: "mixed",
        source: { from: "all" },
        assessmentProfile: "phase-1-checkpoint",
      },
    }));
    expect(items).toHaveLength(8);
  });

  it("mix of exercise types appears in output", () => {
    const items = generateCheckItems(makeInput());
    const types = new Set(items.map((i) => i.type));
    // phase-1-checkpoint has read, choose, hear, build — expect at least 2 types
    expect(types.size).toBeGreaterThanOrEqual(2);
  });

  it("minimumReadPercent enforced — at least 40% are decode items (read)", () => {
    const items = generateCheckItems(makeInput());
    const readItems = items.filter((i) => i.type === "read");
    // phase-1-checkpoint: minimumReadPercent = 0.4, count = 10 → at least 4 read items
    expect(readItems.length).toBeGreaterThanOrEqual(4);
  });

  it("each item has generatedBy set", () => {
    const items = generateCheckItems(makeInput());
    for (const item of items) {
      expect(item.generatedBy).toBeDefined();
      expect(typeof item.generatedBy).toBe("string");
    }
  });

  it("each item has assessmentBucket set", () => {
    const items = generateCheckItems(makeInput());
    for (const item of items) {
      expect(item.assessmentBucket).toBeDefined();
      expect(typeof item.assessmentBucket).toBe("string");
    }
  });

  it("assessmentBucket values come from profile diagnosticTags", () => {
    const items = generateCheckItems(makeInput());
    const validBuckets = new Set(["vowel-confusion", "letter-confusion", "audio-mapping"]);
    for (const item of items) {
      expect(validBuckets.has(item.assessmentBucket!)).toBe(true);
    }
  });

  it("generatedBy matches item type", () => {
    const items = generateCheckItems(makeInput());
    for (const item of items) {
      expect(item.generatedBy).toBe(item.type);
    }
  });

  it("works with the phase-1-checkpoint profile specifically", () => {
    const items = generateCheckItems(makeInput());
    expect(items.length).toBe(10);

    // Profile weights: read 0.5, choose 0.2, hear 0.2, build 0.1
    // read weight 0.5 → 5 items; minimumReadPercent 0.4 → at least 4
    // read should be the largest single type
    const readItems = items.filter((i) => i.type === "read");
    expect(readItems.length).toBeGreaterThanOrEqual(4);

    // read allocation (5) should be >= any other single type
    const chooseItems = items.filter((i) => i.type === "choose");
    const hearItems = items.filter((i) => i.type === "hear");
    const buildItems = items.filter((i) => i.type === "build");
    expect(readItems.length).toBeGreaterThanOrEqual(chooseItems.length);
    expect(readItems.length).toBeGreaterThanOrEqual(hearItems.length);
    expect(readItems.length).toBeGreaterThanOrEqual(buildItems.length);
  });

  it("returns empty array when profile not found", () => {
    const items = generateCheckItems(makeInput({
      step: {
        type: "check",
        count: 5,
        target: "mixed",
        source: { from: "all" },
        assessmentProfile: "nonexistent-profile",
      },
    }));
    expect(items).toHaveLength(0);
  });

  it("returns empty array for non-check step type", () => {
    const items = generateCheckItems(makeInput({
      step: {
        type: "tap",
        count: 3,
        target: "letter",
        source: { from: "teach" },
      } as any,
    }));
    expect(items).toHaveLength(0);
  });
});
