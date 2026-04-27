import type { LessonData } from "../types";

/**
 * Runtime artifact for Lesson 1 — "Arabic Starts Here" (proof-shape redesign).
 *
 * Human-authored spec: curriculum/phase-1/01-arabic-starts-here.md
 * Engineering SPEC:   docs/superpowers/specs/2026-04-27-lesson-1-proof-shape-design.md
 *
 * Lesson 1 is an ONBOARDING lesson — it does not follow standard lesson
 * anatomy (no warm-recall, no scored items, no mastery-check). The proof
 * is the lesson: the learner ends having read بَ. The kind: "onboarding"
 * discriminator is load-bearing — see SPEC Constraint 1.
 *
 * Keep this file in sync with the authoring markdown. When markdown edits,
 * this file must be updated manually (parser deferred until at least
 * Lesson 2–3 ship).
 */
export const lessonOne: LessonData = {
  id: "lesson-01",
  kind: "onboarding",
  phase: 1,
  module: "1.1",
  title: "Arabic Starts Here",
  outcome: "Read your first Arabic syllable: بَ.",
  durationTargetSeconds: 150,
  introducedEntities: ["letter:ba", "combo:ba+fatha"],
  reviewEntities: [],
  passCriteria: { threshold: 0, requireCorrectLastTwoDecoding: false },
  completionSubtitle: "You just read your first Arabic syllable: بَ",
  completionGlyphs: ["combo:ba+fatha"],
  screens: [
    // Screen 1 — Teach: RTL orientation
    {
      kind: "teach",
      id: "t-rtl-intro",
      blocks: [
        {
          type: "text",
          content:
            "Arabic reads right to left. Every word starts on the right.",
        },
        { type: "reading-direction", word: "بِسْمِ" },
        { type: "audio", path: "audio/lesson_01/rtl_intro.mp3", label: "Listen" },
      ],
    },

    // Screen 2 — Teach: meet Ba (the letter, by name)
    {
      kind: "teach",
      id: "t-meet-ba",
      blocks: [
        { type: "text", content: "This letter is Ba." },
        { type: "glyph-display", letter: "ب", size: "large" },
        { type: "audio", path: "audio/letter/ba_name.mp3", label: "Listen" },
      ],
    },

    // Screen 3 — Practice (unscored): hear Ba's name again
    {
      kind: "exercise",
      id: "p-hear-ba",
      part: "practice",
      scored: false,
      countsAsDecoding: false,
      exercise: {
        type: "hear",
        prompt: "Tap to hear it again.",
        target: "letter:ba",
        audioPath: "audio/letter/ba_name.mp3",
        displayOnScreen: "ب",
        note: "Tap as many times as you like.",
      },
    },

    // Screen 4 — Teach: the mark turns it into a sound you can read
    {
      kind: "teach",
      id: "t-mark",
      blocks: [
        {
          type: "text",
          content:
            "A small mark turns it into a sound you can read.",
        },
        { type: "glyph-display", letter: "ب", withMark: "بَ", size: "large" },
        {
          type: "audio",
          path: "audio/letter/ba_fatha_sound.mp3",
          label: "Listen",
        },
      ],
    },

    // Screen 5 — Practice (unscored): hear the syllable sound
    {
      kind: "exercise",
      id: "p-hear-ba-fatha",
      part: "practice",
      scored: false,
      countsAsDecoding: false,
      exercise: {
        type: "hear",
        prompt: "Tap to hear it again.",
        target: "combo:ba+fatha",
        audioPath: "audio/letter/ba_fatha_sound.mp3",
        displayOnScreen: "بَ",
        note: "Tap as many times as you like.",
      },
    },

    // Screen 6 — Read (the proof): try saying بَ, then check
    {
      kind: "exercise",
      id: "r-read-ba-fatha",
      part: "practice",
      scored: false,
      countsAsDecoding: false,
      exercise: {
        type: "read",
        prompt: "Try saying it first.",
        target: "combo:ba+fatha",
        display: "بَ",
        audioModel: "audio/letter/ba_fatha_sound.mp3",
        revealCopy: "That's ba.",
      },
    },
  ],
};
