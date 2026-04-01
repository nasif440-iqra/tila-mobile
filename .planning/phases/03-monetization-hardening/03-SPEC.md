# Phase 3: Monetization Hardening — Technical Spec

**Purpose:** Make subscription flows work correctly offline, add a standalone restore purchases surface, and instrument failure states with analytics. Three requirements (MON-01, MON-02, MON-03).

**Context:** RevenueCat integration already exists and is mostly functional. The provider already handles offline gracefully for its own init (`refresh()` catch keeps current state). The paywall already tracks purchase/restore/cancel/error events. This phase fills three specific gaps.

---

## Fix 1: Offline entitlement — verification + loading-state UX (MON-01)

**File:** `src/monetization/provider.tsx`, `src/monetization/hooks.ts`

**What happens now:** When the app launches offline, `Purchases.getCustomerInfo()` is called on mount. If it rejects, the `.catch()` sets `loading: false` and `customerInfo` stays `null`. With null info, `deriveStage()` returns `"unknown"` and `isPremiumActive` is `false`. So a rejected init can lock premium lessons for paying subscribers.

**Current behavior chain (if getCustomerInfo rejects):**
```
Offline launch → getCustomerInfo() rejects → customerInfo = null → stage = "unknown" → isPremiumActive = false → premium lessons locked
```

**However — this scenario may be overstated.** RevenueCat's SDK caches `CustomerInfo` between app launches. Their docs say `getCustomerInfo()` returns cached data when offline on a configured SDK — it does NOT reject in ordinary offline situations. It only rejects when the SDK was never configured (missing API key) or on truly exceptional errors. So the most common offline case (subscriber opens app on a plane) should already work via SDK cache.

**The more likely real UX issue:** `useCanAccessLesson()` returns `false` for premium lessons while `loading` is `true` (before `getCustomerInfo()` resolves). This means a subscriber sees a brief flash where premium lessons appear locked during the loading state, then unlock once the cached info resolves. This is a more probable user-facing issue than a true offline rejection.

**Proposed fix — verify first, patch only if proven:**

1. **Verification task (primary):** Test airplane-mode behavior in an actual Expo build on a physical device. Launch the app offline after a previous successful online session. Document whether `getCustomerInfo()` resolves with cached data or rejects.

2. **If cache works correctly (expected):** No code change needed for the rejection path. The existing `.catch()` is sufficient as a safety net for truly exceptional failures (corrupted cache, first-ever launch offline).

3. **Loading-state UX fix (do regardless):** In `useCanAccessLesson()`, while `loading` is `true`, return `true` for premium lessons instead of `false`. This prevents the false-lock flash where paid content appears locked during init. A brief "assume premium during loading" is better UX than a brief "lock everything during loading."

4. **Do NOT build a custom caching layer.** RevenueCat already caches. Don't duplicate what the SDK does.

5. **Document results:** SUMMARY must state what was verified (airplane-mode test result) vs what was changed (loading-state UX fix).

**What "fixed" looks like:**
- User in airplane mode with a previously-synced subscription can access premium lessons (verified via device test)
- No brief false-lock flash during subscription loading state
- No custom caching layer added
- SUMMARY documents verification results

---

## Fix 2: Standalone restore purchases surface (MON-02)

**File:** `app/(tabs)/progress.tsx` (add restore button to existing Progress tab)

**What happens now:** Restore purchases is available inside the RevenueCat paywall sheet (via `PAYWALL_RESULT.RESTORED`). But there is no standalone "Restore Purchases" button that a user can find without hitting the paywall first. There is no settings screen, no profile screen, no account screen — just Home and Progress tabs.

**Current app structure:**
```
Tab navigator:
  - Home (index.tsx) — lesson grid
  - Progress (progress.tsx) — mastery stats
```

**Why it matters:** Apple's guidelines and RevenueCat's own docs recommend that all apps with auto-renewable subscriptions include a mechanism to restore purchases. Having it only inside the paywall is borderline — a standalone button is a conservative hardening choice that eliminates ambiguity during review.

**Note on policy framing:** This is a good conservative hardening choice, not a directly proven Apple rejection rule. But the risk/effort ratio favors doing it — it's a small change with clear upside.

**Decision: Option A — Progress tab.**
The Progress screen already exists and shows user stats. Add a "Restore Purchases" button at the bottom, below the mastery content. This is the smallest change, needs no new screens, and is clearly outside the paywall flow. Option B (settings area) is overkill for this phase. Option C (lesson locked screen) keeps restore paywall-adjacent and doesn't fully solve discoverability.

