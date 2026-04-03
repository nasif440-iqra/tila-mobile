# Architecture

**Analysis Date:** 2026-04-03

## Pattern Overview

**Overall:** Layered mobile app with offline-first SQLite persistence, pure JS business logic, and React-based UI.

**Key Characteristics:**
- Single-user, offline-first architecture with optional cloud sync layer (Supabase)
- Clear separation: Engine (pure business logic) → Hooks (data bridge) → Components (UI)
- SQLite as single source of truth for learning state (no Redux/Zustand)
- Provider-based context for theme, database, auth, sync, subscription, state
- File-based routing (Expo Router) with dynamic lesson screens
- No React dependencies in engine layer allows portable business logic

## Layers

**Engine Layer (`src/engine/*`):**
- Purpose: Pure JavaScript learning algorithm, mastery state machine, habit tracking, engagement scoring
- Location: `src/engine/`
- Contains: mastery.ts, progress.ts, engagement.ts, insights.ts, habit.ts, outcome.ts, questions/
- Depends on: Nothing (pure JS, zero React)
- Used by: Hooks layer (via `useLessonQuiz`, `useProgress`, `useMastery`, `useHabit`)
- Exports: Question generators, mastery updaters, progress loaders, engagement tiers

**Data Layer (`src/db/*`):**
- Purpose: SQLite client, schema management, database provider
- Location: `src/db/`
- Contains: client.ts (connection, migrations), schema.ts (CREATE TABLE, versions), provider.tsx (React context), index.ts
- Depends on: expo-sqlite, data migrations are run on app startup
- Used by: All hooks, providers, sync service
- Exports: useDatabase() hook, getDatabase() function, DatabaseProvider wrapper

**Hook Layer (`src/hooks/*`):**
- Purpose: Bridge between UI and engine; loads DB state, calls engine, saves results
- Location: `src/hooks/`
- Contains: useLessonQuiz, useProgress, useMastery, useHabit, useThemePreference
- Depends on: Database provider, engine layer
- Used by: Feature components (LessonScreen, progress components)
- Exports: Stateful quiz/progress management with side effects

**Component Layer:**
- **Feature components** (`src/components/`): Domain-organized components (exercises/, home/, onboarding/, progress/, quiz/, auth/, social/)
- **Design system** (`src/design/`): Theme context, tokens (colors, typography, spacing), shared components (Button, Card, ArabicText)
- **Layout** (`app/`): Expo Router file structure with _layout.tsx (root, tabs), dynamic lesson screen

**Supporting Layers:**
- **Analytics** (`src/analytics/`): PostHog + Sentry event tracking with strict TypeScript event map
- **Audio** (`src/audio/`): Singleton audio player with bundled SFX and per-letter pronunciation
- **Auth** (`src/auth/`): Supabase auth (Apple/Google/Email) with anonymous fallback
- **Sync** (`src/sync/`): Cloud sync service (pushes/pulls to Supabase)
- **Monetization** (`src/monetization/`): RevenueCat subscription handling + paywall
- **State** (`src/state/`): App-wide state aggregation (progress + habit + subscription)
- **Social** (`src/social/`): Friend sync, leaderboards via Supabase
- **Types** (`src/types/`): Shared type definitions (engine.ts, lesson.ts, question.ts, quiz.ts, etc.)
- **Data** (`src/data/`): Static curriculum (lessons.js, letters.js, harakat.js, connectedForms.js)
- **Utils** (`src/utils/`): Helper functions

## Data Flow

**Lesson Completion Flow:**

1. User taps answer in `LessonQuiz` component
2. `useLessonQuiz` hook records result locally, updates UI (streak, progress bar)
3. When lesson complete, `useProgress.completeLesson()` is called
4. Hook opens exclusive transaction via `db.withExclusiveTransactionAsync()`
5. Inside transaction:
   - Writes lesson_attempts row
   - Writes question_attempts rows (one per question)
   - Calls `loadProgress()` to get fresh mastery state
   - Calls `mergeQuizResultsIntoMastery()` from engine (pure function)
   - Persists mastery entities/skills/confusions back to SQLite
   - Writes habit updates (streak, today_lesson_count)
