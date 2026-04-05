---
phase: 02-quiz-experience
plan: 01
subsystem: quiz-ui
tags: [typography, quiz, arabic-text, warm-glow, letter-hero]
dependency_graph:
  requires: []
  provides: [quizOption-size-tier, enlarged-letter-hero]
  affects: [src/design/components/ArabicText.tsx, src/components/quiz/QuizQuestion.tsx]
tech_stack:
  added: []
  patterns: [semantic-size-alias, source-audit-testing]
key_files:
  created:
    - src/__tests__/quiz-letterhero.test.ts
  modified:
    - src/design/components/ArabicText.tsx
    - src/components/quiz/QuizQuestion.tsx
decisions:
  - quizOption is a semantic alias mapping to the same arabicQuizHero token (52px/114px) for quiz option context
metrics:
  duration: 92s
  completed: "2026-04-05T05:49:35Z"
  tasks_completed: 2
  tasks_total: 2
  test_count: 10
  test_pass: 10
---

# Phase 02 Plan 01: Quiz LetterHero & Typography Tier Summary

Added quizOption semantic size alias to ArabicText (52px/114px via arabicQuizHero token) and enlarged the LetterHero circle from 120px to 160px with 240px WarmGlow breathing animation for dominant Arabic letter presence on quiz screens.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add quizOption size tier to ArabicText + write tests | 0b759fa | src/design/components/ArabicText.tsx, src/__tests__/quiz-letterhero.test.ts |
| 2 | Enlarge LetterHero circle to 160px with 240px WarmGlow | 8869aff | src/components/quiz/QuizQuestion.tsx |

## Changes Made

### Task 1: quizOption Typography Tier (TDD)
- Added `quizOption` to the `ArabicSize` type union in ArabicText.tsx
- Added `quizOption: typography.arabicQuizHero` entry in SIZE_MAP as semantic alias
- Created `quiz-letterhero.test.ts` with 10 source-audit tests covering both ArabicText and QuizQuestion

### Task 2: LetterHero Enlargement
- Updated letterCircle dimensions: 120px -> 160px diameter (borderRadius 60 -> 80)
- Increased WarmGlow size: 180px -> 240px (maintains 1.5x ratio to circle)
- Switched WarmGlow import from shim path (`../onboarding/WarmGlow`) to canonical path (`../../design/atmosphere/WarmGlow`)

## Verification

- All 10 quiz-letterhero tests pass
- Full test suite: 755 passed, 0 failed (72 test files)
- No typecheck regressions expected (quizOption added to both type union and SIZE_MAP)

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED
