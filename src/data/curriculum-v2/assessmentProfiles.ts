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
  {
    id: "phase-2-checkpoint",
    description:
      "Assess connected chunks with short vowels and early sukun — the learner must decode connected Arabic, not just recognize isolated symbols",
    targetCapabilities: ["readable", "hearable", "buildable", "fixable"],
    exerciseWeights: [
      { type: "read", weight: 0.40 },    // Connected reading is the core test
      { type: "choose", weight: 0.15 },   // Vowel discrimination under pressure
      { type: "build", weight: 0.15 },    // Can they assemble connected chunks?
      { type: "fix", weight: 0.15 },      // Can they spot join + vowel errors?
      { type: "hear", weight: 0.15 },     // Audio-to-connected-script mapping
    ],
    minimumReadPercent: 0.35,
    scaffoldingLevel: "none",             // No hints, one audio play, no undo
    diagnosticTags: [
      "vowel-confusion",                  // Fatha/kasra/damma discrimination
      "connected-reading",                // Can they decode joined script?
      "chain-breaking",                   // Do they see where alif/daal break the chain?
      "sukun-decoding",                   // Can they handle consonant stops?
    ],
    bucketThresholds: {
      "vowel-confusion": 0.65,
      "connected-reading": 0.60,
      "chain-breaking": 0.60,
      "sukun-decoding": 0.55,
    },
  },
];
