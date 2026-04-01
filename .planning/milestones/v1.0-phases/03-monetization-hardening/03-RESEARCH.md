# Phase 3: Monetization Hardening - Research

**Researched:** 2026-04-01
**Domain:** RevenueCat subscription management, offline entitlement caching, analytics instrumentation
**Confidence:** HIGH

## Summary

This phase hardens three specific gaps in the existing RevenueCat integration: (1) loading-state UX that briefly false-locks premium lessons, (2) a missing standalone restore-purchases surface, and (3) incomplete failure analytics instrumentation. The existing monetization code is well-structured -- provider, hooks, paywall, and analytics are cleanly separated. Changes are surgical.

The codebase already has `trackPurchaseFailed`, `trackRestoreCompleted`, and `trackPaywallResult` functions wired to PostHog. The gaps are that some of these are never called from the right code paths. The `PaywallResultProps.result` type needs a single union member added (`"not_presented"`). The Progress tab already has a "Reset All Progress" button at the bottom, so the restore button fits naturally above it.

**Primary recommendation:** Make three focused changes -- fix `useCanAccessLesson()` loading return, add restore button to Progress tab, and wire missing analytics calls to existing functions. No new event types, no custom caching, no new screens.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Do NOT build a custom caching layer -- RevenueCat SDK already caches CustomerInfo on-device
- D-02: Primary task is VERIFICATION: test airplane-mode in actual Expo build, document result
- D-03: Code change: in `useCanAccessLesson()`, return `true` during loading for premium lessons (prevents false-lock flash)
- D-04: If SDK throws despite being configured (edge case), fall back to `stage: "unknown"` -- acceptable
- D-05: SUMMARY must document what was verified vs what was changed
- D-06: Add "Restore Purchases" button to `app/(tabs)/progress.tsx` -- bottom of screen, below mastery content
- D-07: Call `Purchases.restorePurchases()` -- this is the correct RevenueCat method
- D-08: Show loading indicator during restore (disable button + ActivityIndicator)
- D-09: Success: call `trackRestoreCompleted()` + `refresh()` from useSubscription
- D-10: Failure: show Alert with clear message + call `trackRestoreCompleted({ success: false, entitlements_restored: 0 })` (reuse existing event, no new type needed)
- D-11: Only show button when subscription state is not actively premium
- D-12: Failed restores use existing `trackRestoreCompleted({ success: false, entitlements_restored: 0 })` -- no new event type
- D-13: In `PAYWALL_RESULT.ERROR`: add `trackPurchaseFailed()` call AND Alert.alert() (currently silent to user)
- D-14: In `PAYWALL_RESULT.NOT_PRESENTED`: add `trackPaywallResult({ trigger, result: "not_presented" })` -- note: `PaywallResultProps.result` type must expand to include `"not_presented"`
- D-15: Every user-initiated failure path must have both user-facing message AND analytics event
- D-16: Purchase/restore SUCCESS analytics already work -- do not break them

### Claude's Discretion
- Exact Alert.alert message wording for restore failures
- Loading indicator implementation (ActivityIndicator vs button disabled state)
- Test file organization

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MON-01 | Offline entitlement behavior defined -- app handles subscription state when network is unavailable | RevenueCat SDK caches CustomerInfo locally; primary code fix is `useCanAccessLesson()` returning `true` during loading for premium lessons (line 14 of hooks.ts). Verification task requires Expo build + airplane mode test. |
| MON-02 | Restore purchases surface clearly reachable outside the paywall flow | Progress tab (`app/(tabs)/progress.tsx`) is the host. `Purchases.restorePurchases()` is the correct SDK method (confirmed in react-native-purchases@9.15.0). Button goes above existing "Reset All Progress" button. |
| MON-03 | Restore/purchase failure states instrumented with analytics events | `trackPurchaseFailed()` exists but is never called from `PAYWALL_RESULT.ERROR`. `PaywallResultProps.result` needs `"not_presented"` added to its union type. `trackRestoreCompleted({ success: false })` covers failed restores. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-purchases | 9.15.0 | RevenueCat SDK -- subscription management, entitlement checking, restore | Already installed and configured in project |
| react-native-purchases-ui | 9.15.0 | RevenueCat paywall UI | Already installed, provides PAYWALL_RESULT enum |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native (Alert) | 0.83.2 | User-facing error messages | Restore failures, purchase errors |
| react-native (ActivityIndicator) | 0.83.2 | Loading state during restore | While `restorePurchases()` is in flight |

