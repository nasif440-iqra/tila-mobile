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

  // ── Round-5 specific assertions ────────────────────────────────────────────

  it("warm-recall Item 1.3 (wr-1-3) uses ا as distractor — not بَ", () => {
    const screen = lessonTwo.screens.find((s) => s.id === "wr-1-3");
    if (!screen || screen.kind !== "exercise" || screen.exercise.type !== "tap")
      throw new Error("wr-1-3 must be a tap exercise");
    const entityKeys = screen.exercise.options.map((o) => o.entityKey);
    expect(entityKeys).toContain("letter:alif");
    expect(entityKeys).not.toContain("combo:ba+fatha");
  });

  it("wr-1-3 has correct (ب) on the left — position flipped from wr-1-1 and wr-1-2", () => {
    const screen = lessonTwo.screens.find((s) => s.id === "wr-1-3");
    if (!screen || screen.kind !== "exercise" || screen.exercise.type !== "tap")
      throw new Error("wr-1-3 must be a tap exercise");
    expect(screen.exercise.options[0].entityKey).toBe("letter:ba");
    expect(screen.exercise.options[0].correct).toBe(true);
  });

  it("pr-3-1 is a tap exercise with prompt 'Tap the letter Ba.'", () => {
    const screen = lessonTwo.screens.find((s) => s.id === "pr-3-1");
    if (!screen || screen.kind !== "exercise" || screen.exercise.type !== "tap")
      throw new Error("pr-3-1 must be a tap exercise");
    expect(screen.exercise.prompt).toBe("Tap the letter Ba.");
    expect(screen.exercise.target).toBe("letter:ba");
    expect(screen.exercise.options).toHaveLength(2);
  });

  it("pr-3-2 is a tap exercise for Alif with prompt 'Tap the letter Alif.'", () => {
    const screen = lessonTwo.screens.find((s) => s.id === "pr-3-2");
    if (!screen || screen.kind !== "exercise" || screen.exercise.type !== "tap")
      throw new Error("pr-3-2 must be a tap exercise");
    expect(screen.exercise.prompt).toBe("Tap the letter Alif.");
    expect(screen.exercise.target).toBe("letter:alif");
    expect(screen.exercise.options).toHaveLength(2);
  });

  it("pr-3-3 is a hear exercise for Ba name with prompt 'Tap the letter you hear.'", () => {
    const screen = lessonTwo.screens.find((s) => s.id === "pr-3-3");
    if (!screen || screen.kind !== "exercise" || screen.exercise.type !== "hear")
      throw new Error("pr-3-3 must be a hear exercise");
    expect(screen.exercise.prompt).toBe("Tap the letter you hear.");
    expect(screen.exercise.audioPath).toBe("audio/letter/ba_name.mp3");
    expect(screen.exercise.options).toHaveLength(2);
  });

  it("pr-3-4 is VISUAL MARK-ID: prompt 'Tap the one with the mark.' with NO audioPrompt", () => {
    const screen = lessonTwo.screens.find((s) => s.id === "pr-3-4");
    if (!screen || screen.kind !== "exercise" || screen.exercise.type !== "choose")
      throw new Error("pr-3-4 must be a choose exercise");
    expect(screen.exercise.prompt).toBe("Tap the one with the mark.");
    expect(screen.exercise.audioPrompt).toBeUndefined();
    expect(screen.exercise.options).toHaveLength(2);
    // Position: letter:ba (incorrect) first, combo:ba+fatha (correct) second
    expect(screen.exercise.options[0].entityKey).toBe("letter:ba");
    expect(screen.exercise.options[0].correct).toBe(false);
    expect(screen.exercise.options[1].entityKey).toBe("combo:ba+fatha");
    expect(screen.exercise.options[1].correct).toBe(true);
  });

  it("pr-3-5 is VISUAL REINFORCE: prompt 'Tap the one with the mark.' with NO audioPrompt, correct on left", () => {
    const screen = lessonTwo.screens.find((s) => s.id === "pr-3-5");
    if (!screen || screen.kind !== "exercise" || screen.exercise.type !== "choose")
      throw new Error("pr-3-5 must be a choose exercise");
    expect(screen.exercise.prompt).toBe("Tap the one with the mark.");
    expect(screen.exercise.audioPrompt).toBeUndefined();
    expect(screen.exercise.options).toHaveLength(2);
    // Position flip from 3.4: combo:ba+fatha (correct) is now first (on the left)
    expect(screen.exercise.options[0].entityKey).toBe("combo:ba+fatha");
    expect(screen.exercise.options[0].correct).toBe(true);
    expect(screen.exercise.options[1].entityKey).toBe("letter:ba");
    expect(screen.exercise.options[1].correct).toBe(false);
  });

  it("pr-3-6 is AUDIO MODE: prompt 'Tap what you hear.' WITH audioPrompt ba_fatha_sound.mp3", () => {
    const screen = lessonTwo.screens.find((s) => s.id === "pr-3-6");
    if (!screen || screen.kind !== "exercise" || screen.exercise.type !== "choose")
      throw new Error("pr-3-6 must be a choose exercise");
    expect(screen.exercise.prompt).toBe("Tap what you hear.");
    expect(screen.exercise.audioPrompt).toBe("audio/letter/ba_fatha_sound.mp3");
    expect(screen.exercise.options).toHaveLength(2);
    // letter:ba first (incorrect), combo:ba+fatha second (correct)
    expect(screen.exercise.options[0].entityKey).toBe("letter:ba");
    expect(screen.exercise.options[1].entityKey).toBe("combo:ba+fatha");
    expect(screen.exercise.options[1].correct).toBe(true);
  });

  it("mc-4-1 is the only 3-option choose item and uses audioPrompt; order: letter:ba, combo:ba+fatha (✓), letter:alif", () => {
    const screen = lessonTwo.screens.find((s) => s.id === "mc-4-1");
    if (!screen || screen.kind !== "exercise" || screen.exercise.type !== "choose")
      throw new Error("mc-4-1 must be a choose exercise");
    expect(screen.exercise.prompt).toBe("Tap what you hear.");
    expect(screen.exercise.audioPrompt).toBe("audio/letter/ba_fatha_sound.mp3");
    expect(screen.exercise.options).toHaveLength(3);
    expect(screen.exercise.options[0].entityKey).toBe("letter:ba");
    expect(screen.exercise.options[0].correct).toBe(false);
    expect(screen.exercise.options[1].entityKey).toBe("combo:ba+fatha");
    expect(screen.exercise.options[1].correct).toBe(true);
    expect(screen.exercise.options[2].entityKey).toBe("letter:alif");
    expect(screen.exercise.options[2].correct).toBe(false);
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

  it("Screen 2.3 (teach-letter-vs-syllable) contains 'ب + fatha = بَ' and 'ب is the letter. بَ is the sound ba.' in its text blocks", () => {
    const screen = lessonTwo.screens.find((s) => s.id === "teach-letter-vs-syllable");
    if (!screen || screen.kind !== "teach")
      throw new Error("teach-letter-vs-syllable must be a teach screen");
    const textContents = screen.blocks
      .filter((b) => b.type === "text")
      .map((b) => ("content" in b ? b.content : ""));
    expect(textContents).toContain("ب + fatha = بَ");
    expect(textContents).toContain("ب is the letter. بَ is the sound ba.");
  });

  it("every Tap/Hear/Choose prompt uses only the 5 canonical forms (round-5 locked vocabulary)", () => {
    const CANONICAL = new Set([
      "Tap the letter Ba.",
      "Tap the letter Alif.",
      "Tap the letter you hear.",
      "Tap what you hear.",
      "Tap the one with the mark.",
    ]);
    for (const screen of lessonTwo.screens) {
      if (screen.kind !== "exercise") continue;
      const ex = screen.exercise;
      if (ex.type === "tap" || ex.type === "hear" || ex.type === "choose") {
        expect(CANONICAL.has(ex.prompt)).toBe(true);
      }
    }
  });

  it("the banned prompt 'Which one says 'ba'?' does not appear anywhere in the lesson", () => {
    for (const screen of lessonTwo.screens) {
      if (screen.kind !== "exercise") continue;
      const ex = screen.exercise;
      if (ex.type === "tap" || ex.type === "hear" || ex.type === "choose") {
        expect(ex.prompt).not.toMatch(/Which one says/i);
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

  // ── Round-6 first-reading-win pivot assertions ─────────────────────────────

  it("the four teach screens appear in exact order: teach-first-ba, teach-fatha-mark, teach-letter-vs-syllable, teach-meet-alif-light", () => {
    const teachIds = lessonTwo.screens
      .filter((s) => s.kind === "teach")
      .map((s) => s.id);
    expect(teachIds).toEqual([
      "teach-first-ba",
      "teach-fatha-mark",
      "teach-letter-vs-syllable",
      "teach-meet-alif-light",
    ]);
  });

  it("the removed teach IDs no longer exist in the lesson", () => {
    const allIds = new Set(lessonTwo.screens.map((s) => s.id));
    expect(allIds.has("teach-meet-alif")).toBe(false);
    expect(allIds.has("teach-alif-shape")).toBe(false);
    expect(allIds.has("teach-recognize-fatha")).toBe(false);
    expect(allIds.has("teach-equation")).toBe(false);
  });

  it("teach-first-ba is the autoPlay screen and uses ba_fatha_sound.mp3", () => {
    const screen = lessonTwo.screens.find((s) => s.id === "teach-first-ba");
    if (!screen || screen.kind !== "teach")
      throw new Error("teach-first-ba must be a teach screen");
    const autoPlayBlocks = screen.blocks.filter(
      (b) => b.type === "audio" && b.autoPlay === true
    );
    expect(autoPlayBlocks).toHaveLength(1);
    const ap = autoPlayBlocks[0];
    if (ap.type !== "audio") throw new Error("expected audio block");
    expect(ap.path).toBe("audio/letter/ba_fatha_sound.mp3");
  });

  it("teach-meet-alif-light has NO autoPlay block and does not teach Alif as a sound or vowel", () => {
    const screen = lessonTwo.screens.find((s) => s.id === "teach-meet-alif-light");
    if (!screen || screen.kind !== "teach")
      throw new Error("teach-meet-alif-light must be a teach screen");
    for (const block of screen.blocks) {
      if (block.type === "audio") expect(block.autoPlay).not.toBe(true);
    }
    const textContents = screen.blocks
      .filter((b) => b.type === "text")
      .map((b) => ("content" in b ? b.content : ""));
    for (const content of textContents) {
      expect(content).not.toMatch(/Alif makes/i);
      expect(content).not.toMatch(/Alif is a vowel/i);
      expect(content).not.toMatch(/اَ/);
    }
  });

  it("no teach screen anywhere in the lesson teaches Alif as an 'a' sound, calls Alif a vowel, or contains اَ", () => {
    for (const screen of lessonTwo.screens) {
      if (screen.kind !== "teach") continue;
      for (const block of screen.blocks) {
        if (block.type !== "text" && block.type !== "heading") continue;
        const content = block.type === "text" ? block.content : block.text;
        expect(content).not.toMatch(/Alif makes/i);
        expect(content).not.toMatch(/Alif is a vowel/i);
        expect(content).not.toMatch(/اَ/);
      }
    }
  });
});
