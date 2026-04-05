---
type: quick
tasks_completed: 3
tasks_total: 3
key_files:
  modified:
    - src/sync/provider.tsx
    - src/sync/types.ts
    - src/sync/tables.ts
    - src/sync/service.ts
    - src/components/home/LessonGrid.tsx
    - app/(tabs)/index.tsx
    - app/(tabs)/progress.tsx
    - app/lesson/[id].tsx
    - src/state/hooks.ts
    - src/__tests__/sync-service.test.ts
    - src/__tests__/helpers/mock-supabase.ts
decisions:
  - "Issue 6 (useAppState adoption) intentionally skipped: useAppState is read-only aggregate; screens needing mutations correctly use useProgress/useHabit directly"
  - "account_prompt_declined_at added to user_profile sync columns alongside the cooldown check"
metrics:
  completed: "2026-04-02T21:43:22Z"
  tasks: 3
  files: 11
---

# Quick Task 260402-oe3: Fix 7 Phase 8 Issues from Code Review

Fixed SyncProvider infinite re-render loop and sync PK/local_id column mismatch (both blockers), plus 4 UI/UX quality fixes and 4 new sync test cases.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 3a9926d | fix: SyncProvider infinite loop and sync PK/local_id mismatch |
| 2 | 4a59d85 | fix: premium flash, restore analytics, account prompt cooldown |
| 3 | c9def8a | test: sync test coverage for local_id mapping and single-row upsert |

## Task Details

### Task 1: Fix sync blockers

**Issue 1 -- SyncProvider infinite loop (BLOCKER):**
- Added `lastSyncedAtRef` to hold last sync timestamp outside React state
- Replaced `syncState.lastSyncedAt` in catch block with `lastSyncedAtRef.current`
- Removed `syncState.lastSyncedAt` from `triggerSync` dependency array
- This prevents the setState -> useCallback recreation -> useEffect re-fire -> sync loop

**Issue 2 -- Sync PK/local_id mismatch (BLOCKER):**
- Added `remoteKeyColumn` and `onConflictColumns` optional fields to `TableSyncConfig`
- lesson_attempts/question_attempts: local `id` maps to remote `local_id`, conflict on `user_id,local_id`
- user_profile/habit: single-row-per-user with `user_id`-only conflict, local PK excluded from push
- Updated service.ts push logic: three strategies (standard PK, remoteKeyColumn, single-row)
- Updated service.ts pull logic: matches by remoteKeyColumn or sentinel for single-row tables

### Task 2: Fix UI/UX issues

**Issue 3 -- Premium false-lock flash:**
- Added `subscriptionLoading` prop to `LessonGridProps`
- Premium lock check now requires `!subscriptionLoading` in addition to `!isPremiumActive`
- HomeScreen passes `loading` from `useSubscription()` to LessonGrid

**Issue 4 -- Restore analytics wrong function:**
- Replaced `trackRestoreCompleted({ success: false, entitlements_restored: 0 })` with `trackRestoreFailed({})`
- Added `trackRestoreFailed` to the import from monetization/analytics

**Issue 5 -- AccountPrompt ignores declined_at:**
- Added async DB check for `account_prompt_declined_at` before showing prompt
- Skips prompt if declined within last 7 days
- Added `account_prompt_declined_at` to user_profile sync columns

**Issue 6 -- Partial useAppState adoption (SKIPPED):**
- Documented as intentional: `useAppState` is a read-only aggregate
- Screens needing mutation methods correctly use `useProgress()` and `useHabit()` directly
- Added JSDoc comment to `useAppState` explaining the design decision

### Task 3: Add sync test coverage

- 4 new test cases covering lesson_attempts and user_profile sync configs
- Enhanced `createMockSupabase` to track `_lastUpsertCall` (table, rows, options)
- Tests verify exact onConflict column values and record shape (local_id mapping, id exclusion)

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- `npm run typecheck`: No new errors (pre-existing errors only)
- `npm test -- --run`: 703 tests passed, 0 failures
- All 4 new sync tests pass

## Known Stubs

None.

## Self-Check: PASSED

All 11 modified files exist. All 3 commit hashes verified.
