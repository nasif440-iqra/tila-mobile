# Phase C: Monetization — Design Spec (v2)

## Overview

Ship the paywall and subscription system. Uses RevenueCat as the single source of truth for billing and subscription state. RevenueCat's built-in paywall UI for the purchase screen (v1 — replace with custom design once conversion data exists). A thin `SubscriptionProvider` exposes RevenueCat state to the app. Lesson gating and review access are separate concerns from billing.

## Decisions

- **Free cutoff:** Lessons 1-7 (through Phase 1 checkpoint)
- **Pricing:** $8.99/month, $49.99/year, 7-day free trial on both
- **Paywall UI:** RevenueCat built-in (v1)
- **Post-expiry:** Lessons completed during premium remain reviewable on this device, new lessons locked. Review rights are device-local (lost on reinstall/device switch). Account-level persistence deferred to cloud sync milestone.
- **Trial nudges:** Progressive urgency (subtle days 1-4, visible days 5-6, expired day 7+)
- **Scholarship:** Email-based, platform-specific fulfillment (see Scholarship section)

## Pre-Monetization Fix: Review Sentinel Bug

**Must fix before Phase C work begins.**

`app/lesson/review.tsx:64` passes `lesson_id=0` to `saveCompletedLesson()`, which inserts into `lesson_attempts` where the schema CHECK constraint says `lesson_id >= 1`. This is a constraint violation that will crash on every review completion.

**Fix:** Change review sessions to skip `lesson_attempts` entirely. Review results should still feed the mastery pipeline (entity/skill/confusion updates) but should not create a `lesson_attempts` row. Review is practice, not lesson progression.

Concretely:
- Add a `skipLessonAttempt` option to `completeLesson()` (or extract mastery-save into its own function)
- `review.tsx` calls the mastery-save path without inserting into `lesson_attempts`
- Remove the `lesson_id=0` sentinel pattern

## Architecture

### Separation of Concerns

Three independent questions, handled by three separate mechanisms:

```
1. PEDAGOGICAL UNLOCK — "Has the learner progressed enough?"
   Source: existing engine/selectors.js (isLessonUnlocked)
   Already works. No changes needed.

2. SUBSCRIPTION ACCESS — "Does the user have premium?"
   Source: RevenueCat CustomerInfo (single source of truth)
   Exposed via SubscriptionProvider React Context.

3. REVIEW RIGHTS — "Can this expired user review this content?"
   Source: premium_lesson_grants table (local SQLite)
   Recorded when user completes a premium lesson while subscribed.
```

A lesson is accessible when: pedagogical unlock passes AND (lesson <= 7 OR subscription is active).

**Two distinct lock types — never conflate:**
- **Progression-locked:** User hasn't completed prerequisites. Shown as "not yet unlocked" in existing UI (greyed out, no lock icon). Tapping does NOT open paywall — standard "complete previous lessons first" behavior.
- **Premium-locked:** User has progression access but lesson > 7 and no active subscription. Shown with lock icon overlay. Tapping opens paywall.

A letter is reviewable when: it was taught in lessons 1-7 OR the lesson that teaches it has a grant in `premium_lesson_grants`.

### New Files

| File | Purpose |
|------|---------|
| `src/monetization/revenuecat.ts` | SDK initialization (already done) |
| `src/monetization/provider.tsx` | `SubscriptionProvider` — thin wrapper around RevenueCat CustomerInfo |
| `src/monetization/hooks.ts` | `useSubscription()` hook, `useCanAccessLesson()`, `usePremiumReviewRights()` |
| `src/monetization/paywall.ts` | `presentPaywall()` wrapper with analytics |
| `src/monetization/analytics.ts` | Conversion event definitions and helpers |

### Modified Files

