# SFX Sound Map Design

**Date:** 2026-03-29
**Status:** Draft
**Scope:** 18 sound effects mapped to specific app triggers, with integration points

## Philosophy

**Warm & present** — sound accompanies key interactions and meaningful moments. Not every button, not every animation. Sounds are earned, not constant. The app feels alive and responsive without being noisy.

- **Haptics handle tactile feedback** for all buttons and interactions
- **Sound is reserved for moments that matter** — answers, completions, milestones, celebrations
- **Sacred/Islamic moments get a distinct ambient tone** — not a sound effect, an atmosphere shift
- **No universal tap sound** — only key buttons (quiz options, lesson start, onboarding choices)

## Sound Aesthetic

Peaceful and tranquil baseline — warm wooden tones, gentle chimes, mellow notes. Celebratory energy scales with event importance:

| Intensity | Feel | Examples |
|-----------|------|----------|
| **low** | Subtle, barely-there, peaceful | option tap, quiz progress tick, progress reveal |
| **medium** | Warm encouragement, gentle reward | correct answer, lesson complete, mastery level up |
| **high** | Full celebration, excitement | phase complete, perfect score, streak milestone |

## Sound Map — 18 Sounds

### Feedback (3 sounds)

#### `correct`
- **File:** `assets/audio/effects/correct.wav`
- **Trigger:** User answers a quiz question correctly
- **Where:** `src/components/LessonQuiz.tsx` — inside `handleOptionPress` when `opt.isCorrect === true`
- **Also:** `src/components/onboarding/steps/LetterQuiz.tsx` — correct answer in onboarding quiz
- **Also:** `src/components/exercises/ComprehensionExercise.tsx` — correct answer
- **Also:** `src/components/exercises/TapInOrder.tsx` — correct tap
- **Also:** `src/components/exercises/SpotTheBreak.tsx` — correct selection
- **Intensity:** medium
- **Duration:** ~0.5s
- **Description:** Bright, warm chime. Instant positive reinforcement. Single ascending note with gentle resonance.

#### `wrong`
- **File:** `assets/audio/effects/wrong.wav`
- **Trigger:** User answers a quiz question incorrectly
- **Where:** `src/components/LessonQuiz.tsx` — inside `handleOptionPress` when answer is wrong
- **Also:** `src/components/onboarding/steps/LetterQuiz.tsx` — wrong answer in onboarding quiz
- **Also:** `src/components/exercises/ComprehensionExercise.tsx` — wrong answer
- **Also:** `src/components/exercises/TapInOrder.tsx` — wrong tap
- **Also:** `src/components/exercises/SpotTheBreak.tsx` — wrong selection
- **Intensity:** low
- **Duration:** ~0.5s
- **Description:** Soft low-pitched muted tone. Gentle negative indicator — not harsh, not punishing. Brief and mellow.

#### `option_tap`
- **File:** `assets/audio/effects/option_tap.wav`
- **Trigger:** Selecting a quiz option, key onboarding choices, lesson start button
- **Where:** `src/design/components/QuizOption.tsx` — inside `handlePress`
- **Also:** `src/components/onboarding/steps/StartingPoint.tsx` — selecting starting point
- **Also:** `src/components/onboarding/steps/LetterQuiz.tsx` — selecting answer option
- **Intensity:** low
- **Duration:** ~0.5s
- **Description:** Subtle wooden tap. Like tapping polished wood. Tactile, satisfying, minimal.

### Lesson Flow (4 sounds)

#### `lesson_start`
- **File:** `assets/audio/effects/lesson_start.wav`
- **Trigger:** Transitioning from lesson intro to quiz
- **Where:** `src/components/LessonIntro.tsx` — when the "Start" CTA button is pressed
- **Intensity:** medium
- **Duration:** ~0.8s
- **Description:** Encouraging opening tone. Warm chime with gentle resonance. Says "let's go" without being aggressive.

#### `lesson_complete`
- **File:** `assets/audio/effects/lesson_complete.wav`
- **Trigger:** Lesson summary screen appears and user passed
- **Where:** `src/components/LessonSummary.tsx` — on mount when `passed === true`
- **Intensity:** medium
- **Duration:** ~1.2s
- **Description:** Warm ascending chime sequence. Two gentle tones rising. Satisfying resolution — "you did it."

#### `lesson_complete_perfect`
- **File:** `assets/audio/effects/lesson_complete_perfect.wav`
- **Trigger:** Lesson summary screen appears and user scored 100%
- **Where:** `src/components/LessonSummary.tsx` — on mount when `passed === true && isPerfect`
- **Plays instead of:** `lesson_complete` (not in addition to)
- **Intensity:** high
- **Duration:** ~1.8s
- **Description:** Celebratory chime sequence. Three ascending bright tones with gentle shimmer. Joyful, exciting, but still elegant. The "wow" moment.

