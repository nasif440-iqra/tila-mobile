# Audio Effects Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an automated script that generates, post-processes, and wires UI sound effects from text prompts — so the founder never has to manually source audio files again.

**Architecture:** A Node CLI script reads a JSON manifest of sound events with text prompts, calls the ElevenLabs Sound Effects API, runs ffmpeg post-processing (normalize volume, trim silence, fade edges), and writes final WAV files to `assets/audio/effects/`. A `--wire` flag auto-updates `player.ts` with new entries. The script is dev-only tooling — nothing ships in the app bundle except the generated `.wav` files.

**Tech Stack:** TypeScript (ts-node), ElevenLabs Sound Effects API, ffmpeg (system dep), dotenv

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `scripts/sfx-manifest.json` | Source of truth: all 24 sound events with prompts, categories, durations |
| Create | `scripts/sfx-config.json` | Pipeline config: provider, output dir, normalization params |
| Create | `scripts/generate-sfx.ts` | CLI entry point: arg parsing, orchestration loop, console output |
| Create | `scripts/sfx-provider.ts` | API provider interface + ElevenLabs implementation |
| Create | `scripts/sfx-postprocess.ts` | ffmpeg wrapper: normalize, trim, fade, convert |
| Create | `scripts/sfx-wire.ts` | Auto-update player.ts with new SFX_ASSETS entries + helper functions |
| Modify | `src/audio/player.ts` | Add 5 new SFX_ASSETS entries + 5 new helper functions |
| Modify | `app/wird-intro.tsx` | Add `playWirdTextAppear()` and `playWirdComplete()` calls |
| Modify | `src/components/LessonQuiz.tsx` | Add `playQuizStart()` call |
| Modify | `src/components/LessonSummary.tsx` | Add `playMasteryLevelUp()` call |
| Modify | `app/(tabs)/progress.tsx` | Add `playProgressReveal()` call |
| Create | `.env.example` | Document required env vars |
| Modify | `.gitignore` | Add `.env` |
| Modify | `package.json` | Add `generate-sfx` script alias + `dotenv` dev dep |

---

### Task 1: Project Setup — Dependencies, Config, and Manifest

**Files:**
- Create: `scripts/sfx-config.json`
- Create: `scripts/sfx-manifest.json`
- Create: `.env.example`
- Modify: `.gitignore`
- Modify: `package.json`

- [ ] **Step 1: Install dotenv as a dev dependency**

```bash
npm install --save-dev dotenv
```

- [ ] **Step 2: Create `.env.example`**

```
# ElevenLabs API key for sound effects generation
# Get yours at https://elevenlabs.io/app/settings/api-keys
SFX_API_KEY=your_elevenlabs_api_key_here
```

- [ ] **Step 3: Add `.env` to `.gitignore`**

Append to the existing `.gitignore`:

```
# Local env files
.env
.env.local
```

- [ ] **Step 4: Create `scripts/sfx-config.json`**

```json
{
  "provider": "elevenlabs",
  "outputDir": "assets/audio/effects",
  "format": "wav",
  "sampleRate": 44100,
  "bitDepth": 16,
  "channels": 1,
  "targetLUFS": -16,
  "truePeak": -1.5,
  "loudnessRange": 11,
  "fadeInMs": 10,
  "fadeOutMs": 30
}
```

- [ ] **Step 5: Create `scripts/sfx-manifest.json`**

