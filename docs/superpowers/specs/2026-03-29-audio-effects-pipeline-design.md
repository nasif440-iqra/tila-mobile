# Audio Effects Pipeline Design

**Date:** 2026-03-29
**Status:** Draft
**Scope:** Dev tooling script + expanded sound manifest + player.ts updates

## Problem

Tila's 19 bundled UI sound effects have quality issues: abrupt endings, inconsistent volume levels, misplaced or annoying sounds, and missing coverage for key UI events (e.g., wird screen text appearance). Manually sourcing, downloading, normalizing, and wiring sounds is tedious and was already done once — it shouldn't need to be done again by hand.

## Solution

An automated SFX pipeline: a Node script that reads a sound manifest, generates audio via an AI API, post-processes each file (normalize volume, trim silence, enforce duration, fade edges), and drops the result directly into `assets/audio/effects/`. New sounds are auto-wired into `player.ts`.

## Sound Aesthetic

Peaceful and tranquil baseline — warm wooden taps, gentle chimes, mellow tones. Celebratory energy scales with event importance:

| Intensity | Feel | Examples |
|-----------|------|----------|
| **low** | Subtle, barely-there, peaceful | button tap, screen transition, correct answer |
| **medium** | Warm encouragement, gentle reward | lesson complete, streak tier 1, wird milestone |
| **high** | Full celebration, excitement | phase unlock, perfect score, onboarding complete |

## Sound Manifest

Single source of truth: `scripts/sfx-manifest.json`

Each entry:

```json
{
  "id": "correct",
  "file": "correct.wav",
  "prompt": "Soft warm wooden chime, gentle positive confirmation tone, peaceful and brief, 0.4 seconds",
  "category": "feedback",
  "intensity": "low",
  "maxDurationMs": 800
}
```

### Full Sound Event List

#### Existing (19 sounds — regenerated with better prompts)

| ID | Category | Intensity | Description |
|----|----------|-----------|-------------|
| `correct` | feedback | low | Gentle positive confirmation |
| `wrong` | feedback | low | Soft negative indicator, not harsh |
| `button_tap` | navigation | low | Subtle tap/click |
| `lesson_node_tap` | navigation | low | Slightly warmer tap for lesson selection |
| `audio_play_button` | navigation | low | Soft press for audio playback buttons |
| `screen_transition` | navigation | low | Brief ambient whoosh |
| `onboarding_advance` | navigation | low | Gentle forward movement |
| `lesson_start` | milestone | medium | Encouraging start tone |
| `lesson_complete` | milestone | medium | Warm completion chime |
| `lesson_complete_perfect` | celebration | high | Elevated version of lesson complete |
| `mid_lesson_celebration` | milestone | medium | Brief mid-lesson encouragement |
| `streak_tier1` | milestone | medium | Streak acknowledgment |
| `streak_tier2` | milestone | medium | Growing streak energy |
| `streak_tier3` | celebration | high | Major streak celebration |
| `onboarding_complete` | celebration | high | Welcoming completion fanfare |
| `phase_complete` | celebration | high | Phase mastery celebration |
| `phase_unlock` | celebration | high | New phase available — exciting reveal |
| `review_due` | navigation | low | Gentle nudge/reminder |
| `wird_milestone` | milestone | medium | Wird streak achievement |

#### New (5 sounds — filling coverage gaps)

| ID | Category | Intensity | Description |
|----|----------|-----------|-------------|
| `wird_text_appear` | navigation | low | Gentle tone when new wird/Quran text appears on screen |
| `wird_complete` | milestone | medium | Completing daily wird reading session |
| `mastery_level_up` | milestone | medium | Letter advancing to a new mastery state |
| `quiz_start` | navigation | low | Entering quiz mode — focused, ready |
| `progress_reveal` | navigation | low | Stats/progress animations appearing |

**Total: 24 sounds**

## Script: `scripts/generate-sfx.ts`

### Pipeline Steps

```
For each manifest entry (or filtered by --id):
  1. Call AI audio generation API with prompt + duration
  2. Download raw audio to temp file
  3. Post-process with ffmpeg:
     a. Normalize volume to -16 LUFS (loudnorm filter)
     b. Trim leading/trailing silence (silenceremove)
     c. Add 10ms fade-in and 30ms fade-out (prevent abrupt edges)
     d. Enforce max duration (truncate + fade-out if over limit)
     e. Convert to WAV 44.1kHz 16-bit mono
  4. Write to assets/audio/effects/{file}
  5. If new sound (not in player.ts), append to SFX_ASSETS map
```

