import type { EntityCapability } from "./entity";
import type { ExerciseStep } from "./curriculum-v2";

export interface AssessmentProfile {
  id: string;
  description: string;
  targetCapabilities: EntityCapability[];
  exerciseWeights: { type: ExerciseStep["type"]; weight: number }[];
  minimumReadPercent: number;
  scaffoldingLevel: "none" | "minimal" | "light";
  diagnosticTags?: string[];
  bucketThresholds?: Record<string, number>;
}
