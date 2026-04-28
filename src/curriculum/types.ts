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
  | {
      type: "audio";
      path: string;
      label?: string;
      /**
       * If true, the runtime fires `onPlayAudio(path)` once on screen mount.
       * Permitted only on Teach screens (SPEC Constraint 3 — auto-play
       * teach-only). Default: false (tap-to-play only).
       */
      autoPlay?: boolean;
    }
  | {
      /**
       * Side-by-side comparison of two glyphs with per-glyph tap-to-play audio.
       * Used to teach the NAME vs SOUND distinction (e.g., ب → "baa" alongside
       * بَ → "ba"). Each side has its own glyph + audio path. Optional
       * transliteration provides English-script reinforcement when the audible
       * difference is subtle (e.g., "Bah" longer vs "ba" shorter).
       */
      type: "name-sound-pair";
      left: {
        glyph: string;
        audioPath: string;
        label?: string;
        transliteration?: string;
      };
      right: {
        glyph: string;
        audioPath: string;
        label?: string;
        transliteration?: string;
      };
    }
  | {
      /**
       * Multi-option preview of mark variants. Renders N tappable glyphs,
       * each with its own audio path. Optional `highlightIndex` visually
       * emphasizes today's focus. Used to introduce the mark system before
       * narrowing scope (e.g., showing fatha/kasra/dhamma, highlighting fatha).
       */
      type: "mark-preview";
      options: Array<{ glyph: string; audioPath: string; label?: string }>;
      highlightIndex?: number;
    };

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