#### `quiz_progress`
- **File:** `assets/audio/effects/quiz_progress.wav`
- **Trigger:** Progress bar advances after a correct answer
- **Where:** `src/components/LessonQuiz.tsx` — after correct answer, when progress bar animates
- **Intensity:** low
- **Duration:** ~0.5s
- **Description:** Very subtle tick/advance. Barely-there forward momentum. Like a soft click of progress. Should not compete with `correct` sound — plays slightly after it (200ms delay).

### Celebrations & Milestones (5 sounds)

#### `streak_small`
- **File:** `assets/audio/effects/streak_small.wav`
- **Trigger:** Streak banner appears (3-5 correct in a row)
- **Where:** `src/components/quiz/StreakBanner.tsx` — on mount when streak reaches threshold
- **Intensity:** low-medium
- **Duration:** ~0.6s
- **Description:** Quick sparkle. Light, bright, brief celebration. Acknowledges the streak without breaking flow.

#### `streak_big`
- **File:** `assets/audio/effects/streak_big.wav`
- **Trigger:** Streak milestone overlay appears (7+ correct in a row)
- **Where:** `src/components/quiz/StreakMilestoneOverlay.tsx` — on mount
- **Intensity:** high
- **Duration:** ~1.5s
- **Description:** Triumphant mini-fanfare. Layered ascending tones with shimmer. This is a big deal — the sound should match the full-screen overlay moment.

#### `mastery_level_up`
- **File:** `assets/audio/effects/mastery_level_up.wav`
- **Trigger:** Letter advances to a new mastery state, shown in lesson summary
- **Where:** `src/components/LessonSummary.tsx` — when `letterBreakdown.strong.length > 0` (letters leveled up)
- **Intensity:** medium
- **Duration:** ~1.0s
- **Description:** Ascending warm tone. Growth and progression. Like a level-up notification but gentle and encouraging.

#### `phase_complete`
- **File:** `assets/audio/effects/phase_complete.wav`
- **Trigger:** Phase complete celebration screen
- **Where:** `app/phase-complete.tsx` — on mount
- **Intensity:** high
- **Duration:** ~2.0s
- **Description:** Full celebration. The biggest sonic moment in the app. Layered chimes, gentle cymbal shimmer, triumphant but warm. This happens only a few times in the entire user journey.

#### `confetti_burst`
- **File:** `assets/audio/effects/confetti_burst.wav`
- **Trigger:** Confetti animation fires on lesson summary
- **Where:** `src/components/LessonSummary.tsx` — when confetti particles spawn
- **Intensity:** medium-high
- **Duration:** ~0.8s
- **Description:** Layered pop/burst. Party popper feel — multiple quick pops layered together. Joyful and surprising.

### Onboarding & Wird (3 sounds)

#### `sacred_moment`
- **File:** `assets/audio/effects/sacred_moment.wav`
- **Trigger:** Bismillah reveal, Hadith text display, Wird text appears
- **Where:** `app/wird-intro.tsx` — when wird/hadith text phases reveal
- **Also:** `src/components/onboarding/steps/BismillahMoment.tsx` — Bismillah reveal moment
- **Also:** `app/return-welcome.tsx` — hadith card display (optional, may be too frequent)
- **Intensity:** low
- **Duration:** ~2.0s (sustained, not a sharp sound)
- **Description:** Single sustained warm note. Like a soft oud string or a distant bell that fades slowly. Not a "sound effect" — an atmosphere shift. Signals reverence and stillness. This sound should make the user pause and feel the weight of the moment.

#### `first_letter`
- **File:** `assets/audio/effects/first_letter.wav`
- **Trigger:** Alif is revealed for the first time during onboarding
- **Where:** `src/components/onboarding/steps/LetterReveal.tsx` — when the letter fades in (after LETTER_REVEAL_HAPTIC_DELAY ~1.1s)
- **Intensity:** medium-high
- **Duration:** ~1.5s
- **Description:** Special, memorable tone. This is the user's first encounter with an Arabic letter. Should feel like a door opening. Warm, resonant, slightly magical. Distinct from every other sound in the app — this moment only happens once.

