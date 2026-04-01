---
phase: 02-onboarding-wow-factor
plan: "00"
subsystem: testing
tags: [test-stubs, onboarding, bismillah, warm-glow, animations]
dependency_graph:
  requires: []
  provides: [onboarding-flow-tests, bismillah-tests, warm-glow-tests, onboarding-animations-tests]
  affects: [02-01, 02-02, 02-03]
tech_stack:
  added: []
  patterns: [vitest-todo-stubs, regression-guard-tests]
key_files:
  created:
    - src/__tests__/onboarding-flow.test.ts
    - src/__tests__/bismillah.test.ts
    - src/__tests__/warm-glow.test.ts
    - src/__tests__/onboarding-animations.test.ts
  modified: []
decisions:
  - Used it.todo() for forward-looking stubs, real assertions only for existing exports
  - Regression guard tests verify existing animation constants are not accidentally changed
metrics:
  duration_seconds: 78
  completed: "2026-03-28T14:55:54Z"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 02 Plan 00: Test Stubs for Phase 2 Requirements Summary

Four Vitest test stub files covering all 6 Phase 2 requirement IDs (ONB-01 through ONB-04, MIND-01, MIND-02), with 6 real regression assertions for existing animation constants and 22 todo placeholders for implementation plans to fill.

## What Was Done

### Task 1: Onboarding-flow and Bismillah test stubs
- Created `src/__tests__/onboarding-flow.test.ts` with 7 todo stubs covering ONB-01 (9-step flow), ONB-02 (LetterReveal sacred moment), ONB-03 (step transitions)
- Created `src/__tests__/bismillah.test.ts` with 8 todo stubs covering MIND-01 (Bismillah auto-advance), MIND-02 (session detection + overlay opacity guard)
- **Commit:** e289323

### Task 2: Warm-glow and Onboarding-animations test stubs
- Created `src/__tests__/warm-glow.test.ts` with 4 todo stubs covering ONB-04 (WarmGlow animated variant + backward-compat guard)
- Created `src/__tests__/onboarding-animations.test.ts` with 6 real assertions verifying existing STAGGER/SPLASH/CTA constants plus 3 todo stubs for new Phase 2 constants (BISMILLAH_DISPLAY_DURATION, STILLNESS_BEAT_DURATION, LETTER_REVEAL_HAPTIC_DELAY)
- **Commit:** 22f0318

## Test Results

- Full suite: 10 passed, 3 skipped, 394 passing tests + 22 todo
- New files: 6 real assertions pass, 22 todo stubs registered
- No failures

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. **Regression guards use exact value assertions** - Tests check both type and exact numeric value (e.g., `STAGGER_BASE === 150`) to catch accidental changes during Plan 01/02 modifications
2. **Forward-looking comment in onboarding-flow.test.ts** - Added comment noting STEP constants are created in Plan 02-02, so executors know the stubs are intentionally unresolvable until then

## Known Stubs

None - these are test stub files by design. The todo tests are intentional placeholders to be filled during Plans 02-01, 02-02, and 02-03.

## Self-Check: PASSED

- All 4 test files exist
- Commit e289323 found
- Commit 22f0318 found
