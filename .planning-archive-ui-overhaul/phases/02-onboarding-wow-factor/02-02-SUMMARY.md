---
phase: 02-onboarding-wow-factor
plan: 02
subsystem: onboarding-flow-orchestration
tags: [onboarding, bismillah, reanimated, haptics, step-constants]
dependency_graph:
  requires: [02-00, 02-01]
  provides: [BismillahMoment, 9-step-onboarding, STEP-constants, elevated-screens]
  affects: [02-03]
tech_stack:
  added: []
  patterns: [named-step-constants, auto-advance-via-component-timer, animated-WarmGlow]
key_files:
  created:
    - src/components/onboarding/steps/BismillahMoment.tsx
  modified:
    - src/components/onboarding/OnboardingFlow.tsx
    - src/components/onboarding/steps/Welcome.tsx
    - src/components/onboarding/steps/Tilawat.tsx
    - src/components/onboarding/steps/Hadith.tsx
decisions:
  - "Named STEP constants object replaces raw numeric indices to prevent off-by-one bugs after Bismillah insertion"
  - "BismillahMoment handles its own auto-advance timer internally via setTimeout(onNext, BISMILLAH_DISPLAY_DURATION)"
  - "LetterReveal auto-advance increased from 3500ms to 4500ms to account for stillness beat per UI-SPEC"
  - "Welcome uses BrandedLogo (animated SVG) instead of inline LogoMark SVG function"
metrics:
  duration: ~4min
  completed: 2026-03-28
---

# Phase 02 Plan 02: Onboarding Flow Orchestration and Screen Elevation Summary

9-step onboarding with BismillahMoment sacred breathing pause at step 4, named STEP constants preventing off-by-one bugs, and elevated Welcome/Tilawat/Hadith screens with animated WarmGlow pulsing and updated CTA copy.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create BismillahMoment step + rewrite OnboardingFlow to 9 steps | cba7b2f | BismillahMoment.tsx, OnboardingFlow.tsx |
| 2 | Elevate Welcome, Tilawat, and Hadith screens | f58fa01 | Welcome.tsx, Tilawat.tsx, Hadith.tsx |

## What Was Built

### BismillahMoment (New)
- Sacred breathing pause step with Arabic calligraphy and English translation
- Uses OnboardingStepLayout variant="splash" with fadeInDuration=600ms (durations.dramatic)
- Animated WarmGlow with gold color, pulsing between opacity 0.12-0.25
- Auto-advances after BISMILLAH_DISPLAY_DURATION (2500ms) via internal setTimeout
- Fires hapticSelection() on mount for subtle feedback
- Full accessibility label on Arabic text
- No button, no skip, no user interaction (per D-10)

### OnboardingFlow (Rewritten)
- TOTAL_STEPS increased from 8 to 9
- Named STEP constant object: WELCOME=0, TILAWAT=1, HADITH=2, STARTING_POINT=3, BISMILLAH=4, LETTER_REVEAL=5, LETTER_AUDIO=6, LETTER_QUIZ=7, FINISH=8
- STEP_NAMES array includes 'bismillah' at index 4
- All numeric step comparisons replaced with STEP.* constants
- BismillahMoment rendered at step === STEP.BISMILLAH
- FloatingLettersLayer visibility extended to step <= STEP.STARTING_POINT (0-3)
- Progress bar hidden on STEP.BISMILLAH
- LetterReveal auto-advance uses STEP.LETTER_REVEAL constant, timeout increased to 4500ms
- Auto-advance ownership comment added
- Analytics TODO comment added for step index shift
- STEP exported for test access

### Welcome (Elevated)
- Replaced inline LogoMark SVG function with BrandedLogo component (animated, 5 shared values)
- Removed Svg, Path, Circle imports from react-native-svg
- WarmGlow changed from static (opacity=0.12) to animated (pulseMin=0.08, pulseMax=0.18)
- All other elements preserved exactly (app name, motto, tagline, CTA)

### Tilawat (Elevated)
- WarmGlow changed from static to animated (pulseMin=0.10, pulseMax=0.20)
- CTA text changed from "Begin" to "Begin Reading" per Copywriting Contract

### Hadith (Elevated)
- WarmGlow changed from static to animated (pulseMin=0.08, pulseMax=0.18)
- CTA text changed from "Continue" to "Continue Journey" per Copywriting Contract

## Decisions Made

1. **Named STEP constants**: Using `const STEP = { WELCOME: 0, ... } as const` instead of raw numbers prevents the off-by-one pitfall documented in RESEARCH.md when inserting Bismillah at index 4.

2. **Component-owned auto-advance**: BismillahMoment manages its own timer and calls onNext when done, matching the same pattern used for other self-timed steps. No additional timer needed in OnboardingFlow.

3. **LetterReveal timeout increase**: Changed from 3500ms to 4500ms to account for the stillness beat duration added in the UI-SPEC.

4. **BrandedLogo replaces LogoMark**: The inline SVG function (LogoMark) was a placeholder. Now uses the real BrandedLogo with Reanimated animations from Plan 01.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cherry-picked Plan 01 and Phase 01 dependencies**
- **Found during:** Pre-execution setup
- **Issue:** This worktree was branched from main before Plan 01 (BrandedLogo, enhanced WarmGlow, animation constants) and Phase 01 (haptics, design/animations) were committed. BismillahMoment imports hapticSelection, durations.dramatic, and BISMILLAH_DISPLAY_DURATION; Welcome imports BrandedLogo.
- **Fix:** Cherry-picked commits a415b79 (WarmGlow/FloatingLettersLayer/animations), 652d000 (BrandedLogo), 06701e8 (haptics), 8b0cc01 (design/animations) into this worktree.
- **Files added:** WarmGlow.tsx, FloatingLettersLayer.tsx, animations.ts, BrandedLogo.tsx, haptics.ts, design/animations.ts
- **Commits:** f3aac1e, 434d85f, 94cf798, c20c15d

## Verification Results

- All 411 tests pass (Vitest)
- ESLint: 0 errors in changed files (18 pre-existing errors in unrelated files)
- TypeScript: 0 errors in changed files
- OnboardingFlow renders exactly 9 steps (9 step === STEP.* comparisons)
- No raw numeric step indices remain in OnboardingFlow
- BismillahMoment has no button/touchable elements
- Welcome.tsx no longer contains any SVG path data (LogoMark removed)
- CTA copy matches UI-SPEC: "Begin Reading", "Continue Journey"
- SPLASH_STAGGER_BASE and SPLASH_STAGGER_DURATION still used in Welcome, Tilawat, Hadith (ONB-03)

## Known Stubs

None -- all components are fully implemented with real data and animations.

## Self-Check: PASSED

- [x] src/components/onboarding/steps/BismillahMoment.tsx exists
- [x] src/components/onboarding/OnboardingFlow.tsx exists
- [x] src/components/onboarding/steps/Welcome.tsx exists
- [x] src/components/onboarding/steps/Tilawat.tsx exists
- [x] src/components/onboarding/steps/Hadith.tsx exists
- [x] Commit cba7b2f exists
- [x] Commit f58fa01 exists
