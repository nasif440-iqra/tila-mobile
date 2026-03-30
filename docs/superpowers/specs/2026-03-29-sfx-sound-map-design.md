# SFX Sound Map — Phase 1

**Date:** 2026-03-29
**Status:** Approved
**Scope:** 7 manually-sourced sound effects, priority-gated playback, exact wiring points

## Design Principles

1. **Earned, not constant.** Sound accompanies moments that matter. Haptics handle everything else.
2. **Haptics live in the UI layer.** `src/design/haptics.ts` already owns haptic feedback across 20+ components (QuizOption, LessonSummary, StreakMilestoneOverlay, Button, etc.). Audio helpers in `player.ts` are audio-only — zero haptics.
3. **One path for all SFX.** Every sound effect goes through `playSFX()` in `src/audio/player.ts`. No direct `useAudioPlayer()` calls for effects in screens or components. This guarantees mute behavior is consistent.
4. **Sacred moments are atmospheric, not melodic.** A single sustained tone that fades — not a sound effect.

## Current Architecture (as of this commit)

`src/audio/player.ts` currently has:
- **Voice lane only** — one `AudioPlayer` instance for letter names/sounds via `playVoice()`
- **No SFX lane** — all SFX code was removed in the prior commit
- **Mute state** — `_muted` flag checked by `playVoice()`, exported via `setMuted()`/`isMuted()`
- **Exports:** `configureAudioSession`, `getLetterAsset`, `setMuted`, `isMuted`, `playLetterName`, `playLetterSound`

Haptics are owned by `src/design/haptics.ts` and called directly in components:
- `hapticTap()` — QuizOption.handlePress (line 134), Button, Card, HearButton, JourneyNode, LessonSummary back buttons
- `hapticSuccess()` — QuizOption selectedCorrect (line 80), StreakMilestoneOverlay (line 56), LessonSummary (line 369), ComprehensionExercise, TapInOrder, SpotTheBreak
- `hapticError()` — QuizOption selectedWrong (line 90), ComprehensionExercise, TapInOrder, SpotTheBreak
- `hapticMilestone()` — StreakMilestoneOverlay streak>=7 (line 55), LessonSummary goalCompleted (line 367), LetterReveal Alif appearance (line 22), LetterMasteryCelebration
- `hapticSelection()` — BismillahMoment (line 16)

## Priority-Gated Playback

### The Problem

The planned SFX lane will use a single `AudioPlayer`. Calling `replace()` kills any in-progress sound. Without rules, a fast sequence (e.g., two `correct` sounds within 200ms) would cut off the first.

### The Solution: Priority + Guard Window

Each sound has a **priority** (1 = highest). When a sound is playing, any new request with equal or higher priority number (i.e., equal or lower importance) is dropped until the **guard window** elapses. A higher-importance sound (lower priority number) always interrupts.

```
SFX request arrives:
  if muted → skip
  if a sound is playing
    AND new priority >= playing priority (equal or lower importance)
    AND guard window has not elapsed
    → drop the request
  else → replace + play, record priority + timestamp
```

Priority table:

| Priority | Sounds | Guard (ms) |
|----------|--------|------------|
| 1 | `lesson_complete_perfect`, `sacred_moment`, `onboarding_complete` | 1200 |
| 2 | `lesson_complete` | 800 |
| 3 | `correct`, `wrong`, `lesson_start` | 400 |

Example: `lesson_complete_perfect` (priority 1) plays. For the next 1200ms, nothing can interrupt it — not another priority-1, not a priority-3. A `correct` (priority 3) plays. For 400ms, another `correct` or `wrong` is dropped, but a `lesson_complete` (priority 2) would interrupt immediately.

~15 lines of code. No queuing, no mixing, no second AudioPlayer.

### Implementation

```typescript
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
  const player = getSFXPlayer();
  player.replace(source);
  player.play();
  _playing = { priority, startedAt: now, guardMs };
}
```

## Phase 1 Sound Map — 7 Sounds

### 1. `correct`

- **Priority:** 3 | **Guard:** 400ms
- **Trigger:** User answers correctly in a quiz or exercise
- **Wiring points:**
  - `src/components/LessonQuiz.tsx` line 168 — inside `handleSelect` callback, in the `if (correct)` branch, before the `setTimeout`
  - `src/components/onboarding/steps/LetterQuiz.tsx` — inside `handleCheckAnswer`, in the `if (correct)` branch
  - `src/components/exercises/ComprehensionExercise.tsx` — correct answer handler (alongside existing `hapticSuccess()`)
  - `src/components/exercises/TapInOrder.tsx` — correct tap handler
  - `src/components/exercises/SpotTheBreak.tsx` — correct selection handler
- **Feel:** Bright, warm chime. Single ascending note with gentle resonance. ~0.5s.

### 2. `wrong`

