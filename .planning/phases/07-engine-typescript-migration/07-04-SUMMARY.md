---
phase: "07"
plan: "04"
subsystem: engine
tags: [typescript, migration, type-safety]
dependency_graph:
  requires: [07-01, 07-02, 07-03]
  provides: [fully-typed-engine]
  affects: [src/engine, src/hooks, src/__tests__]
tech_stack:
  added: []
  patterns: [strict-type-annotations, readonly-arrays, interface-exports]
key_files:
  created:
    - src/engine/mastery.ts
    - src/engine/selectors.ts
    - src/engine/engagement.ts
    - src/engine/unlock.ts
  modified:
    - src/engine/progress.ts
    - src/engine/insights.ts
    - src/hooks/useProgress.ts
    - src/engine/questions/review.js
    - src/__tests__/mastery.test.js
    - src/__tests__/selectors.test.js
    - src/__tests__/summaryAndReview.test.js
    - src/__tests__/mastery-pipeline.test.ts
  deleted:
    - src/engine/mastery.js
    - src/engine/selectors.js
    - src/engine/engagement.js
    - src/engine/unlock.js
decisions:
  - Imported EntityState/SkillState/ConfusionState from progress.ts rather than duplicating
  - Used type-only imports to avoid circular dependency issues between mastery.ts and progress.ts
  - Used readonly arrays for engagement microcopy constants to prevent accidental mutation
  - Created local interfaces (MasteryQuizResult, ErrorResult, etc.) for internal function parameters not covered by existing shared types
metrics:
  duration: 512s
  completed: "2026-04-02T02:50:36Z"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 16
---

# Phase 07 Plan 04: Core Engine TypeScript Migration (Final 4 Files) Summary

Migrated mastery.js, selectors.js, engagement.js, and unlock.js to TypeScript with full type annotations on all exported functions and no business logic changes.

## What Was Done

### Task 1: Migrate mastery.js and selectors.js to TypeScript (ccf32e4)

**mastery.ts** -- the most complex engine file with the mastery state machine, entity/skill tracking, confusion recording, SRS scheduling, and batch merge logic. Added types:
- `ParsedEntityKey`, `MasteryState`, `MasteryData`, `ErrorCategory` (exported)
- `EntityStateWithLatency`, `AttemptResult`, `MasteryQuizResult`, `ConfusionResult`, `ErrorResult` (internal)
- All 16 exported functions fully annotated

**selectors.ts** -- lesson selection, review planning, mastery state queries. Added types:
- `PhaseCounts`, `MasteryStateCounts`, `TopConfusion`, `ErrorCategorySummary` (exported)
- `ReviewSessionPlan`, `ReviewItems`, `ReviewLessonPayload` (exported)
- All 18 exported functions fully annotated

Updated 8 consumer files to use extensionless imports. Fixed mastery-pipeline.test.ts to provide full EntityState shape.

### Task 2: Migrate engagement.js and unlock.js to TypeScript (b6aabca)

**engagement.ts** -- microcopy constants and performance band system. Added types:
- `CompletionTier`, `PerformanceBand`, `SummaryMessaging` (exported)
- Used `readonly string[]` for all microcopy constant arrays
- Used `Record<string, readonly string[]>` for mode-keyed copy maps
- All 6 exported functions fully annotated

**unlock.ts** -- lesson/phase unlock logic. Added types:
- All 6 exported functions fully annotated with `EntityState` from progress.ts
- Optional parameters properly typed for backward compatibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed mastery-pipeline.test.ts incomplete EntityState**
- **Found during:** Task 1
- **Issue:** Test passed partial object `{ attempts: 2, correct: 2, sessionStreak: 0, intervalDays: 1 }` to `deriveMasteryState` which now requires full `EntityState` with `lastSeen` and `nextReview`
- **Fix:** Added `lastSeen: null, nextReview: null` to test object
- **Files modified:** src/__tests__/mastery-pipeline.test.ts
- **Commit:** ccf32e4

## Verification

- `npm run typecheck`: No new errors (15 total, all pre-existing in unrelated files)
- `npm test`: 60 test files pass, 664 tests pass
- All 4 target .js files deleted, replaced with .ts
- No `any` in exported function signatures of migrated files

## Known Stubs

None -- all functions fully typed with real types.

## Note on Remaining .js Files

Three .js files remain in src/engine/ (dateUtils.js, features.js, outcome.js). These are scoped to plans 07-01, 07-02, and 07-03 running in parallel worktrees. This plan (07-04) successfully migrated its 4 assigned files.
