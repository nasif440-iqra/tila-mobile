---
phase: 01-correctness-blockers
plan: 03
subsystem: hooks/habit
tags: [bug-fix, race-condition, regression-test, streak-system]
dependency_graph:
  requires: []
  provides: [race-condition-proof-habit-tracking]
  affects: [src/hooks/useHabit.ts]
tech_stack:
  added: []
  patterns: [withExclusiveTransactionAsync, atomic-read-modify-write]
key_files:
  created:
    - src/__tests__/habit-race.test.ts
  modified:
    - src/hooks/useHabit.ts
decisions:
  - Used withExclusiveTransactionAsync instead of saveHabit for atomic DB operations
  - Removed saveHabit import — no longer needed after inlining the UPDATE in the transaction
metrics:
  duration: 2m
  completed: "2026-04-01T04:42:37Z"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 2
---

# Phase 01 Plan 03: Fix Habit Race Condition (Bug 3) Summary

Atomic exclusive transaction replaces stale-closure read-modify-write in recordPractice, preventing lost streak/lesson-count updates on rapid taps.

## What Was Done

### Task 1: Rewrite recordPractice to use withExclusiveTransactionAsync
- Replaced the stale-closure pattern where `recordPractice` read from React state (`habit`) which could be outdated when called rapidly
- New implementation reads fresh from DB inside `db.withExclusiveTransactionAsync()` via `txn.getFirstAsync`
- Writes via `txn.runAsync` for proper transaction isolation
- Changed `useCallback` dependency array from `[db, habit]` to `[db]` — no longer reads from closure
- Removed `saveHabit` import (no longer used)
- **Commit:** `2baec26`

### Task 2: Add regression test for Bug 3
- Created `src/__tests__/habit-race.test.ts` with 4 tests
- Source analysis tests verify: exclusive transaction usage, no habit closure dependency, txn parameter usage
- Computation logic test: proves two sequential same-day calls produce `todayLessonCount = 2` (not 1, which was the bug)
- All 4 tests pass
- **Commit:** `be0c258`

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- `npm run typecheck`: No errors in useHabit.ts (pre-existing errors in other files unrelated to this plan)
- `npx vitest run src/__tests__/habit-race.test.ts`: 4/4 tests pass
- `npm test`: habit-race.test.ts passes; 2 pre-existing test failures in unrelated files

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | `2baec26` | fix(01-03): rewrite recordPractice to use withExclusiveTransactionAsync |
| 2 | `be0c258` | test(01-03): add regression test for Bug 3 (habit race condition) |

## Self-Check: PASSED

- [x] `src/hooks/useHabit.ts` exists and contains `withExclusiveTransactionAsync`
- [x] `src/__tests__/habit-race.test.ts` exists and contains `Bug 3`
- [x] Commit `2baec26` exists
- [x] Commit `be0c258` exists
