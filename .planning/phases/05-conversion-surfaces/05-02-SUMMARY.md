---
phase: 05-conversion-surfaces
plan: 02
subsystem: ui
tags: [monetization, paywall, upgrade-card, trial-badge, lock-icon, reanimated]

# Dependency graph
requires:
  - phase: 05-01
    provides: UpgradeCard, LockIcon, TrialCountdownBadge components
provides:
  - Lesson 7 celebration-then-offer flow with 1.5s delayed UpgradeCard
  - Premium-styled locked lesson gate with UpgradeCard and scholarship link
  - LockIcon SVG replacing lock emoji in JourneyNode
  - Trial countdown badge in home screen header for trial users only
affects: [app-store-submission, monetization-analytics]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Celebration-then-offer: show achievement copy first, delay monetization surface by 1.5s"
    - "Conditional trial badge: only render for stage=trial with non-null daysRemaining"

key-files:
  created: []
  modified:
    - src/components/LessonSummary.tsx
    - app/lesson/[id].tsx
    - src/components/home/JourneyNode.tsx
    - app/(tabs)/index.tsx

key-decisions:
  - "Used FadeInDown.springify() for UpgradeCard entrance animation for natural feel"
  - "Consolidated react-native imports in lesson screen to avoid duplicate import statements"

patterns-established:
  - "Celebration-then-offer: always celebrate the learning achievement before showing monetization"
  - "Subscription-conditional rendering: free/expired users see nothing subscription-related on home screen"

requirements-completed: [CONV-06, CONV-07]

# Metrics
duration: 5min
completed: 2026-04-02
---

# Phase 05 Plan 02: Conversion Surface Wiring Summary

**Wired UpgradeCard, LockIcon, and TrialCountdownBadge into four screens: lesson 7 celebration-then-offer, locked lesson gate, JourneyNode, and home header**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-02T01:33:08Z
- **Completed:** 2026-04-02T01:38:05Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Lesson 7 summary shows celebration copy first, then UpgradeCard slides in after 1.5s delay with FadeInDown animation
- Locked lesson gate redesigned with LockIcon (48px), UpgradeCard (locked-gate variant), and scholarship link
- Lock emoji fully replaced with SVG LockIcon in JourneyNode with "Unlock with Tila Premium" text
- Trial countdown badge added to home header, only visible for trial users (free/expired see nothing)

## Task Commits

Each task was committed atomically:

1. **Task 1: Redesign LessonSummary trial CTA** - `2bb45ba` (feat)
2. **Task 2: Redesign locked lesson gate and JourneyNode lock icon** - `80dc26a` (feat)
3. **Task 3: Add TrialCountdownBadge to home screen header** - `d0ef4f8` (feat)

## Files Created/Modified
- `src/components/LessonSummary.tsx` - Replaced old trial CTA block with celebration copy + UpgradeCard, removed 6 unused styles
- `app/lesson/[id].tsx` - Replaced plain locked gate with LockIcon + UpgradeCard + scholarship link, added ScrollView layout
- `src/components/home/JourneyNode.tsx` - Replaced lock emoji with LockIcon SVG, updated text to "Unlock with Tila Premium"
- `app/(tabs)/index.tsx` - Added TrialCountdownBadge import and conditional rendering in header

## Decisions Made
- Used FadeInDown.springify() for the UpgradeCard entrance animation to give it a natural spring feel
- Consolidated duplicate react-native imports in lesson screen (View/Text/StyleSheet + Linking/ScrollView merged)
- Removed unused trackScholarshipTapped import from LessonSummary (UpgradeCard handles tracking internally)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed unescaped apostrophe in JSX text**
- **Found during:** Task 1
- **Issue:** "That's a real milestone" contained unescaped apostrophe causing react/no-unescaped-entities lint error
- **Fix:** Used unicode escape `{"\u2019"}` for smart apostrophe and `{"\u2014"}` for em dash
- **Files modified:** src/components/LessonSummary.tsx
- **Committed in:** 2bb45ba (Task 1 commit)

**2. [Rule 1 - Bug] Fixed duplicate react-native import**
- **Found during:** Task 2
- **Issue:** Adding `Linking, ScrollView` import created duplicate react-native import (line 2 had View/Text/StyleSheet)
- **Fix:** Consolidated into single import statement
- **Files modified:** app/lesson/[id].tsx
- **Committed in:** 80dc26a (Task 2 commit)

**3. [Rule 2 - Missing Critical] Removed unused import**
- **Found during:** Task 1
- **Issue:** trackScholarshipTapped was no longer used in LessonSummary after replacing old CTA with UpgradeCard (which handles it internally)
- **Fix:** Removed unused import to prevent lint warning
- **Files modified:** src/components/LessonSummary.tsx
- **Committed in:** 2bb45ba (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (2 bug fixes, 1 missing critical)
**Impact on plan:** All auto-fixes were necessary for lint compliance. No scope creep.

## Issues Encountered
None

## Known Stubs
None - all components are wired to real subscription state and callbacks.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All conversion surfaces are wired and functional
- Phase 05 (conversion-surfaces) is complete
- Ready for app store submission phase or next milestone work

## Self-Check: PASSED

All 4 modified files verified present. All 3 task commits verified in git log.

---
*Phase: 05-conversion-surfaces*
*Completed: 2026-04-02*
