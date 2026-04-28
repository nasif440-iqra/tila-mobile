import type { LessonData } from "../types";

/**
 * Runtime artifact for Lesson 1 v3 — "Your First Arabic Sound".
 *
 * Human-authored spec: curriculum/phase-1/01-arabic-starts-here.md
 * Reviewer-driven copy: lesson1spec.txt (root of repo, untracked)
 *
 * Lesson 1 explicitly teaches the NAME vs SOUND distinction:
 *   - Letters have a NAME (what they're called).
 *   - When you READ, you say the SOUND, which depends on a small mark
 *     (harakat). Today only fatha matters.
 *
 * 6-screen flow: Direction → Meet Ba (name) → Name vs Sound (the core)
 *               → Mark system preview (today only ba) → Focus on بَ → Read بَ.
 *
 * kind: "onboarding" — SPEC Constraint 1 (no scoring, no mastery-check).
 *
 * Audio status (Apr 2026): kasra and dhamma sounds are not yet recorded.
 * Their HearButtons render in disabled state per the no-fallback directive.
 */
export const lessonOne: LessonData = {
  id: "lesson-01",
  kind: "onboarding",
  phase: 1,
  module: "1.1",
  title: "Your First Arabic Sound",
  outcome:
    "Learners understand that letters have names, marks give reading sounds, and they can read بَ.",
  durationTargetSeconds: 165,
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

    // Screen 3 — Shape variants. The same letter looks different in different
    // word positions. Restored from the original A0 lesson per founder request.
    // No audio (visual self-explains).
    {
      kind: "teach",
      id: "t-shape-change",
      blocks: [
        { type: "heading", text: "The same letter, different shapes" },
        {
          type: "text",
          content:
            "The shape changes in a word.\nIt's still the same letter.",
        },
        {
          type: "shape-variants",
          letter: "ب",
          variants: [
            { position: "isolated", rendered: "ب" },
            { position: "initial", rendered: "بـ" },
            { position: "medial", rendered: "ـبـ" },
          ],
        },
      ],
    },

    // Screen 4 — Name vs Sound (the core teaching moment).
    // Heading + body copy emphasizes BEHAVIOR ("when you read, you say the sound")
    // over abstract distinction. Cards carry transliteration + helper text.
    {
      kind: "teach",
      id: "t-name-vs-sound",
      blocks: [
        { type: "heading", text: "Name vs. reading sound" },
        {
          type: "text",
          content:
            "Letters have names.\nWhen you read, you say the sound.",
        },
        {
          type: "name-sound-pair",
          left: {
            glyph: "ب",
            audioPath: "audio/letter/ba_name.mp3",
            transliteration: "Bah",
            helperText: "Its name",
          },
          right: {
            glyph: "بَ",
            audioPath: "audio/letter/ba_fatha_sound.mp3",
            transliteration: "ba",
            helperText: "What you read",
          },
        },
      ],
    },

    // Screen 5 — Mark system preview. بَ is today's target; بِ and بُ shown
    // for system context but not playable yet (no recordings) — their
    // HearButtons render disabled. Labels say "Today: ba" vs "Later".
    {
      kind: "teach",
      id: "t-mark-system",
      blocks: [
        { type: "heading", text: "Marks change the sound" },
        {
          type: "text",
          content:
            "These small marks change the sound.\nToday, just this one.",
        },
        {
          type: "mark-preview",
          options: [
            {
              glyph: "بَ",
              audioPath: "audio/letter/ba_fatha_sound.mp3",
              label: "Today: ba",
            },
            {
              glyph: "بِ",
              // audioPath intentionally absent — recording not yet produced.
              // Disabled HearButton rendered per no-fallback directive.
              label: "Later",
            },
            {
              glyph: "بُ",
              // audioPath intentionally absent — see بِ above.
              label: "Later",
            },
          ],
          highlightIndex: 0,
        },
      ],
    },

    // Screen 6 — Focus on بَ (lock the target). Auto-play once.
    {
      kind: "teach",
      id: "t-focus-bafatha",
      blocks: [
        { type: "heading", text: "Today's sound" },
        { type: "glyph-display", letter: "بَ", size: "large" },
        {
          type: "text",
          content:
            "This mark is called fatha.\nIt gives the letter an \"a\" sound.",
        },
        {
          type: "text",
          variant: "secondary",
          content: "Ba + fatha = ba",
        },
        {
          type: "audio",
          path: "audio/letter/ba_fatha_sound.mp3",
          label: "Hear sound",
          autoPlay: true,
        },
      ],
    },

    // Screen 7 — Read بَ (the proof). Heading + body swap on reveal.
    // promptHeading "Your turn" / prompt "Look at it first..." during attempt.
    // revealHeading "You read it" / revealCopy "That says ba." after Check.
    {
      kind: "exercise",
      id: "r-read-bafatha",
      part: "practice",
      scored: false,
      countsAsDecoding: false,
      exercise: {
        type: "read",
        promptHeading: "Your turn",
        prompt: "Say it in your head.",
        target: "combo:ba+fatha",
        display: "بَ",
        audioModel: "audio/letter/ba_fatha_sound.mp3",
        revealHeading: "You read it",
        revealCopy: "That says ba.",
      },
    },
  ],
};