```json
[
  {
    "id": "correct",
    "file": "correct.wav",
    "prompt": "Soft warm wooden chime, gentle positive confirmation tone, peaceful and brief, single note rising slightly",
    "category": "feedback",
    "intensity": "low",
    "maxDurationMs": 600
  },
  {
    "id": "wrong",
    "file": "wrong.wav",
    "prompt": "Gentle low-pitched soft muted tone, subtle negative indicator, not harsh or jarring, brief and mellow",
    "category": "feedback",
    "intensity": "low",
    "maxDurationMs": 600
  },
  {
    "id": "button_tap",
    "file": "button_tap.wav",
    "prompt": "Very subtle soft click, like a gentle wooden button press, barely there, minimal and clean",
    "category": "navigation",
    "intensity": "low",
    "maxDurationMs": 200
  },
  {
    "id": "lesson_node_tap",
    "file": "lesson_node_tap.wav",
    "prompt": "Soft warm tap sound, slightly resonant like tapping polished wood, brief and satisfying",
    "category": "navigation",
    "intensity": "low",
    "maxDurationMs": 300
  },
  {
    "id": "audio_play_button",
    "file": "audio_play_button.wav",
    "prompt": "Gentle soft press sound, like a cushioned button, very subtle and clean",
    "category": "navigation",
    "intensity": "low",
    "maxDurationMs": 200
  },
  {
    "id": "screen_transition",
    "file": "screen_transition.wav",
    "prompt": "Very brief soft ambient whoosh, gentle air movement, barely audible transition sound",
    "category": "navigation",
    "intensity": "low",
    "maxDurationMs": 400
  },
  {
    "id": "onboarding_advance",
    "file": "onboarding_advance.wav",
    "prompt": "Gentle forward movement tone, soft ascending note, peaceful progression sound, brief",
    "category": "navigation",
    "intensity": "low",
    "maxDurationMs": 500
  },
  {
    "id": "lesson_start",
    "file": "lesson_start.wav",
    "prompt": "Warm encouraging start tone, soft chime with gentle resonance, inviting and peaceful, medium energy",
    "category": "milestone",
    "intensity": "medium",
    "maxDurationMs": 800
  },
  {
    "id": "lesson_complete",
    "file": "lesson_complete.wav",
    "prompt": "Warm completion chime, two ascending gentle tones, encouraging and peaceful, satisfying resolution",
    "category": "milestone",
    "intensity": "medium",
    "maxDurationMs": 1200
  },
  {
    "id": "lesson_complete_perfect",
    "file": "lesson_complete_perfect.wav",
    "prompt": "Celebratory warm chime sequence, three ascending bright tones with gentle shimmer, joyful achievement sound, exciting but elegant",
    "category": "celebration",
    "intensity": "high",
    "maxDurationMs": 1800
  },
  {
    "id": "mid_lesson_celebration",
    "file": "mid_lesson_celebration.wav",
    "prompt": "Brief warm encouraging chime, gentle sparkle, mid-task positive reinforcement, subtle celebration",
    "category": "milestone",
    "intensity": "medium",
    "maxDurationMs": 800
  },
  {
    "id": "streak_tier1",
    "file": "streak_tier1.wav",
    "prompt": "Gentle warm acknowledgment tone, single soft chime with slight warmth, streak beginning",
    "category": "milestone",
    "intensity": "medium",
    "maxDurationMs": 800
  },
  {
    "id": "streak_tier2",
    "file": "streak_tier2.wav",
    "prompt": "Growing warm chime, two ascending gentle tones, building momentum and energy, encouraging",
    "category": "milestone",
    "intensity": "medium",
    "maxDurationMs": 1000
  },
  {
    "id": "streak_tier3",
    "file": "streak_tier3.wav",
    "prompt": "Celebratory ascending chime cascade, warm and bright, major achievement sound, joyful with gentle sparkle",
    "category": "celebration",
    "intensity": "high",
    "maxDurationMs": 1500
  },
  {
    "id": "onboarding_complete",
    "file": "onboarding_complete.wav",
    "prompt": "Welcoming warm celebration, gentle ascending chime sequence with soft shimmer, arrival and accomplishment, elegant fanfare",
    "category": "celebration",
    "intensity": "high",
    "maxDurationMs": 2000
  },
  {
    "id": "phase_complete",
    "file": "phase_complete.wav",
    "prompt": "Grand warm completion fanfare, multiple ascending bright chimes, celebratory but elegant, major milestone achievement",
    "category": "celebration",
    "intensity": "high",
    "maxDurationMs": 2000
  },
  {
    "id": "phase_unlock",
    "file": "phase_unlock.wav",
    "prompt": "Exciting reveal sound, bright warm ascending chime with gentle shimmer and anticipation, new chapter opening, uplifting",
    "category": "celebration",
    "intensity": "high",
    "maxDurationMs": 1800
  },
  {
    "id": "review_due",
    "file": "review_due.wav",
    "prompt": "Gentle soft nudge tone, single mellow note, subtle reminder, not intrusive, peaceful notification",
    "category": "navigation",
    "intensity": "low",
    "maxDurationMs": 500
  },
  {
    "id": "wird_milestone",
    "file": "wird_milestone.wav",
    "prompt": "Warm spiritual accomplishment tone, gentle resonant chime with depth, peaceful achievement, Islamic-inspired warmth",
    "category": "milestone",
    "intensity": "medium",
    "maxDurationMs": 1200
  },
  {
    "id": "wird_text_appear",
    "file": "wird_text_appear.wav",
    "prompt": "Very gentle soft tone, like a whisper of a chime, barely there, peaceful text appearance, Quranic tranquility",
    "category": "navigation",
    "intensity": "low",
    "maxDurationMs": 400
  },
  {
    "id": "wird_complete",
    "file": "wird_complete.wav",
    "prompt": "Warm completion tone with gentle depth, peaceful accomplishment, spiritual satisfaction, soft resonant chime",
    "category": "milestone",
    "intensity": "medium",
    "maxDurationMs": 1200
  },
  {
    "id": "mastery_level_up",
    "file": "mastery_level_up.wav",
    "prompt": "Warm ascending two-note chime, gentle progression sound, letter mastery advancement, encouraging and peaceful",
    "category": "milestone",
    "intensity": "medium",
    "maxDurationMs": 1000
  },
  {
    "id": "quiz_start",
    "file": "quiz_start.wav",
    "prompt": "Soft focused ready tone, gentle clear note, calm preparation, entering a mindful task",
    "category": "navigation",
    "intensity": "low",
    "maxDurationMs": 500
  },
  {
    "id": "progress_reveal",
    "file": "progress_reveal.wav",
    "prompt": "Very subtle soft shimmer, gentle ambient reveal, stats appearing, barely audible sparkle",
    "category": "navigation",
    "intensity": "low",
    "maxDurationMs": 400
  }
]
```

