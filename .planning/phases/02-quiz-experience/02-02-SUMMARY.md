---
phase: 02-quiz-experience
plan: 02
subsystem: quiz-feedback
tags: [animation, feedback, warm-palette, accessibility]
dependency_graph:
  requires: [02-01]
  provides: [warm-quiz-feedback, reduced-motion-quiz]
  affects: [QuizOption, WrongAnswerPanel, ArabicText]
tech_stack:
  added: []
  patterns: [useReducedMotion, source-audit-tests, warm-color-palette]
key_files:
  created:
    - src/__tests__/quiz-correct-feedback.test.ts
    - src/__tests__/quiz-wrong-feedback.test.ts
  modified:
    - src/design/components/QuizOption.tsx
    - src/design/components/ArabicText.tsx
    - src/components/quiz/WrongAnswerPanel.tsx
decisions:
  - Gold glow uses 0.15 peak opacity (two-step sequence) for correct, 0.20 sustained for revealedCorrect
  - Wrong answer uses opacity dim (1.0 -> 0.5 -> 0.7) instead of shake animation
  - Static borderWidths.thick for active states instead of animated border width
  - Added quizOption size tier to ArabicText in this worktree for type safety (Rule 3)
metrics:
  duration: 266s
  completed: 2026-04-04
  tasks: 2/2
  tests_added: 31
  files_modified: 3
  files_created: 2
---

# Phase 02 Plan 02: Quiz Feedback Warmth Summary

Rewrote QuizOption animation model and WrongAnswerPanel palette to replace punitive feedback (shake, red, floating +1, X icon) with warm emotional design (gold glow, gentle dim, cream/brown palette, encouraging guidance).

## Completed Tasks

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Rewrite QuizOption warm feedback | `df5ea44` | Removed +1/shake/hapticError, added gold glow/dim/reducedMotion, quizOption size |
| 2 | Redesign WrongAnswerPanel warm palette | `a72d0fc` | Replaced danger colors with accentLight/brown/textMuted, removed X icon |

## Changes Made

### QuizOption.tsx (complete rewrite of animation model)

**Removed:**
- Floating "+1" animation (plusOneOpacity, plusOneY, plusOneScale, plusOneContainer, plusOneText)
- Shake animation sequence (translateX -6/6/-4/4/0)
- hapticError import and usage
- withDelay import (no longer needed)

**Added:**
- Gold glow overlay using `colors.accent` (was `colors.primary`)
- Gentle opacity dim on wrong answer (wrongOpacity shared value: 1.0 -> 0.5 -> 0.7)
- `hapticTap()` for wrong answers (soft, not buzzer)
- Warm glow on revealedCorrect at 0.20 opacity (per D-08)
- `useReducedMotion` support for all animation branches
- `size="quizOption"` for ArabicText (52px/114px)
- Updated text style to Lora SemiBold 20px (heading2)

**Color mapping changes:**
- selectedCorrect border: `colors.primary` -> `colors.accent` (gold)
- selectedWrong bg: `colors.dangerLight` -> `colors.accentLight` (warm cream)
- selectedWrong border: `colors.danger` -> `colors.border` (neutral)
- selectedWrong text: `colors.danger` -> `colors.brown` (warm brown)
- Dimmed opacity: 0.45 -> 0.35

### WrongAnswerPanel.tsx (warm palette, no X icon)

- Panel bg: `colors.dangerLight` -> `colors.accentLight`
- Explanation text: `colors.dangerDark` -> `colors.brown`
- Chosen letter color: `colors.danger` -> `colors.textMuted`
- Chosen letter name: `colors.dangerDark` -> `colors.textMuted`
- "Hear your pick" label: `colors.danger` -> `colors.textMuted`
- Removed X icon (`\u2717`) and its style definition
- compareName uses `fontFamilies.bodySemiBold` instead of fontWeight "700"
- Encouragement copy preserved (WRONG_ENCOURAGEMENT + pickCopy)

### ArabicText.tsx (quizOption size tier)

- Added `quizOption` to ArabicSize union type
- Added SIZE_MAP entry: fontSize 52, lineHeight 114

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added quizOption size tier to ArabicText**
- **Found during:** Task 1
- **Issue:** Plan assumed Wave 1 (plan 02-01) changes would be available, but parallel worktrees don't share changes. TypeScript error: `"quizOption"` not assignable to `ArabicSize`.
- **Fix:** Added `quizOption` size tier directly to ArabicText.tsx (same change Wave 1 makes -- will merge cleanly).
- **Files modified:** src/design/components/ArabicText.tsx
- **Commit:** df5ea44

## Test Results

- **quiz-correct-feedback.test.ts**: 20 tests passing (source-audit for QuizOption)
- **quiz-wrong-feedback.test.ts**: 11 tests passing (source-audit for WrongAnswerPanel)
- **wrong-answer.test.ts**: 3 tests passing (existing, no regressions)
- **Full suite**: 69 files, 734 tests passing, 0 failures

## Known Stubs

None -- all data sources and UI elements are fully wired.

## Self-Check: PASSED

All 6 files verified on disk. All 4 commits verified in git log.
