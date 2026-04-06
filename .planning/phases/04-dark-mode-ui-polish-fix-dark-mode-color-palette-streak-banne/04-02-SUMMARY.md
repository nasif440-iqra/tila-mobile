---
phase: 04-dark-mode-ui-polish
plan: 02
subsystem: quiz-celebrations
tags: [streak, celebrations, theme, dark-mode, ux]
dependency_graph:
  requires: []
  provides:
    - "Organic varied celebration dispatch (pickCelebrationFormat)"
    - "Theme-aware StreakMilestoneOverlay (colors.bg backdrop)"
    - "Varied messaging pools for overlay and banner"
  affects:
    - src/components/LessonQuiz.tsx
    - src/components/quiz/StreakMilestoneOverlay.tsx
    - src/components/quiz/StreakBanner.tsx
tech_stack:
  added: []
  patterns:
    - "Random selection from message pools for celebration variety"
    - "Tier-based format dispatch (banner vs popup)"
key_files:
  created: []
  modified:
    - src/components/LessonQuiz.tsx
    - src/components/quiz/StreakMilestoneOverlay.tsx
    - src/components/quiz/StreakBanner.tsx
decisions:
  - "pickCelebrationFormat uses probability-based dispatch: small streaks 80% banner, medium 60% popup, big always popup"
  - "Surprise celebrations at 18% for non-milestone streaks >= 2"
  - "SURPRISE_POOL defined inside component to access streak prop for template literals"
  - "Banner auto-dismisses after 3 seconds via useEffect timer"
metrics:
  duration: 153s
  completed: 2026-04-06
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
---

# Phase 04 Plan 02: Streak Celebration Variety Summary

Organic varied celebration dispatch with tier-based format selection, surprise triggers, theme-aware overlay, and messaging pools.

## What Changed

### Task 1: Celebration dispatch logic (c314471)

Replaced the mechanical `STREAK_MILESTONES = [3, 5, 7]` constant with a `pickCelebrationFormat()` function that selects between banner and popup based on streak tier:

- **Small (3-4):** 80% banner, 20% popup
- **Medium (5-6):** 60% popup, 40% banner
- **Big (7+):** Always popup (on multiples of 7)
- **Non-milestone (>=2):** 18% chance of surprise banner

Added `streakBanner` state with 3-second auto-dismiss timer. StreakBanner now renders in the overlay section of LessonQuiz.

### Task 2: Theme-aware overlay and varied messaging (8d0592e)

**StreakMilestoneOverlay:** Replaced hardcoded `#F8F6F0` backdrop with `colors.bg` from `useColors()` for proper dark mode support. Replaced static `MILESTONES` record with `MILESTONE_POOLS` containing 3 message variations per tier (3/5/7). Added `SURPRISE_POOL` for non-standard streak numbers shown via surprise celebrations.

**StreakBanner:** Added `BANNER_MESSAGES_SMALL` and `BANNER_MESSAGES_MEDIUM` pools with 3 variations each. Arabic phrase in tier 3 now randomly picks between "mashallah" and "barakallah". Fixed tier 2 check to cover 5-6 range (was only `=== 5`).

## Decisions Made

1. **Probability thresholds:** 80/20 for small, 60/40 for medium, 100% popup for big -- provides good variety while ensuring big milestones always feel impactful.
2. **18% surprise rate:** Within the 15-20% range specified in D-06, avoids being too frequent or too rare.
3. **Big streak modulo 7:** Only triggers popup on multiples of 7 (7, 14, 21...) so high streaks don't popup every answer.

## Deviations from Plan

None -- plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | c314471 | Celebration dispatch with format variety and surprise triggers |
| 2 | 8d0592e | Theme-aware overlay and varied celebration messaging |

## Self-Check: PASSED
