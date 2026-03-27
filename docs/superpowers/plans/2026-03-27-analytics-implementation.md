# Analytics & Crash Reporting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PostHog product analytics and Sentry crash reporting to the Tila app with 10 typed events across onboarding, lesson, and retention flows.

**Architecture:** Thin analytics wrapper (`src/analytics/`) that all components import — no direct SDK usage. PostHog US Cloud with autocapture disabled, Sentry with Expo config plugin and EAS source map upload. Fire-and-forget init that never blocks first render.

**Tech Stack:** `posthog-react-native`, `@sentry/react-native`, Expo 55, EAS Build

---

## File Structure

### New files

```
src/analytics/
  events.ts       — typed event names + property interfaces
  posthog.ts      — PostHog client init + config
  sentry.ts       — Sentry client init + config
  index.ts        — public API: init(), track(), identify(), flush()
metro.config.js   — Sentry metro serializer for source maps (repo root)
```

### Modified files

```
app.config.ts                                  — add Sentry Expo plugin
app/_layout.tsx                                — call analytics.init()
app/lesson/[id].tsx                            — lesson_started, lesson_completed, lesson_failed + timing ref
app/phase-complete.tsx                         — phase_completed
app/return-welcome.tsx                         — return_welcome_shown
src/components/onboarding/OnboardingFlow.tsx   — onboarding_step_viewed, onboarding_completed
src/components/LessonQuiz.tsx                  — letter_audio_played at tap site
src/components/onboarding/steps/LetterAudio.tsx — letter_audio_played at tap site
```

---

## Task 1: Install Dependencies and Configure Build

**Files:**
- Modify: `package.json`
- Create: `metro.config.js`
- Modify: `app.config.ts`

- [ ] **Step 1: Install PostHog and Sentry**

```bash
npx expo install posthog-react-native @sentry/react-native
```

- [ ] **Step 2: Create `metro.config.js`**

```javascript
// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withSentryConfig } = require("@sentry/react-native/metro");

const config = getDefaultConfig(__dirname);

module.exports = withSentryConfig(config);
```

- [ ] **Step 3: Add Sentry plugin to `app.config.ts`**

Add `@sentry/react-native/expo` to the plugins array in `app.config.ts`. The existing plugins array is at line 33. Add Sentry at the end:

```typescript
  plugins: [
    "expo-router",
    "expo-font",
    "expo-splash-screen",
    "expo-sqlite",
    "expo-audio",
    "expo-secure-store",
    "expo-asset",
    [
      "@sentry/react-native/expo",
      {
        organization: "tila",
        project: "tila-mobile",
      },
    ],
  ],
```

Note: The `organization` and `project` values must match the Sentry project created in the Sentry dashboard. These are placeholder names — update them after creating the Sentry project.

- [ ] **Step 4: Verify install**

Run: `npx tsc --noEmit`
Expected: No new errors from the installs.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json metro.config.js app.config.ts
git commit -m "chore: install posthog-react-native and @sentry/react-native with build config"
```

---

## Task 2: Create Analytics Event Types

**Files:**
- Create: `src/analytics/events.ts`

- [ ] **Step 1: Create `src/analytics/events.ts`**

```typescript
// src/analytics/events.ts

// ── Event property interfaces ──

export interface AppOpenedProps {
  first_open: boolean;
  days_since_install: number;
}

export interface OnboardingStepViewedProps {
  step_index: number;
  step_name: 'welcome' | 'tilawat' | 'hadith' | 'starting_point' | 'letter_reveal' | 'letter_audio' | 'letter_quiz' | 'finish';
}

export interface OnboardingCompletedProps {
  starting_point: string;
  duration_seconds: number;
}

export interface LessonStartedProps {
  lesson_id: number;
  phase: number;
  lesson_mode: string;
  is_retry: boolean;
}

export interface LessonCompletedProps {
  lesson_id: number;
  phase: number;
  accuracy: number;
  duration_seconds: number;
  total_questions: number;
  streak_peak: number;
}

export interface LessonFailedProps {
  lesson_id: number;
  phase: number;
  accuracy: number;
  duration_seconds: number;
  total_questions: number;
}

export interface PhaseCompletedProps {
  phase: number;
  total_lessons: number;
}

export interface LetterAudioPlayedProps {
  letter_id: number;
  audio_type: 'name' | 'sound';
  context: 'quiz' | 'onboarding' | 'review';
}

export interface MasteryStateChangedProps {
  letter_id: number;
  from_state: 'not_started' | 'introduced' | 'unstable' | 'accurate' | 'retained';
  to_state: 'not_started' | 'introduced' | 'unstable' | 'accurate' | 'retained';
  attempts_at_transition: number;
}

export interface ReturnWelcomeShownProps {
  days_since_last_practice: number;
  current_wird: number;
}

// ── Event map (name → property type) ──

export interface EventMap {
  app_opened: AppOpenedProps;
  onboarding_step_viewed: OnboardingStepViewedProps;
  onboarding_completed: OnboardingCompletedProps;
  lesson_started: LessonStartedProps;
  lesson_completed: LessonCompletedProps;
  lesson_failed: LessonFailedProps;
  phase_completed: PhaseCompletedProps;
  letter_audio_played: LetterAudioPlayedProps;
  mastery_state_changed: MasteryStateChangedProps;
  return_welcome_shown: ReturnWelcomeShownProps;
}

export type EventName = keyof EventMap;
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/analytics/events.ts
git commit -m "feat: add typed analytics event definitions"
```

---

## Task 3: Create PostHog and Sentry Clients

**Files:**
- Create: `src/analytics/posthog.ts`
- Create: `src/analytics/sentry.ts`

- [ ] **Step 1: Create `src/analytics/posthog.ts`**

```typescript
// src/analytics/posthog.ts

import PostHog from 'posthog-react-native';

let client: PostHog | null = null;

const POSTHOG_API_KEY = '__POSTHOG_API_KEY__'; // Replace with real key from PostHog dashboard
const POSTHOG_HOST = 'https://us.i.posthog.com';

export function initPostHog(): void {
  if (client) return;
  client = new PostHog(POSTHOG_API_KEY, {
    host: POSTHOG_HOST,
    // Privacy: explicit events only
    autocapture: false,
    captureScreenViews: false,
    disableSessionRecording: true,
    sendFeatureFlags: false,
    // Identity: no person profiles until auth exists
    personProfiles: 'identified_only',
  });
}

export function getPostHog(): PostHog | null {
  return client;
}
```

- [ ] **Step 2: Create `src/analytics/sentry.ts`**

```typescript
// src/analytics/sentry.ts

import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = '__SENTRY_DSN__'; // Replace with real DSN from Sentry dashboard

export function initSentry(): void {
  Sentry.init({
    dsn: SENTRY_DSN,
    // Performance monitoring OFF for v1
    tracesSampleRate: 0,
    // Don't send in dev
    enabled: !__DEV__,
  });
}

export function setSentryUser(id: string): void {
  Sentry.setUser({ id });
}
```

- [ ] **Step 3: Verify both compile**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/analytics/posthog.ts src/analytics/sentry.ts
git commit -m "feat: add PostHog and Sentry client modules"
```

---

## Task 4: Create Analytics Public API

**Files:**
- Create: `src/analytics/index.ts`

- [ ] **Step 1: Create `src/analytics/index.ts`**

