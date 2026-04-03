# Codebase Structure

**Analysis Date:** 2026-04-03

## Directory Layout

```
tila-mobile/
├── app/                          # Expo Router file-based routing
│   ├── _layout.tsx               # Root layout (providers, fonts, splash)
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigator (Home, Progress)
│   │   ├── index.tsx             # Home tab (lesson grid, onboarding flows)
│   │   └── progress.tsx          # Progress tab (mastery overview, stats)
│   ├── lesson/
│   │   ├── [id].tsx              # Dynamic lesson screen (main learning UI)
│   │   └── review.tsx            # Spaced repetition review session
│   ├── onboarding.tsx            # First-time user onboarding
│   ├── return-welcome.tsx        # Returning user welcome screen
│   └── wird-intro.tsx            # Wird (daily practice) introduction
│
├── src/
│   ├── __tests__/                # Test files (Vitest)
│   │   └── [feature].test.ts
│   │
│   ├── analytics/                # Event tracking (PostHog + Sentry)
│   │   ├── events.ts             # Event type definitions
│   │   ├── index.ts              # track() export
│   │   ├── posthog.ts            # PostHog client setup
│   │   └── sentry.ts             # Sentry integration
│   │
│   ├── audio/                    # Audio player singleton
│   │   ├── index.ts              # Public exports
│   │   └── player.ts             # AudioPlayer class, playVoice, playSFX
│   │
│   ├── auth/                     # Supabase authentication
│   │   ├── provider.tsx          # AuthContext, AuthProvider
│   │   ├── hooks.ts              # useAuth() hook
│   │   ├── types.ts              # Auth types, ACCOUNT_PROMPT_LESSONS
│   │   ├── supabase.ts           # Supabase client
│   │   ├── apple.ts              # Apple Sign In
│   │   ├── google.ts             # Google Sign In
│   │   └── email.ts              # Email sign up/in
│   │
│   ├── components/               # React components by feature
│   │   ├── LessonIntro.tsx       # Lesson introduction screen
│   │   ├── LessonQuiz.tsx        # Quiz question/answer UI
│   │   ├── LessonHybrid.tsx      # Phase 4+ hybrid lesson exercises
│   │   ├── LessonSummary.tsx     # Post-lesson results screen
│   │   │
│   │   ├── auth/                 # Authentication screens
│   │   │   ├── AuthScreen.tsx
│   │   │   └── AccountPrompt.tsx
│   │   │
│   │   ├── celebrations/         # Mastery celebration animations
│   │   │   └── LetterMasteryCelebration.tsx
│   │   │
│   │   ├── exercises/            # Phase 4+ exercise components
│   │   │   ├── BuildUpReader.tsx
│   │   │   ├── ComprehensionExercise.tsx
│   │   │   ├── FreeReader.tsx
│   │   │   ├── GuidedReveal.tsx
│   │   │   ├── SpotTheBreak.tsx
│   │   │   └── TapInOrder.tsx
│   │   │
│   │   ├── feedback/             # User feedback & loading states
│   │   │   ├── AppLoadingScreen.tsx    # Initial app load
│   │   │   ├── ErrorFallback.tsx       # Global error fallback
│   │   │   ├── ScreenErrorFallback.tsx # Screen-level error
│   │   │   └── EmptyState.tsx
│   │   │
│   │   ├── home/                 # Home tab components
│   │   │   ├── LessonGrid.tsx    # Main lesson list
│   │   │   ├── HeroCard.tsx      # Streak + goal + will intro state
│   │   │   ├── JourneyNode.tsx   # Single lesson in grid
│   │   │   ├── AnimatedStreakBadge.tsx
│   │   │   └── WirdTooltip.tsx
│   │   │
│   │   ├── insights/             # Post-lesson insights
│   │   │   ├── LessonInsights.tsx
│   │   │   └── ConfusionPairsSection.tsx
│   │   │
│   │   ├── monetization/         # Subscription & paywall
│   │   │   ├── PaywallScreen.tsx
│   │   │   ├── UpgradeCard.tsx
│   │   │   └── LockIcon.tsx
│   │   │
│   │   ├── onboarding/           # Onboarding flow screens
│   │   │   └── steps/
│   │   │       ├── StartingPointStep.tsx
│   │   │       ├── MotivationStep.tsx
│   │   │       ├── DailyGoalStep.tsx
│   │   │       └── CommitmentStep.tsx
│   │   │
│   │   ├── progress/             # Progress tab components
│   │   │   ├── ProgressOverview.tsx
│   │   │   ├── MasteryChart.tsx
│   │   │   └── WeeklyStats.tsx
│   │   │
│   │   ├── quiz/                 # Quiz UI components (answer buttons, etc)
│   │   │   ├── QuestionDisplay.tsx
│   │   │   ├── OptionButton.tsx
│   │   │   └── ProgressBar.tsx
│   │   │
│   │   ├── shared/               # Shared utility components
│   │   │   ├── AnalyticsGate.tsx       # Conditional analytics wrapper
│   │   │   └── [other shared components]
│   │   │
│   │   └── social/               # Social features
│   │       ├── LeaderboardScreen.tsx
│   │       └── FriendsScreen.tsx
│   │
│   ├── data/                     # Static curriculum & letter data
│   │   ├── lessons.js            # LESSONS array (88 lessons, 4 phases)
│   │   ├── letters.js            # ARABIC_LETTERS array (28 letters)
│   │   ├── harakat.js            # Harakat marks (fatha, kasra, damma)
│   │   └── connectedForms.js     # Connected letter forms
│   │
│   ├── db/                       # SQLite database layer
│   │   ├── provider.tsx          # DatabaseContext, DatabaseProvider
│   │   ├── client.ts             # getDatabase(), runMigrations()
│   │   ├── schema.ts             # CREATE_TABLES, SCHEMA_VERSION, SEED_DEFAULTS
│   │   └── index.ts              # Re-exports
│   │
│   ├── design/                   # Design system (tokens + components)
│   │   ├── theme.ts              # ThemeContext, useColors(), resolveColors()
│   │   ├── tokens.ts             # Color palette, typography, spacing, shadows
│   │   ├── animations.ts         # Reanimated durations, easing
│   │   ├── haptics.ts            # hapticTap(), hapticSuccess()
│   │   ├── CrescentIcon.tsx      # Custom Crescent icon
│   │   ├── components/           # Shared UI components
│   │   │   ├── Button.tsx        # Primary/secondary/tertiary buttons
│   │   │   ├── Card.tsx          # Card container
│   │   │   ├── ArabicText.tsx    # RTL Arabic text with Amiri font
│   │   │   ├── HearButton.tsx    # Audio playback button
│   │   │   ├── QuizOption.tsx    # Quiz answer choice
│   │   │   └── [other design components]
│   │   └── index.ts              # Design system barrel export
│   │
│   ├── engine/                   # Pure JS learning algorithm (zero React)
│   │   ├── mastery.ts            # Entity/skill/confusion key normalization
│   │   ├── progress.ts           # Load/save progress from/to DB
│   │   ├── engagement.ts         # Completion tier (perfect, great, good, etc)
│   │   ├── insights.ts           # Extract post-lesson insights
│   │   ├── habit.ts              # Daily practice tracking
│   │   ├── outcome.ts            # Lesson pass/fail thresholds
│   │   ├── dateUtils.ts          # getTodayDateString(), date calculations
│   │   ├── selectors.ts          # planReviewSession(), selectNextLesson()
│   │   ├── unlock.ts             # Lesson unlock logic (prerequisites)
│   │   ├── features.ts           # Feature flags
│   │   ├── index.ts              # Engine barrel (empty, exports via individual imports)
│   │   └── questions/            # Question generators (by mode)
│   │       ├── index.ts          # generateLessonQuestions(), dispatcher
│   │       ├── recognition.ts    # Letter recognition questions
│   │       ├── sound.ts          # Sound/pronunciation questions
│   │       ├── contrast.ts       # Letter contrast/confusion questions
│   │       ├── harakat.ts        # Vowel mark questions
│   │       ├── checkpoint.ts     # Phase checkpoints
│   │       ├── review.ts         # Spaced repetition review
│   │       ├── connectedForms.ts # Connected letter forms (Phase 4)
│   │       ├── connectedReading.ts # Connected text reading (Phase 4)
│   │       ├── shared.ts         # shuffle(), pickRandom(), filterValidQuestions()
│   │       └── explanations.ts   # Error explanations for feedback
│   │
│   ├── hooks/                    # React hooks (data bridge layer)
│   │   ├── useProgress.ts        # Load progress, complete lesson
│   │   ├── useLessonQuiz.ts      # Quiz state management
│   │   ├── useMastery.ts         # Mastery state queries
│   │   ├── useHabit.ts           # Daily practice tracking
│   │   └── useThemePreference.ts # Load theme from user_profile
│   │
│   ├── lib/                      # Low-level utilities
│   │   └── [utility functions]
│   │
│   ├── monetization/             # RevenueCat subscription
│   │   ├── provider.tsx          # SubscriptionContext, SubscriptionProvider
│   │   ├── revenuecat.ts         # initRevenueCat(), getCustomerInfo()
│   │   ├── hooks.ts              # useSubscription(), useCanAccessLesson()
│   │   ├── paywall.ts            # Paywall messaging
│   │   └── analytics.ts          # Subscription event tracking
│   │
│   ├── social/                   # Friend sync, leaderboards
│   │   ├── provider.tsx          # SocialContext, SocialProvider
│   │   ├── friends.ts            # Friend syncing logic
│   │   └── [social features]
│   │
│   ├── state/                    # App-wide state aggregation
│   │   ├── provider.tsx          # AppStateContext, AppStateProvider
│   │   ├── types.ts              # AppStateContextValue, AppState types
│   │   └── [state management]
│   │
│   ├── sync/                     # Cloud sync (Supabase)
│   │   ├── provider.tsx          # SyncContext, SyncProvider
│   │   ├── service.ts            # syncAll() function (push/pull)
│   │   ├── types.ts              # SyncState, SyncContextValue
│   │   └── [sync utilities]
│   │
│   ├── types/                    # Shared type definitions
│   │   ├── engine.ts             # MasteryLevel, ErrorCategory, Harakah, etc
│   │   ├── lesson.ts             # Lesson interface
│   │   ├── question.ts           # Question, QuestionOption interfaces
│   │   ├── quiz.ts               # QuizResultItem, QuestionAttempt
│   │   ├── mastery.ts            # Mastery-related types
│   │   ├── progress.ts           # Progress state types
│   │   ├── onboarding.ts         # Onboarding flow types
│   │   └── [domain-specific types]
│   │
│   └── utils/                    # Helper functions
│       ├── [string utilities]
│       ├── [array utilities]
│       └── [other helpers]
│
├── assets/                       # Static assets
│   ├── fonts/                    # Amiri, Inter, Lora fonts
│   ├── audio/
│   │   ├── effects/              # SFX (correct, wrong, completion)
│   │   ├── names/                # Per-letter pronunciation (28 letters × 2 variants)
│   │   └── sounds/               # [additional audio]
│   ├── images/                   # App images
│   └── logo/                     # Logo variants
│
├── docs/                         # Documentation
│   ├── superpowers/              # GSD planning artifacts
│   │   ├── plans/
│   │   └── specs/
│   └── github-pages/             # Markdown docs (for deployment)
│
├── .planning/                    # GSD planning directory
│   └── codebase/                 # Codebase analysis docs (ARCHITECTURE.md, STRUCTURE.md, etc)
│
├── .claude/                      # Claude Code workspace files
├── .vscode/                      # VS Code settings
├── compare/                      # Comparison assets (migration reference)
├── coverage/                     # Test coverage reports
├── node_modules/                 # Dependencies
│
├── app.json                      # Expo app config
├── eas.json                      # EAS Build config (cloud builds)
├── tsconfig.json                 # TypeScript config (@/* alias)
├── package.json                  # Dependencies, scripts
├── package-lock.json             # Lock file
└── [other config files]
```

