# Tila Master Plan: From Current State to Revenue

**Date:** April 1, 2026
**Source:** Synthesized from two expert reviews (product/UX + engineering code review) + founder input
**Goal:** Take Tila from working prototype to revenue-generating App Store product

---

## Current State

**What exists:**
- 106 lessons with a real mastery engine (spaced repetition, confusion tracking, SRS intervals)
- Working Android preview build (EAS Build)
- Apple Developer Program enrolled (iOS builds possible)
- Design system with genuine taste (dark green, gold, warm cream palette; Amiri/Lora/Inter fonts)
- Analytics wired (PostHog + Sentry, 9 events tracked)
- Monetization decision made (7 free lessons, 7-day trial, $8.99/mo, $49.99/yr)
- RevenueCat SDK integrated (partially — App Store Connect subscription config has issues, being resolved separately)
- UI overhaul ~90% complete
- 54 test files
- Architecture: Screen → Hook → Engine → SQLite (clean separation)

**What's broken or missing:**
- Lesson completion has a stale-state bug (mastery celebrations silently fail)
- Completion writes aren't atomic (crash mid-lesson can corrupt progress)
- RevenueCat initialization can crash the app on bad network (no try/catch)
- Audio failures swallowed silently (playSFX has no error handling)
- 18 core engine files are untyped JavaScript (`src/engine/*.js`)
- Expo scaffold leftovers still in repo (SpaceMono, EditScreenInfo, useClientOnlyValue, constants/Colors.ts)
- Upgrade/upsell cards are visually bland (most important conversion surfaces, least design love)
- No cloud sync, no accounts, no social features
- No user name or personalization on home screen
- Crescent emoji (☽) used alongside custom SVG work
- No dark mode (tokens exist but forced off)

---

## Block 1: Make It Not Crash

*Ship-blocking fixes. These prevent 1-star reviews, data corruption, and silent failures.*

### 1.1 — Fix Lesson Completion Atomicity
- **Problem:** Lesson completion is a sequence of separate DB writes. A failure partway through leaves partially written progress, mastery, or review data.
- **Fix:** Wrap all completion writes in a single `db.withExclusiveTransactionAsync()` call. The transaction returns fresh post-write state that the UI can use directly.
- **Impact:** Prevents data corruption in the core user flow.

### 1.2 — Fix Mastery Celebration Stale State
- **Problem:** After lesson completion, the UI reads mastery state from a stale hook closure instead of fresh post-write data. Mastery celebrations silently don't appear.
- **Fix:** Use the fresh mastery data returned from the completion transaction (1.1) instead of re-reading from the hook. This task depends on 1.1 being complete.
- **Impact:** Users actually see their achievements. Trust in the app.

### 1.3 — Guard RevenueCat Initialization
- **Problem:** `Purchases.configure()` in `src/monetization/revenuecat.ts` has no try/catch. App crashes on spotty network or cold-start race.
- **Fix:** Wrap in try/catch, default to free tier on failure. Log to Sentry.
- **Impact:** App loads for every user, every time.

### 1.4 — Guard All Audio Calls
- **Problem:** `playSFX` is synchronous with no error handling. `expo-audio` can throw on session conflicts or corrupted assets. Audio breaks silently on Android.
- **Fix:** Wrap all `player.play()` and `player.replace()` calls in try/catch. Report failures to Sentry.
- **Impact:** Audio failures are caught instead of silently degrading the experience.

### 1.5 — Remove Expo Scaffold Leftovers
- **Problem:** Template files from Expo's default scaffold are still in the repo: `SpaceMono-Regular.ttf`, `EditScreenInfo.tsx`, `useClientOnlyValue.ts`, `constants/Colors.ts` (with default `#2f95dc` tint).
- **Fix:** Delete all four files. Verify no imports reference them.
- **Impact:** Clean repo. No template code in a shipping product.

### 1.6 — Replace Crescent Emoji with SVG Icon
- **Problem:** Unicode ☽ emoji appears in ReviewCard and ReturnWelcomeScreen alongside custom SVG logo work. Visible inconsistency.
- **Fix:** Create a small crescent SVG icon consistent with the TilaLogoMark style. Replace all emoji usage.
- **Impact:** Design consistency across the app.

### Block 1 Sequence
1.1 → 1.2 (stale state fix depends on atomic completion)
1.3, 1.4, 1.5, 1.6 are independent — can be done in parallel or any order.

---

## Block 2: Make It Convert

*Revenue-blocking work. These determine whether a free user becomes a paying user.*