```typescript
// src/analytics/index.ts

import { initPostHog, getPostHog } from './posthog';
import { initSentry, setSentryUser } from './sentry';
import type { EventMap, EventName } from './events';

export type { EventMap, EventName } from './events';

let _initialized = false;

/**
 * Initialize analytics providers. Call once in app/_layout.tsx.
 * Fire-and-forget — never blocks rendering.
 */
export function initAnalytics(): void {
  if (_initialized) return;
  _initialized = true;

  try {
    initPostHog();
  } catch (e) {
    console.warn('PostHog init failed:', e);
  }

  try {
    initSentry();
  } catch (e) {
    console.warn('Sentry init failed:', e);
  }

  // Pass PostHog anonymous ID to Sentry for crash-to-session correlation
  const ph = getPostHog();
  if (ph) {
    const anonId = ph.getAnonymousId();
    if (anonId) {
      setSentryUser(anonId);
    }
  }
}

/**
 * Track a typed event. Compile-time safety: only valid EventName values accepted.
 */
export function track<E extends EventName>(event: E, properties: EventMap[E]): void {
  const ph = getPostHog();
  if (!ph) return;
  ph.capture(event, properties);
}

/**
 * Link anonymous PostHog ID to an authenticated user (future auth).
 */
export function identify(userId: string): void {
  const ph = getPostHog();
  if (ph) {
    ph.identify(userId);
  }
  setSentryUser(userId);
}

/**
 * Force flush the PostHog event queue. Use sparingly — e.g., before app background.
 */
export function flush(): void {
  const ph = getPostHog();
  if (ph) {
    ph.flush();
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/analytics/index.ts
git commit -m "feat: add analytics public API with typed track(), identify(), flush()"
```

---

## Task 5: Initialize Analytics in Root Layout

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Add analytics init to `app/_layout.tsx`**

Add the import at the top of the file (after existing imports):

```typescript
import { initAnalytics, track } from "../src/analytics";
```

Add `initAnalytics()` call inside `RootLayout`, right before the `useEffect` that handles splash screen (line 48). The init must happen before any screen renders but must NOT block rendering:

```typescript
  // Initialize analytics — fire-and-forget, never blocks render
  useEffect(() => {
    initAnalytics();
  }, []);
```

Add `app_opened` tracking. For `first_open` and `days_since_install`, use a simple approach with `expo-secure-store`:

Add import:
```typescript
import * as SecureStore from "expo-secure-store";
```

Replace the new analytics useEffect with:

```typescript
  // Initialize analytics and track app open
  useEffect(() => {
    initAnalytics();

    (async () => {
      const installDate = await SecureStore.getItemAsync('tila_install_date');
      const today = new Date().toISOString().slice(0, 10);
      const firstOpen = !installDate;

      if (firstOpen) {
        await SecureStore.setItemAsync('tila_install_date', today);
      }

      const daysSinceInstall = installDate
        ? Math.floor((Date.now() - new Date(installDate).getTime()) / 86400000)
        : 0;

      track('app_opened', { first_open: firstOpen, days_since_install: daysSinceInstall });
    })();
  }, []);
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: init analytics in root layout, track app_opened"
```

---

## Task 6: Add Onboarding Funnel Events

**Files:**
- Modify: `src/components/onboarding/OnboardingFlow.tsx`

- [ ] **Step 1: Add imports**

Add at the top of `OnboardingFlow.tsx`:

```typescript
import { track } from "../../analytics";
```

- [ ] **Step 2: Track `onboarding_step_viewed` on step changes**

Add a `useRef` for the onboarding start time and a step name map. Add a `useEffect` that fires on `step` changes:

```typescript
const STEP_NAMES = [
  'welcome', 'tilawat', 'hadith', 'starting_point',
  'letter_reveal', 'letter_audio', 'letter_quiz', 'finish',
] as const;

const onboardingStartRef = useRef(Date.now());
```

Add after the existing `letterRevealTimerRef`:

```typescript
  // Track step views
  useEffect(() => {
    track('onboarding_step_viewed', {
      step_index: step,
      step_name: STEP_NAMES[step],
    });
  }, [step]);
```

- [ ] **Step 3: Track `onboarding_completed` on successful finish**

In the `handleFinish` function, add tracking after the successful `updateProfile` call (before the `setTimeout` navigation):