## Directory Purposes

**`app/`:**
- Purpose: Expo Router routing and screen layouts
- Contains: _layout.tsx (root), (tabs)/ (tab navigator), lesson/ (dynamic screens), onboarding screens
- Key files: `app/_layout.tsx` (app initialization), `app/(tabs)/_layout.tsx` (tab setup), `app/lesson/[id].tsx` (main lesson flow)

**`src/engine/`:**
- Purpose: Pure JavaScript business logic with zero React dependencies
- Contains: Question generators, mastery state machine, engagement scoring, habit tracking, progress persistence
- Key files: `src/engine/questions/index.ts` (dispatcher), `src/engine/mastery.ts` (mastery state), `src/engine/progress.ts` (load/save)
- Design: Portable, testable, can be extracted to shared package or backend

**`src/components/`:**
- Purpose: React UI components organized by feature domain
- Contains: Lesson screens (Intro, Quiz, Hybrid, Summary), onboarding flows, progress tabs, exercises, auth screens
- Naming: Feature-organized (auth/, home/, progress/, quiz/, etc), not atomic (no Buttons/ directory)

**`src/hooks/`:**
- Purpose: Bridge between UI components and engine/database
- Contains: State management hooks that load from DB, call engine functions, save results
- Pattern: Each hook has side effects (DB reads/writes), returns state + callbacks

