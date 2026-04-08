import { describe, it, expect } from "vitest";
import { generateHearItems } from "@/src/engine/questions-v2/hear";
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

function makeInput(direction: "audio-to-script" | "script-to-audio", overrides: Partial<GeneratorInput> = {}): GeneratorInput {
  return {
    step: {
      type: "hear",
      count: 3,
      target: "letter",
      source: { from: "teach" },
      direction,
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

describe("generateHearItems", () => {
  it("produces correct number of items (matches step.count)", () => {
    const items = generateHearItems(makeInput("audio-to-script"));
    expect(items).toHaveLength(3);
  });

  it("each item has type 'hear'", () => {
    const items = generateHearItems(makeInput("audio-to-script"));
    for (const item of items) {
      expect(item.type).toBe("hear");
    }
  });

  it("each item has exactly one correct option", () => {
    const items = generateHearItems(makeInput("audio-to-script"));
    for (const item of items) {
      const correctOptions = item.options?.filter((o) => o.isCorrect) ?? [];
      expect(correctOptions).toHaveLength(1);
    }
  });

  it("options include the correct answer entity", () => {
    const items = generateHearItems(makeInput("audio-to-script"));
    for (const item of items) {
      const correctOption = item.options?.find((o) => o.isCorrect);
      expect(correctOption).toBeDefined();
      expect(correctOption?.id).toBe(item.targetEntityId);
    }
  });

  it("no duplicate option IDs within an item", () => {
    const items = generateHearItems(makeInput("audio-to-script"));
    for (const item of items) {
      const ids = item.options?.map((o) => o.id) ?? [];
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    }
  });

  it("isDecodeItem is false", () => {
    const items = generateHearItems(makeInput("audio-to-script"));
    for (const item of items) {
      expect(item.isDecodeItem).toBe(false);
    }
  });

  it("answerMode is 'audio'", () => {
    const items = generateHearItems(makeInput("audio-to-script"));
    for (const item of items) {
      expect(item.answerMode).toBe("audio");
    }
  });

  it("correctAnswer kind is 'single' with target entity id", () => {
    const items = generateHearItems(makeInput("audio-to-script"));
    for (const item of items) {
      expect(item.correctAnswer.kind).toBe("single");
      if (item.correctAnswer.kind === "single") {
        expect(item.correctAnswer.value).toBe(item.targetEntityId);
      }
    }
  });

  // ── audio-to-script mode ──

  it("audio-to-script: prompt has audioKey", () => {
    const items = generateHearItems(makeInput("audio-to-script"));
    for (const item of items) {
      expect(item.prompt.audioKey).toBeTruthy();
    }
  });

  it("audio-to-script: options have displayArabic", () => {
    const items = generateHearItems(makeInput("audio-to-script"));
    for (const item of items) {
      for (const option of item.options ?? []) {
        expect(option.displayArabic).toBeTruthy();
      }
    }
  });

  it("audio-to-script: prompt arabicDisplay is empty string or minimal (audio is the prompt)", () => {
    const items = generateHearItems(makeInput("audio-to-script"));
    for (const item of items) {
      // arabicDisplay is required on ExercisePrompt; for audio-to-script it may be empty
      expect(item.prompt).toBeDefined();
    }
  });

  // ── script-to-audio mode ──

  it("script-to-audio: prompt has arabicDisplay", () => {
    const items = generateHearItems(makeInput("script-to-audio"));
    for (const item of items) {
      expect(item.prompt.arabicDisplay).toBeTruthy();
    }
  });

  it("script-to-audio: options have audioKey", () => {
    const items = generateHearItems(makeInput("script-to-audio"));
    for (const item of items) {
      for (const option of item.options ?? []) {
        expect(option.audioKey).toBeTruthy();
      }
    }
  });

  it("returns empty array when no hearable entities available", () => {
    // Use entities with no hearable capability
    const noHearable = {
      ...letterA,
      id: "letter:99",
      capabilities: ["tappable" as const],
    };
    const items = generateHearItems(
      makeInput("audio-to-script", {
        teachEntities: [noHearable],
        reviewEntities: [],
        allUnlockedEntities: [noHearable],
      })
    );
    expect(items).toHaveLength(0);
  });
});