```typescript
      await updateProfile({
        onboarded: true,
        onboardingVersion: 2,
        startingPoint: draft.startingPoint,
        commitmentComplete: true,
      });

      track('onboarding_completed', {
        starting_point: draft.startingPoint ?? 'unknown',
        duration_seconds: Math.round((Date.now() - onboardingStartRef.current) / 1000),
      });

      // Only navigate after successful save
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 500);
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/components/onboarding/OnboardingFlow.tsx
git commit -m "feat: track onboarding_step_viewed and onboarding_completed events"
```

---

## Task 7: Add Lesson Flow Events

**Files:**
- Modify: `app/lesson/[id].tsx`

- [ ] **Step 1: Add imports and timing ref**

Add import at the top of `app/lesson/[id].tsx`:

```typescript
import { track } from '../../src/analytics';
```

Add a `lessonStartedRef` inside the component, after the existing `preCompletedRef` (line 50):

```typescript
  // Track lesson start time for duration analytics
  const lessonStartedRef = useRef<number | null>(null);
```

- [ ] **Step 2: Track `lesson_started` when quiz begins**

The quiz stage begins when `stage` transitions to `"quiz"` or when `skipIntro`/`isHybrid` causes immediate quiz entry. Add a `useEffect` that fires on stage change:

```typescript
  // Track lesson_started when entering quiz stage
  useEffect(() => {
    if (stage === "quiz" && lesson) {
      lessonStartedRef.current = Date.now();
      track('lesson_started', {
        lesson_id: lesson.id,
        phase: lesson.phase,
        lesson_mode: lesson.lessonMode,
        is_retry: skipIntro, // skipIntro is true on retry
      });
    }
  }, [stage, lesson, skipIntro]);
```

- [ ] **Step 3: Track `lesson_completed` and `lesson_failed` on quiz result**

In the `handleQuizComplete` callback, after `setQuizResults` and before `setStage("summary")`, add:

```typescript
      const durationSeconds = lessonStartedRef.current
        ? Math.round((Date.now() - lessonStartedRef.current) / 1000)
        : 0;

      if (passed) {
        track('lesson_completed', {
          lesson_id: lesson!.id,
          phase: lesson!.phase,
          accuracy,
          duration_seconds: durationSeconds,
          total_questions: results.total,
          streak_peak: 0, // TODO: expose from useLessonQuiz if needed
        });
      } else {
        track('lesson_failed', {
          lesson_id: lesson!.id,
          phase: lesson!.phase,
          accuracy,
          duration_seconds: durationSeconds,
          total_questions: results.total,
        });
      }
```

Note: `streak_peak` is set to 0 for now. The `useLessonQuiz` hook exposes `streak` (current streak) but not the peak. This can be added later by tracking max streak in the hook and including it in the results object.

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add app/lesson/[id].tsx
git commit -m "feat: track lesson_started, lesson_completed, lesson_failed with real timing"
```

---

## Task 8: Add Phase Complete and Return Welcome Events

**Files:**
- Modify: `app/phase-complete.tsx`
- Modify: `app/return-welcome.tsx`

- [ ] **Step 1: Track `phase_completed` in `app/phase-complete.tsx`**

Add import:

```typescript
import { track } from "../src/analytics";
import { LESSONS } from "../src/data/lessons";
```

Add a `useEffect` on mount inside `PhaseCompleteScreen`, after the existing variable declarations:

```typescript
  useEffect(() => {
    const phaseLessons = LESSONS.filter((l) => l.phase === phaseNum);
    track('phase_completed', {
      phase: phaseNum,
      total_lessons: phaseLessons.length,
    });
  }, [phaseNum]);
```

Note: `LESSONS` import may already exist — check before adding a duplicate.

- [ ] **Step 2: Track `return_welcome_shown` in `app/return-welcome.tsx`**

Add imports:

```typescript
import { useEffect } from "react";
import { track } from "../src/analytics";
import { useHabit } from "../src/hooks/useHabit";
import { getTodayDateString, getDayDifference } from "../src/engine/dateUtils";
```

Note: `useHabit` and the date imports may need to be added. The screen currently uses `useProgress` but not `useHabit`.

Add inside `ReturnWelcomeScreen`, after the existing variable declarations:

```typescript
  const { habit } = useHabit();

  useEffect(() => {
    const lastPractice = habit?.lastPracticeDate;
    const daysSince = lastPractice
      ? getDayDifference(getTodayDateString(), lastPractice)
      : 0;

    track('return_welcome_shown', {
      days_since_last_practice: daysSince,
      current_wird: habit?.currentWird ?? 0,
    });
  }, []);