**`src/db/`:**
- Purpose: SQLite initialization, schema, migrations
- Contains: Database connection, table creation, migration runners, React provider
- Key functions: `getDatabase()` (lazy singleton), `runMigrations()` (version-based migrations)

**`src/design/`:**
- Purpose: Design system (tokens + shared components)
- Contains: Theme context, color/typography/spacing tokens, shared UI components
- Pattern: Components import tokens directly, use `useColors()` for dynamic theming

**`src/auth/`:**
- Purpose: Supabase authentication (Apple/Google/Email) with anonymous fallback
- Contains: Auth provider, sign-in methods, user session management
- Key: Anonymous users can use app offline; signed-in users get sync + premium

**`src/sync/`:**
- Purpose: Bi-directional cloud sync with Supabase
- Contains: Sync provider, push/pull service
- Constraint: Skipped for anonymous users (no cloud account)

**`src/monetization/`:**
- Purpose: RevenueCat subscription + paywall
- Contains: Subscription provider, customer info checks, paywall UI, analytics
- Key: FREE_LESSON_CUTOFF = 6, premium lessons locked after lesson 6

**`src/data/`:**
- Purpose: Static curriculum and Arabic letter data
- Contains: LESSONS array (88 lessons × 4 phases), ARABIC_LETTERS array (28 letters), harakat marks
- Format: .js files (not .ts) to preserve original data structure

