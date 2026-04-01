---
phase: 01-design-foundation-transitions
plan: 03
subsystem: navigation-transitions
tags: [transitions, animations, migration, layout]
dependency_graph:
  requires: [01-01]
  provides: [screen-transition-config, animation-consumer-migration]
  affects: [app/_layout.tsx, lesson-screens, onboarding-animations]
tech_stack:
  added: []
  patterns: [centralized-animation-presets, bridge-re-export]
key_files:
  created: []
  modified:
    - app/_layout.tsx
    - app/lesson/[id].tsx
    - app/lesson/review.tsx
    - src/components/LessonHybrid.tsx
    - src/components/onboarding/animations.ts
    - src/components/onboarding/OnboardingFlow.tsx
decisions:
  - FADE_IN_DELAY (100ms) kept as local constant since no matching shared preset exists
  - OnboardingFlow.tsx migrated as Rule 3 auto-fix (not in original plan but would break)
metrics:
  duration_seconds: 243
  completed: "2026-03-28T13:22:49Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 6
---

# Phase 01 Plan 03: Screen Transitions and Animation Migration Summary

All screen routes configured with explicit transition types from shared presets; 4 consumer files migrated from onboarding/animations.ts to design/animations.ts

## What Was Done

### Task 1: Configure all screen transitions in root layout (793a153)

Modified `app/_layout.tsx` to import `screenTransitions` from `src/design/animations.ts` and replace all hardcoded animation durations:

- Default `animationDuration: 300` replaced with `screenTransitions.fade`
- `lesson/[id]` and `lesson/review` `animationDuration: 400` replaced with `screenTransitions.slideUp`
- Added explicit `Stack.Screen` configs for `wird-intro`, `phase-complete`, and `post-lesson-onboard` (all slide_from_bottom)
- Fade screens (onboarding, return-welcome, tabs) use default fade from `screenOptions`

### Task 2: Migrate animation consumers to shared presets (cffdd7c)

Migrated 4 files from `onboarding/animations.ts` TRANSITION_* constants to `design/animations.ts` durations:

| Old Constant | New Preset | Value |
|---|---|---|
| TRANSITION_FADE_IN | durations.normal | 300ms |
| TRANSITION_FADE_OUT | durations.micro | 200ms |
| TRANSITION_FADE_IN_DELAY | FADE_IN_DELAY (local) | 100ms |
| TRANSITION_LESSON_DURATION | durations.slow | 400ms |

Converted `src/components/onboarding/animations.ts` to a bridge file that re-exports `durations` and `staggers` from `design/animations.ts` while keeping onboarding-specific constants (STAGGER_BASE, STAGGER_DURATION, SPLASH_*, CTA_*).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migrated OnboardingFlow.tsx TRANSITION_* imports**
- **Found during:** Task 2
- **Issue:** `src/components/onboarding/OnboardingFlow.tsx` also imported `TRANSITION_FADE_IN` and `TRANSITION_FADE_OUT` from `./animations` but was not listed in the plan. Removing those constants from the bridge file would break this consumer.
- **Fix:** Migrated OnboardingFlow.tsx to import `durations` from `../../design/animations` and replaced `TRANSITION_FADE_IN` with `durations.normal`, `TRANSITION_FADE_OUT` with `durations.micro`.
- **Files modified:** `src/components/onboarding/OnboardingFlow.tsx`
- **Commit:** cffdd7c

## Verification Results

- All 405 tests pass
- No TRANSITION_* constants referenced in any runtime code (only docs)
- No hardcoded animationDuration values in _layout.tsx
- All 5 modal screens use screenTransitions.slideUp
- Default fade uses screenTransitions.fade
- Bridge file re-exports shared presets
- Pre-existing lint/typecheck errors unrelated to this plan's changes

## Known Stubs

None - all values are wired to real presets from design/animations.ts.

## Self-Check: PASSED

- All 6 modified files exist in worktree
- Commit 793a153 (Task 1) confirmed at creation
- Commit cffdd7c (Task 2) confirmed at creation
- All 405 tests pass
- No TRANSITION_* constants in runtime code
