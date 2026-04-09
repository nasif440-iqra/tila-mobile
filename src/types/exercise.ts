import type { ExerciseSource, ExerciseStep, LessonV2, RenderProfile } from "./curriculum-v2";
import type { AnyEntity, EntityCapability } from "./entity";

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
  type: ExerciseStep["type"] | "present";
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

// ── Generator Input ──

export interface EntityMasteryState {
  state: "not_started" | "introduced" | "unstable" | "accurate" | "retained";
  correctCount: number;
  attemptCount: number;
}

export interface MasterySnapshot {
  entityStates: Map<string, EntityMasteryState>;
  confusionPairs: Map<string, string[]>;
}

export interface GeneratorInput {
  step: ExerciseStep;
  lesson: LessonV2;
  teachEntities: AnyEntity[];
  reviewEntities: AnyEntity[];
  allUnlockedEntities: AnyEntity[];
  masterySnapshot: MasterySnapshot;
  renderProfile: RenderProfile;
}
