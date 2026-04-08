import type { AssessmentProfile } from "@/src/types/assessment";

export const ASSESSMENT_PROFILES: AssessmentProfile[] = [
  {
    id: "phase-1-checkpoint",
    description:
      "Confirm the learner can decode short unseen items, not merely tap familiar letters",
    targetCapabilities: ["readable", "hearable"],
    exerciseWeights: [
      { type: "read", weight: 0.5 },
      { type: "choose", weight: 0.2 },
      { type: "hear", weight: 0.2 },
      { type: "build", weight: 0.1 },
    ],
    minimumReadPercent: 0.4,
    scaffoldingLevel: "none",
    diagnosticTags: ["vowel-confusion", "letter-confusion", "audio-mapping"],
    bucketThresholds: {
      "vowel-confusion": 0.6,
      "letter-confusion": 0.6,
      "audio-mapping": 0.6,
    },
  },
];
