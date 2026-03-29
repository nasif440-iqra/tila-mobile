# Tila Post-UI Roadmap: Foundation + Engagement + Learning Quality

**Date:** 2026-03-29
**Status:** Approved
**Scope:** Everything needed to go from "beautiful UI" to "ship-ready retention machine with smart learning"
**Deferred:** Curriculum expansion (Phase 5+ lessons, words, phrases, Al-Fatiha) — future milestone

---

## Context

The UI overhaul milestone is ~90% complete. The app has 106 lessons across 4 phases (letter recognition, sounds, harakat, connected forms), a sophisticated mastery engine with spaced repetition, and a polished visual experience with animations, haptics, and warm Islamic aesthetics.

What's missing: the app has bugs that can corrupt learning data, API keys hardcoded in source, no way to bring users back (no notifications, no goal tracking, broken streaks), no intelligence in how it handles mistakes, and no accessibility support.

This roadmap transforms Tila from a beautiful prototype into a production app that people open every day and actually learn from.

---

## Architecture: Three Parallel Tracks

| Track | Purpose | Phases |
|-------|---------|--------|
| **Foundation** | Make it safe and stable | F1, F2, F3, F4 |
| **Engagement** | Make users come back | E1, E2, E3, E4 |
| **Learning Quality** | Make users learn better | L1, L2, L3, L4 |

### Execution Waves

```
Wave 1 (no dependencies):     F1 + F2 + E1
Wave 2 (after Wave 1):        F3 + L1 + E2
Wave 3 (after Wave 2):        E3 + L2 + F4
Wave 4 (after Wave 3):        L3 + E4 + L4
```

### Dependency Map

```
F1 ──→ F3 ──→ E3 ──→ E4
F2 ──↗       ↗
E1 ──→ E2 ──→ L3
       ↘
L1 ──→ L2 ──→ L3
              ↘
        F4    L4 (audits final state)
```

### Key Dependencies
- Push notifications (E3) requires deep linking (F3) — tapping a notification opens a screen
- Wrong-answer explanations (L1) requires confusion persistence (F1) — can't explain what isn't saved
- Adaptive difficulty (L2) requires accurate mastery data (F1) — adapting on bad data is worse than not adapting
- Dark mode & accessibility (L4) goes last — audit final UI once, not mid-change
- Home screen polish (E4) goes last in its track — integration point for goals, streaks, reviews, progress

### Parallel Execution Within Waves
All phases within a wave are independent and can run simultaneously:
- Wave 1: F1 (engine/DB), F2 (analytics/config), E1 (home screen/hooks) — no file conflicts
- Wave 2: F3 (infrastructure), L1 (quiz feedback), E2 (streak system) — different domains
- Wave 3: E3 (notifications), L2 (engine logic), F4 (database) — no overlap
- Wave 4: L3 (review system), E4 (home screen), L4 (accessibility) — L4 goes last within wave

---

## Track 1: Foundation — Make It Safe and Stable

### Phase F1: Critical Data Bugs

**Goal:** Fix bugs that silently corrupt learning data or produce broken quizzes.

#### F1.1: Mastery Save Race Condition
**Problem:** In `useProgress.ts`, `completeLesson()` calls `refresh()` to load fresh progress, then merges quiz results against potentially-stale `state`. If mastery data changes between the refresh and the merge, the merge overwrites newer data.

**Fix:** Change the pipeline to: load fresh state → merge quiz results into fresh state → save merged state → reload once. Single atomic flow, no window for stale reads.

**Files:** `src/hooks/useProgress.ts`
**Verification:** Write a test that simulates concurrent mastery updates and confirms no data loss.

#### F1.2: Checkpoint Phase 2+ Classifier Bug
**Problem:** In `checkpoint.js`, `classifyLetters()` accesses `progress?.[id]` expecting a flat numeric-keyed object. Real mastery data uses entity keys like `"letter:5"`. Phase 2+ checkpoint quizzes silently produce garbage questions because every letter classifies as "unseen."

**Fix:** Adapt `classifyLetters()` to work with entity key format. Parse `"letter:X"` keys to extract numeric IDs, or accept both formats.

**Files:** `src/engine/questions/checkpoint.js`
**Verification:** Generate Phase 2 checkpoint questions with real mastery data. Confirm struggled/unseen/strong classification matches actual user state.

#### F1.3: Confusion Categories Not Persisted
**Problem:** When a user confuses Ba with Ta, `mastery.js` computes the error category (visual_confusion, sound_confusion, vowel_confusion) but `progress.ts` only saves confusion_key, count, and last_seen. Categories are lost on app restart.

**Fix:**
1. Add `categories TEXT` column to `mastery_confusions` table (JSON-encoded histogram)
2. Update `saveConfusion()` to serialize categories
3. Update `loadProgress()` to deserialize categories
4. Schema migration v2 → v3

