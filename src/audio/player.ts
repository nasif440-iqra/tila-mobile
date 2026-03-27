import { setAudioModeAsync, type AudioSource } from "expo-audio";

// ── Audio session configuration ──

let audioSessionConfigured = false;

export async function configureAudioSession(): Promise<void> {
  if (audioSessionConfigured) return;
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
  });
  audioSessionConfigured = true;
}

// ── Asset map for bundled SFX ──

const SFX_ASSETS = {
  correct: require("../../assets/audio/effects/correct.wav"),
  wrong: require("../../assets/audio/effects/wrong.wav"),
  button_tap: require("../../assets/audio/effects/button_tap.wav"),
  lesson_start: require("../../assets/audio/effects/lesson_start.wav"),
  lesson_complete: require("../../assets/audio/effects/lesson_complete.mp3"),
  lesson_complete_perfect: require("../../assets/audio/effects/lesson_complete_perfect.mp3"),
  phase_complete: require("../../assets/audio/effects/phase_complete.wav"),
  phase_unlock: require("../../assets/audio/effects/phase_unlock.wav"),
  mid_lesson_celebration: require("../../assets/audio/effects/mid_lesson_celebration.wav"),
  streak_tier1: require("../../assets/audio/effects/streak_tier1.wav"),
  streak_tier2: require("../../assets/audio/effects/streak_tier2.wav"),
  streak_tier3: require("../../assets/audio/effects/streak_tier3.wav"),
  onboarding_complete: require("../../assets/audio/effects/onboarding_complete.wav"),
  onboarding_advance: require("../../assets/audio/effects/onboarding_advance.wav"),
  lesson_node_tap: require("../../assets/audio/effects/lesson_node_tap.wav"),
  audio_play_button: require("../../assets/audio/effects/audio_play_button.wav"),
  screen_transition: require("../../assets/audio/effects/screen_transition.wav"),
  review_due: require("../../assets/audio/effects/review_due.wav"),
  wird_milestone: require("../../assets/audio/effects/wird_milestone.wav"),
} as const;

export type SFXName = keyof typeof SFX_ASSETS;

// ── Letter filename mapping ──

const LETTER_FILENAMES: Record<number, string> = {
  1: "alif", 2: "ba", 3: "ta", 4: "thaa", 5: "jeem",
  6: "haa", 7: "khaa", 8: "daal", 9: "dhaal", 10: "ra",
  11: "zay", 12: "seen", 13: "sheen", 14: "saad", 15: "daad",
  16: "taa", 17: "dhaa", 18: "ain", 19: "ghain", 20: "fa",
  21: "qaf", 22: "kaf", 23: "laam", 24: "meem", 25: "noon",
  26: "ha", 27: "waw", 28: "ya",
};

// Sound filenames differ for 2 letters
const LETTER_SOUND_OVERRIDES: Record<number, string> = {
  4: "tha",   // name file is "thaa", sound file is "tha"
  23: "lam",  // name file is "laam", sound file is "lam"
};

function getLetterSoundFilename(id: number): string {
  return LETTER_SOUND_OVERRIDES[id] ?? LETTER_FILENAMES[id];
}

// ── Letter audio asset maps (require must be literal strings) ──

const NAME_ASSETS: Record<string, AudioSource> = {
  alif: require("../../assets/audio/names/alif.wav"),
  ba: require("../../assets/audio/names/ba.wav"),
  ta: require("../../assets/audio/names/ta.wav"),
  thaa: require("../../assets/audio/names/thaa.wav"),
  jeem: require("../../assets/audio/names/jeem.wav"),
  haa: require("../../assets/audio/names/haa.wav"),
  khaa: require("../../assets/audio/names/khaa.wav"),
  daal: require("../../assets/audio/names/daal.wav"),
  dhaal: require("../../assets/audio/names/dhaal.wav"),
  ra: require("../../assets/audio/names/ra.wav"),
  zay: require("../../assets/audio/names/zay.wav"),
  seen: require("../../assets/audio/names/seen.wav"),
  sheen: require("../../assets/audio/names/sheen.wav"),
  saad: require("../../assets/audio/names/saad.wav"),
  daad: require("../../assets/audio/names/daad.wav"),
  taa: require("../../assets/audio/names/taa.wav"),
  dhaa: require("../../assets/audio/names/dhaa.wav"),
  ain: require("../../assets/audio/names/ain.wav"),
  ghain: require("../../assets/audio/names/ghain.wav"),
  fa: require("../../assets/audio/names/fa.wav"),
  qaf: require("../../assets/audio/names/qaf.wav"),
  kaf: require("../../assets/audio/names/kaf.wav"),
  laam: require("../../assets/audio/names/laam.wav"),
  meem: require("../../assets/audio/names/meem.wav"),
  noon: require("../../assets/audio/names/noon.wav"),
  ha: require("../../assets/audio/names/ha.wav"),
  waw: require("../../assets/audio/names/waw.wav"),
  ya: require("../../assets/audio/names/ya.wav"),
};

const SOUND_ASSETS: Record<string, AudioSource> = {
  alif: require("../../assets/audio/sounds/alif.wav"),
  ba: require("../../assets/audio/sounds/ba.wav"),
  ta: require("../../assets/audio/sounds/ta.wav"),
  tha: require("../../assets/audio/sounds/tha.wav"),
  jeem: require("../../assets/audio/sounds/jeem.wav"),
  haa: require("../../assets/audio/sounds/haa.wav"),
  khaa: require("../../assets/audio/sounds/khaa.wav"),
  daal: require("../../assets/audio/sounds/daal.wav"),
  dhaal: require("../../assets/audio/sounds/dhaal.wav"),
  ra: require("../../assets/audio/sounds/ra.wav"),
  zay: require("../../assets/audio/sounds/zay.wav"),
  seen: require("../../assets/audio/sounds/seen.wav"),
  sheen: require("../../assets/audio/sounds/sheen.wav"),
  saad: require("../../assets/audio/sounds/saad.wav"),
  daad: require("../../assets/audio/sounds/daad.wav"),
  taa: require("../../assets/audio/sounds/taa.wav"),
  dhaa: require("../../assets/audio/sounds/dhaa.wav"),
  ain: require("../../assets/audio/sounds/ain.wav"),
  ghain: require("../../assets/audio/sounds/ghain.wav"),
  fa: require("../../assets/audio/sounds/fa.wav"),
  qaf: require("../../assets/audio/sounds/qaf.wav"),
  kaf: require("../../assets/audio/sounds/kaf.wav"),
  lam: require("../../assets/audio/sounds/lam.wav"),
  meem: require("../../assets/audio/sounds/meem.wav"),
  noon: require("../../assets/audio/sounds/noon.wav"),
  ha: require("../../assets/audio/sounds/ha.wav"),
  waw: require("../../assets/audio/sounds/waw.wav"),
  ya: require("../../assets/audio/sounds/ya.wav"),
};

// ── Public API ──

export function getSFXAsset(name: SFXName): AudioSource {
  return SFX_ASSETS[name];
}

export function getLetterAsset(
  letterId: number,
  type: "sound" | "name"
): AudioSource | null {
  const filename =
    type === "sound"
      ? getLetterSoundFilename(letterId)
      : LETTER_FILENAMES[letterId];
  if (!filename) return null;
  const assets = type === "sound" ? SOUND_ASSETS : NAME_ASSETS;
  return assets[filename] ?? null;
}