### 2.1 — Add Name Input to Onboarding
- **Problem:** The app has no concept of the user's name. Personalization (2.4) and the paywall (2.7) both benefit from knowing who the user is.
- **Fix:** Add an optional name field to the onboarding flow. Store in the user profile alongside the existing motivation field. Keep it optional — don't add friction.
- **Impact:** Unlocks personalization across the app.

### 2.2 — Explain 'Wird' on First Encounter
- **Problem:** The wird (daily habit) concept appears throughout the app with no explanation. Target audience includes brand-new converts who may have never heard the word.
- **Fix:** One-time tooltip or brief explanation when the streak badge first appears. Frame it as an educational moment: "In Islamic tradition, a wird is a daily practice — a small, consistent effort. Your learning wird builds day by day."
- **Impact:** Removes friction for the exact users the app is built for.

### 2.3 — Communicate Value Before the Paywall
- **Problem:** Users hit the paywall after lesson 7 without understanding what makes this app worth paying for vs. free alternatives.
- **The SRS honesty problem:** Spaced repetition doesn't fully demonstrate its value in 7 lessons. The cycle of forgetting something and being reminded at exactly the right moment takes longer than that. This means users are being asked to pay for a benefit they haven't fully experienced yet. The plan addresses this two ways:
  1. **Preview the intelligence during lessons 1–7:** After lessons, show brief insights — "Tila noticed you confused Ba and Ta — we'll review that at the perfect time." This doesn't replicate the felt experience of SRS, but it shows the engine is paying attention in a way YouTube never will.
  2. **The free tier already enables SRS on free letters:** Users can review their 7 free lessons forever, including micro-review sessions. Verified in code: `usePremiumReviewRights()` includes all letters from lessons ≤ `FREE_LESSON_CUTOFF` (7), and the review screen filters the SRS payload to only those letters for free users. The engine itself has no subscription checks — gating happens at the UI layer. A user who returns days later and gets a perfectly-timed review of Alif vs. Ba WILL experience SRS working. The paywall copy should acknowledge this: "You've seen how Tila remembers what you forget. Unlock the full journey."
- **What this doesn't solve:** If users complete 7 lessons and never return to review, they'll hit the paywall without experiencing SRS at all. This is a real gap. If conversion data shows this is happening, the response is either extending the trial period or restructuring the free tier — but that's a data-informed decision, not a launch-blocking one.
- **Impact:** When the paywall appears, users have at least seen the engine's intelligence, even if they haven't felt the full SRS cycle.

### 2.4 — Personalize the Home Screen
- **Depends on:** 2.1 (name input)
- **Problem:** Greeting is hardcoded "ASSALAMU ALAIKUM" with no user name. Motivation collected during onboarding (read_quran, pray_confidently, teach_children) is unused.
- **Fix:** Use name and motivation to personalize: "Assalamu Alaikum, Amira — you're building toward confident salah." Fall back to generic greeting if no name was provided.
- **Impact:** Personal connection. The app knows who you are and why you're here.

### 2.5 — Surface the Mastery Engine to Users
- **Problem:** The mastery engine (confusion tracking, spaced repetition, personalized review scheduling) is legitimately sophisticated but almost entirely invisible to users.
- **Fix:** Show users what the engine knows — which letters confuse them, how their accuracy has improved, when their next review is scheduled. Progress screen enhancements and post-lesson insights, not a separate dashboard.
- **Impact:** This is the answer to "why pay?" No free alternative provides personalized spaced repetition with confusion tracking.

### 2.6 — Redesign Upgrade/Upsell Cards
- **Problem:** The upgrade card, trial badge, and expired card are functional but visually bland. They don't match the design language of the rest of the app.
- **Fix:** Redesign using the existing design system (tokens, fonts, colors, shadows). These are the highest-stakes screens in the product from a revenue perspective — they should feel as premium as the onboarding.
- **Impact:** Direct impact on conversion rate.

### 2.7 — Complete Paywall Flow
- **Depends on:** 2.6 (upsell card redesign must be done first — the paywall uses these cards)
- **Problem:** Paywall decision is made but the full UX flow needs to be polished.
- **Paywall trigger:** After completing lesson 7 (Ba/Ta/Tha family summary — the user has proven they can distinguish these letters). Also shown when a free user taps any lesson 8+.
- **Flow:** Mini-celebration for completing lesson 7 → transition to trial offer → annual-first pricing layout → scholarship option.
- **Pricing layout:** Annual plan ($49.99/yr, ~$4.17/mo, 53% savings) preselected and visually primary. Monthly ($8.99/mo) visible but secondary.
- **Post-expiry behavior:** Users can still review premium letters learned during trial/subscription. Cannot start new lessons 8+.
- **Trial:** 7-day full access configured as introductory offer in App Store Connect / Google Play Console. Actual store billing flow — not an app-side toggle.
- **Scholarship program:** Apple Offer Codes (not legacy promo codes — deprecated March 2026). Prominently displayed on the paywall with clear language: "Financial hardship should never prevent Quran learning. Tap here to request a scholarship." Links to a simple form (email or Google Form) where users provide their name and a brief note. No income verification — trust-based, manually reviewed by founder. Codes grant 3-month or 6-month full access. Fulfillment is manual via email until volume justifies automation.
- **Impact:** Revenue starts flowing.

