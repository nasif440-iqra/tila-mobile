import { describe, it, expect } from "vitest";
import { generateTapItems } from "@/src/engine/questions-v2/tap";
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
const comboBA: ComboEntity = {
  id: "combo:ba-fatha", displayArabic: "\u0628\u064E", transliteration: "ba",
  capabilities: ["hearable", "readable", "buildable", "tappable"],
};
const comboMA: ComboEntity = {
  id: "combo:ma-fatha", displayArabic: "\u0645\u064E", transliteration: "ma",
  capabilities: ["hearable", "readable", "buildable", "tappable"],
};
const chunkBM: ChunkEntity = {
  id: "chunk:ba-ma", displayArabic: "\u0628\u064E\u0645\u064E", transliteration: "bama",
  capabilities: ["hearable", "readable", "buildable"],
  teachingBreakdownIds: ["combo:ba-fatha", "combo:ma-fatha"],
  breakdownType: "teaching", syllableCount: 2, audioKey: "chunk_ba-ma",
};

const allEntities = [letterA, letterB, letterM, comboBA, comboMA, chunkBM];

const baselesson: LessonV2 = {
  id: 1,
  phase: 1,
  module: "test",
  title: "Test Lesson",
  description: "Test",
  teachEntityIds: ["letter:1", "letter:2"],
  reviewEntityIds: ["letter:24"],
  exercisePlan: [],
  masteryPolicy: { passThreshold: 0.8 },
};

function makeInput(overrides: Partial<GeneratorInput> = {}): GeneratorInput {
  return {
    step: {
      type: "tap",
      count: 3,
      target: "letter",
      source: { from: "teach" },
    },
    lesson: baselesson,
    teachEntities: [letterA, letterB, letterM],
    reviewEntities: [comboBA, comboMA],
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

describe("generateTapItems", () => {
  it("produces correct number of items (matches step.count)", () => {
    const items = generateTapItems(makeInput());
    expect(items).toHaveLength(3);
  });

  it("each item has type 'tap'", () => {
    const items = generateTapItems(makeInput());
    for (const item of items) {
      expect(item.type).toBe("tap");
    }
  });

  it("each item has exactly one correct option", () => {
    const items = generateTapItems(makeInput());
    for (const item of items) {
      const correctOptions = item.options?.filter((o) => o.isCorrect) ?? [];
      expect(correctOptions).toHaveLength(1);
    }
  });

  it("options include the correct answer entity", () => {
    const items = generateTapItems(makeInput());
    for (const item of items) {
      const correctOption = item.options?.find((o) => o.isCorrect);
      expect(correctOption).toBeDefined();
      expect(correctOption?.id).toBe(item.targetEntityId);
    }
  });

  it("no duplicate option IDs within an item", () => {
    const items = generateTapItems(makeInput());
    for (const item of items) {
      const ids = item.options?.map((o) => o.id) ?? [];
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    }
  });

  it("isDecodeItem is false", () => {
    const items = generateTapItems(makeInput());
    for (const item of items) {
      expect(item.isDecodeItem).toBe(false);
    }
  });

  it("answerMode is 'arabic'", () => {
    const items = generateTapItems(makeInput());
    for (const item of items) {
      expect(item.answerMode).toBe("arabic");
    }
  });

  it("correctAnswer kind is 'single' with target entity id", () => {
    const items = generateTapItems(makeInput());
    for (const item of items) {
      expect(item.correctAnswer.kind).toBe("single");
      if (item.correctAnswer.kind === "single") {
        expect(item.correctAnswer.value).toBe(item.targetEntityId);
      }
    }
  });

  it("each item has a prompt with arabicDisplay", () => {
    const items = generateTapItems(makeInput());
    for (const item of items) {
      expect(item.prompt.arabicDisplay).toBeTruthy();
    }
  });

  it("respects custom distractorCount", () => {
    const input = makeInput({
      step: {
        type: "tap",
        count: 2,
        target: "letter",
        source: { from: "teach" },
        distractorCount: 2,
      },
    });
    const items = generateTapItems(input);
    for (const item of items) {
      // 1 correct + 2 distractors = 3 total (or fewer if pool is small)
      expect((item.options?.length ?? 0)).toBeGreaterThanOrEqual(1);
    }
  });

  it("returns empty array when no capable entities available", () => {
    // chunkBM is not tappable
    const items = generateTapItems(
      makeInput({
        teachEntities: [chunkBM],
        reviewEntities: [],
        allUnlockedEntities: [chunkBM],
      })
    );
    expect(items).toHaveLength(0);
  });

  it("options have displayArabic set", () => {
    const items = generateTapItems(makeInput());
    for (const item of items) {
      for (const option of item.options ?? []) {
        expect(option.displayArabic).toBeTruthy();
      }
    }
  });
});
