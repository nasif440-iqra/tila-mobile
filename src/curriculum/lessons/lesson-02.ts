import type { LessonData } from "../types";

/**
 * Runtime artifact for Lesson 2 — "Alif + Ba + Fatha = بَ".
 *
 * Human-authored spec: curriculum/phase-1/02-alif-ba-fatha.md
 * Compiled from round-4 reviewer markdown (16 screens, 6 practice items).
 *
 * First scored lesson. Learner confirms Ba recognition (warm recall),
 * meets Alif for the first time (teach), practices letter/mark/syllable
 * discrimination (practice — 6 items on a deliberate staircase), and reads
 * بَ unprompted on the final two items (mastery check).
 * Both Read items must be correct for the decoding gate.
 *
 * kind: "standard" — SPEC Constraint 1 (scored, anatomy enforced, decoding rule active).
 *
 * Locked prompt vocabulary (5 canonical forms):
 *   "Tap the letter Ba"        — letter identification for ب
 *   "Tap Alif"                 — letter identification for ا
 *   "Tap the letter you hear"  — audio = letter name → pick glyph
 *   "Tap what you hear"        — audio = sound → pick glyph (includes syllable)
 *   "Which one says 'ba'?"     — visual sound identification, with or without audio
 *
 * Practice ramp: recognize letters (Tap) → hear letter name (Hear) →
 *   audio-only sound→syllable (Choose, audio mode) →
 *   text-only sound→syllable (Choose, visual mode) →
 *   visual mode repeat with positions flipped (Choose, visual reinforce).
 *
 * Audio notes (Apr 2026): alif_name routing added to PATH_TO_PLAYER in prior
 * commit (8dce161). All three assets exist. Zero new ElevenLabs recordings
 * required for L2.
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
    // all three items, exposing the eye to ا before the teach phase names it.
    // بَ does NOT appear in warm recall — that contrast is held until after
    // fatha has been re-taught in Screen 2.3.

    // Item 1.1 — Tap Ba (ا as distractor; ب on left)
    {
      kind: "exercise",
      id: "wr-1-1",
      part: "warm-recall",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "tap",
        prompt: "Tap the letter Ba",
        target: "letter:ba",
        options: [
          { display: "ب", entityKey: "letter:ba", correct: true },
          { display: "ا", entityKey: "letter:alif", correct: false },
        ],
      },
    },

    // Item 1.2 — Hear Ba name (options: ا on left, ب on right)
    {
      kind: "exercise",
      id: "wr-1-2",
      part: "warm-recall",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "hear",
        prompt: "Tap the letter you hear",
        target: "letter:ba",
        audioPath: "audio/letter/ba_name.mp3",
        options: [
          { display: "ا", entityKey: "letter:alif", correct: false },
          { display: "ب", entityKey: "letter:ba", correct: true },
        ],
      },
    },

    // Item 1.3 — Tap Ba (positions flipped from 1.1: ا on left, ب ✓ on right)
    // Distractor is still ا — NOT بَ. The syllable contrast is held until after
    // Screen 2.3 re-teaches fatha.
    {
      kind: "exercise",
      id: "wr-1-3",
      part: "warm-recall",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "tap",
        prompt: "Tap the letter Ba",
        target: "letter:ba",
        options: [
          { display: "ا", entityKey: "letter:alif", correct: false },
          { display: "ب", entityKey: "letter:ba", correct: true },
        ],
      },
    },

    // ── Part 2 — Teach (~80s, 4 screens) ──────────────────────────────────────

    // Screen 2.1 — Meet Alif. Auto-play once on mount (Constraint 3 — Teach only).
    // Alif introduced as named visual symbol only — no sound teaching for Alif.
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

    // Screen 2.2 — Alif's shape. No audio. Minimal — no connection-rule
    // foreshadowing (Lesson 14), no sound teaching for Alif.
    {
      kind: "teach",
      id: "teach-alif-shape",
      blocks: [
        { type: "heading", text: "Alif's shape" },
        { type: "glyph-display", letter: "ا", size: "large" },
        { type: "text", content: "For now, just remember: Alif is a tall line." },
      ],
    },

    // Screen 2.3 — Recognize fatha. Tap-to-play only (no auto-play).
    // Re-teaches fatha as a named concept before any item asks the learner to
    // discriminate the syllable from the letter. Licenses the ب-vs-بَ contrast
    // beginning at Item 3.4.
    {
      kind: "teach",
      id: "teach-recognize-fatha",
      blocks: [
        { type: "heading", text: "Remember this mark?" },
        { type: "glyph-display", letter: "بَ", size: "large" },
        {
          type: "text",
          content: "This little mark is called fatha. It tells a letter to make an 'a' sound.",
        },
        {
          type: "audio",
          path: "audio/letter/ba_fatha_sound.mp3",
          label: "Hear sound",
        },
      ],
    },

    // Screen 2.4 — Today's syllable. Bridge into Practice.
    // Tap-to-play only (no auto-play per Constraint 3).
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
    // Deliberate staircase:
    //   Tap ب → Tap ا → Hear Ba name → Choose (audio mode) → Choose (visual mode)
    //   → Choose (visual reinforce, positions flipped).
    // All scored, until-correct. Alif held back from syllable contrast until
    // mastery (4.1 is the only 3-option item in the lesson).

    // Item 3.1 — Tap Ba (visual recognition; ب ✓ on left, ا on right)
    {
      kind: "exercise",
      id: "pr-3-1",
      part: "practice",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "tap",
        prompt: "Tap the letter Ba",
        target: "letter:ba",
        options: [
          { display: "ب", entityKey: "letter:ba", correct: true },
          { display: "ا", entityKey: "letter:alif", correct: false },
        ],
      },
    },

    // Item 3.2 — Tap Alif (visual recognition of just-introduced letter)
    {
      kind: "exercise",
      id: "pr-3-2",
      part: "practice",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "tap",
        prompt: "Tap Alif",
        target: "letter:alif",
        options: [
          { display: "ا", entityKey: "letter:alif", correct: true },
          { display: "ب", entityKey: "letter:ba", correct: false },
        ],
      },
    },

    // Item 3.3 — Hear Ba name (audio → letter mapping for ب only)
    // Alif has no audio practice item — its audio was auto-played in Screen 2.1.
    {
      kind: "exercise",
      id: "pr-3-3",
      part: "practice",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "hear",
        prompt: "Tap the letter you hear",
        target: "letter:ba",
        audioPath: "audio/letter/ba_name.mp3",
        options: [
          { display: "ا", entityKey: "letter:alif", correct: false },
          { display: "ب", entityKey: "letter:ba", correct: true },
        ],
      },
    },

    // Item 3.4 — Choose: AUDIO MODE (single instruction mode — auditory only).
    // Learner hears "ba" and picks the matching glyph. Text and audio do not
    // compete for attention. 2 options only — Alif held back for mastery.
    {
      kind: "exercise",
      id: "pr-3-4",
      part: "practice",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "choose",
        prompt: "Tap what you hear",
        target: "combo:ba+fatha",
        audioPrompt: "audio/letter/ba_fatha_sound.mp3",
        options: [
          { display: "بَ", entityKey: "combo:ba+fatha", correct: true },
          { display: "ب", entityKey: "letter:ba", correct: false },
        ],
      },
    },

    // Item 3.5 — Choose: VISUAL MODE (single instruction mode — visual only).
    // Prompt names the target sound; no audio competes. Same 2-option contrast
    // as 3.4 but tested through reading the prompt rather than hearing it.
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

    // Item 3.6 — Choose: VISUAL REINFORCE (option positions FLIPPED from 3.5).
    // Same visual-only task — no audioPrompt — but correct syllable is on the
    // right rather than the left. Breaks positional muscle memory from 3.5.
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
          { display: "ب", entityKey: "letter:ba", correct: false },
          { display: "بَ", entityKey: "combo:ba+fatha", correct: true },
        ],
      },
    },

    // ── Part 4 — Mastery Check (~40s, 3 items) ────────────────────────────────
    // All one-shot. Per master curriculum §10, the last two scored items are
    // Reads; both must be correct for requireCorrectLastTwoDecoding to pass.

    // Item 4.1 — Choose (first and only 3-option item; Alif rejoins option set)
    {
      kind: "exercise",
      id: "mc-4-1",
      part: "mastery-check",
      scored: true,
      countsAsDecoding: false,
      retryMode: "one-shot",
      exercise: {
        type: "choose",
        prompt: "Tap what you hear",
        target: "combo:ba+fatha",
        audioPrompt: "audio/letter/ba_fatha_sound.mp3",
        options: [
          { display: "ا", entityKey: "letter:alif", correct: false },
          { display: "بَ", entityKey: "combo:ba+fatha", correct: true },
          { display: "ب", entityKey: "letter:ba", correct: false },
        ],
      },
    },

    // Item 4.2 — Read بَ (decoding; no auto-play per Constraint 2)
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

    // Item 4.3 — Read بَ (second pass; "Say it again." humanises the rhythm)
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
