# Codebase Structure

**Analysis Date:** 2026-03-28

## Directory Layout

```
tila-mobile/
├── app/                        # Expo Router screens (file-based routing)
│   ├── _layout.tsx             # Root layout: fonts, analytics, providers
│   ├── +html.tsx               # Web HTML template
│   ├── +not-found.tsx          # 404 screen
│   ├── (tabs)/                 # Tab navigator group
│   │   ├── _layout.tsx         # Tab bar config (Home + Progress tabs)
│   │   ├── index.tsx           # Home screen (lesson grid, hero card)
│   │   └── progress.tsx        # Progress screen (stats, mastery grid)
│   ├── lesson/                 # Lesson screens
│   │   ├── [id].tsx            # Dynamic lesson screen (intro/quiz/summary)
│   │   └── review.tsx          # SRS review session screen
│   ├── onboarding.tsx          # Onboarding flow entry
│   ├── return-welcome.tsx      # Returning user welcome (hadith)
│   ├── wird-intro.tsx          # Wird (streak) concept intro
│   ├── phase-complete.tsx      # Phase completion celebration
│   ├── post-lesson-onboard.tsx # Post-first-lesson onboarding
│   └── audio-test.tsx          # Dev: audio playback test screen
├── src/                        # Application source code
│   ├── analytics/              # Event tracking (PostHog + Sentry)
│   │   ├── index.ts            # Analytics facade: init, track, identify
│   │   ├── events.ts           # Typed event map (EventName, EventMap)
│   │   ├── posthog.ts          # PostHog client setup
│   │   └── sentry.ts           # Sentry error monitoring setup
│   ├── audio/                  # Audio playback system
│   │   ├── index.ts            # Asset registry (28 letter sounds + SFX)
│   │   └── player.ts           # Audio player singleton
│   ├── components/             # Feature UI components
│   │   ├── LessonIntro.tsx     # Lesson intro screen component
│   │   ├── LessonQuiz.tsx      # Standard quiz lesson component
│   │   ├── LessonHybrid.tsx    # Hybrid (Phase 4+) lesson component
│   │   ├── LessonSummary.tsx   # Post-lesson results component
│   │   ├── exercises/          # Hybrid exercise components
│   │   │   ├── BuildUpReader.tsx
│   │   │   ├── ComprehensionExercise.tsx
│   │   │   ├── FreeReader.tsx
│   │   │   ├── GuidedReveal.tsx
│   │   │   ├── SpotTheBreak.tsx
│   │   │   └── TapInOrder.tsx
│   │   ├── home/               # Home screen components
│   │   │   ├── HeroCard.tsx
│   │   │   └── LessonGrid.tsx
│   │   ├── onboarding/         # Onboarding flow components
│   │   │   ├── OnboardingFlow.tsx
│   │   │   ├── OnboardingStepLayout.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── FloatingLettersLayer.tsx
│   │   │   ├── WarmGlow.tsx
│   │   │   ├── animations.ts   # Transition timing constants
│   │   │   └── steps/          # Individual onboarding step components
│   │   ├── progress/           # Progress screen components
│   │   │   ├── StatsRow.tsx
│   │   │   ├── PhasePanel.tsx
│   │   │   └── LetterMasteryGrid.tsx
│   │   └── quiz/               # Quiz UI components
│   │       ├── QuizCelebration.tsx
│   │       ├── QuizProgress.tsx
│   │       ├── QuizQuestion.tsx
│   │       └── WrongAnswerPanel.tsx
│   ├── data/                   # Static curriculum data
│   │   ├── lessons.js          # LESSONS array, phase thresholds
│   │   ├── letters.js          # ARABIC_LETTERS array (28 letters)
│   │   ├── harakat.js          # Harakat/vowel mark data
│   │   └── connectedForms.js   # Connected letter form data
│   ├── db/                     # SQLite database layer
│   │   ├── client.ts           # DB singleton, migrations, reset
│   │   ├── schema.ts           # CREATE TABLE statements, seed data
│   │   ├── provider.tsx        # DatabaseProvider + useDatabase hook
│   │   └── index.ts            # Re-exports
│   ├── design/                 # Design system
│   │   ├── tokens.ts           # Colors, typography, spacing, shadows
│   │   ├── theme.ts            # ThemeContext, useColors(), useTheme()
│   │   ├── index.ts            # Re-exports
│   │   └── components/         # Primitive shared components
│   │       ├── ArabicText.tsx   # Arabic text with correct font
│   │       ├── Button.tsx       # Primary button
│   │       ├── Card.tsx         # Card container
│   │       ├── HearButton.tsx   # Audio playback button
│   │       ├── QuizOption.tsx   # Quiz answer option
│   │       └── index.ts        # Barrel export
│   ├── engine/                 # Pure JS business logic (no React)
│   │   ├── index.ts            # Empty re-export placeholder
│   │   ├── mastery.js          # Mastery state machine, SRS, entity/skill tracking
│   │   ├── progress.ts         # SQLite read/write adapter for all learning state
│   │   ├── habit.ts            # Habit/wird state loading
│   │   ├── selectors.js        # Derived state selectors, review planner
│   │   ├── unlock.js           # Lesson/phase unlock logic
│   │   ├── outcome.js          # Pass/fail threshold logic
│   │   ├── engagement.js       # Engagement scoring
│   │   ├── features.js         # Feature flags
│   │   ├── dateUtils.js        # Date arithmetic helpers
│   │   └── questions/          # Question generators by lesson mode
│   │       ├── index.js        # Dispatcher: lessonMode -> generator
│   │       ├── recognition.js  # Letter recognition questions
│   │       ├── sound.js        # Sound/audio questions
│   │       ├── contrast.js     # Similar letter contrast questions
│   │       ├── harakat.js      # Harakat/vowel questions
│   │       ├── checkpoint.js   # Checkpoint quiz questions
│   │       ├── review.js       # SRS review questions
│   │       ├── connectedForms.js   # Connected form exercises
│   │       ├── connectedReading.js # Connected reading exercises
│   │       ├── explanations.js # Wrong answer explanations
│   │       └── shared.js       # Shared utilities (shuffle, validation)
│   ├── hooks/                  # React hooks (UI-engine bridge)
│   │   ├── useProgress.ts      # Load/save all progress state
│   │   ├── useMastery.ts       # Save mastery entity/skill/confusion
│   │   ├── useHabit.ts         # Load/save wird streak state
│   │   ├── useLessonQuiz.ts    # Standard quiz state management
│   │   └── useLessonHybrid.ts  # Hybrid lesson state management
│   ├── lib/                    # Shared utilities (currently empty or minimal)
│   ├── types/                  # TypeScript type definitions
│   │   ├── quiz.ts             # QuizResultItem, QuestionAttempt, mappers
│   │   ├── lesson.ts           # Lesson type definitions
│   │   ├── mastery.ts          # Mastery type definitions
│   │   ├── onboarding.ts       # Onboarding type definitions
│   │   └── progress.ts         # Progress type definitions
│   └── __tests__/              # Unit tests (Vitest)
│       ├── connectedForms.test.js
│       ├── data-loading.test.ts
│       ├── letters.test.js
│       ├── mastery.test.js
│       ├── outcome.test.js
│       ├── questions.test.js
│       ├── quiz-contract.test.ts
│       ├── selectors.test.js
│       └── summaryAndReview.test.js
├── assets/                     # Static assets
│   ├── audio/                  # Audio files
│   │   ├── effects/            # SFX (correct, wrong, celebrate, etc.)
│   │   ├── names/              # Letter name pronunciations
│   │   └── sounds/             # Letter sound pronunciations
│   ├── fonts/                  # Font files (if not from Google Fonts)
│   ├── images/                 # App icons, splash screen
│   └── logo/                   # Logo assets
├── components/                 # Legacy Expo scaffolding (unused/minimal)
├── constants/                  # Legacy Expo scaffolding (unused/minimal)
├── dist/                       # Build output (generated, not committed)
├── docs/                       # Documentation and specs
│   └── superpowers/
│       ├── plans/              # Implementation plans
│       └── specs/              # Design specifications
├── app.config.ts               # Expo config (dynamic)
├── eas.json                    # EAS Build configuration
├── eslint.config.js            # ESLint flat config
├── metro.config.js             # Metro bundler config
├── tsconfig.json               # TypeScript config (strict, @/* alias)
├── vitest.config.ts            # Vitest test runner config
├── package.json                # Dependencies and scripts
└── CLAUDE.md                   # AI coding assistant instructions
```