| File | Change | Complexity |
|------|--------|------------|
| `app/_layout.tsx` | Wrap in `SubscriptionProvider`. Current tree: ThemeContext → Sentry.ErrorBoundary → DatabaseProvider → AnalyticsGate → Stack. Insert SubscriptionProvider inside DatabaseProvider, outside AnalyticsGate. Provider is a thin RevenueCat wrapper only — grant lookup lives in hooks/selectors, not in the provider. | Low |
| `app/lesson/[id].tsx` | Gate lesson 8+ before entering quiz; lesson 7 summary trial CTA; record premium lesson grant on completion | Medium |
| `app/lesson/review.tsx` | Fix sentinel bug; add subscription-aware review filtering | Medium |
| `app/(tabs)/index.tsx` | Lock icons on lessons 8+; trial badge; upgrade card; tapping locked lesson → paywall | Medium |
| `src/components/LessonSummary.tsx` | Accept + render trial CTA card (lesson 7 context) | Low |
| `src/db/schema.ts` | Add `premium_lesson_grants` table; bump schema 4 → 5 | Low |
| `src/db/client.ts` | Add v5 migration | Low |
| `src/engine/progress.ts` | Add `savePremiumLessonGrant()`, `loadPremiumLessonGrants()`, extract mastery-save from `completeLesson` | Medium |
| `src/analytics/events.ts` | Add monetization event types | Low |
| `src/hooks/useProgress.ts` | Support mastery-only save (no lesson_attempt row) for review sessions | Low |

## SubscriptionProvider

Thin React Context that exposes RevenueCat state. RevenueCat is the source of truth — this provider does not re-encode or cache subscription logic.

```typescript
interface SubscriptionState {
  /** Raw RevenueCat CustomerInfo — null until first fetch */
  customerInfo: CustomerInfo | null;

  /** Whether premium entitlement is currently active (trial OR paid) */
  isPremiumActive: boolean;

  /** Lifecycle stage for UI messaging */
  stage: "free" | "trial" | "paid" | "expired" | "unknown";

  /** Days remaining in trial, null if not trialing */
  trialDaysRemaining: number | null;

  /** URL to manage subscription (App Store / Play Store) */
  managementURL: string | null;

  /** When CustomerInfo was last synced from RevenueCat */
  lastSyncedAt: Date | null;

  /** Loading state — true until first CustomerInfo fetch completes */
  loading: boolean;

  /** Present RevenueCat's built-in paywall — returns structured outcome */
  showPaywall: (trigger: PaywallTrigger) => Promise<PaywallOutcome>;

  /** Force refresh CustomerInfo from RevenueCat */
  refresh: () => Promise<void>;
}

type PaywallTrigger = "lesson_7_summary" | "lesson_locked" | "expired_card" | "home_upsell";

type PaywallOutcome = {
  /** What happened */
  result: "purchased" | "restored" | "cancelled" | "error" | "not_presented";
  /** Whether the user now has premium access (true for purchased/restored) */
  accessGranted: boolean;
}
```

**Initialization flow:**
1. On mount, call `Purchases.getCustomerInfo()` to get initial state
2. Subscribe to `Purchases.addCustomerInfoUpdateListener()` for real-time updates
3. Derive `isPremiumActive` from `customerInfo.entitlements.active["premium"]`
4. Derive `stage` from entitlement presence + trial period metadata
5. Derive `trialDaysRemaining` from entitlement `expirationDate` when in trial

**Key principle:** `isPremiumActive` is the only flag used for access gating. `stage` and `trialDaysRemaining` are used only for UI messaging (copy, badges, urgency banners). No separate `isTrialing` gate.

## Review Rights: Premium Lesson Grants

### Why lesson-level, not letter-level

The original spec proposed `premium_letter_access` keyed by `letter_id`. This is too lossy — it discards source context and grants permanent review access from a single question attempt. A mixed question could accidentally unlock a letter forever.

### Design

