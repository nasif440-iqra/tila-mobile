# Architecture

**Analysis Date:** 2026-03-28

## Pattern Overview

**Overall:** Layered architecture with strict unidirectional data flow: Screens -> Hooks -> Engine -> SQLite.

**Key Characteristics:**
- **Offline-first**: All state persisted in local SQLite. No remote API for learning data.
- **Engine/UI separation**: `src/engine/` contains pure JS logic with zero React dependencies. All learning algorithms, mastery calculations, question generation, and unlock logic live here.
- **Hook bridge pattern**: `src/hooks/` contains thin React hooks that wire engine logic to the database and expose it to screens.
- **No global state library**: No Redux, Zustand, or MobX. React Context is used only for two concerns: theme (`ThemeContext`) and database access (`DatabaseContext`).
- **File-based routing**: Expo Router maps `app/` directory to screens. Navigation is URL-based.

## Layers

**Routing / Screens (app/):**
- Purpose: Screen-level components, navigation configuration, Expo Router layouts
- Location: `app/`
- Contains: Root layout, tab navigator, dynamic lesson screens, flow screens (onboarding, return-welcome, etc.)
- Depends on: `src/hooks/`, `src/components/`, `src/design/`, `src/data/`, `src/engine/selectors`, `src/analytics/`
- Used by: Expo Router (entry point)

**Components (src/components/):**
- Purpose: Reusable UI components organized by feature domain
- Location: `src/components/`
- Contains: Feature components for exercises, home screen, onboarding, progress, quiz. Also top-level lesson wrappers (`LessonQuiz.tsx`, `LessonHybrid.tsx`, `LessonIntro.tsx`, `LessonSummary.tsx`).
- Depends on: `src/design/`, `src/hooks/`, `src/engine/`, `src/data/`, `src/analytics/`
- Used by: Screen files in `app/`

**Design System (src/design/):**
- Purpose: Shared visual foundation - tokens, theme, and primitive UI components
- Location: `src/design/`
- Contains: Color tokens (light + dark), typography presets, spacing scale, shadow definitions, primitive components (ArabicText, Button, Card, HearButton, QuizOption)
- Depends on: Nothing (leaf layer)
- Used by: All UI code across `app/` and `src/components/`

**Hooks (src/hooks/):**
- Purpose: Bridge between React UI and pure engine logic. Load from DB, call engine, save results.
- Location: `src/hooks/`
- Contains: `useProgress.ts`, `useMastery.ts`, `useHabit.ts`, `useLessonQuiz.ts`, `useLessonHybrid.ts`
- Depends on: `src/db/provider`, `src/engine/`
- Used by: Screen files and components

**Engine (src/engine/):**
- Purpose: Pure JavaScript business logic with zero React/RN dependencies. Core learning algorithm.
- Location: `src/engine/`
- Contains: Question generation, mastery state machine, SRS scheduling, habit tracking, engagement scoring, lesson unlock logic, review planning, selectors
- Depends on: `src/data/` (static curriculum data only)
- Used by: `src/hooks/`, some screen files directly for selectors

**Database (src/db/):**
- Purpose: SQLite schema, connection management, React context provider
- Location: `src/db/`
- Contains: Schema definition, migrations, singleton client, DatabaseProvider/useDatabase
- Depends on: `expo-sqlite`
- Used by: `src/hooks/`, `src/engine/progress.ts`

**Data (src/data/):**
- Purpose: Static curriculum content - lesson definitions, Arabic letter metadata, harakat data, connected forms
- Location: `src/data/`
- Contains: `lessons.js`, `letters.js`, `harakat.js`, `connectedForms.js`
- Depends on: Nothing (leaf layer)
- Used by: `src/engine/`, screen files, components

**Analytics (src/analytics/):**
- Purpose: Typed event tracking via PostHog + error monitoring via Sentry
- Location: `src/analytics/`
- Contains: `index.ts` (facade), `events.ts` (typed event map), `posthog.ts`, `sentry.ts`
- Depends on: PostHog SDK, Sentry SDK
- Used by: Screen files, root layout

**Audio (src/audio/):**
- Purpose: Audio playback for letter pronunciations and SFX
- Location: `src/audio/`
- Contains: `player.ts` (singleton player), `index.ts` (asset registry for 28 Arabic letters)
- Depends on: `expo-audio`, bundled assets in `assets/audio/`
- Used by: Components that play audio (HearButton, quiz screens)

## Data Flow

**Lesson Completion Flow:**

1. User answers questions in `LessonQuiz` or `LessonHybrid` component
2. `useLessonQuiz` / `useLessonHybrid` hook manages quiz state (questions, index, streak, results) in local React state
3. On quiz complete, `app/lesson/[id].tsx` calls `progress.completeLesson()` from `useProgress` hook
4. `completeLesson()` calls `saveCompletedLesson()` + `saveQuestionAttempts()` in `src/engine/progress.ts`
5. These write directly to SQLite via `expo-sqlite` (`lesson_attempts` + `question_attempts` tables)
6. Hook calls `refresh()` to reload all progress state from DB
7. Screen navigates to summary or transient screen based on post-lesson logic

**App Initialization Flow:**