## Directory Purposes

**app/:**
- Purpose: Expo Router file-based routing. Each file = a screen.
- Contains: Screen components, layout files, navigation configuration
- Key files: `_layout.tsx` (root), `(tabs)/_layout.tsx` (tab nav), `lesson/[id].tsx` (lesson screen)

**src/engine/:**
- Purpose: Pure JS business logic with zero React dependencies. The "brain" of the app.
- Contains: Mastery algorithm, SRS scheduling, question generators, unlock logic, selectors
- Key files: `mastery.js` (core mastery state machine), `progress.ts` (SQLite adapter), `questions/index.js` (question dispatcher), `selectors.js` (derived state), `unlock.js` (progression gates)

**src/hooks/:**
- Purpose: React hooks that bridge UI to engine. Each hook loads from DB, calls engine, saves results.
- Contains: 5 hooks covering all data access patterns
- Key files: `useProgress.ts` (primary data gateway), `useLessonQuiz.ts` (quiz state machine)

**src/components/:**
- Purpose: Feature-specific UI components. NOT design system primitives.
- Contains: Domain-organized subdirectories + top-level lesson wrapper components
- Key files: `LessonQuiz.tsx`, `LessonHybrid.tsx`, `LessonSummary.tsx`, `LessonIntro.tsx`

