# Phase 3: Monetization Hardening - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Harden subscription flows for offline use, add a standalone restore purchases surface, and instrument failure states with analytics. Build on existing RevenueCat integration — don't rewrite it.

</domain>

<decisions>
## Implementation Decisions

### Fix 1: Offline verification + loading-state UX
- **D-01:** Do NOT build a custom caching layer — RevenueCat SDK already caches CustomerInfo on-device
- **D-02:** Primary task is VERIFICATION: test airplane-mode in actual Expo build, document result
- **D-03:** Code change: in `useCanAccessLesson()`, return `true` during loading for premium lessons (prevents false-lock flash)
- **D-04:** If SDK throws despite being configured (edge case), fall back to `stage: "unknown"` — acceptable
- **D-05:** SUMMARY must document what was verified vs what was changed

### Fix 2: Restore purchases surface — Progress tab (Option A, locked)
- **D-06:** Add "Restore Purchases" button to `app/(tabs)/progress.tsx` — bottom of screen, below mastery content
- **D-07:** Call `Purchases.restorePurchases()` — this is the correct RevenueCat method
- **D-08:** Show loading indicator during restore (disable button + ActivityIndicator)
- **D-09:** Success: call `trackRestoreCompleted()` + `refresh()` from useSubscription
- **D-10:** Failure: show Alert with clear message + call `trackRestoreCompleted({ success: false, entitlements_restored: 0 })` (reuse existing event, no new type needed)
- **D-11:** Only show button when subscription state is not actively premium

### Fix 3: Failure analytics completeness
- **D-12:** Failed restores use existing `trackRestoreCompleted({ success: false, entitlements_restored: 0 })` — no new event type
- **D-13:** In `PAYWALL_RESULT.ERROR`: add `trackPurchaseFailed()` call AND Alert.alert() (currently silent to user)
- **D-14:** In `PAYWALL_RESULT.NOT_PRESENTED`: add `trackPaywallResult({ trigger, result: "not_presented" })` — note: `PaywallResultProps.result` type must expand to include `"not_presented"` (currently only allows `"purchased" | "restored" | "cancelled" | "error"`)
- **D-15:** Every user-initiated failure path must have both user-facing message AND analytics event
- **D-16:** Purchase/restore SUCCESS analytics already work — do not break them

### Claude's Discretion
- Exact Alert.alert message wording for restore failures
- Loading indicator implementation (ActivityIndicator vs button disabled state)
- Test file organization

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Spec
- `.planning/phases/03-monetization-hardening/03-SPEC.md` — Technical spec with code locations and fix approaches

### Source files
- `src/monetization/provider.tsx` — SubscriptionProvider with getCustomerInfo, refresh, stage derivation
- `src/monetization/paywall.ts` — presentPaywall with purchase/restore/error handling
- `src/monetization/hooks.ts` — useSubscription, useCanAccessLesson, FREE_LESSON_CUTOFF
- `src/monetization/analytics.ts` — trackPaywallShown/Result, trackPurchaseCompleted/Failed, trackRestoreCompleted
- `src/analytics/events.ts` — Event type definitions (PaywallResultProps, RestoreCompletedProps, etc.)

### Prior phase context
- `.planning/phases/02-crash-containment/02-CONTEXT.md` — Promise audit already cleaned up grant-loading effects

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `trackRestoreCompleted()` — already exists for restore success path
- `trackPurchaseFailed()` — exists but never called from paywall ERROR case
- `Alert.alert()` — already used in paywall catch block for error messaging
- `SubscriptionContext` — provides `refresh()` method for post-restore state update
- Design system colors, Button component — for restore UI

### Established Patterns
- Paywall: switch on PAYWALL_RESULT enum → track analytics → return outcome object
- Provider: mounted guard + .catch() on async calls
- Analytics: typed event functions wrapping `track()` calls

### Integration Points
- No settings/profile screen exists — needs to be created or restore added to existing screen
- Progress tab (`app/(tabs)/progress.tsx`) — potential host for restore button
- Lesson locked gate (`app/lesson/[id].tsx` lines 250-280) — potential host for restore link

</code_context>

<specifics>
## Specific Ideas

No specific preferences beyond what's in the spec. Restore button location decided: Progress tab (Option A).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-monetization-hardening*
*Context gathered: 2026-04-01*