- [ ] **Step 6: Add npm script alias to `package.json`**

Add to the `"scripts"` section:

```json
"generate-sfx": "ts-node scripts/generate-sfx.ts"
```

- [ ] **Step 7: Commit**

```bash
git add scripts/sfx-config.json scripts/sfx-manifest.json .env.example .gitignore package.json package-lock.json
git commit -m "feat: add SFX pipeline config, manifest with 24 sound prompts, and dotenv setup"
```

---

### Task 2: API Provider Module

**Files:**
- Create: `scripts/sfx-provider.ts`

- [ ] **Step 1: Create `scripts/sfx-provider.ts`**

```typescript
import * as https from "https";
import * as fs from "fs";
import * as path from "path";

// ── Provider interface ──

export interface SFXProvider {
  generate(prompt: string, durationSeconds: number): Promise<Buffer>;
}

// ── ElevenLabs Sound Effects provider ──

const ELEVENLABS_URL = "https://api.elevenlabs.io/v1/sound-generation";

export function createElevenLabsProvider(apiKey: string): SFXProvider {
  return {
    async generate(prompt: string, durationSeconds: number): Promise<Buffer> {
      const body = JSON.stringify({
        text: prompt,
        duration_seconds: durationSeconds,
      });

      return new Promise((resolve, reject) => {
        const req = https.request(
          ELEVENLABS_URL,
          {
            method: "POST",
            headers: {
              "xi-api-key": apiKey,
              "Content-Type": "application/json",
              Accept: "audio/mpeg",
            },
          },
          (res) => {
            if (res.statusCode !== 200) {
              let errorBody = "";
              res.on("data", (chunk) => (errorBody += chunk));
              res.on("end", () =>
                reject(
                  new Error(
                    `ElevenLabs API error ${res.statusCode}: ${errorBody}`
                  )
                )
              );
              return;
            }

            const chunks: Buffer[] = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => resolve(Buffer.concat(chunks)));
          }
        );

        req.on("error", reject);
        req.write(body);
        req.end();
      });
    },
  };
}

// ── Provider factory ──

export function createProvider(
  providerName: string,
  apiKey: string
): SFXProvider {
  switch (providerName) {
    case "elevenlabs":
      return createElevenLabsProvider(apiKey);
    default:
      throw new Error(`Unknown SFX provider: ${providerName}`);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/sfx-provider.ts
git commit -m "feat: add ElevenLabs SFX provider with typed interface"
```

