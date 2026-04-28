# Architecture

**Analysis Date:** 2026-04-27

## Pattern Overview

**Overall:** Offline-first, single-user mobile app built on Expo Router (file-based routing) with a deliberately minimal **Curriculum Runtime** at its core. Lessons are hand-compiled `LessonData` artifacts that flow through a generic `LessonRunner` cursor. SQLite is the source of truth for user/habit state; AsyncStorage tracks per-lesson completion. Cloud features (auth, sync, social) are layered on top via React Context providers and degrade gracefully for anonymous users.

**Critical historical context (post-2026-04-20 reset):**
The pre-reset `lessonMode` + question-generator + `useLessonQuiz` pipeline was excised from `main`. The replacement curriculum runtime lives at `src/curriculum/`. The mastery state machine in `src/engine/mastery.ts` is preserved on disk and still readable by `useProgress`, but the **write path is quarantined behind `noopMasteryRecorder`** — no entity attempts or lesson outcomes are persisted to `mastery_*` tables today. See `.planning/STATE.md` and `src/curriculum/README.md`.

**Key Characteristics:**
- File-based routing with Expo Router; the lesson route is `/lesson/[id]` mapped through `resolveLessonId()` → `lesson-XX`.
- Curriculum is **data-as-code**: each lesson is a hand-compiled TS file exporting a typed `LessonData` and registered in `src/curriculum/lessons/index.ts`.
- Runtime is shape-agnostic — `LessonRunner` accepts a `LessonData` and a `renderScreen` callback; the route owns chrome and exercise dispatch.
- No Redux / Zustand. State sources: SQLite (durable user/habit data), AsyncStorage (lesson completion + Supabase session), React Context (theme, db, auth, sync, subscription, app-state, social).
- Engine layer (`src/engine/`) is now thin: only `mastery.ts` (quarantined), `progress.ts` (load/save adapters + habit shim), `habit.ts` (loader), `dateUtils.ts`, `features.ts` flag set, `index.ts`.
- Strict TypeScript, strict analytics event map, error boundaries at root + per-screen.
- Dark mode is **forced light** at the hook level — `useThemePreference()` returns a static `"light"` until the dark palette is polished.

## Layers

**Curriculum Runtime (`src/curriculum/`):**
- Purpose: Drive lesson presentation and emit attempt + outcome events.
- Location: `src/curriculum/runtime/`, `src/curriculum/types.ts`, `src/curriculum/lessons/`, `src/curriculum/ui/`
- Contains:
  - `types.ts` — `LessonData`, `Screen` (`teach`|`exercise`), `TeachingBlock` union (text, heading, glyph-display, shape-variants, audio, name-sound-pair, mark-preview, reading-direction), seven `Exercise` types (tap, hear, choose, build, read, fix).
  - `runtime/LessonRunner.tsx` — cursor + outcome aggregator. Calls `masteryRecorder.recordEntityAttempt` per attempt and `recordLessonOutcome` on completion.
  - `runtime/cursor.ts` — pure `advanceCursor` / `retreatCursor` index math.
  - `runtime/outcome.ts` — `computeLessonOutcome` (threshold + decoding rule).
  - `runtime/mastery-recorder.ts` — `MasteryRecorder` interface + active `noopMasteryRecorder` (logs in `__DEV__` only).
  - `runtime/completion-store.ts` — `asyncStorageCompletionStore` keyed `tila.lesson-completion.<id>`.
  - `runtime/url-resolver.ts` — `"1"` → `"lesson-01"`.
  - `lessons/lesson-01.ts` + `lessons/index.ts` (`lessonRegistry`).
  - `ui/LessonChrome.tsx`, `ui/TeachingScreenView.tsx`, `ui/LessonCompletionView.tsx`, `ui/exercises/{TapExercise,HearExercise,ReadExercise,index.tsx}`.
