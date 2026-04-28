# Codebase Structure

**Analysis Date:** 2026-04-27

## Directory Layout

```
tila-mobile/
├── app/                          # Expo Router file-based routes
│   ├── _layout.tsx               # Root: fonts, providers, error boundary
│   ├── +html.tsx                 # Web SSR shell (web target only)
│   ├── +not-found.tsx            # 404 fallback
│   ├── audio-test.tsx            # Dev route: audio playback smoke test
│   ├── auth.tsx                  # Sign-in screen
│   ├── onboarding.tsx            # First-run onboarding flow host
│   ├── return-welcome.tsx        # Returning-user hadith / re-entry screen
│   ├── sandbox-lesson.tsx        # Dev-only LessonRunner smoke test (env-flag gated)
│   ├── wird-intro.tsx            # Streak / wird intro flow
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigator (Home, Progress)
│   │   ├── index.tsx             # Home: greeting + Lesson 1 CTA card
│   │   └── progress.tsx          # Progress placeholder ("coming with curriculum update")
│   └── lesson/
│       └── [id].tsx              # Active lesson route — hosts LessonRunner
│
├── src/
│   ├── analytics/                # PostHog + Sentry telemetry with strict event map
│   │   ├── events.ts             # Typed EventMap (onboarding, paywall, auth, sync, mastery)
│   │   ├── index.ts              # initAnalytics, track<E>, identify, flush
│   │   ├── posthog.ts            # PostHog client init + access
│   │   └── sentry.ts             # Sentry init + setSentryUser
│   │
│   ├── audio/                    # expo-audio singleton + per-letter asset map
│   │   ├── index.ts              # Re-exports
│   │   └── player.ts             # configureAudioSession, createAudioPlayer, playByPath, letter→file map
│   │
│   ├── auth/                     # Supabase Auth (Apple, Google, Email) + anonymous fallback
│   │   ├── apple.ts              # signInWithApple
│   │   ├── email.ts              # signInWithEmail / signUpWithEmail / signOut
│   │   ├── google.ts             # signInWithGoogle
│   │   ├── hooks.ts              # useAuth
│   │   ├── provider.tsx          # AuthProvider (listens to onAuthStateChange)
│   │   ├── supabase.ts           # Supabase client + AES-256 encrypted session storage
│   │   └── types.ts              # AuthState, AuthMethod, ACCOUNT_PROMPT_LESSONS=[]
│   │
│   ├── components/               # Feature components by domain (NO lesson/ or quiz/ — removed in reset)
│   │   ├── auth/                 # AccountPrompt, AuthScreen
│   │   ├── feedback/             # AppLoadingScreen, EmptyState, ErrorFallback, ScreenErrorFallback
│   │   ├── home/                 # AnimatedStreakBadge, HeroCard, WirdTooltip
│   │   ├── monetization/         # LockIcon, TrialCountdownBadge, UpgradeCard
│   │   ├── onboarding/           # OnboardingFlow + steps/ + ProgressBar + animations + atmosphere
│   │   │   └── steps/            # Welcome, Tilawat, Hadith, StartingPoint, Bismillah, LetterReveal, LetterAudio, LetterQuiz, NameMotivation, Finish
│   │   ├── shared/               # AnalyticsConsentModal, AnalyticsGate, BismillahOverlay
│   │   └── social/               # FriendsList, InviteCard
│   │
│   ├── curriculum/               # Post-reset curriculum runtime — replaces old engine/questions pipeline
│   │   ├── README.md             # Authoring procedure + status notes
│   │   ├── types.ts              # LessonData, Screen, TeachingBlock, Exercise (7 types), EntityKey
│   │   ├── lessons/              # Hand-compiled lesson artifacts
│   │   │   ├── index.ts          # lessonRegistry: Record<string, LessonData>
│   │   │   └── lesson-01.ts      # Lesson 1 v3 — "Your First Arabic Sound"
│   │   ├── runtime/              # Generic runtime — knows nothing curriculum-specific
│   │   │   ├── LessonRunner.tsx  # Cursor + outcome aggregation; calls masteryRecorder
│   │   │   ├── completion-store.ts # asyncStorageCompletionStore (key: tila.lesson-completion.<id>)
│   │   │   ├── cursor.ts         # Pure advanceCursor / retreatCursor
│   │   │   ├── mastery-recorder.ts # MasteryRecorder interface + active noopMasteryRecorder
│   │   │   ├── outcome.ts        # computeLessonOutcome (threshold + decoding rule)
│   │   │   └── url-resolver.ts   # "1" → "lesson-01"
│   │   └── ui/                   # Curriculum-specific rendering
│   │       ├── LessonChrome.tsx  # Header, back, exit-confirm
│   │       ├── LessonCompletionView.tsx # Completion celebration
│   │       ├── TeachingScreenView.tsx   # Renders TeachingBlock[] for kind:"teach" screens
│   │       └── exercises/
│   │           ├── HearExercise.tsx     # type:"hear" renderer
│   │           ├── ReadExercise.tsx     # type:"read" renderer (model audio reveal flow)
│   │           ├── TapExercise.tsx      # type:"tap" renderer
│   │           └── index.tsx            # renderExercise() dispatch (choose/build/fix → unimplemented)
│   │
│   ├── data/                     # Static Arabic reference data (NO lessons.js — removed in reset)
│   │   ├── connectedForms.js     # Letter forms by position (isolated/initial/medial/final)
│   │   ├── harakat.js            # Vowel marks (fatha, kasra, dhamma, sukun)
│   │   └── letters.js            # 28 letters: id, name, glyph, transliteration
│   │
│   ├── db/                       # SQLite client + schema + provider
│   │   ├── client.ts             # getDatabase, runMigrations v1→v7, resetDatabase
│   │   ├── index.ts              # Re-exports
│   │   ├── provider.tsx          # DatabaseProvider, useDatabase, 15s init timeout + retry
│   │   └── schema.ts             # SCHEMA_VERSION=7, CREATE_TABLES, SEED_DEFAULTS
│   │
│   ├── design/                   # Design system: tokens, theme, primitives, atmosphere
│   │   ├── CrescentIcon.tsx      # Brand icon
│   │   ├── animations.ts         # durations, easings (Reanimated)
│   │   ├── haptics.ts            # hapticTap, etc. (expo-haptics)
│   │   ├── index.ts              # Re-exports
│   │   ├── theme.ts              # ThemeContext, useColors, useTheme, resolveColors
│   │   ├── tokens.ts             # lightColors, darkColors, typography, spacing, radii, fontFamilies
│   │   ├── atmosphere/           # Background atmosphere
│   │   │   ├── AtmosphereBackground.tsx
│   │   │   ├── FloatingLettersLayer.tsx
│   │   │   ├── WarmGlow.tsx
│   │   │   └── index.ts
│   │   └── components/           # Shared primitives
│   │       ├── ArabicText.tsx    # Amiri-styled Arabic text
│   │       ├── Button.tsx        # Primary/secondary buttons
│   │       ├── Card.tsx          # Card container
│   │       ├── HearButton.tsx    # Tap-to-play audio button (with disabled state)
│   │       ├── PhraseReveal.tsx  # Animated phrase reveal
│   │       ├── QuizOption.tsx    # Selectable quiz option (used by curriculum exercises)
│   │       ├── WarmGradient.tsx  # Warm linear gradient backdrop
│   │       └── index.ts          # Barrel export
│   │
│   ├── engine/                   # Pure JS — thin post-reset (mostly quarantined)
│   │   ├── dateUtils.ts          # getTodayDateString, getDayDifference, addDateDays
│   │   ├── features.ts           # FEATURES.speakingPractice = false
│   │   ├── habit.ts              # loadHabit (single-row habit read)
│   │   ├── index.ts              # Empty re-export shell
│   │   ├── mastery.ts            # QUARANTINED: entity-key/skill-key derivation, mergeQuizResultsIntoMastery
│   │   └── progress.ts           # loadProgress, saveUserProfile, saveMastery*, resetProgress, importProgress
│   │
│   ├── hooks/                    # UI ↔ engine ↔ db bridges (NO useLessonQuiz — removed in reset)
│   │   ├── useHabit.ts           # loadHabit + transactional recordPractice
│   │   ├── useMastery.ts         # Granular updateEntity/Skill/Confusion (unused by active runtime)
│   │   ├── useProgress.ts        # loadProgress, saveMasteryOnly, updateProfile, refresh
│   │   └── useThemePreference.ts # Beta stub: forces "light"
│   │
│   ├── lib/                      # (empty)
│   │
│   ├── monetization/             # RevenueCat (currently beta-stubbed)
│   │   ├── analytics.ts          # Paywall/purchase analytics
│   │   ├── hooks.ts              # useSubscription, useCanAccessLesson (always-allow)
│   │   ├── paywall.ts            # PaywallTrigger, PaywallOutcome types
│   │   ├── provider.tsx          # SubscriptionProvider (BETA STUB: isPremiumActive=true)
│   │   └── revenuecat.ts         # SDK wrapper (inactive)
│   │
│   ├── social/                   # Friend streaks + invites via Supabase
│   │   ├── friends.ts            # getFriendStreaks, sendFriendRequest, removeFriend
│   │   ├── hooks.ts              # useSocial
│   │   ├── invite.ts             # generateInviteCode, resolveInviteCode, shareInviteLink
│   │   ├── provider.tsx          # SocialProvider (skips for anonymous)
│   │   └── types.ts              # FriendStreak, InviteCode, SocialContextValue
│   │
│   ├── state/                    # App-state aggregation layer
│   │   ├── hooks.ts              # useAppState
│   │   ├── provider.tsx          # AppStateProvider — wraps useProgress + transactional recordPractice
│   │   └── types.ts              # AppState, AppStateContextValue
│   │
│   ├── sync/                     # Cloud sync to Supabase (LWW)
│   │   ├── hooks.ts              # useSync
│   │   ├── migration.sql         # Supabase-side migration
│   │   ├── migration.ts          # Migration runner
│   │   ├── provider.tsx          # SyncProvider — foreground-trigger via RN AppState
│   │   ├── service.ts            # syncAll (never throws — returns SyncResult)
│   │   ├── tables.ts             # SYNC_TABLE_CONFIGS
│   │   └── types.ts              # SyncResult, TableSyncConfig, SyncState
│   │
│   ├── types/                    # Shared TypeScript type definitions
│   │   ├── engine.ts             # Engine-shared types
│   │   ├── lesson.ts             # Pre-reset lesson types (vestigial)
│   │   ├── mastery.ts            # MasteryState, EntityState
│   │   ├── onboarding.ts         # Onboarding step types
│   │   ├── progress.ts           # ProgressState shape
│   │   ├── question.ts           # Pre-reset Question type (vestigial — used by mastery.ts)
│   │   └── quiz.ts               # Pre-reset QuizResultItem (vestigial — used by progress.ts)
│   │
│   ├── utils/                    # Misc helpers
│   │   └── greetingHelpers.ts    # getGreetingLine1, getMotivationSubtitle
│   │
│   └── __tests__/                # Vitest tests + setup
│       ├── helpers/
│       │   └── mock-db.ts        # In-memory SQLite test double
│       ├── setup.ts              # Vitest setup (mocks expo-* native modules)
│       └── *.test.{js,ts}        # Pure-logic + contract tests (no React renderer)
│
├── curriculum/                   # Human-authored curriculum specs (source of truth for authoring)
│   ├── README.md                 # — (none at root; phase-1/README.md instead)
│   ├── tila_curriculum_blueprint.pdf
│   ├── Tila_Curriculum_Blueprint_v3.docx
│   ├── tila_master_curriculum_v3.1.1.md           # Master curriculum doc
│   ├── tila_master_curriculum_v3.1.1.pdf
│   ├── tila_master_curriculum_v3.1.1_revision_log.md
│   └── phase-1/
│       ├── README.md             # Phase 1 author notes
│       ├── 01-arabic-starts-here.md                # Lesson 1 spec → src/curriculum/lessons/lesson-01.ts
│       └── 01-arabic-starts-here.original-pre-v4.md.bak  # Backup of pre-v4 copy
│
├── assets/                       # Static assets (audio recordings, images, fonts)
│   └── audio/                    # Per-letter name + sound recordings (mp3/wav)
│
├── docs/                         # Project documentation
├── scripts/                      # Build / dev scripts
├── compare/                      # Comparison artifacts (dev workspace)
├── coverage/                     # Vitest coverage output (gitignored)
├── dist/                         # Build artifacts (gitignored)
├── node_modules/                 # Dependencies (gitignored)
├── testing photos/               # Screenshots from device testing
│
├── app.config.ts                 # Expo manifest (plugins, permissions, privacy manifests)
├── eas.json                      # EAS Build profiles (dev, preview, production)
├── eslint.config.js              # ESLint flat config (eslint-config-expo)
├── metro.config.js               # Metro bundler + Sentry source-map upload
├── package.json                  # Scripts, dependencies
├── package-lock.json             # npm lockfile (v3)
├── tsconfig.json                 # Strict TypeScript, path alias @/* → root
├── vitest.config.ts              # Vitest runner + V8 coverage
├── expo-env.d.ts                 # Expo environment types
├── CLAUDE.md                     # Project instructions for Claude Code
├── MASTER-PLAN.md                # 3-block plan (stability → conversion → retention)
├── lesson1spec.txt               # Reviewer-driven Lesson 1 copy (untracked source)
├── tila_master_curriculum.pdf    # Curriculum reference
├── Tila_Master_Curriculum_v3.1.1_Merge_Ready_Patch.docx
├── tila_mobile_code_review_feedback.docx
└── tila-app-review.docx
```

