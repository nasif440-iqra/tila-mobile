// src/types/question.ts

export interface QuestionOption {
  id: number | string;       // number for letters, string for harakat combos
  label: string;             // display text
  isCorrect: boolean;        // exactly one true per question
  sublabel?: string;         // sound hint (only on makeSoundOpts options)
}

export interface Question {
  type: string;              // "tap", "find", "name_to_letter", "audio_to_letter", etc.
  targetId: number | string; // target letter/combo ID
  options: QuestionOption[]; // always array, always >= 2 items
  prompt?: string;           // question text (optional if hasAudio is true)
  promptSubtext?: string;    // secondary prompt (letter_to_name, letter_to_sound)
  hasAudio?: boolean;        // audio playback question
  optionMode?: string;       // "sound" for letter_to_sound
  isHarakat?: boolean;       // harakat-specific flag
  isConfusionQ?: boolean;    // confusion-based question (sound.js)
  explanation?: string;      // pre-computed wrong-answer explanation
  // Internal recycling fields (set by lesson runner, not generators)
  _recycled?: boolean;
  _recycleCount?: number;
}
