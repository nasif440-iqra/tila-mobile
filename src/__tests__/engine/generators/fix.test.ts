import { describe, it, expect } from "vitest";
import { generateFixItems } from "@/src/engine/questions-v2/fix";
import type { GeneratorInput } from "@/src/types/exercise";
import type { LetterEntity, ComboEntity } from "@/src/types/entity";
import type { LessonV2 } from "@/src/types/curriculum-v2";

// ── Fixtures ──

const letterB: LetterEntity = {
  id: "letter:2",
  displayArabic: "\u0628",
  transliteration: "b",
  capabilities: ["tappable", "hearable", "readable"],
};

const letterM: LetterEntity = {
  id: "letter:24",
  displayArabic: "\u0645",
  transliteration: "m",
  capabilities: ["tappable", "hearable", "readable"],
};

// Combo with fatha — fixable
const comboBA: ComboEntity = {
  id: "combo:ba-fatha",
  displayArabic: "\u0628\u064E",
  transliteration: "ba",
  capabilities: ["hearable", "readable", "buildable", "fixable"],
};

// Combo with fatha — fixable
const comboMA: ComboEntity = {
  id: "combo:ma-fatha",
  displayArabic: "\u0645\u064E",
  transliteration: "ma",
  capabilities: ["hearable", "readable", "buildable", "fixable"],
};

// Not fixable
const letterNonFixable: LetterEntity = {
  id: "letter:99",
  displayArabic: "\u0627",
  transliteration: "aa",
  capabilities: ["tappable", "hearable", "readable"],
};

const baseLesson: LessonV2 = {
  id: 1,
  phase: 1,
  module: "test",
  title: "Test Lesson",
  description: "Test",
  teachEntityIds: ["combo:ba-fatha", "combo:ma-fatha"],
  reviewEntityIds: [],
  exercisePlan: [],
  masteryPolicy: { passThreshold: 0.8 },
};

function makeInput(overrides: Partial<GeneratorInput> = {}): GeneratorInput {
  return {
    step: {
      type: "fix",
      count: 2,
      target: "vowel",
      source: { from: "teach" },
    },
    lesson: baseLesson,
    teachEntities: [comboBA, comboMA],
    reviewEntities: [],
    allUnlockedEntities: [comboBA, comboMA, letterB, letterM],
    masterySnapshot: {
      entityStates: new Map(),
      confusionPairs: new Map(),
    },
    renderProfile: "isolated",
    ...overrides,
  };
}

// ── Tests ──

describe("generateFixItems", () => {
  it("produces correct number of items (matches step.count)", () => {
    const items = generateFixItems(makeInput());
    expect(items).toHaveLength(2);
  });

  it("each item has a fixSegments array", () => {
    const items = generateFixItems(makeInput());
    for (const item of items) {
      expect(Array.isArray(item.fixSegments)).toBe(true);
      expect((item.fixSegments?.length ?? 0)).toBeGreaterThan(0);
    }
  });

  it("exactly one segment is marked as error location per item", () => {
    const items = generateFixItems(makeInput());
    for (const item of items) {
      const errorSegments = item.fixSegments?.filter((s) => s.isErrorLocation) ?? [];
      expect(errorSegments).toHaveLength(1);
    }
  });

  it("correction options include the correct replacement", () => {
    const items = generateFixItems(makeInput());
    for (const item of items) {
      const correctOption = item.options?.find((o) => o.isCorrect);
      expect(correctOption).toBeDefined();
    }
  });

  it("correctAnswer has kind 'fix' with location and replacement", () => {
    const items = generateFixItems(makeInput());
    for (const item of items) {
      expect(item.correctAnswer.kind).toBe("fix");
      if (item.correctAnswer.kind === "fix") {
        expect(typeof item.correctAnswer.location).toBe("string");
        expect(item.correctAnswer.location.length).toBeGreaterThan(0);
        expect(typeof item.correctAnswer.replacement).toBe("string");
        expect(item.correctAnswer.replacement.length).toBeGreaterThan(0);
      }
    }
  });

  it("type is 'fix'", () => {
    const items = generateFixItems(makeInput());
    for (const item of items) {
      expect(item.type).toBe("fix");
    }
  });

  it("answerMode is 'fix-locate'", () => {
    const items = generateFixItems(makeInput());
    for (const item of items) {
      expect(item.answerMode).toBe("fix-locate");
    }
  });

  it("isDecodeItem is false", () => {
    const items = generateFixItems(makeInput());
    for (const item of items) {
      expect(item.isDecodeItem).toBe(false);
    }
  });

  it("only generates items for entities with fixable capability", () => {
    const items = generateFixItems(
      makeInput({
        teachEntities: [letterNonFixable],
        reviewEntities: [],
        allUnlockedEntities: [letterNonFixable],
      })
    );
    expect(items).toHaveLength(0);
  });

  it("vowel error swaps fatha to a different harakat (kasra or damma)", () => {
    const FATHA = "\u064E";
    const KASRA = "\u0650";
    const DAMMA = "\u064F";

    const items = generateFixItems(makeInput());
    for (const item of items) {
      // prompt.arabicDisplay should contain a corrupted mark (not fatha)
      const display = item.prompt.arabicDisplay;

      // The error segment's displayText should NOT be fatha
      const errorSeg = item.fixSegments?.find((s) => s.isErrorLocation);
      expect(errorSeg).toBeDefined();

      const errorMark = errorSeg?.displayText;
      // The error mark should be one of the alternative harakat
      expect([KASRA, DAMMA]).toContain(errorMark);

      // The correct replacement (in correctAnswer) should be the original fatha
      if (item.correctAnswer.kind === "fix") {
        expect(item.correctAnswer.replacement).toBe(FATHA);
      }

      void display; // used for context
    }
  });

  it("correctAnswer.location matches the errorSegment.segmentId", () => {
    const items = generateFixItems(makeInput());
    for (const item of items) {
      const errorSeg = item.fixSegments?.find((s) => s.isErrorLocation);
      if (item.correctAnswer.kind === "fix" && errorSeg) {
        expect(item.correctAnswer.location).toBe(errorSeg.segmentId);
      }
    }
  });

  it("prompt has text and arabicDisplay set", () => {
    const items = generateFixItems(makeInput());
    for (const item of items) {
      expect(item.prompt.text).toBeTruthy();
      expect(item.prompt.arabicDisplay).toBeTruthy();
    }
  });

  it("options have between 3 and 4 entries", () => {
    const items = generateFixItems(makeInput());
    for (const item of items) {
      const count = item.options?.length ?? 0;
      expect(count).toBeGreaterThanOrEqual(3);
      expect(count).toBeLessThanOrEqual(4);
    }
  });

  it("error segment has boundingGroup of 'mark' for vowel errors", () => {
    const items = generateFixItems(makeInput());
    for (const item of items) {
      const errorSeg = item.fixSegments?.find((s) => s.isErrorLocation);
      expect(errorSeg?.boundingGroup).toBe("mark");
    }
  });
});