---

### Task 3: ffmpeg Post-Processing Module

**Files:**
- Create: `scripts/sfx-postprocess.ts`

- [ ] **Step 1: Create `scripts/sfx-postprocess.ts`**

```typescript
import { execSync, execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

interface PostProcessOptions {
  targetLUFS: number;
  truePeak: number;
  loudnessRange: number;
  fadeInMs: number;
  fadeOutMs: number;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  maxDurationMs: number;
}

// ── Check ffmpeg is available ──

export function checkFfmpeg(): void {
  try {
    execSync("ffmpeg -version", { stdio: "pipe" });
  } catch {
    console.error(
      "\n❌ ffmpeg is not installed or not in PATH.\n\n" +
        "Install it:\n" +
        "  macOS:   brew install ffmpeg\n" +
        "  Windows: winget install ffmpeg  (or download from https://ffmpeg.org)\n" +
        "  Linux:   sudo apt install ffmpeg\n"
    );
    process.exit(1);
  }
}

// ── Get duration of an audio file in seconds ──

function getDuration(filePath: string): number {
  const output = execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
    { encoding: "utf-8" }
  ).trim();
  return parseFloat(output);
}

// ── Post-process a single audio file ──

export function postProcess(
  inputPath: string,
  outputPath: string,
  options: PostProcessOptions
): void {
  const tmpDir = os.tmpdir();
  const tmpNormalized = path.join(tmpDir, `sfx-norm-${Date.now()}.wav`);

  // Step 1: Convert to WAV and trim silence
  const trimFilter = [
    "silenceremove=start_periods=1:start_silence=0.01:start_threshold=-50dB",
    "silenceremove=stop_periods=1:stop_silence=0.01:stop_threshold=-50dB",
  ].join(",");

  execSync(
    `ffmpeg -y -i "${inputPath}" -af "${trimFilter}" -ar ${options.sampleRate} -sample_fmt s${options.bitDepth} -ac ${options.channels} "${tmpNormalized}"`,
    { stdio: "pipe" }
  );

  // Step 2: Get duration after trimming, enforce max
  let duration = getDuration(tmpNormalized);
  const maxDuration = options.maxDurationMs / 1000;

  let durationFilter = "";
  if (duration > maxDuration) {
    // Truncate and add fade-out at the end
    durationFilter = `,atrim=0:${maxDuration}`;
    duration = maxDuration;
  }

  // Step 3: Normalize volume + add fades
  const fadeIn = options.fadeInMs / 1000;
  const fadeOut = options.fadeOutMs / 1000;
  const fadeOutStart = Math.max(0, duration - fadeOut);

  const finalFilter = [
    `loudnorm=I=${options.targetLUFS}:TP=${options.truePeak}:LRA=${options.loudnessRange}`,
    durationFilter,
    `afade=t=in:d=${fadeIn}`,
    `afade=t=out:st=${fadeOutStart}:d=${fadeOut}`,
  ]
    .filter(Boolean)
    .join(",");

  execSync(
    `ffmpeg -y -i "${tmpNormalized}" -af "${finalFilter}" -ar ${options.sampleRate} -sample_fmt s${options.bitDepth} -ac ${options.channels} "${outputPath}"`,
    { stdio: "pipe" }
  );

  // Clean up temp file
  fs.unlinkSync(tmpNormalized);
}

// ── Normalize-only mode: re-process existing files without regenerating ──

export function normalizeExisting(
  filePath: string,
  options: PostProcessOptions
): void {
  const tmpInput = filePath + ".bak";
  fs.copyFileSync(filePath, tmpInput);
  try {
    postProcess(tmpInput, filePath, options);
  } finally {
    fs.unlinkSync(tmpInput);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/sfx-postprocess.ts
git commit -m "feat: add ffmpeg post-processing — normalize, trim, fade, convert"
```

---

### Task 4: Auto-Wiring Module

**Files:**
- Create: `scripts/sfx-wire.ts`