**`src/analytics/`:**
- Purpose: Event tracking (PostHog + Sentry error reporting)
- Contains: Event type definitions, track() function, provider setup
- Pattern: Strict TypeScript event map prevents invalid event names

**`src/audio/`:**
- Purpose: Audio playback (SFX + per-letter pronunciation)
- Contains: Singleton AudioPlayer, playVoice(), playSFX() functions
- Assets: 28 letter name pronunciations, 2-4 variants per letter + SFX (correct, wrong, complete)

**`src/social/`:**
- Purpose: Friend sync, leaderboards
- Contains: Friend syncing, leaderboard queries
- Backend: Supabase (read/write friends, leaderboard views)

**`src/state/`:**
- Purpose: App-wide state aggregation
- Contains: AppStateProvider, combines progress + habit + subscription for consumers
- Pattern: Convenience layer; consumers typically use hooks directly (useProgress, useHabit, useSubscription)

**`src/types/`:**
- Purpose: Shared type definitions
- Contains: engine.ts (learning types), lesson.ts, question.ts, quiz.ts, and other domain types
- Pattern: File-local types stay in their modules; only cross-cutting types live here

## Key File Locations

**Entry Points:**
- `app/_layout.tsx`: App startup (fonts, providers, splash)
- `app/(tabs)/_layout.tsx`: Tab navigator setup
- `app/(tabs)/index.tsx`: Home tab (lesson grid, onboarding)
- `app/lesson/[id].tsx`: Main learning screen (80+ lines of state management)