## Directory Purposes

**`app/`:**
- Purpose: Expo Router file-based routes. Each `.tsx` file is a screen.
- Contains: Root layout (`_layout.tsx`), tab group `(tabs)/`, dynamic lesson route `lesson/[id].tsx`, dev sandbox, onboarding flow screens, auth screen.
- Key files: `app/_layout.tsx`, `app/lesson/[id].tsx`, `app/(tabs)/index.tsx`.

**`src/curriculum/`:**
- Purpose: Post-reset curriculum runtime + lesson data. Replaces the deleted `lessonMode` + question-generator pipeline.
- Contains: `types.ts` (LessonData / Screen / Exercise contracts), `runtime/` (generic LessonRunner), `lessons/` (hand-compiled artifacts), `ui/` (rendering).
- Key files: `src/curriculum/README.md`, `src/curriculum/types.ts`, `src/curriculum/runtime/LessonRunner.tsx`, `src/curriculum/lessons/lesson-01.ts`.

**`src/engine/`:**
- Purpose: Pure JS helpers. Currently thin: date math, habit loader, quarantined mastery key logic.
- Contains: `dateUtils.ts`, `features.ts`, `habit.ts`, `mastery.ts` (quarantined), `progress.ts`, `index.ts`.
- Notes: `mastery.ts` write path is unreachable from the active lesson runtime — only `useProgress.saveMasteryOnly` and `resetProgress`/`importProgress` exercise it.

