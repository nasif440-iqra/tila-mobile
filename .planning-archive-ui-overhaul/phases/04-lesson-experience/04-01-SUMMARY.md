---
phase: 04-lesson-experience
plan: 01
subsystem: exercises, lesson-hybrid
tags: [haptics, springs, design-system, stage-badges, transitions]
dependency_graph:
  requires: [04-00]
  provides: [centralized-haptics-in-exercises, design-spring-presets, stage-badge-tokens, exercise-fades]
  affects: [src/components/exercises/*, src/components/LessonHybrid.tsx]
tech_stack:
  added: []
  patterns: [centralized-haptics, design-system-springs, design-token-badges, layout-animations]
key_files:
  created:
    - src/design/haptics.ts
    - src/design/animations.ts
  modified:
    - src/components/exercises/GuidedReveal.tsx
    - src/components/exercises/TapInOrder.tsx
    - src/components/exercises/BuildUpReader.tsx
    - src/components/exercises/FreeReader.tsx
    - src/components/exercises/SpotTheBreak.tsx
    - src/components/exercises/ComprehensionExercise.tsx
    - src/components/LessonHybrid.tsx
decisions:
  - WarmGlow used with simple size/opacity API (worktree has simpler WarmGlow than plan assumed)
  - Stage badges use unified primarySoft/primary colors (removed per-stage color variation for consistency)
  - Replaced onboarding/animations transition constants with design/animations durations
metrics:
  completed: "2026-03-28"
  tasks: 3
  files: 9
---

# Phase 04 Plan 01: Exercise Haptics, Springs, Badges, and Transitions Summary

Migrated all 6 exercise components and LessonHybrid to use centralized design system utilities for haptics, spring animations, stage badges, and exercise transitions.

## What Was Done

### Task 1: Migrate haptics in all 6 exercise components (e90bc76)

Replaced direct `expo-haptics` imports with centralized `design/haptics` utilities across all 6 exercise files:
- **GuidedReveal**: `hapticTap()` + WarmGlow behind letter header
- **TapInOrder**: `hapticSuccess()` + `hapticError()`
- **BuildUpReader**: `hapticTap()`
- **FreeReader**: `hapticSuccess()` + `hapticTap()`
- **SpotTheBreak**: `hapticSuccess()` + `hapticError()`
- **ComprehensionExercise**: `hapticSuccess()` + `hapticError()`

Also created `src/design/haptics.ts` and `src/design/animations.ts` (these exist in parallel branches but were missing from this worktree).

### Task 2: Migrate LessonHybrid spring config and haptics (5380aa9)

- Replaced hardcoded spring config `{stiffness: 120, damping: 20}` with `springs.gentle` preset
- Replaced direct `expo-haptics` import with `hapticTap` utility
- Added `hapticTap()` feedback on close button press

### Task 3: Stage badge tokens (D-11) and exercise transition fades (D-12) (7032d15)

- **D-11**: Stage indicator badges now use `colors.primarySoft` background and `colors.primary` text consistently (removed per-stage color variation)
- Badge styling: 12px border radius pill shape, Inter font at 13px, 600 weight
- **D-12**: Exercise transitions use `durations.normal` (300ms) for entering and `durations.fast` (150ms) for exiting via design system presets
- Removed dependency on `onboarding/animations` transition constants

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] WarmGlow API mismatch**
- **Found during:** Task 1
- **Issue:** Plan assumed WarmGlow had `animated`, `color`, `pulseMin`, `pulseMax` props, but the worktree version only accepts `size` and `opacity`
- **Fix:** Used WarmGlow with `size={120}` and `opacity={0.12}` matching the actual API
- **Files modified:** src/components/exercises/GuidedReveal.tsx
- **Commit:** e90bc76

**2. [Rule 3 - Blocking] Missing design system files in worktree**
- **Found during:** Task 1
- **Issue:** `src/design/haptics.ts` and `src/design/animations.ts` do not exist in this worktree (created by parallel branches 01-01 and 01-03)
- **Fix:** Created both files with identical content from the parallel branches
- **Files created:** src/design/haptics.ts, src/design/animations.ts
- **Commit:** e90bc76

## Verification Results

- Zero files in `src/components/exercises/` contain `import * as Haptics from "expo-haptics"` -- PASS
- Zero files in `src/components/LessonHybrid.tsx` contain `import * as Haptics` -- PASS
- All 6 exercise files import from `design/haptics` -- PASS
- GuidedReveal renders WarmGlow with `size={120}` -- PASS
- LessonHybrid uses `springs.gentle` (no `stiffness: 120`) -- PASS
- LessonHybrid uses `FadeIn`/`FadeOut` with `durations.normal`/`durations.fast` -- PASS
- LessonHybrid stage badge uses `colors.primarySoft` -- PASS
- Pre-existing type errors in SpotTheBreak.tsx (theme color narrowing) are not caused by this plan's changes

## Known Stubs

None -- all functionality is fully wired.

## Self-Check: PASSED

- All 9 files (2 created, 7 modified) verified to exist
- All 3 commits verified: e90bc76, 5380aa9, 7032d15
- All verification grep checks pass