```sql
CREATE TABLE IF NOT EXISTS premium_lesson_grants (
  lesson_id INTEGER NOT NULL PRIMARY KEY,
  granted_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Grant rule:** When a user completes (passes) a lesson with `lesson_id > 7` while `isPremiumActive` is true, insert a row. One row per lesson, idempotent.

**Review access derivation** via `getReviewableLetterIds(grantedLessonIds: number[]): number[]`:
1. All letters from lessons 1-7 are always reviewable
2. Load all `lesson_id` values from `premium_lesson_grants`
3. Look up `teachIds` for those lessons from `LESSONS` data
4. Union of (1) and (3) = reviewable letter IDs

This is the single source of truth for review filtering. Used by `usePremiumReviewRights()` hook.

This is clean because:
- Grant is tied to meaningful completion, not individual question attempts
- The LESSONS curriculum data already maps lessons → letters
- Revoking access to a lesson (if ever needed) is a single row delete
- No risk of accidental grants from mixed questions

Schema version: 4 → 5. Migration adds the table only.

## Paywall Trigger Points

### Trigger 1: Lesson 7 Summary (soft CTA)

After passing lesson 7, a card appears on the summary screen:

- **Headline:** "You just learned to recognize the Arabic alphabet."
- **Body:** "Ready to learn how they sound? Start your free 7-day trial."
- **CTA:** [Start Free Trial] → `presentPaywall("lesson_7_summary")`
- **Secondary:** "Can't afford Tila? Email us" → `mailto:support@tila.app?subject=Tila%20Scholarship%20Request`
- **Dismiss:** User taps "Continue" as normal

**Repeat behavior:** Shows every time the user passes lesson 7 (including retries/revisits) until they start a trial or subscribe. Not "only once" — that creates a conversion cliff. Skip if already trialing/premium.

### Trigger 2: Locked Lesson Tap (hard gate)

Home screen lessons 8+ show a lock icon for free/expired users. Tapping a locked lesson:

1. Fires `paywall_shown` with trigger `lesson_locked`
2. Calls `presentPaywall("lesson_locked")`
3. On success → navigate into the lesson
4. On failure → stay on home screen

### Trigger 3: Home Upgrade Card (expired users)

When trial/subscription expires, home shows an "Upgrade to Continue" card in the lesson grid at the position of the next locked lesson. Tapping it presents the paywall with trigger `expired_card`.

### Trigger 4: Home Upsell (free users past lesson 7)

For free users who dismissed the lesson 7 CTA: a subtle "Unlock all lessons" card appears on the home screen above the locked lesson section. Less prominent than the expired card. Tapping → paywall with trigger `home_upsell`.

### No Paywall In:
- Mid-lesson or mid-review
- App launch or splash
- Progress screen

## Trial Lifecycle UI

### Days 1-4 (subtle)

Small muted text in home header: `Trial · 5 days left`

Style: `colors.textMuted`, small font, doesn't compete with learning content.

### Days 5-6 (visible)

Slim banner below header: `Your trial ends in 2 days. Subscribe to keep learning.`

Style: `colors.accentLight` background, tappable → paywall. Dismissible per session, reappears next app open.

### Day 7+ (expired)

Banner: `Your trial has ended.`

Lessons 8+ show lock icons. Upgrade card in lesson grid.

### Expired Review Flow

Previously completed premium lessons do NOT get a special "review" badge on the lesson grid. The lesson grid shows them locked like any other premium lesson.

Instead, expired users access review through the existing global review system:
- `planReviewSession()` already builds review sessions from mastery + SRS state
- For expired users, filter the review pool: only include letters whose source lesson has a row in `premium_lesson_grants`
- If the filtered pool has reviewable letters, the home review CTA ("X letters ready for review") still appears
- Tapping it routes to the existing `app/lesson/review.tsx` — no new lesson-scoped review flow

This avoids building a second review mechanism. The existing global review system handles it, just with a filtered letter pool.

### No Trial UI For:
- Free users who never started a trial (just lock icons on 8+)
- Active paid subscribers (clean experience)

### Stage: "unknown"

On first cold start with no cached CustomerInfo and no network:
- Show lock icons on lessons 8+ (same as free)
- Do NOT show trial/expiry messaging
- If user taps a locked lesson, show "Couldn't verify your subscription. Connect to the internet to continue." instead of the paywall
- When connectivity returns and `getCustomerInfo()` resolves, update UI reactively via CustomerInfo listener
- This prevents a legitimate paid user on a fresh reinstall from silently seeing a free experience with no explanation

## Analytics Events

All events respect existing analytics consent gate. PostHog only fires if user accepted via AnalyticsGate.

| Event | Trigger | Properties |
|-------|---------|------------|
| `paywall_shown` | Paywall about to present | `trigger`, `offering_id` |
| `paywall_result` | Paywall dismissed/completed | `trigger`, `result`: `purchased` / `restored` / `cancelled` / `error` |
| `purchase_started` | User initiates purchase flow | `product_id`, `offering_id` |
| `purchase_completed` | Purchase succeeds | `product_id`, `plan`: `monthly` / `annual`, `is_trial`, `price`, `currency` |
| `purchase_failed` | Purchase fails | `product_id`, `error_code`, `error_message` |
| `restore_started` | User initiates restore | — |
| `restore_completed` | Restore succeeds or fails | `success`, `entitlements_restored`: count |
| `trial_expired` | App detects trial ended | `days_used`, `lessons_completed_during_trial` |
| `entitlement_changed` | CustomerInfo update changes stage | `old_stage`, `new_stage` |
| `scholarship_link_tapped` | User taps scholarship link | `trigger` |

These events are typed in `src/analytics/events.ts` alongside existing event definitions.

## Scholarship Access

**This is intentionally asymmetric across platforms:**

- **Apple:** App Store Connect Subscription Offer Codes — generates codes for free or discounted subscription periods. User redeems in App Store. Can provide genuinely free access for the offer duration.
- **Google Play:** Promo codes for subscriptions are framed as free trials/promotions, not permanent free grants. They require a payment method, start a real subscription with auto-renewal, and the user must cancel before the promo period ends to avoid charges. Codes can also be redeemed in the Play Store app outside of Tila.

"Scholarship" does NOT mean the same fulfillment on both platforms. Apple can give true free access; Google gives a promoted trial that auto-renews. Support responses must be platform-specific.

**Implementation:** "Can't afford Tila?" link appears on:
1. Lesson 7 summary CTA card
2. (Future) Settings screen

Opens `mailto:support@tila.app?subject=Tila%20Scholarship%20Request` with pre-filled subject.

**Fulfillment:** Manual. Generate platform-specific codes and email to user. Automate if volume exceeds ~10/month. Consider a "scholarship entitlement" mechanism (RevenueCat promotional entitlement) if Google Play limitations become a problem.

**Android edge case:** Google promo codes can be redeemed outside the app (via Play Store). The app must handle these gracefully — RevenueCat's CustomerInfo listener will fire when the entitlement activates, and the UI should update reactively. No special code needed beyond the existing listener, but verify this in testing (test matrix #20).

## Restore + Subscription Management

RevenueCat's built-in paywall includes restore. But that's not sufficient:

- **Settings screen** (Phase D, but prep the hook now): will include "Restore Purchases" and "Manage Subscription" (opens `managementURL` from CustomerInfo — links to App Store / Play Store subscription management)
- **Google Play requirement:** Must have an in-app route to subscription management. `managementURL` satisfies this.
- **For Phase C:** Add a "Restore Purchases" option accessible from the locked-lesson paywall flow. If RevenueCat's built-in paywall already provides this, no extra work needed. Verify during testing.

## Offline Behavior

RevenueCat caches CustomerInfo locally, but cache freshness depends on calling `getCustomerInfo()` or triggering purchase/restore.

| Scenario | Behavior |
|----------|----------|
| **Cold start, no network, no cache** | `stage = "unknown"`, treat as free, no trial messaging |
| **Cold start, no network, cached premium** | `stage` from cache, allow access (RevenueCat default) |
| **Paywall tap while offline** | `presentPaywall()` will fail — show "Couldn't verify your subscription. Connect to the internet to continue." (same message as unknown state) |
| **Stale cached premium (expired server-side)** | Will resolve on next `getCustomerInfo()` when online. Brief grace period is acceptable — RevenueCat handles this. |
| **Premium letter review while offline** | Works — `premium_lesson_grants` is local SQLite |

## RevenueCat Configuration (Complete)

- **SDK:** `react-native-purchases` + `react-native-purchases-ui` (installed)
- **Init:** `src/monetization/revenuecat.ts` (done, reads keys from `.env`)
- **Entitlement:** `premium` (created in dashboard)
- **Products:** `tila_monthly`, `tila_annual` (created in App Store Connect + RevenueCat)
- **Offering:** `default` with monthly + annual packages (configured)
- **Introductory offer:** 7-day free trial on both products (configured)
- **Paywall:** Must be designed in RevenueCat dashboard before `presentPaywall()` renders anything

## Constraints

- RevenueCat requires a development build (not Expo Go) to test purchases
- IAP testing uses sandbox accounts — create them in App Store Connect before testing
- RevenueCat's paywall must be configured in their dashboard (template + copy) before it will render
- `premium_lesson_grants` is write-on-pass, idempotent, no cleanup needed
- Trial state is server-side (RevenueCat) — no local timer manipulation possible
- Development build must be created via `npx eas build --profile development`

## Subscription State Test Matrix

Before shipping, verify each scenario:

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Fresh install, no purchase | Lessons 1-7 accessible, 8+ locked with lock icon |
| 2 | Tap locked lesson | Paywall appears, can dismiss |
| 3 | Complete lesson 7, first time | Summary shows trial CTA card |
| 4 | Purchase monthly via paywall | All lessons unlock, trial badge if applicable |
| 5 | Purchase annual via paywall | Same as above |
| 6 | Complete lesson 8+ while premium | `premium_lesson_grants` row created |
| 7 | Trial expires | Lessons 8+ re-lock (all show lock icon, no special review badge). Home review CTA still appears if granted letters are due for review. |
| 8 | Expired user taps review | Can review letters from granted lessons only |
| 9 | Expired user taps locked lesson | Paywall appears |
| 10 | Restore purchases (new device) | Entitlement restored, lessons unlock |
| 11 | Restore with no prior purchase | "No active subscription found" message |
| 12 | Offline cold start, no cache | Treated as free, no trial messaging |
| 13 | Offline cold start, cached premium | Access allowed per cache |
| 14 | Paywall tap while offline | "Couldn't verify your subscription. Connect to the internet to continue." — no crash |
| 15 | Cancel subscription (via App Store) | Access continues until period ends, then expires |
| 16 | Reinstall app | `getCustomerInfo()` restores entitlement; `premium_lesson_grants` lost — expired users lose review rights on reinstall (device-local by design, cloud sync deferred). UI does not promise account-level review persistence. |
| 17 | Offering fetch failure | Paywall shows error state, doesn't crash |
| 18 | Lesson 7 revisit after dismissing CTA | CTA shows again (not "only once") |
| 19 | Fresh reinstall, paid user, offline | Treated as unknown — shows "Couldn't verify subscription" message, not silently free. Unlocks on connectivity. |
| 20 | Android promo code redeemed outside app | App picks up entitlement change on next `getCustomerInfo()` / listener update. No crash, no stale UI. |

## Exit Criteria

- [ ] Review sentinel bug fixed (no `lesson_id=0` in `lesson_attempts`)
- [ ] `SubscriptionProvider` wraps app, exposes `isPremiumActive`, `stage`, `trialDaysRemaining`, `managementURL`
- [ ] Lesson 8+ gated — free/expired users see lock icons, tap → paywall
- [ ] Lesson 7 summary shows trial CTA (repeats until converted, skips if premium)
- [ ] Home shows upgrade card for expired users
- [ ] Home shows subtle upsell for free users past lesson 7
- [ ] Trial badge (progressive urgency: subtle → visible → expired)
- [ ] `premium_lesson_grants` recorded on premium lesson completion
- [ ] Expired users can review letters from granted lessons
- [ ] All analytics events typed and firing (with consent)
- [ ] "Can't afford Tila?" scholarship mailto link on lesson 7 CTA
- [ ] Offline: unknown state shows locked lessons + "Couldn't verify your subscription" on tap (not silently free)
- [ ] Subscription state test matrix passes (all 20 scenarios)
- [ ] Development build compiles and runs on iOS simulator with sandbox purchases
