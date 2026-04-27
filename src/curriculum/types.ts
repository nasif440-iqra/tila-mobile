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
  /** User-facing prompt, e.g., "Try saying it first." */
  prompt: string;
  target: EntityKey;
  /** The Arabic to read — single glyph or syllable for A0. */
  display: string;
  /**
   * Model audio path. REQUIRED.
   * The runtime MUST NOT auto-play this on mount. It is revealed only
   * after the learner taps Check (after a `READ_ATTEMPT_DELAY_MS` lock).
   * After reveal, Continue gates on audio playback completion.
   * See SPEC Constraint 2 for rationale.
   */
  audioModel: string;
  /** Optional one-line confirmation copy shown after reveal, e.g., "That's ba." */
  revealCopy?: string;
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
  /**
   * "onboarding" lessons are exempt from standard lesson anatomy
   * (warm-recall → practice → mastery-check, scored items, decoding rule).
   * Reserved for the first-session experience. Future onboarding lessons
   * require curriculum-team sign-off; otherwise default to "standard".
   * Test enforcement is added once Lesson 2 lands.
   */
  kind?: "onboarding" | "standard";
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