**Files:** `src/db/schema.ts`, `src/db/client.ts`, `src/engine/progress.ts`
**Verification:** Record a confusion, restart app, confirm categories are restored.

#### F1.4: Empty Harakat Quiz Fallback
**Problem:** If `generateHarakatCombos()` returns empty (e.g., `lesson.teachCombos` undefined and combo generation fails), the lesson produces 0 questions and silently "completes" with 100% accuracy.

**Fix:** Add a minimum question count check in `useLessonQuiz.ts`. If question generation returns empty, show an error state instead of auto-completing. Add fallback combo generation using the lesson's `teachIds`.

**Files:** `src/engine/questions/harakat.js`, `src/hooks/useLessonQuiz.ts`
**Verification:** Force empty combo generation, confirm error state shown instead of silent completion.

---

### Phase F2: Security & Privacy

**Goal:** Remove hardcoded secrets, add analytics consent, prepare for App Store review.

#### F2.1: Environment Variables
**Problem:** PostHog API key, Sentry DSN, and EAS project ID are hardcoded in source files committed to git.

**Fix:**
1. Create `.env` and `.env.production` files with `EXPO_PUBLIC_` prefixed variables
2. Update `posthog.ts`, `sentry.ts`, and `app.config.ts` to read from `process.env`
3. Add `.env*` to `.gitignore`
4. Set production values as EAS secrets
5. Rotate the exposed PostHog key (create new key, invalidate old one)

**Files:** `src/analytics/posthog.ts`, `src/analytics/sentry.ts`, `app.config.ts`, `.gitignore`
**Note:** PostHog and Sentry keys are technically "public" (client-side), but exposing them in git repos invites abuse (fake event injection). Environment variables are the standard practice.

#### F2.2: Analytics Consent
**Problem:** The app sends analytics events from first launch with no user consent. Required for GDPR (Europe) and App Store guidelines.

**Fix:**
1. Add `analyticsConsent: boolean | null` to user_profile table (null = not yet asked)
2. On first launch after onboarding, show a simple modal: "Help improve Tila by sharing anonymous usage data? This helps us make the app better for everyone." with Accept/Decline buttons
3. If declined: disable PostHog tracking, keep Sentry crash reporting (legitimate interest exemption)
4. Store choice in user_profile. Provide toggle in future Settings screen (Phase L4)
5. Respect choice on every app launch — check before initializing PostHog

**Files:** `src/analytics/index.ts`, `src/analytics/posthog.ts`, `src/db/schema.ts`, new consent modal component
**Note:** Sentry crash reporting can stay on under "legitimate interest" — it's for app stability, not behavioral tracking.

#### F2.3: Sentry Performance Monitoring
**Problem:** `tracesSampleRate` is set to 0, meaning zero performance data collected. You're blind to slow screens, long database queries, and janky animations in production.

**Fix:** Set `tracesSampleRate: 0.1` (10% of sessions sampled). This gives meaningful data without excessive volume. Add Sentry performance spans around: database initialization, lesson question generation, mastery merge pipeline.

**Files:** `src/analytics/sentry.ts`, `src/hooks/useProgress.ts`, `src/db/client.ts`

---

### Phase F3: App Infrastructure

**Goal:** Enable instant bug fixes, prevent white-screen crashes, support deep linking for notifications.

#### F3.1: Over-the-Air Updates
**Problem:** Every fix requires full App Store resubmission (1-7 day review for iOS). JS-only changes can be pushed instantly via OTA.

**Fix:**
1. Install and configure `expo-updates`
2. Add update channel configuration to `eas.json` (preview + production channels)
3. Add update check on app launch in `_layout.tsx` — if update available, apply on next restart
4. No forced updates — user sees a subtle banner "Update available" that applies on next launch

**Files:** `app.config.ts`, `eas.json`, `app/_layout.tsx`, new `src/lib/updates.ts`
**Constraint:** OTA only works for JS/asset changes. Native module changes still require store submission.

#### F3.2: Per-Screen Error Boundaries
**Problem:** One crash anywhere takes down the entire app. The root Sentry boundary catches it, but the user sees a generic "Something went wrong" for the whole app.

**Fix:** Add error boundaries around 4 critical screen groups:
1. **Lesson flow** (intro + quiz + summary) — crash shows "This lesson had a problem. Tap to go home." with Sentry report
2. **Onboarding flow** — crash shows retry option
3. **Home screen** — crash shows minimal "Tap to reload" state
4. **Progress screen** — crash shows empty state with reload option

Each boundary reports to Sentry with screen context (which lesson, which step, what data was loaded).

**Files:** New `src/components/shared/ScreenErrorBoundary.tsx`, updates to `app/lesson/[id].tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/progress.tsx`, `src/components/onboarding/OnboardingFlow.tsx`

#### F3.3: Deep Linking
**Problem:** Can't link directly to a lesson or screen. Needed for push notifications (E3) and sharing.