**src/design/:**
- Purpose: Design system foundation. Tokens, theme, and primitive components shared across the app.
- Contains: Color/typography/spacing tokens, ThemeContext, 5 shared components
- Key files: `tokens.ts` (all design tokens), `theme.ts` (context + hooks), `components/` (primitives)

**src/db/:**
- Purpose: SQLite schema, connection management, React context
- Contains: Schema DDL, migrations, singleton client, provider
- Key files: `schema.ts` (table definitions), `client.ts` (connection + migrations), `provider.tsx` (context)

**src/data/:**
- Purpose: Static curriculum content. Read-only, no runtime mutations.
- Contains: Lesson definitions, Arabic letter metadata, harakat data, connected forms
- Key files: `lessons.js` (LESSONS array), `letters.js` (ARABIC_LETTERS)

## Key File Locations

**Entry Points:**
- `app/_layout.tsx`: Root layout, app initialization (fonts, analytics, providers)
- `app/(tabs)/index.tsx`: Home screen, main user entry after onboarding
- `app/lesson/[id].tsx`: Lesson flow orchestrator (intro -> quiz -> summary)

**Configuration:**
- `app.config.ts`: Expo config (bundle IDs, plugins, EAS project ID)
- `tsconfig.json`: TypeScript strict mode, `@/*` path alias to project root
- `eas.json`: EAS Build profiles
- `eslint.config.js`: ESLint flat config
- `vitest.config.ts`: Vitest test runner config
- `metro.config.js`: Metro bundler config

**Core Logic:**
- `src/engine/mastery.js`: Mastery state machine, SRS scheduling, entity tracking
- `src/engine/progress.ts`: SQLite read/write adapter for all learning state
- `src/engine/questions/index.js`: Question generation dispatcher
- `src/engine/selectors.js`: Derived state (current lesson, review planning, mastery stats)
- `src/engine/unlock.js`: Lesson/phase unlock logic with mastery competence checks