- Depends on: `src/design/components/`, `src/design/theme.ts`, `src/audio/player.ts` (via the route).
- Used by: `app/lesson/[id].tsx`, `app/sandbox-lesson.tsx`.
- Notes: Only three of seven exercise renderers exist (`TapExercise`, `HearExercise`, `ReadExercise`); `choose`, `build`, `fix` fall through to an `UnimplementedExercise` placeholder in `src/curriculum/ui/exercises/index.tsx`.

**Engine (`src/engine/`):**
- Purpose: Pure JS helpers — date math, habit reads, mastery key normalization, progress adapter to SQLite. No React.
- Location: `src/engine/`
- Contains: `mastery.ts` (quarantined entity-key/skill-key/confusion-key derivation + `mergeQuizResultsIntoMastery`), `progress.ts` (`loadProgress`, `saveUserProfile`, `saveMasteryEntity/Skill/Confusion`, `saveMasteryResults`, `resetProgress`, `importProgress`), `habit.ts` (`loadHabit`), `dateUtils.ts`, `features.ts` (`FEATURES.speakingPractice = false`), `index.ts` (empty re-export).
- Depends on: `expo-sqlite` types only; `src/data/letters.js` (read by `mastery.ts`).
- Used by: Hooks layer + `src/state/provider.tsx`. Mastery write path is reachable only via `useProgress.saveMasteryOnly` and `resetProgress`/`importProgress` maintenance flows — the active lesson runtime does not call them.

**Database (`src/db/`):**
- Purpose: SQLite client, schema, migrations, React provider.
- Location: `src/db/`
- Contains: `client.ts` (`getDatabase`, `runMigrations` v1→v7, `resetDatabase`, `getDatabaseVersion`; sets `PRAGMA foreign_keys = ON`), `schema.ts` (`SCHEMA_VERSION = 7`, `CREATE_TABLES`, `SEED_DEFAULTS`), `provider.tsx` (`DatabaseProvider`, `useDatabase`, 15 s init timeout with retry via `ErrorFallback`), `index.ts`.
- Depends on: `expo-sqlite`, `src/components/feedback/ErrorFallback.tsx`.
- Used by: All hooks + every provider that touches local state.

**Hooks (`src/hooks/`):**
- Purpose: Bridge UI to engine + SQLite. Load → call engine → write back.
- Location: `src/hooks/`
- Contains: `useProgress.ts` (loads `ProgressState`, exposes `saveMasteryOnly`, `updateProfile`, `refresh`), `useHabit.ts` (loads habit row, `recordPractice` inside an exclusive transaction reading fresh DB state), `useMastery.ts` (granular `updateEntity/updateSkill/updateConfusion` writes — currently unused by the active lesson runtime), `useThemePreference.ts` (force-light beta stub).
- Depends on: `src/db/provider.tsx`, `src/engine/progress.ts`, `src/engine/habit.ts`, `src/engine/dateUtils.ts`.
- Used by: Feature components + `src/state/provider.tsx`.
- Note: **No `useLessonQuiz` exists.** It was removed during the reset.

**Design System (`src/design/`):**
- Purpose: Theme tokens, color resolution, shared primitives, animation defaults, haptics, atmosphere.
- Location: `src/design/`
- Contains: `theme.ts` (`ThemeContext`, `useColors`, `useTheme`, `resolveColors`), `tokens.ts` (`lightColors`, `darkColors`, `typography`, `spacing`, `radii`, `fontFamilies`), `animations.ts` (`durations`, `easings`), `haptics.ts`, `CrescentIcon.tsx`, `components/{Button, Card, ArabicText, HearButton, QuizOption, PhraseReveal, WarmGradient}` exported via `components/index.ts`, `atmosphere/{AtmosphereBackground, FloatingLettersLayer, WarmGlow}`.
- Depends on: `react-native`, `react-native-reanimated`, `react-native-svg`, `expo-haptics`, `expo-linear-gradient`.
- Used by: Curriculum UI, feature components, all routes.

