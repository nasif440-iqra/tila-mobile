import type { LessonV2 } from "@/src/types/curriculum-v2";

export const LESSONS_V2: LessonV2[] = [
  {
    id: 1, phase: 1, module: "1.1", moduleTitle: "First Real Decoding Wins",
    title: "Arabic Starts Here",
    description: "Orient to right-to-left reading and meet your first two letters",
    teachEntityIds: ["letter:1", "letter:2"],
    reviewEntityIds: [],
    teachingSequence: [
      // Present: Meet Alif
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0627",
          text: "This is Alif \u2014 the first letter of Arabic",
          audioKey: "letter_1",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "letter:1",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Present: Meet Ba
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0628",
          text: "This is Ba",
          audioKey: "letter_2",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "letter:2",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Guided tap: Find Ba
      {
        type: "tap",
        prompt: {
          arabicDisplay: "\u0628",
          text: "Find Ba",
        },
        options: [
          { id: "L1-tap-opt-alif", displayArabic: "\u0627", isCorrect: false },
          { id: "L1-tap-opt-ba", displayArabic: "\u0628", isCorrect: true },
        ],
        correctAnswer: { kind: "single", value: "L1-tap-opt-ba" },
        targetEntityId: "letter:2",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Guided hear: Listen for Ba
      {
        type: "hear",
        prompt: {
          arabicDisplay: "",
          audioKey: "letter_2",
          text: "Listen \u2014 which one is it?",
        },
        options: [
          { id: "L1-hear-opt-alif", displayArabic: "\u0627", isCorrect: false },
          { id: "L1-hear-opt-ba", displayArabic: "\u0628", isCorrect: true },
        ],
        correctAnswer: { kind: "single", value: "L1-hear-opt-ba" },
        targetEntityId: "letter:2",
        isDecodeItem: false,
        answerMode: "audio",
      },
    ],
    exercisePlan: [],
    masteryPolicy: { passThreshold: 0.5 },
    renderProfile: "isolated",
  },
  {
    id: 2, phase: 1, module: "1.1",
    title: "Meet Alif + Ba with Fatha",
    description: "Learn \u0627 and \u0628 with fatha and read the first real syllable",
    teachEntityIds: ["letter:1", "letter:2", "combo:ba-fatha", "rule:fatha"],
    reviewEntityIds: [],
    teachingSequence: [
      // Present: Fatha mark
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u064E",
          text: "This mark makes an \u2018a\u2019 sound",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "rule:fatha",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Present: Ba + Fatha combo
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0628\u064E",
          text: "Ba with fatha makes \u2018ba\u2019",
          audioKey: "combo_ba-fatha",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "combo:ba-fatha",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Guided tap: Find Ba
      {
        type: "tap",
        prompt: { arabicDisplay: "\u0628", text: "Find Ba" },
        options: [
          { id: "L2-tap-opt-alif", displayArabic: "\u0627", isCorrect: false },
          { id: "L2-tap-opt-ba", displayArabic: "\u0628", isCorrect: true },
        ],
        correctAnswer: { kind: "single", value: "L2-tap-opt-ba" },
        targetEntityId: "letter:2",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Guided hear: Ba-fatha sound
      {
        type: "hear",
        prompt: {
          arabicDisplay: "",
          audioKey: "combo_ba-fatha",
          text: "Listen \u2014 which one is it?",
        },
        options: [
          { id: "L2-hear-opt-alif", displayArabic: "\u0627\u064E", isCorrect: false },
          { id: "L2-hear-opt-ba", displayArabic: "\u0628\u064E", isCorrect: true },
        ],
        correctAnswer: { kind: "single", value: "L2-hear-opt-ba" },
        targetEntityId: "combo:ba-fatha",
        isDecodeItem: false,
        answerMode: "audio",
      },
    ],
    exercisePlan: [
      { type: "choose", count: 2, target: "letter", source: { from: "teach" }, distractorStrategy: "shape" },
      { type: "read", count: 1, target: "combo", source: { from: "teach" }, connected: false },
    ],
    exitSequence: [
      // Decode exit: read ba-fatha
      {
        type: "read",
        prompt: { arabicDisplay: "\u0628\u064E", text: "What does this say?" },
        options: [
          { id: "L2-exit-opt-ba", displayText: "ba", isCorrect: true },
          { id: "L2-exit-opt-ma", displayText: "ma", isCorrect: false },
          { id: "L2-exit-opt-la", displayText: "la", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L2-exit-opt-ba" },
        targetEntityId: "combo:ba-fatha",
        isDecodeItem: true,
        answerMode: "transliteration",
      },
      // Decode exit: read alif-fatha
      {
        type: "read",
        prompt: { arabicDisplay: "\u0627\u064E", text: "What does this say?" },
        options: [
          { id: "L2-exit2-opt-a", displayText: "a", isCorrect: true },
          { id: "L2-exit2-opt-ba", displayText: "ba", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L2-exit2-opt-a" },
        targetEntityId: "letter:1",
        isDecodeItem: true,
        answerMode: "transliteration",
      },
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
    teachingSequence: [
      // Present: Bridge reveal 1 — connected بَمَلَ with spaced isolated alt
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0628\u064E\u0645\u064E\u0644\u064E",
          arabicDisplayAlt: "\u0628\u064E  \u0645\u064E  \u0644\u064E",
          text: "Same letters, same sounds, new shape",
          audioKey: "chunk_bml",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "chunk:bml",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Present: Bridge reveal 2 — connected نَمَلَ with spaced isolated alt
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0646\u064E\u0645\u064E\u0644\u064E",
          arabicDisplayAlt: "\u0646\u064E  \u0645\u064E  \u0644\u064E",
          text: "Same letters, same sounds, new shape",
          audioKey: "chunk_nml",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "chunk:nml",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Guided recognition: Find Ba inside connected بَمَلَ
      {
        type: "tap",
        prompt: {
          arabicDisplay: "\u0628\u064E\u0645\u064E\u0644\u064E",
          text: "Find Ba inside this word",
        },
        options: [
          { id: "L13-tap-opt-ba", displayArabic: "\u0628", isCorrect: true },
          { id: "L13-tap-opt-meem", displayArabic: "\u0645", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L13-tap-opt-ba" },
        targetEntityId: "letter:2",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Connected→isolated decomposition: Which letters make up بَمَلَ?
      {
        type: "choose",
        prompt: {
          arabicDisplay: "\u0628\u064E\u0645\u064E\u0644\u064E",
          text: "Which letters make up this word?",
        },
        options: [
          { id: "L13-decomp-opt-bml", displayText: "\u0628\u064E \u0645\u064E \u0644\u064E", isCorrect: true },
          { id: "L13-decomp-opt-nml", displayText: "\u0646\u064E \u0645\u064E \u0644\u064E", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L13-decomp-opt-bml" },
        targetEntityId: "chunk:bml",
        isDecodeItem: false,
        answerMode: "arabic",
      },
    ],
    exercisePlan: [
      { type: "build", count: 2, target: "chunk", source: { from: "teach" }, maxTiles: 5 },
    ],
    exitSequence: [
      // Exit 1: بَمَلَ (easy — just saw it in bridge)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0628\u064E\u0645\u064E\u0644\u064E", text: "What does this say?" },
        options: [
          { id: "L13-exit1-opt-bml", audioKey: "chunk_bml", displayText: "bamala", isCorrect: true },
          { id: "L13-exit1-opt-nml", audioKey: "chunk_nml", displayText: "namala", isCorrect: false },
          { id: "L13-exit1-opt-yml", audioKey: "chunk_yml", displayText: "yamala", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L13-exit1-opt-bml" },
        targetEntityId: "chunk:bml",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Exit 2: نَمَلَ (medium — second bridge chunk)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0646\u064E\u0645\u064E\u0644\u064E", text: "What does this say?" },
        options: [
          { id: "L13-exit2-opt-nml", audioKey: "chunk_nml", displayText: "namala", isCorrect: true },
          { id: "L13-exit2-opt-bml", audioKey: "chunk_bml", displayText: "bamala", isCorrect: false },
          { id: "L13-exit2-opt-yml", audioKey: "chunk_yml", displayText: "yamala", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L13-exit2-opt-nml" },
        targetEntityId: "chunk:nml",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Exit 3: يَمَلَ (hard — new combination)
      {
        type: "read",
        prompt: { arabicDisplay: "\u064A\u064E\u0645\u064E\u0644\u064E", text: "What does this say?" },
        options: [
          { id: "L13-exit3-opt-yml", audioKey: "chunk_yml", displayText: "yamala", isCorrect: true },
          { id: "L13-exit3-opt-bml", audioKey: "chunk_bml", displayText: "bamala", isCorrect: false },
          { id: "L13-exit3-opt-nml", audioKey: "chunk_nml", displayText: "namala", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L13-exit3-opt-yml" },
        targetEntityId: "chunk:yml",
        isDecodeItem: true,
        answerMode: "audio",
      },
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
    teachingSequence: [
      // Present: Bridge reveal — fully connected vs chain-break contrast
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0628\u064E\u0645\u064E\u0644\u064E",
          arabicDisplayAlt: "\u0628\u064E\u0627\u0628\u064E",
          text: "Most letters hold hands. Alif lets go.",
          audioKey: "chunk_bab",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "chunk:bab",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Present: Second bridge — another chain-break word
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0647\u064E\u0627\u0628\u064E",
          text: "Another word where alif breaks the chain",
          audioKey: "chunk_hab",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "chunk:hab",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Gap contrast: Which word has a gap?
      {
        type: "choose",
        prompt: {
          arabicDisplay: "",
          text: "Which word has a gap?",
        },
        options: [
          { id: "L14-gap-opt-bab", displayArabic: "\u0628\u064E\u0627\u0628\u064E", isCorrect: true },
          { id: "L14-gap-opt-bml", displayArabic: "\u0628\u064E\u0645\u064E\u0644\u064E", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L14-gap-opt-bab" },
        targetEntityId: "chunk:bab",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Wider contrast: Which word starts with alif?
      {
        type: "choose",
        prompt: {
          arabicDisplay: "",
          text: "Which word starts with alif?",
        },
        options: [
          { id: "L14-wider-opt-abn", displayArabic: "\u0627\u064E\u0628\u064E\u0646\u064E", isCorrect: true },
          { id: "L14-wider-opt-bab", displayArabic: "\u0628\u064E\u0627\u0628\u064E", isCorrect: false },
          { id: "L14-wider-opt-bml", displayArabic: "\u0628\u064E\u0645\u064E\u0644\u064E", isCorrect: false },
          { id: "L14-wider-opt-hab", displayArabic: "\u0647\u064E\u0627\u0628\u064E", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L14-wider-opt-abn" },
        targetEntityId: "chunk:abn",
        isDecodeItem: false,
        answerMode: "arabic",
      },
    ],
    exercisePlan: [
      { type: "build", count: 2, target: "chunk", source: { from: "teach" }, maxTiles: 5 },
    ],
    exitSequence: [
      // Exit 1: بَابَ (familiar from bridge)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0628\u064E\u0627\u0628\u064E", text: "What does this say?" },
        options: [
          { id: "L14-exit1-opt-bab", audioKey: "chunk_bab", displayText: "baba", isCorrect: true },
          { id: "L14-exit1-opt-abn", audioKey: "chunk_abn", displayText: "abana", isCorrect: false },
          { id: "L14-exit1-opt-bml", audioKey: "chunk_bml", displayText: "bamala", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L14-exit1-opt-bab" },
        targetEntityId: "chunk:bab",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Exit 2: اَبَنَ (new chain-break combo)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0627\u064E\u0628\u064E\u0646\u064E", text: "What does this say?" },
        options: [
          { id: "L14-exit2-opt-abn", audioKey: "chunk_abn", displayText: "abana", isCorrect: true },
          { id: "L14-exit2-opt-bab", audioKey: "chunk_bab", displayText: "baba", isCorrect: false },
          { id: "L14-exit2-opt-hab", audioKey: "chunk_hab", displayText: "haba", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L14-exit2-opt-abn" },
        targetEntityId: "chunk:abn",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Exit 3: هَابَ (second bridge chunk)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0647\u064E\u0627\u0628\u064E", text: "What does this say?" },
        options: [
          { id: "L14-exit3-opt-hab", audioKey: "chunk_hab", displayText: "haba", isCorrect: true },
          { id: "L14-exit3-opt-bab", audioKey: "chunk_bab", displayText: "baba", isCorrect: false },
          { id: "L14-exit3-opt-abn", audioKey: "chunk_abn", displayText: "abana", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L14-exit3-opt-hab" },
        targetEntityId: "chunk:hab",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Exit 4: بَمَلَ (fully connected review)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0628\u064E\u0645\u064E\u0644\u064E", text: "What does this say?" },
        options: [
          { id: "L14-exit4-opt-bml", audioKey: "chunk_bml", displayText: "bamala", isCorrect: true },
          { id: "L14-exit4-opt-nml", audioKey: "chunk_nml", displayText: "namala", isCorrect: false },
          { id: "L14-exit4-opt-bab", audioKey: "chunk_bab", displayText: "baba", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L14-exit4-opt-bml" },
        targetEntityId: "chunk:bml",
        isDecodeItem: true,
        answerMode: "audio",
      },
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
      // Choose: daal combos in connected context — learner sees daal doesn't connect forward
      { type: "choose", count: 2, target: "combo", source: { from: "teach" }, distractorStrategy: "vowel" },
      // Read: decode daal combos in connected rendering — exit block
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
