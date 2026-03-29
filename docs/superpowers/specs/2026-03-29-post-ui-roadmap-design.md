# Tila Launch Roadmap: Trust → Habit → Money → Polish

**Date:** 2026-03-29
**Status:** Final (v3 — frozen, ready for execution)
**Goal:** Get to $10k MRR. Not "make the app nicer."
**Deferred:** Curriculum expansion (Phase 5+), badges, streak flames, adaptive engine, weekly summaries, interleaved review injection, React.memo sweep, and all other second-order optimizations.

---

## Context

The UI overhaul is ~90% done. The app has 106 lessons across 4 phases, a sophisticated mastery engine, and polished visuals. What's missing: data integrity bugs, no monetization, no daily return loop, and no way to bring users back.

This roadmap is built around one loop:

**finish lesson → feel real progress → come back tomorrow → hit review moment → pay**

---

## Execution Shape: Partially Parallel

This is NOT fully sequential. Phases overlap where dependencies allow.

```
Week 1-2:  ████ Phase A (trust) ████████████████████████
Week 1-2:            ███ B1-B3 (habit: goals, streak) ███  ← starts mid-A
Week 2-3:                 ███ B4-B6 (habit: teaching, review) ███
Week 2-3:            ███ C1-C2 (RevenueCat + entitlements) ███  ← starts during B
Week 3-4:                      ███ C3-C8 (paywall, trial, billing) ███
Week 4+:                              ███ Phase D (polish) ███
```

**Why partially parallel:**
- B1-B3 (daily goal, celebration, streak) touch different files than A1-A7 (engine, DB, analytics). No conflicts.
- C1-C2 (RevenueCat setup, entitlement system) require an Expo development build and EAS-based testing — this is native module work that takes calendar time. Starting early prevents a bottleneck.
- B4 (wrong-answer teaching) depends on A3 (confusion persistence). Must wait.
- C3-C8 (paywall, trial, billing flows) depend on C1-C2 (RevenueCat) and B (the habit loop that retains during trial). Must wait.

---

## Phase A: Trust

Fix what's broken. No user-facing features — just make the data honest.

### A1: Fix Mastery Save Race Condition
**Problem:** `useProgress.ts` `completeLesson()` calls `refresh()` then merges quiz results against potentially-stale `state`. If mastery updated between refresh and merge, newer data gets overwritten.

**Fix:** Change pipeline to: load fresh state → merge quiz results into fresh state → save merged state → reload once. Single atomic flow.

**Files:** `src/hooks/useProgress.ts`
**Verification:** Test simulating concurrent mastery updates confirms no data loss.

### A2: Fix Checkpoint Phase 2+ Classifier
**Problem:** `checkpoint.js` `classifyLetters()` accesses `progress?.[id]` expecting flat numeric keys. Real mastery data uses entity keys like `"letter:5"`. Phase 2+ checkpoint quizzes silently produce garbage because every letter classifies as "unseen."

**Fix:** Adapt `classifyLetters()` to parse entity key format. Accept both `progress[5]` and `progress["letter:5"]`.

**Files:** `src/engine/questions/checkpoint.js`
**Verification:** Generate Phase 2 checkpoint with real mastery data. Confirm struggled/unseen/strong matches actual state.

### A3: Persist Confusion Categories
**Problem:** `mastery.js` computes error categories (visual_confusion, sound_confusion, vowel_confusion) but `progress.ts` only saves confusion_key, count, last_seen. Categories are lost on restart. Phase B4 (wrong-answer teaching) needs this data.

**Fix:**
1. Add `categories TEXT` column to mastery_confusions (JSON-encoded histogram)
2. Update `saveConfusion()` to serialize categories
3. Update `loadProgress()` to deserialize
4. Schema migration v2 → v3

**Files:** `src/db/schema.ts`, `src/db/client.ts`, `src/engine/progress.ts`
**Verification:** Record confusion, restart app, confirm categories restored.

### A4: Empty Harakat Quiz Fallback
**Problem:** If `generateHarakatCombos()` returns empty, lesson produces 0 questions and silently "completes" with 100% accuracy. Fake progress.