**`src/db/`:**
- Purpose: SQLite client, schema definition, migrations, React provider.
- Contains: `client.ts` (open + migrations v1→v7), `schema.ts` (SCHEMA_VERSION=7), `provider.tsx` (DatabaseProvider with retry), `index.ts`.
- Key files: `src/db/schema.ts` (single source of truth for table shapes), `src/db/client.ts:runMigrations`.

**`src/hooks/`:**
- Purpose: Bridge UI to engine + SQLite. One hook per concern.
- Contains: `useProgress.ts`, `useHabit.ts`, `useMastery.ts`, `useThemePreference.ts`. **No `useLessonQuiz` — removed in reset.**

**`src/design/`:**
- Purpose: Design system — tokens, theme, primitives, animations, haptics, atmosphere.
- Contains: `tokens.ts` (light + dark color sets, typography, spacing, radii, fontFamilies), `theme.ts` (`useColors`, `resolveColors`), `animations.ts`, `haptics.ts`, `components/` (Button, Card, ArabicText, HearButton, QuizOption, PhraseReveal, WarmGradient), `atmosphere/`.

**`src/components/`:**
- Purpose: Feature components organized by domain. **No `lesson/` or `quiz/` subdirectories** — both removed in reset.
- Contains: `auth/`, `feedback/`, `home/`, `monetization/`, `onboarding/` (+ `steps/`), `shared/`, `social/`.