**Providers (root composition in `app/_layout.tsx`):**
- `Sentry.ErrorBoundary` (outermost) → `DatabaseProvider` → `ThemeWrapper` → `AuthProvider` → `SyncProvider` → `SubscriptionProvider` → `AppStateProvider` → `SocialProvider` → `AnalyticsGate` → `AppNavigator` (`expo-router/Stack`).

**Auxiliary domains:**
- `src/auth/` — Supabase Auth: `provider.tsx`, `supabase.ts` (encrypts session in AsyncStorage with AES-256 key from SecureStore), `apple.ts`, `google.ts`, `email.ts`, `hooks.ts`, `types.ts` (`ACCOUNT_PROMPT_LESSONS = []` — quarantined).
- `src/sync/` — Cloud sync: `provider.tsx` (foreground-trigger via React Native `AppState`), `service.ts` (`syncAll` LWW, never throws), `tables.ts`, `migration.ts` + `migration.sql`, `hooks.ts`, `types.ts`.
- `src/monetization/` — RevenueCat: `provider.tsx` (currently a beta stub: `isPremiumActive: true`, no SDK calls), `revenuecat.ts`, `paywall.ts`, `hooks.ts` (`useCanAccessLesson` always-allow), `analytics.ts`.
- `src/state/` — `AppStateProvider` aggregates `useProgress` output + habit + a transactional `recordPractice`. Convenience layer for screens that want one read.
- `src/social/` — Friend streaks + invites via Supabase: `provider.tsx`, `friends.ts`, `invite.ts`, `hooks.ts`, `types.ts`.
- `src/analytics/` — `index.ts` (`initAnalytics`, `track<E>`, `identify`, `flush`), `events.ts` (strict `EventMap` — lesson-specific events removed during reset), `posthog.ts`, `sentry.ts`.
- `src/audio/` — `player.ts` (`configureAudioSession`, `createAudioPlayer` via `expo-audio`, letter-id → filename map for `name`/`sound` assets, `playByPath`).
- `src/data/` — Static Arabic reference: `letters.js`, `harakat.js`, `connectedForms.js`. **No `lessons.js` — removed during reset.**
- `src/types/` — Shared types: `lesson.ts`, `mastery.ts`, `progress.ts`, `onboarding.ts`, `engine.ts`, `question.ts`, `quiz.ts`. Some (e.g. `question.ts`, `quiz.ts`) are vestigial — referenced by quarantined `engine/mastery.ts` and `engine/progress.ts` only.
- `src/utils/` — `greetingHelpers.ts` (`getGreetingLine1`, `getMotivationSubtitle`).
- `src/components/` — Feature components by domain: `auth/`, `feedback/`, `home/`, `monetization/`, `onboarding/` (+ `onboarding/steps/`), `shared/`, `social/`. **No `lesson/` or `quiz/` subdirectories** — they were removed during the reset.

## Data Flow

**Active lesson flow (post-reset):**

```
app/lesson/[id].tsx
  → resolveLessonId(params.id)            // "1" → "lesson-01"
  → lessonRegistry["lesson-01"]           // hand-compiled LessonData
  → <LessonRunner lesson masteryRecorder={noopMasteryRecorder} renderScreen={...} onComplete={...} />
      LessonRunner
        ├─ useState(index)
        ├─ useRef(outcomesRef: Map<screenId, ScreenOutcome>)
        ├─ advance(outcome?) → cursor.advanceCursor → masteryRecorder.recordEntityAttempt (per attempt) → onComplete(LessonOutcome) at end
        └─ renderScreen({ screen, advance, reportAttempt, goBack, ... })
              <LessonChrome>                       // header, back button, exit confirm
                screen.kind === "teach"
                  ? <TeachingScreenView blocks={...} onAdvance onPlayAudio={playByPath} />
                  : renderExercise({ exercise, ... })   // dispatches to TapExercise | HearExercise | ReadExercise (others unimplemented)
  → handleComplete(outcome)
      → asyncStorageCompletionStore.markCompleted("lesson-01")  // AsyncStorage key tila.lesson-completion.lesson-01
      → setOutcome(outcome) → renders <LessonCompletionView>
  → user taps Continue → router.replace("/(tabs)")
```