```

Note: The empty dependency array ensures this fires once on mount, not on every re-render. The `habit` data loads quickly from local SQLite, but if it's null on first render, `days_since_last_practice` will be 0 and `current_wird` will be 0 — acceptable for this event.

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add app/phase-complete.tsx app/return-welcome.tsx
git commit -m "feat: track phase_completed and return_welcome_shown events"
```

---

## Task 9: Add Letter Audio and Mastery Events

**Files:**
- Modify: `src/components/LessonQuiz.tsx`
- Modify: `src/components/onboarding/steps/LetterAudio.tsx`

- [ ] **Step 1: Track `letter_audio_played` in LessonQuiz**

Add import at top of `src/components/LessonQuiz.tsx`:

```typescript
import { track } from "../analytics";
```

In the `playTargetAudio` callback (currently around line 74), add tracking before the play call:

```typescript
  const playTargetAudio = useCallback(() => {
    if (!currentQuestion?.hasAudio || !currentQuestion?.targetId) return;

    track('letter_audio_played', {
      letter_id: typeof currentQuestion.targetId === 'number' ? currentQuestion.targetId : 0,
      audio_type: isSoundQuestion ? 'sound' : 'name',
      context: 'quiz' as const,
    });

    if (isSoundQuestion) {
      playLetterSound(currentQuestion.targetId);
    } else {
      playLetterName(currentQuestion.targetId);
    }
  }, [currentQuestion?.hasAudio, currentQuestion?.targetId, isSoundQuestion]);
```

- [ ] **Step 2: Track `letter_audio_played` in onboarding LetterAudio step**

Read `src/components/onboarding/steps/LetterAudio.tsx` to find where the play handler is called. The `onPlayAudio` prop is passed from `OnboardingFlow.tsx`. The tracking should go in `OnboardingFlow.tsx`'s `handlePlayAudio` callback since that's the tap site:

In `src/components/onboarding/OnboardingFlow.tsx`, update `handlePlayAudio`:

```typescript
  const handlePlayAudio = useCallback(async () => {
    track('letter_audio_played', {
      letter_id: 1, // Alif
      audio_type: 'name' as const,
      context: 'onboarding' as const,
    });
    playTap();
    playLetterName(1);
    setHasPlayedAudio(true);
  }, []);
```

The `track` import was already added in Task 6.

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/LessonQuiz.tsx src/components/onboarding/OnboardingFlow.tsx
git commit -m "feat: track letter_audio_played at tap sites in quiz and onboarding"
```

---

## Task 10: Add `mastery_state_changed` Event

**Files:**
- Modify: `src/engine/mastery.js`

- [ ] **Step 1: Understand the mastery update flow**

The mastery state is updated after each lesson in the lesson completion flow. `deriveMasteryState(entity, today)` in `src/engine/mastery.js` computes the current state from entity data. The state change needs to be detected and tracked where mastery entities are updated.

The cleanest insertion point is where `saveMasteryEntity()` is called — but this happens inside the progress update flow. Since `mastery.js` is a plain JS file (not TypeScript), we'll add the tracking at the call site where mastery gets updated after a lesson.

Look at where `saveMasteryEntity` is called. This is likely in the lesson completion flow or a mastery update hook. Read the code to find the exact call site.

If mastery updates happen inside `useProgress` or directly after `completeLesson`, add a comparison there. However, since this event requires comparing old state vs new state, the simplest approach is:

In `app/lesson/[id].tsx`, after `progress.completeLesson()` returns and before `setStage("summary")`, compare pre-lesson and post-lesson mastery states for each taught letter:

```typescript
      // Track mastery state changes for letters taught in this lesson
      if (lesson?.teachIds) {
        const oldEntities = mastery.entities ?? {};
        // Refresh to get post-lesson state
        await progress.refresh();
        const newMastery = progress.mastery;
        if (newMastery) {
          for (const letterId of lesson.teachIds) {
            const key = `letter:${letterId}`;
            const oldEntity = oldEntities[key];
            const newEntity = newMastery.entities?.[key];
            if (newEntity) {
              const { deriveMasteryState } = require('../../src/engine/mastery');
              const today = new Date().toISOString().slice(0, 10);
              const oldState = oldEntity ? deriveMasteryState(oldEntity, today) : 'not_started';
              const newState = deriveMasteryState(newEntity, today);
              if (oldState !== newState) {
                track('mastery_state_changed', {
                  letter_id: letterId,
                  from_state: oldState,
                  to_state: newState,
                  attempts_at_transition: newEntity.attempts ?? 0,
                });
              }
            }
          }
        }
      }
