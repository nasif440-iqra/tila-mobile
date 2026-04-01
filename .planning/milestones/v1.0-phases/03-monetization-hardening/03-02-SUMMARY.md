---
phase: 03-monetization-hardening
plan: 02
subsystem: monetization
tags: [revenucat, restore-purchases, react-native, analytics]

requires:
  - phase: none
    provides: none
provides:
  - Standalone Restore Purchases button on Progress tab (MON-02)
  - Unit tests for restore handler success/failure paths
affects: [03-monetization-hardening]

tech-stack:
  added: []
  patterns:
    - "Restore purchases handler pattern: try/catch with analytics + Alert for both success and failure"
    - "Conditional button visibility based on subscription stage"

key-files:
  created:
    - src/__tests__/restore-purchases.test.ts
  modified:
    - app/(tabs)/progress.tsx

key-decisions:
  - "Restore button placed on Progress tab per D-06 — no new screens needed"
  - "Button hidden for trial/paid users (stage !== trial && stage !== paid) per D-11"
  - "trackRestoreCompleted used for both success and failure paths per existing analytics API"

patterns-established:
  - "Restore handler pattern: call SDK method, count active entitlements, track analytics, refresh subscription state, show contextual Alert"

requirements-completed: [MON-02]

duration: 2min
completed: 2026-04-01
---

# Phase 3 Plan 2: Standalone Restore Purchases Surface Summary

**Added Restore Purchases button to Progress tab with full handler logic, analytics tracking, and conditional visibility for non-premium users (MON-02).**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-01T15:17:19Z
- **Completed:** 2026-04-01T15:19:38Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

### Task 1: Restore purchases handler tests (TDD)
Created `src/__tests__/restore-purchases.test.ts` with 7 tests covering:
- `Purchases.restorePurchases()` is called
- Success with active entitlements: tracks analytics with correct count, calls refresh, shows "Purchases Restored" Alert
- Success with zero entitlements: shows "No Purchases Found" Alert
- Failure: tracks analytics with `success: false`, shows "Restore Failed" Alert

### Task 2: Restore Purchases button on Progress tab
Modified `app/(tabs)/progress.tsx`:
- Added imports: `Purchases` from `react-native-purchases`, `useSubscription` from monetization hooks, `trackRestoreCompleted` from monetization analytics
- Added `handleRestorePurchases` callback with full try/catch/finally pattern
- Button conditionally visible when `stage !== "trial" && stage !== "paid"` (shown for free, expired, unknown)
- Shows `ActivityIndicator` during restore operation (button disabled)
- On success: counts active entitlements, tracks analytics, refreshes subscription state, shows appropriate Alert
- On failure: tracks analytics with `success: false`, shows "Restore Failed" Alert
- Styled with `restoreButton` following existing `resetButton` pattern

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 1aa5b45 | test(03-02): add restore purchases handler tests |
| 2 | e048b4a | feat(03-02): add restore purchases button to Progress tab (MON-02) |

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None -- all functionality is fully wired to the RevenueCat SDK and analytics.

## Verification

- [x] 7 tests pass in `src/__tests__/restore-purchases.test.ts`
- [x] No typecheck errors in `progress.tsx`
- [x] `restorePurchases` call present in progress.tsx
- [x] `stage !== "trial"` conditional visibility present
- [x] `trackRestoreCompleted` called for both success and failure paths
- [x] `Alert.alert` called for all outcomes (restored, empty, failed)
- [x] `ActivityIndicator` loading state present

## Self-Check: PASSED

All files exist, all commits verified.