No new packages needed. Everything required is already installed.

## Architecture Patterns

### Existing Monetization File Structure (do not change)
```
src/monetization/
  revenuecat.ts       # SDK init (Purchases.configure)
  provider.tsx         # SubscriptionProvider + context
  hooks.ts             # useSubscription, useCanAccessLesson, usePremiumReviewRights
  paywall.ts           # presentPaywall with PAYWALL_RESULT switch
  analytics.ts         # Typed track wrappers (trackPaywallShown, etc.)
src/analytics/
  events.ts            # Event type interfaces (PaywallResultProps, etc.)
  index.ts             # track() function that calls PostHog
```

### Pattern 1: Loading-State Guard in Hook
**What:** `useCanAccessLesson()` currently returns `false` during loading for premium lessons. Change to return `true` during loading.
**When to use:** When subscription state is still resolving and we want to avoid false-lock flash.
**Current code (hooks.ts line 11-16):**
```typescript
export function useCanAccessLesson(lessonId: number): boolean {
  const { isPremiumActive, loading } = useSubscription();
  if (lessonId <= FREE_LESSON_CUTOFF) return true;
  if (loading) return false;  // <-- THIS is the bug: returns false during loading
  return isPremiumActive;
}
```
**Fix:**
```typescript
export function useCanAccessLesson(lessonId: number): boolean {
  const { isPremiumActive, loading } = useSubscription();
  if (lessonId <= FREE_LESSON_CUTOFF) return true;
  if (loading) return true;  // Assume access during loading to prevent false-lock flash
  return isPremiumActive;
}
```

### Pattern 2: Restore Button in Existing Screen
**What:** Add restore button to Progress tab, conditionally visible based on subscription state.
**Where:** `app/(tabs)/progress.tsx` -- above the existing "Reset All Progress" Pressable (line 280).
**Pattern follows existing code:** The Progress screen already imports from `react-native` (`Alert`, `ActivityIndicator`, `Pressable`) and uses `useCallback` for handlers. The restore button follows the same pattern as `handleResetProgress`.
**Key integration points:**
- Import `useSubscription` from `../../src/monetization/hooks`
- Import `Purchases` from `react-native-purchases`
- Import `trackRestoreCompleted` from `../../src/monetization/analytics`
- Use `stage` from useSubscription to conditionally render (hide when `stage === "trial" || stage === "paid"`)
- Use local `useState` for `restoring` loading state

### Pattern 3: Analytics Event Wiring
**What:** Wire existing tracking functions to currently-silent code paths.
**Changes needed in `paywall.ts`:**
```typescript
// In PAYWALL_RESULT.ERROR case (currently only tracks paywall_result):
case PAYWALL_RESULT.ERROR:
default:
  trackPaywallResult({ trigger, result: "error" });
  trackPurchaseFailed({ product_id: "unknown", error_code: "paywall_error" });
  Alert.alert("Purchase couldn't be completed", "Please try again later.", [{ text: "OK" }]);
  return { result: "error", accessGranted: false };

// In PAYWALL_RESULT.NOT_PRESENTED case (currently no analytics):
case PAYWALL_RESULT.NOT_PRESENTED:
  trackPaywallResult({ trigger, result: "not_presented" });
  return { result: "not_presented", accessGranted: false };
```

### Pattern 4: Type Union Expansion
**What:** Add `"not_presented"` to `PaywallResultProps.result` type.
**File:** `src/analytics/events.ts` line 74
**Current:**
```typescript
result: "purchased" | "restored" | "cancelled" | "error";
```
**Fix:**
```typescript
result: "purchased" | "restored" | "cancelled" | "error" | "not_presented";
```