6. Transaction commits atomically
7. Component receives updated mastery state
8. UI renders LessonSummary with insights

**State Management:**

All persistent state lives in SQLite tables:
- `user_profile`: Onboarding flags, theme preference, sync user ID
- `lesson_attempts`: Lesson completion records
- `question_attempts`: Per-question correctness tracking
- `mastery_entities`: Letter/combo mastery (entity_key, correct, attempts, interval_days, session_streak, next_review)
- `mastery_skills`: Skill tracking (skill_key, correct, attempts)
- `mastery_confusions`: Letter confusion pairs (confusion_key, count, last_seen)
- `habit`: Daily practice streak (last_practice_date, current_wird, longest_wird, today_lesson_count)
- `premium_lesson_grants`: Unlocked premium lessons (lesson_id, granted_at)

React context is used only for:
- **ThemeContext**: colors, mode (light/dark) — reads theme_mode from user_profile on startup
- **DatabaseContext**: SQLite instance reference
- **AuthContext**: Current user session (Supabase)
- **SyncContext**: Sync status, last sync timestamp
- **SubscriptionContext**: Cached RevenueCat customer info
- **AppStateContext**: Aggregates progress + habit + subscription (convenience layer)

No Redux, Zustand, or client-side state managers. All state flows from SQLite.

## Key Abstractions

**Question Generator System:**
- Purpose: Generate quiz questions by lesson mode (recognition, sound, contrast, harakat, checkpoint, review, connected-forms, connected-reading)
- Examples: `src/engine/questions/recognition.ts`, `src/engine/questions/harakat.ts`
- Pattern: Each generator receives a Lesson + progress object, returns Question[] array
- Dispatcher: `generateLessonQuestions()` in `src/engine/questions/index.ts` routes by `lesson.lessonMode`
- Types: Question, QuestionOption defined in `src/types/question.ts`

**Mastery State Machine:**
- Purpose: Track letter/combo learning progression (not_started → introduced → unstable → accurate → retained)
- Pattern: Entity key normalization ("letter:2", "combo:ba-fatha") → skill key derivation (visual, sound, harakat) → confusion pair tracking
- Key functions: `normalizeEntityKey()`, `deriveSkillKeysFromQuestion()`, `mergeQuizResultsIntoMastery()` in `src/engine/mastery.ts`
- Integration: Questions report targetId; results flow through mastery state update in hook

**Spaced Repetition:**
- Purpose: Schedule next review via interval_days and next_review columns
- Pattern: After correct answer, interval_days increases exponentially; next_review is calculated timestamp
- Location: Review logic in `src/engine/selectors.ts` (planReviewSession), update logic in `src/engine/progress.ts`

**Engagement Scoring:**
- Purpose: Determine completion tier (firstLesson, perfect, great, good, struggling, harakatPerfect, harakatGreat, harakatStruggling)
- Location: `src/engine/engagement.ts`
- Used for: Post-lesson celebration messaging, habit encouragement

**Insights Generation:**
- Purpose: Extract per-lesson insights (confused pairs, weak skills, mastered letters)
- Location: `src/engine/insights.ts`
- Used for: LessonSummary display to user

## Entry Points

**App Root Layout (`app/_layout.tsx`):**
- Location: `app/_layout.tsx`
- Triggers: App startup
- Responsibilities:
  - Load fonts (Amiri, Inter, Lora)
  - Initialize RevenueCat subscription SDK
  - Wrap app in DatabaseProvider (initializes SQLite)
  - Wrap in ThemeWrapper (loads theme preference from DB)
  - Wrap in nested providers (Auth, Sync, Subscription, AppState, Social)
  - Show Sentry error boundary
  - Show analytics gate
  - Control splash screen lifecycle

