import { describe, it, expect } from "vitest";
import { generateBuildItems } from "@/src/engine/questions-v2/build";
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
const chunkBL: ChunkEntity = {
  id: "chunk:ba-la", displayArabic: "\u0628\u064E\u0644\u064E", transliteration: "bala",
  capabilities: ["hearable", "readable", "buildable"],
  teachingBreakdownIds: ["combo:ba-fatha", "combo:la-fatha"],
  breakdownType: "teaching", syllableCount: 2, audioKey: "chunk_ba-la",
};

// A buildable entity without teachingBreakdownIds (simulated as a combo that's buildable)
const buildableNoBreakdown: ComboEntity = {
  id: "combo:ta-fatha", displayArabic: "\u062A\u064E", transliteration: "ta",
  capabilities: ["hearable", "readable", "buildable"],
};

const allEntities = [letterA, letterB, comboBA, comboMA, comboLA, chunkBM, chunkBL];

const baseLesson: LessonV2 = {
  id: 1,
  phase: 1,
  module: "test",
  title: "Test Lesson",
  description: "Test",
  teachEntityIds: ["chunk:ba-ma", "chunk:ba-la"],
  reviewEntityIds: [],
  exercisePlan: [],
  masteryPolicy: { passThreshold: 0.8 },
};

function makeInput(overrides: Partial<GeneratorInput> = {}): GeneratorInput {
  return {
    step: {
      type: "build",
      count: 2,
      target: "chunk",
      source: { from: "teach" },
    },
    lesson: baseLesson,
    teachEntities: [chunkBM, chunkBL],
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

describe("generateBuildItems", () => {
  it("produces correct number of items (matches step.count)", () => {
    const items = generateBuildItems(makeInput());
    expect(items).toHaveLength(2);
  });

  it("each item has a tiles array", () => {
    const items = generateBuildItems(makeInput());
    for (const item of items) {
      expect(Array.isArray(item.tiles)).toBe(true);
      expect((item.tiles?.length ?? 0)).toBeGreaterThan(0);
    }
  });

  it("tiles include all correct breakdown components (isDistractor: false)", () => {
    const items = generateBuildItems(makeInput());
    const firstItem = items[0];
    const correctTiles = firstItem.tiles?.filter((t) => !t.isDistractor) ?? [];
    expect(correctTiles).toHaveLength(2); // chunk:ba-ma has 2 breakdown IDs
    const correctIds = correctTiles.map((t) => t.entityId);
    expect(correctIds).toContain("combo:ba-fatha");
    expect(correctIds).toContain("combo:ma-fatha");
  });

  it("tiles include distractors (isDistractor: true)", () => {
    const items = generateBuildItems(makeInput());
    for (const item of items) {
      const distractors = item.tiles?.filter((t) => t.isDistractor) ?? [];
      expect(distractors.length).toBeGreaterThan(0);
    }
  });

  it("total tiles <= maxTiles when set", () => {
    const input = makeInput({
      step: {
        type: "build",
        count: 2,
        target: "chunk",
        source: { from: "teach" },
        maxTiles: 3,
      },
    });
    const items = generateBuildItems(input);
    for (const item of items) {
      expect((item.tiles?.length ?? 0)).toBeLessThanOrEqual(3);
    }
  });

  it("correct answer is { kind: 'sequence' } with ordered teachingBreakdownIds", () => {
    const items = generateBuildItems(makeInput());
    const firstItem = items[0];
    expect(firstItem.correctAnswer.kind).toBe("sequence");
    if (firstItem.correctAnswer.kind === "sequence") {
      expect(firstItem.correctAnswer.values).toEqual(["combo:ba-fatha", "combo:ma-fatha"]);
    }
  });

  it("items only generated for entities with buildable capability", () => {
    // letterA and letterB are not buildable
    const input = makeInput({
      teachEntities: [letterA, letterB, chunkBM],
      step: {
        type: "build",
        count: 3,
        target: "chunk",
        source: { from: "teach" },
      },
    });
    const items = generateBuildItems(input);
    // Only chunkBM is buildable and has teachingBreakdownIds, so at most 1 unique target
    for (const item of items) {
      expect(item.targetEntityId).toBe("chunk:ba-ma");
    }
  });

  it("entity without teachingBreakdownIds produces no items for that target", () => {
    const input = makeInput({
      teachEntities: [buildableNoBreakdown],
      allUnlockedEntities: [buildableNoBreakdown, comboBA, comboMA],
      step: {
        type: "build",
        count: 2,
        target: "combo",
        source: { from: "teach" },
      },
    });
    const items = generateBuildItems(input);
    expect(items).toHaveLength(0);
  });

  it("answerMode is 'build'", () => {
    const items = generateBuildItems(makeInput());
    for (const item of items) {
      expect(item.answerMode).toBe("build");
    }
  });

  it("type is 'build'", () => {
    const items = generateBuildItems(makeInput());
    for (const item of items) {
      expect(item.type).toBe("build");
    }
  });

  it("prompt has arabicDisplay from target entity", () => {
    const items = generateBuildItems(makeInput());
    for (const item of items) {
      expect(item.prompt.arabicDisplay).toBeTruthy();
    }
  });

  it("correct tiles have displayArabic resolved from allUnlockedEntities", () => {
    const items = generateBuildItems(makeInput());
    const firstItem = items[0];
    const correctTiles = firstItem.tiles?.filter((t) => !t.isDistractor) ?? [];
    for (const tile of correctTiles) {
      expect(tile.displayArabic).toBeTruthy();
    }
  });

  it("isDecodeItem is false", () => {
    const items = generateBuildItems(makeInput());
    for (const item of items) {
      expect(item.isDecodeItem).toBe(false);
    }
  });
});