**`src/db/`, `src/auth/`, `src/sync/`, `src/social/`, `src/monetization/`, `src/state/`:**
- Purpose: One-domain-per-folder providers. Each exports a `provider.tsx` (Context + Provider component), a `hooks.ts` (consumer hook), `types.ts`, and domain logic files.

**`src/data/`:**
- Purpose: Static Arabic reference data only. Authored as `.js` (no types).
- Contains: `letters.js` (28 letters), `harakat.js`, `connectedForms.js`. **No `lessons.js` — removed in reset.**

**`src/types/`:**
- Purpose: Shared TypeScript types.
- Notes: `question.ts` and `quiz.ts` are vestigial — referenced only by quarantined `engine/mastery.ts` and `engine/progress.ts`. Safe to leave; do not extend without intent.

**`src/audio/`:**
- Purpose: Singleton `expo-audio` player + per-letter file map.
- Key files: `src/audio/player.ts` (28-letter filename map, sound overrides for thaa/laam, `configureAudioSession`, `playByPath`).

**`src/analytics/`:**
- Purpose: PostHog (consent-gated) + Sentry (always-on) telemetry with strict event types.
- Key files: `src/analytics/events.ts` (the EventMap — single source of truth for tracked events).

**`src/utils/`:**
- Purpose: Misc helpers. Currently only `greetingHelpers.ts` (greeting + motivation subtitle copy).

