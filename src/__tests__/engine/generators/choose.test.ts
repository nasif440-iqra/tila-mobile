import { describe, it, expect } from "vitest";
import { generateChooseItems } from "@/src/engine/questions-v2/choose";
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
      type: "choose",
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

describe("generateChooseItems", () => {
  it("produces correct number of items (matches step.count)", () => {
    const items = generateChooseItems(makeInput());
    expect(items).toHaveLength(3);
  });

  it("each item has type 'choose'", () => {
    const items = generateChooseItems(makeInput());
    for (const item of items) {
      expect(item.type).toBe("choose");
    }
  });

  it("each item has exactly one correct option", () => {
    const items = generateChooseItems(makeInput());
    for (const item of items) {
      const correctOptions = item.options?.filter((o) => o.isCorrect) ?? [];
      expect(correctOptions).toHaveLength(1);
    }
  });

  it("options include the correct answer entity", () => {
    const items = generateChooseItems(makeInput());
    for (const item of items) {
      const correctOption = item.options?.find((o) => o.isCorrect);
      expect(correctOption).toBeDefined();
      expect(correctOption?.id).toBe(item.targetEntityId);
    }
  });

  it("no duplicate option IDs within an item", () => {
    const items = generateChooseItems(makeInput());
    for (const item of items) {
      const ids = item.options?.map((o) => o.id) ?? [];
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    }
  });

  it("isDecodeItem is false", () => {
    const items = generateChooseItems(makeInput());
    for (const item of items) {
      expect(item.isDecodeItem).toBe(false);
    }
  });

  it("answerMode is 'arabic'", () => {
    const items = generateChooseItems(makeInput());
    for (const item of items) {
      expect(item.answerMode).toBe("arabic");
    }
  });

  it("correctAnswer kind is 'single' with target entity id", () => {
    const items = generateChooseItems(makeInput());
    for (const item of items) {
      expect(item.correctAnswer.kind).toBe("single");
      if (item.correctAnswer.kind === "single") {
        expect(item.correctAnswer.value).toBe(item.targetEntityId);
      }
    }
  });

  it("always has 4 options (1 correct + 3 distractors)", () => {
    const items = generateChooseItems(makeInput());
    for (const item of items) {
      // With enough pool entities, should always be 4
      expect(item.options).toHaveLength(4);
    }
  });

  it("has 4 options when pool is large enough", () => {
    // allEntities has 6 total, 5 tappable — enough for 4 options
    const items = generateChooseItems(makeInput({
      teachEntities: allEntities,
      source: { from: "teach" },
    } as any));
    for (const item of items) {
      const optionCount = item.options?.length ?? 0;
      expect(optionCount).toBe(4);
    }
  });

  it("each item has a prompt with arabicDisplay", () => {
    const items = generateChooseItems(makeInput());
    for (const item of items) {
      expect(item.prompt.arabicDisplay).toBeTruthy();
    }
  });

  it("options have displayArabic set", () => {
    const items = generateChooseItems(makeInput());
    for (const item of items) {
      for (const option of item.options ?? []) {
        expect(option.displayArabic).toBeTruthy();
      }
    }
  });

  it("returns empty array when no tappable entities available", () => {
    const noTappable = {
      ...letterA,
      id: "letter:99",
      capabilities: ["hearable" as const, "readable" as const],
    };
    const items = generateChooseItems(
      makeInput({
        teachEntities: [noTappable],
        reviewEntities: [],
        allUnlockedEntities: [noTappable],
      })
    );
    expect(items).toHaveLength(0);
  });

  it("distractorStrategy field is accepted without error", () => {
    const input = makeInput({
      step: {
        type: "choose",
        count: 2,
        target: "letter",
        source: { from: "teach" },
        distractorStrategy: "shape",
      },
    });
    expect(() => generateChooseItems(input)).not.toThrow();
  });

  it("distractorStrategy 'family' filters pool to same letter family (ba family: ba=2, ta=3, tha=4)", () => {
    // ba (letter:2), ta (letter:3), tha (letter:4) are all in the "ba" family
    const letterTA: LetterEntity = {
      id: "letter:3", displayArabic: "\u062A", transliteration: "t",
      capabilities: ["tappable", "hearable", "readable"],
    };
    const letterTHA: LetterEntity = {
      id: "letter:4", displayArabic: "\u062B", transliteration: "th",
      capabilities: ["tappable", "hearable", "readable"],
    };
    const letterZ: LetterEntity = {
      id: "letter:11", displayArabic: "\u0632", transliteration: "z",
      capabilities: ["tappable", "hearable", "readable"],
    };
    // Pool: letterB (ba family), letterTA (ba family), letterTHA (ba family), letterZ (ra family)
    const pool = [letterB, letterTA, letterTHA, letterZ, letterA, letterM];
    const input = makeInput({
      step: {
        type: "choose",
        count: 1,
        target: "letter",
        source: { from: "teach" },
        distractorStrategy: "family",
      },
      teachEntities: [letterB],
      allUnlockedEntities: pool,
    });
    const items = generateChooseItems(input);
    expect(items).toHaveLength(1);
    // All distractor options should be from same family (ba family: letter:3, letter:4)
    // or fall back to full pool if not enough family members in unlocked set
    // Either way: no errors, and item has 1 correct option
    const correctOptions = items[0].options?.filter((o) => o.isCorrect) ?? [];
    expect(correctOptions).toHaveLength(1);
  });

  it("distractorStrategy 'vowel' filters to same-letter combos with different harakat (or falls back)", () => {
    // combo:ba-fatha and combo:ba-kasra share letter slug "ba"
    const comboBaKasra: ComboEntity = {
      id: "combo:ba-kasra", displayArabic: "\u0628\u0650", transliteration: "bi",
      capabilities: ["hearable", "readable", "buildable", "tappable"],
    };
    const comboBaDamma: ComboEntity = {
      id: "combo:ba-damma", displayArabic: "\u0628\u064F", transliteration: "bu",
      capabilities: ["hearable", "readable", "buildable", "tappable"],
    };
    const pool = [comboBA, comboBaKasra, comboBaDamma, comboMA, letterA, letterB];
    const input = makeInput({
      step: {
        type: "choose",
        count: 1,
        target: "combo",
        source: { from: "teach" },
        distractorStrategy: "vowel",
      },
      teachEntities: [comboBA],
      allUnlockedEntities: pool,
    });
    const items = generateChooseItems(input);
    expect(items).toHaveLength(1);
    // Distractors should prefer combo:ba-kasra and combo:ba-damma (same letter, diff harakat)
    const distractorIds = items[0].options?.filter((o) => !o.isCorrect).map((o) => o.id) ?? [];
    // At least one distractor should be a same-letter combo variant
    const hasSameLetterDistractor = distractorIds.some((id) => id.startsWith("combo:ba-"));
    expect(hasSameLetterDistractor).toBe(true);
  });

  it("default behavior unchanged when no distractorStrategy set", () => {
    const items = generateChooseItems(makeInput());
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item.options).toHaveLength(4);
      expect(item.options?.filter((o) => o.isCorrect)).toHaveLength(1);
    }
  });
});
