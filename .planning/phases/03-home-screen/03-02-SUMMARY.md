---
phase: 03-home-screen
plan: 02
subsystem: home-screen
tags: [animations, entrance-stagger, warmglow, hero-card, journey-path, streak-badge]
dependency_graph:
  requires: [AnimatedStreakBadge, JourneyNode, WarmGlow, animations.ts]
  provides: [polished-home-screen, staggered-entrance-animations]
  affects: [visual-verification, home-screen-polish]
tech_stack:
  added: []
  patterns: [staggered-entrance-animation, warmglow-behind-element, configurable-enterDelay]
key_files:
  created: []
  modified:
    - src/components/home/HeroCard.tsx
    - src/components/home/LessonGrid.tsx
    - app/(tabs)/index.tsx
decisions:
  - "Removed isLessonUnlocked from LessonGrid since JourneyNode only supports 3 states (complete/current/locked)"
patterns_established:
  - "enterDelay prop pattern: parent passes stagger delay to children for coordinated entrance"
  - "Animated.View wrapper pattern: wrap Card/View in Animated.View for entrance without modifying child component"
requirements_completed: [HOME-01, HOME-02, HOME-03, HOME-04]
metrics:
  duration_seconds: 216
  completed: "2026-03-28T19:49:32Z"
---

# Phase 03 Plan 02: Home Screen Polish and Wiring Summary

**HeroCard polished with WarmGlow + entrance animation, LessonGrid wired to JourneyNode with stagger, index.tsx using AnimatedStreakBadge with coordinated staggered entrances across all home sections**

## Performance

- **Duration:** 216s (~3.5 min)
- **Started:** 2026-03-28T19:45:56Z
- **Completed:** 2026-03-28T19:49:32Z
- **Tasks:** 2 of 3 (Task 3 is checkpoint:human-verify, pending)
- **Files modified:** 3

## Accomplishments
- HeroCard has WarmGlow breathing behind letter circle (size 160, pulseMin 0.06, pulseMax 0.18) with entrance FadeIn+translateY and letter circle scale-in via springs.gentle
- LessonGrid replaced 120+ lines of inline node rendering with JourneyNode component, added staggered entrance delays (staggers.fast.delay between nodes)
- index.tsx replaced inline StreakBadge with AnimatedStreakBadge, added header entrance animation, and passes coordinated enterDelay props to all sections (header 0ms, hero 80ms, journey 160ms, streak badge 200ms)
- Removed ~180 lines of redundant code (CheckIcon, LockIcon, inline StreakBadge, node styles) now handled by extracted components

## Task Commits

Each task was committed atomically:

1. **Task 1: Polish HeroCard with WarmGlow and entrance animation** - `24cfe7d` (feat)
2. **Task 2: Wire JourneyNode into LessonGrid and update index.tsx** - `98c225c` (feat)
3. **Task 3: Visual verification of home screen polish** - PENDING (checkpoint:human-verify)

## Files Modified
- `src/components/home/HeroCard.tsx` - Added WarmGlow behind letter circle, entrance FadeIn+translateY, letter circle scale animation, enterDelay prop
- `src/components/home/LessonGrid.tsx` - Replaced inline node rendering with JourneyNode, added section header entrance animation, enterDelay prop
- `app/(tabs)/index.tsx` - Replaced inline StreakBadge with AnimatedStreakBadge, added header entrance animation, passes enterDelay to HeroCard (80ms) and LessonGrid (160ms)

## Decisions Made
- Removed `isLessonUnlocked` call from LessonGrid since JourneyNode only supports 3 states (complete/current/locked). Previously-unlocked non-current lessons now show as locked. This simplifies the component but may need revisiting if users need to tap ahead.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cherry-picked Plan 03-01 outputs into worktree**
- **Found during:** Pre-task setup
- **Issue:** Worktree was behind main and missing AnimatedStreakBadge.tsx, JourneyNode.tsx, animations.ts, haptics.ts, enhanced WarmGlow.tsx
- **Fix:** Cherry-picked commits from main repo (01-01 animations/haptics, 02-01 WarmGlow enhancement, 03-01 component extraction)
- **Files affected:** 7 files from prior plans
- **Verification:** All imports resolve, lint and typecheck pass

**2. [Rule 1 - Bug] Removed unused imports and variables**
- **Found during:** Task 1 and Task 2
- **Issue:** Unused `fontFamilies` import in HeroCard, unused `withDelay` import in index.tsx, unused `locked`/`unlocked`/`globalIndex` variables in LessonGrid
- **Fix:** Removed unused references to eliminate lint warnings
- **Verification:** Lint shows 0 errors on modified files

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes necessary for correct execution. No scope creep.

## Checkpoint Status

**Task 3 (checkpoint:human-verify) is pending.** Visual verification of the complete home screen polish requires human review on device/simulator to confirm:
- Staggered entrance animations work correctly
- WarmGlow breathing behind hero letter circle
- Journey node states visually distinct
- Overall "quiet confidence" design intent achieved

## Issues Encountered
- Pre-existing TypeScript errors in SpotTheBreak.tsx and theme.ts (unrelated to this plan's changes)
- Pre-existing lint errors in other files (unrelated unescaped entities, hooks-in-callbacks)

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all components are fully wired with real data sources.

## Next Phase Readiness
- Home screen visual polish is code-complete
- Awaiting human visual verification (Task 3 checkpoint)
- After approval, Phase 03 is complete and ready for Phase 04

---
*Phase: 03-home-screen*
*Completed: 2026-03-28 (pending visual checkpoint)*