```

**Important:** This approach has a subtle issue — `progress.refresh()` is async and updates state, but the new `progress.mastery` won't be available in the same render cycle. A cleaner approach: capture the mastery entities BEFORE `completeLesson`, then after `refresh()` completes, compare in a `useEffect` that watches mastery changes.

Simpler alternative — defer this to a follow-up task. The mastery event is the lowest priority of the 10 events and requires careful state comparison logic. Ship the other 9 events first, then add mastery tracking in a dedicated pass.

**Decision: Skip `mastery_state_changed` in this plan. Add a TODO comment in `app/lesson/[id].tsx`:**

```typescript
      // TODO: Track mastery_state_changed — requires comparing pre/post lesson mastery state
      // Deferred to follow-up: needs careful async state comparison
```

- [ ] **Step 2: Add the TODO comment**

In `app/lesson/[id].tsx`, add after the `lesson_completed` / `lesson_failed` tracking block:

```typescript
      // TODO: Track mastery_state_changed event
      // Requires comparing pre-lesson vs post-lesson mastery state per letter
      // Deferred: ship other 9 events first, add mastery tracking in follow-up
```

- [ ] **Step 3: Commit**

```bash
git add app/lesson/[id].tsx
git commit -m "chore: add TODO for mastery_state_changed event (deferred to follow-up)"
```

---

## Task 11: Final Validation

- [ ] **Step 1: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No new errors from analytics code.

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: All 388 tests pass. Analytics code is side-effect-free in test context (PostHog/Sentry won't init in test env).

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: No new lint errors in analytics files or modified files.

- [ ] **Step 4: Verify analytics module exports**

Run: `node -e "console.log(Object.keys(require('./src/analytics/events')))"` (or just verify the TypeScript compiles — the type safety is the real validation).

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "chore: final validation for analytics implementation"
```

---

## Post-Implementation Notes

### Before shipping to production

1. **Create PostHog project** at us.posthog.com, get the API key, replace `__POSTHOG_API_KEY__` in `src/analytics/posthog.ts`
2. **Create Sentry project**, get the DSN, replace `__SENTRY_DSN__` in `src/analytics/sentry.ts`
3. **Set `SENTRY_AUTH_TOKEN`** as EAS build secret: `eas secret:create --name SENTRY_AUTH_TOKEN --value <token>`
4. **Verify PostHog US Cloud settings**: IP capture disabled, autocapture disabled in project settings (server-side, not just client)
5. **Update Sentry plugin org/project** in `app.config.ts` to match real Sentry project

### Deferred work

- `mastery_state_changed` event — requires async state comparison, deferred to follow-up
- `streak_peak` in `lesson_completed` — requires exposing max streak from `useLessonQuiz`
- `days_to_complete` in `phase_completed` — requires storing first-lesson-in-phase date
- Analytics opt-out toggle in settings screen — future feature
