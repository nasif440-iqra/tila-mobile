import { describe, it, expect } from "vitest";
import { generateReadItems } from "@/src/engine/questions-v2/read";
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
const chunkBM: ChunkEntity = {
  id: "chunk:ba-ma", displayArabic: "\u0628\u064E\u0645\u064E", transliteration: "bama",
  capabilities: ["hearable", "readable", "buildable"],
  teachingBreakdownIds: ["combo:ba-fatha", "combo:ma-fatha"],
  breakdownType: "teaching", syllableCount: 2, audioKey: "chunk_ba-ma",
};

const allEntities = [letterA, letterB, letterM, letterN, comboBA, comboMA, chunkBM];

function makeLesson(phase: number, lessonId?: number): LessonV2 {
  return {
    id: lessonId ?? phase * 10,
    phase,
    module: "test",
    title: `Phase ${phase} Lesson`,
    description: "Test",
    teachEntityIds: ["letter:1", "letter:2"],
    reviewEntityIds: ["letter:24", "letter:25"],
    exercisePlan: [],
    masteryPolicy: { passThreshold: 0.8 },
  };
}

// Extra combo entities so pickDistractors (which filters to same prefix as target)
// can find 3 distractors when target is a combo entity.
const comboLA: ComboEntity = {
  id: "combo:la-fatha", displayArabic: "\u0644\u064E", transliteration: "la",
  capabilities: ["hearable", "readable", "buildable", "tappable"],
};
const comboNA: ComboEntity = {
  id: "combo:na-fatha", displayArabic: "\u0646\u064E", transliteration: "na",
  capabilities: ["hearable", "readable", "buildable", "tappable"],
};

// allEntities expanded with extra combos for distractor pool coverage
const allEntitiesExpanded = [...allEntities, comboLA, comboNA];

function makeInput(phase: number, overrides: Partial<GeneratorInput> = {}, lessonId?: number): GeneratorInput {
  return {
    step: {
      type: "read",
      count: 3,
      target: "combo",
      source: { from: "teach" },
    },
    lesson: makeLesson(phase, lessonId),
    // teachEntities must be combo entities when step.target is "combo" —
    // filterToStepTarget filters by prefix so letter entities are excluded.
    teachEntities: [comboBA, comboMA, comboLA],
    reviewEntities: [letterA, letterB, letterM, letterN],
    allUnlockedEntities: allEntitiesExpanded,
    masterySnapshot: {
      entityStates: new Map(),
      confusionPairs: new Map(),
    },
    renderProfile: "isolated",
    ...overrides,
  };
}

// ── Tests ──