**Configuration:**
- `app.json`: Expo app name, version, plugins
- `eas.json`: EAS Build profiles (dev, preview, production)
- `tsconfig.json`: TypeScript config, @/* alias
- `package.json`: Dependencies, test/lint scripts

**Core Logic:**
- `src/engine/questions/index.ts`: Question generation dispatcher
- `src/engine/progress.ts`: Progress load/save functions
- `src/engine/mastery.ts`: Mastery state machine
- `src/db/client.ts`: Database initialization & migrations
- `src/db/schema.ts`: SQLite schema version 7

**Design System:**
- `src/design/theme.ts`: ThemeContext, useColors() hook
- `src/design/tokens.ts`: Color palette, typography, spacing
- `src/design/components/`: Button, Card, ArabicText, QuizOption, HearButton

**Testing:**
- `src/__tests__/`: Test files (Vitest)
- `vitest.config.ts` (if exists): Vitest config (see package.json for test command)

## Naming Conventions

**Files:**
- Screens: PascalCase + optional domain prefix (e.g., `LessonIntro.tsx`, `AuthScreen.tsx`)
- Components: PascalCase (e.g., `Button.tsx`, `Card.tsx`)
- Hooks: camelCase, prefixed with `use` (e.g., `useProgress.ts`, `useLessonQuiz.ts`)
- Utilities: camelCase (e.g., `dateUtils.ts`, `haptics.ts`)
- Tests: `[feature].test.ts` or `[feature].spec.ts` (Vitest)

**Directories:**
- Feature directories: lowercase plural (e.g., `components/exercises/`, `src/hooks/`, `src/questions/`)
- Grouped features: parentheses for layout groups in Expo Router (e.g., `app/(tabs)/`)

**Identifiers:**
- React components: PascalCase (e.g., `LessonGrid`, `QuizOption`)
- Functions: camelCase (e.g., `calculateAccuracy`, `generateQuestions`)
- Variables: camelCase (e.g., `currentQuestion`, `isComplete`)
- Constants: UPPER_SNAKE_CASE (e.g., `FREE_LESSON_CUTOFF`, `SCHEMA_VERSION`)
- Types/Interfaces: PascalCase (e.g., `Question`, `Lesson`, `ProgressState`)

**Database:**
- Table names: snake_case (e.g., `user_profile`, `lesson_attempts`, `mastery_entities`)
- Column names: snake_case (e.g., `created_at`, `interval_days`, `session_streak`)
- Entity keys: colon-separated (e.g., `"letter:2"`, `"combo:ba-fatha"`)
- Skill keys: colon-separated (e.g., `"visual:2"`, `"sound:2"`, `"harakat:2:fatha-vs-kasra"`)

## Where to Add New Code

**New Feature (domain-specific):**
- Implementation: Create directory in `src/components/[feature]/` with components
- Hooks: Add to `src/hooks/use[Feature].ts` if state management needed
- Types: Add to `src/types/[feature].ts`
- Tests: Create `src/__tests__/[feature].test.ts`
- Example: Adding leaderboard feature
  - Components: `src/components/social/Leaderboard.tsx`
  - Hook: `src/hooks/useLeaderboard.ts`
  - Types: `src/types/social.ts`

**New Question Mode (if adding to curriculum):**
- Generator: `src/engine/questions/[mode].ts`
- Add to dispatcher in `src/engine/questions/index.ts`
- Register in `generateLessonQuestions()` function
- Add test in `src/__tests__/questions.test.ts`

**New Database Table:**
- Schema: Add CREATE TABLE in `src/db/schema.ts`
- Increment SCHEMA_VERSION
- Add migration in `src/db/client.ts` (runMigrations function)
- Type: Define in `src/types/engine.ts` or domain-specific type file

**Utilities/Helpers:**
- Shared utilities: `src/utils/[category].ts`
- Engine utilities: `src/engine/[name].ts` (if business logic)
- Design system utilities: `src/design/[name].ts`

**Tests:**
- Vitest test files live in `src/__tests__/` with same name as module
- Pattern: `module.test.ts` (not `module.spec.ts`)
- Run: `npm test` or `npm test -- --watch`

## Special Directories

**`assets/`:**
- Purpose: Bundled static assets (fonts, audio, images)
- Generated: No
- Committed: Yes (audio SFX bundled, pronunciation assets bundled)
- Audio: Per-letter pronunciation files imported at build time; SFX bundled in app

**`docs/superpowers/`:**
- Purpose: GSD planning artifacts (plans, specs, phase docs)
- Generated: Yes (created during planning)
- Committed: Yes (consumed by next phases)

**`.planning/codebase/`:**
- Purpose: Codebase analysis documents (ARCHITECTURE.md, STRUCTURE.md, etc)
- Generated: Yes (by codebase mappers)
- Committed: Yes (referenced by plan/execute commands)

**`coverage/`:**
- Purpose: Test coverage reports
- Generated: Yes (by `npm test -- --coverage` or CI)
- Committed: No (git-ignored)

**`dist/`:**
- Purpose: Build output (Expo bundled assets)
- Generated: Yes (by `expo build` or EAS)
- Committed: No (git-ignored)

**`.claude/`:**
- Purpose: Claude Code worktrees and session state
- Generated: Yes (by Claude Code)
- Committed: No (git-ignored locally, tracked in worktrees subdirs)

---

*Structure analysis: 2026-04-03*