**Fix:** Add minimum question count check in `useLessonQuiz.ts`. If generation returns empty, show error state. Add fallback combo generation using lesson's `teachIds`.

**Files:** `src/engine/questions/harakat.js`, `src/hooks/useLessonQuiz.ts`
**Verification:** Force empty combo generation, confirm error state instead of silent completion.

### A5: Environment Variables
**Problem:** PostHog key (`phc_1VLx...`), Sentry DSN, and EAS project ID hardcoded in source files committed to git.

**Fix:**
1. Create `.env` and `.env.production` with `EXPO_PUBLIC_` prefixed variables
2. Update `posthog.ts`, `sentry.ts`, `app.config.ts` to read from `process.env`
3. Add `.env*` to `.gitignore`
4. Set production values as EAS secrets
5. Rotate the exposed PostHog key (create new, invalidate old)

**Files:** `src/analytics/posthog.ts`, `src/analytics/sentry.ts`, `app.config.ts`, `.gitignore`

### A6: Analytics Consent
**Problem:** App sends analytics events from first launch with no user consent. Required for GDPR and App Store.

**Fix:**
1. Add `analytics_consent: INTEGER` to user_profile (null = not asked, 1 = accepted, 0 = declined)
2. After onboarding completion, show simple modal: "Help improve Tila by sharing anonymous usage data?"
3. If declined: disable PostHog. Keep Sentry crash reporting (legitimate interest).
4. Store choice. Provide toggle in Settings screen (Phase D2).
5. Check consent before initializing PostHog on every launch.

**Files:** `src/analytics/index.ts`, `src/analytics/posthog.ts`, `src/db/schema.ts`, new consent modal component

### A7: Fix Motivation Mapping
**Problem:** All 5 motivation choices in post-lesson onboarding save as `"quran"`. Current schema CHECK constraint only allows `('quran', 'prayer', 'general')`.

**Fix:**
1. Migrate schema: expand CHECK to `('read_quran', 'pray_confidently', 'connect_heritage', 'teach_children', 'personal_growth')`
2. Map each UI option to its real value
3. Use for personalized copy in Phase B and paywall messaging in Phase C

**Files:** `app/post-lesson-onboard.tsx`, `src/db/schema.ts`, `src/db/client.ts`

### Phase A Exit Criteria
- [ ] Quiz completion with 15 questions saves mastery atomically — no stale merge
- [ ] Phase 2 checkpoint produces correctly classified questions (tested with real entity-key mastery)
- [ ] Confusion categories survive app restart (write → kill → reload → verify)
- [ ] Empty harakat combo shows error state, not silent 100% completion
- [ ] `npm run validate` passes with no env var leaks in source
- [ ] PostHog only initializes after consent accepted
- [ ] Motivation saves distinct values per selection (verified in DB)

---

## Phase B: Habit

Wire the daily return loop. Minimum viable retention.

**B1-B3 can start during Phase A** (different files, no dependency on A1-A7).
**B4 requires A3** (confusion categories must be persisted).

### B1: Wire Daily Goal to Home Screen
**Problem:** "Today: 0/1" pill is hardcoded to `DAILY_GOAL = 1`. The user chose 3, 5, or 10 minutes during post-lesson onboarding. Schema already has `daily_goal` column, habit table already tracks `today_lesson_count`.

**Fix:**
1. Load `dailyGoal` from user_profile via `useProgress()`
2. Convert: 3 min = 1 lesson, 5 min = 2 lessons, 10 min = 3 lessons
3. Replace hardcoded constant with user's actual goal
4. Default to 1 lesson if no goal set
5. Update pill display: "Today: 1/2"

**Files:** `app/(tabs)/index.tsx`

### B2: Goal Completion Celebration
**Problem:** Hitting the daily goal produces nothing. This should be the most rewarding moment in the daily loop.

**Fix:**
1. After quiz completion, check `todayLessonCount >= dailyGoal`
2. If goal just reached: confetti burst (reuse LessonSummary confetti), haptic milestone, banner "You hit your goal today!"
3. Track `goalHitToday` in habit state to prevent re-triggering
4. Banner visible on home screen for remainder of session