- [ ] **Step 1: Create `scripts/sfx-wire.ts`**

This module reads `player.ts`, detects which sound IDs are missing from `SFX_ASSETS`, and inserts the new `require()` lines and helper functions.

```typescript
import * as fs from "fs";
import * as path from "path";

interface ManifestEntry {
  id: string;
  file: string;
  category: string;
  intensity: string;
}

const PLAYER_PATH = path.resolve(__dirname, "../src/audio/player.ts");

// Haptics mapping by intensity
const HAPTICS: Record<string, string | null> = {
  low: null,
  medium: '  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);',
  high: '  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);',
};

function toHelperName(id: string): string {
  // "wird_text_appear" -> "playWirdTextAppear"
  return (
    "play" +
    id
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("")
  );
}

export function wireNewSounds(entries: ManifestEntry[]): {
  added: string[];
  skipped: string[];
} {
  let source = fs.readFileSync(PLAYER_PATH, "utf-8");
  const added: string[] = [];
  const skipped: string[] = [];

  for (const entry of entries) {
    // Check if already in SFX_ASSETS
    if (source.includes(`${entry.id}: require(`)) {
      skipped.push(entry.id);
      continue;
    }

    // Insert require line before the closing "} as const;"
    const requireLine = `  ${entry.id}: require("../../assets/audio/effects/${entry.file}"),`;
    source = source.replace(
      "} as const;",
      `${requireLine}\n} as const;`
    );

    // Insert helper function before the final "// ── Voice helpers ──" section
    const helperName = toHelperName(entry.id);
    const hapticLine = HAPTICS[entry.intensity];
    const helperFn = [
      "",
      `export function ${helperName}(): void {`,
      `  playSFX(SFX_ASSETS.${entry.id});`,
      hapticLine,
      "}",
    ]
      .filter((line) => line !== null)
      .join("\n");

    source = source.replace(
      "// ── Voice helpers ──",
      `${helperFn}\n\n// ── Voice helpers ──`
    );

    added.push(entry.id);
  }

  if (added.length > 0) {
    fs.writeFileSync(PLAYER_PATH, source, "utf-8");
  }

  return { added, skipped };
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/sfx-wire.ts
git commit -m "feat: add auto-wiring module to insert new sounds into player.ts"
```

---

### Task 5: Main CLI Script — `generate-sfx.ts`

**Files:**
- Create: `scripts/generate-sfx.ts`

- [ ] **Step 1: Create `scripts/generate-sfx.ts`**

```typescript
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { createProvider, type SFXProvider } from "./sfx-provider";
import {
  checkFfmpeg,
  postProcess,
  normalizeExisting,
} from "./sfx-postprocess";
import { wireNewSounds } from "./sfx-wire";

dotenv.config();

// ── Types ──

interface ManifestEntry {
  id: string;
  file: string;
  prompt: string;
  category: string;
  intensity: string;
  maxDurationMs: number;
}

interface Config {
  provider: string;
  outputDir: string;
  format: string;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  targetLUFS: number;
  truePeak: number;
  loudnessRange: number;
  fadeInMs: number;
  fadeOutMs: number;
}

// ── Load files ──

const SCRIPTS_DIR = __dirname;
const ROOT_DIR = path.resolve(SCRIPTS_DIR, "..");

function loadManifest(): ManifestEntry[] {
  const raw = fs.readFileSync(
    path.join(SCRIPTS_DIR, "sfx-manifest.json"),
    "utf-8"
  );
  return JSON.parse(raw);
}

function loadConfig(): Config {
  const raw = fs.readFileSync(
    path.join(SCRIPTS_DIR, "sfx-config.json"),
    "utf-8"
  );
  return JSON.parse(raw);
}

// ── CLI arg parsing ──

