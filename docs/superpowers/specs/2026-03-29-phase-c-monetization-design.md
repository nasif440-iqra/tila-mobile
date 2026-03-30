# Phase C: Monetization — Design Spec

## Overview

Ship the paywall and subscription system. Transform Tila from a free app into a business. Uses RevenueCat for billing, RevenueCat's built-in paywall UI for the purchase screen, and a custom entitlement layer for lesson gating.

## Decisions

- **Free cutoff:** Lessons 1-7 (through Phase 1 checkpoint)
- **Pricing:** $8.99/month, $49.99/year, 7-day free trial on both
- **Paywall UI:** RevenueCat built-in (upgrade to custom later once conversion data exists)
- **Post-expiry:** Premium letters remain reviewable, new lessons locked
- **Trial nudges:** Progressive urgency (subtle days 1-4, visible days 5-6, expired day 7+)
- **Scholarship:** Email-based (support@tila.app), manual fulfillment via App Store offer codes

## Architecture

### Layers

```
RevenueCat SDK (react-native-purchases)
  ↓
EntitlementProvider (React Context)
  ↓
Consumer screens (Home, Lesson, Review)
  ↓
Analytics Events (PostHog)
```

Follows existing patterns — same as ThemeContext and DatabaseProvider. No new state library.

### New Files

| File | Purpose |
|------|---------|
| `src/monetization/revenuecat.ts` | SDK initialization (already done) |
| `src/monetization/entitlements.ts` | Pure logic: `canAccessLesson()`, `canReviewLetter()`, `isPremium()` |
| `src/monetization/provider.tsx` | React context — wraps app, queries RevenueCat, exposes state |
| `src/monetization/analytics.ts` | Conversion event tracking helpers |

### Modified Files

| File | Change |
|------|--------|
| `app/_layout.tsx` | Wrap app in `EntitlementProvider` |
| `app/lesson/[id].tsx` | Gate lesson 8+, add trial CTA on lesson 7 summary |
| `app/(tabs)/index.tsx` | Trial badge, lock icons on lessons 8+, upgrade card |
| `app/lesson/review.tsx` | Allow review of premium letters post-expiry |
| `src/db/schema.ts` | Add `premium_letter_access` table, bump schema version |
| `src/db/client.ts` | Add migration for new table |
| `src/analytics/events.ts` | Add conversion event types |

## Entitlement Logic

### Access Rules

```
canAccessLesson(lessonId):
  lessons 1-7  → always true
  lessons 8+   → isPremium OR isTrialing

canReviewLetter(letterId):
  letters from lessons 1-7   → always true
  letters from lessons 8+    → true IF user ever accessed them (tracked in DB)

isPremium:
  RevenueCat customerInfo.entitlements.active["premium"] exists

isTrialing:
  isPremium AND entitlement has active trial period

trialDaysRemaining:
  days until trial expiry (0 if not trialing or expired)
```

### Entitlement Matrix

| Feature | Free | Trial | Premium | Expired |
|---------|------|-------|---------|---------|
| Lessons 1-7 | Yes | Yes | Yes | Yes |
| Lessons 8-106 | No | Yes | Yes | No |
| Review (lessons 1-7 letters) | Yes | Yes | Yes | Yes |
| Review (premium letters) | No | Yes | Yes | Yes* |
| Daily goal, streaks, celebrations | Yes | Yes | Yes | Yes |

*Expired users can review letters they accessed during trial/premium only.

### DB Change

New table to track premium letter access:

```sql
CREATE TABLE IF NOT EXISTS premium_letter_access (
  letter_id INTEGER NOT NULL PRIMARY KEY,
  first_accessed TEXT NOT NULL DEFAULT (datetime('now'))
);
```

When a user completes a question targeting a letter from lesson 8+, insert that letter_id. This survives subscription expiry and enables review of previously learned letters.

Schema version: 4 → 5. Migration adds the table.

## Paywall Trigger Points

### Trigger 1: Lesson 7 Summary (soft)

After passing the Phase 1 checkpoint, an extra card appears on the summary screen:

- **Headline:** "You just learned to recognize the Arabic alphabet."
- **Body:** "Ready to learn how they sound? Start your free 7-day trial."
- **CTA:** [Start Free Trial] → `RevenueCatUI.presentPaywall()`
- **Secondary:** "Can't afford Tila? Email us" → `mailto:support@tila.app`
- **Dismiss:** User can tap "Continue" as normal — no pressure