### Anti-Patterns to Avoid
- **Custom caching layer:** RevenueCat SDK already caches CustomerInfo. Do not add AsyncStorage or SecureStore caching on top.
- **New event types for restore failures:** `trackRestoreCompleted({ success: false })` already covers this -- the `success` boolean field exists in `RestoreCompletedProps`.
- **Creating a Settings screen:** Out of scope. Restore button goes on existing Progress tab.
- **Breaking existing success paths:** D-16 is explicit: purchase/restore SUCCESS analytics already work and must not be broken.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Offline entitlement cache | AsyncStorage/SecureStore cache layer | RevenueCat SDK built-in cache | SDK already caches CustomerInfo between launches; custom cache adds complexity and sync bugs |
| Restore purchases flow | Custom receipt validation | `Purchases.restorePurchases()` | SDK handles App Store/Play Store receipt validation server-side |
| Failed restore event type | New `restore_failed` event | `trackRestoreCompleted({ success: false, entitlements_restored: 0 })` | Existing event already has `success` boolean -- reuse it |

## Common Pitfalls

### Pitfall 1: trackPurchaseFailed requires product_id
**What goes wrong:** `PurchaseFailedProps` requires `product_id: string` but in the `PAYWALL_RESULT.ERROR` case, we may not have the product ID (user never completed selection).
**Why it happens:** The error can fire before a specific product was chosen.
**How to avoid:** Pass `product_id: "unknown"` when the actual product is not available. The `error_code` and `error_message` fields are optional and more informative.
**Warning signs:** TypeScript will catch if product_id is missing.

### Pitfall 2: restorePurchases() returns CustomerInfo, not void
**What goes wrong:** Forgetting to use the return value of `Purchases.restorePurchases()`.
**Why it happens:** Might assume it's a fire-and-forget call.
**How to avoid:** `restorePurchases()` returns `Promise<CustomerInfo>`. Use the returned info to count active entitlements for the `trackRestoreCompleted` call, then call `refresh()` to update the provider state.
**Warning signs:** Analytics show `entitlements_restored: 0` even on successful restores.

### Pitfall 3: Calling refresh() redundantly after restorePurchases
**What goes wrong:** Both `restorePurchases()` return value AND `refresh()` call `getCustomerInfo()`, potentially causing a double network call.
**Why it happens:** `refresh()` in the provider calls `Purchases.getCustomerInfo()` internally.
**How to avoid:** Still call `refresh()` after restore -- it updates the React state via `updateFromInfo()`. The restore response gives us entitlement count for analytics. The SDK deduplicates internally. Both calls serve different purposes (analytics data vs React state update).

### Pitfall 4: Button visibility condition using isPremiumActive
**What goes wrong:** Using `isPremiumActive` instead of `stage` to hide the restore button hides it during loading (when isPremiumActive is false but stage is "unknown").
**Why it happens:** `isPremiumActive` is derived from stage but is false for "unknown" and "expired".
**How to avoid:** Show restore button when `stage !== "trial" && stage !== "paid"`. This shows it for "free", "expired", and "unknown" users -- all of whom might need to restore.

### Pitfall 5: Alert.alert import already exists in paywall.ts
**What goes wrong:** Adding a duplicate import of Alert.
**Why it happens:** Not checking existing imports.
**How to avoid:** `Alert` is already imported on line 3 of `paywall.ts`. Only need to add `trackPurchaseFailed` to the import from `./analytics` on line 4.

## Code Examples

### Restore Handler Pattern (for Progress tab)
```typescript
// Follows existing pattern in progress.tsx (handleResetProgress uses same shape)
const [restoring, setRestoring] = useState(false);
const { stage, refresh } = useSubscription();

const handleRestorePurchases = useCallback(async () => {
  setRestoring(true);
  try {
    const info = await Purchases.restorePurchases();
    const activeCount = Object.keys(info.entitlements.active).length;
    trackRestoreCompleted({ success: true, entitlements_restored: activeCount });
    await refresh();
    Alert.alert(
      activeCount > 0 ? "Purchases Restored" : "No Purchases Found",
      activeCount > 0
        ? "Your subscription has been restored."
        : "We couldn't find any previous purchases for this account.",
      [{ text: "OK" }]
    );
  } catch {
    trackRestoreCompleted({ success: false, entitlements_restored: 0 });
    Alert.alert(
      "Restore Failed",
      "Please check your internet connection and try again.",
      [{ text: "OK" }]
    );
  } finally {
    setRestoring(false);
  }
}, [refresh]);
```

