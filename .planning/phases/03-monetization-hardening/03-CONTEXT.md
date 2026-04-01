# Phase 3: Monetization Hardening - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning (pending expert review + restore button product decision)

<domain>
## Phase Boundary

Harden subscription flows for offline use, add a standalone restore purchases surface, and instrument failure states with analytics. Build on existing RevenueCat integration — don't rewrite it.

</domain>

<decisions>
## Implementation Decisions

### Fix 1: Offline entitlement
- **D-01:** Do NOT build a custom caching layer — RevenueCat SDK already caches CustomerInfo on-device
- **D-02:** Verify the SDK returns cached data when offline (it should — this is the primary scenario)
- **D-03:** If SDK throws despite being configured (edge case), fall back to `stage: "unknown"` — acceptable
- **D-04:** Document what was verified vs what was changed in SUMMARY

### Fix 2: Restore purchases surface
- **D-05:** PENDING — where does restore button go? (Option A: Progress tab, Option B: new settings area, Option C: lesson locked screen)
- **D-06:** Call `Purchases.restorePurchases()` — this is the correct RevenueCat method
- **D-07:** Show loading indicator during restore (network call)
- **D-08:** Success: call `trackRestoreCompleted()` + refresh subscription state
- **D-09:** Failure: show Alert with clear message + call `trackRestoreFailed()` (new event)

### Fix 3: Failure analytics
- **D-10:** Add `restore_failed` event type to events.ts + `trackRestoreFailed` to analytics.ts
- **D-11:** In paywall ERROR case, also call `trackPurchaseFailed()` (currently only fires `paywall_result`)
- **D-12:** Every failure path must have both user-facing message AND analytics event

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

No specific preferences beyond what's in the spec. Expert review + product decision on restore button location pending.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-monetization-hardening*
*Context gathered: 2026-04-01*
