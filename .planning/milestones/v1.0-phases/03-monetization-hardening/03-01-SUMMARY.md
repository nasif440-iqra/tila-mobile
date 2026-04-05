---
phase: 03-monetization-hardening
plan: 01
subsystem: payments
tags: [revenuecat, subscription, analytics, posthog, offline]

requires:
  - phase: 02-crash-containment
    provides: "Error boundaries and promise safety for monetization screens"
provides:
  - "Loading-state UX fix preventing false-lock flash on premium lessons"
  - "Standalone restore purchases surface on Progress tab"
  - "Complete failure analytics for all paywall/restore outcomes"
  - "restore_failed event type for PostHog dashboard"
affects: [launch-ops, type-test-cleanup]

tech-stack:
  added: []
  patterns:
    - "Assume-premium-during-loading pattern for subscription hooks"
    - "Every user-initiated failure has both analytics event and Alert"

key-files:
  created: []
  modified:
    - src/monetization/hooks.ts
    - src/monetization/paywall.ts
    - src/monetization/analytics.ts
    - src/analytics/events.ts
    - app/(tabs)/progress.tsx

key-decisions:
  - "Return true during loading in useCanAccessLesson -- brief assume-premium is better UX than brief false-lock"
  - "No custom caching layer built -- RevenueCat SDK already caches CustomerInfo on-device"
  - "Restore button on Progress tab below mastery grid, hidden when actively premium"

patterns-established:
  - "Assume-premium-during-loading: when subscription state is loading, default to granting access rather than denying"
  - "Failure instrumentation: every user-initiated action failure gets both trackXFailed() analytics AND Alert.alert() user message"

requirements-completed: [MON-01, MON-02, MON-03]

duration: 5min
completed: 2026-04-01
---

# Phase 3 Plan 01: Monetization Hardening Summary

**Loading-state false-lock fix, standalone restore purchases button on Progress tab, and complete failure analytics for all paywall/restore outcomes**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-01T15:17:20Z
- **Completed:** 2026-04-01T15:22:20Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Fixed useCanAccessLesson to return true during loading, preventing brief false-lock flash where premium lessons appear locked during SDK init
- Added standalone "Restore Purchases" button to Progress tab -- accessible without hitting paywall, with loading state, success/failure alerts, and analytics
- Completed failure analytics: PAYWALL_RESULT.ERROR now fires trackPurchaseFailed + shows Alert, NOT_PRESENTED fires analytics event, restore_failed event type added

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix loading-state false-lock** - `981d108` (fix)
2. **Task 2: Complete failure analytics** - `594d193` (feat)
3. **Task 3: Standalone restore button** - `9ddcd36` (feat)

## Files Created/Modified
- `src/monetization/hooks.ts` - Changed useCanAccessLesson to return true during loading for premium lessons
- `src/monetization/paywall.ts` - Added trackPurchaseFailed + Alert to ERROR case, analytics to NOT_PRESENTED case
- `src/monetization/analytics.ts` - Added trackRestoreFailed function + RestoreFailedProps import
- `src/analytics/events.ts` - Added RestoreFailedProps interface, restore_failed to EventMap, not_presented to PaywallResultProps
- `app/(tabs)/progress.tsx` - Added restore purchases button with loading state, success/failure handling, analytics

## Decisions Made
- **Loading-state behavior:** Return true (assume premium) during loading rather than false (deny access). RevenueCat SDK caches CustomerInfo so loading resolves quickly from cache. A brief assume-premium-during-loading is better UX than a brief false-lock flash.
- **No custom caching layer:** RevenueCat already caches. The spec's original concern about offline rejection was overstated -- SDK returns cached data when offline on a configured SDK.
- **Restore button placement:** Bottom of Progress tab, below mastery grid, above reset button. Hidden when subscription is actively premium.
- **ERROR case Alert wording:** "Purchase couldn't be completed" with retry guidance -- matches the outer catch block's pattern.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Notes

### MON-01: Offline entitlement verification
- **Code change:** useCanAccessLesson returns `true` during loading (not `false`)
- **Airplane-mode behavior:** RevenueCat SDK caches CustomerInfo between app launches. Their docs confirm getCustomerInfo() returns cached data when offline on a configured SDK. The existing `.catch()` in provider.tsx is a safety net for truly exceptional failures only.
- **No custom caching layer added** -- RevenueCat handles this.

### MON-02: Restore purchases surface
- Standalone "Restore Purchases" button on Progress tab
- Calls Purchases.restorePurchases() directly
- Success: trackRestoreCompleted + refreshSubscription + Alert confirmation
- Failure: trackRestoreFailed + Alert error message
- Only shown when not actively premium

### MON-03: Failure analytics completeness
- PAYWALL_RESULT.ERROR: now fires trackPurchaseFailed AND Alert.alert (was silent to user)
- PAYWALL_RESULT.NOT_PRESENTED: now fires trackPaywallResult with result "not_presented" (was blind spot)
- restore_failed event type added to events.ts + trackRestoreFailed to analytics.ts
- All existing success paths preserved (purchase_completed, restore_completed, paywall_result)

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 monetization hardening complete
- Ready for Phase 4 (Type & Test Cleanup) and Phase 5 (Launch Ops) which run in parallel
- All three MON requirements satisfied

---
*Phase: 03-monetization-hardening*
*Completed: 2026-04-01*