interface CLIArgs {
  all: boolean;
  id: string | null;
  category: string | null;
  normalizeOnly: boolean;
  dryRun: boolean;
  wire: boolean;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const result: CLIArgs = {
    all: false,
    id: null,
    category: null,
    normalizeOnly: false,
    dryRun: false,
    wire: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--all":
        result.all = true;
        break;
      case "--id":
        result.id = args[++i];
        break;
      case "--category":
        result.category = args[++i];
        break;
      case "--normalize-only":
        result.normalizeOnly = true;
        break;
      case "--dry-run":
        result.dryRun = true;
        break;
      case "--wire":
        result.wire = true;
        break;
      default:
        console.error(`Unknown argument: ${args[i]}`);
        process.exit(1);
    }
  }

  if (!result.all && !result.id && !result.category && !result.normalizeOnly) {
    console.error(
      "Usage:\n" +
        "  --all                 Generate all sounds\n" +
        "  --id <sound_id>      Generate a single sound\n" +
        "  --category <cat>     Generate sounds in a category\n" +
        "  --normalize-only     Re-normalize existing files (no API calls)\n" +
        "  --dry-run            Show what would happen\n" +
        "  --wire               Auto-update player.ts with new entries\n"
    );
    process.exit(1);
  }

  return result;
}

// ── Filter manifest entries ──

function filterEntries(
  manifest: ManifestEntry[],
  args: CLIArgs
): ManifestEntry[] {
  if (args.all || args.normalizeOnly) return manifest;
  if (args.id) {
    const entry = manifest.find((e) => e.id === args.id);
    if (!entry) {
      console.error(`Sound ID "${args.id}" not found in manifest.`);
      console.error(
        "Available IDs: " + manifest.map((e) => e.id).join(", ")
      );
      process.exit(1);
    }
    return [entry];
  }
  if (args.category) {
    const entries = manifest.filter((e) => e.category === args.category);
    if (entries.length === 0) {
      console.error(`No sounds found in category "${args.category}".`);
      console.error(
        "Available categories: " +
          [...new Set(manifest.map((e) => e.category))].join(", ")
      );
      process.exit(1);
    }
    return entries;
  }
  return manifest;
}

// ── Main ──