**Testing:**
- `src/__tests__/*.test.{js,ts}`: All unit tests (Vitest)

## Naming Conventions

**Files:**
- React components: PascalCase (`LessonQuiz.tsx`, `HeroCard.tsx`, `QuizOption.tsx`)
- Hooks: camelCase with `use` prefix (`useProgress.ts`, `useMastery.ts`)
- Engine modules: camelCase (`mastery.js`, `selectors.js`, `dateUtils.js`)
- Types: camelCase (`quiz.ts`, `lesson.ts`, `mastery.ts`)
- Tests: match source name + `.test` suffix (`mastery.test.js`, `quiz-contract.test.ts`)

**Directories:**
- Feature domains: lowercase (`exercises/`, `home/`, `onboarding/`, `progress/`, `quiz/`)
- Expo Router groups: parenthesized (`(tabs)/`)
- Dynamic routes: bracketed (`[id].tsx`)

**Extensions:**
- `.tsx` for React components
- `.ts` for TypeScript modules without JSX
- `.js` for pure JS engine modules (ported from web app, not yet migrated to TS)

## Where to Add New Code

**New Screen:**
- Add file to `app/` following Expo Router conventions
- For tab screens: `app/(tabs)/screenname.tsx`
- For modal/flow screens: `app/screenname.tsx`
- For nested dynamic routes: `app/feature/[param].tsx`

**New Feature Component:**
- Create subdirectory under `src/components/` for the feature domain
- Example: `src/components/settings/SettingsPanel.tsx`
- Top-level lesson variants go directly in `src/components/` (e.g., `LessonQuiz.tsx`)

**New Design System Component:**
- Add to `src/design/components/`
- Export from `src/design/components/index.ts` barrel file
- Use tokens from `src/design/tokens.ts` for all styling

**New Engine Logic:**
- Add to `src/engine/` as a `.js` or `.ts` file
- Must be pure JS/TS with zero React imports
- Question generators go in `src/engine/questions/` and must be registered in `src/engine/questions/index.js`

**New Hook:**
- Add to `src/hooks/`
- Follow pattern: get DB via `useDatabase()`, call engine functions, expose via return object

**New Question Generator:**
- Add file to `src/engine/questions/` (e.g., `newmode.js`)
- Register in `src/engine/questions/index.js` dispatcher (`generateLessonQuestions` and/or `generateHybridExercises`)
- Add corresponding `lessonMode` to lessons in `src/data/lessons.js`

**New Type Definitions:**
- Add to `src/types/`
- Import types from here in both hooks and engine

**New Tests:**
- Add to `src/__tests__/` with `.test.js` or `.test.ts` extension
- Test engine logic directly (no React rendering needed for engine tests)

**New Static Data:**
- Add to `src/data/`
- Keep as plain JS/TS exports, no side effects

## Special Directories

**dist/:**
- Purpose: Build output
- Generated: Yes (by Expo/Metro)
- Committed: No (should be gitignored)

**components/ (root):**
- Purpose: Legacy Expo scaffolding from project init
- Generated: No
- Committed: Yes, but unused. Actual components live in `src/components/`.

**constants/ (root):**
- Purpose: Legacy Expo scaffolding from project init
- Generated: No
- Committed: Yes, but unused. Actual constants live in `src/design/tokens.ts`.

**.planning/:**
- Purpose: GSD planning documents (codebase analysis, phase plans)
- Generated: By AI tooling
- Committed: Yes

## Import Alias

The `@/*` alias maps to the project root, configured in `tsconfig.json`:
```json
{ "paths": { "@/*": ["./*"] } }
```

However, current codebase primarily uses relative imports (e.g., `../../src/design/theme`). The alias is available but not consistently adopted.

---

*Structure analysis: 2026-03-28*
