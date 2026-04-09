import type { LessonV2 } from "@/src/types/curriculum-v2";

export const LESSONS_V2: LessonV2[] = [
  {
    id: 1, phase: 1, module: "1.1", moduleTitle: "First Real Decoding Wins",
    title: "Arabic Starts Here",
    description: "Learn how Arabic reads and meet your first two letters",
    teachEntityIds: ["letter:1", "letter:2"],
    reviewEntityIds: [],
    teachingSequence: [
      // ── Screen 1: Arabic reads right to left ──
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u2190",
          text: "Arabic is read from right to left \u2014 the opposite of English. Every word, every line, starts from the right side.",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "letter:1",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // ── Screen 2: Meet Alif ──
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0627",
          text: "This is Alif \u2014 the first letter of the Arabic alphabet.\n\nIt\u2019s a tall, straight line. Alif makes a long \"aa\" sound, like the \u2018a\u2019 in \u2018father.\u2019",
          audioKey: "letter_1",
          hintText: "audio:letter_name_1",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "letter:1",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // ── Screen 3: Meet Ba ──
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0628",
          text: "This is Ba \u2014 the second letter.\n\nNotice the single dot below \u2014 that\u2019s how you know it\u2019s Ba. It makes a \"b\" sound, just like \u2018book.\u2019",
          audioKey: "letter_2",
          hintText: "audio:letter_name_2",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "letter:2",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // ── Screen 4: Side by side with 4 audio buttons ──
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0628    \u0627",
          text: "Here they are together \u2014 Alif and Ba.\n\nTap the buttons below to hear each letter\u2019s name and sound.",
        },
        options: [
          { id: "L1-side-alif-name", audioKey: "letter_name_1", displayText: "Alif Name", isCorrect: false },
          { id: "L1-side-alif-sound", audioKey: "letter_1", displayText: "Alif Sound", isCorrect: false },
          { id: "L1-side-ba-name", audioKey: "letter_name_2", displayText: "Ba Name", isCorrect: false },
          { id: "L1-side-ba-sound", audioKey: "letter_2", displayText: "Ba Sound", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "letter:1",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // ── Quiz 1: Tap Alif (name → shape) ──
      {
        type: "tap",
        prompt: {
          arabicDisplay: "",
          text: "Tap the letter Alif",
        },
        options: [
          { id: "L1-q1-opt-ba", displayArabic: "\u0628", isCorrect: false },
          { id: "L1-q1-opt-alif", displayArabic: "\u0627", isCorrect: true },
        ],
        correctAnswer: { kind: "single", value: "L1-q1-opt-alif" },
        targetEntityId: "letter:1",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // ── Quiz 2: Tap Ba (name → shape) ──
      {
        type: "tap",
        prompt: {
          arabicDisplay: "",
          text: "Tap the letter Ba",
        },
        options: [
          { id: "L1-q2-opt-alif", displayArabic: "\u0627", isCorrect: false },
          { id: "L1-q2-opt-ba", displayArabic: "\u0628", isCorrect: true },
        ],
        correctAnswer: { kind: "single", value: "L1-q2-opt-ba" },
        targetEntityId: "letter:2",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // ── Quiz 3: Listen for Ba (sound → shape) ──
      {
        type: "hear",
        prompt: {
          arabicDisplay: "",
          audioKey: "letter_2",
          text: "Listen to this sound. Which letter makes it?",
        },
        options: [
          { id: "L1-q3-opt-alif", displayArabic: "\u0627", isCorrect: false },
          { id: "L1-q3-opt-ba", displayArabic: "\u0628", isCorrect: true },
        ],
        correctAnswer: { kind: "single", value: "L1-q3-opt-ba" },
        targetEntityId: "letter:2",
        isDecodeItem: false,
        answerMode: "audio",
      },
      // ── Quiz 4: Listen for Alif (sound → shape) ──
      {
        type: "hear",
        prompt: {
          arabicDisplay: "",
          audioKey: "letter_1",
          text: "Listen to this sound. Which letter makes it?",
        },
        options: [
          { id: "L1-q4-opt-ba", displayArabic: "\u0628", isCorrect: false },
          { id: "L1-q4-opt-alif", displayArabic: "\u0627", isCorrect: true },
        ],
        correctAnswer: { kind: "single", value: "L1-q4-opt-alif" },
        targetEntityId: "letter:1",
        isDecodeItem: false,
        answerMode: "audio",
      },
      // ── Quiz 5: What letter is this? (shape → name) — Alif ──
      {
        type: "choose",
        prompt: {
          arabicDisplay: "\u0627",
          text: "What letter is this?",
        },
        options: [
          { id: "L1-q5-opt-alif", displayText: "Alif", isCorrect: true },
          { id: "L1-q5-opt-ba", displayText: "Ba", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L1-q5-opt-alif" },
        targetEntityId: "letter:1",
        isDecodeItem: false,
        answerMode: "transliteration",
      },
      // ── Quiz 6: What letter is this? (shape → name) — Ba ──
      {
        type: "choose",
        prompt: {
          arabicDisplay: "\u0628",
          text: "What letter is this?",
        },
        options: [
          { id: "L1-q6-opt-ba", displayText: "Ba", isCorrect: true },
          { id: "L1-q6-opt-alif", displayText: "Alif", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L1-q6-opt-ba" },
        targetEntityId: "letter:2",
        isDecodeItem: false,
        answerMode: "transliteration",
      },
    ],
    exercisePlan: [],
    masteryPolicy: { passThreshold: 0.75 },
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
    teachingSequence: [
      // Present: Meet Meem
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0645",
          text: "This is Meem",
          audioKey: "letter_24",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "letter:24",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Present: Meem + Fatha combo
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0645\u064E",
          text: "Meem with fatha makes \u2018ma\u2019",
          audioKey: "combo_ma-fatha",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "combo:ma-fatha",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Guided tap: Find Meem
      {
        type: "tap",
        prompt: { arabicDisplay: "\u0645", text: "Find Meem" },
        options: [
          { id: "L3-tap-opt-meem", displayArabic: "\u0645", isCorrect: true },
          { id: "L3-tap-opt-ba", displayArabic: "\u0628", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L3-tap-opt-meem" },
        targetEntityId: "letter:24",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Guided hear: ma-fatha sound
      {
        type: "hear",
        prompt: {
          arabicDisplay: "",
          audioKey: "combo_ma-fatha",
          text: "Listen \u2014 which one is it?",
        },
        options: [
          { id: "L3-hear-opt-ma", displayArabic: "\u0645\u064E", isCorrect: true },
          { id: "L3-hear-opt-ba", displayArabic: "\u0628\u064E", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L3-hear-opt-ma" },
        targetEntityId: "combo:ma-fatha",
        isDecodeItem: false,
        answerMode: "audio",
      },
    ],
    exercisePlan: [
      { type: "choose", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, distractorStrategy: "vowel" },
      { type: "build", count: 2, target: "combo", source: { from: "teach" }, maxTiles: 4 },
    ],
    exitSequence: [
      // Decode exit: read ma-fatha (easy — new letter)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0645\u064E", text: "What does this say?" },
        options: [
          { id: "L3-exit1-opt-ma", displayText: "ma", isCorrect: true },
          { id: "L3-exit1-opt-ba", displayText: "ba", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L3-exit1-opt-ma" },
        targetEntityId: "combo:ma-fatha",
        isDecodeItem: true,
        answerMode: "transliteration",
      },
      // Decode exit: read ba-fatha (review)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0628\u064E", text: "What does this say?" },
        options: [
          { id: "L3-exit2-opt-ba", displayText: "ba", isCorrect: true },
          { id: "L3-exit2-opt-ma", displayText: "ma", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L3-exit2-opt-ba" },
        targetEntityId: "combo:ba-fatha",
        isDecodeItem: true,
        answerMode: "transliteration",
      },
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
    teachingSequence: [
      // Present: Meet Laam
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0644",
          text: "This is Laam",
          audioKey: "letter_23",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "letter:23",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Present: Laam + Fatha combo
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0644\u064E",
          text: "Laam with fatha makes \u2018la\u2019",
          audioKey: "combo_la-fatha",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "combo:la-fatha",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Guided tap: Find Laam
      {
        type: "tap",
        prompt: { arabicDisplay: "\u0644", text: "Find Laam" },
        options: [
          { id: "L4-tap-opt-laam", displayArabic: "\u0644", isCorrect: true },
          { id: "L4-tap-opt-meem", displayArabic: "\u0645", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L4-tap-opt-laam" },
        targetEntityId: "letter:23",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Guided hear: la-fatha sound (3 options)
      {
        type: "hear",
        prompt: {
          arabicDisplay: "",
          audioKey: "combo_la-fatha",
          text: "Listen \u2014 which one is it?",
        },
        options: [
          { id: "L4-hear-opt-la", displayArabic: "\u0644\u064E", isCorrect: true },
          { id: "L4-hear-opt-ma", displayArabic: "\u0645\u064E", isCorrect: false },
          { id: "L4-hear-opt-ba", displayArabic: "\u0628\u064E", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L4-hear-opt-la" },
        targetEntityId: "combo:la-fatha",
        isDecodeItem: false,
        answerMode: "audio",
      },
    ],
    exercisePlan: [
      { type: "choose", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, distractorStrategy: "vowel" },
      { type: "build", count: 2, target: "combo", source: { from: "teach" }, maxTiles: 4 },
    ],
    exitSequence: [
      // Decode exit: read la-fatha (easy — new letter)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0644\u064E", text: "What does this say?" },
        options: [
          { id: "L4-exit1-opt-la", displayText: "la", isCorrect: true },
          { id: "L4-exit1-opt-ma", displayText: "ma", isCorrect: false },
          { id: "L4-exit1-opt-ba", displayText: "ba", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L4-exit1-opt-la" },
        targetEntityId: "combo:la-fatha",
        isDecodeItem: true,
        answerMode: "transliteration",
      },
      // Decode exit: read ma-fatha (review)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0645\u064E", text: "What does this say?" },
        options: [
          { id: "L4-exit2-opt-ma", displayText: "ma", isCorrect: true },
          { id: "L4-exit2-opt-la", displayText: "la", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L4-exit2-opt-ma" },
        targetEntityId: "combo:ma-fatha",
        isDecodeItem: true,
        answerMode: "transliteration",
      },
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
    teachingSequence: [
      // Choose: Which combination is بَمَ?
      {
        type: "choose",
        prompt: {
          arabicDisplay: "\u0628\u064E\u0645\u064E",
          text: "Which combination is this?",
        },
        options: [
          { id: "L5-teach1-opt-bama", displayArabic: "\u0628\u064E\u0645\u064E", isCorrect: true },
          { id: "L5-teach1-opt-lama", displayArabic: "\u0644\u064E\u0645\u064E", isCorrect: false },
          { id: "L5-teach1-opt-bala", displayArabic: "\u0628\u064E\u0644\u064E", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L5-teach1-opt-bama" },
        targetEntityId: "chunk:ba-ma",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Choose: Which combination is لَمَ?
      {
        type: "choose",
        prompt: {
          arabicDisplay: "\u0644\u064E\u0645\u064E",
          text: "Which combination is this?",
        },
        options: [
          { id: "L5-teach2-opt-lama", displayArabic: "\u0644\u064E\u0645\u064E", isCorrect: true },
          { id: "L5-teach2-opt-bama", displayArabic: "\u0628\u064E\u0645\u064E", isCorrect: false },
          { id: "L5-teach2-opt-bala", displayArabic: "\u0628\u064E\u0644\u064E", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L5-teach2-opt-lama" },
        targetEntityId: "chunk:la-ma",
        isDecodeItem: false,
        answerMode: "arabic",
      },
    ],
    exercisePlan: [
      { type: "hear", count: 2, target: "combo", source: { from: "review" }, direction: "audio-to-script" },
      { type: "build", count: 2, target: "chunk", source: { from: "teach" }, maxTiles: 5 },
      { type: "read", count: 2, target: "chunk", source: { from: "mixed", mix: { teach: 1, review: 1 } }, connected: false },
    ],
    exitSequence: [
      // Decode exit: بَمَ (easy chunk)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0628\u064E\u0645\u064E", text: "What does this say?" },
        options: [
          { id: "L5-exit1-opt-bama", displayText: "bama", isCorrect: true },
          { id: "L5-exit1-opt-lama", displayText: "lama", isCorrect: false },
          { id: "L5-exit1-opt-bala", displayText: "bala", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L5-exit1-opt-bama" },
        targetEntityId: "chunk:ba-ma",
        isDecodeItem: true,
        answerMode: "transliteration",
      },
      // Decode exit: بَلَ (harder chunk)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0628\u064E\u0644\u064E", text: "What does this say?" },
        options: [
          { id: "L5-exit2-opt-bala", displayText: "bala", isCorrect: true },
          { id: "L5-exit2-opt-bama", displayText: "bama", isCorrect: false },
          { id: "L5-exit2-opt-lama", displayText: "lama", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L5-exit2-opt-bala" },
        targetEntityId: "chunk:ba-la",
        isDecodeItem: true,
        answerMode: "transliteration",
      },
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
    teachingSequence: [
      // Present: Meet Noon
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0646",
          text: "This is Noon",
          audioKey: "letter_25",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "letter:25",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Present: Noon + Fatha combo
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0646\u064E",
          text: "Noon with fatha makes \u2018na\u2019",
          audioKey: "combo_noon-fatha",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "combo:noon-fatha",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Guided tap: Find Noon (dot-family confusion target vs ba)
      {
        type: "tap",
        prompt: { arabicDisplay: "\u0646", text: "Find Noon" },
        options: [
          { id: "L6-tap-opt-noon", displayArabic: "\u0646", isCorrect: true },
          { id: "L6-tap-opt-ba", displayArabic: "\u0628", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L6-tap-opt-noon" },
        targetEntityId: "letter:25",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Guided hear: noon-fatha sound (3 options)
      {
        type: "hear",
        prompt: {
          arabicDisplay: "",
          audioKey: "combo_noon-fatha",
          text: "Listen \u2014 which one is it?",
        },
        options: [
          { id: "L6-hear-opt-na", displayArabic: "\u0646\u064E", isCorrect: true },
          { id: "L6-hear-opt-ba", displayArabic: "\u0628\u064E", isCorrect: false },
          { id: "L6-hear-opt-ma", displayArabic: "\u0645\u064E", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L6-hear-opt-na" },
        targetEntityId: "combo:noon-fatha",
        isDecodeItem: false,
        answerMode: "audio",
      },
    ],
    exercisePlan: [
      { type: "choose", count: 2, target: "letter", source: { from: "mixed", mix: { teach: 1, review: 1 } }, distractorStrategy: "shape" },
      { type: "build", count: 2, target: "combo", source: { from: "teach" }, maxTiles: 4 },
    ],
    exitSequence: [
      // Decode exit: read noon-fatha (easy — new letter)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0646\u064E", text: "What does this say?" },
        options: [
          { id: "L6-exit1-opt-na", displayText: "na", isCorrect: true },
          { id: "L6-exit1-opt-ba", displayText: "ba", isCorrect: false },
          { id: "L6-exit1-opt-ma", displayText: "ma", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L6-exit1-opt-na" },
        targetEntityId: "combo:noon-fatha",
        isDecodeItem: true,
        answerMode: "transliteration",
      },
      // Decode exit: read la-fatha (review)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0644\u064E", text: "What does this say?" },
        options: [
          { id: "L6-exit2-opt-la", displayText: "la", isCorrect: true },
          { id: "L6-exit2-opt-na", displayText: "na", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L6-exit2-opt-la" },
        targetEntityId: "combo:la-fatha",
        isDecodeItem: true,
        answerMode: "transliteration",
      },
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
    teachingSequence: [
      // Confidence opener — scored item, not a present
      {
        type: "choose",
        prompt: { arabicDisplay: "\u0628\u064E", text: "You know this one" },
        options: [
          { id: "L7-opener-opt-ba", displayText: "ba", isCorrect: true },
          { id: "L7-opener-opt-ma", displayText: "ma", isCorrect: false },
          { id: "L7-opener-opt-la", displayText: "la", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L7-opener-opt-ba" },
        targetEntityId: "combo:ba-fatha",
        isDecodeItem: false,
        answerMode: "transliteration",
      },
    ],
    exercisePlan: [
      { type: "check", count: 7, target: "mixed", source: { from: "all" }, assessmentProfile: "phase-1-checkpoint" },
    ],
    exitSequence: [
      // Decode gate 1: بَ (combo, easy)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0628\u064E", text: "What does this say?" },
        options: [
          { id: "L7-exit1-opt-ba", displayText: "ba", isCorrect: true },
          { id: "L7-exit1-opt-ma", displayText: "ma", isCorrect: false },
          { id: "L7-exit1-opt-la", displayText: "la", isCorrect: false },
          { id: "L7-exit1-opt-na", displayText: "na", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L7-exit1-opt-ba" },
        targetEntityId: "combo:ba-fatha",
        isDecodeItem: true,
        answerMode: "transliteration",
      },
      // Decode gate 2: بَمَ (chunk ba-ma)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0628\u064E\u0645\u064E", text: "What does this say?" },
        options: [
          { id: "L7-exit2-opt-bama", displayText: "bama", isCorrect: true },
          { id: "L7-exit2-opt-lama", displayText: "lama", isCorrect: false },
          { id: "L7-exit2-opt-bala", displayText: "bala", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L7-exit2-opt-bama" },
        targetEntityId: "chunk:ba-ma",
        isDecodeItem: true,
        answerMode: "transliteration",
      },
    ],
    masteryPolicy: { passThreshold: 0.9, decodePassRequired: 2, decodeMinPercent: 0.8 },
    renderProfile: "isolated",
  },
  {
    id: 8, phase: 1, module: "1.1",
    title: "Kasra Arrives",
    description: "Add kasra to known letters and distinguish ba/bi, ma/mi, la/li",
    teachEntityIds: ["rule:kasra", "combo:ba-kasra", "combo:ma-kasra", "combo:la-kasra"],
    reviewEntityIds: ["combo:ba-fatha", "combo:ma-fatha", "combo:la-fatha"],
    teachingSequence: [
      // Present: Kasra mark
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0650",
          text: "This mark below a letter makes an \u2018i\u2019 sound",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "rule:kasra",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Present: Ba + Kasra
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0628\u0650",
          text: "Ba with kasra makes \u2018bi\u2019",
          audioKey: "combo_ba-kasra",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "combo:ba-kasra",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Minimal-pair choose: Which one says 'bi'?
      {
        type: "choose",
        prompt: {
          arabicDisplay: "",
          audioKey: "combo_ba-kasra",
          text: "Which one says \u2018bi\u2019?",
        },
        options: [
          { id: "L8-pair-opt-ba", displayArabic: "\u0628\u064E", audioKey: "combo_ba-fatha", isCorrect: false },
          { id: "L8-pair-opt-bi", displayArabic: "\u0628\u0650", audioKey: "combo_ba-kasra", isCorrect: true },
        ],
        correctAnswer: { kind: "single", value: "L8-pair-opt-bi" },
        targetEntityId: "combo:ba-kasra",
        isDecodeItem: false,
        answerMode: "audio",
      },
    ],
    exercisePlan: [
      { type: "choose", count: 3, target: "combo", source: { from: "mixed", mix: { teach: 2, review: 1 } }, distractorStrategy: "vowel" },
      { type: "fix", count: 2, target: "vowel", source: { from: "mixed", mix: { teach: 1, review: 1 } } },
    ],
    exitSequence: [
      // Exit 1: بِ (easy win)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0628\u0650", text: "What does this say?" },
        options: [
          { id: "L8-exit1-opt-bi", audioKey: "combo_ba-kasra", displayText: "bi", isCorrect: true },
          { id: "L8-exit1-opt-ba", audioKey: "combo_ba-fatha", displayText: "ba", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L8-exit1-opt-bi" },
        targetEntityId: "combo:ba-kasra",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Exit 2: مِ vs مَ contrast
      {
        type: "read",
        prompt: { arabicDisplay: "\u0645\u0650", text: "What does this say?" },
        options: [
          { id: "L8-exit2-opt-mi", audioKey: "combo_ma-kasra", displayText: "mi", isCorrect: true },
          { id: "L8-exit2-opt-ma", audioKey: "combo_ma-fatha", displayText: "ma", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L8-exit2-opt-mi" },
        targetEntityId: "combo:ma-kasra",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Exit 3: لِ
      {
        type: "read",
        prompt: { arabicDisplay: "\u0644\u0650", text: "What does this say?" },
        options: [
          { id: "L8-exit3-opt-li", audioKey: "combo_la-kasra", displayText: "li", isCorrect: true },
          { id: "L8-exit3-opt-la", audioKey: "combo_la-fatha", displayText: "la", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L8-exit3-opt-li" },
        targetEntityId: "combo:la-kasra",
        isDecodeItem: true,
        answerMode: "audio",
      },
    ],
    masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
    renderProfile: "isolated",
  },

  // ── Phase 2: Three Short Vowels and Early Connected Forms ──

  {
    id: 9, phase: 2, module: "2.1", moduleTitle: "Three Short Vowels and Early Connected Forms",
    title: "Damma Arrives",
    description: "Add damma on known letters and complete the a/i/u short-vowel set",
    teachEntityIds: ["rule:damma", "combo:ba-damma", "combo:ma-damma", "combo:la-damma", "combo:noon-damma"],
    reviewEntityIds: ["combo:ba-fatha", "combo:ba-kasra", "combo:ma-fatha", "combo:ma-kasra"],
    teachingSequence: [
      // Present: Damma mark
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u064F",
          text: "This curl above a letter makes a \u2018u\u2019 sound",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "rule:damma",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Present: Ba + Damma
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0628\u064F",
          text: "Ba with damma makes \u2018bu\u2019",
          audioKey: "combo_ba-damma",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "combo:ba-damma",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Minimal-pair choose: Which one says 'bu'? (all three vowels now known)
      {
        type: "choose",
        prompt: {
          arabicDisplay: "",
          audioKey: "combo_ba-damma",
          text: "Which one says \u2018bu\u2019?",
        },
        options: [
          { id: "L9-pair-opt-ba", displayArabic: "\u0628\u064E", audioKey: "combo_ba-fatha", isCorrect: false },
          { id: "L9-pair-opt-bi", displayArabic: "\u0628\u0650", audioKey: "combo_ba-kasra", isCorrect: false },
          { id: "L9-pair-opt-bu", displayArabic: "\u0628\u064F", audioKey: "combo_ba-damma", isCorrect: true },
        ],
        correctAnswer: { kind: "single", value: "L9-pair-opt-bu" },
        targetEntityId: "combo:ba-damma",
        isDecodeItem: false,
        answerMode: "audio",
      },
    ],
    exercisePlan: [
      { type: "choose", count: 3, target: "combo", source: { from: "mixed", mix: { teach: 2, review: 1 } }, distractorStrategy: "vowel" },
      { type: "fix", count: 2, target: "vowel", source: { from: "mixed", mix: { teach: 1, review: 1 } } },
    ],
    exitSequence: [
      // Exit 1: بُ (easy)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0628\u064F", text: "What does this say?" },
        options: [
          { id: "L9-exit1-opt-bu", audioKey: "combo_ba-damma", displayText: "bu", isCorrect: true },
          { id: "L9-exit1-opt-ba", audioKey: "combo_ba-fatha", displayText: "ba", isCorrect: false },
          { id: "L9-exit1-opt-bi", audioKey: "combo_ba-kasra", displayText: "bi", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L9-exit1-opt-bu" },
        targetEntityId: "combo:ba-damma",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Exit 2: مُ vs مِ contrast
      {
        type: "read",
        prompt: { arabicDisplay: "\u0645\u064F", text: "What does this say?" },
        options: [
          { id: "L9-exit2-opt-mu", audioKey: "combo_ma-damma", displayText: "mu", isCorrect: true },
          { id: "L9-exit2-opt-mi", audioKey: "combo_ma-kasra", displayText: "mi", isCorrect: false },
          { id: "L9-exit2-opt-ma", audioKey: "combo_ma-fatha", displayText: "ma", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L9-exit2-opt-mu" },
        targetEntityId: "combo:ma-damma",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Exit 3: نُ
      {
        type: "read",
        prompt: { arabicDisplay: "\u0646\u064F", text: "What does this say?" },
        options: [
          { id: "L9-exit3-opt-nu", audioKey: "combo_noon-damma", displayText: "nu", isCorrect: true },
          { id: "L9-exit3-opt-na", audioKey: "combo_noon-fatha", displayText: "na", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L9-exit3-opt-nu" },
        targetEntityId: "combo:noon-damma",
        isDecodeItem: true,
        answerMode: "audio",
      },
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
    teachingSequence: [
      // Minimal-pair 1: Which one says 'ba'?
      {
        type: "choose",
        prompt: {
          arabicDisplay: "",
          audioKey: "combo_ba-fatha",
          text: "Which one says \u2018ba\u2019?",
        },
        options: [
          { id: "L10-pair1-opt-ba", displayArabic: "\u0628\u064E", audioKey: "combo_ba-fatha", isCorrect: true },
          { id: "L10-pair1-opt-bi", displayArabic: "\u0628\u0650", audioKey: "combo_ba-kasra", isCorrect: false },
          { id: "L10-pair1-opt-bu", displayArabic: "\u0628\u064F", audioKey: "combo_ba-damma", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L10-pair1-opt-ba" },
        targetEntityId: "combo:ba-fatha",
        isDecodeItem: false,
        answerMode: "audio",
      },
      // Minimal-pair 2: Which one says 'mi'?
      {
        type: "choose",
        prompt: {
          arabicDisplay: "",
          audioKey: "combo_ma-kasra",
          text: "Which one says \u2018mi\u2019?",
        },
        options: [
          { id: "L10-pair2-opt-ma", displayArabic: "\u0645\u064E", audioKey: "combo_ma-fatha", isCorrect: false },
          { id: "L10-pair2-opt-mi", displayArabic: "\u0645\u0650", audioKey: "combo_ma-kasra", isCorrect: true },
          { id: "L10-pair2-opt-mu", displayArabic: "\u0645\u064F", audioKey: "combo_ma-damma", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L10-pair2-opt-mi" },
        targetEntityId: "combo:ma-kasra",
        isDecodeItem: false,
        answerMode: "audio",
      },
      // Minimal-pair 3: Which one says 'lu'?
      {
        type: "choose",
        prompt: {
          arabicDisplay: "",
          audioKey: "combo_la-damma",
          text: "Which one says \u2018lu\u2019?",
        },
        options: [
          { id: "L10-pair3-opt-la", displayArabic: "\u0644\u064E", audioKey: "combo_la-fatha", isCorrect: false },
          { id: "L10-pair3-opt-li", displayArabic: "\u0644\u0650", audioKey: "combo_la-kasra", isCorrect: false },
          { id: "L10-pair3-opt-lu", displayArabic: "\u0644\u064F", audioKey: "combo_la-damma", isCorrect: true },
        ],
        correctAnswer: { kind: "single", value: "L10-pair3-opt-lu" },
        targetEntityId: "combo:la-damma",
        isDecodeItem: false,
        answerMode: "audio",
      },
    ],
    exercisePlan: [
      { type: "hear", count: 2, target: "combo", source: { from: "review" }, direction: "audio-to-script" },
    ],
    exitSequence: [
      // Exit 1: بَ (easy single combo)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0628\u064E", text: "What does this say?" },
        options: [
          { id: "L10-exit1-opt-ba", audioKey: "combo_ba-fatha", displayText: "ba", isCorrect: true },
          { id: "L10-exit1-opt-bi", audioKey: "combo_ba-kasra", displayText: "bi", isCorrect: false },
          { id: "L10-exit1-opt-bu", audioKey: "combo_ba-damma", displayText: "bu", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L10-exit1-opt-ba" },
        targetEntityId: "combo:ba-fatha",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Exit 2: مِ (kasra)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0645\u0650", text: "What does this say?" },
        options: [
          { id: "L10-exit2-opt-mi", audioKey: "combo_ma-kasra", displayText: "mi", isCorrect: true },
          { id: "L10-exit2-opt-ma", audioKey: "combo_ma-fatha", displayText: "ma", isCorrect: false },
          { id: "L10-exit2-opt-mu", audioKey: "combo_ma-damma", displayText: "mu", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L10-exit2-opt-mi" },
        targetEntityId: "combo:ma-kasra",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Exit 3: لُ (damma)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0644\u064F", text: "What does this say?" },
        options: [
          { id: "L10-exit3-opt-lu", audioKey: "combo_la-damma", displayText: "lu", isCorrect: true },
          { id: "L10-exit3-opt-la", audioKey: "combo_la-fatha", displayText: "la", isCorrect: false },
          { id: "L10-exit3-opt-li", audioKey: "combo_la-kasra", displayText: "li", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L10-exit3-opt-lu" },
        targetEntityId: "combo:la-damma",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Exit 4: نَ (mixed review)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0646\u064E", text: "What does this say?" },
        options: [
          { id: "L10-exit4-opt-na", audioKey: "combo_noon-fatha", displayText: "na", isCorrect: true },
          { id: "L10-exit4-opt-ni", audioKey: "combo_noon-kasra", displayText: "ni", isCorrect: false },
          { id: "L10-exit4-opt-nu", audioKey: "combo_noon-damma", displayText: "nu", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L10-exit4-opt-na" },
        targetEntityId: "combo:noon-fatha",
        isDecodeItem: true,
        answerMode: "audio",
      },
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
    teachingSequence: [
      // Present: Meet Yaa
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u064A",
          text: "This is Yaa",
          audioKey: "letter_28",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "letter:28",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Present: Yaa + Fatha
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u064A\u064E",
          text: "Yaa with fatha makes \u2018ya\u2019",
          audioKey: "combo_ya-fatha",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "combo:ya-fatha",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Guided tap: Find Yaa
      {
        type: "tap",
        prompt: { arabicDisplay: "\u064A", text: "Find Yaa" },
        options: [
          { id: "L11-tap-opt-yaa", displayArabic: "\u064A", isCorrect: true },
          { id: "L11-tap-opt-noon", displayArabic: "\u0646", isCorrect: false },
          { id: "L11-tap-opt-ba", displayArabic: "\u0628", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L11-tap-opt-yaa" },
        targetEntityId: "letter:28",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Guided hear: ya-fatha sound
      {
        type: "hear",
        prompt: {
          arabicDisplay: "",
          audioKey: "combo_ya-fatha",
          text: "Listen \u2014 which one is it?",
        },
        options: [
          { id: "L11-hear-opt-ya", displayArabic: "\u064A\u064E", isCorrect: true },
          { id: "L11-hear-opt-ba", displayArabic: "\u0628\u064E", isCorrect: false },
          { id: "L11-hear-opt-ni", displayArabic: "\u0646\u0650", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L11-hear-opt-ya" },
        targetEntityId: "combo:ya-fatha",
        isDecodeItem: false,
        answerMode: "audio",
      },
    ],
    exercisePlan: [
      { type: "choose", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, distractorStrategy: "vowel" },
      { type: "build", count: 2, target: "combo", source: { from: "teach" }, maxTiles: 4 },
    ],
    exitSequence: [
      // Exit 1: يَ (ya-fatha)
      {
        type: "read",
        prompt: { arabicDisplay: "\u064A\u064E", text: "What does this say?" },
        options: [
          { id: "L11-exit1-opt-ya", audioKey: "combo_ya-fatha", displayText: "ya", isCorrect: true },
          { id: "L11-exit1-opt-ba", audioKey: "combo_ba-fatha", displayText: "ba", isCorrect: false },
          { id: "L11-exit1-opt-na", audioKey: "combo_noon-fatha", displayText: "na", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L11-exit1-opt-ya" },
        targetEntityId: "combo:ya-fatha",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Exit 2: يِ (ya-kasra)
      {
        type: "read",
        prompt: { arabicDisplay: "\u064A\u0650", text: "What does this say?" },
        options: [
          { id: "L11-exit2-opt-yi", audioKey: "combo_ya-kasra", displayText: "yi", isCorrect: true },
          { id: "L11-exit2-opt-ya", audioKey: "combo_ya-fatha", displayText: "ya", isCorrect: false },
          { id: "L11-exit2-opt-yu", audioKey: "combo_ya-damma", displayText: "yu", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L11-exit2-opt-yi" },
        targetEntityId: "combo:ya-kasra",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Exit 3: يُ (ya-damma)
      {
        type: "read",
        prompt: { arabicDisplay: "\u064A\u064F", text: "What does this say?" },
        options: [
          { id: "L11-exit3-opt-yu", audioKey: "combo_ya-damma", displayText: "yu", isCorrect: true },
          { id: "L11-exit3-opt-yi", audioKey: "combo_ya-kasra", displayText: "yi", isCorrect: false },
          { id: "L11-exit3-opt-ya", audioKey: "combo_ya-fatha", displayText: "ya", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L11-exit3-opt-yu" },
        targetEntityId: "combo:ya-damma",
        isDecodeItem: true,
        answerMode: "audio",
      },
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
    teachingSequence: [
      // Present: Meet Haa
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0647",
          text: "This is Haa",
          audioKey: "letter_26",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "letter:26",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Present: Haa + Fatha
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0647\u064E",
          text: "Haa with fatha makes \u2018ha\u2019",
          audioKey: "combo_ha-fatha",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "combo:ha-fatha",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Guided tap: Find Haa
      {
        type: "tap",
        prompt: { arabicDisplay: "\u0647", text: "Find Haa" },
        options: [
          { id: "L12-tap-opt-haa", displayArabic: "\u0647", isCorrect: true },
          { id: "L12-tap-opt-yaa", displayArabic: "\u064A", isCorrect: false },
          { id: "L12-tap-opt-noon", displayArabic: "\u0646", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L12-tap-opt-haa" },
        targetEntityId: "letter:26",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Guided hear: ha-fatha sound
      {
        type: "hear",
        prompt: {
          arabicDisplay: "",
          audioKey: "combo_ha-fatha",
          text: "Listen \u2014 which one is it?",
        },
        options: [
          { id: "L12-hear-opt-ha", displayArabic: "\u0647\u064E", isCorrect: true },
          { id: "L12-hear-opt-ya", displayArabic: "\u064A\u064E", isCorrect: false },
          { id: "L12-hear-opt-ba", displayArabic: "\u0628\u064F", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L12-hear-opt-ha" },
        targetEntityId: "combo:ha-fatha",
        isDecodeItem: false,
        answerMode: "audio",
      },
    ],
    exercisePlan: [
      { type: "choose", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, distractorStrategy: "vowel" },
      { type: "build", count: 2, target: "combo", source: { from: "teach" }, maxTiles: 4 },
    ],
    exitSequence: [
      // Exit 1: هَ (ha-fatha)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0647\u064E", text: "What does this say?" },
        options: [
          { id: "L12-exit1-opt-ha", audioKey: "combo_ha-fatha", displayText: "ha", isCorrect: true },
          { id: "L12-exit1-opt-ya", audioKey: "combo_ya-fatha", displayText: "ya", isCorrect: false },
          { id: "L12-exit1-opt-ba", audioKey: "combo_ba-fatha", displayText: "ba", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L12-exit1-opt-ha" },
        targetEntityId: "combo:ha-fatha",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Exit 2: هِ (ha-kasra)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0647\u0650", text: "What does this say?" },
        options: [
          { id: "L12-exit2-opt-hi", audioKey: "combo_ha-kasra", displayText: "hi", isCorrect: true },
          { id: "L12-exit2-opt-ha", audioKey: "combo_ha-fatha", displayText: "ha", isCorrect: false },
          { id: "L12-exit2-opt-hu", audioKey: "combo_ha-damma", displayText: "hu", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L12-exit2-opt-hi" },
        targetEntityId: "combo:ha-kasra",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Exit 3: هُ (ha-damma)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0647\u064F", text: "What does this say?" },
        options: [
          { id: "L12-exit3-opt-hu", audioKey: "combo_ha-damma", displayText: "hu", isCorrect: true },
          { id: "L12-exit3-opt-hi", audioKey: "combo_ha-kasra", displayText: "hi", isCorrect: false },
          { id: "L12-exit3-opt-ha", audioKey: "combo_ha-fatha", displayText: "ha", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L12-exit3-opt-hu" },
        targetEntityId: "combo:ha-damma",
        isDecodeItem: true,
        answerMode: "audio",
      },
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
    teachingSequence: [
      // Present: Meet Seen
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0633",
          text: "This is Seen",
          audioKey: "letter_12",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "letter:12",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Present: Seen + Fatha
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0633\u064E",
          text: "Seen with fatha makes \u2018sa\u2019",
          audioKey: "combo_seen-fatha",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "combo:seen-fatha",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Guided tap: Find Seen
      {
        type: "tap",
        prompt: { arabicDisplay: "\u0633", text: "Find Seen" },
        options: [
          { id: "L15-tap-opt-seen", displayArabic: "\u0633", isCorrect: true },
          { id: "L15-tap-opt-yaa", displayArabic: "\u064A", isCorrect: false },
          { id: "L15-tap-opt-noon", displayArabic: "\u0646", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L15-tap-opt-seen" },
        targetEntityId: "letter:12",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Guided hear: seen-fatha sound
      {
        type: "hear",
        prompt: {
          arabicDisplay: "",
          audioKey: "combo_seen-fatha",
          text: "Listen \u2014 which one is it?",
        },
        options: [
          { id: "L15-hear-opt-sa", displayArabic: "\u0633\u064E", isCorrect: true },
          { id: "L15-hear-opt-ya", displayArabic: "\u064A\u064E", isCorrect: false },
          { id: "L15-hear-opt-hi", displayArabic: "\u0647\u0650", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L15-hear-opt-sa" },
        targetEntityId: "combo:seen-fatha",
        isDecodeItem: false,
        answerMode: "audio",
      },
    ],
    exercisePlan: [
      { type: "choose", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, distractorStrategy: "vowel" },
      { type: "build", count: 2, target: "combo", source: { from: "teach" }, maxTiles: 4 },
    ],
    exitSequence: [
      // Exit 1: سَ (seen-fatha)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0633\u064E", text: "What does this say?" },
        options: [
          { id: "L15-exit1-opt-sa", audioKey: "combo_seen-fatha", displayText: "sa", isCorrect: true },
          { id: "L15-exit1-opt-ya", audioKey: "combo_ya-fatha", displayText: "ya", isCorrect: false },
          { id: "L15-exit1-opt-ha", audioKey: "combo_ha-fatha", displayText: "ha", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L15-exit1-opt-sa" },
        targetEntityId: "combo:seen-fatha",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Exit 2: سِ (seen-kasra)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0633\u0650", text: "What does this say?" },
        options: [
          { id: "L15-exit2-opt-si", audioKey: "combo_seen-kasra", displayText: "si", isCorrect: true },
          { id: "L15-exit2-opt-sa", audioKey: "combo_seen-fatha", displayText: "sa", isCorrect: false },
          { id: "L15-exit2-opt-su", audioKey: "combo_seen-damma", displayText: "su", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L15-exit2-opt-si" },
        targetEntityId: "combo:seen-kasra",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Exit 3: سُ (seen-damma)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0633\u064F", text: "What does this say?" },
        options: [
          { id: "L15-exit3-opt-su", audioKey: "combo_seen-damma", displayText: "su", isCorrect: true },
          { id: "L15-exit3-opt-si", audioKey: "combo_seen-kasra", displayText: "si", isCorrect: false },
          { id: "L15-exit3-opt-sa", audioKey: "combo_seen-fatha", displayText: "sa", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L15-exit3-opt-su" },
        targetEntityId: "combo:seen-damma",
        isDecodeItem: true,
        answerMode: "audio",
      },
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
    teachingSequence: [
      // Present: Meet Daal
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u062F",
          text: "This is Daal",
          audioKey: "letter_8",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "letter:8",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Present: Daal + Fatha
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u062F\u064E",
          text: "Daal with fatha makes \u2018da\u2019",
          audioKey: "combo_daal-fatha",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "combo:daal-fatha",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Guided tap: Find Daal
      {
        type: "tap",
        prompt: { arabicDisplay: "\u062F", text: "Find Daal" },
        options: [
          { id: "L16-tap-opt-daal", displayArabic: "\u062F", isCorrect: true },
          { id: "L16-tap-opt-seen", displayArabic: "\u0633", isCorrect: false },
          { id: "L16-tap-opt-ba", displayArabic: "\u0628", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L16-tap-opt-daal" },
        targetEntityId: "letter:8",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Guided hear: daal-fatha sound
      {
        type: "hear",
        prompt: {
          arabicDisplay: "",
          audioKey: "combo_daal-fatha",
          text: "Listen \u2014 which one is it?",
        },
        options: [
          { id: "L16-hear-opt-da", displayArabic: "\u062F\u064E", isCorrect: true },
          { id: "L16-hear-opt-sa", displayArabic: "\u0633\u064E", isCorrect: false },
          { id: "L16-hear-opt-ba", displayArabic: "\u0628\u064E", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L16-hear-opt-da" },
        targetEntityId: "combo:daal-fatha",
        isDecodeItem: false,
        answerMode: "audio",
      },
      // Present: Chain-break behavior
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u062F\u064E",
          arabicDisplayAlt: "Daal doesn\u2019t connect to the next letter \u2014 like alif, it breaks the chain",
          text: "Daal doesn\u2019t connect to the next letter \u2014 like alif, it breaks the chain",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "letter:8",
        isDecodeItem: false,
        answerMode: "arabic",
      },
    ],
    exercisePlan: [
      { type: "choose", count: 2, target: "combo", source: { from: "mixed", mix: { teach: 1, review: 1 } }, distractorStrategy: "vowel" },
      { type: "build", count: 2, target: "combo", source: { from: "teach" }, maxTiles: 4 },
    ],
    exitSequence: [
      // Exit 1: دَ (daal-fatha, easy)
      {
        type: "read",
        prompt: { arabicDisplay: "\u062F\u064E", text: "What does this say?" },
        options: [
          { id: "L16-exit1-opt-da", audioKey: "combo_daal-fatha", displayText: "da", isCorrect: true },
          { id: "L16-exit1-opt-sa", audioKey: "combo_seen-fatha", displayText: "sa", isCorrect: false },
          { id: "L16-exit1-opt-ba", audioKey: "combo_ba-fatha", displayText: "ba", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L16-exit1-opt-da" },
        targetEntityId: "combo:daal-fatha",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Exit 2: دِ (daal-kasra)
      {
        type: "read",
        prompt: { arabicDisplay: "\u062F\u0650", text: "What does this say?" },
        options: [
          { id: "L16-exit2-opt-di", audioKey: "combo_daal-kasra", displayText: "di", isCorrect: true },
          { id: "L16-exit2-opt-da", audioKey: "combo_daal-fatha", displayText: "da", isCorrect: false },
          { id: "L16-exit2-opt-du", audioKey: "combo_daal-damma", displayText: "du", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L16-exit2-opt-di" },
        targetEntityId: "combo:daal-kasra",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Exit 3: دُ (daal-damma)
      {
        type: "read",
        prompt: { arabicDisplay: "\u062F\u064F", text: "What does this say?" },
        options: [
          { id: "L16-exit3-opt-du", audioKey: "combo_daal-damma", displayText: "du", isCorrect: true },
          { id: "L16-exit3-opt-di", audioKey: "combo_daal-kasra", displayText: "di", isCorrect: false },
          { id: "L16-exit3-opt-da", audioKey: "combo_daal-fatha", displayText: "da", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L16-exit3-opt-du" },
        targetEntityId: "combo:daal-damma",
        isDecodeItem: true,
        answerMode: "audio",
      },
    ],
    masteryPolicy: { passThreshold: 0.85, decodePassRequired: 2 },
    renderProfile: "connected",
  },

  {
    id: 17, phase: 2, module: "2.3",
    title: "Sukun Arrives",
    description: "Introduce consonant stopping so the learner can read CVC chunks like bas, min, lam",
    teachEntityIds: ["rule:sukun", "combo:seen-sukun", "combo:noon-sukun", "combo:ma-sukun", "chunk:bas", "chunk:min", "chunk:lam"],
    reviewEntityIds: ["combo:ba-fatha", "combo:ma-kasra", "combo:la-fatha", "combo:seen-fatha", "combo:noon-fatha"],
    teachingSequence: [
      // Present: Introduce the sukun mark
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0652",
          text: "This circle means stop. No vowel sound.",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "rule:sukun",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Present: Sound vs stop contrast — seen-fatha vs seen-sukun
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0633\u064E",
          arabicDisplayAlt: "\u0633\u0652",
          text: "Fatha keeps the sound going. Sukun stops it.",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "combo:seen-sukun",
        isDecodeItem: false,
        answerMode: "arabic",
      },
      // Choose: Minimal-pair — which one stops?
      {
        type: "choose",
        prompt: {
          arabicDisplay: "",
          audioKey: "combo_seen-sukun",
          text: "Which one stops?",
        },
        options: [
          { id: "L17-pair-opt-sf", displayArabic: "\u0633\u064E", audioKey: "combo_seen-fatha", isCorrect: false },
          { id: "L17-pair-opt-ss", displayArabic: "\u0633\u0652", audioKey: "combo_seen-sukun", isCorrect: true },
        ],
        correctAnswer: { kind: "single", value: "L17-pair-opt-ss" },
        targetEntityId: "combo:seen-sukun",
        isDecodeItem: false,
        answerMode: "audio",
      },
      // Present: CVC introduction — bas
      {
        type: "present",
        prompt: {
          arabicDisplay: "\u0628\u064E\u0633\u0652",
          text: "Ba says \u2018ba\u2019, seen stops: \u2018bas\u2019",
          audioKey: "chunk_bas",
        },
        correctAnswer: { kind: "single", value: "none" },
        targetEntityId: "chunk:bas",
        isDecodeItem: false,
        answerMode: "arabic",
      },
    ],
    exercisePlan: [
      { type: "build", count: 2, target: "chunk", source: { from: "teach" }, maxTiles: 5 },
      { type: "fix", count: 2, target: "vowel", source: { from: "mixed", mix: { teach: 1, review: 1 } } },
    ],
    exitSequence: [
      // Exit 1: بَسْ (bas)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0628\u064E\u0633\u0652", text: "What does this say?" },
        options: [
          { id: "L17-exit1-opt-bas", audioKey: "chunk_bas", displayText: "bas", isCorrect: true },
          { id: "L17-exit1-opt-min", audioKey: "chunk_min", displayText: "min", isCorrect: false },
          { id: "L17-exit1-opt-lam", audioKey: "chunk_lam", displayText: "lam", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L17-exit1-opt-bas" },
        targetEntityId: "chunk:bas",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Exit 2: مِنْ (min)
      {
        type: "read",
        prompt: { arabicDisplay: "\u0645\u0650\u0646\u0652", text: "What does this say?" },
        options: [
          { id: "L17-exit2-opt-min", audioKey: "chunk_min", displayText: "min", isCorrect: true },
          { id: "L17-exit2-opt-bas", audioKey: "chunk_bas", displayText: "bas", isCorrect: false },
          { id: "L17-exit2-opt-lam", audioKey: "chunk_lam", displayText: "lam", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L17-exit2-opt-min" },
        targetEntityId: "chunk:min",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Exit 3: لَمْ (lam) — connected form to bridge toward L18
      {
        type: "read",
        prompt: { arabicDisplay: "\u0644\u064E\u0645\u0652", text: "What does this say?" },
        options: [
          { id: "L17-exit3-opt-lam", audioKey: "chunk_lam", displayText: "lam", isCorrect: true },
          { id: "L17-exit3-opt-min", audioKey: "chunk_min", displayText: "min", isCorrect: false },
          { id: "L17-exit3-opt-bas", audioKey: "chunk_bas", displayText: "bas", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L17-exit3-opt-lam" },
        targetEntityId: "chunk:lam",
        isDecodeItem: true,
        answerMode: "audio",
      },
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

    teachingSequence: [
      // Confidence opener — easy connected read
      {
        type: "read",
        prompt: { arabicDisplay: "\u0628\u064E\u0645\u064E\u0644\u064E", text: "You know this one" },
        options: [
          { id: "L18-opener-opt-bml", audioKey: "chunk_bml", displayText: "bamala", isCorrect: true },
          { id: "L18-opener-opt-nml", audioKey: "chunk_nml", displayText: "namala", isCorrect: false },
          { id: "L18-opener-opt-yml", audioKey: "chunk_yml", displayText: "yamala", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L18-opener-opt-bml" },
        targetEntityId: "chunk:bml",
        isDecodeItem: false,
        answerMode: "audio",
      },
    ],

    exercisePlan: [
      { type: "check", count: 8, target: "mixed", source: { from: "all" }, assessmentProfile: "phase-2-checkpoint" },
    ],

    exitSequence: [
      // Decode gate 1: نَمَلَ (namala) — connected chunk
      {
        type: "read",
        prompt: { arabicDisplay: "\u0646\u064E\u0645\u064E\u0644\u064E", text: "Final reading check" },
        options: [
          { id: "L18-exit1-opt-nml", audioKey: "chunk_nml", displayText: "namala", isCorrect: true },
          { id: "L18-exit1-opt-bml", audioKey: "chunk_bml", displayText: "bamala", isCorrect: false },
          { id: "L18-exit1-opt-yml", audioKey: "chunk_yml", displayText: "yamala", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L18-exit1-opt-nml" },
        targetEntityId: "chunk:nml",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Decode gate 2: بَابَ (baba) — chain-break
      {
        type: "read",
        prompt: { arabicDisplay: "\u0628\u064E\u0627\u0628\u064E", text: "Final reading check" },
        options: [
          { id: "L18-exit2-opt-bab", audioKey: "chunk_bab", displayText: "baba", isCorrect: true },
          { id: "L18-exit2-opt-hab", audioKey: "chunk_hab", displayText: "haba", isCorrect: false },
          { id: "L18-exit2-opt-abn", audioKey: "chunk_abn", displayText: "abana", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L18-exit2-opt-bab" },
        targetEntityId: "chunk:bab",
        isDecodeItem: true,
        answerMode: "audio",
      },
      // Decode gate 3: مِنْ (min) — sukun chunk
      {
        type: "read",
        prompt: { arabicDisplay: "\u0645\u0650\u0646\u0652", text: "Final reading check" },
        options: [
          { id: "L18-exit3-opt-min", audioKey: "chunk_min", displayText: "min", isCorrect: true },
          { id: "L18-exit3-opt-bas", audioKey: "chunk_bas", displayText: "bas", isCorrect: false },
          { id: "L18-exit3-opt-lam", audioKey: "chunk_lam", displayText: "lam", isCorrect: false },
        ],
        correctAnswer: { kind: "single", value: "L18-exit3-opt-min" },
        targetEntityId: "chunk:min",
        isDecodeItem: true,
        answerMode: "audio",
      },
    ],

    masteryPolicy: {
      passThreshold: 0.90,
      decodePassRequired: 3,
      decodeMinPercent: 0.80,
    },
    renderProfile: "connected",
  },
];
