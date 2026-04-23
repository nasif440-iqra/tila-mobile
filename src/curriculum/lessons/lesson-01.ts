import type { LessonData } from "../types";

/**
 * Runtime artifact for Lesson 1 — "Arabic Starts Here".
 * Human-authored spec: curriculum/phase-1/01-arabic-starts-here.md
 * Keep this file in sync with the markdown frontmatter and exercise blocks.
 * When markdown edits, this file must be updated manually (A0 — parser deferred).
 */
export const lessonOne: LessonData = {
  id: "lesson-01",
  phase: 1,
  module: "1.1",
  title: "Arabic Starts Here",
  outcome:
    "Orient to right-to-left reading, that letters change shape, and that a letter + a mark makes a sound. No scored reading yet.",
  durationTargetSeconds: 180,
  introducedEntities: [],
  reviewEntities: [],
  passCriteria: { threshold: 0.8, requireCorrectLastTwoDecoding: false },
  completionSubtitle: "You just met your first Arabic letters.",
  // introducedEntities stays [] because Lesson 1 only previews Alif and Ba
  // (formally introduced in Lesson 2). completionGlyphs gives the completion
  // view what to show anyway — see types.ts for rationale.
  completionGlyphs: ["letter:alif", "letter:ba"],
  screens: [
    {
      kind: "teach",
      id: "t-rtl-intro",
      blocks: [
        { type: "text", content: "Arabic reads right to left — the opposite of English. Every word starts on the right." },
        { type: "reading-direction", word: "بِسْمِ" },
        { type: "audio", path: "audio/lesson_01/rtl_intro.mp3", label: "Listen" },
      ],
    },
    {
      kind: "teach",
      id: "t-shape-change",
      blocks: [
        { type: "text", content: "Notice how the same letter looks different depending on where it sits in a word. This is normal." },
        {
          type: "shape-variants",
          letter: "ب",
          variants: [
            { position: "isolated", rendered: "ب" },
            { position: "initial", rendered: "بـ" },
            { position: "medial", rendered: "ـبـ" },
          ],
        },
        { type: "audio", path: "audio/lesson_01/shape_change_intro.mp3", label: "Listen" },
      ],
    },
    {
      kind: "teach",
      id: "t-mark-intro",
      blocks: [
        { type: "text", content: "A letter by itself is a shape. Add a small mark, and it becomes a sound you can read." },
        { type: "glyph-display", letter: "ب", withMark: "بَ", size: "large" },
        { type: "audio", path: "audio/lesson_01/mark_intro.mp3", label: "Listen" },
      ],
    },
    {
      kind: "exercise",
      id: "p-hear-alif",
      part: "practice",
      scored: false,
      countsAsDecoding: false,
      exercise: {
        type: "hear",
        prompt: "Tap to hear again — this is Alif.",
        target: "letter:alif",
        audioPath: "audio/letter/alif_name.mp3",
        displayOnScreen: "ا",
        note: "Tap as many times as you like.",
      },
    },
    {
      kind: "exercise",
      id: "p-tap-alif",
      part: "practice",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "tap",
        prompt: "Which one did you just hear?",
        target: "letter:alif",
        audioOnMount: "audio/letter/alif_name.mp3",
        options: [
          { display: "ا", entityKey: "letter:alif", correct: true },
          { display: "ب", entityKey: "letter:ba", correct: false },
        ],
      },
    },
    {
      kind: "exercise",
      id: "p-hear-ba",
      part: "practice",
      scored: false,
      countsAsDecoding: false,
      exercise: {
        type: "hear",
        prompt: "Tap to hear again — this is Ba.",
        target: "letter:ba",
        audioPath: "audio/letter/ba_name.mp3",
        displayOnScreen: "ب",
        note: "Tap as many times as you like.",
      },
    },
    {
      kind: "exercise",
      id: "p-tap-ba",
      part: "practice",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "tap",
        prompt: "Which one did you just hear?",
        target: "letter:ba",
        audioOnMount: "audio/letter/ba_name.mp3",
        options: [
          { display: "ا", entityKey: "letter:alif", correct: false },
          { display: "ب", entityKey: "letter:ba", correct: true },
        ],
      },
    },
    {
      kind: "exercise",
      id: "mc-tap-alif",
      part: "mastery-check",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "tap",
        prompt: "Tap Alif.",
        target: "letter:alif",
        options: [
          { display: "ب", entityKey: "letter:ba", correct: false },
          { display: "ا", entityKey: "letter:alif", correct: true },
        ],
      },
    },
    {
      kind: "exercise",
      id: "mc-tap-ba",
      part: "mastery-check",
      scored: true,
      countsAsDecoding: false,
      retryMode: "until-correct",
      exercise: {
        type: "tap",
        prompt: "Tap Ba.",
        target: "letter:ba",
        options: [
          { display: "ا", entityKey: "letter:alif", correct: false },
          { display: "ب", entityKey: "letter:ba", correct: true },
        ],
      },
    },
  ],
};
