# Analytics & Crash Reporting Design

**Date:** 2026-03-27
**Context:** Tila is a pure offline Expo/React Native app with zero analytics visibility. This spec adds product analytics (PostHog) and crash reporting (Sentry) to enable data-driven decisions across the product roadmap.

---

## Provider Stack

- **PostHog** (US Cloud) — product analytics, anonymous mode, autocapture disabled
- **Sentry** (`@sentry/react-native` with Expo plugin) — crash reporting, source maps via EAS

Both initialize in `app/_layout.tsx` as fire-and-forget. Neither blocks first render or splash screen dismissal.

---

## Architecture

### File Structure

```
src/analytics/
  index.ts          — public API: init(), track(), identify(), flush(), setUser()
  posthog.ts        — PostHog client init + config
  sentry.ts         — Sentry client init + config
  events.ts         — typed event name constants + property interfaces
```

**No component ever imports PostHog or Sentry directly.** All instrumentation goes through `src/analytics/index.ts`. This lets you swap providers without touching call sites.

### `src/analytics/index.ts` — Public API

```typescript
init()                          — called once in _layout.tsx, inits both providers
track(event: EventName, props)  — sends to PostHog (typed, no arbitrary strings)
identify(userId: string)        — links anonymous PostHog ID to auth account (future)
setUser(context: object)        — sets Sentry user context
flush()                         — forces PostHog queue flush (use sparingly)
```

### `src/analytics/posthog.ts` — PostHog Config

- **US Cloud** instance
- `autocapture: false` — explicit events only, no overlap with Sentry breadcrumbs
- `captureScreenViews: false` — we track meaningful navigation, not every screen
- `disableSessionRecording: true` — not needed for v1
- `sendFeatureFlags: false` — not using feature flags yet
- PostHog generates its own `distinct_id` on first init — this is the single anonymous identity source
- `personProfiles: 'identified_only'` — no person profiles until auth exists

### `src/analytics/sentry.ts` — Sentry Config