**Implementation:**
- Add a "Restore Purchases" button at the bottom of `app/(tabs)/progress.tsx`
- Call `Purchases.restorePurchases()` — this is the correct RevenueCat SDK method
- On success: call `trackRestoreCompleted()` (analytics function already exists), call `refresh()` from `useSubscription()` to update state
- On failure: show Alert with clear error message, call `trackRestoreFailed()` (new event — see Fix 3)
- Show loading indicator during restore (it's a network call — disable button + ActivityIndicator)
- Only show the button when subscription state is not actively premium (no need to restore if already subscribed)

**What "fixed" looks like:**
- User can find and tap "Restore Purchases" on the Progress tab without needing the paywall
- Restore calls the correct RevenueCat method
- Success refreshes subscription state and tracks analytics
- Failure shows clear error message and tracks analytics

---

## Fix 3: Failure analytics completeness and error messages (MON-03)

**File:** `src/monetization/paywall.ts`, `src/monetization/analytics.ts`, `src/analytics/events.ts`

**What already works (don't break these):**
- `PAYWALL_RESULT.PURCHASED` → tracks `purchase_completed` with product details ✓
- `PAYWALL_RESULT.RESTORED` → tracks `restore_completed` with entitlement count ✓
- `PAYWALL_RESULT.CANCELLED` → tracks `paywall_result` with `result: "cancelled"` ✓
- Outer catch (SDK/network exception) → shows `Alert.alert(...)` + tracks `paywall_result: error` ✓

**The gaps — narrower than the original spec implied:**

1. **`PAYWALL_RESULT.ERROR` does not call `trackPurchaseFailed`.** The `trackPurchaseFailed` function exists in `analytics.ts` but is never called. The ERROR case only tracks `paywall_result` with `result: "error"` and returns silently — no Alert, no `purchase_failed` event.

2. **No `restore_failed` event type.** `events.ts` has `RestoreCompletedProps` and `trackRestoreCompleted`, but no `restore_failed` equivalent. The standalone restore handler (Fix 2) needs a failure analytics path.

3. **`PAYWALL_RESULT.NOT_PRESENTED` is a blind spot.** Currently returns `{ result: "not_presented", accessGranted: false }` with no analytics event and no user-facing message. This can happen due to RevenueCat dashboard configuration issues or SDK problems. It should be instrumented so it shows up in PostHog.

4. **The direct `PAYWALL_RESULT.ERROR` case has no user-facing message.** The outer catch block shows an Alert, but the in-switch ERROR case does not. So a paywall-returned error is silent to the user, while a thrown exception shows a message. Both should show something.

**Proposed fix:**
- Use existing `trackRestoreCompleted({ success: false, entitlements_restored: 0 })` for failed restores — no new `restore_failed` event type needed, the event already has a `success` boolean field
- In `PAYWALL_RESULT.ERROR` case: add `trackPurchaseFailed()` call AND an `Alert.alert()` for user visibility
- In `PAYWALL_RESULT.NOT_PRESENTED` case: add a `trackPaywallResult({ trigger, result: "not_presented" })` call so dashboard/config issues are visible in analytics
- In standalone restore handler (Fix 2): on failure, call `trackRestoreFailed()` + show Alert
- **Principle:** Every failure-ish outcome must have both (a) an analytics event and (b) a user-facing message if the user initiated the action

**What "fixed" looks like:**
- `PAYWALL_RESULT.ERROR` fires both `paywall_result: error` and `purchase_failed`, shows Alert
- `PAYWALL_RESULT.NOT_PRESENTED` fires `paywall_result: not_presented` (visible in dashboard)
- Standalone restore failure fires `restore_completed({ success: false })`, shows Alert
- PostHog dashboard can track all failure and non-presentation rates
- No silent failure paths remain for user-initiated purchase/restore actions

---

## Regression Tests

| Fix | Test description |
|-----|-----------------|
| Fix 1 | Source analysis: `useCanAccessLesson` returns `true` during loading for premium lessons. No custom caching layer added. Document airplane-mode verification result in SUMMARY. |
| Fix 2 | Verify restore button exists in Progress tab. Verify it calls `Purchases.restorePurchases()`. Verify success calls `trackRestoreCompleted` + `refresh`. Verify failure calls `trackRestoreFailed` + shows Alert. |
| Fix 3 | Verify failed restore calls `trackRestoreCompleted({ success: false, ... })`. Verify `trackPurchaseFailed` is called in `PAYWALL_RESULT.ERROR` case. Verify `PAYWALL_RESULT.NOT_PRESENTED` fires analytics event. Verify ERROR case shows Alert. Source analysis for complete failure coverage — no silent user-initiated failure paths. |

---

## Summary

| # | Fix | Severity | Files | Risk if unfixed |
|---|-----|----------|-------|-----------------|
| 1 | Offline verification + loading-state UX | MEDIUM | src/monetization/hooks.ts | Brief false-lock flash during loading |
| 2 | Restore purchases on Progress tab | HIGH | app/(tabs)/progress.tsx | App Store review risk |
| 3 | Failure analytics completeness | MEDIUM | src/monetization/paywall.ts, analytics, events | Silent failures + invisible NOT_PRESENTED |

**Dependencies:** Fix 3 depends partly on Fix 2 (standalone restore failure path). Fix 1 is independent.

**Product decision resolved:** Restore button goes on Progress tab (Option A). Simplest change, clearly outside paywall, no new screens.

---

*Spec created: 2026-04-01*
*Revised: 2026-04-01 after expert review — MON-01 reframed as verification + loading UX (not cache implementation), MON-02 locked to Progress tab, MON-03 expanded to cover NOT_PRESENTED blind spot and clarified what already works vs what's missing*
