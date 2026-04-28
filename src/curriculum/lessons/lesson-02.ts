import type { LessonData } from "../types";

/**
 * Runtime artifact for Lesson 2 — "Alif + Ba + Fatha = بَ".
 *
 * Human-authored spec: curriculum/phase-1/02-alif-ba-fatha.md
 *
 * First scored lesson. Learner confirms Ba recognition (warm recall),
 * meets Alif for the first time (teach), practices letter/mark/syllable
 * discrimination (practice), and reads بَ unprompted on the final two items
 * (mastery check). Both Read items must be correct for the decoding gate.
 *
 * kind: "standard" — SPEC Constraint 1 (scored, anatomy enforced, decoding rule active).
 *
 * Audio notes (Apr 2026): alif_name routing added to PATH_TO_PLAYER in this
 * commit. Asset exists at assets/audio/names/alif.wav (restored from HEAD
 * pre-Wave-1). Zero new ElevenLabs recordings required for L2.
 */
export const lessonTwo: LessonData = {
  id: "lesson-02",
  kind: "standard",
  phase: 1,
  module: "1.1",
  title: "Alif + Ba + Fatha = بَ",
  outcome:
    "Read بَ — your first Arabic syllable. Meet Alif along the way.",
  durationTargetSeconds: 240,
  introducedEntities: ["letter:alif", "letter:ba", "mark:fatha", "combo:ba+fatha"],
  reviewEntities: [],
  passCriteria: { threshold: 0.85, requireCorrectLastTwoDecoding: true },
  completionSubtitle: "You read it on your own.",
  completionGlyphs: ["letter:alif", "letter:ba", "combo:ba+fatha"],
  screens: [
    // ── Part 1 — Warm Recall (~30s, 3 items) ──────────────────────────────────
    // Confirms Ba recognition from L1. Alif appears as a silent distractor in
    // 1.1 and 1.2 to expose the eye before the teach phase names it formally.

    // Item 1.1 — Tap Ba (alif as distractor)
    {
      kind: "exercise",
      id: "wr-1-1",
      part: "warm-recall",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "tap",
        prompt: "Tap Ba.",
        target: "letter:ba",
        options: [
          { display: "ب", entityKey: "letter:ba", correct: true },
          { display: "ا", entityKey: "letter:alif", correct: false },
        ],
      },
    },

    // Item 1.2 — Hear Ba (options flipped to discourage muscle memory)
    {
      kind: "exercise",
      id: "wr-1-2",
      part: "warm-recall",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "hear",
        prompt: "Tap the letter you hear.",
        target: "letter:ba",
        audioPath: "audio/letter/ba_name.mp3",
        options: [
          { display: "ا", entityKey: "letter:alif", correct: false },
          { display: "ب", entityKey: "letter:ba", correct: true },
        ],
      },
    },

    // Item 1.3 — Tap Ba (distractor is بَ, not alif — plants syllable contrast)
    {
      kind: "exercise",
      id: "wr-1-3",
      part: "warm-recall",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "tap",
        prompt: "Tap Ba.",
        target: "letter:ba",
        options: [
          { display: "ب", entityKey: "letter:ba", correct: true },
          { display: "بَ", entityKey: "combo:ba+fatha", correct: false },
        ],
      },
    },

    // ── Part 2 — Teach (~80s, 4 screens) ──────────────────────────────────────

    // Screen 2.1 — Meet Alif. Auto-play once on mount (Constraint 3 — Teach only).
    {
      kind: "teach",
      id: "teach-meet-alif",
      blocks: [
        { type: "heading", text: "Meet Alif" },
        { type: "glyph-display", letter: "ا", size: "large" },
        { type: "text", content: "This is the letter you saw above. It's called Alif." },
        {
          type: "audio",
          path: "audio/letter/alif_name.mp3",
          label: "Hear name",
          autoPlay: true,
        },
      ],
    },

    // Screen 2.2 — Alif's shape. No audio. Single isolated shape, no variants.
    // Connected-form behavior (chain-breaking) is deferred to Lesson 14.
    {
      kind: "teach",
      id: "teach-alif-shape",
      blocks: [
        { type: "heading", text: "Alif's shape" },
        { type: "glyph-display", letter: "ا", size: "large" },
        { type: "text", content: "For now, just remember: Alif is a tall line." },
      ],
    },

    // Screen 2.3 — Recognize fatha. Tap-to-play (no auto-play; L1 already
    // auto-played this sound on its Screen 6, so we don't repeat here).
    {
      kind: "teach",
      id: "teach-recognize-fatha",
      blocks: [
        { type: "heading", text: "Remember this mark?" },
        { type: "glyph-display", letter: "بَ", size: "large" },
        {
          type: "text",
          content: "This little mark is called fatha.\nIt tells a letter to make an 'a' sound.",
        },
        {
          type: "audio",
          path: "audio/letter/ba_fatha_sound.mp3",
          label: "Hear sound",
        },
      ],
    },

    // Screen 2.4 — Put it together (equation). Composed from existing primitives:
    // heading + body text + glyph for each component + text secondary + audio.
    // No new block type introduced.
    {
      kind: "teach",
      id: "teach-equation",
      blocks: [
        { type: "heading", text: "Today's syllable" },
        { type: "text", content: "ب + fatha = بَ" },
        { type: "glyph-display", letter: "بَ", size: "large" },
        {
          type: "text",
          variant: "secondary",
          content: "Ba plus fatha gives the sound 'ba'.",
        },
        {
          type: "audio",
          path: "audio/letter/ba_fatha_sound.mp3",
          label: "Hear sound",
        },
      ],
    },

    // ── Part 3 — Practice (~110s, 5 items) ────────────────────────────────────
    // Moves from visual recognition (Tap) → audio recognition (Hear) →
    // syllable discrimination (Choose). All scored, until-correct.

    // Item 3.1 — Tap Alif (first scored test of alif recognition)
    {
      kind: "exercise",
      id: "pr-3-1",
      part: "practice",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "tap",
        prompt: "Tap Alif.",
        target: "letter:alif",
        options: [
          { display: "ا", entityKey: "letter:alif", correct: true },
          { display: "ب", entityKey: "letter:ba", correct: false },
        ],
      },
    },

    // Item 3.2 — Hear Alif name
    {
      kind: "exercise",
      id: "pr-3-2",
      part: "practice",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "hear",
        prompt: "Tap the letter you hear.",
        target: "letter:alif",
        audioPath: "audio/letter/alif_name.mp3",
        options: [
          { display: "ب", entityKey: "letter:ba", correct: false },
          { display: "ا", entityKey: "letter:alif", correct: true },
        ],
      },
    },

    // Item 3.3 — Hear Ba name (interleaved with alif's name for contrast)
    {
      kind: "exercise",
      id: "pr-3-3",
      part: "practice",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "hear",
        prompt: "Tap the letter you hear.",
        target: "letter:ba",
        audioPath: "audio/letter/ba_name.mp3",
        options: [
          { display: "ا", entityKey: "letter:alif", correct: false },
          { display: "ب", entityKey: "letter:ba", correct: true },
        ],
      },
    },

    // Item 3.4 — Choose: discriminate syllable from bare letter (audio prompt)
    {
      kind: "exercise",
      id: "pr-3-4",
      part: "practice",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "choose",
        prompt: "Tap what you hear.",
        target: "combo:ba+fatha",
        audioPrompt: "audio/letter/ba_fatha_sound.mp3",
        options: [
          { display: "بَ", entityKey: "combo:ba+fatha", correct: true },
          { display: "ب", entityKey: "letter:ba", correct: false },
          { display: "ا", entityKey: "letter:alif", correct: false },
        ],
      },
    },

    // Item 3.5 — Choose: visual-only syllable discrimination (no audio prompt)
    {
      kind: "exercise",
      id: "pr-3-5",
      part: "practice",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "choose",
        prompt: "Which one says 'ba'?",
        target: "combo:ba+fatha",
        options: [
          { display: "بَ", entityKey: "combo:ba+fatha", correct: true },
          { display: "ب", entityKey: "letter:ba", correct: false },
        ],
      },
    },

    // ── Part 4 — Mastery Check (~40s, 3 items) ────────────────────────────────
    // Per master curriculum §10: the last two scored items are Reads, both
    // must be correct for requireCorrectLastTwoDecoding to pass.

    // Item 4.1 — Choose (one-shot; mastery-check gate, different option order)
    {
      kind: "exercise",
      id: "mc-4-1",
      part: "mastery-check",
      scored: true,
      countsAsDecoding: false,
      retryMode: "one-shot",
      exercise: {
        type: "choose",
        prompt: "Tap what you hear.",
        target: "combo:ba+fatha",
        audioPrompt: "audio/letter/ba_fatha_sound.mp3",
        options: [
          { display: "ا", entityKey: "letter:alif", correct: false },
          { display: "بَ", entityKey: "combo:ba+fatha", correct: true },
          { display: "ب", entityKey: "letter:ba", correct: false },
        ],
      },
    },

    // Item 4.2 — Read بَ (first unseen Read; no auto-play per Constraint 2)
    {
      kind: "exercise",
      id: "mc-4-2",
      part: "mastery-check",
      scored: true,
      countsAsDecoding: true,
      retryMode: "one-shot",
      exercise: {
        type: "read",
        promptHeading: "Your turn",
        prompt: "Read this aloud.",
        target: "combo:ba+fatha",
        display: "بَ",
        audioModel: "audio/letter/ba_fatha_sound.mp3",
        revealHeading: "You read it",
        revealCopy: "That says ba.",
      },
    },

    // Item 4.3 — Read بَ (second pass; repetition is intentional per spec)
    {
      kind: "exercise",
      id: "mc-4-3",
      part: "mastery-check",
      scored: true,
      countsAsDecoding: true,
      retryMode: "one-shot",
      exercise: {
        type: "read",
        promptHeading: "Your turn",
        prompt: "One more time.",
        target: "combo:ba+fatha",
        display: "بَ",
        audioModel: "audio/letter/ba_fatha_sound.mp3",
        revealHeading: "You read it",
        revealCopy: "That says ba.",
      },
    },
  ],
};