async function main(): Promise<void> {
  const args = parseArgs();
  const config = loadConfig();
  const manifest = loadManifest();
  const entries = filterEntries(manifest, args);
  const outputDir = path.resolve(ROOT_DIR, config.outputDir);

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`\n🔊 Tila SFX Pipeline\n`);

  // Normalize-only mode: skip API, just re-process existing files
  if (args.normalizeOnly) {
    checkFfmpeg();
    console.log(`Re-normalizing ${entries.length} existing files...\n`);
    for (const entry of entries) {
      const filePath = path.join(outputDir, entry.file);
      if (!fs.existsSync(filePath)) {
        console.log(`  ⏭  ${entry.id} — file not found, skipping`);
        continue;
      }
      if (args.dryRun) {
        console.log(`  🔍 ${entry.id} — would normalize ${entry.file}`);
        continue;
      }
      normalizeExisting(filePath, {
        targetLUFS: config.targetLUFS,
        truePeak: config.truePeak,
        loudnessRange: config.loudnessRange,
        fadeInMs: config.fadeInMs,
        fadeOutMs: config.fadeOutMs,
        sampleRate: config.sampleRate,
        bitDepth: config.bitDepth,
        channels: config.channels,
        maxDurationMs: entry.maxDurationMs,
      });
      console.log(`  ✅ ${entry.id} — normalized`);
    }
    console.log(`\nDone!\n`);
    return;
  }

  // Generation mode
  checkFfmpeg();

  const apiKey = process.env.SFX_API_KEY;
  if (!apiKey) {
    console.error(
      "❌ SFX_API_KEY not set. Create a .env file with your ElevenLabs API key.\n" +
        "   See .env.example for the format."
    );
    process.exit(1);
  }

  const provider = createProvider(config.provider, apiKey);

  console.log(
    `Generating ${entries.length} sound(s) via ${config.provider}...\n`
  );

  let successCount = 0;
  let failCount = 0;

  for (const entry of entries) {
    const outputPath = path.join(outputDir, entry.file);

    if (args.dryRun) {
      console.log(`  🔍 ${entry.id}`);
      console.log(`     Prompt: "${entry.prompt}"`);
      console.log(
        `     Duration: ${entry.maxDurationMs}ms → ${outputPath}`
      );
      console.log();
      continue;
    }

    process.stdout.write(`  ⏳ ${entry.id} — generating...`);

    try {
      // Generate raw audio from API
      const durationSeconds = entry.maxDurationMs / 1000;
      const rawAudio = await provider.generate(entry.prompt, durationSeconds);

      // Write raw audio to temp file (API returns MP3)
      const tmpRaw = path.join(
        outputDir,
        `.tmp-${entry.id}-${Date.now()}.mp3`
      );
      fs.writeFileSync(tmpRaw, rawAudio);

      // Post-process: normalize, trim, fade, convert to WAV
      postProcess(tmpRaw, outputPath, {
        targetLUFS: config.targetLUFS,
        truePeak: config.truePeak,
        loudnessRange: config.loudnessRange,
        fadeInMs: config.fadeInMs,
        fadeOutMs: config.fadeOutMs,
        sampleRate: config.sampleRate,
        bitDepth: config.bitDepth,
        channels: config.channels,
        maxDurationMs: entry.maxDurationMs,
      });

      // Clean up temp file
      fs.unlinkSync(tmpRaw);

      process.stdout.write(`\r  ✅ ${entry.id} — saved to ${entry.file}\n`);
      successCount++;
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : String(error);
      process.stdout.write(`\r  ❌ ${entry.id} — ${msg}\n`);
      failCount++;
    }
  }

  if (!args.dryRun) {
    console.log(
      `\n${successCount} generated, ${failCount} failed.\n`
    );
  }

  // Auto-wire new sounds into player.ts
  if (args.wire && !args.dryRun) {
    console.log("Wiring new sounds into player.ts...\n");
    const { added, skipped } = wireNewSounds(entries);
    if (added.length > 0) {
      console.log(`  Added: ${added.join(", ")}`);
    }
    if (skipped.length > 0) {
      console.log(`  Already wired: ${skipped.join(", ")}`);
    }
    console.log();
  }

  console.log("Done!\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Verify the script runs with `--dry-run`**

```bash
npx ts-node scripts/generate-sfx.ts --all --dry-run
```

Expected: Prints each sound's prompt and target path without making API calls.

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-sfx.ts
git commit -m "feat: add main SFX generation CLI — generate, process, and wire sounds"
```

---

### Task 6: Update player.ts — Add 5 New Sound Entries and Helpers

**Files:**
- Modify: `src/audio/player.ts:24-44` (SFX_ASSETS map)
- Modify: `src/audio/player.ts:200-240` (add new helper functions before Voice helpers section)

- [ ] **Step 1: Add 5 new entries to `SFX_ASSETS` map**

In `src/audio/player.ts`, add these lines inside `SFX_ASSETS` (after the `wird_milestone` entry, before the closing `} as const;`):

```typescript
  wird_text_appear: require("../../assets/audio/effects/wird_text_appear.wav"),
  wird_complete: require("../../assets/audio/effects/wird_complete.wav"),
  mastery_level_up: require("../../assets/audio/effects/mastery_level_up.wav"),
  quiz_start: require("../../assets/audio/effects/quiz_start.wav"),
  progress_reveal: require("../../assets/audio/effects/progress_reveal.wav"),
```

- [ ] **Step 2: Add 5 new helper functions**

Add these before the `// ── Voice helpers ──` comment in `src/audio/player.ts`:

```typescript
export function playWirdTextAppear(): void {
  playSFX(SFX_ASSETS.wird_text_appear);
}

export function playWirdComplete(): void {
  playSFX(SFX_ASSETS.wird_complete);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function playMasteryLevelUp(): void {
  playSFX(SFX_ASSETS.mastery_level_up);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function playQuizStart(): void {
  playSFX(SFX_ASSETS.quiz_start);
}

export function playProgressReveal(): void {
  playSFX(SFX_ASSETS.progress_reveal);
}
```

- [ ] **Step 3: Verify typecheck passes**

```bash
npm run typecheck
```

Expected: No new errors. (Note: the actual `.wav` files won't exist yet — `require()` of missing files won't fail typecheck, only runtime.)

- [ ] **Step 4: Commit**

```bash
git add src/audio/player.ts
git commit -m "feat: add 5 new SFX entries and helper functions to player.ts"
```

---