1. `app/_layout.tsx` (root layout) runs first
2. Loads fonts via `useFonts()`, prevents splash screen auto-hide
3. Initializes analytics (`initAnalytics()` -> PostHog + Sentry)
4. Tracks install date in SecureStore
5. Wraps app in `ThemeContext.Provider` -> `DatabaseProvider`
6. `DatabaseProvider` opens SQLite DB, runs migrations, renders children when ready
7. Tab navigator renders, `HomeScreen` loads progress via `useProgress()`
8. If not onboarded, redirects to `/onboarding`

**Question Generation Flow:**

1. Screen provides lesson object to quiz hook
2. Hook calls `generateLessonQuestions(lesson, progress)` from `src/engine/questions/index.js`
3. Dispatcher routes to mode-specific generator based on `lesson.lessonMode`:
   - `recognition` -> `src/engine/questions/recognition.js`
   - `sound` -> `src/engine/questions/sound.js`
   - `contrast` -> `src/engine/questions/contrast.js`
   - `harakat` / `harakat-intro` / `harakat-mixed` -> `src/engine/questions/harakat.js`
   - `checkpoint` -> `src/engine/questions/checkpoint.js`
   - `review` -> `src/engine/questions/review.js`
   - `connected-forms` -> `src/engine/questions/connectedForms.js`
   - `connected-reading` -> `src/engine/questions/connectedReading.js`
4. Generator produces array of question objects; `filterValidQuestions()` validates output
5. Hook iterates through questions, recycling wrong answers once by appending shuffled copies

**State Management:**
- All persistent state lives in SQLite (single-user, no user_id columns)
- React state is used only for ephemeral UI state (current question index, quiz results, animation flags)
- `useProgress()` is the primary data gateway - loads all progress state in one parallel query batch
- No cross-component shared state except ThemeContext and DatabaseContext

## Key Abstractions

**ProgressState (src/engine/progress.ts):**
- Purpose: Complete snapshot of user's learning state loaded from SQLite
- Contains: `completedLessonIds`, `mastery` (entities/skills/confusions), `habit`, onboarding flags
- Pattern: Loaded once via `loadProgress()`, refreshed after writes via `refresh()` callback

**Mastery System (src/engine/mastery.js):**
- Purpose: Tracks per-letter and per-combo learning proficiency with SRS scheduling
- Entity keys: `"letter:2"`, `"combo:ba-fatha"`
- Skill keys: `"visual:2"`, `"sound:2"`, `"contrast:2-3"`
- Confusion keys: `"recognition:2->3"`, `"harakat:ba-fatha->ba-kasra"`
- States: `introduced` -> `unstable` -> `accurate` -> `retained`
- SRS intervals: {streak 1: 1 day, 2: 3 days, 3: 7 days, 4: 14 days}

**Lesson Model (src/data/lessons.js):**
- Purpose: Static curriculum definition
- Each lesson has: `id`, `phase` (1-4), `lessonMode`, `title`, `teachIds` (new letters), `reviewIds` (review letters)
- Organized into 4 phases: Letter Recognition, Letter Sounds, Harakat, Connected Forms
- `lessonType: "hybrid"` triggers the hybrid exercise framework instead of standard quiz

**Unlock Logic (src/engine/unlock.js):**
- Purpose: Determines which lessons/phases are available based on completion + mastery
- Within a phase: sequential unlock (must complete previous lesson)
- Phase transitions: requires completion threshold count + 70% of taught letters at "accurate" or "retained" mastery

## Entry Points

**Root Layout (`app/_layout.tsx`):**
- Triggers: App launch
- Responsibilities: Font loading, splash screen, analytics init, ThemeContext + DatabaseProvider wrapping, Stack navigator config

**Home Screen (`app/(tabs)/index.tsx`):**
- Triggers: Tab navigation, app open (after onboarding)
- Responsibilities: Show lesson grid, wird streak, hero card. Redirects to onboarding or return-welcome if needed.

**Lesson Screen (`app/lesson/[id].tsx`):**
- Triggers: `router.push({ pathname: '/lesson/[id]', params: { id } })`
- Responsibilities: Orchestrates lesson flow through 3 stages: intro -> quiz -> summary. Handles quiz completion, lesson saving, habit tracking, analytics, and post-lesson routing.

**Review Screen (`app/lesson/review.tsx`):**
- Triggers: Navigation from home screen review CTA
- Responsibilities: Builds review lesson payload from mastery state, runs quiz, saves results

## Error Handling

**Strategy:** Minimal - mostly crash-through with try/catch at integration boundaries

**Patterns:**
- DB initialization catches migration errors silently (columns may already exist)
- Analytics init wrapped in try/catch with console.warn fallback
- `useDatabase()` throws if called outside `DatabaseProvider`
- Question generation has `filterValidQuestions()` safeguard that replaces broken questions with fallbacks
- No global error boundary component detected

## Cross-Cutting Concerns

**Logging:** `console.warn` only for analytics init failures. No structured logging framework.

**Validation:** SQLite CHECK constraints on all tables enforce data integrity at the storage layer. No runtime validation layer in application code.

**Authentication:** None - single-user local-only app. No auth provider or user identity system.

**Navigation Guards:** Conditional redirects in `HomeScreen` useEffect handle onboarding and return-welcome flows. No centralized navigation guard system.

**Haptics:** Tab press haptic feedback via `expo-haptics` in tab layout.

**Animations:** `react-native-reanimated` FadeIn/FadeOut for screen transitions. Transition timing constants in `src/components/onboarding/animations.ts`.

---

*Architecture analysis: 2026-03-28*
