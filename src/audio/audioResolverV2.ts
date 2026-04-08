import { playLetterSound, playLetterName } from "./player";

// ── Audio Resolve Result ──

export interface AudioResolveResult {
  type: "bundled" | "placeholder";
  play?: () => Promise<void>;
}

// ── resolveAudio ──
//
// Maps an audio key to either a bundled sound function or a placeholder.
// Key formats:
//   letter_<id>         → play the letter sound (e.g. "letter_2" → ba)
//   letter_name_<id>    → play the letter name (e.g. "letter_name_2" → baa)
// Everything else is a placeholder until more audio assets are added.

export async function resolveAudio(key: string): Promise<AudioResolveResult> {
  if (key.startsWith("letter_name_")) {
    const letterId = parseInt(key.replace("letter_name_", ""), 10);
    if (!isNaN(letterId) && letterId >= 1 && letterId <= 28) {
      return {
        type: "bundled",
        play: async () => {
          playLetterName(letterId);
        },
      };
    }
  }

  if (key.startsWith("letter_")) {
    const letterId = parseInt(key.replace("letter_", ""), 10);
    if (!isNaN(letterId) && letterId >= 1 && letterId <= 28) {
      return {
        type: "bundled",
        play: async () => {
          playLetterSound(letterId);
        },
      };
    }
  }

  // Combos, chunks, words, phrases — placeholder until assets are added
  return { type: "placeholder" };
}