**Files:** `app/lesson/[id].tsx`, `app/(tabs)/index.tsx`, `src/engine/habit.ts`

### B3: Simple Streak
**Problem:** Streak exists in engine but has no protection, no longest-streak tracking, and a punishing UX when it breaks.

**Fix:**
1. Add `longest_streak INTEGER DEFAULT 0` to habit table
2. Update `longestStreak` whenever `currentWird` exceeds it (never decreases)
3. Show streak prominently on home screen (current design already has wird badge)
4. When streak breaks, return-welcome shows: "Your X-day streak ended, but your longest of Y days is yours forever" + compassionate hadith
5. Never show "0 day streak" — show "Start your streak" instead
6. No freeze system at launch — keep it simple

**Files:** `src/engine/habit.ts`, `src/hooks/useHabit.ts`, `src/db/schema.ts`, `app/return-welcome.tsx`

### B4: Wrong-Answer Teaching (requires A3)
**Problem:** WrongAnswerPanel shows "The correct answer was [letter]" and plays audio. No explanation of WHY the user confused the letters. The engine classifies errors but the UI doesn't use it.

**Fix:**
1. Pass error category from mastery engine to WrongAnswerPanel
2. Render category-specific explanation:
   - **Visual confusion**: "These look alike! [correct] has [distinguishing feature]. Count the dots."
   - **Sound confusion**: "These sound similar. [correct] comes from [articulation point]. Listen for [difference]."
   - **Vowel confusion**: "The mark is different. [correct mark] is [position] — it makes [sound]."
   - **Random miss**: "Take your time. Let's look at [correct] again."
3. Use existing letter data: `confusedWith`, `tip`, `soundHint`, `articulation` fields
4. Expand `confusedWith` and `tip` coverage to all 28 letters where missing

**Files:** `src/components/quiz/WrongAnswerPanel.tsx`, `src/components/quiz/QuizQuestion.tsx`, `src/data/letters.js`

### B5: Post-Lesson Review Prompt
**Problem:** Review system exists in engine but is entirely passive — user must notice the review card on home screen.

**Fix:**
1. After lesson summary (passed state), check for due review entities
2. If due: show prompt below summary actions: "3 letters ready for a quick review — takes 2 minutes. Review now?"
3. "Review now" builds review payload, navigates to `lesson/review`
4. "Not now" dismisses. No guilt.
5. Track `review_prompt_shown` and `review_prompt_accepted` in analytics

**Files:** `src/components/LessonSummary.tsx`, `app/lesson/[id].tsx`

### B6: Micro-Review Sessions
**Problem:** Review sessions are 15 questions. Too long. Users skip them.

**Fix:**
1. Default review to 3-5 questions
2. Home screen review card: "Quick review (3 questions)" instead of implying a long session
3. After micro-review: "3 letters refreshed! X more available." Option to continue or stop.
4. Adjust `buildReviewLessonPayload()` to support configurable question count

**Files:** `src/engine/selectors.ts`, `app/(tabs)/index.tsx`

### Phase B Exit Criteria
- [ ] Daily goal pill shows user's actual chosen goal (3/5/10 min converted to lessons)
- [ ] Goal completion triggers confetti + haptic + banner (verified on device)
- [ ] Streak increments on consecutive days, longest streak persists, broken streak shows recovery message
- [ ] Wrong answer for a visual confusion shows dot-counting tip (not generic copy)
- [ ] Wrong answer for a sound confusion shows articulation hint
- [ ] Post-lesson review prompt appears when due letters exist (verified with seeded mastery data)
- [ ] Micro-review completes in 3-5 questions, shows "X more available" prompt
- [ ] Analytics events tracked: `goal_completed`, `review_prompt_shown`, `review_prompt_accepted`, `review_completed`

---

## Phase C: Money

Ship the paywall. This is where the app becomes a business.

**C1-C2 start during Phase B — this is a calendar-risk item, not just a coding task.** RevenueCat's Expo SDK (`react-native-purchases`) requires a development build — IAP does not work in Expo Go. EAS build queues, App Store Connect product setup, sandbox testing accounts, and Google Play Console configuration all take real calendar days. If you wait until "Phase C" to start, you create a multi-day bottleneck where paywall code is ready but you can't test it. Start C1-C2 as soon as Phase A is in progress.

