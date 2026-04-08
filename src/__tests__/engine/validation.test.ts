import { describe, it, expect } from "vitest";
import { validateLesson, validateAllLessons } from "@/src/engine/v2/validation";
import { LESSONS_V2 } from "@/src/data/curriculum-v2";
import type { LessonV2 } from "@/src/types/curriculum-v2";

describe("validation", () => {
  describe("validateLesson", () => {
    it("passes for a valid lesson", async () => {
      const result = await validateLesson(LESSONS_V2[0]);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("fails when teachEntityIds reference unknown entities", async () => {
      const bad: LessonV2 = {
        ...LESSONS_V2[0],
        teachEntityIds: ["letter:999", "nonexistent:foo"],
      };
      const result = await validateLesson(bad);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("letter:999"))).toBe(true);
      expect(result.errors.some((e) => e.includes("nonexistent:foo"))).toBe(true);
    });

    it("fails when check step has no assessmentProfile", async () => {
      const bad: LessonV2 = {
        ...LESSONS_V2[0],
        exercisePlan: [
          // @ts-expect-error — intentionally missing assessmentProfile
          { type: "check", count: 5, target: "mixed", source: { from: "all" } },
        ],
      };
      const result = await validateLesson(bad);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("assessmentProfile"))).toBe(true);
    });

    it("fails when check step references unknown assessmentProfile", async () => {
      const bad: LessonV2 = {
        ...LESSONS_V2[0],
        exercisePlan: [
          { type: "check", count: 5, target: "mixed", source: { from: "all" }, assessmentProfile: "nonexistent" },
        ],
      };
      const result = await validateLesson(bad);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("nonexistent"))).toBe(true);
    });

    it("fails when decodePassRequired exceeds decode item count", async () => {
      const bad: LessonV2 = {
        ...LESSONS_V2[0],
        exercisePlan: [
          { type: "tap", count: 5, target: "letter", source: { from: "teach" } },
          { type: "read", count: 1, target: "combo", source: { from: "teach" }, connected: false },
        ],
        masteryPolicy: { passThreshold: 0.85, decodePassRequired: 3 },
      };
      const result = await validateLesson(bad);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("decodePassRequired"))).toBe(true);
    });

    it("fails when decodePassRequired lesson does not end with decode steps", async () => {
      const bad: LessonV2 = {
        ...LESSONS_V2[0],
        exercisePlan: [
          { type: "read", count: 3, target: "combo", source: { from: "teach" }, connected: false },
          { type: "tap", count: 2, target: "letter", source: { from: "teach" } },
        ],
        masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
      };
      const result = await validateLesson(bad);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("exit-block"))).toBe(true);
    });

    it("fails when explicit source has unresolvable entityIds", async () => {
      const bad: LessonV2 = {
        ...LESSONS_V2[0],
        exercisePlan: [
          { type: "tap", count: 2, target: "letter", source: { from: "explicit", entityIds: ["letter:999"] } },
        ],
      };
      const result = await validateLesson(bad);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("letter:999"))).toBe(true);
    });

    it("fails when step target has no compatible entities (rule 2)", async () => {
      // rule:rtl-reading has capabilities: ["readable"] — NOT "tappable"
      // so a tap step targeting "letter" from "teach" should fail
      const bad: LessonV2 = {
        ...LESSONS_V2[0],
        teachEntityIds: ["rule:rtl-reading"],
        exercisePlan: [
          { type: "tap", count: 2, target: "letter", source: { from: "teach" } },
        ],
        masteryPolicy: { passThreshold: 0.85 },
      };
      const result = await validateLesson(bad);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("target") && e.includes("compatible"))).toBe(true);
    });

    it("fails when step renderOverride is less complex than lesson renderProfile (rule 7)", async () => {
      const bad: LessonV2 = {
        ...LESSONS_V2[0],
        renderProfile: "quran-script",
        exercisePlan: [
          { type: "read", count: 3, target: "combo", source: { from: "teach" }, connected: false, renderOverride: "connected" },
        ],
        masteryPolicy: { passThreshold: 0.85 },
      };
      const result = await validateLesson(bad);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("render"))).toBe(true);
    });

    it("fails when read step in Phase 3+ has transliteration tag (rule 9)", async () => {
      const bad: LessonV2 = {
        ...LESSONS_V2[0],
        phase: 3,
        exercisePlan: [
          { type: "read", count: 3, target: "combo", source: { from: "teach" }, connected: false },
        ],
        masteryPolicy: { passThreshold: 0.85 },
        tags: ["answerMode:transliteration"],
      };
      const result = await validateLesson(bad);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("transliteration") || e.includes("Phase"))).toBe(true);
    });
  });

  describe("validateAllLessons", () => {
    it("all vertical-slice lessons pass validation", async () => {
      const results = await validateAllLessons(LESSONS_V2);
      results.forEach((result) => {
        expect(result.errors).toEqual([]);
        expect(result.valid).toBe(true);
      });
    });
  });
});