### 2.8 — App Store Submission
- **Depends on:** All of Block 2 (2.1–2.7) complete. RevenueCat / App Store Connect subscription config resolved (separate workstream).
- **Problem:** The plan's goal is "revenue-generating App Store product" but has no explicit task for the submission itself.
- **Scope:**
  - **Screenshots:** 6.7" (iPhone 15 Pro Max) and 5.5" (iPhone 8 Plus) sizes minimum for iOS. Phone-framed screenshots of onboarding, lesson, quiz, progress, and home screens.
  - **App Store metadata:** Title, subtitle (30 chars), description, keywords, category (Education), age rating (4+).
  - **Privacy manifest:** Required by Apple since Spring 2024. Declare data collection (PostHog analytics, Sentry crash reports). No user accounts at this stage means minimal privacy scope — this changes when Block 3 adds auth.
  - **Google Play listing:** Feature graphic (1024x500), short description (80 chars), full description, content rating questionnaire.
  - **Review notes for Apple:** Explain the subscription model, provide a demo account or explain the free tier so reviewers can test.
  - **Production build profiles:** Verify `eas.json` production profile, increment version/build numbers, test production build on real devices before submitting.
- **Support contact:** Add a visible support email/link in app settings. Required both for App Store guidelines and for the early adopter data-loss mitigation policy (see Key Decisions, cloud sync row).
- **Common rejection risks:** Missing privacy manifest, subscription metadata not matching App Store Connect config, missing restore purchases button, no way for reviewer to test premium features.
- **Impact:** The app is in the store. Revenue is possible.

### Block 2 Sequence
```
2.1 (name input) ──→ 2.4 (personalize home)
2.2 (wird explanation) — independent
2.3 (value communication) — independent
2.5 (surface mastery engine) — independent
2.6 (redesign upsell cards) ──→ 2.7 (paywall flow)
2.8 (App Store submission) — after ALL of 2.1–2.7
```
2.2, 2.3, 2.5 can be done in parallel with the 2.1→2.4 and 2.6→2.7 chains.

---

## Block 3: Make It Retain

*Retention and growth. Prevents churn after launch and builds the foundation for scaling. This is the first major update after App Store launch.*

### 3.1 — Migrate Engine to TypeScript
- **Problem:** 18 .js files in `src/engine/` (mastery.js, engagement.js, selectors.js, dateUtils.js, all question generators). `any` type leaks from here into every hook and component. The brain of the app has no type safety.
- **Files:** dateUtils.js, engagement.js, features.js, mastery.js, outcome.js, selectors.js, unlock.js, plus 11 files in `src/engine/questions/`.
- **Fix:** Convert all to .ts with proper type annotations. Mechanical work — AI handles this well.
- **Impact:** Structural safety for the core learning algorithm. Catches bugs at compile time.

### 3.2 — Shared State Layer + Cloud Sync (Plan Together, Build Together)
- **Why these are combined:** The shared state layer (refactoring from isolated hook refreshes to canonical shared state) and cloud sync (adding a backend, auth, and sync logic) both reshape how the app manages state. Designing the state layer without anticipating cloud sync means designing it twice. These must be planned as one architectural unit, even if they're built in phases.
- **Problem (state):** Progress and habit data are loaded through local-state hooks that refresh independently. Multiple screens instantiate their own view of state. No single source of truth — several DB-backed views refreshed manually. Risk of stale reads grows with every new feature.
- **Problem (sync):** No cloud sync means a phone upgrade, reinstall, or factory reset wipes all progress. For a learning app where progress IS the product, this is catastrophic. The loneliest users churn fastest — no social connection to anyone else's learning journey.
- **Scope:**
  - **State layer:** One shared state provider for progress, habit, and subscription. Screens subscribe to canonical state instead of refreshing isolated snapshots. Designed from day one to have a "local" and "remote" source that merge.
  - **Auth:** User accounts — email/password and/or social auth (Apple Sign In, Google Sign In). Anonymous-to-authenticated upgrade path for existing users who have local progress.
  - **Backend:** Cloud database (likely Supabase — provides auth, Postgres, realtime, and row-level security out of the box). Self-hosted is unnecessary at this scale.
  - **Sync logic:** Local SQLite remains the source of truth. Cloud syncs when connected. Conflict resolution strategy: last-write-wins on progress, merge on mastery (never lose a mastery gain).
  - **History:** What you've completed, when, accuracy trends over time. Visible in the progress screen.
  - **Social:** Friend connections (add by username or link). See friends' streaks, current phase, milestones. The tone should be supportive ("Amira completed Phase 2 this week"), not competitive.
  - **Offline-first guarantee:** The app must work identically with no network. Sync happens in the background when connectivity returns.
  - **Privacy manifest update:** Adding auth and cloud sync changes the app's data collection profile. Update the Apple privacy manifest and App Store privacy labels to declare account data, authentication tokens, and cloud-synced learning data.