### Entitlement Matrix

This is the single source of truth for what's free vs. premium.

| Feature | Free (no account) | Trial (7 days) | Premium | Expired (was premium) |
|---------|-------------------|-----------------|---------|----------------------|
| Onboarding (9 steps) | Yes | Yes | Yes | Yes |
| Lessons 1-7 | Yes | Yes | Yes | Yes |
| Lessons 8-106 | No | Yes | Yes | No |
| Daily goal display | Yes | Yes | Yes | Yes |
| Goal celebration | Yes | Yes | Yes | Yes |
| Streak tracking | Yes | Yes | Yes | Yes |
| Wrong-answer teaching (lessons 1-7) | Yes | Yes | Yes | Yes |
| Wrong-answer teaching (lessons 8+) | N/A | Yes | Yes | N/A |
| Review of letters from lessons 1-7 | Yes | Yes | Yes | Yes |
| Review of premium letters (lessons 8+) | No | Yes | Yes | **Yes** |
| Review counts toward streak | Yes | Yes | Yes | Yes |
| Post-lesson review prompt | Yes | Yes | Yes | Yes |
| Micro-review sessions | Yes | Yes | Yes | Yes (free letters only unless premium letters earned during trial/sub) |

**Key entitlement decisions:**
- **Premium letters earned during trial/subscription are reviewable after expiry.** The user already learned them. Blocking review would feel punitive and cause skill regression — bad for brand and re-conversion. They can review, but they can't start new lessons.
- **Streak tracking is always free.** Streaks drive daily return. Gating streaks behind premium would kill the retention loop that makes people want to subscribe.
- **Wrong-answer teaching is free for lessons 1-7.** The teaching quality is part of what convinces users to subscribe — they need to feel the difference.
- **Goal celebration is always free.** Same reason as streaks — it's the daily reward moment.

### C1: RevenueCat Integration
**What:** Install and configure RevenueCat's Expo SDK. Set up App Store Connect products and Google Play billing products.