### Task 7: Wire New Sounds Into App Screens

**Files:**
- Modify: `app/wird-intro.tsx` — import and call `playWirdTextAppear`, `playWirdComplete`
- Modify: `src/components/LessonQuiz.tsx` — import and call `playQuizStart`
- Modify: `src/components/LessonSummary.tsx` — import and call `playMasteryLevelUp`
- Modify: `app/(tabs)/progress.tsx` — import and call `playProgressReveal`

This task requires reading each file in full to find the exact insertion points. The executor should:

- [ ] **Step 1: Wire `playWirdTextAppear` into `app/wird-intro.tsx`**

Read the full file. Find where text/ayah content animates in (likely in the `RevealSlot` component's `useEffect` that triggers opacity animation). Add the import and call `playWirdTextAppear()` when `visible` transitions from `false` to `true`.

Add to imports:
```typescript
import { playWirdTextAppear, playWirdComplete } from "../src/audio/player";
```

Inside the effect or callback where wird text becomes visible, add:
```typescript
playWirdTextAppear();
```

- [ ] **Step 2: Wire `playWirdComplete` into `app/wird-intro.tsx`**

Find where the wird session completes (likely a "complete" or "done" button handler or navigation). Add:
```typescript
playWirdComplete();
```

- [ ] **Step 3: Wire `playQuizStart` into `src/components/LessonQuiz.tsx`**

Add to the existing import from `../audio/player`:
```typescript
import {
  playCorrect,
  playWrong,
  playLetterName,
  playLetterSound,
  playQuizStart,
} from "../audio/player";
```

Add a `useEffect` that fires once on mount inside the `LessonQuiz` component:
```typescript
useEffect(() => {
  playQuizStart();
}, []);
```

- [ ] **Step 4: Wire `playMasteryLevelUp` into `src/components/LessonSummary.tsx`**

Read the full file. Find where mastery state changes are displayed (likely where letter mastery progression is shown in the summary). Add:

```typescript
import { playMasteryLevelUp } from "../audio/player";
```

Call `playMasteryLevelUp()` when a mastery level-up animation triggers.

- [ ] **Step 5: Wire `playProgressReveal` into `app/(tabs)/progress.tsx`**

Add to imports:
```typescript
import { playProgressReveal } from "../../src/audio/player";
```

Add a `useEffect` that fires once when progress data loads and stats animate in:
```typescript
useEffect(() => {
  if (progress && !loading) {
    playProgressReveal();
  }
}, [progress, loading]);
```

- [ ] **Step 6: Verify typecheck passes**

```bash
npm run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add app/wird-intro.tsx src/components/LessonQuiz.tsx src/components/LessonSummary.tsx "app/(tabs)/progress.tsx"
git commit -m "feat: wire 5 new sound effects into wird, quiz, summary, and progress screens"
```

---

### Task 8: Generate Sounds and Test

This is the manual step where the founder runs the pipeline and tests in-app.

- [ ] **Step 1: Create `.env` with your ElevenLabs API key**

```bash
cp .env.example .env
# Edit .env and paste your API key
```

- [ ] **Step 2: Install ffmpeg if not already installed**

```bash
# Windows
winget install ffmpeg

# macOS
brew install ffmpeg
```

- [ ] **Step 3: Generate all sounds**

```bash
npx ts-node scripts/generate-sfx.ts --all
```

Expected: 24 files generated and saved to `assets/audio/effects/`.

- [ ] **Step 4: Test in the app**

```bash
npm start
```

Open the app and test each sound in context:
- Tap buttons (button_tap)
- Answer quiz questions (correct, wrong)
- Complete a lesson (lesson_complete)
- Check wird screen (wird_text_appear, wird_complete)
- View progress screen (progress_reveal)

- [ ] **Step 5: Iterate on any sounds that need improvement**

Edit the `prompt` field in `scripts/sfx-manifest.json` for any sound that doesn't feel right, then regenerate just that sound:

```bash
npx ts-node scripts/generate-sfx.ts --id correct
```

- [ ] **Step 6: Commit the generated audio files**

```bash
git add assets/audio/effects/
git commit -m "feat: regenerate all 24 SFX via automated pipeline"
```
