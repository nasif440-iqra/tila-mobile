import type { LessonData } from "../types";

/**
 * Runtime artifact for Lesson 2 — "Alif + Ba + Fatha = بَ".
 *
 * Human-authored spec: curriculum/phase-1/02-alif-ba-fatha.md
 * Compiled from round-2 reviewer markdown (16 screens, 6 practice items).
 *
 * First scored lesson. Learner confirms Ba recognition (warm recall),
 * meets Alif for the first time (teach), practices letter/mark/syllable
 * discrimination (practice — 6 items including the sound-anchor bridge),
 * and reads بَ unprompted on the final two items (mastery check).
 * Both Read items must be correct for the decoding gate.
 *
 * kind: "standard" — SPEC Constraint 1 (scored, anatomy enforced, decoding rule active).
 *
 * Audio notes (Apr 2026): alif_name routing added to PATH_TO_PLAYER in prior
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

    // Item 1.1 — Tap Ba (alif as distractor; first exposure to ا on screen)
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

    // Item 1.3 — Tap Ba (distractor switches to بَ — plants syllable contrast)
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

    // Screen 2.3 — Recognize fatha. Tap-to-play only (no auto-play; L1 already
    // auto-played this sound on its Screen 6, per Constraint 3 "tap after first hear").
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

    // Screen 2.4 — Put it together (equation). Bridge into Practice.
    // No auto-play — tap-to-play only.
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

    // ── Part 3 — Practice (~120s, 6 items) ────────────────────────────────────
    // Visual recognition (Tap) → audio recognition (Hear) →
    // sound-anchor bridge (Choose, explicit prompt) →
    // syllable discrimination (Choose, implicit prompt) →
    // visual-only discrimination (Choose, no audio prompt).
    // All scored, until-correct.

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

    // Item 3.4 — Choose: sound-anchor bridge (explicit prompt, 2 options only)
    // Low-load on-ramp: names the sound explicitly so learner doesn't need to
    // decide *what* they're matching. Anchors sound→syllable before discrimination.
    {
      kind: "exercise",
      id: "pr-3-4",
      part: "practice",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "choose",
        prompt: "Tap the sound 'ba'",
        target: "combo:ba+fatha",
        audioPrompt: "audio/letter/ba_fatha_sound.mp3",
        options: [
          { display: "بَ", entityKey: "combo:ba+fatha", correct: true },
          { display: "ب", entityKey: "letter:ba", correct: false },
        ],
      },
    },

    // Item 3.5 — Choose: syllable discrimination (implicit prompt, 2 options)
    // Same audio + options as bridge, but prompt hand-hold removed ("Tap what you hear").
    // Alif held back for mastery check — only 2 options.
    {
      kind: "exercise",
      id: "pr-3-5",
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
        ],
      },
    },

    // Item 3.6 — Choose: visual-only discrimination (no audio prompt)
    // Tests whether learner can pick the syllable without leaning on audio cues.
    {
      kind: "exercise",
      id: "pr-3-6",
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

    // Item 4.1 — Choose (one-shot; first and only 3-option item; alif reintroduced)
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

    // Item 4.3 — Read بَ (second pass; "Say it again." — conversational, not procedural)
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
        prompt: "Say it again.",
        target: "combo:ba+fatha",
        display: "بَ",
        audioModel: "audio/letter/ba_fatha_sound.mp3",
        revealHeading: "You read it",
        revealCopy: "That says ba.",
      },
    },
  ],
};
