import type { ExerciseStep, RenderProfile } from "./curriculum-v2";
import type { EntityCapability } from "./entity";

// ── Correct Answer (typed per exercise kind) ──

export type CorrectAnswer =
  | { kind: "single"; value: string }
  | { kind: "sequence"; values: string[] }
  | { kind: "fix"; location: string; replacement: string };

// ── Fix Segment (generator-provided hit zones) ──

export interface FixSegment {
  segmentId: string;
  displayText: string;
  isErrorLocation: boolean;
  boundingGroup: "letter" | "mark" | "join" | "word";
}

// ── Exercise Prompt (render-ready display payload) ──

export interface ExercisePrompt {
  text?: string;
  arabicDisplay: string;
  arabicDisplayAlt?: string;
  audioKey?: string;
  hintText?: string;
}

// ── Exercise Option ──

export interface ExerciseOption {
  id: string;
  displayArabic?: string;
  displayText?: string;
  audioKey?: string;
  isCorrect: boolean;
}

// ── Build Tile ──

export interface BuildTile {
  id: string;
  displayArabic: string;
  entityId: string;
  isDistractor: boolean;
}

// ── Exercise Item ──

export interface ExerciseItem {
  type: ExerciseStep["type"];
  prompt: ExercisePrompt;
  options?: ExerciseOption[];
  tiles?: BuildTile[];
  correctAnswer: CorrectAnswer;
  targetEntityId: string;
  isDecodeItem: boolean;
  diagnosticTags?: string[];
  answerMode: "transliteration" | "audio" | "arabic" | "build" | "fix-locate";
  preloadHint?: { audioKeys: string[]; entityIds: string[] };
  fixSegments?: FixSegment[];
  generatedBy?: ExerciseStep["type"];
  assessmentBucket?: string;
}

// ── Scored Item ──

export interface ScoredItem {
  item: ExerciseItem;
  correct: boolean;
  responseTimeMs: number;
  generatedBy: ExerciseStep["type"];
  assessmentBucket?: string;
  answerMode: string;
}
