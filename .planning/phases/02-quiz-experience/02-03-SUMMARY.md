---
phase: 02-quiz-experience
plan: 03
subsystem: design-tokens, quiz-ui
tags: [gap-closure, tokens, animations, typography, worklet-fix]
dependency_graph:
  requires: []
  provides: [breathing-token, drift-token, arabicQuizHero-token, letterHero-160px, wrongOpacity-worklet]
  affects: [WarmGlow, FloatingLettersLayer, ArabicText, QuizQuestion, QuizOption]
tech_stack:
  added: []
  patterns: [useAnimatedStyle-worklet-for-shared-values]
key_files:
  created: []
  modified:
    - src/design/animations.ts
    - src/design/tokens.ts
    - src/design/components/ArabicText.tsx
    - src/components/quiz/QuizQuestion.tsx
    - src/design/components/QuizOption.tsx
decisions:
  - Merged wrongOpacity into existing animatedStyle worklet rather than creating separate containerOpacityStyle
metrics:
  duration: 114s
  completed: "2026-04-05T15:29:57Z"
  tasks_completed: 2
  tasks_total: 2
  test_results: "775 passed, 0 failed (full suite)"
---

# Phase 02 Plan 03: Gap Closure -- Token Restoration and Worklet Fix Summary

Restored 4 missing/reverted design tokens (breathing, drift, arabicQuizHero, corrected lineHeights), fixed LetterHero circle dimensions and WarmGlow canonical import, moved wrongOpacity.value into useAnimatedStyle worklet for UI-thread animation.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Restore missing design tokens | f9507e3 | animations.ts, tokens.ts, ArabicText.tsx |
| 2 | Restore LetterHero and fix wrongOpacity worklet | b1bad42 | QuizQuestion.tsx, QuizOption.tsx |

## What Changed

### Task 1: Token Restoration
- **animations.ts**: Added `breathing` token (inhale/hold/exhale/cycle timing + opacity/scale ranges) and `drift` token (duration/delay ranges) consumed by WarmGlow.tsx and FloatingLettersLayer.tsx respectively
- **tokens.ts**: Added `arabicQuizHero` (fontSize 52, lineHeight 114). Fixed lineHeights -- arabicDisplay 100->158, arabicLarge 54->72, arabicBody 36->48. These are global corrections for diacritic clearance, lost during worktree collision
- **ArabicText.tsx**: Added `quizHero` to ArabicSize union. Changed SIZE_MAP `quizOption` from inline object to `typography.arabicQuizHero` reference. Added `overflow: "visible"` globally for tall diacritics

### Task 2: QuizQuestion and QuizOption Fixes
- **QuizQuestion.tsx**: Changed WarmGlow import from `../onboarding/WarmGlow` to canonical `../../design/atmosphere/WarmGlow`. Enlarged WarmGlow `size={240}` (was 180). LetterHero circle 160x160 borderRadius 80 (was 120x120/60)
- **QuizOption.tsx**: Moved `wrongOpacity.value` into `useAnimatedStyle` worklet (was read directly in JS-thread style prop). Inline style simplified to `opacity: isDimmed ? 0.35 : 1`. The `animatedStyle` (containing wrongOpacity) is ordered AFTER inline style in the style array so the animated value overrides during wrong-answer animation

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

**Quiz-specific tests (gap closure):**
- quiz-letterhero.test.ts: 10/10 passed
- arabic-typography.test.ts: 7/7 passed
- quiz-correct-feedback.test.ts: 20/20 passed
- quiz-wrong-feedback.test.ts: 11/11 passed

**Shared-token consumer tests (blast radius):**
- floating-letters-fix.test.ts: passed (drift token consumer)
- reduce-motion.test.ts: passed (breathing token consumer)

**Full test suite:** 775 passed, 0 failed (74 files, 6 skipped)

## Visual Verification Notes

The following should be confirmed during the Phase 2 human-verify checkpoint:
- `overflow: visible` on ArabicText does not cause text bleeding in quiz option cards or other constrained layouts
- Increased lineHeight values on arabicDisplay/arabicLarge/arabicBody render correctly on non-quiz screens (home lesson cards, progress views)
- The 160px LetterHero circle leaves adequate space for quiz options on smaller screens

## Self-Check: PASSED
