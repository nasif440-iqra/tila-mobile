import { describe, it, expect } from "vitest";
import { lessonOne } from "../../curriculum/lessons/lesson-01";
import { lessonRegistry } from "../../curriculum/lessons";

const KNOWN_ENTITY_KEYS = new Set([
  "letter:alif",
  "letter:ba",
]);

describe("lesson-01 shape", () => {
  it("has canonical ID 'lesson-01'", () => {
    expect(lessonOne.id).toBe("lesson-01");
  });

  it("matches authoring markdown frontmatter", () => {
    expect(lessonOne.phase).toBe(1);
    expect(lessonOne.module).toBe("1.1");
    expect(lessonOne.title).toBe("Arabic Starts Here");
    expect(lessonOne.durationTargetSeconds).toBe(180);
    expect(lessonOne.passCriteria.threshold).toBe(0.8);
    expect(lessonOne.passCriteria.requireCorrectLastTwoDecoding).toBe(false);
    expect(lessonOne.introducedEntities).toEqual([]);
    expect(lessonOne.reviewEntities).toEqual([]);
    // Lesson 1 previews Alif + Ba for the completion-view glyph preview
    // even though neither is formally introduced (that's Lesson 2's job).
    expect(lessonOne.completionGlyphs).toEqual(["letter:alif", "letter:ba"]);
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
      if (ex.type === "tap" && ex.audioOnMount !== undefined) {
        expect(ex.audioOnMount.length).toBeGreaterThan(0);
      }
      if (ex.type === "hear") {
        expect(ex.audioPath.length).toBeGreaterThan(0);
      }
      if (ex.type === "read" && ex.audioModel !== undefined) {
        expect(ex.audioModel.length).toBeGreaterThan(0);
      }
    }
  });

  it("screen IDs are unique within the lesson", () => {
    const ids = lessonOne.screens.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contains at least one mastery-check screen", () => {
    const masteryCheckScreens = lessonOne.screens.filter(
      (s) => s.kind === "exercise" && s.part === "mastery-check"
    );
    expect(masteryCheckScreens.length).toBeGreaterThan(0);
  });

  it("is registered under its own ID in the registry", () => {
    expect(lessonRegistry[lessonOne.id]).toBe(lessonOne);
  });
});