**Fix:**
1. Install `react-native-purchases` (RevenueCat's Expo-compatible SDK)
2. Create RevenueCat project, configure API keys as EAS secrets
3. Set up products in App Store Connect and Google Play Console:
   - `tila_monthly` — $8.99/month
   - `tila_annual` — $49.99/year
4. Configure introductory offers: 7-day free trial on both products
5. Create Expo development build (`eas build --profile development`) — IAP cannot be tested in Expo Go
6. Verify sandbox purchases work on both platforms
7. Create `src/monetization/` directory with `entitlements.ts`, `offerings.ts`, `purchases.ts`

**Files:** `package.json`, `app.config.ts`, `eas.json`, new `src/monetization/` directory
**Note:** RevenueCat's Expo docs confirm: real purchases require development builds. Plan for this build time.

### C2: Entitlement System
**What:** The `isPremium()` check that gates lesson access throughout the app.

**Fix:**
1. Create `src/monetization/entitlements.ts`:
   - `isPremium(): boolean` — checks RevenueCat entitlement status
   - `isTrialing(): boolean` — active trial
   - `trialDaysRemaining(): number` — for countdown display
   - `canAccessLesson(lessonId: number): boolean` — lessons 1-7 always true, 8+ requires premium/trial
   - `canReviewLetter(letterId: number, learnedDuringPremium: boolean): boolean` — always true if letter was learned
2. Create `EntitlementProvider` React Context that wraps the app (alongside Theme and Database)
3. Create `premium_letter_access` table: `entity_key TEXT PRIMARY KEY, first_accessed_at TEXT, access_tier TEXT CHECK(access_tier IN ('free','trial','premium'))`. When a user completes a lesson during trial/premium, record each taught letter's entity key. This is cleaner than a JSON blob in user_profile — survives sync, multi-device, and analytics queries without parsing.
4. `canReviewLetter()` checks: is entity_key in `premium_letter_access`? If yes, review is always allowed regardless of current entitlement status.
5. Gate lesson navigation: `app/lesson/[id].tsx` checks `canAccessLesson()` before entering, redirects to paywall if not entitled

**Files:** New `src/monetization/entitlements.ts`, `src/monetization/provider.tsx`, `app/lesson/[id].tsx`, `app/_layout.tsx`, `src/db/schema.ts`

### C3: Paywall Trigger — After Lesson 7 (Family Summary)
**What:** The moment the user transitions from free to "time to subscribe." This must feel like a real milestone, not an arbitrary wall.

**Fix:**
1. After completing lesson 7 ("Ba · Ta · Tha — the dot family, all three together"), show a mini-celebration: "You just learned your first letter family. You can tell Ba, Ta, and Tha apart by counting their dots."
2. Then transition to trial offer: "Ready to learn the rest of the alphabet? Start your free 7-day trial."
3. Lesson 7 is the family summary lesson — the emotional payoff where the user proves they can distinguish all three letters. This is the real milestone, not an arbitrary number. Lessons 1-6 build toward it; lesson 7 is the proof.
4. If user declines: return to home. Lessons 1-7 remain accessible. Tapping lesson 8+ shows paywall.
5. If user hasn't completed lesson 7 but tries to access lesson 8+ directly (e.g., from review or deep link): show paywall immediately.

**Files:** `app/lesson/[id].tsx`, new `src/components/paywall/TrialOffer.tsx`

### C4: Paywall Screen
**What:** The purchase screen. This triggers an actual App Store / Play Store billing flow.

**Fix:**
1. Show offerings from RevenueCat (annual and monthly)
2. Annual preselected: "$49.99/year" with "Save 53%" badge. Monthly visible but visually secondary: "$8.99/month"
3. Both products configured with 7-day free introductory offer in App Store Connect / Google Play Console
4. "Start Free Trial" button initiates RevenueCat purchase flow → App Store / Play Store native billing dialog appears → user confirms with Face ID / fingerprint / password
5. On successful purchase: RevenueCat entitlement activates, user returned to app, full access unlocked
6. On cancel/failure: user stays on paywall, can dismiss to return to free tier
7. "Restore Purchases" button at bottom (required by Apple)
8. Scholarship link: "Can't afford Tila? We'll give you free access" → opens email to support@tila.app
9. Sadaqah framing: "Your subscription sponsors free Quran education for those who can't afford it"
10. Terms of Service and Privacy Policy links (required by Apple)

**Design:** Clean, warm, not aggressive. Match Tila's aesthetic. No dark patterns, no countdown timers, no "limited offer" language.

**Files:** New `src/components/paywall/PaywallScreen.tsx`

### C5: Trial Lifecycle Handling
**What:** What happens during and after the 7-day trial.

**Fix:**
1. **Day 1-4:** No interruption. User has full access. Small subtle badge in home header: "Trial — 5 days left"
2. **Day 5-6:** Gentle in-app banner on home screen: "Your trial ends in X days. Subscribe to keep learning." Tapping opens paywall.
3. **Day 7 (expiry):** RevenueCat handles the billing transition. If user didn't cancel and chose a plan, subscription auto-starts (standard App Store behavior). If user cancelled during trial, entitlement revokes.
4. **Post-expiry:** User can still open app, see full progress, access lessons 1-7, review any letters they learned during trial. Tapping lesson 8+ shows paywall. Home screen shows subtle "Upgrade to continue" card where hero card was.
5. **Trial days remaining:** Read from RevenueCat's `CustomerInfo.entitlements` — don't compute locally.

**Files:** `app/(tabs)/index.tsx`, `src/monetization/entitlements.ts`

### C6: Conversion Analytics Events
**What:** The most important events in the entire app. These are how you know if the business is working.

**Events:**
- `paywall_shown` — paywall screen appeared (with `trigger`: "lesson_6_complete", "lesson_locked", "trial_expired", "home_upgrade_card")
- `paywall_dismissed` — user closed paywall without purchasing
- `trial_started` — 7-day trial activated (with `plan`: "monthly" or "annual")
- `trial_expired` — trial ended without conversion
- `subscription_started` — paid subscription began (with `plan`, `price`, `currency`)
- `subscription_renewed` — existing subscription renewed (from RevenueCat webhook, if configured)
- `subscription_cancelled` — user cancelled (from RevenueCat)
- `restore_purchases_tapped` — user attempted restore
- `scholarship_link_tapped` — user tapped scholarship option

**Files:** `src/analytics/events.ts`, `src/monetization/purchases.ts`
**Integration:** All events fire to both PostHog (for analysis) and RevenueCat (for revenue attribution).

### C7: Restore Purchases
**What:** Required by Apple. User switches devices or reinstalls — needs to recover their subscription.

**Fix:**
1. "Restore Purchases" button on paywall screen
2. Calls `Purchases.restorePurchases()` via RevenueCat
3. On success: entitlement reactivated, user shown confirmation, paywall dismissed
4. On failure/no purchases found: "No active subscription found. If you believe this is an error, contact support@tila.app"

**Files:** `src/components/paywall/PaywallScreen.tsx`, `src/monetization/purchases.ts`

### C8: Scholarship Access
**What:** Free access for users who genuinely can't afford the subscription. Eliminates the moral objection to charging for Quran education.

**Fix:**
1. Link on paywall: "Can't afford Tila? We'll give you free access — no questions asked."
2. Tapping opens email compose to support@tila.app with subject "Scholarship Request"
3. Fulfillment: Generate a subscription Offer Code in App Store Connect (free, one-time-use, custom code). Send redemption URL to the user via email.
4. **Apple-specific:** As of March 2026, legacy promo codes for IAP are deprecated. Use Subscription Offer Codes instead — these support free offers, custom codes, and redemption URLs. Configurable in App Store Connect under Subscriptions → Offer Codes.
5. **Google Play:** Use a promo code via Google Play Console, or manually grant entitlement via RevenueCat dashboard.
6. Display scholarship option prominently — it costs nearly nothing (very few people email) but neutralizes the "charging for Quran" objection entirely.

**Files:** `src/components/paywall/PaywallScreen.tsx`
**Ops:** Scholarship fulfillment is manual for now. If volume exceeds ~10/month, automate with a webhook.

### Phase C Exit Criteria
- [ ] RevenueCat SDK installed and configured in Expo development build
- [ ] Sandbox purchase completes successfully on iOS and Android
- [ ] Lesson 8+ blocked for free users, accessible for trial/premium users
- [ ] Paywall shows after lesson 7 completion with mini-celebration
- [ ] Paywall shows when free user taps locked lesson
- [ ] Annual plan preselected, monthly visible, both with 7-day trial
- [ ] Trial countdown badge appears on home screen during trial
- [ ] Post-expiry: user can review learned letters but can't start lesson 8+
- [ ] Restore purchases works (tested: purchase on device A, restore on device B in sandbox)
- [ ] All C6 analytics events firing and visible in PostHog
- [ ] Scholarship email link works (opens compose with correct subject)
- [ ] `paywall_shown` → `trial_started` → `subscription_started` funnel visible in PostHog

### Phase C Decision Thresholds

These are the numbers that tell you if the business is working. Check after 500+ paywall impressions.

| Metric | Healthy | Investigate | Broken |
|--------|---------|-------------|--------|
| `paywall_shown` → `trial_started` | >25% | 15-25% | <15% |
| `trial_started` → `subscription_started` | >40% | 25-40% | <25% |
| `paywall_shown` → `paywall_dismissed` (no action) | <50% | 50-70% | >70% |
| `review_prompt_shown` → `review_prompt_accepted` | >30% | 15-30% | <15% |
| Annual vs monthly split (of conversions) | >60% annual | 40-60% | <40% annual |

**What to do when a metric is broken:**
- **Low paywall → trial:** The paywall copy, design, or timing is wrong. Test different value messaging (JTBD framing, not feature lists). Consider moving the trigger earlier or later.
- **Low trial → subscription:** The product isn't proving enough value during the 7-day window. Check: are trial users completing lessons? Are they hitting the review loop? Is the habit forming?
- **High paywall dismissal:** Users aren't convinced at all. Either the free tier is too generous (they don't feel they need more) or the premium pitch is too weak.
- **Low review prompt acceptance:** The "quick review" value prop isn't landing. Test different copy, or surface review differently (e.g., inline on home screen instead of post-lesson).
- **Low annual share:** The annual savings aren't visible enough, or the monthly price feels acceptable. Make the annual discount more prominent.