### CLI Interface

```bash
# Generate all sounds
npx ts-node scripts/generate-sfx.ts --all

# Regenerate a single sound
npx ts-node scripts/generate-sfx.ts --id correct

# Regenerate by category
npx ts-node scripts/generate-sfx.ts --category celebration

# Just normalize existing files (no API calls)
npx ts-node scripts/generate-sfx.ts --normalize-only

# Preview what would happen
npx ts-node scripts/generate-sfx.ts --all --dry-run
```

### Configuration

```json
// scripts/sfx-config.json
{
  "provider": "elevenlabs",
  "outputDir": "assets/audio/effects",
  "format": "wav",
  "sampleRate": 44100,
  "bitDepth": 16,
  "channels": 1,
  "targetLUFS": -16,
  "fadeInMs": 10,
  "fadeOutMs": 30
}
```

### API Key

Stored in a `.env` file at project root (gitignored). The script reads `SFX_API_KEY` from environment.

```
SFX_API_KEY=your_key_here
```

## API Provider Selection

The script abstracts the provider behind an interface:

```typescript
interface SFXProvider {
  generate(prompt: string, durationMs: number): Promise<Buffer>;
}
```

Primary candidate: **ElevenLabs Sound Effects API**
- High-quality short-form SFX generation
- Text-to-SFX with duration control
- ~$0.01-0.05 per generation (24 sounds = under $1 total)

Fallback candidate: **Stability AI (Stable Audio)**
- Good for musical/tonal SFX
- API available with similar pricing

The provider is selected via `sfx-config.json` so swapping is a one-line change.

## Post-Processing: ffmpeg

ffmpeg is required as a local dependency. The script checks for it on startup and provides install instructions if missing.

Normalization chain (single ffmpeg call per file):

```
ffmpeg -i input.wav \
  -af "silenceremove=start_periods=1:start_silence=0.01:start_threshold=-50dB,
       silenceremove=stop_periods=1:stop_silence=0.01:stop_threshold=-50dB,
       loudnorm=I=-16:TP=-1.5:LRA=11,
       afade=t=in:d=0.01,
       afade=t=out:st={duration-0.03}:d=0.03" \
  -ar 44100 -sample_fmt s16 -ac 1 output.wav
```

## player.ts Changes

### New SFX_ASSETS entries

5 new require() lines added for the new sound files.

### New helper functions

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

### Auto-wiring

The script can detect when a manifest entry's `id` is not present in `player.ts`'s `SFX_ASSETS` block and append the require() line + helper function automatically. This runs as an optional `--wire` flag.

## Integration Points (Where New Sounds Get Called)

These are the app locations where new `playSfx()` calls would be added:

| Sound | Screen/Component | Trigger |
|-------|-----------------|---------|
| `wird_text_appear` | `app/wird-intro.tsx` | New text/ayah animates in |
| `wird_complete` | `app/wird-intro.tsx` | User finishes wird session |
| `mastery_level_up` | `src/components/LessonSummary.tsx` | Post-lesson mastery state change shown |
| `quiz_start` | `src/components/LessonQuiz.tsx` | Quiz component mounts/first question appears |
| `progress_reveal` | `app/(tabs)/progress.tsx` | Stats animate in on screen load |

## Dependencies

**Dev only** (not bundled in app):
- `ts-node` — already available via Expo toolchain
- `dotenv` — load .env for API key
- `ffmpeg` — system dependency, must be installed locally

**No new app dependencies.** The generated `.wav` files are static assets, same as today.

## Workflow

1. `npm run generate-sfx` (alias for `npx ts-node scripts/generate-sfx.ts --all`)
2. Open app, test sounds in context
3. Unhappy with a sound? Edit its `prompt` in `sfx-manifest.json`, run `--id <that-sound>`
4. Happy? `git add assets/audio/effects/ && git commit`

## Out of Scope

- Runtime/dynamic audio generation (all sounds are pre-generated static assets)
- Letter pronunciation audio (names/sounds — separate concern, already high quality)
- Adaptive volume based on device/time-of-day
- User-facing sound settings UI (mute toggle already exists)
