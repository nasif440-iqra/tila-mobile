import type { LessonV2 } from "@/src/types/curriculum-v2";

export const LESSONS_V2: LessonV2[] = [
  {
    id: 1, phase: 1, module: "1.1", moduleTitle: "First Real Decoding Wins",
    title: "Arabic Starts Here",
    description: "Orient to right-to-left reading, shape change in words, and the idea that a letter plus a mark makes a sound",
    teachEntityIds: ["letter:1", "letter:2", "rule:rtl-reading"],
    reviewEntityIds: [],
    exercisePlan: [
      { type: "tap", count: 3, target: "letter", source: { from: "teach" } },
      { type: "hear", count: 3, target: "letter", source: { from: "teach" }, direction: "audio-to-script" },
    ],
    masteryPolicy: { passThreshold: 0.85 },
    renderProfile: "isolated",
  },
  {
    id: 2, phase: 1, module: "1.1",
    title: "Meet Alif + Ba with Fatha",
    description: "Learn \u0627 and \u0628 with fatha and read the first real syllable: \u0628\u064E",
    teachEntityIds: ["letter:1", "letter:2", "combo:ba-fatha", "rule:fatha"],
    reviewEntityIds: [],
    exercisePlan: [
      { type: "tap", count: 2, target: "letter", source: { from: "teach" } },
      { type: "hear", count: 2, target: "letter", source: { from: "teach" }, direction: "audio-to-script" },
      { type: "choose", count: 3, target: "letter", source: { from: "teach" }, distractorStrategy: "shape" },
      { type: "read", count: 3, target: "combo", source: { from: "teach" }, connected: false },
    ],
    masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
    renderProfile: "isolated",
  },
  {
    id: 3, phase: 1, module: "1.1",
    title: "Meet Meem",
    description: "Add \u0645 and read \u0645\u064E / \u0628\u064E without guessing",
    teachEntityIds: ["letter:24", "combo:ma-fatha"],
    reviewEntityIds: ["letter:1", "letter:2", "combo:ba-fatha"],
    exercisePlan: [
      { type: "tap", count: 2, target: "letter", source: { from: "teach" } },
      { type: "hear", count: 2, target: "letter", source: { from: "mixed", mix: { teach: 1, review: 1 } }, direction: "audio-to-script" },
      { type: "choose", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, distractorStrategy: "vowel" },
      { type: "build", count: 2, target: "combo", source: { from: "teach" }, maxTiles: 4 },
      { type: "read", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, connected: false },
    ],
    masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
    renderProfile: "isolated",
  },
  {
    id: 4, phase: 1, module: "1.1",
    title: "Meet Laam",
    description: "Add \u0644 and expand the first readable set of symbols",
    teachEntityIds: ["letter:23", "combo:la-fatha"],
    reviewEntityIds: ["letter:2", "letter:24", "combo:ba-fatha", "combo:ma-fatha"],
    exercisePlan: [
      { type: "tap", count: 2, target: "letter", source: { from: "teach" } },
      { type: "hear", count: 2, target: "letter", source: { from: "mixed", mix: { teach: 1, review: 1 } }, direction: "audio-to-script" },
      { type: "choose", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, distractorStrategy: "vowel" },
      { type: "build", count: 2, target: "combo", source: { from: "teach" }, maxTiles: 4 },
      { type: "read", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, connected: false },
    ],
    masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
    renderProfile: "isolated",
  },
  {
    id: 5, phase: 1, module: "1.1",
    title: "First Decoding Sprint",
    description: "No new symbols \u2014 decode short CV chunks using known letters only",
    teachEntityIds: ["chunk:ba-ma", "chunk:la-ma", "chunk:ba-la"],
    reviewEntityIds: ["combo:ba-fatha", "combo:ma-fatha", "combo:la-fatha"],
    exercisePlan: [
      { type: "hear", count: 2, target: "chunk", source: { from: "teach" }, direction: "audio-to-script" },
      { type: "choose", count: 2, target: "combo", source: { from: "review" }, distractorStrategy: "vowel" },
      { type: "build", count: 3, target: "chunk", source: { from: "teach" }, maxTiles: 5 },
      { type: "read", count: 3, target: "chunk", source: { from: "mixed", mix: { teach: 2, review: 1 } }, connected: false },
    ],
    masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
    renderProfile: "isolated",
  },
  {
    id: 6, phase: 1, module: "1.1",
    title: "Meet Noon",
    description: "Add \u0646 and push the learner to hold a 5-letter working set",
    teachEntityIds: ["letter:25", "combo:noon-fatha"],
    reviewEntityIds: ["letter:2", "letter:24", "letter:23", "combo:ba-fatha", "combo:ma-fatha", "combo:la-fatha"],
    exercisePlan: [
      { type: "tap", count: 2, target: "letter", source: { from: "teach" } },
      { type: "hear", count: 2, target: "letter", source: { from: "mixed", mix: { teach: 1, review: 1 } }, direction: "audio-to-script" },
      { type: "choose", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, distractorStrategy: "vowel" },
      { type: "build", count: 2, target: "combo", source: { from: "teach" }, maxTiles: 4 },
      { type: "read", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, connected: false },
    ],
    masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
    renderProfile: "isolated",
  },
  {
    id: 8, phase: 1, module: "1.1",
    title: "Kasra Arrives",
    description: "Add kasra to known letters and distinguish ba/bi, ma/mi, la/li, na/ni",
    teachEntityIds: ["rule:kasra", "combo:ba-kasra", "combo:ma-kasra", "combo:la-kasra"],
    reviewEntityIds: ["combo:ba-fatha", "combo:ma-fatha", "combo:la-fatha"],
    exercisePlan: [
      { type: "hear", count: 2, target: "combo", source: { from: "teach" }, direction: "audio-to-script" },
      { type: "choose", count: 3, target: "combo", source: { from: "mixed", mix: { teach: 2, review: 1 } }, distractorStrategy: "vowel" },
      { type: "build", count: 2, target: "combo", source: { from: "teach" }, maxTiles: 4 },
      { type: "fix", count: 2, target: "vowel", source: { from: "mixed", mix: { teach: 1, review: 1 } } },
      { type: "read", count: 3, target: "combo", source: { from: "mixed", mix: { teach: 2, review: 1 } }, connected: false },
    ],
    masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
    renderProfile: "isolated",
  },
  {
    id: 7, phase: 1, module: "1.1",
    title: "Checkpoint 1: Tiny Chunks",
    description: "Confirm the learner can decode short unseen items, not merely tap familiar letters",
    // Checkpoint teaches nothing new — assesses Phase 1 accumulated inventory
    teachEntityIds: [],
    reviewEntityIds: ["letter:1", "letter:2", "letter:24", "letter:23", "combo:ba-fatha", "combo:ma-fatha", "combo:la-fatha", "chunk:ba-ma", "chunk:la-ma"],
    exercisePlan: [
      { type: "check", count: 10, target: "mixed", source: { from: "all" }, assessmentProfile: "phase-1-checkpoint" },
    ],
    masteryPolicy: { passThreshold: 0.9, decodePassRequired: 2, decodeMinPercent: 0.8 },
    renderProfile: "isolated",
  },

  // ── Phase 2: Three Short Vowels and Early Connected Forms ──

  {
    id: 9, phase: 2, module: "2.1", moduleTitle: "Three Short Vowels and Early Connected Forms",
    title: "Damma Arrives",
    description: "Add damma on known letters and complete the a/i/u short-vowel set",
    teachEntityIds: ["rule:damma", "combo:ba-damma", "combo:ma-damma", "combo:la-damma", "combo:noon-damma"],
    reviewEntityIds: ["combo:ba-fatha", "combo:ba-kasra", "combo:ma-fatha", "combo:ma-kasra"],
    exercisePlan: [
      { type: "hear", count: 2, target: "combo", source: { from: "teach" }, direction: "audio-to-script" },
      { type: "choose", count: 3, target: "combo", source: { from: "mixed", mix: { teach: 2, review: 1 } }, distractorStrategy: "vowel" },
      { type: "build", count: 2, target: "combo", source: { from: "teach" }, maxTiles: 4 },
      { type: "fix", count: 2, target: "vowel", source: { from: "mixed", mix: { teach: 1, review: 1 } } },
      { type: "read", count: 3, target: "combo", source: { from: "mixed", mix: { teach: 2, review: 1 } }, connected: false },
    ],
    masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
    renderProfile: "isolated",
  },
  {
    id: 10, phase: 2, module: "2.1",
    title: "Short-Vowel Contrast Drill",
    description: "Drill fatha vs kasra vs damma until the learner stops guessing by shape alone",
    teachEntityIds: [],
    reviewEntityIds: [
      "combo:ba-fatha", "combo:ba-kasra", "combo:ba-damma",
      "combo:ma-fatha", "combo:ma-kasra", "combo:ma-damma",
      "combo:la-fatha", "combo:la-kasra", "combo:la-damma",
      "combo:noon-fatha", "combo:noon-kasra", "combo:noon-damma",
    ],
    exercisePlan: [
      { type: "hear", count: 2, target: "combo", source: { from: "review" }, direction: "audio-to-script" },
      { type: "choose", count: 4, target: "combo", source: { from: "review" }, distractorStrategy: "vowel" },
      { type: "fix", count: 2, target: "vowel", source: { from: "review" } },
      { type: "read", count: 4, target: "combo", source: { from: "review" }, connected: false },
    ],
    masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
    renderProfile: "isolated",
  },
  {
    id: 11, phase: 2, module: "2.2",
    title: "Meet Yaa",
    description: "Teach \u064A as a consonant first, without introducing long ee yet",
    teachEntityIds: ["letter:28", "combo:ya-fatha", "combo:ya-kasra", "combo:ya-damma"],
    reviewEntityIds: ["letter:2", "letter:25", "combo:ba-fatha", "combo:noon-kasra"],
    exercisePlan: [
      { type: "tap", count: 2, target: "letter", source: { from: "teach" } },
      { type: "hear", count: 2, target: "letter", source: { from: "mixed", mix: { teach: 1, review: 1 } }, direction: "audio-to-script" },
      { type: "choose", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, distractorStrategy: "vowel" },
      { type: "build", count: 2, target: "combo", source: { from: "teach" }, maxTiles: 4 },
      { type: "read", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, connected: false },
    ],
    masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
    renderProfile: "isolated",
  },
  {
    id: 12, phase: 2, module: "2.2",
    title: "Meet Haa (\u0647)",
    description: "Add \u0647 and broaden simple decoding capacity",
    teachEntityIds: ["letter:26", "combo:ha-fatha", "combo:ha-kasra", "combo:ha-damma"],
    reviewEntityIds: ["letter:28", "combo:ya-fatha", "combo:ba-damma"],
    exercisePlan: [
      { type: "tap", count: 2, target: "letter", source: { from: "teach" } },
      { type: "hear", count: 2, target: "letter", source: { from: "mixed", mix: { teach: 1, review: 1 } }, direction: "audio-to-script" },
      { type: "choose", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, distractorStrategy: "vowel" },
      { type: "build", count: 2, target: "combo", source: { from: "teach" }, maxTiles: 4 },
      { type: "read", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, connected: false },
    ],
    masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
    renderProfile: "isolated",
  },

  {
    id: 13, phase: 2, module: "2.2",
    title: "Known Letters in Connected Form",
    description: "Show the already-known letters joined in real connected strings",
    teachEntityIds: ["chunk:bml", "chunk:nml", "chunk:yml"],
    reviewEntityIds: ["combo:ba-fatha", "combo:ma-fatha", "combo:la-fatha", "combo:noon-fatha", "combo:ya-fatha"],
    exercisePlan: [
      // Tap: recognize familiar letters in their connected shapes
      { type: "tap", count: 2, target: "letter", source: { from: "review" } },
      // Choose: pick the correct connected chunk from similar options
      { type: "choose", count: 3, target: "chunk", source: { from: "teach" } },
      // Build: assemble connected chunks from combo tiles
      { type: "build", count: 3, target: "chunk", source: { from: "teach" }, maxTiles: 5 },
      // Read: decode connected strings — the real shift
      { type: "read", count: 4, target: "chunk", source: { from: "teach" }, connected: true },
    ],
    masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
    renderProfile: "connected",
  },
  {
    id: 14, phase: 2, module: "2.2",
    title: "Alif Breaks the Chain",
    description: "Teach non-connecting behavior through reading, not typography trivia",
    teachEntityIds: ["chunk:abn", "chunk:bab", "chunk:hab"],
    reviewEntityIds: ["chunk:bml", "chunk:yml", "combo:alif-fatha", "combo:ha-fatha"],
    exercisePlan: [
      // Choose: which letter breaks the chain? Alif is the only non-connector known.
      // The learner sees connected chunks and identifies alif as the break point.
      { type: "choose", count: 2, target: "letter", source: { from: "explicit", entityIds: ["letter:1"] }, distractorStrategy: "shape" },
      // Choose: pick the chunk where the chain breaks correctly
      { type: "choose", count: 2, target: "chunk", source: { from: "teach" } },
      // Build: assemble chunks with alif chain-breaker — learner sees the gap
      { type: "build", count: 2, target: "chunk", source: { from: "teach" }, maxTiles: 5 },
      // Fix: spot incorrect joins (chain should break at alif but doesn't)
      { type: "fix", count: 2, target: "join", source: { from: "mixed", mix: { teach: 1, review: 1 } } },
      // Read: decode connected strings with alif chain-breaks — exit block
      { type: "read", count: 4, target: "chunk", source: { from: "mixed", mix: { teach: 2, review: 2 } }, connected: true },
    ],
    masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
    renderProfile: "connected",
  },

  {
    id: 15, phase: 2, module: "2.2",
    title: "Meet Seen",
    description: "Add \u0633 and increase useful readable combinations quickly",
    teachEntityIds: ["letter:12", "combo:seen-fatha", "combo:seen-kasra", "combo:seen-damma"],
    reviewEntityIds: ["letter:28", "letter:26", "combo:ya-fatha", "combo:ha-kasra"],
    exercisePlan: [
      { type: "tap", count: 2, target: "letter", source: { from: "teach" } },
      { type: "hear", count: 2, target: "letter", source: { from: "mixed", mix: { teach: 1, review: 1 } }, direction: "audio-to-script" },
      { type: "choose", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, distractorStrategy: "vowel" },
      { type: "build", count: 2, target: "combo", source: { from: "teach" }, maxTiles: 4 },
      { type: "read", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, connected: false },
    ],
    masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
    renderProfile: "isolated",
  },
  {
    id: 16, phase: 2, module: "2.2",
    title: "Meet Daal",
    description: "Add \u062F and teach another chain-breaker in context",
    teachEntityIds: ["letter:8", "combo:daal-fatha", "combo:daal-kasra", "combo:daal-damma"],
    reviewEntityIds: ["letter:12", "combo:seen-fatha", "combo:ba-damma"],
    exercisePlan: [
      { type: "tap", count: 2, target: "letter", source: { from: "teach" } },
      { type: "hear", count: 2, target: "letter", source: { from: "mixed", mix: { teach: 1, review: 1 } }, direction: "audio-to-script" },
      { type: "choose", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, distractorStrategy: "vowel" },
      { type: "build", count: 2, target: "combo", source: { from: "teach" }, maxTiles: 4 },
      // Fix: daal is a chain-breaker — learner spots join errors in connected context
      { type: "fix", count: 2, target: "join", source: { from: "teach" } },
      { type: "read", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, connected: true },
    ],
    masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
    renderProfile: "connected",
  },

  {
    id: 17, phase: 2, module: "2.3",
    title: "Sukun Arrives",
    description: "Introduce consonant stopping so the learner can read more Quran-like chunks",
    teachEntityIds: ["rule:sukun", "combo:seen-sukun", "combo:noon-sukun", "combo:ma-sukun", "chunk:bas", "chunk:min", "chunk:lam"],
    reviewEntityIds: ["combo:ba-fatha", "combo:ma-kasra", "combo:la-fatha", "combo:seen-fatha", "combo:noon-fatha"],
    exercisePlan: [
      // Hear the difference: sukun stops the sound
      { type: "hear", count: 2, target: "combo", source: { from: "teach" }, direction: "audio-to-script" },
      // Discriminate sukun vs voweled combos
      { type: "choose", count: 3, target: "combo", source: { from: "mixed", mix: { teach: 2, review: 1 } }, distractorStrategy: "vowel" },
      // Build CVC chunks with sukun
      { type: "build", count: 2, target: "chunk", source: { from: "teach" }, maxTiles: 5 },
      // Fix: spot wrong mark (sukun vs fatha/kasra/damma)
      { type: "fix", count: 2, target: "vowel", source: { from: "mixed", mix: { teach: 1, review: 1 } } },
      // Decode chunks — exit block (decodePassRequired: 2)
      { type: "read", count: 3, target: "chunk", source: { from: "teach" }, connected: false },
    ],
    masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
    renderProfile: "isolated",
  },

  // ── Phase 2 Checkpoint ──

  {
    id: 18, phase: 2, module: "2.4", moduleTitle: "Phase 2 Checkpoint",
    title: "Checkpoint 2: Early Connected Reading",
    description: "Assess connected chunks with short vowels and early sukun — do not unlock Phase 3 until the learner can handle connected reading",

    // Checkpoint teaches nothing new — it assesses the accumulated Phase 2 inventory.
    // All entities go in reviewEntityIds to avoid false mastery introductions.
    teachEntityIds: [],
    reviewEntityIds: [
      // Letters known by end of Phase 2
      "letter:1", "letter:2", "letter:24", "letter:23", "letter:25", "letter:28", "letter:26", "letter:12", "letter:8",
      // Connected chunks (L13-14)
      "chunk:bml", "chunk:nml", "chunk:yml", "chunk:abn", "chunk:bab", "chunk:hab",
      // Sukun chunks (L17)
      "chunk:bas", "chunk:min", "chunk:lam",
      // Key combos across all three vowels + sukun
      "combo:ba-fatha", "combo:ma-kasra", "combo:la-damma", "combo:noon-fatha",
      "combo:seen-fatha", "combo:daal-fatha", "combo:ya-kasra", "combo:ha-damma",
      "combo:seen-sukun", "combo:noon-sukun",
    ],

    exercisePlan: [
      // Single check step — the assessment profile controls the exercise mix
      { type: "check", count: 12, target: "mixed", source: { from: "all" }, assessmentProfile: "phase-2-checkpoint" },
    ],

    masteryPolicy: {
      passThreshold: 0.90,       // Stricter than normal lessons (85%)
      decodePassRequired: 3,     // Last 3 decode items must be correct
      decodeMinPercent: 0.80,    // 80% on read/decode items specifically
    },
    renderProfile: "connected",  // Assessment renders in connected script
  },
];
