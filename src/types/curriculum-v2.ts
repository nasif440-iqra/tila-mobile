// ── Exercise Source ──

export type ExerciseSource =
  | { from: "teach" }
  | { from: "review" }
  | { from: "mixed"; mix?: { teach: number; review: number } }
  | { from: "all" }
  | { from: "explicit"; entityIds: string[] };

// ── Exercise Step (discriminated union) ──

export type ExerciseStep =
  | {
      type: "tap";
      count: number;
      target: "letter" | "form" | "mark";
      source: ExerciseSource;
      distractorCount?: number;
    }
  | {
      type: "hear";
      count: number;
      target: "letter" | "combo" | "chunk" | "word";
      source: ExerciseSource;
      direction: "audio-to-script" | "script-to-audio";
    }
  | {
      type: "choose";
      count: number;
      target: "letter" | "combo" | "rule" | "word";
      source: ExerciseSource;
      distractorStrategy?: "family" | "vowel" | "shape" | "similar-word";
    }
  | {
      type: "build";
      count: number;
      target: "combo" | "chunk" | "word" | "phrase";
      source: ExerciseSource;
      maxTiles?: number;
    }
  | {
      type: "read";
      count: number;
      target: "combo" | "chunk" | "word" | "phrase" | "verse";
      source: ExerciseSource;
      connected?: boolean;
      renderOverride?: "connected" | "quran-script" | "mushaf";
    }
  | {
      type: "fix";
      count: number;
      target: "vowel" | "dot" | "join" | "letter" | "word";
      source: ExerciseSource;
    }
  | {
      type: "check";
      count: number;
      target: "mixed";
      source: ExerciseSource;
      assessmentProfile: string;
    };

// ── Mastery Policy ──

export interface MasteryPolicy {
  passThreshold: number;
  decodePassRequired?: number;
  decodeMinPercent?: number;
}

// ── Render Profile ──

export type RenderProfile = "isolated" | "connected" | "quran-script" | "mushaf";

// ── Lesson V2 ──

export interface LessonV2 {
  id: number;
  phase: number;
  module: string;
  moduleTitle?: string;
  title: string;
  description: string;
  teachEntityIds: string[];
  reviewEntityIds: string[];
  exercisePlan: ExerciseStep[];
  masteryPolicy: MasteryPolicy;
  renderProfile?: RenderProfile;
  hintRuleId?: string;
  tags?: string[];
}

// ── Phase V2 ──

export interface ReviewQueuePolicy {
  maxOverdueCritical: number;
  overdueDaysThreshold: number;
  scopeTag?: string;
}

export interface PhaseUnlockPolicy {
  requirePhase: number;
  requireCheckpointPass: boolean;
  reviewQueuePolicy?: ReviewQueuePolicy;
  minRetainedEntities?: number;
}

export interface PhaseV2 {
  phase: number;
  title: string;
  goal: string;
  unlockRuleText: string;
  unlockPolicy: PhaseUnlockPolicy;
}