**`src/lib/`:**
- Purpose: Empty — placeholder. Avoid placing new code here without a clear rationale.

**`src/__tests__/`:**
- Purpose: Vitest tests, mocks, setup.
- Contains: `setup.ts` (mocks expo-* native modules), `helpers/mock-db.ts` (in-memory SQLite double), test files for hooks, schema migrations, mastery pipeline, monetization, audio safety, etc.

**`curriculum/`:**
- Purpose: Human-authored markdown specs that drive `src/curriculum/lessons/*.ts`. Source of truth for authoring; lesson TS files are hand-compiled from these.
- Key files: `curriculum/phase-1/01-arabic-starts-here.md` → `src/curriculum/lessons/lesson-01.ts`. Master doc: `curriculum/tila_master_curriculum_v3.1.1.md`.

**`assets/`:**
- Purpose: Bundled static assets — audio recordings (per-letter `name` + `sound` files), images, fonts loaded via `expo-font` from `@expo-google-fonts/*`.

**`docs/`:**
- Purpose: Project documentation including superpowers specs (e.g. A0 vertical slice design).

**`scripts/`:**
- Purpose: Build and dev helper scripts.

**`.planning/`** (sibling to `app/`, `src/`, etc.):
- Purpose: GSD workflow artifacts — phase plans, milestones, codebase maps, decision memos, state tracking.
- Key files: `.planning/STATE.md`, `.planning/RESET-DECISION-MEMO.md`, `.planning/codebase/*.md` (this directory).

## Key File Locations