- **Priority:** 3 | **Guard:** 400ms
- **Trigger:** User answers incorrectly
- **Wiring points:**
  - `src/components/LessonQuiz.tsx` line 170 — inside `handleSelect` callback, in the `else` (wrong) branch, before `wrongFlashOpacity`
  - `src/components/onboarding/steps/LetterQuiz.tsx` — inside `handleCheckAnswer`, in the else branch
  - `src/components/exercises/ComprehensionExercise.tsx` — wrong answer handler
  - `src/components/exercises/TapInOrder.tsx` — wrong tap handler
  - `src/components/exercises/SpotTheBreak.tsx` — wrong selection handler
- **Feel:** Soft low-pitched muted tone. Gentle, not punishing. ~0.5s.

### 3. `lesson_start`

- **Priority:** 3 | **Guard:** 400ms
- **Trigger:** User taps the Start button on lesson intro, transitioning to quiz
- **Wiring point:**
  - `app/lesson/[id].tsx` line 245 — inside the `onStart` callback of `<LessonIntro>`, which calls `setStage("quiz")`
- **Feel:** Encouraging opening tone. Warm chime with gentle resonance. ~0.8s. Says "let's go."

### 4. `lesson_complete`

- **Priority:** 2 | **Guard:** 800ms
- **Trigger:** Lesson summary screen mounts and user passed (not perfect)
- **Wiring point:**
  - `src/components/LessonSummary.tsx` — new `useEffect` on mount, fires when `passed === true && percentage < 100`. Plays alongside existing haptics (lines 367-371 already fire hapticMilestone/hapticSuccess/hapticTap based on score tier).
- **Feel:** Warm ascending chime sequence. Two gentle tones rising. Satisfying resolution. ~1.2s.

### 5. `lesson_complete_perfect`

- **Priority:** 1 | **Guard:** 1200ms
- **Trigger:** Lesson summary screen mounts and user scored 100%
- **Wiring point:**
  - `src/components/LessonSummary.tsx` — same `useEffect` as above, fires when `passed === true && percentage === 100`. Plays **instead of** `lesson_complete`, not in addition.
- **Feel:** Celebratory chime sequence. Three ascending bright tones with gentle shimmer. Joyful and elegant. ~1.8s. The 1200ms guard window prevents confetti or any other sound from cutting it off.

### 6. `onboarding_complete`

- **Priority:** 1 | **Guard:** 1200ms
- **Trigger:** User finishes the onboarding flow
- **Wiring point:**
  - `src/components/onboarding/OnboardingFlow.tsx` — inside `handleFinish()`, immediately after the successful `await updateProfile(...)` call, before navigation. The sound should only fire once the profile state is committed — if save fails, no celebration.
- **Feel:** Welcoming completion fanfare. Warm, bright, celebratory but not over-the-top. Feels like arriving, not winning. ~1.5s.

### 7. `sacred_moment`

- **Priority:** 1 | **Guard:** 1200ms
- **Trigger:** Reverent Islamic text appears — used sparingly
- **Wiring points:**
  - `src/components/onboarding/steps/BismillahMoment.tsx` line 15 — inside the `useEffect` on mount, alongside existing `hapticSelection()`. This is the Bismillah reveal during onboarding.
  - `src/components/onboarding/steps/LetterReveal.tsx` line 20 — inside the `useEffect` timeout at `LETTER_REVEAL_HAPTIC_DELAY`, alongside `hapticMilestone()`. This is Alif appearing for the first time. **Note:** this doubles as the "first letter" moment. A separate `first_letter` sound was considered but cut — `sacred_moment` covers the reverence of this moment, and the haptic milestone already handles the excitement.
- **NOT wired to:** wird-intro (too frequent — plays every session), return-welcome hadith (too casual). Only the two most significant moments.
- **Feel:** Single sustained warm note. Like a soft oud string or distant bell that fades slowly over ~2s. Atmospheric, not melodic. Should make the user pause. This is the hardest sound to get right — if it feels cinematic or gamey, cut it entirely.

## Phase 2 Backlog (not in this implementation)

These sounds ship only after Phase 1 is tested and approved:

| Sound | Trigger | Why deferred |
|-------|---------|-------------|
| `unlock` | New lesson/phase becomes available | Trigger is implicit (unlock state derived from progress); needs ref tracking to detect transitions — define concrete wiring before implementing |
| `option_tap` | Quiz option selection | Haptics already cover this; test if it's missed |
| `streak_small` | 3-5 streak banner | Low value; banner animation is sufficient |
| `streak_big` | 7+ streak milestone overlay | Overlay + haptic may be enough |
| `mastery_level_up` | Letter advances mastery state | Needs mastery breakdown data plumbed to summary |
| `phase_complete` | Phase complete screen | Rare event; test with `lesson_complete_perfect` first |
| `confetti_burst` | Confetti animation on summary | Would compete with `lesson_complete_perfect` on single lane |
| `progress_reveal` | Progress screen stats animate in | Subtle; may not be noticed |
| `return_welcome` | Return welcome screen | May feel intrusive after absence |
| `quiz_progress` | Progress bar advances | Would compete with `correct` sound on single lane |
| `first_letter` | Alif revealed in onboarding | Covered by `sacred_moment` in Phase 1 |