- **This is the largest piece of work in the entire plan.** It needs its own detailed design and planning phase before any code is written. The planning should produce: data model, sync protocol, auth flow, migration path for existing local-only users, and API surface.

### 3.3 — Adaptive Return Welcome Screen
- **Problem:** The return welcome screen fires identically whether you've been away 1 day or 30 days. `days_since_last_practice` is tracked in analytics but not used in UI.
- **Fix:** Different experiences based on absence length:
  - **1 day:** Brief "Welcome back" — minimal friction, get them into a lesson.
  - **3–7 days:** Gentle re-engagement: "You were on a 5-day wird. Pick up where you left off."
  - **14+ days:** Full re-engagement arc: "It's been a while. Let's start with a quick review of what you've learned." Offer a short review session before resuming new material.
- **Impact:** Streak breaks are emotionally expensive. Help users recommit instead of just showing a generic hadith.

### 3.4 — High-Value Integration Tests
- **Problem:** 54 test files exist but some validate structure rather than behavior. Critical user flows lack end-to-end validation.
- **Fix:** Add integration-style tests for: onboarding → lesson 1 → completion → progress update. Premium locking. Restore purchases. Review generation. Mastery state transitions.
- **Impact:** Regression protection for the flows that matter most.

### 3.5 — Dark Mode
- **Problem:** Tokens exist in `tokens.ts` but dark mode is forced off. Users on Android with system dark mode get a bright white app. An app encouraging nighttime Quran reading should not blast users with white light.
- **Fix:** Activate existing dark mode tokens. Wire up system preference detection. Test all screens in both modes.
- **Impact:** Better nighttime reading experience. Expected feature for modern apps.

### Block 3 Sequence
```
3.1 (TS migration) — do first, makes all subsequent work type-safe
3.2 (state layer + cloud sync) — largest effort, start planning immediately after 3.1
3.3 (adaptive return) — independent, can parallel with early cloud sync work
3.4 (integration tests) — best done after state layer refactor so tests cover the new architecture
3.5 (dark mode) — independent, can slot in anywhere
```

---

## Key Decisions

| Decision | Status | Detail |
|----------|--------|--------|
| Paywall location | **Confirmed: after completing lesson 7** | Lessons 1–7 are free (Alif + Ba/Ta/Tha family). Paywall triggers after the user completes lesson 7 (Ba/Ta/Tha family summary). Also shown when a free user taps lesson 8+. |
| Cloud sync | **Required, Block 3** | Cloud sync with accounts, history, and friend comparison is on the critical path. It is not post-launch optional — it is the first major feature after App Store submission. The app launches in the store during Block 2, and cloud sync ships as an update during Block 3. Between launch and sync shipping, paying users who lose data get a free subscription extension (minimum 3 months) + guided restart — policy documented in support materials before 2.8 ships. |
| RevenueCat store config | **Separate workstream** | Founder resolving App Store Connect subscription configuration issues. Engineering builds paywall UI and code independently. Must be resolved before 2.8 (App Store submission). |
| No new state management library | **Confirmed** | Shared state layer uses React Context + SQLite, not Zustand/Redux. Keep the stack simple. |
| Engine stays the same algorithmically | **Confirmed** | TypeScript migration is a type-safety pass, not a redesign of learning logic. |
| State layer + cloud sync planned together | **Confirmed** | Designing the shared state layer without anticipating sync means designing it twice. These are one architectural unit. |

---

## What This Plan Does NOT Cover

- **E2E testing (Detox/Maestro)** — valuable but separate milestone
- **Push notifications** — future milestone, natural fit after cloud sync + accounts
- **CI/CD pipeline (GitHub Actions)** — valuable but not blocking App Store submission
- **Internationalization** — future consideration
- **iPad / tablet layout** — future consideration
- **Content expansion (more lessons)** — curriculum exists (106 lessons), this plan is about infrastructure
- **Web app** — the React/Vite webapp is being sunset; this plan is mobile-only