describe("generateReadItems", () => {
  it("all items have isDecodeItem: true", () => {
    const items = generateReadItems(makeInput(1));
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.isDecodeItem).toBe(true);
    }
  });

  it("all items have type 'read'", () => {
    const items = generateReadItems(makeInput(1));
    for (const item of items) {
      expect(item.type).toBe("read");
    }
  });

  it("Phase 1: items have answerMode 'transliteration' and options with displayText", () => {
    const items = generateReadItems(makeInput(1));
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.answerMode).toBe("transliteration");
      for (const option of item.options ?? []) {
        expect(option.displayText).toBeDefined();
        expect(typeof option.displayText).toBe("string");
      }
    }
  });

  it("Phase 2: items have answerMode 'audio'", () => {
    const items = generateReadItems(makeInput(2));
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.answerMode).toBe("audio");
    }
  });

  it("Phase 3: items have answerMode 'audio' (guard enforced)", () => {
    const items = generateReadItems(makeInput(3));
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.answerMode).toBe("audio");
    }
  });

  it("Phase 5: items have answerMode 'audio'", () => {
    const items = generateReadItems(makeInput(5));
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.answerMode).toBe("audio");
    }
  });

  it("CRITICAL: Phase 3+ NEVER produces transliteration", () => {
    for (const phase of [3, 4, 5, 6]) {
      const items = generateReadItems(makeInput(phase));
      for (const item of items) {
        expect(item.answerMode).not.toBe("transliteration");
      }
    }
  });

  it("each item has exactly 4 options", () => {
    const items = generateReadItems(makeInput(1));
    for (const item of items) {
      expect(item.options).toHaveLength(4);
    }
  });

  it("correctAnswer kind is 'single'", () => {
    const items = generateReadItems(makeInput(1));
    for (const item of items) {
      expect(item.correctAnswer.kind).toBe("single");
    }
  });

  it("each item has exactly one correct option", () => {
    const items = generateReadItems(makeInput(1));
    for (const item of items) {
      const correctOptions = item.options?.filter((o) => o.isCorrect) ?? [];
      expect(correctOptions).toHaveLength(1);
    }
  });

  it("correct option matches correctAnswer value", () => {
    const items = generateReadItems(makeInput(1));
    for (const item of items) {
      const correctOption = item.options?.find((o) => o.isCorrect);
      expect(correctOption).toBeDefined();
      if (item.correctAnswer.kind === "single") {
        expect(correctOption?.id).toBe(item.correctAnswer.value);
      }
    }
  });

  it("Phase 2+ audio mode: options have audioKey", () => {
    const items = generateReadItems(makeInput(2));
    for (const item of items) {
      for (const option of item.options ?? []) {
        expect(option.audioKey).toBeDefined();
        expect(typeof option.audioKey).toBe("string");
      }
    }
  });

  it("prompt has arabicDisplay and text", () => {
    const items = generateReadItems(makeInput(1));
    for (const item of items) {
      expect(item.prompt.arabicDisplay).toBeTruthy();
      expect(item.prompt.text).toBeTruthy();
      expect(typeof item.prompt.text).toBe("string");
    }
  });

  it("returns empty array when no readable entities", () => {
    const noReadable: LetterEntity = {
      id: "letter:99", displayArabic: "\u0627", transliteration: "aa",
      capabilities: ["tappable"],
    };
    const items = generateReadItems(makeInput(1, {
      teachEntities: [noReadable],
      reviewEntities: [],
      allUnlockedEntities: [noReadable],
    }));
    expect(items).toHaveLength(0);
  });

  it("step.count determines number of items when enough entities exist", () => {
    const items = generateReadItems(makeInput(1, {
      step: {
        type: "read",
        count: 2,
        target: "combo",
        source: { from: "teach" },
      },
    }));
    expect(items).toHaveLength(2);
  });

  it("Phase 2 early (lesson 9): answerMode is 'audio' — transliteration phased out aggressively", () => {
    const items = generateReadItems(makeInput(2, {}, 9));
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.answerMode).toBe("audio");
      expect(item.answerMode).not.toBe("transliteration");
    }
  });

  it("Phase 2 early (lesson 14): answerMode is 'audio'", () => {
    const items = generateReadItems(makeInput(2, {}, 14));
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.answerMode).toBe("audio");
    }
  });

  it("Phase 2 late (lesson 15): answerMode is 'audio'", () => {
    const items = generateReadItems(makeInput(2, {}, 15));
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.answerMode).toBe("audio");
    }
  });

  it("Phase 2 late (lesson 18): answerMode is 'audio'", () => {
    const items = generateReadItems(makeInput(2, {}, 18));
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.answerMode).toBe("audio");
    }
  });

  it("Phase 1 still gets transliteration regardless of lesson ID", () => {
    for (const lessonId of [1, 4, 8]) {
      const items = generateReadItems(makeInput(1, {}, lessonId));
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item.answerMode).toBe("transliteration");
      }
    }
  });

  it("Phase 4 guard: never produces transliteration", () => {
    const items = generateReadItems(makeInput(4, {}, 40));
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.answerMode).not.toBe("transliteration");
    }
  });
});