### Restore Button JSX (placement in Progress tab)
```tsx
{/* Place above the existing resetButton, around line 279 */}
{stage !== "trial" && stage !== "paid" && (
  <Pressable
    onPress={handleRestorePurchases}
    disabled={restoring}
    style={[styles.restoreButton, { borderColor: colors.border }]}
  >
    {restoring ? (
      <ActivityIndicator size="small" color={colors.primary} />
    ) : (
      <Text style={[typography.bodySmall, { color: colors.primary }]}>
        Restore Purchases
      </Text>
    )}
  </Pressable>
)}
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | vitest.config.ts |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Existing Test Coverage
- `src/__tests__/monetization-events.test.ts` -- checks that tracking functions exist (basic export test)
- `src/__tests__/subscription-types.test.ts` -- checks module exports exist
- `src/__tests__/setup.ts` -- mocks for `react-native-purchases`, `react-native-purchases-ui`, `react-native` (Alert) already configured

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MON-01 | `useCanAccessLesson` returns true during loading for premium lessons | unit | `npm test -- src/__tests__/offline-entitlement.test.ts` | No -- Wave 0 |
| MON-01 | Airplane-mode verification on device | manual-only | N/A -- requires physical device + Expo build | N/A |
| MON-02 | Restore handler calls `restorePurchases`, tracks success/failure, shows Alert | unit | `npm test -- src/__tests__/restore-purchases.test.ts` | No -- Wave 0 |
| MON-03 | PAYWALL_RESULT.ERROR calls trackPurchaseFailed + Alert | unit | `npm test -- src/__tests__/paywall-failures.test.ts` | No -- Wave 0 |
| MON-03 | PAYWALL_RESULT.NOT_PRESENTED fires analytics event | unit | `npm test -- src/__tests__/paywall-failures.test.ts` | No -- Wave 0 |
| MON-03 | PaywallResultProps accepts "not_presented" | unit (type) | `npm run typecheck` | N/A (type check) |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test && npm run typecheck`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/offline-entitlement.test.ts` -- covers MON-01: test `useCanAccessLesson` returns true when loading=true for premium lesson IDs
- [ ] `src/__tests__/restore-purchases.test.ts` -- covers MON-02: test restore handler success/failure paths
- [ ] `src/__tests__/paywall-failures.test.ts` -- covers MON-03: test ERROR and NOT_PRESENTED cases in paywall

**Note:** RevenueCat SDK mocks already exist in `setup.ts`. Tests need to add `restorePurchases` to the mock (currently not mocked). The `useCanAccessLesson` test needs to mock `useContext` to control `loading` and `isPremiumActive` values.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Purchases.restoreTransactions()` | `Purchases.restorePurchases()` | RevenueCat SDK v5+ | Method was renamed; v9.15.0 uses `restorePurchases()` |

**No deprecated patterns in current code.** The existing integration uses current RevenueCat SDK patterns.

## Open Questions

1. **Airplane-mode verification result**
   - What we know: RevenueCat SDK docs say `getCustomerInfo()` returns cached data offline on a configured SDK
   - What's unclear: Whether this holds true in the Expo managed workflow with react-native-purchases@9.15.0
   - Recommendation: This is a verification task (D-02). Document the result in SUMMARY. The loading-state UX fix (D-03) should be done regardless.

2. **trackPurchaseFailed product_id in ERROR case**
   - What we know: `PurchaseFailedProps` has a required `product_id: string` field
   - What's unclear: Whether `"unknown"` is acceptable or if we should make `product_id` optional
   - Recommendation: Pass `"unknown"` -- simpler than modifying the type. The `error_code` field is more useful for debugging.

## Sources

### Primary (HIGH confidence)
- Source code inspection: `src/monetization/` (all 5 files read in full)
- Source code inspection: `src/analytics/events.ts` (full type definitions)
- Source code inspection: `app/(tabs)/progress.tsx` (full screen read)
- Source code inspection: `src/__tests__/setup.ts` (existing mocks confirmed)
- npm registry: `react-native-purchases@9.15.0` (version confirmed via `npm ls`)

### Secondary (MEDIUM confidence)
- RevenueCat SDK docs: `restorePurchases()` is the correct method name (verified via project docs and spec references)
- RevenueCat offline behavior: SDK caches CustomerInfo between launches (stated in spec, consistent with SDK design)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and in use, versions verified
- Architecture: HIGH - all source files read, patterns are clear and well-established
- Pitfalls: HIGH - derived from actual code inspection, not speculation

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable -- no library upgrades planned)