**Entry Points:**
- `app/_layout.tsx`: Root layout — fonts, all providers, error boundary.
- `app/(tabs)/index.tsx`: Home screen — Lesson 1 CTA card, redirects to onboarding.
- `app/lesson/[id].tsx`: Active lesson route — hosts `LessonRunner`.

**Configuration:**
- `app.config.ts`: Expo manifest (plugins, iOS privacy manifests, Android permissions).
- `tsconfig.json`: Strict TypeScript, `@/*` path alias.
- `vitest.config.ts`: Test runner + V8 coverage.
- `metro.config.js`: Bundler + Sentry source maps.
- `eas.json`: Build profiles (dev, preview, production).
- `eslint.config.js`: Flat ESLint config from `eslint-config-expo`.

**Curriculum Runtime (the core):**
- `src/curriculum/types.ts`: All lesson contracts.
- `src/curriculum/runtime/LessonRunner.tsx`: Cursor + outcome aggregation.
- `src/curriculum/runtime/mastery-recorder.ts`: `MasteryRecorder` interface + `noopMasteryRecorder`.
- `src/curriculum/runtime/completion-store.ts`: AsyncStorage completion tracking.
- `src/curriculum/lessons/index.ts`: `lessonRegistry`.
- `src/curriculum/lessons/lesson-01.ts`: Lesson 1 v3.
- `src/curriculum/ui/exercises/index.tsx`: Exercise dispatch (only `tap`/`hear`/`read` implemented).

**Persistence:**
- `src/db/schema.ts`: SQLite schema — single source of truth for tables.
- `src/db/client.ts`: Migrations v1→v7.
- `src/curriculum/runtime/completion-store.ts`: AsyncStorage `tila.lesson-completion.<id>`.
- `src/auth/supabase.ts`: AES-256 encrypted session storage.

**Theming + Design:**
- `src/design/tokens.ts`: Light + dark color sets.
- `src/design/theme.ts`: `useColors`, `resolveColors`.
- `src/design/components/index.ts`: Barrel for shared primitives.

**Testing:**
- `src/__tests__/setup.ts`: Vitest setup.
- `src/__tests__/helpers/mock-db.ts`: SQLite test double.

## Naming Conventions

**Files:**
- React components / TSX screens: **PascalCase** — `LessonRunner.tsx`, `Button.tsx`, `HomeScreen.tsx`. Route files in `app/` follow Expo Router conventions (`[id].tsx`, `_layout.tsx`, `+not-found.tsx`, `(tabs)/`).
- Utilities, hooks, services: **camelCase** — `useProgress.ts`, `mastery.ts`, `dateUtils.ts`, `provider.tsx`.
- Tests: `*.test.{js,ts}` co-located in `src/__tests__/`.

**Directories:**
- Domain folders: lowercase / kebab-case — `curriculum/`, `monetization/`, `social/`, `__tests__/`.
- Component domain folders: lowercase singular or plural matching the domain — `auth/`, `feedback/`, `onboarding/steps/`.
- Expo Router groups: parenthesised — `(tabs)/`.

**Lesson IDs:**
- Canonical form: `lesson-XX` (zero-padded, e.g. `lesson-01`).
- Route param accepts `"1"`, `"2"`, … and resolves via `src/curriculum/runtime/url-resolver.ts`.

## Where to Add New Code

**A new lesson (the dominant near-term task):**
1. Author the human spec at `curriculum/phase-N/<nn>-<slug>.md`.
2. Hand-compile a sibling TS file at `src/curriculum/lessons/lesson-<nn>.ts` that exports a `LessonData` matching the frontmatter and exercises (use `lesson-01.ts` as a template).
3. Register in `src/curriculum/lessons/index.ts`.
4. Add a shape test at `src/__tests__/curriculum/lesson-<nn>-shape.test.ts`.
5. Surface a CTA on the home screen (`app/(tabs)/index.tsx`) following the existing Lesson 1 card pattern.
- See `src/curriculum/README.md` for the canonical procedure.