---

## Phase D: Polish

Business is working. Now make it better. Ordered by impact on retention and churn.

### D1: Deep Linking (prerequisite for D2)
**What:** `tila://` scheme routes to specific screens. Required for push notifications to land users on the right screen.

**Fix:**
1. Wire Expo Router linking with `tila://` scheme (already defined in `app.config.ts`, not connected)
2. Register routes: `tila://lesson/{id}`, `tila://home`, `tila://progress`, `tila://review`, `tila://paywall`
3. Handle in `_layout.tsx`: parse incoming URL, navigate to screen
4. Invalid/expired links → redirect to home
5. Entitlement check on deep-linked lessons (free user deep-links to lesson 50 → paywall)

**Files:** `app/_layout.tsx`, Expo Router linking config

### D2: Push Notifications (requires D1)
**What:** The #1 retention lever for mobile. Bring users back with gentle, purposeful nudges.

**Fix:**
1. Install `expo-notifications`
2. Request permission after first lesson completion (not first launch — earn trust first)
3. **Daily reminder:** Local notification at user's preferred time (default 8pm). "Your wird is waiting. Keep your X-day streak alive." Deep-links to `tila://home`
4. **Streak at risk:** If no practice by 2 hours before midnight and no freeze: "Your X-day streak resets at midnight." Deep-links to `tila://home`
5. **Review due:** Weekly if letters are due: "X letters ready for review." Deep-links to `tila://review`
6. **Smart quiet hours:** No notifications before 8am or after 10pm
7. Notification preferences stored in user_profile, adjustable in Settings (D3)

