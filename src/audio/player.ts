import {
  setAudioModeAsync,
  createAudioPlayer,
  type AudioSource,
  type AudioPlayer,
} from "expo-audio";

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

// ── Harakat sound assets (letter + mark combinations) ──
//
// Initially populated only for Lesson 1's needs (Ba). Expand as curriculum
// requires. Keys are `<letter-id>-<harakat>`.
//
// NOTE: ba-kasra and ba-dhamma recordings may not exist yet — when missing,
// playback gracefully falls back to playLetterSound(letterId) so Lesson 1
// is at least audible (the fatha sound) until the real recordings land.

type Harakat = "fatha" | "kasra" | "dhamma";

const HARAKAT_SOUND_ASSETS: Record<string, AudioSource> = {
  // Fatha for ba uses the existing sound asset (ba.wav is the fatha-register "ba").
  "2-fatha": require("../../assets/audio/sounds/ba.wav"),
  // ba-kasra and ba-dhamma intentionally absent. Per curriculum-team
  // directive, missing audio must NOT silently fall back to the fatha
  // sound — the lesson UI is responsible for showing a disabled
  // HearButton when the audio path resolves to nothing. Add real
  // recordings here when they're produced:
  //   "2-kasra": require("../../assets/audio/sounds/ba_kasra.wav"),
  //   "2-dhamma": require("../../assets/audio/sounds/ba_dhamma.wav"),
};

export function playLetterHarakatSound(letterId: number, harakat: Harakat): void {
  const source = HARAKAT_SOUND_ASSETS[`${letterId}-${harakat}`];
  if (source) {
    void playVoice(source);
  }
}

// ── Public API ──

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

// ── SFX assets ──

const SFX_ASSETS = {
  correct: require("../../assets/audio/effects/correct.wav"),
  wrong: require("../../assets/audio/effects/wrong.wav"),
  lesson_start: require("../../assets/audio/effects/lesson_start.wav"),
  lesson_complete: require("../../assets/audio/effects/lesson_complete.wav"),
  lesson_complete_perfect: require("../../assets/audio/effects/lesson_complete_perfect.wav"),
  onboarding_complete: require("../../assets/audio/effects/onboarding_complete.wav"),
  sacred_moment: require("../../assets/audio/effects/sacred_moment.wav"),
} as const;

// ── Mute state ──

let _muted = false;
export function setMuted(muted: boolean): void {
  _muted = muted;
}
export function isMuted(): boolean {
  return _muted;
}

// ── Playback ──
//
// Voice lane: letter names / sounds — one active source, new plays interrupt prior.
// Uses a single `AudioPlayer` that persists for the app lifetime.
// We swap the source via `replace()` to avoid creating/destroying players.

let _voicePlayer: AudioPlayer | null = null;

function getVoicePlayer(): AudioPlayer {
  if (!_voicePlayer) {
    _voicePlayer = createAudioPlayer();
  }
  return _voicePlayer;
}

async function playVoice(source: AudioSource): Promise<void> {
  if (_muted) return;
  try {
    const player = getVoicePlayer();
    player.replace(source);
    player.play();
  } catch (e) {
    console.warn("Voice playback failed:", e);
  }
}

// ── SFX playback (priority-gated) ──
//
// Smaller number = higher priority. A playing sound blocks equal or
// lower-priority requests for its guard window duration.

const SFX_PRIORITY = {
  critical: 1,     // lesson_complete_perfect, sacred_moment, onboarding_complete
  celebration: 2,  // lesson_complete
  feedback: 3,     // correct, wrong, lesson_start
} as const;

let _sfxPlayer: AudioPlayer | null = null;

function getSFXPlayer(): AudioPlayer {
  if (!_sfxPlayer) {
    _sfxPlayer = createAudioPlayer();
  }
  return _sfxPlayer;
}

interface PlayingState {
  priority: number;
  startedAt: number;
  guardMs: number;
}

let _playing: PlayingState | null = null;

function playSFX(source: AudioSource, priority: number, guardMs: number): void {
  if (_muted) return;
  const now = Date.now();
  if (
    _playing &&
    priority >= _playing.priority &&
    now - _playing.startedAt < _playing.guardMs
  ) {
    return; // blocked — equal or lower importance during guard window
  }
  try {
    const player = getSFXPlayer();
    player.replace(source);
    player.play();
    _playing = { priority, startedAt: now, guardMs };
  } catch (e) {
    console.warn("SFX playback failed:", e);
  }
}

// ── SFX helpers (audio-only — no haptics) ──

export function playCorrect(): void {
  playSFX(SFX_ASSETS.correct, SFX_PRIORITY.feedback, 400);
}

export function playWrong(): void {
  playSFX(SFX_ASSETS.wrong, SFX_PRIORITY.feedback, 400);
}

export function playLessonStart(): void {
  playSFX(SFX_ASSETS.lesson_start, SFX_PRIORITY.feedback, 400);
}

export function playLessonComplete(): void {
  playSFX(SFX_ASSETS.lesson_complete, SFX_PRIORITY.celebration, 800);
}

export function playLessonCompletePerfect(): void {
  playSFX(SFX_ASSETS.lesson_complete_perfect, SFX_PRIORITY.critical, 1200);
}

export function playOnboardingComplete(): void {
  playSFX(SFX_ASSETS.onboarding_complete, SFX_PRIORITY.critical, 1200);
}

export function playSacredMoment(): void {
  playSFX(SFX_ASSETS.sacred_moment, SFX_PRIORITY.critical, 1200);
}

// ── Voice helpers ──

export function playLetterName(letterId: number): void {
  const source = getLetterAsset(letterId, "name");
  if (source) playVoice(source);
}

export function playLetterSound(letterId: number): void {
  const source = getLetterAsset(letterId, "sound");
  if (source) playVoice(source);
}

// ── Curriculum-path router ──
//
// Bridges the curriculum's logical audio paths (e.g., "audio/letter/ba_name.mp3")
// to actual asset playback. Curriculum data stays human-readable; this map
// stays small and focused. Add new entries as new lessons author audio.
//
// Unknown paths log a warning and no-op — never throw.

const PATH_TO_PLAYER: Record<string, () => void> = {
  "audio/letter/alif_name.mp3": () => playLetterName(1),
  "audio/letter/ba_name.mp3": () => playLetterName(2),
  "audio/letter/ba_fatha_sound.mp3": () => playLetterHarakatSound(2, "fatha"),
  "audio/letter/ba_kasra_sound.mp3": () => playLetterHarakatSound(2, "kasra"),
  "audio/letter/ba_dhamma_sound.mp3": () => playLetterHarakatSound(2, "dhamma"),
};

export function playByPath(path: string): void {
  const player = PATH_TO_PLAYER[path];
  if (player) {
    player();
    return;
  }
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn(`[audio] Unknown logical path: ${path}`);
  }
}