**A new exercise renderer (e.g. `choose`, `build`, `fix`):**
- Implementation: `src/curriculum/ui/exercises/<NewExercise>.tsx`.
- Wire into the dispatcher: `src/curriculum/ui/exercises/index.tsx::renderExercise()` switch.
- Add a shape test in `src/__tests__/curriculum/`.
- Use the same `screenId` + `advance(outcome?)` + `reportAttempt(attempts[])` props contract as `TapExercise`/`HearExercise`/`ReadExercise`.

**A new teaching block type:**
- Add to the `TeachingBlock` union in `src/curriculum/types.ts`.
- Render in `src/curriculum/ui/TeachingScreenView.tsx`.
- Update `src/curriculum/README.md` if authoring guidance is affected.

**A new shared design primitive:**
- Implementation: `src/design/components/<Component>.tsx`.
- Re-export from `src/design/components/index.ts`.
- Use design tokens from `src/design/tokens.ts` — never hard-code colors or spacing.

**A new feature component:**
- Place in `src/components/<domain>/`. Existing domains: `auth`, `feedback`, `home`, `monetization`, `onboarding` (+ `steps/`), `shared`, `social`. Create a new domain folder if needed; do **not** recreate `lesson/` or `quiz/` (intentionally absent post-reset).

**A new hook:**
- `src/hooks/use<Name>.ts`. Must consume `useDatabase()` for any persistent state.

**A new database table or column:**
- Update `src/db/schema.ts` (`SCHEMA_VERSION` must increase, `CREATE_TABLES` must include the new shape).
- Add a migration block in `src/db/client.ts::runMigrations` (`if (currentVersion < N) { ... await db.runAsync("INSERT OR REPLACE INTO schema_version (version) VALUES (N)"); }`).
- Add a migration test in `src/__tests__/schema-vN.test.ts`.

**A new analytics event:**
- Add the props interface and `EventMap` entry to `src/analytics/events.ts`. The strict types prevent silent typos at the `track(...)` call site.

**A new provider:**
- Place in `src/<domain>/provider.tsx`. Insert into the chain in `app/_layout.tsx` respecting dependencies (e.g. anything reading SQLite must live inside `DatabaseProvider`; anything reading auth must live inside `AuthProvider`).

**A new utility:**
- Date / pure helpers: `src/engine/dateUtils.ts` (or a sibling).
- App-level helpers (greetings, formatters): `src/utils/`.

**A new audio asset:**
- Drop the file into `assets/audio/` and update the filename map in `src/audio/player.ts`.

## Special Directories

**`src/curriculum/lessons/`:**
- Purpose: Hand-compiled lesson TypeScript artifacts.
- Generated: No (hand-authored from sibling markdown specs in `curriculum/phase-N/`).
- Committed: Yes — these ARE the production lessons.
- Constraint per `src/curriculum/README.md`: do NOT build a generalised markdown parser until at least Lessons 2–3 have shipped — the `LessonData` contract may still shift.

**`src/__tests__/`:**
- Purpose: Vitest tests + helpers.
- Generated: No.
- Committed: Yes.
- Conventions: Co-located, not adjacent to source. Use `helpers/mock-db.ts` for any SQLite-touching test.

**`coverage/`, `dist/`, `node_modules/`, `.expo/`:**
- Purpose: Build / dependency artifacts.
- Generated: Yes.
- Committed: No (gitignored).

**`.planning/`:**
- Purpose: GSD workflow artifacts (phase plans, milestones, codebase maps, decision memos).
- Generated: By GSD commands (`/gsd-*`).
- Committed: Yes — they are the project's living memory.

**`testing photos/`:**
- Purpose: Manual device-test screenshots.
- Generated: By the founder during device verification.
- Committed: Yes (tracked).

**`compare/`:**
- Purpose: Ad-hoc comparison workspace (currently empty / dev-only).
- Generated: Manual.

---

*Structure analysis: 2026-04-27*