**Files:** New `src/notifications/`, `app/lesson/[id].tsx`, `src/db/schema.ts`

### D3: Settings Screen
**What:** Users need a place to manage their subscription, notification preferences, theme, and privacy.

**Fix:**
1. Gear icon in home screen header → Settings screen
2. Sections:
   - **Subscription:** Current plan, manage/cancel (deep-links to App Store subscription management), trial status
   - **Daily Goal:** Adjust 3/5/10 minutes
   - **Notifications:** Toggle daily reminder, set preferred time, toggle streak alert
   - **Appearance:** Light / Dark / System theme toggle
   - **Privacy:** Analytics toggle (from A6)
   - **About:** Version, "Send Feedback" link, "Rate Tila" link
   - **Danger Zone:** Reset All Progress (with confirmation)

**Files:** New `app/settings.tsx`, new `src/components/settings/`

### D4: Dark Mode
**What:** All tokens exist in `tokens.ts`. Every component uses `useColors()`. Just flip the switch.

**Fix:**
1. Replace hardcoded `"light"` in `_layout.tsx` with `useColorScheme()` system detection
2. Manual override stored in user_profile (set via Settings screen D3)
3. Priority: user preference > system > light default
4. Test every screen in dark mode for contrast and visibility issues
5. Verify WarmGlow, WarmGradient, confetti, decorative elements work in dark palette

**Files:** `app/_layout.tsx`, `src/design/theme.ts`, `src/db/schema.ts`

### D5: OTA Updates
**What:** Push JS-level fixes without App Store review.

**Fix:**
1. Install and configure `expo-updates`
2. Add update channels to `eas.json` (preview, production)
3. Check for updates on app launch in `_layout.tsx`
4. Subtle banner "Update available" — applies on next restart. No forced updates.

**Files:** `app.config.ts`, `eas.json`, `app/_layout.tsx`

### D6: Per-Screen Error Boundaries
**What:** One crash anywhere shouldn't take down the whole app. Root Sentry boundary exists but is generic.

**Fix:** Error boundaries around 4 screen groups:
1. **Lesson flow** — crash shows "This lesson had a problem. Tap to go home." Reports to Sentry with lesson context
2. **Onboarding** — crash shows retry
3. **Home** — crash shows "Tap to reload"
4. **Progress** — crash shows empty state with reload

**Files:** New `src/components/shared/ScreenErrorBoundary.tsx`, screen files