**Tab Navigator (`app/(tabs)/_layout.tsx`):**
- Location: `app/(tabs)/_layout.tsx`
- Triggers: User reaches authenticated state
- Responsibilities:
  - Define two tabs: Home (index) and Progress
  - Configure tab styling (colors from theme context)
  - Attach haptic feedback to tab presses

**Home Tab (`app/(tabs)/index.tsx`):**
- Renders lesson grid (LessonGrid component)
- Shows hero card with streak info, daily goal, will intro state
- Conditionally shows onboarding flows (onboarding.tsx, return-welcome.tsx, wird-intro.tsx)

**Lesson Screen (`app/lesson/[id].tsx`):**
- Location: `app/lesson/[id].tsx`
- Param: lesson ID (routed from LessonGrid)
- Responsibilities:
  - Load lesson from LESSONS array
  - Check subscription (paywall for premium lessons)
  - Manage lesson flow: intro → quiz → mastery-celebration → summary
  - Call `useProgress.completeLesson()` to persist results
  - Track analytics events
  - Generate post-lesson insights
  - Render appropriate component per stage (LessonIntro, LessonQuiz, LessonHybrid, LessonSummary)

**Review Screen (`app/lesson/review.tsx`):**
- Dedicated screen for spaced repetition review sessions
- Calls `planReviewSession()` engine function to build review queue

## Error Handling

**Strategy:** Multi-layered error recovery with user-facing fallback UI

**Patterns:**

1. **Database Initialization:**
   - DatabaseProvider shows `AppLoadingScreen` while DB connects
   - On timeout (15s) or error: shows `ErrorFallback` with "Retry" button
   - Migrations run with PRAGMA table_info checks before ALTER TABLE (prevents "column already exists" errors)
   - All schema changes are idempotent (IF NOT EXISTS guards)

2. **Screen-Level Errors:**
   - `LessonScreen` wraps content in `<ErrorBoundary>` → shows `ScreenErrorFallback`
   - Error boundary catches render errors, allows user to navigate back

3. **Sentry Error Boundary:**
   - Root `_layout.tsx` wraps entire app in `Sentry.ErrorBoundary`
   - Unhandled errors logged to Sentry, user sees `ErrorFallback` with retry

4. **Promise Rejections:**
   - Audio playback: `playVoice()` is async, callers must try/catch
   - Database transactions: errors in `withExclusiveTransactionAsync()` roll back cleanly
   - Sync service: errors tracked in sync state, user shown toast/banner

5. **Graceful Degradation:**
   - Missing question generation: `filterValidQuestions()` replaces failures with fallbacks
   - Offline subscription checks: RevenueCat SDK returns cached CustomerInfo, defaults to free tier
   - Audio asset not found: `playVoice()` catch block prevents crash, logs to console

## Cross-Cutting Concerns

**Logging:**
- PostHog event tracking: `track('event_name', { custom_data })` from `src/analytics/index.ts`
- Event map defined in `src/analytics/events.ts` with strict TypeScript types
- Sentry error capture: automatic via error boundaries + manual `captureException()`
- Console logging: debug-friendly, no sensitive data

**Validation:**
- Question generation: `filterValidQuestions()` validates each question, logs failures
- Entity keys: `normalizeEntityKey()` handles edge cases (letter IDs, combo IDs, harakat strings)
- API responses: Supabase types are checked at compile time (TypeScript)

**Authentication:**
- Supabase session management in `AuthProvider`
- Anonymous users bypass sync and premium features
- Signed-in users trigger sync on app foreground (AppState listener)
- RevenueCat checks subscription status independently (no server call on offline)

**Transactions:**
- All multi-table writes wrapped in `db.withExclusiveTransactionAsync()`
- Examples: Lesson completion (attempt + questions + mastery), sync pushes
- Ensures atomicity: either all writes succeed or none are persisted

---

*Architecture analysis: 2026-04-03*