## player.ts Changes — Exact Diff

### Add to player.ts

1. **SFX_ASSETS map** — 7 `require()` entries for WAV files in `assets/audio/effects/`
2. **SFX player lane** — new `_sfxPlayer` AudioPlayer instance (separate from `_voicePlayer`)
3. **Priority-gated playback** — `PlayingState` tracking + gated `playSFX()` function (~15 lines)
4. **7 exported helper functions** — each wraps `playSFX(source, priority, guardMs)`:
   - `playCorrect()` — priority 3, guard 400ms
   - `playWrong()` — priority 3, guard 400ms
   - `playLessonStart()` — priority 3, guard 400ms
   - `playLessonComplete()` — priority 2, guard 800ms
   - `playLessonCompletePerfect()` — priority 1, guard 1200ms
   - `playOnboardingComplete()` — priority 1, guard 1200ms
   - `playSacredMoment()` — priority 1, guard 1200ms

No haptics in any of these functions. Audio only.

### Do NOT add

- No `getSFXAsset()` export — no component should use `useAudioPlayer` for SFX
- No `SFXName` type export — internals stay internal
- No haptics inside helpers — all haptic feedback stays in the UI layer (`src/design/haptics.ts`)

### Verify: no direct SFX playback in components

`useAudioPlayer()` calls in components are acceptable **only for letter audio** (via `getLetterAsset()`). Any component that uses `useAudioPlayer` for SFX playback must be refactored to helper-based playback as part of this implementation. A repo-wide search should verify no direct SFX playback remains before wiring new sounds.

## Sourcing the Sounds

Sounds are sourced manually by the founder. Requirements per file:
- **Format:** WAV preferred (44.1kHz, 16-bit, mono). MP3 acceptable if that's what you find — expo-audio handles both. Name with matching extension (e.g., `correct.wav` or `correct.mp3`); the `require()` path in SFX_ASSETS will match.
- **Loudness:** Target ~-16 LUFS as a starting point, but perceived balance across the set matters more than hitting one exact number. If a sound feels right at -14 or -18, keep it.
- **Trimmed:** No leading/trailing silence
- **Named:** `{id}.wav` or `{id}.mp3` (e.g., `correct.wav`, `sacred_moment.wav`)
- **Location:** `assets/audio/effects/`

## Files Modified

| Action | File | What changes |
|--------|------|-------------|
| Modify | `src/audio/player.ts` | Add SFX_ASSETS (7 entries), SFX player lane, priority-gated playback, 7 helper exports |
| Modify | `src/components/LessonQuiz.tsx` | Import + call `playCorrect()`/`playWrong()` in `handleSelect` |
| Modify | `src/components/LessonSummary.tsx` | Import + call `playLessonComplete()`/`playLessonCompletePerfect()` in mount effect |
| Modify | `src/components/onboarding/OnboardingFlow.tsx` | Import + call `playOnboardingComplete()` in `handleFinish` |
| Modify | `src/components/onboarding/steps/BismillahMoment.tsx` | Import + call `playSacredMoment()` in mount effect |
| Modify | `src/components/onboarding/steps/LetterReveal.tsx` | Import + call `playSacredMoment()` in timeout effect |
| Modify | `src/components/onboarding/steps/LetterQuiz.tsx` | Import + call `playCorrect()`/`playWrong()` in answer handler |
| Modify | `app/lesson/[id].tsx` | Import + call `playLessonStart()` in onStart callback |
| Modify | `src/components/exercises/ComprehensionExercise.tsx` | Import + call `playCorrect()`/`playWrong()` |
| Modify | `src/components/exercises/TapInOrder.tsx` | Import + call `playCorrect()`/`playWrong()` |
| Modify | `src/components/exercises/SpotTheBreak.tsx` | Import + call `playCorrect()`/`playWrong()` |
| Create | `assets/audio/effects/*` | 7 manually-sourced sound files (WAV or MP3) |

**No new dependencies** and no broad architectural rewrite. This is a small extension to the existing audio module — adding an SFX player lane and priority-gated playback alongside the existing voice lane. Same bundled-asset pattern as letter audio.

## Out of Scope

- Runtime/dynamic audio generation
- Letter pronunciation audio (untouched)
- Adaptive volume
- Sound settings UI beyond existing mute toggle
- SFX generation pipeline (removed, staying removed)
- Multi-lane mixing / simultaneous playback
- Phase 2 sounds (backlog above)