### D7: Accessibility Basics
**What:** Font scaling, reduced motion, screen reader hints. Not a full audit — enough for App Store and basic inclusivity.

**Fix:**
1. `maxFontSizeMultiplier={1.5}` on Text components in design system
2. `useReducedMotion()` hook: when enabled, replace spring animations with simple fades, disable confetti and floating letters
3. `accessibilityHint` on interactive elements (HearButton, quiz options, lesson cards)
4. Arabic text: `accessibilityLanguage="ar"` for correct screen reader pronunciation
5. Contrast check on `textMuted` combinations in both light and dark mode

**Files:** `src/design/components/`, `src/design/animations.ts`, new `src/hooks/useReducedMotion.ts`

### D8: Sentry Performance Monitoring
**What:** Currently at 0% sampling — blind to production performance.

**Fix:** Set `tracesSampleRate: 0.1`. Add spans on DB initialization, mastery merge, and question generation.

**Files:** `src/analytics/sentry.ts`

### Phase D Exit Criteria
- [ ] Push notification permission requested after first lesson, daily reminder fires at scheduled time
- [ ] Notification tap deep-links to correct screen (home, review, lesson)
- [ ] Settings screen: subscription status shows correctly, goal adjustable, notifications toggleable, theme switchable
- [ ] Dark mode renders correctly on all screens (spot-checked: home, lesson intro, quiz, summary, progress, onboarding)
- [ ] OTA update check runs on launch, banner shown when update available
- [ ] Screen error boundary: force crash in quiz component, verify friendly error instead of white screen
- [ ] System font size at 1.5x: no layout overflow on quiz options or lesson cards
- [ ] Reduced motion: confetti and floating letters disabled, springs replaced with fades

---

## What Got Cut (and why it's fine)

| Cut | Why |
|-----|-----|
| Achievement badges | Nice delight, zero impact on core loop or conversion |
| Streak freeze system | Complexity before evidence that streaks drive retention |
| Milestone celebration screens | Phase-complete screen already exists |
| Weekly progress summary | Dashboard feature, not habit feature |
| Streak flame animation | Decoration |
| Daily goal progress ring | Text pill works fine |
| Context-aware return welcome | Generic hadith is fine at launch |
| Fast-track detection | Optimization before data exists |
| Response-time weighted mastery | Sophisticated but invisible to user |
| Adaptive SRS by error type | Standard SRS works for launch |
| Interleaved review injection | Complex. Post-lesson prompt (B5) is simpler |
| Marginal pass band | Binary pass/fail is clear enough |
| React.memo sweep | Optimize when you see jank |
| Broad contrast audit | Basic check in D7. Full audit is post-launch |
| Database index sweep | Schema already has indexes on critical columns. Measure first |
| Progressive hint escalation | B4 basic teaching is enough for launch |

---

## Deferred to Future Milestones

### Curriculum Expansion (Next Milestone)
- Phase 5+: Connected reading, word reading, phrase reading, additional marks, Quranic conventions, guided Al-Fatiha reading
- ~200+ new lessons
- New question generators

### Second-Order Retention
- Streak freezes, achievement badges, milestone screens, weekly summaries
- Adaptive difficulty, fast-track/struggling detection
- Interleaved review injection, response-time mastery weighting
- Social features, sharing, peer comparison

### Infrastructure
- Cloud sync / account system
- Multi-user support (family sharing)
- Teacher dashboard
- E2E testing framework
- Internationalization (i18n)

### Advanced Monetization
- Lifetime pricing (after retention data proves value)
- Regional/PPP pricing
- Referral program
- Gift subscriptions

---

## Constraints

- **No architecture changes** — Engine/hook/DB pattern stays
- **No new state management** — No Redux/Zustand beyond EntitlementProvider
- **Offline-first preserved** — All features work without network. Notifications are local. RevenueCat caches entitlements offline
- **60fps on mid-range Android** — All animations use Reanimated
- **Existing design tokens** — Current palette, fonts, spacing. Dark mode uses existing dark tokens
- **Bundle size** — expo-notifications and react-native-purchases are the only major new dependencies
- **RevenueCat requires development build** — IAP does not work in Expo Go. Factor build time into C1-C2 scheduling
