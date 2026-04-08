import type { PhaseV2 } from "@/src/types/curriculum-v2";

export const PHASES_V2: PhaseV2[] = [
  {
    phase: 1, title: "First Real Decoding Wins",
    goal: "Get the learner from 'Arabic scares me' to 'I can sound out tiny Arabic chunks'",
    unlockRuleText: "No prerequisite \u2014 this is the first phase",
    unlockPolicy: { requirePhase: 0, requireCheckpointPass: false },
  },
  {
    phase: 2, title: "Three Short Vowels and Early Connected Forms",
    goal: "Build secure short-vowel reading and introduce connected script before bad isolated-form habits set in",
    unlockRuleText: "Pass Phase 1 checkpoint",
    unlockPolicy: { requirePhase: 1, requireCheckpointPass: true },
  },
  {
    phase: 3, title: "Core Word Reading and Joining Logic",
    goal: "Turn short chunk reading into short word reading while making joining behavior feel normal",
    unlockRuleText: "Pass Phase 2 checkpoint, review queue clear",
    unlockPolicy: { requirePhase: 2, requireCheckpointPass: true, reviewQueuePolicy: { maxOverdueCritical: 3, overdueDaysThreshold: 7 } },
  },
  {
    phase: 4, title: "Long Vowels, Diphthongs, and Heavy Letters",
    goal: "Teach vowel behavior and core consonants needed for Al-Fatiha",
    unlockRuleText: "Pass Phase 3 checkpoint, review queue clear",
    unlockPolicy: { requirePhase: 3, requireCheckpointPass: true, reviewQueuePolicy: { maxOverdueCritical: 3, overdueDaysThreshold: 7 }, minRetainedEntities: 10 },
  },
  {
    phase: 5, title: "Quran-Script Bridge",
    goal: "Bridge from simplified connected Arabic to the orthographic realities of Quran text",
    unlockRuleText: "Pass Phase 4 checkpoint, review queue clear",
    unlockPolicy: { requirePhase: 4, requireCheckpointPass: true, reviewQueuePolicy: { maxOverdueCritical: 3, overdueDaysThreshold: 7 }, minRetainedEntities: 20 },
  },
  {
    phase: 6, title: "Surah Al-Fatiha Transfer",
    goal: "Take the learner from chunk-level decoding to a full, unsupported reading of Surah Al-Fatiha",
    unlockRuleText: "Pass Phase 5 checkpoint (Quran-Script Readiness)",
    unlockPolicy: { requirePhase: 5, requireCheckpointPass: true, reviewQueuePolicy: { maxOverdueCritical: 2, overdueDaysThreshold: 5 }, minRetainedEntities: 30 },
  },
];
