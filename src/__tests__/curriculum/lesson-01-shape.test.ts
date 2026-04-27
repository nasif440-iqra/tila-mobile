import { describe, it, expect } from "vitest";
import { lessonOne } from "../../curriculum/lessons/lesson-01";
import { lessonRegistry } from "../../curriculum/lessons";

const KNOWN_ENTITY_KEYS = new Set([
  "letter:ba",
  "combo:ba+fatha",
]);

const EXPECTED_SCREEN_IDS = [
  "t-rtl-intro",
  "t-meet-ba",
  "p-hear-ba",
  "t-mark",
  "p-hear-ba-fatha",
  "r-read-ba-fatha",
];

describe("lesson-01 shape (proof-shape redesign)", () => {
  it("has canonical ID 'lesson-01'", () => {
    expect(lessonOne.id).toBe("lesson-01");
  });

  it("is marked as an onboarding lesson — SPEC Constraint 1", () => {
    expect(lessonOne.kind).toBe("onboarding");
  });

  it("matches authoring markdown frontmatter", () => {
    expect(lessonOne.phase).toBe(1);
    expect(lessonOne.module).toBe("1.1");
    expect(lessonOne.title).toBe("Arabic Starts Here");
    expect(lessonOne.durationTargetSeconds).toBe(150);
    expect(lessonOne.passCriteria.threshold).toBe(0);
    expect(lessonOne.passCriteria.requireCorrectLastTwoDecoding).toBe(false);
    expect(lessonOne.introducedEntities).toEqual(["letter:ba", "combo:ba+fatha"]);
    expect(lessonOne.reviewEntities).toEqual([]);
    expect(lessonOne.completionGlyphs).toEqual(["combo:ba+fatha"]);
    expect(lessonOne.completionSubtitle).toBe(
      "You just read your first Arabic syllable: بَ"
    );
  });

  it("has exactly the expected six screens in order", () => {
    expect(lessonOne.screens.map((s) => s.id)).toEqual(EXPECTED_SCREEN_IDS);
  });

  it("ends with a Read exercise — the proof moment", () => {
    const last = lessonOne.screens.at(-1);
    expect(last?.kind).toBe("exercise");
    if (last?.kind === "exercise") {
      expect(last.exercise.type).toBe("read");
    }
  });

  it("every exercise option's entityKey is a known entity", () => {
    const unknown: string[] = [];
    for (const screen of lessonOne.screens) {
      if (screen.kind !== "exercise") continue;
      const ex = screen.exercise;
      const options = "options" in ex && ex.options ? ex.options : [];
      for (const opt of options) {
        if (!KNOWN_ENTITY_KEYS.has(opt.entityKey)) unknown.push(opt.entityKey);
      }
    }
    expect(unknown).toEqual([]);
  });

  it("every audio reference is a non-empty string", () => {
    for (const screen of lessonOne.screens) {
      if (screen.kind === "teach") {
        for (const block of screen.blocks) {
          if (block.type === "audio") expect(block.path.length).toBeGreaterThan(0);
        }
        continue;
      }
      const ex = screen.exercise;
      if (ex.type === "hear") {
        expect(ex.audioPath.length).toBeGreaterThan(0);
      }
      if (ex.type === "read") {
        // Required by the type now; check explicitly so the test fails
        // loudly if a future refactor weakens the contract.
        expect(ex.audioModel.length).toBeGreaterThan(0);
      }
    }
  });

  it("screen IDs are unique within the lesson", () => {
    const ids = lessonOne.screens.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("is registered under its own ID in the registry", () => {
    expect(lessonRegistry[lessonOne.id]).toBe(lessonOne);
  });
});
