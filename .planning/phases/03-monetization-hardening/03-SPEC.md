# Phase 3: Monetization Hardening — Technical Spec

**Purpose:** Make subscription flows work correctly offline, add a standalone restore purchases surface, and instrument failure states with analytics. Three requirements (MON-01, MON-02, MON-03).

**Context:** RevenueCat integration already exists and is mostly functional. The provider already handles offline gracefully for its own init (`refresh()` catch keeps current state). The paywall already tracks purchase/restore/cancel/error events. This phase fills three specific gaps.

---

## Fix 1: Offline entitlement behavior (MON-01)

**File:** `src/monetization/provider.tsx`, `src/monetization/hooks.ts`

**What happens now:** When the app launches offline, `Purchases.getCustomerInfo()` rejects, the `.catch()` sets `loading: false`, and `customerInfo` stays `null`. With null info, `deriveStage()` returns `"unknown"`, and `isPremiumActive` is `false`. So a paying subscriber who opens the app offline cannot access premium lessons — they're treated as free-tier.

**Current behavior chain:**
```
Offline launch → getCustomerInfo() rejects → customerInfo = null → stage = "unknown" → isPremiumActive = false → premium lessons locked
```

**Why it matters:** A subscriber who paid $8.99/mo opens the app on a plane and can't access their lessons. That's a 1-star review and a refund request.

**What RevenueCat actually does:** The SDK caches the last known `CustomerInfo` on-device. When offline, `getCustomerInfo()` returns the cached data — it does NOT reject. It only rejects when the SDK was never configured (missing API key) or on truly exceptional errors. So the most likely offline scenario is already handled by the SDK cache.

**The real gap:** The code handles the rejection path (`catch → loading: false`) but does NOT set `customerInfo` from cache. If `getCustomerInfo()` does reject on a configured SDK, the user loses access. The fix should be minimal:

**Proposed fix:**
- In the `.catch()` handler, attempt to read from SDK cache before falling back to null
- RevenueCat's `Purchases.getCustomerInfo()` already returns cached data when offline on a configured SDK — verify this works correctly in Expo by testing with airplane mode
- If the SDK throws despite being configured (corrupted cache, first-ever launch with no network), fall back to `stage: "unknown"` with `loading: false` — this is the current behavior and is acceptable for edge cases
- **Do NOT build a custom caching layer** — RevenueCat already caches. Don't duplicate what the SDK does.
- Add a brief note in the SUMMARY about what was verified vs what was changed

**What "fixed" looks like:**
- User in airplane mode with a previously-synced subscription can still access premium lessons
- App shows cached subscription state, not "unknown"
- No custom caching layer added — relies on RevenueCat's built-in cache

---

## Fix 2: Standalone restore purchases surface (MON-02)

**File:** New — needs a UI surface accessible outside the paywall

**What happens now:** Restore purchases is available inside the RevenueCat paywall sheet (via `PAYWALL_RESULT.RESTORED`). But there is no standalone "Restore Purchases" button that a user can find without hitting the paywall first. Apple requires this — if a user re-installs the app or switches devices, they need a way to restore without re-subscribing.

**Current app structure:**
```
Tab navigator:
  - Home (index.tsx) — lesson grid
  - Progress (progress.tsx) — mastery stats
```
There is no settings screen, no profile screen, no account screen.

**Why it matters:** Apple App Store Review Guideline 3.1.2 requires apps with auto-renewable subscriptions to include a mechanism to restore purchases. Having it only inside the paywall is borderline — Apple reviewers sometimes accept it, sometimes reject it. A standalone button eliminates this risk entirely.

**Proposed fix — options (product decision for founder):**

- **Option A: Add to Progress tab.** The Progress screen already shows user stats. Add a "Restore Purchases" button at the bottom, below the mastery content. Simple, no new screens needed.

- **Option B: Add a minimal settings/account section.** Create a small settings area (accessible from home or progress screen via a gear icon) with: Restore Purchases, Manage Subscription (opens managementURL), Privacy Policy link (needed for Phase 5). More work, but creates a home for future settings.

