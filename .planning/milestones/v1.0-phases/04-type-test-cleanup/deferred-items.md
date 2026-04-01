# Phase 04 Deferred Items

## Pre-existing Test Failures (Out of Scope)

### 1. outcome.test.js - Stale threshold values
- **File:** `src/__tests__/outcome.test.js`
- **Issue:** Tests expect old threshold values (recognition=0.6) but engine now uses 0.8. 7 tests failing.
- **Root cause:** Engine thresholds were changed but tests not updated.
- **Not in scope:** Not one of the 5 required coverage areas (DB init, migration, streak, quiz transitions, monetization).

### 2. progress-stats.test.ts - Stale typography reference
- **File:** `src/__tests__/progress-stats.test.ts`
- **Issue:** Test expects `typography.statNumber` but component uses `typography.statValue`. 1 test failing.
- **Root cause:** Component was refactored but string-matching test not updated.
- **Not in scope:** Typography test, not a required coverage area.