#### `onboarding_complete`
- **File:** `assets/audio/effects/onboarding_complete.wav`
- **Trigger:** User finishes onboarding flow
- **Where:** `src/components/onboarding/OnboardingFlow.tsx` — inside `handleFinish` when onboarding completes
- **Intensity:** high
- **Duration:** ~1.5s
- **Description:** Welcoming completion fanfare. Says "you're in, welcome to Tila." Warm, bright, celebratory but not over-the-top. Should feel like arriving, not like winning.

### Progress & Navigation (3 sounds)

#### `progress_reveal`
- **File:** `assets/audio/effects/progress_reveal.wav`
- **Trigger:** Stats and progress data animate in on the progress screen
- **Where:** `app/(tabs)/progress.tsx` — when `!progress.loading && completedLessonIds.length > 0`
- **Intensity:** low
- **Duration:** ~0.8s
- **Description:** Gentle shimmer. Stats unveiling. Like a soft curtain pull revealing something beautiful. Subtle and ambient.

#### `unlock`
- **File:** `assets/audio/effects/unlock.wav`
- **Trigger:** New lesson or phase becomes available/unlocked
- **Where:** `src/components/home/JourneyNode.tsx` or `src/components/home/LessonGrid.tsx` — when a previously locked node transitions to available
- **Also:** Phase unlock moment if separate from phase_complete
- **Intensity:** medium
- **Duration:** ~0.8s
- **Description:** Bright, exciting reveal. Something new awaits. Like a lock clicking open followed by a brief chime. Forward momentum and possibility.

#### `return_welcome`
- **File:** `assets/audio/effects/return_welcome.wav`
- **Trigger:** Return welcome screen appears after user has been away
- **Where:** `app/return-welcome.tsx` — on mount
- **Intensity:** low
- **Duration:** ~1.0s
- **Description:** Warm, gentle greeting. "Welcome back." Soft, inviting tone that feels like coming home. Should comfort, not startle — the user hasn't touched the app in a while.

## Implementation Approach

### Architecture

The existing `src/audio/player.ts` pattern is reused. SFX assets are bundled as static WAV files, loaded via `require()`, and played through a dedicated SFX audio player lane (separate from the voice/letter audio lane).

### player.ts Changes

1. **Restore SFX_ASSETS map** with 18 entries (require() calls for each WAV)
2. **Restore SFX player lane** (separate AudioPlayer instance)
3. **Restore playSFX() internal function**
4. **Export 18 named helper functions** — each wraps playSFX() and optionally calls Haptics:
   - `playCorrect()` — playSFX + Haptics.notificationAsync(Success)
   - `playWrong()` — playSFX + Haptics.notificationAsync(Error)
   - `playOptionTap()` — playSFX + Haptics.impactAsync(Light)
   - `playLessonStart()` — playSFX only
   - `playLessonComplete()` — playSFX + Haptics.notificationAsync(Success)
   - `playLessonCompletePerfect()` — playSFX + Haptics.notificationAsync(Success)
   - `playQuizProgress()` — playSFX only
   - `playStreakSmall()` — playSFX only
   - `playStreakBig()` — playSFX + Haptics.impactAsync(Heavy)
   - `playMasteryLevelUp()` — playSFX + Haptics.impactAsync(Medium)
   - `playPhaseComplete()` — playSFX + Haptics.notificationAsync(Success)
   - `playConfettiBurst()` — playSFX only
   - `playSacredMoment()` — playSFX only (no haptics — keep it still)
   - `playFirstLetter()` — playSFX + Haptics.notificationAsync(Success)
   - `playOnboardingComplete()` — playSFX + Haptics.notificationAsync(Success)
   - `playProgressReveal()` — playSFX only
   - `playUnlock()` — playSFX + Haptics.impactAsync(Medium)
   - `playReturnWelcome()` — playSFX only

### Wiring Pattern

Each sound is wired at a specific code location. The pattern is:
1. Import the helper function from `../audio/player`
2. Call it at the exact trigger point (usually inside a useEffect, callback, or event handler)

No new architecture, no new dependencies. Same pattern used before.

## Sourcing the Sounds

Sounds will be sourced manually by the founder — not generated by AI. Each sound should be:
- **WAV format**, 44.1kHz, 16-bit, mono
- **Normalized** to -16 LUFS (use ffmpeg if needed)
- **Trimmed** of leading/trailing silence
- Placed in `assets/audio/effects/`

The founder will find and provide each sound file. Implementation will wire them into the app.

## Out of Scope

- Runtime/dynamic audio generation
- Letter pronunciation audio (already exists, stays untouched)
- Adaptive volume based on device/time-of-day
- User-facing sound settings UI (mute toggle already exists)
- SFX generation pipeline (removed — sounds are manually sourced)