- **Option C: Add to the paywall trigger screen (lesson locked screen).** When a locked lesson shows the subscribe CTA, also show a "Already subscribed? Restore" link. Discoverable, but still paywall-adjacent.

**Implementation:**
- Call `Purchases.restorePurchases()` — this is the RevenueCat SDK method
- On success: call `trackRestoreCompleted()` (analytics already exists), refresh subscription state
- On failure: show user-facing error message (Alert), call `trackPurchaseFailed()` or a new `trackRestoreFailed()` event
- Show loading indicator during restore (it's a network call)

**What "fixed" looks like:**
- User can find and tap "Restore Purchases" without needing to hit the paywall first
- Restore calls the correct RevenueCat method
- Success refreshes subscription state and tracks analytics
- Failure shows clear error message and tracks analytics

---

## Fix 3: Purchase/restore failure analytics and error messages (MON-03)

**File:** `src/monetization/paywall.ts`, `src/monetization/analytics.ts`, `src/analytics/events.ts`

**What happens now:** The paywall function `presentPaywall()` already handles the error case:
- `PAYWALL_RESULT.ERROR` → tracks `paywall_result` with `result: "error"` + returns `{ result: "error", accessGranted: false }`
- Outer catch → shows `Alert.alert("Couldn't verify your subscription", ...)` + tracks `paywall_result` error

But there are gaps:
1. **No `restore_failed` event.** `trackRestoreCompleted` exists but there's no `trackRestoreFailed` for when restore fails.
2. **No `purchase_failed` tracking from the paywall result.** `trackPurchaseFailed` function exists in analytics.ts but is never called — the ERROR case only tracks `paywall_result`, not `purchase_failed`.
3. **The standalone restore (Fix 2) needs its own failure path** — the paywall's error handling doesn't cover standalone restore.

**Proposed fix:**
- Add a `restore_failed` event type to `src/analytics/events.ts`
- Add `trackRestoreFailed` to `src/monetization/analytics.ts`
- In the standalone restore handler (Fix 2): on failure, call `trackRestoreFailed()` + show Alert
- In `presentPaywall()` ERROR case: also call `trackPurchaseFailed()` so both event types fire (paywall_result for the funnel, purchase_failed for the specific error)
- Ensure every failure path has both: (a) a user-facing message and (b) an analytics event

**What "fixed" looks like:**
- Failed purchase fires both `paywall_result: error` and `purchase_failed` events
- Failed restore fires `restore_failed` event (new) with error details
- Every failure shows user a clear message (not silent)
- PostHog dashboard can track purchase and restore failure rates

---

## Regression Tests

| Fix | Test description |
|-----|-----------------|
| Fix 1 | Verify offline behavior: when `getCustomerInfo` is configured, cached data is honored. Source analysis: no custom caching layer added. |
| Fix 2 | Verify restore button exists outside paywall. Verify it calls `Purchases.restorePurchases()`. Verify success/failure paths track analytics. |
| Fix 3 | Verify `restore_failed` event type exists. Verify `trackPurchaseFailed` is called in paywall ERROR case. Source analysis for complete failure coverage. |

---

## Summary

| # | Fix | Severity | Files | Risk if unfixed |
|---|-----|----------|-------|-----------------|
| 1 | Offline entitlement | HIGH | src/monetization/provider.tsx | Paying users locked out offline |
| 2 | Restore purchases surface | HIGH | New UI + src/monetization/ | App Store rejection risk |
| 3 | Failure analytics + messages | MEDIUM | src/monetization/paywall.ts, analytics | Invisible failure rates |

**Dependencies:** Fix 2 depends on deciding WHERE the restore button goes (product decision). Fix 3 depends partly on Fix 2 (standalone restore failure path). Fix 1 is independent.

**Open product decision:** Where does "Restore Purchases" live? Options A (Progress tab), B (new settings area), or C (lesson locked screen). This needs founder input before planning.

---

*Spec created: 2026-04-01*
*For expert review before implementation*