Only shown once (first time completing lesson 7). If already trialing/premium, skip.

### Trigger 2: Locked Lesson Tap (hard gate)

On the home screen, lessons 8+ show a lock icon overlay for free/expired users. Tapping a locked lesson:

1. Fires `paywall_shown` analytics event with trigger `lesson_locked`
2. Calls `RevenueCatUI.presentPaywall()`
3. On `PURCHASED` or `RESTORED` → navigate into the lesson
4. On `CANCELLED` / `ERROR` → stay on home screen

### Trigger 3: Expired Upgrade Card

When trial expires, home screen shows an "Upgrade to Continue" card where the next locked lesson would be. Tapping it presents the paywall with trigger `expired_card`.

### No Paywall In:
- Mid-lesson
- Mid-review
- App launch
- Progress screen

## Trial Lifecycle UI

### Days 1-4 (subtle)

Small muted text in the home header area:

```
Trial · 5 days left
```

Muted color (`colors.textMuted`), doesn't compete with learning content.

### Days 5-6 (visible)

Slim banner below the header:

```
Your trial ends in 2 days. Subscribe to keep learning.
```

Accent gold background (`colors.accentLight`), tappable → opens paywall. Dismissible per session but reappears next app open.

### Day 7+ (expired)

Banner changes to:

```
Your trial has ended.
```

Lessons 8+ show lock icons. "Upgrade to Continue" card in lesson grid.

### No Trial UI For:
- Free users who never started a trial (just lock icons on 8+)
- Active subscribers (clean experience, no badges)

## Analytics Events

All events respect existing analytics consent (PostHog only fires if user accepted).

| Event | Trigger | Properties |
|-------|---------|------------|
| `paywall_shown` | Paywall presented | `trigger`: `lesson_7_summary` / `lesson_locked` / `expired_card` |
| `paywall_dismissed` | User closes without action | `trigger` |
| `trial_started` | Purchase with trial succeeds | `plan`: `monthly` / `annual` |
| `subscription_started` | Purchase without trial succeeds | `plan`, `price` |
| `trial_expired` | App detects trial ended | `days_used` |
| `restore_purchases_tapped` | User taps restore | — |
| `scholarship_link_tapped` | User taps scholarship link | — |

## RevenueCat Configuration (Complete)

- **Entitlement:** `premium`
- **Products:** `tila_monthly` ($8.99/mo), `tila_annual` ($49.99/yr)
- **Offering:** `default` containing monthly + annual packages
- **Introductory offer:** 7-day free trial on both products
- **Paywall:** Configured in RevenueCat dashboard (built-in UI)

## Restore Purchases

Handled automatically by RevenueCat's built-in paywall UI. The paywall includes a "Restore Purchases" option. On success, entitlement reactivates and paywall dismisses.

## Scholarship Access

- "Can't afford Tila?" link on lesson 7 summary CTA card
- Opens `mailto:support@tila.app` with pre-filled subject
- Fulfillment via App Store Connect Subscription Offer Codes (Apple) or promo codes (Google Play)
- Manual process — automate if volume exceeds ~10/month

## Offline Behavior

RevenueCat caches entitlement state locally. If the device is offline:
- Last known entitlement state is used (if user was premium, they stay premium)
- Paywall presentation will fail gracefully — show a "You're offline" message instead
- Premium letter access tracking works normally (local DB)
- No special offline handling needed beyond RevenueCat's built-in caching

## Constraints

- RevenueCat requires a development build (not Expo Go) to test purchases
- IAP testing uses sandbox accounts on both platforms
- RevenueCat's built-in paywall must be configured in their dashboard before it renders
- `premium_letter_access` tracking is write-only during lessons — no cleanup needed
- Trial state is server-side (RevenueCat) — no local timer manipulation possible

## Exit Criteria

- [ ] Lesson 8+ blocked for free users, accessible for trial/premium
- [ ] Paywall shows after lesson 7 completion (first time only)
- [ ] Paywall shows when tapping locked lesson 8+
- [ ] Lock icons on lessons 8+ for free/expired users
- [ ] Trial badge on home (progressive urgency: subtle → visible → expired)
- [ ] Post-expiry: can review previously learned premium letters, can't start new lessons
- [ ] "Upgrade to Continue" card on home for expired users
- [ ] All analytics events firing in PostHog
- [ ] Scholarship email link functional
- [ ] Restore purchases works (via RevenueCat built-in paywall)
- [ ] Development build compiles and runs on iOS simulator
