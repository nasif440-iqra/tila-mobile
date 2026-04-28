import { describe, it, expect } from "vitest";
import { lessonTwo } from "../../curriculum/lessons/lesson-02";
import { lessonRegistry } from "../../curriculum/lessons";

const KNOWN_ENTITY_KEYS = new Set([
  "letter:alif",
  "letter:ba",
  "mark:fatha",
  "combo:ba+fatha",
]);

describe("lesson-02 shape (Alif + Ba + Fatha)", () => {
  it("has canonical ID 'lesson-02'", () => {
    expect(lessonTwo.id).toBe("lesson-02");
  });

  it("is a standard scored lesson (not onboarding)", () => {
    expect(lessonTwo.kind).toBe("standard");
  });

  it("matches frontmatter", () => {
    expect(lessonTwo.phase).toBe(1);
    expect(lessonTwo.module).toBe("1.1");
    expect(lessonTwo.title).toBe("Alif + Ba + Fatha = بَ");
    expect(lessonTwo.durationTargetSeconds).toBe(240);
    expect(lessonTwo.passCriteria.threshold).toBe(0.85);
    expect(lessonTwo.passCriteria.requireCorrectLastTwoDecoding).toBe(true);
    expect(lessonTwo.introducedEntities).toEqual([
      "letter:alif",
      "letter:ba",
      "mark:fatha",
      "combo:ba+fatha",
    ]);
    expect(lessonTwo.reviewEntities).toEqual([]);
    expect(lessonTwo.completionGlyphs).toEqual([
      "letter:alif",
      "letter:ba",
      "combo:ba+fatha",
    ]);
  });

  it("has exactly 16 screens (3 warm-recall + 4 teach + 6 practice + 3 mastery-check)", () => {
    expect(lessonTwo.screens).toHaveLength(16);
  });

  it("part distribution matches the curriculum anatomy", () => {
    const parts = lessonTwo.screens.map((s) =>
      s.kind === "exercise" ? s.part : "teach"
    );
    expect(parts.filter((p) => p === "warm-recall")).toHaveLength(3);
    expect(parts.filter((p) => p === "teach")).toHaveLength(4);
    expect(parts.filter((p) => p === "practice")).toHaveLength(6);
    expect(parts.filter((p) => p === "mastery-check")).toHaveLength(3);
  });

  it("the four teach screens come after warm-recall and before practice", () => {
    // warm-recall (0..2) | teach (3..6) | practice (7..12) | mastery-check (13..15)
    expect(lessonTwo.screens[0].kind).toBe("exercise");
    expect(lessonTwo.screens[3].kind).toBe("teach");
    expect(lessonTwo.screens[6].kind).toBe("teach");
    expect(lessonTwo.screens[7].kind).toBe("exercise");
    expect(lessonTwo.screens[12].kind).toBe("exercise");
    expect(lessonTwo.screens[13].kind).toBe("exercise");
  });

  it("last two scored screens are Read exercises with countsAsDecoding=true", () => {
    const scoredScreens = lessonTwo.screens.filter(
      (s) => s.kind === "exercise" && s.scored !== false
    );
    const lastTwo = scoredScreens.slice(-2);
    expect(lastTwo).toHaveLength(2);
    for (const s of lastTwo) {
      if (s.kind !== "exercise") throw new Error("last two must be exercise");
      expect(s.exercise.type).toBe("read");
      expect(s.countsAsDecoding).toBe(true);
    }
  });

  it("mastery-check items use one-shot retry mode (no try-again)", () => {
    const masteryItems = lessonTwo.screens.filter(
      (s) => s.kind === "exercise" && s.part === "mastery-check"
    );
    expect(masteryItems).toHaveLength(3);
    for (const s of masteryItems) {
      if (s.kind !== "exercise") continue;
      expect(s.retryMode).toBe("one-shot");
    }
  });

  it("warm-recall and practice items use until-correct retry mode", () => {
    const tryAgainItems = lessonTwo.screens.filter(
      (s) =>
        s.kind === "exercise" &&
        (s.part === "warm-recall" || s.part === "practice")
    );
    expect(tryAgainItems).toHaveLength(9);
    for (const s of tryAgainItems) {
      if (s.kind !== "exercise") continue;
      expect(s.retryMode).toBe("until-correct");
    }
  });

  it("every exercise option's entityKey is a canonical entity", () => {
    const unknown: string[] = [];
    for (const screen of lessonTwo.screens) {
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
    for (const screen of lessonTwo.screens) {
      if (screen.kind === "teach") {
        for (const block of screen.blocks) {
          if (block.type === "audio") {
            expect(block.path.length).toBeGreaterThan(0);
          }
        }
        continue;
      }
      const ex = screen.exercise;
      if (ex.type === "hear") {
        expect(ex.audioPath.length).toBeGreaterThan(0);
      }
      if (ex.type === "read") {
        expect(ex.audioModel.length).toBeGreaterThan(0);
      }
      if (ex.type === "choose" && ex.audioPrompt) {
        expect(ex.audioPrompt.length).toBeGreaterThan(0);
      }
    }
  });

  it("auto-play audio blocks appear only on Teach screens (Constraint 3)", () => {
    for (const screen of lessonTwo.screens) {
      if (screen.kind === "exercise") continue;
      // Exercise screens cannot have audio blocks at all (they have audioPath/audioModel/audioPrompt fields directly).
      // For Teach screens, autoPlay is allowed; we just verify any autoPlay block has a path.
      for (const block of screen.blocks) {
        if (block.type === "audio" && block.autoPlay) {
          expect(block.path.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("read exercises have audioModel set and no autoPlay (Constraint 2)", () => {
    const readScreens = lessonTwo.screens.filter(
      (s) => s.kind === "exercise" && s.exercise.type === "read"
    );
    expect(readScreens).toHaveLength(2);
    for (const s of readScreens) {
      if (s.kind !== "exercise" || s.exercise.type !== "read") continue;
      expect(s.exercise.audioModel.length).toBeGreaterThan(0);
      // Read exercises do not have an autoPlay field on audioModel — Constraint 2 enforces no auto-play
      // by the renderer, not by the data shape. This test verifies presence of audioModel only.
    }
  });

  it("only the first teach screen (Meet Alif) has autoPlay", () => {
    let autoPlayCount = 0;
    for (const screen of lessonTwo.screens) {
      if (screen.kind !== "teach") continue;
      for (const block of screen.blocks) {
        if (block.type === "audio" && block.autoPlay === true) autoPlayCount++;
      }
    }
    expect(autoPlayCount).toBe(1);
  });

  it("uses only canonical TeachingBlock types — no invented primitives", () => {
    const ALLOWED = new Set([
      "text",
      "heading",
      "reading-direction",
      "glyph-display",
      "shape-variants",
      "audio",
      "name-sound-pair",
      "mark-preview",
    ]);
    for (const screen of lessonTwo.screens) {
      if (screen.kind !== "teach") continue;
      for (const block of screen.blocks) {
        expect(ALLOWED.has(block.type)).toBe(true);
      }
    }
  });

  it("uses only renderers that exist today (tap, hear, choose, read)", () => {
    const ALLOWED = new Set(["tap", "hear", "choose", "read"]);
    for (const screen of lessonTwo.screens) {
      if (screen.kind !== "exercise") continue;
      expect(ALLOWED.has(screen.exercise.type)).toBe(true);
    }
  });

  it("screen IDs are unique within the lesson", () => {
    const ids = lessonTwo.screens.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("is registered under its own ID in the registry", () => {
    expect(lessonRegistry[lessonTwo.id]).toBe(lessonTwo);
  });
});