**Fix:**
1. Configure Expo Router linking with `tila://` scheme (already defined in app.config.ts but not wired)
2. Register route mappings: `tila://lesson/{id}`, `tila://home`, `tila://progress`, `tila://review`
3. Add link handling in `_layout.tsx` — parse incoming URL, navigate to correct screen
4. Handle invalid/expired links gracefully (lesson doesn't exist → redirect to home)

**Files:** `app/_layout.tsx`, Expo Router linking configuration
**Note:** Universal links (https://tila.app/lesson/5) are a future enhancement requiring a web domain. Start with custom scheme only.

#### F3.4: Database Initialization Recovery
**Problem:** If database initialization hangs or fails, the app shows a loading spinner forever with no way out.

**Fix:**
1. Add 10-second timeout to database initialization
2. On timeout: show error screen with "Tap to retry" and "Reset database" options
3. On initialization error: show specific error message, report to Sentry
4. Add integrity check on startup: verify all expected tables exist with expected column count

**Files:** `src/db/client.ts`, `src/db/provider.tsx`

---

### Phase F4: Performance & Data Integrity

**Goal:** Prevent slowdowns as user data grows. Batch operations, add indexes, reduce unnecessary work.

#### F4.1: Batch Mastery Saves
**Problem:** After a 15-question quiz, `useProgress.ts` makes ~45 individual database writes (one per entity, skill, and confusion update). Each is a separate round-trip.

**Fix:** Create `saveMasteryBatch(entities[], skills[], confusions[])` that wraps all writes in a single SQLite transaction. One round-trip instead of 45.

**Files:** `src/engine/progress.ts`, `src/hooks/useProgress.ts`
**Verification:** Time a quiz completion before/after. Expect 5-10x speedup on mastery save step.

#### F4.2: Database Indexes
**Problem:** No explicit indexes on frequently-queried columns. As data grows past 500+ rows, queries slow down.

**Fix:** Add indexes:
- `mastery_entities(entity_key)` — primary lookup path
- `mastery_confusions(confusion_key)` — confusion queries
- `lesson_attempts(lesson_id)` — lesson history queries
- `question_attempts(attempt_id)` — question detail queries
- `lesson_attempts(attempted_at)` — date-range queries

Add as schema migration v3 → v4 (or combine with F1.3 migration).

**Files:** `src/db/schema.ts`, `src/db/client.ts`

#### F4.3: Component Memoization
**Problem:** Design system components (Button, Card, ArabicText, HearButton) re-render on every parent update even when their props haven't changed.

**Fix:** Wrap exported components in `React.memo()`. This is a mechanical change — no logic modifications.

**Files:** `src/design/components/Button.tsx`, `Card.tsx`, `ArabicText.tsx`, `HearButton.tsx`, `QuizOption.tsx`
**Caution:** Only memoize components that receive stable props. Components with inline callback props need `useCallback` in parents first.

#### F4.4: Pre-compute Known Letter IDs
**Problem:** `getKnownIds()` in `shared.js` iterates the entire LESSONS array on every call to find letters taught before the current lesson. Called multiple times per question generation.

**Fix:** Pre-compute a lookup table at module load: `KNOWN_IDS_BY_LESSON[lessonId] = Set<number>`. One-time computation, O(1) lookups thereafter.

**Files:** `src/engine/questions/shared.js`

---

## Track 2: Engagement — Make Users Come Back

### Phase E1: Wire Up Daily Goals

**Goal:** Connect the daily goal data (already collected in onboarding) to the home screen experience.

#### E1.1: Goal-Aware Home Screen
**Problem:** The "Today: 0/1" pill on the home screen is hardcoded to 1 lesson. The user chose 3, 5, or 10 minutes during post-lesson onboarding, but that choice is never used.

**Fix:**
1. Load `dailyGoal` from user_profile via `useProgress()`
2. Convert minutes to lesson count: 3 min = 1 lesson, 5 min = 2 lessons, 10 min = 3 lessons (based on ~3 min average lesson duration)
3. Replace hardcoded `DAILY_GOAL = 1` with user's actual goal
4. Update pill to show progress: "Today: 1/2" with filled/unfilled indicator
5. Default to 1 lesson if no goal set (onboarding skipped or pre-existing users)

**Files:** `app/(tabs)/index.tsx`, `src/hooks/useProgress.ts`

#### E1.2: Goal Completion Celebration
**Problem:** When user hits their daily goal, nothing happens. This should be the most rewarding moment in the daily loop.

**Fix:**
1. After quiz completion, check if `todayLessonCount >= dailyGoal`
2. If goal just reached (was below, now at or above): trigger celebration
3. Celebration: confetti burst (reuse lesson summary confetti), haptic milestone, banner: "You hit your goal today!" with Islamic encouragement (rotate: "MashaAllah", "Alhamdulillah", "Consistent effort pleases Allah")
4. Banner appears on home screen for remainder of session
5. Track `goalHitToday` in habit state to prevent re-triggering

**Files:** `app/lesson/[id].tsx` (post-quiz check), `app/(tabs)/index.tsx` (banner display), `src/engine/habit.ts` (goal tracking)

#### E1.3: Goal Adjustment
**Problem:** Daily goal is set once during post-lesson onboarding and locked forever.

**Fix:**
1. Add goal adjustment to future Settings screen (Phase L4). For now, add a subtle "Edit" button next to the daily goal pill on home screen
2. Tapping opens a bottom sheet with the same 3 options (3 min, 5 min, 10 min)
3. Save new choice to user_profile
4. Haptic confirmation on save

**Files:** `app/(tabs)/index.tsx`, new `src/components/home/GoalAdjustSheet.tsx`

#### E1.4: Fix Motivation Mapping
**Problem:** All 5 motivation choices during post-lesson onboarding save as `"quran"` regardless of selection. The data is useless.

**Fix:**
1. Map each motivation option to its actual value: `"read_quran"`, `"pray_confidently"`, `"connect_heritage"`, `"teach_children"`, `"personal_growth"`
2. Save the real value to user_profile
3. Use in engagement copy later (E4): "You're one step closer to reading the Quran confidently" vs. "You're building a bridge to your heritage"

**Files:** `app/post-lesson-onboard.tsx`

---

### Phase E2: Streak Protection & Milestones

**Goal:** Make streaks forgiving and milestones meaningful. Prevent the "I missed one day, my 30-day streak is gone, I quit" scenario.

#### E2.1: Streak Freeze System
**Fix:**
1. Add `freezes_available: INTEGER DEFAULT 0` and `freeze_used_dates: TEXT` (JSON array) to habit table
2. Earn 1 freeze per 7 consecutive days (max 2 banked)
3. When streak would break (gap > 1 day): check if freeze available, auto-apply, decrement count
4. Home screen shows freeze status: snowflake icon with count next to streak badge
5. When freeze used: show subtle notification on next launch: "Your streak freeze saved your X-day streak yesterday"
6. Schema migration to add columns

**Files:** `src/engine/habit.ts`, `src/hooks/useHabit.ts`, `src/db/schema.ts`, `app/(tabs)/index.tsx`

#### E2.2: Milestone Celebrations
**Fix:**
1. Define milestones: 7 days, 30 days, 100 days, 365 days, plus: "First lesson," "Phase 1 complete," "All letters learned," "100 letters reviewed"
2. Each milestone has: title, subtitle, Islamic encouragement, unique visual treatment
3. Milestone screen (similar to phase-complete): full-screen celebration, haptic milestone, ambient glow
4. Detect milestones in `useHabit()` and `useProgress()` — compare before/after state
5. Queue milestones (user could hit "30 days" and "Phase 2 complete" on same session)
6. Track shown milestones in DB to prevent re-showing

**Files:** New `src/engine/milestones.ts`, new `app/milestone.tsx`, `src/hooks/useHabit.ts`, `src/db/schema.ts`

#### E2.3: Streak Recovery
**Problem:** When a streak breaks (no freeze available), the return-welcome screen shows a generic hadith. Should acknowledge the broken streak compassionately.

**Fix:**
1. Track `longestStreak` in habit table (never decreases)
2. When streak resets: return-welcome becomes context-aware
   - "Your 15-day streak ended, but your longest streak of 23 days is forever yours"
   - "Every return is a fresh start. The Prophet (peace be upon him) said the most beloved deeds are the most consistent, even if small"
3. Show "Start a new streak" CTA instead of generic "Continue"
4. Never show a "0 day streak" — show "Start your streak" instead

**Files:** `src/engine/habit.ts`, `app/return-welcome.tsx`

#### E2.4: Achievement Badges
**Fix:**
1. Define badge types: streak milestones, phase completions, mastery counts, review consistency
2. Add `achievements` table: `badge_id TEXT, earned_at TEXT, seen BOOLEAN`
3. Badges displayed on progress screen in a horizontal scrollable row
4. New badge earned: gold shimmer animation on badge, haptic notification
5. Unseen badges show a dot indicator on the Progress tab

**Files:** New `src/engine/achievements.ts`, `src/db/schema.ts`, `app/(tabs)/progress.tsx`, new `src/components/progress/AchievementRow.tsx`

---

### Phase E3: Push Notifications

**Goal:** Gently bring users back. No spam — every notification has a purpose and respects boundaries.

#### E3.1: Permission & Scheduling Infrastructure
**Fix:**
1. Install `expo-notifications`
2. Request permission after first lesson completion (not first launch — earn trust)
3. Permission prompt: custom UI explaining value before system dialog: "Get gentle daily reminders to keep your streak alive"
4. If declined: respect it. Show permission prompt again only once more, 7 days later
5. Store permission state and notification preferences in user_profile

**Files:** New `src/notifications/index.ts`, `src/notifications/scheduler.ts`, `app/lesson/[id].tsx` (trigger permission after first lesson)

#### E3.2: Daily Practice Reminder
**Fix:**
1. Schedule local notification at user's preferred time (default: 8:00 PM, adjustable in settings)
2. Content rotates from pool of 10+ messages:
   - "Your wird is waiting. Keep your X-day streak alive"
   - "A few minutes with your letters today?"
   - "Small steps, big rewards. Open Tila for today's practice"
3. Notification deep-links to `tila://home`
4. Cancel today's reminder if user already practiced (check on app foreground)
5. Smart quiet hours: no notifications before 8 AM or after 10 PM

**Files:** `src/notifications/scheduler.ts`, `src/notifications/messages.ts`

#### E3.3: Streak at Risk
**Fix:**
1. If user hasn't practiced and it's 2 hours before midnight: fire urgent notification
2. "Your X-day streak resets at midnight. A quick lesson takes 3 minutes"
3. Only fires if no streak freeze available
4. Deep-links to `tila://home`
5. Max 1 per day (don't stack with daily reminder)

**Files:** `src/notifications/scheduler.ts`

#### E3.4: Milestone & Review Notifications
**Fix:**
1. After milestone earned (calculated on next app open): show notification if app was closed
2. "You've been learning for 30 days straight. MashaAllah"
3. Weekly review notification (Saturday mornings): "X letters are ready for review. A quick session keeps them fresh"
4. Review notification only fires if there are actually due letters
5. Deep-links to `tila://review`

**Files:** `src/notifications/scheduler.ts`

---

### Phase E4: Home Screen Engagement Polish

**Goal:** Make the home screen a dashboard that creates momentum and makes progress feel tangible.

#### E4.1: Daily Goal Progress Ring
**Fix:** Replace the text "Today: 0/1" pill with a circular progress ring.
- Ring fills clockwise as lessons complete
- Empty: subtle border color. Partial: accent gold fill. Complete: full gold with checkmark
- Animated fill on lesson completion (spring animation)
- Tap to adjust goal (opens GoalAdjustSheet from E1.3)

**Files:** `app/(tabs)/index.tsx`, new `src/components/home/GoalRing.tsx`

#### E4.2: Streak Flame Animation
**Fix:** The wird streak badge gets a warm animated element that scales with streak length.
- 1-6 days: small warm ember (subtle pulse)
- 7-29 days: steady flame (gentle sway animation)
- 30-99 days: bright fire (more pronounced animation)
- 100+ days: golden blaze (premium visual treatment)
- Use Reanimated for 60fps. Keep it subtle — enhancement, not distraction

**Files:** `app/(tabs)/index.tsx`, new `src/components/home/StreakFlame.tsx`

#### E4.3: Smart Review Nudge Card
**Fix:** When letters are due for review, show a card between hero card and lesson grid.
- "5 letters need a quick refresh" with accent border
- Visual urgency scales: 1-3 due = subtle, 4-7 = moderate, 8+ = prominent
- Tapping starts a review session (builds review payload, navigates to lesson/review)
- Dismissible (hides for 24 hours if swiped)
- Disappears when no letters are due

**Files:** `app/(tabs)/index.tsx`, new `src/components/home/ReviewNudge.tsx`

#### E4.4: Weekly Progress Summary
**Fix:** Small expandable section below hero card.
- Collapsed: "This week: 4 lessons, 92% accuracy"
- Expanded: lessons per day bar chart (Mon-Sun), letters practiced count, accuracy trend (up/down arrow)
- Data computed from lesson_attempts table filtered to current week
- Collapses to save space, remembers expanded state

**Files:** `app/(tabs)/index.tsx`, new `src/components/home/WeeklySummary.tsx`, new selector in `src/engine/selectors.ts`

#### E4.5: Context-Aware Return Welcome
**Fix:** The return-welcome screen currently shows one generic hadith. Make it personal.
- Load last completed lesson: "You were working on Seen · Sheen sounds"
- Load due review count: "You have 3 letters ready for review"
- If streak was saved by freeze: "Your streak freeze kept your X-day streak alive yesterday"
- Keep the hadith but add context below it
- CTA changes based on state: "Continue your lesson" vs. "Start a review" vs. "Begin today's practice"

**Files:** `app/return-welcome.tsx`

---

## Track 3: Learning Quality — Make Users Learn Better

### Phase L1: Wrong-Answer Explanations

**Goal:** Turn every mistake into a teaching moment with category-specific feedback.

#### L1.1: Error-Category Feedback in Wrong Answer Panel
**Problem:** The WrongAnswerPanel shows "The correct answer was [letter]" and plays audio. No explanation of why the user confused the letters.

**Fix:**
1. Pass the error category from mastery engine to WrongAnswerPanel
2. Render category-specific explanation:
   - **Visual confusion**: "These look alike! [correct] has [distinguishing feature]. Look for [visual cue]."
   - **Sound confusion**: "These sound similar. [correct] comes from [articulation point]. Listen for [sound cue]."
   - **Vowel confusion**: "The mark is different. [correct mark] is [position] — it makes [sound]. [chosen mark] is [position] — it makes [sound]."
   - **Random miss**: "Take your time — no rush. Let's look at [correct] again."
3. Use existing letter data: `confusedWith`, `tip`, `soundHint`, `articulation` fields from letters.js

**Files:** `src/components/quiz/WrongAnswerPanel.tsx`, `src/components/quiz/QuizQuestion.tsx`

#### L1.2: Expand Confusion Pair Tips
**Problem:** Only some letters have `confusedWith` and `tip` fields in letters.js. Need coverage for all 28 letters and all common confusion pairs.

**Fix:**
1. Audit all 28 letters for missing tips
2. Add `confusedWith` arrays for every letter (top 2-3 confusion partners)
3. Add `tip` strings for distinguishing each pair
4. Add mnemonics: "Ba = 1 dot Below = Belly", "Ta = 2 dots on Top = Tiara", "Tha = 3 dots = THree"
5. Store in letters.js alongside existing data

**Files:** `src/data/letters.js`

#### L1.3: Progressive Hint Escalation
**Fix:**
1. Track confusion frequency per-pair in current session (already tracked in mastery engine)
2. First occurrence: standard explanation (L1.1)
3. Second occurrence same pair: explanation + side-by-side audio comparison ("Listen to both: [play A] ... [play B]. Hear the difference?")
4. Third occurrence: dedicated mini-drill — 3 rapid-fire questions on just this pair, then return to normal quiz
5. Mini-drill uses existing question generators with forced distractor (only the confused pair as options)

**Files:** `src/hooks/useLessonQuiz.ts`, `src/components/quiz/WrongAnswerPanel.tsx`, new `src/components/quiz/ConfusionDrill.tsx`

---

### Phase L2: Adaptive Difficulty

**Goal:** Notice when users are struggling or breezing through, and adjust the experience accordingly.

#### L2.1: Struggling Detection
**Fix:**
1. Track rolling window: last 3 lesson results (scores + pass/fail)
2. **Struggling criteria**: 2 consecutive failures on same lesson, OR 3 lessons below 60%
3. **When struggling detected**:
   - Reduce question count by 30% (fewer questions = less overwhelming)
   - Simplify distractors (use letters from different families, not same-family confusables)
   - Add encouraging intro copy: "Let's slow down and focus on these letters"
   - Insert extra review of previously-mastered letters for confidence boost (2 easy questions at start)
4. **Exit struggling mode**: Pass 2 lessons in a row above 70%

**Files:** New `src/engine/difficulty.ts`, `src/hooks/useLessonQuiz.ts`, `src/components/LessonIntro.tsx`

#### L2.2: Fast-Track Detection
**Fix:**
1. **Fast-track criteria**: 3 consecutive lessons at 95%+ accuracy with average response time under 3 seconds
2. **When fast-track detected**:
   - Skip lesson intro automatically (already supported via `skipIntro` flag)
   - Reduce review questions (cut reviewIds by half)
   - Show "You're flying through this!" copy in lesson summary
   - Don't reduce teach questions — still need to learn new content
3. **Exit fast-track**: Score below 85% on any lesson

**Files:** `src/engine/difficulty.ts`, `src/hooks/useLessonQuiz.ts`, `src/components/LessonIntro.tsx`, `src/components/LessonSummary.tsx`

#### L2.3: Adaptive SRS Intervals
**Problem:** All errors reset review interval to 1 day regardless of error type. A visual confusion (one focused look fixes it) and a sound confusion (needs repeated audio exposure) get identical treatment.

**Fix:**
1. Sound confusions: reset to 1 day, require 2 correct reviews before advancing interval
2. Visual confusions: reset to 2 days (usually fixed quickly)
3. Vowel confusions: reset to 1 day (harakat needs repetition)
4. Random misses (no pattern): don't reset interval at all — likely a tap error
5. Implement in `updateEntitySRS()` in mastery.js

**Files:** `src/engine/mastery.js`

#### L2.4: Marginal Pass Band
**Problem:** 79% = fail, 81% = pass. One question changes everything. No middle ground.

**Fix:**
1. Add "marginal" band: 70-79% accuracy
2. Marginal pass: lesson counts as completed (user can progress), BUT SRS intervals for taught letters don't advance (they'll come back for review sooner)
3. Summary screen shows different messaging: "You passed, but those letters need more practice. They'll come back for review soon"
4. Update outcome.js pass logic and LessonSummary messaging

**Files:** `src/engine/outcome.js`, `src/components/LessonSummary.tsx`

#### L2.5: Response Time as Learning Signal
**Problem:** Quiz records response time per answer but never uses it. An 8-second correct answer means something very different from a 1-second correct answer.

**Fix:**
1. Define thresholds: <2s = confident, 2-5s = normal, >5s = uncertain
2. Uncertain correct answers (>5s): don't count toward mastery streak advancement. The letter isn't truly retained — it needed too much thinking
3. Confident correct answers (<2s): count as 1.5x toward streak (faster mastery for truly known letters)
4. Display in quiz: no visible change to user (don't add pressure). This is engine-only intelligence
5. Implement in `mergeQuizResultsIntoMastery()` in mastery.js

**Files:** `src/engine/mastery.js`

---

### Phase L3: Smarter Review System

**Goal:** Make review feel natural and effortless, not like extra homework.

#### L3.1: Interleaved Review Questions
**Fix:**
1. During question generation for any lesson, check for due review entities
2. If due entities exist: inject 1-2 review questions into the lesson question queue
3. Position them at 30% and 70% through the lesson (not at start or end)
4. Review questions use the same UI as regular questions — no context switch
5. Mark injected questions as `_isReview: true` so they don't affect lesson accuracy calculation
6. Update mastery for reviewed entities normally

**Files:** `src/hooks/useLessonQuiz.ts`, `src/engine/questions/shared.js`

#### L3.2: Review Urgency Weighting
**Problem:** Letters due today and letters 30 days overdue are weighted equally in review planning.

**Fix:**
1. Calculate urgency: `urgency = daysOverdue / scheduledInterval`
   - Letter due 1 day ago with 3-day interval: urgency = 0.33
   - Letter due 30 days ago with 7-day interval: urgency = 4.28
2. Sort review queue by urgency descending
3. Weight review question probability by urgency (exponential: `weight = e^(urgency - 1)`)
4. Most overdue letters appear first and most frequently

**Files:** `src/engine/selectors.ts`

#### L3.3: Post-Lesson Review Prompt
**Fix:**
1. After lesson summary (passed state), check for due review entities
2. If due entities exist, show prompt below summary: "You have X letters ready for a quick review — takes about 2 minutes. Review now?"
3. "Review now" builds review payload and navigates to `lesson/review`
4. "Not now" dismisses (no penalty, no guilt)
5. Track prompt acceptance rate in analytics (useful for understanding review engagement)

**Files:** `src/components/LessonSummary.tsx`, `app/lesson/[id].tsx`

#### L3.4: Micro-Review Sessions
**Problem:** Review sessions are 15 questions. Too long. Users skip them.

**Fix:**
1. Break review into micro-sessions: 3-5 questions each
2. Home screen review card shows "Quick review (3 questions)" instead of implying a long session
3. After micro-review: "3 letters refreshed! X more available." with option to continue or stop
4. Track micro-review completion separately in analytics
5. Adjust review payload builder to support configurable question count

**Files:** `src/engine/selectors.ts`, `app/(tabs)/index.tsx`, `app/lesson/[id].tsx`

#### L3.5: Review Streak Tracking
**Fix:**
1. Add `reviewStreak` and `lastReviewDate` to habit table
2. Track review sessions separately from lesson sessions
3. Home screen shows both: "X-day practice streak | Y reviews this week"
4. Review consistency contributes to milestone badges (E2.4): "Consistent Reviewer" badge at 7 review sessions

**Files:** `src/engine/habit.ts`, `src/hooks/useHabit.ts`, `src/db/schema.ts`

---

### Phase L4: Dark Mode & Accessibility

**Goal:** Make the app usable by everyone, in every lighting condition.

#### L4.1: Dark Mode Activation
**Problem:** All dark mode tokens exist. Every component uses `useColors()`. The only thing blocking dark mode is a hardcoded `"light"` in `_layout.tsx`.

**Fix:**
1. Replace hardcoded `"light"` with system preference detection via `useColorScheme()`
2. Add manual override: store user's theme preference in user_profile
3. Priority: user preference > system preference > light (default)
4. Test every screen in dark mode — fix any contrast or visibility issues
5. Ensure WarmGlow, WarmGradient, confetti, and decorative elements work in dark palette

**Files:** `app/_layout.tsx`, `src/design/theme.ts`, `src/db/schema.ts`

#### L4.2: Settings Screen
**Problem:** No settings screen exists. Needed for: theme toggle, daily goal, notification preferences, analytics consent, and eventually account management.

**Fix:**
1. Add Settings screen accessible from home screen (gear icon in header)
2. Sections:
   - **Appearance**: Light / Dark / System toggle
   - **Daily Goal**: 3 / 5 / 10 minutes (reuses GoalAdjustSheet)
   - **Notifications**: Daily reminder toggle + time picker, Streak reminder toggle
   - **Privacy**: Analytics sharing toggle (from F2.2)
   - **About**: App version, "Send Feedback" link, "Rate Tila" link
   - **Danger Zone**: Reset All Progress (moved from progress screen, with confirmation)
3. Settings persisted in user_profile table
4. Simple list layout — clean, not over-designed

**Files:** New `app/settings.tsx`, new `src/components/settings/` directory

#### L4.3: Font Scaling Support
**Fix:**
1. Add `maxFontSizeMultiplier={1.5}` to all Text components in design system
2. Create wrapper: `<AccessibleText>` that applies this automatically
3. Test at 1.0x, 1.25x, and 1.5x — ensure layouts don't break
4. Arabic text (ArabicText component) needs special testing — already large, must scale without overflow
5. Quiz options must remain tappable at all font sizes (increase touch target if needed)

**Files:** `src/design/components/ArabicText.tsx`, all components using raw `<Text>`

#### L4.4: Reduced Motion Support
**Fix:**
1. Detect system "reduce motion" setting via `AccessibilityInfo` API
2. Create `useReducedMotion()` hook
3. When enabled:
   - Replace spring animations with instant or 150ms linear transitions
   - Disable confetti particles
   - Disable floating letters layer
   - Disable breathing/pulsing glows (show static opacity instead)
   - Disable streak flame animation
   - Keep fade transitions (they're gentle enough)
4. Apply throughout: animations.ts presets check the flag, components that animate check the flag

**Files:** New `src/hooks/useReducedMotion.ts`, `src/design/animations.ts`, all components with animations

#### L4.5: Screen Reader Depth
**Fix:**
1. Add `accessibilityHint` to all interactive elements (hint describes what will happen, not what it is)
   - HearButton: label="Play letter sound", hint="Plays the pronunciation of this letter"
   - Quiz option: label="Letter Ba", hint="Tap to select this answer"
   - Lesson card: label="Lesson 5: Ba vs Ta", hint="Tap to start this lesson"
2. Quiz options announce state: "Selected, correct" / "Selected, incorrect" / "Correct answer"
3. Progress screen announces stats meaningfully: "12 letters learned out of 28"
4. Arabic text gets `accessibilityLanguage="ar"` so screen readers use Arabic pronunciation engine
5. Test with VoiceOver (iOS) and TalkBack (Android)

**Files:** All interactive components across `src/components/` and `src/design/components/`

#### L4.6: Contrast Audit
**Fix:**
1. Audit every foreground/background color combination against WCAG AA:
   - Body text: 4.5:1 minimum
   - Large text (18px+): 3:1 minimum
   - Interactive elements: 3:1 minimum
2. Check both light and dark modes
3. Known risk areas: `textMuted` on light backgrounds, accent gold on white, border colors
4. Fix any failures by adjusting the failing token (prefer darkening text over lightening backgrounds)
5. Document final contrast ratios in tokens.ts comments

**Files:** `src/design/tokens.ts`

---

## Deferred to Future Milestone

The following items are explicitly out of scope for this roadmap:

### Curriculum Expansion (Next Milestone)
- Phase 5: Connected Reading (question generator exists, no lessons assigned)
- Phase 6: Simple Word Reading (2-3 letter words with harakat)
- Phase 7: Additional Marks (sukoon, shadda, tanwin, madd)
- Phase 8: Phrase Reading (multi-word combinations)
- Phase 9: Quranic Conventions (special symbols, stop marks)
- Phase 10: Guided Surah Reading (Al-Fatiha verse by verse)
- ~200+ new lessons of curriculum design
- New question generators for word-level and phrase-level exercises
- Quranic audio assets and verse data

### Other Future Work
- Multi-user support (family sharing on one device)
- Cloud sync / account system
- Teacher dashboard
- Monetization / subscription
- Speaking/pronunciation feedback (ML-based)
- Internationalization (i18n framework, translations)
- Social features (sharing, peer comparison)
- E2E testing framework

---

## Success Criteria

This roadmap is complete when:

1. **No data corruption** — Quiz results save atomically, mastery data persists correctly across restarts
2. **No hardcoded secrets** — All API keys in environment variables, analytics consent implemented
3. **Users come back** — Push notifications scheduled, daily goals tracked, streaks protected
4. **Mistakes teach** — Every wrong answer explains why, with progressive depth for repeated confusions
5. **App adapts** — Struggling users get easier questions, fast learners skip intros, SRS adjusts by error type
6. **Reviews happen** — Due letters appear naturally inside lessons, review prompts at the right moments
7. **Everyone can use it** — Dark mode works, fonts scale, animations respect reduced motion, screen readers navigate properly
8. **Ship-ready** — OTA updates configured, error boundaries prevent crashes, deep linking works for notifications

---

## Constraints

- **No business logic architecture changes** — Engine/hook/DB pattern stays. Improvements work within existing architecture.
- **No new state management** — No Redux, Zustand, or new Context providers beyond what's needed (notification preferences, settings).
- **Offline-first preserved** — All new features work without network. Push notifications use local scheduling. No server dependencies.
- **60fps on mid-range Android** — All new animations must hit performance bar. Streak flame, progress ring, etc. use Reanimated.
- **Existing design tokens** — Keep current color palette, fonts, spacing. Dark mode uses already-defined dark tokens. No new visual language.
- **Bundle size awareness** — expo-notifications is the only major new dependency. No heavy libraries for gamification or charting.