**MasteryRecorder is `noopMasteryRecorder`.** No writes to `mastery_entities`, `mastery_skills`, `mastery_confusions`, `lesson_attempts`, or `question_attempts` happen during a lesson today. The interface exists so a real SQLite-backed recorder can be wired in later without changing the runtime.

**Habit flow (independent of mastery):**

```
recordPractice() — currently NOT called by the lesson route; available on AppStateProvider + useHabit
  → db.withExclusiveTransactionAsync
      → SELECT habit row
      → compute new wird from getDayDifference(today, last_practice_date)
      → UPDATE habit SET ...
  → refresh() reloads ProgressState into React state
```

**Home → onboarding redirect:**

```
app/(tabs)/index.tsx
  → useAppState() → progress.onboarded
  → if !onboarded → router.replace("/onboarding")
  → if last practice gap >= 1 and returnHadithLastShown !== today → router.replace("/return-welcome")
  → asyncStorageCompletionStore.getCompletion("lesson-01") → toggles "Start" vs "Replay" CTA
```

**State Management:**
- Persistent: SQLite (`tila.db`) for `user_profile`, `habit`, `mastery_*`, `lesson_attempts`, `question_attempts`, `premium_lesson_grants`, `schema_version`. AsyncStorage for lesson completion + Supabase encrypted session payload. SecureStore for the AES-256 key only (32 bytes).
- React Context: `ThemeContext`, `DatabaseContext`, `AuthContext`, `SyncContext`, `SubscriptionContext`, `AppStateContext`, `SocialContext`.
- Per-route: `useState` / `useReducer` / `useRef` (e.g. `LessonRunner` uses `useRef<Map>` for outcome aggregation so re-renders don't lose outcomes mid-lesson).

## Database Tables

All tables defined in `src/db/schema.ts` (`SCHEMA_VERSION = 7`). Single-user — **no `user_id` columns** locally.

- **`user_profile`** (singleton row, `id = 1`): `onboarded`, `onboarding_version`, `starting_point`, `motivation`, `name`, `daily_goal`, `commitment_complete`, `wird_intro_seen`, `post_lesson_onboard_seen`, `return_hadith_last_shown`, `analytics_consent`, `sync_user_id`, `theme_mode`, `account_prompt_declined_at`, `created_at`, `updated_at`. Heavy CHECK constraints on enums.
- **`habit`** (singleton row, `id = 1`): `last_practice_date`, `current_wird`, `longest_wird`, `today_lesson_count`, `updated_at`. Mutated only inside `db.withExclusiveTransactionAsync`.
- **`lesson_attempts`**: `id`, `lesson_id` (INTEGER), `accuracy`, `passed`, `duration_seconds`, `attempted_at`. **Currently unwritten** by the active runtime.
- **`question_attempts`**: FK → `lesson_attempts.id`, plus `question_type`, `skill_bucket`, `target_entity`, `correct`, `selected_option`, `correct_option`, `response_time_ms`, `attempted_at`. **Currently unwritten** by the active runtime.
- **`mastery_entities`**: `entity_key` PK (`"letter:2"`, `"combo:ba-fatha"`), `correct`, `attempts`, `last_seen`, `next_review`, `interval_days`, `session_streak`. Read by `useProgress.loadProgress`. Write path quarantined — only `saveMasteryResults`/`resetProgress`/`importProgress` touch it.
- **`mastery_skills`**: `skill_key` PK (`"visual:2"`, `"sound:2"`, `"contrast:2-3"`, `"harakat:2:fatha-vs-kasra"`), `correct`, `attempts`, `last_seen`. Same read/quarantined-write status.
- **`mastery_confusions`**: `confusion_key` PK (`"recognition:2->3"`), `count`, `last_seen`, `categories` (JSON-as-text). Same read/quarantined-write status.
- **`premium_lesson_grants`**: `lesson_id` PK, `granted_at`. Used by quarantined `useCanAccessLesson`.
- **`schema_version`**: `version` PK, `applied_at`. Migrations track v1→v7 in `client.ts:runMigrations`.

**Indexes:** `idx_attempts_lesson`, `idx_attempts_date`, `idx_qa_attempt`, `idx_qa_entity`, `idx_qa_date`.

## Contexts / Providers

| Context | File | Responsibility | Notes |
|---|---|---|---|
| `DatabaseContext` | `src/db/provider.tsx` | Provides `SQLiteDatabase` instance | 15 s timeout, retry via `ErrorFallback` |
| `ThemeContext` | `src/design/theme.ts` + `app/_layout.tsx::ThemeWrapper` | `colors` + `mode` | Forced light via `useThemePreference()` stub |
| `AuthContext` | `src/auth/provider.tsx` | Supabase session, `isAnonymous` flag, `signInWith*` | Listens to `supabase.auth.onAuthStateChange` |
| `SyncContext` | `src/sync/provider.tsx` | `syncStatus`, `triggerSync()` | Foreground-trigger via RN `AppState`; skips for anonymous users |
| `SubscriptionContext` | `src/monetization/provider.tsx` | RevenueCat customer info, `showPaywall`, `stage` | **Beta stub** — `isPremiumActive: true`, no SDK calls |
| `AppStateContext` | `src/state/provider.tsx` | Aggregates `useProgress` + habit + transactional `recordPractice` | Convenience for screens; `subscription: null` (use `useSubscription` directly) |
| `SocialContext` | `src/social/provider.tsx` | Friend streaks, pending requests, invite codes | Skips for anonymous users |

`AnalyticsGate` (`src/components/shared/AnalyticsGate.tsx`) wraps `<AppNavigator />` and calls `initAnalytics(consent)` once.

## Key Abstractions

**`LessonData`** (`src/curriculum/types.ts`):
- Purpose: Hand-compiled lesson artifact. Each lesson is a TS file under `src/curriculum/lessons/`.
- Shape: `{ id, kind?: "onboarding" | "standard", phase, module, title, outcome, durationTargetSeconds, introducedEntities: EntityKey[], reviewEntities: EntityKey[], passCriteria: { threshold, requireCorrectLastTwoDecoding }, screens: Screen[], completionSubtitle?, completionGlyphs? }`.
- Authoring rule: Author the human spec at `curriculum/phase-N/<nn>-<slug>.md`, then hand-compile a sibling TS file at `src/curriculum/lessons/lesson-<nn>.ts`, register it in `src/curriculum/lessons/index.ts`, and add `src/__tests__/curriculum/lesson-<nn>-shape.test.ts`.
- See `src/curriculum/README.md` for the full authoring procedure.

**`Screen`** (`src/curriculum/types.ts`):
- Discriminated union: `TeachingScreen { kind: "teach", id, blocks: TeachingBlock[], allowBack? }` or `ExerciseScreen { kind: "exercise", id, part: "warm-recall" | "practice" | "mastery-check", exercise: Exercise, allowBack?, scored?, countsAsDecoding?, retryMode? }`.
- `scored !== false` and `countsAsDecoding === true` flags drive `computeLessonOutcome`'s pass calculation.

**`TeachingBlock`** (`src/curriculum/types.ts`):
- Composable atoms for teach screens: `text` (with `variant: "body" | "secondary"`), `heading`, `reading-direction`, `glyph-display`, `shape-variants`, `audio` (with `autoPlay?` permitted only on Teach), `name-sound-pair`, `mark-preview`.

**`Exercise`** (`src/curriculum/types.ts`):
- Union of seven types: `TapExercise`, `HearExercise`, `ChooseExercise`, `BuildExercise`, `ReadExercise`, `FixExercise`. Shared field: `target: EntityKey`. Only `tap`, `hear`, `read` have renderers today.

**`MasteryRecorder`** (`src/curriculum/runtime/mastery-recorder.ts`):
- Interface with two methods: `recordEntityAttempt(EntityAttemptEvent)`, `recordLessonOutcome(LessonOutcomeEvent)`.
- Active implementation: `noopMasteryRecorder` — logs in `__DEV__` only, returns `Promise<void>`.
- Future implementation will write to `lesson_attempts` / `question_attempts` / `mastery_*`.

**Mastery key formats** (`src/engine/mastery.ts`, quarantined):
- Entity: `"letter:<id>"`, `"combo:<name>-<harakah>"`, `"unknown:<raw>"`.
- Skill: `"visual:<id>"`, `"sound:<id>"`, `"contrast:<a>-<b>"`, `"harakat:<id>:<a>-vs-<b>"`.
- Confusion: `"recognition:<from>-><to>"`, `"sound:<from>-><to>"`, `"harakat:<from>-><to>"`.
- New curriculum may replace this scheme — `src/curriculum/types.ts` defines a richer `EntityKey` shape (`"letter:alif"`, `"combo:ba+fatha"`, `"mark:fatha"`).

## Entry Points

**Root layout** (`app/_layout.tsx`):
- Triggers: App startup.
- Responsibilities:
  1. `SplashScreen.preventAutoHideAsync()` then load Amiri/Inter/Lora fonts via `expo-font`.
  2. Wrap tree in `Sentry.ErrorBoundary` → `DatabaseProvider` → `ThemeWrapper` → `AuthProvider` → `SyncProvider` → `SubscriptionProvider` → `AppStateProvider` → `SocialProvider` → `AnalyticsGate` → `AppNavigator` (`expo-router` `Stack`).
  3. Hide splash once fonts resolve (or error).

**Tab layout** (`app/(tabs)/_layout.tsx`):
- Triggers: User reaches authenticated/onboarded state.
- Tabs: `index` (Home), `progress` (Progress placeholder).
- Tab press fires `hapticTap()`.

**Home** (`app/(tabs)/index.tsx`):
- Renders header (logo, daily goal pill, trial badge, streak badge), greeting, **Lesson 1 CTA card**.
- Reads `useAppState()` for progress + habit; reads `useSubscription()` for trial status.
- Polls `asyncStorageCompletionStore.getCompletion("lesson-01")` on focus to flip CTA between "Start" and "Replay".
- Redirects to `/onboarding` if not onboarded; to `/return-welcome` if returning after a gap.

**Lesson route** (`app/lesson/[id].tsx`):
- Param: `id` — passed through `resolveLessonId()` → canonical `"lesson-XX"`.
- Look up in `lessonRegistry`; on miss render `<LessonNotFound>`.
- Mount `<LessonRunner>` with `noopMasteryRecorder`. Wire the route's `renderScreen` to `<LessonChrome>` + `<TeachingScreenView>` / `renderExercise`.
- On complete: `asyncStorageCompletionStore.markCompleted(lessonId)` then render `<LessonCompletionView>`. Continue → `router.replace("/(tabs)")`.
- Calls `configureAudioSession()` on mount and `playByPath` for exercise/teach audio.

**Sandbox lesson** (`app/sandbox-lesson.tsx`):
- Dev-only route gated by `EXPO_PUBLIC_DEV_REFERENCE_LESSON === "true"`. Otherwise redirects to `/(tabs)`.
- Smoke-tests `LessonRunner` advance through three teach screens.
- Despite `src/curriculum/README.md` referencing `src/curriculum/reference/`, **no `reference/` directory exists** today. The sandbox lesson is defined inline in `app/sandbox-lesson.tsx`.

**Other routes:**
- `app/onboarding.tsx`, `app/return-welcome.tsx`, `app/wird-intro.tsx`, `app/auth.tsx`, `app/audio-test.tsx`, `app/+not-found.tsx`, `app/+html.tsx`.

## Error Handling

**Strategy:** Layered boundaries + result-object-returning async operations. Never let an unhandled rejection bubble.

**Patterns:**
- **Outer boundary:** `Sentry.ErrorBoundary` in `app/_layout.tsx` with `ErrorFallback` retry. Captures unhandled render errors automatically.
- **Per-screen boundary:** Home wraps its content in `react-error-boundary`'s `ErrorBoundary` with `ScreenErrorFallback` and a Sentry `onError`.
- **Database init:** `DatabaseProvider` uses an attempt-id ref + 15 s timeout to surface a retry UI rather than hang.
- **Async operations:** Auth, sync, and monetization return `{ error: Error | null }` shaped results. Sync's `syncAll` "never throws — returns errors in `SyncResult` for offline-first safety" (see `src/sync/service.ts`).
- **Transactions:** All multi-row writes use `db.withExclusiveTransactionAsync` and read fresh DB rows inside the transaction (see `useHabit.recordPractice` and `AppStateProvider.recordPractice`) to avoid stale-closure bugs.
- **Audio failures:** `playByPath` failures swallow silently in production; `__DEV__` logs.
- **Type narrowing on caught errors:** `err instanceof Error ? err : new Error(String(err))` (see `DatabaseProvider`).

## Cross-Cutting Concerns

**Logging / telemetry:**
- Sentry initialized in `src/analytics/sentry.ts` (always on — legitimate-interest crash reporting).
- PostHog initialized in `src/analytics/posthog.ts` only after explicit consent (`analytics_consent === true` in `user_profile`).
- Strict event map in `src/analytics/events.ts` — `track<E extends EventName>(event, properties)` enforces props per event. Lesson-specific events were removed during the reset; current events cover onboarding, paywall, auth, sync, mastery state changes.
- `metro.config.js` integrates Sentry source-map upload.

**Validation / safety:**
- TypeScript strict mode (`tsconfig.json: "strict": true`).
- SQLite CHECK constraints on enums + numeric ranges (see `src/db/schema.ts`).
- `resolveLessonId` rejects non-positive integers and non-canonical strings.

**Authentication & gating:**
- `AuthProvider` initializes anonymous and lets users upgrade via Supabase Apple/Google/Email.
- `SyncProvider` and `SocialProvider` skip work for anonymous users.
- Monetization is currently a beta stub (`SubscriptionProvider` returns `isPremiumActive: true`); `useCanAccessLesson` always allows.
- Account-prompt UI exists (`src/components/auth/AccountPrompt.tsx`) but its trigger list is empty (`ACCOUNT_PROMPT_LESSONS = []` in `src/auth/types.ts`).

**Audio:**
- Singleton `expo-audio` session configured once via `configureAudioSession()` (`playsInSilentMode: true`, `shouldPlayInBackground: false`).
- Per-letter pronunciation assets for letters 1–28, with 2 sound-name overrides (`thaa→tha`, `laam→lam`).
- Lesson route calls `configureAudioSession()` on mount and exposes `onPlayAudio={playByPath}` to teach blocks and exercises.

**Theming:**
- `ThemeWrapper` reads preference via `useThemePreference()` and resolves with system scheme via `resolveColors`. Currently always `"light"` per the beta stub.
- `useColors()` consumed throughout. Token sets in `src/design/tokens.ts` (light + dark both defined).

**Testing concerns:**
- Test runner: Vitest. Tests in `src/__tests__/`. Setup: `src/__tests__/setup.ts`, mocks in `src/__tests__/helpers/mock-db.ts`.
- No live React Native runtime in tests — pure-logic and contract testing only.

---

*Architecture analysis: 2026-04-27*