- `@sentry/react-native` with Expo config plugin (`withSentry` in app.config.ts)
- Source maps uploaded via EAS Build (`SENTRY_AUTH_TOKEN` in EAS build secrets)
- Release tagging: `${bundleIdentifier}@${version}+${buildNumber}`
- Breadcrumbs: navigation transitions + user taps (Sentry's defaults)
- Performance monitoring: **OFF** for v1 (adds overhead)
- Sentry user context set to PostHog's `distinct_id` for crash-to-session correlation
- **Required:** Create `metro.config.js` (does not currently exist) with Sentry's metro serializer for debug IDs and source map upload. This is not optional — without it, crash stack traces are minified and unreadable.
- **Required:** Add `@sentry/react-native/expo` to `app.config.ts` plugins array. The Expo plugin handles automatic bundle/source-map upload during EAS Build.

### `src/analytics/events.ts` — Event Type Safety

All event names and their property shapes are typed. The `track()` function only accepts valid `EventName` values — no freeform strings.

```typescript
type EventName =
  | 'app_opened'
  | 'onboarding_step_viewed'
  | 'onboarding_completed'
  | 'lesson_started'
  | 'lesson_completed'
  | 'lesson_failed'
  | 'phase_completed'
  | 'letter_audio_played'
  | 'return_welcome_shown'
  | 'mastery_state_changed';
```

Each event name maps to a typed property interface. `track('lesson_completed', { lesson_id: 1 })` typechecks; `track('random_event', {})` is a compile error.

---

## V1 Event Taxonomy (10 events)

### Funnel Events

#### `app_opened`
**When:** App foregrounds (comes from background or cold start).
**Properties:**
- `first_open: boolean` — true on very first launch
- `days_since_install: number` — derived from first open timestamp stored locally

#### `onboarding_step_viewed`
**When:** User reaches each onboarding step (0-7).
**Properties:**
- `step_index: number` — 0-7
- `step_name: string` — 'welcome' | 'tilawat' | 'hadith' | 'starting_point' | 'letter_reveal' | 'letter_audio' | 'letter_quiz' | 'finish'

#### `onboarding_completed`
**When:** `handleFinish()` succeeds and profile is saved.
**Properties:**
- `starting_point: string` — 'new' | 'some_arabic' | 'rusty' | 'can_read'
- `duration_seconds: number` — time from step 0 to completion

### Lesson Events

#### `lesson_started`
**When:** Quiz begins (questions generated, first question displayed).
**Implementation:** Add a `lessonStartedRef = useRef(Date.now())` in `app/lesson/[id].tsx` when stage transitions to `"quiz"`. This ref provides real elapsed time for `duration_seconds` on completion/failure. The existing `durationSeconds` was removed from `completeLesson()` in Wave 1 because it was always 0 — this ref replaces it with an actual measurement.
**Properties:**
- `lesson_id: number`
- `phase: number`
- `lesson_mode: string` — 'recognition' | 'sound' | 'harakat' | etc.
- `is_retry: boolean` — true if user is retrying after a failure

#### `lesson_completed`
**When:** Quiz finishes with a passing result.
**Properties:**
- `lesson_id: number`
- `phase: number`
- `accuracy: number` — 0.0 to 1.0
- `duration_seconds: number` — real elapsed time from `lessonStartedRef` to quiz completion
- `total_questions: number`
- `streak_peak: number` — highest streak during the lesson

#### `lesson_failed`
**When:** Quiz finishes with a failing result.
**Properties:**
- `lesson_id: number`
- `phase: number`
- `accuracy: number`
- `duration_seconds: number` — real elapsed time from `lessonStartedRef` to quiz completion
- `total_questions: number`

#### `phase_completed`
**When:** All lessons in a phase are completed for the first time.
**Properties:**
- `phase: number`
- `total_lessons: number`
- `days_to_complete: number` — days from first lesson start in phase to completion

### Learning Events

#### `letter_audio_played`
**When:** User taps a HearButton to play letter audio.
**Insertion point:** Fire at the tap site (the component calling the audio function), NOT inside `src/audio/player.ts`. The audio layer does not know screen context — threading context into the audio API would pollute its interface. The tap handler already knows the letter ID, audio type, and which screen it's on.
**Properties:**
- `letter_id: number`
- `audio_type: string` — 'name' | 'sound'
- `context: string` — 'quiz' | 'onboarding' | 'review'

#### `mastery_state_changed`
**When:** A letter's mastery state transitions (e.g., introduced → unstable → accurate → retained). Only fires on actual transitions, not on every question.
**Properties:**
- `letter_id: number`
- `from_state: string` — 'not_started' | 'introduced' | 'unstable' | 'accurate' | 'retained'
- `to_state: string` — same enum
- `attempts_at_transition: number`

### Retention Events

#### `return_welcome_shown`
**When:** The return-welcome screen mounts (fires in `app/return-welcome.tsx` on component mount, NOT on the redirect decision in the home tab). Tracking at the redirect point would overcount attempted redirects vs confirmed views.
**Properties:**
- `days_since_last_practice: number`
- `current_wird: number` — streak count at time of return

---

## Identity Strategy

**V1 (anonymous):** PostHog generates a `distinct_id` on first init. This is the sole identity. No UUIDs in `expo-secure-store`, no second source of truth. Sentry receives this same ID as user context for crash-to-session correlation.

**Future (authenticated):** When auth ships, call `identify(userId)` which calls `posthog.identify(userId)` and `Sentry.setUser({ id: userId })`. PostHog merges the anonymous history with the authenticated profile automatically.

---

## Privacy

- **PostHog US Cloud** — data hosted in US (us.posthog.com)
- **IP capture disabled** — configured in PostHog project settings (server-side), not just client flag
- **Autocapture disabled** — only explicit events, no accidental PII in touch targets
- **No PII in events** — no names, emails, phone numbers, device IDs in any event property
- **No IDFA** — we don't use Apple's advertising identifier, so App Tracking Transparency prompt is not required
- **Opt-out respected** — if a future settings screen adds an analytics toggle, `posthog.optOut()` silences all tracking. Sentry continues for crash reporting.

---

## Insertion Points

Analytics calls are added in **three passes**, each independently shippable:

### Pass 1: Init + Onboarding Funnel
- `app/_layout.tsx` — call `init()` after database setup, before splash hide
- `src/components/onboarding/OnboardingFlow.tsx` — `onboarding_step_viewed` on step change, `onboarding_completed` on successful finish
- Root layout `useEffect` — `app_opened` on mount

### Pass 2: Lesson Flow
- `app/lesson/[id].tsx` — add `lessonStartedRef` when stage transitions to `"quiz"`, `lesson_started` fires at that point, `lesson_completed` / `lesson_failed` on result with real elapsed time
- `src/engine/mastery.js` or the mastery update call site — `mastery_state_changed` when state transitions
- `app/phase-complete.tsx` — `phase_completed`

### Pass 3: Retention + Audio
- `app/return-welcome.tsx` — `return_welcome_shown` on component mount (not the redirect in home tab)
- HearButton tap handlers in quiz/onboarding components — `letter_audio_played` at the tap site with screen context (not in `src/audio/player.ts`)

---

## EAS / Build Configuration

### Sentry Setup (all steps required)
1. Add `@sentry/react-native` dependency
2. Add Sentry Expo config plugin to `app.config.ts` plugins array:
   ```typescript
   plugins: [
     ['@sentry/react-native/expo', { organization: '...', project: '...' }]
   ]
   ```
3. Create `metro.config.js` at repo root (does not currently exist). Must include Sentry's metro serializer for debug IDs and source map upload. Without this, production crash stack traces are minified and useless.
4. Set `SENTRY_AUTH_TOKEN` as EAS build secret (required for source map upload during `eas build`)
5. Set `SENTRY_DSN` as environment variable (can be checked into code — it's a public ingest URL)

### PostHog Setup
- Add `posthog-react-native` dependency
- `POSTHOG_API_KEY` can be checked into code (it's a public write-only key)
- `POSTHOG_HOST` set to `https://us.i.posthog.com`

---

## What This Unlocks (PostHog Dashboard)

With these 10 events, you can build:
- **Onboarding funnel:** Step 0 → Step 7 conversion, drop-off by step
- **Lesson completion rate:** Started vs completed vs failed, by phase and lesson
- **Retention cohorts:** Day 1 / Day 7 / Day 30 return rates
- **Learning effectiveness:** Mastery transition speed, audio usage patterns
- **Crash correlation:** Link Sentry crashes to user sessions and lesson context

---

## Non-Goals

- **No `question_answered` event** — too noisy for v1. Lesson-level aggregates provide the same signal. Add per-question tracking later if needed.
- **No abandonment events** — mobile app-close is inherently lossy. Derive "started but never completed" from existing events in PostHog dashboards.
- **No session recording** — not needed for v1, adds SDK overhead.
- **No feature flags** — not using PostHog feature flags yet.
- **No performance monitoring** — Sentry performance tracing is off for v1 to avoid overhead.
- **No settings screen toggle** — analytics opt-out UI is a future feature. V1 tracks all users.
