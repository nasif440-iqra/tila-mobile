// src/curriculum/types.ts

export type EntityKey = string; // "letter:alif", "combo:ba+fatha", "mark:fatha"

// ────────────────────────────────────────────────────────────
// Teaching blocks — composable atoms for teaching screens
// ────────────────────────────────────────────────────────────

export type TeachingBlock =
  | { type: "text"; content: string }
  | { type: "reading-direction"; word: string }
  | {
      type: "glyph-display";
      letter: string;
      size?: "large" | "medium";
      withMark?: string;
    }
  | {
      type: "shape-variants";
      letter: string;
      variants: Array<{
        position: "isolated" | "initial" | "medial" | "final";
        rendered: string;
      }>;
    }
  | { type: "audio"; path: string; label?: string };

// ────────────────────────────────────────────────────────────
// Exercise union — all seven types per curriculum §7
// ────────────────────────────────────────────────────────────

export interface TapExercise {
  type: "tap";
  prompt: string;
  target: EntityKey;
  audioOnMount?: string;
  options: Array<{ display: string; entityKey: EntityKey; correct: boolean }>;
}

export interface HearExercise {
  type: "hear";
  prompt: string;
  target: EntityKey;
  audioPath: string;
  displayOnScreen?: string;
  options?: Array<{ display: string; entityKey: EntityKey; correct: boolean }>;
  note?: string;
}

export interface ChooseExercise {
  type: "choose";
  prompt: string;
  target: EntityKey;
  audioPrompt?: string;
  options: Array<{ display: string; entityKey: EntityKey; correct: boolean }>;
}

export interface BuildExercise {
  type: "build";
  prompt: string;
  target: EntityKey;
  tiles: Array<{ display: string; entityKey: EntityKey }>;
  correctSequence: EntityKey[];
}

export interface ReadExercise {
  type: "read";
  prompt: string;
  target: EntityKey;
  display: string;
  /**
   * Post-attempt only. The runtime MUST NOT auto-play this before the
   * learner's attempt. See curriculum §6 no-cueing guardrail.
   */
  audioModel?: string;
}

export interface FixExercise {
  type: "fix";
  prompt: string;
  target: EntityKey;
  initialWrong: string;
  correctionType: "mark" | "letter" | "pattern";
  correctDisplay: string;
}

export type Exercise =
  | TapExercise | HearExercise | ChooseExercise
  | BuildExercise | ReadExercise | FixExercise;

// ────────────────────────────────────────────────────────────
// Screen union — teaching vs exercise
// ────────────────────────────────────────────────────────────

export interface TeachingScreen {
  kind: "teach";
  id: string;
  blocks: TeachingBlock[];
  allowBack?: boolean;
}

export interface ExerciseScreen {
  kind: "exercise";
  id: string;
  part: "warm-recall" | "practice" | "mastery-check";
  exercise: Exercise;
  allowBack?: boolean;
  scored?: boolean;
  countsAsDecoding?: boolean;
  retryMode?: "until-correct" | "one-shot";
}

export type Screen = TeachingScreen | ExerciseScreen;

// ────────────────────────────────────────────────────────────
// Lesson
// ────────────────────────────────────────────────────────────

export interface LessonData {
  id: string;
  phase: number;
  module: string;
  title: string;
  outcome: string;
  durationTargetSeconds: number;
  introducedEntities: EntityKey[];
  reviewEntities: EntityKey[];
  passCriteria: {
    threshold: number;
    requireCorrectLastTwoDecoding: boolean;
  };
  screens: Screen[];
  /** Optional per-lesson override for the completion view subtitle. */
  completionSubtitle?: string;
  /**
   * Optional override for the completion-view glyph preview.
   * When absent, the completion view falls back to introducedEntities.
   * Use for lessons like Lesson 1 that preview letters without formally
   * introducing them — introducedEntities stays authoring-accurate while
   * the completion view still shows what the learner just met.
   */
  completionGlyphs?: EntityKey[];
}
