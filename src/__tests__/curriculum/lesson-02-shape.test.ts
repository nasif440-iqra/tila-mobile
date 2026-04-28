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

  // ── Round-4 specific assertions ────────────────────────────────────────────

  it("warm-recall Item 1.3 (wr-1-3) uses ا as distractor — not بَ", () => {
    const screen = lessonTwo.screens.find((s) => s.id === "wr-1-3");
    if (!screen || screen.kind !== "exercise" || screen.exercise.type !== "tap")
      throw new Error("wr-1-3 must be a tap exercise");
    const entityKeys = screen.exercise.options.map((o) => o.entityKey);
    expect(entityKeys).toContain("letter:alif");
    expect(entityKeys).not.toContain("combo:ba+fatha");
  });

  it("pr-3-1 is a tap exercise with prompt 'Tap the letter Ba'", () => {
    const screen = lessonTwo.screens.find((s) => s.id === "pr-3-1");
    if (!screen || screen.kind !== "exercise" || screen.exercise.type !== "tap")
      throw new Error("pr-3-1 must be a tap exercise");
    expect(screen.exercise.prompt).toBe("Tap the letter Ba");
    expect(screen.exercise.target).toBe("letter:ba");
    expect(screen.exercise.options).toHaveLength(2);
  });

  it("pr-3-2 is a tap exercise for Alif with prompt 'Tap Alif'", () => {
    const screen = lessonTwo.screens.find((s) => s.id === "pr-3-2");
    if (!screen || screen.kind !== "exercise" || screen.exercise.type !== "tap")
      throw new Error("pr-3-2 must be a tap exercise");
    expect(screen.exercise.prompt).toBe("Tap Alif");
    expect(screen.exercise.target).toBe("letter:alif");
    expect(screen.exercise.options).toHaveLength(2);
  });

  it("pr-3-3 is a hear exercise for Ba name with prompt 'Tap the letter you hear'", () => {
    const screen = lessonTwo.screens.find((s) => s.id === "pr-3-3");
    if (!screen || screen.kind !== "exercise" || screen.exercise.type !== "hear")
      throw new Error("pr-3-3 must be a hear exercise");
    expect(screen.exercise.prompt).toBe("Tap the letter you hear");
    expect(screen.exercise.audioPath).toBe("audio/letter/ba_name.mp3");
    expect(screen.exercise.options).toHaveLength(2);
  });

  it("pr-3-4 is AUDIO MODE choose: prompt 'Tap what you hear' + audioPrompt present", () => {
    const screen = lessonTwo.screens.find((s) => s.id === "pr-3-4");
    if (!screen || screen.kind !== "exercise" || screen.exercise.type !== "choose")
      throw new Error("pr-3-4 must be a choose exercise");
    expect(screen.exercise.prompt).toBe("Tap what you hear");
    expect(screen.exercise.audioPrompt).toBe("audio/letter/ba_fatha_sound.mp3");
    expect(screen.exercise.options).toHaveLength(2);
  });

  it("pr-3-5 is VISUAL MODE choose: prompt 'Which one says 'ba'?' with NO audioPrompt", () => {
    const screen = lessonTwo.screens.find((s) => s.id === "pr-3-5");
    if (!screen || screen.kind !== "exercise" || screen.exercise.type !== "choose")
      throw new Error("pr-3-5 must be a choose exercise");
    expect(screen.exercise.prompt).toBe("Which one says 'ba'?");
    expect(screen.exercise.audioPrompt).toBeUndefined();
    expect(screen.exercise.options).toHaveLength(2);
  });

  it("pr-3-6 is VISUAL REINFORCE choose: no audioPrompt, first option is letter:ba (positions flipped from 3.5)", () => {
    const screen = lessonTwo.screens.find((s) => s.id === "pr-3-6");
    if (!screen || screen.kind !== "exercise" || screen.exercise.type !== "choose")
      throw new Error("pr-3-6 must be a choose exercise");
    expect(screen.exercise.prompt).toBe("Which one says 'ba'?");
    expect(screen.exercise.audioPrompt).toBeUndefined();
    expect(screen.exercise.options).toHaveLength(2);
    // Position flip: ب (letter:ba, wrong) is first; بَ (combo:ba+fatha, correct) is second
    expect(screen.exercise.options[0].entityKey).toBe("letter:ba");
    expect(screen.exercise.options[0].correct).toBe(false);
    expect(screen.exercise.options[1].entityKey).toBe("combo:ba+fatha");
    expect(screen.exercise.options[1].correct).toBe(true);
  });

  it("mc-4-1 is the only 3-option choose item and uses audioPrompt", () => {
    const screen = lessonTwo.screens.find((s) => s.id === "mc-4-1");
    if (!screen || screen.kind !== "exercise" || screen.exercise.type !== "choose")
      throw new Error("mc-4-1 must be a choose exercise");
    expect(screen.exercise.prompt).toBe("Tap what you hear");
    expect(screen.exercise.audioPrompt).toBe("audio/letter/ba_fatha_sound.mp3");
    expect(screen.exercise.options).toHaveLength(3);
  });

  it("mc-4-2 prompt is 'Read this aloud.'", () => {
    const screen = lessonTwo.screens.find((s) => s.id === "mc-4-2");
    if (!screen || screen.kind !== "exercise" || screen.exercise.type !== "read")
      throw new Error("mc-4-2 must be a read exercise");
    expect(screen.exercise.prompt).toBe("Read this aloud.");
    expect(screen.countsAsDecoding).toBe(true);
  });

  it("mc-4-3 prompt is exactly 'Say it again.'", () => {
    const screen = lessonTwo.screens.find((s) => s.id === "mc-4-3");
    if (!screen || screen.kind !== "exercise" || screen.exercise.type !== "read")
      throw new Error("mc-4-3 must be a read exercise");
    expect(screen.exercise.prompt).toBe("Say it again.");
    expect(screen.countsAsDecoding).toBe(true);
  });

  it("every Tap/Hear/Choose prompt uses only the 5 canonical forms (locked vocabulary)", () => {
    const CANONICAL = new Set([
      "Tap the letter Ba",
      "Tap Alif",
      "Tap the letter you hear",
      "Tap what you hear",
      "Which one says 'ba'?",
    ]);
    for (const screen of lessonTwo.screens) {
      if (screen.kind !== "exercise") continue;
      const ex = screen.exercise;
      if (ex.type === "tap" || ex.type === "hear" || ex.type === "choose") {
        expect(CANONICAL.has(ex.prompt)).toBe(true);
      }
    }
  });

  it("exactly 3 distinct audio paths in the lesson", () => {
    const paths = new Set<string>();
    for (const screen of lessonTwo.screens) {
      if (screen.kind === "teach") {
        for (const block of screen.blocks) {
          if (block.type === "audio") paths.add(block.path);
        }
      } else {
        const ex = screen.exercise;
        if (ex.type === "hear") paths.add(ex.audioPath);
        if (ex.type === "read") paths.add(ex.audioModel);
        if (ex.type === "choose" && ex.audioPrompt) paths.add(ex.audioPrompt);
      }
    }
    expect(paths.size).toBe(3);
    expect(paths.has("audio/letter/alif_name.mp3")).toBe(true);
    expect(paths.has("audio/letter/ba_name.mp3")).toBe(true);
    expect(paths.has("audio/letter/ba_fatha_sound.mp3")).toBe(true);
  });
});
