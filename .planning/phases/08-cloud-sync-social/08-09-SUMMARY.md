---
phase: 08-cloud-sync-social
plan: 09
subsystem: testing
tags: [vitest, sync, auth, mocking, gap-closure]

# Dependency graph
requires:
  - phase: 08-cloud-sync-social
    provides: sync service (08-02), auth modules (08-03), test helpers (08-07)
provides:
  - Real-import unit tests for sync service and auth flow
  - Regression coverage on src/sync/service.ts and src/auth/email.ts
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [vi.mock with async factory for singleton mocking, as-any casting for mock-to-interface gaps]

key-files:
  created: []
  modified:
    - src/__tests__/sync-service.test.ts
    - src/__tests__/auth-flow.test.ts

key-decisions:
  - "Used vi.mock async factory for supabase singleton to avoid hoisting issues"
  - "Cast mock objects with 'as any' rather than expanding mock type surface"

patterns-established:
  - "vi.mock async factory: use `async () => { const { helper } = await import(...); return { ... }; }` when mock depends on helper modules"
  - "Mock SYNC_TABLE_CONFIGS to control which tables syncAll iterates in tests"

requirements-completed: [RET-09]

# Metrics
duration: 3min
completed: 2026-04-02
---

# Phase 08 Plan 09: Gap Closure - Test Imports Summary

**Rewrote sync-service and auth-flow tests to import real production source instead of inlined mirrors, closing Gap 2 from VERIFICATION.md**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-02T20:58:42Z
- **Completed:** 2026-04-02T21:01:47Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- sync-service.test.ts now imports syncAll and syncTable from the real src/sync/service.ts (8 tests pass)
- auth-flow.test.ts now imports signInWithEmail, signUpWithEmail, signOut from src/auth/email.ts (5 tests pass)
- Removed all inlined mirror logic (parseTimestamp, syncTable, syncAll, syncInProgress, processAuthEvent, INITIAL_STATE)
- Full test suite passes: 699 tests, 0 failures, 0 regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite sync-service.test.ts to import real syncTable** - `eece956` (test)
2. **Task 2: Rewrite auth-flow.test.ts to test real auth modules** - `4f1f6ff` (test)

## Files Created/Modified
- `src/__tests__/sync-service.test.ts` - Imports real syncAll/syncTable, mocks SYNC_TABLE_CONFIGS via vi.mock
- `src/__tests__/auth-flow.test.ts` - Imports real signInWithEmail/signUpWithEmail/signOut, mocks supabase singleton

## Decisions Made
- Used vi.mock with async factory for supabase singleton mock to avoid Vitest hoisting issues with top-level variables
- Cast mock db/supabase objects with `as any` when passing to real functions, since mocks only implement the subset of methods used by production code
- Mocked SYNC_TABLE_CONFIGS module to control which tables syncAll iterates, avoiding need to set up mock data for all 8 production tables

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed vi.mock hoisting issue for supabase singleton**
- **Found during:** Task 2 (auth-flow.test.ts rewrite)
- **Issue:** vi.mock factory cannot reference top-level `const mockSupabase` because vi.mock is hoisted above variable declarations
- **Fix:** Changed to async factory pattern: `vi.mock('...', async () => { const { createMockSupabase } = await import(...); return { supabase: createMockSupabase() }; })`
- **Files modified:** src/__tests__/auth-flow.test.ts
- **Verification:** All 5 auth-flow tests pass
- **Committed in:** 4f1f6ff (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Standard Vitest hoisting workaround. No scope creep.

## Issues Encountered
None beyond the vi.mock hoisting issue (documented above as deviation).

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - tests exercise real production code with no placeholder data.

## Next Phase Readiness
- Gap 2 from VERIFICATION.md is now closed
- Both test files will catch regressions in src/sync/service.ts and src/auth/email.ts
- Full test suite healthy: 699 passing tests

---
*Phase: 08-cloud-sync-social*
*Completed: 2026-04-02*
