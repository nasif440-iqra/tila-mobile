import type { LessonData } from "../types";

/**
 * Runtime artifact for Lesson 1 v2 — "Your First Arabic Sound".
 *
 * Human-authored spec: curriculum/phase-1/01-arabic-starts-here.md
 * Engineering SPEC:   docs/superpowers/specs/2026-04-27-lesson-1-v2-name-vs-sound-design.md
 *
 * Lesson 1 explicitly teaches the NAME vs SOUND distinction:
 *   - Letters have a NAME (e.g., ب is called "Bah", in classroom register).
 *   - Letters take on a SOUND when paired with a harakat mark
 *     (e.g., بَ is read "ba" — short, clipped — with a fatha).
 *
 * 6-screen flow: Direction → Meet Ba (name) → Name vs Sound (the core)
 *               → Mark system preview → Focus on بَ → Read بَ.
 *
 * kind: "onboarding" — SPEC Constraint 1 (no scoring, no mastery-check).
 */
export const lessonOne: LessonData = {
  id: "lesson-01",
  kind: "onboarding",
  phase: 1,
  module: "1.1",
  title: "Your First Arabic Sound",
  outcome:
    "Learners understand letters have names, marks give sounds, and they can read بَ.",
  durationTargetSeconds: 150,
  introducedEntities: ["letter:ba", "combo:ba+fatha"],
  reviewEntities: [],
  passCriteria: { threshold: 0, requireCorrectLastTwoDecoding: false },
  completionSubtitle: "You just read your first Arabic sound.",
  completionGlyphs: ["combo:ba+fatha"],
  screens: [
    // Screen 1 — Direction (orientation only, no audio, no speaker button)
    {
      kind: "teach",
      id: "t-direction",
      blocks: [
        { type: "reading-direction", word: "بِسْمِ ٱللّٰهِ" },
        { type: "text", content: "Arabic reads from right to left." },
      ],
    },

    // Screen 2 — Meet the letter (NAME). Auto-play once.
    {
      kind: "teach",
      id: "t-meet-ba",
      blocks: [
        { type: "glyph-display", letter: "ب", size: "large" },
        { type: "text", content: "This letter is called Ba." },
        {
          type: "audio",
          path: "audio/letter/ba_name.mp3",
          label: "Hear name",
          autoPlay: true,
        },
      ],
    },

    // Screen 3 — Name vs Sound (the core teaching moment). Tap-to-play, no auto-play.
    {
      kind: "teach",
      id: "t-name-vs-sound",
      blocks: [
        {
          type: "text",
          content:
            "Letters have a name. A small mark changes how they sound.",
        },
        {
          type: "name-sound-pair",
          left: {
            glyph: "ب",
            audioPath: "audio/letter/ba_name.mp3",
            label: "name",
          },
          right: {
            glyph: "بَ",
            audioPath: "audio/letter/ba_fatha_sound.mp3",
            label: "sound",
          },
        },
      ],
    },

    // Screen 4 — Mark system preview (fatha highlighted). Tap each to hear.
    {
      kind: "teach",
      id: "t-mark-system",
      blocks: [
        {
          type: "text",
          content:
            "These small marks change the sound. Today, we'll learn this one.",
        },
        {
          type: "mark-preview",
          options: [
            {
              glyph: "بَ",
              audioPath: "audio/letter/ba_fatha_sound.mp3",
              label: "ba",
            },
            {
              glyph: "بِ",
              audioPath: "audio/letter/ba_kasra_sound.mp3",
              label: "bi",
            },
            {
              glyph: "بُ",
              audioPath: "audio/letter/ba_dhamma_sound.mp3",
              label: "bu",
            },
          ],
          highlightIndex: 0,
        },
      ],
    },

    // Screen 5 — Focus on بَ (lock the target). Auto-play once.
    {
      kind: "teach",
      id: "t-focus-bafatha",
      blocks: [
        { type: "glyph-display", letter: "بَ", size: "large" },
        { type: "text", content: "This is ba." },
        {
          type: "audio",
          path: "audio/letter/ba_fatha_sound.mp3",
          label: "Hear sound",
          autoPlay: true,
        },
      ],
    },

    // Screen 6 — Read بَ (the proof). Unscored Read with the locked-attempt machine.
    {
      kind: "exercise",
      id: "r-read-bafatha",
      part: "practice",
      scored: false,
      countsAsDecoding: false,
      exercise: {
        type: "read",
        prompt: "Try saying it",
        target: "combo:ba+fatha",
        display: "بَ",
        audioModel: "audio/letter/ba_fatha_sound.mp3",
        revealCopy: "That's ba.",
      },
    },
  ],
};
