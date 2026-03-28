# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Tila?

Tila is a mobile app for learning Arabic (Quranic reading). Built with Expo 55, React Native 0.83, React 19, and TypeScript 5.9. Portrait-only, offline-first, targets iOS and Android. New Architecture is enabled.

## Commands

```bash
npm start              # Expo dev server
npm run android        # Dev server → Android
npm run ios            # Dev server → iOS
npm test               # Vitest (unit tests)
npm run lint           # ESLint (Expo flat config)
npm run typecheck      # tsc --noEmit
npm run validate       # lint + typecheck
```

Tests live in `src/__tests__/**/*.test.{js,ts}` and use Vitest (not Jest).

EAS Build is configured via `eas.json` for cloud builds.

## Architecture

### Routing (Expo Router — file-based)

- `app/_layout.tsx` — Root layout: loads fonts, initializes analytics, wraps app in ThemeContext + DatabaseProvider
- `app/(tabs)/` — Tab navigator with Home (lesson grid) and Progress tabs
- `app/lesson/[id].tsx` — Dynamic lesson screen (param: lesson ID)
- `app/onboarding.tsx`, `app/return-welcome.tsx`, `app/wird-intro.tsx` — Flow screens shown conditionally based on user profile flags

### Data Flow

```
Screen → Hook (useProgress, useLessonQuiz, useMastery, useHabit)
  → Engine (src/engine/*) → SQLite (src/db/*)
```

There is **no Redux or Zustand**. All persistent state lives in SQLite. React Context is used only for theme and database access.

### Key Directories

- **`src/engine/`** — Pure JS business logic with zero React dependencies. Question generation, mastery state machine, habit tracking, engagement scoring. This is the core learning algorithm.
- **`src/engine/questions/`** — Question generators dispatched by `lessonMode` (recognition, sound, contrast, harakat, checkpoint, review, connectedForms, connectedReading).
- **`src/db/`** — SQLite schema, migrations, client, and React context provider. Schema version is tracked for migrations.
- **`src/hooks/`** — Bridge between UI and engine. Each hook loads from DB, calls engine logic, saves results.
- **`src/data/`** — Static lesson curriculum and Arabic letter data (LESSONS array, ARABIC_LETTERS array, harakat, connected forms).
- **`src/design/`** — Design system: tokens (colors, typography, spacing, shadows) and shared components (ArabicText, Button, Card, HearButton, QuizOption).
- **`src/analytics/`** — Typed event tracking via PostHog + Sentry. Events defined in `events.ts` with a strict TypeScript event map.
- **`src/audio/`** — Audio player singleton with bundled SFX and per-letter pronunciation assets (name + sound for all 28 Arabic letters).
- **`src/components/`** — Feature components organized by domain: exercises/, home/, onboarding/, progress/, quiz/.

### Design System

- **Fonts**: Amiri (Arabic), Inter (body), Lora (headings)
- **Colors**: Primary `#163323` (dark green), Accent `#C4A464` (gold), Background `#F8F6F0` (warm cream)
- **Spacing**: 8px base rhythm
- **Theme**: `useColors()` hook from `ThemeContext`. Dark mode defined in tokens but not yet active (forced light).

### Import Alias

`@/*` maps to the project root (configured in tsconfig.json).

### Mastery System

Letters progress through states: not_started → introduced → unstable → accurate → retained. Spaced repetition is tracked via `interval_days` and `next_review` in the mastery_entities table.

### Lesson Structure

Each lesson has a `lessonMode` that determines which question generator runs. Lessons reference letter IDs via `teachIds` (new letters) and `reviewIds` (review letters). Organized into phases and modules.

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Tila — UI Overhaul**

Tila is a mobile app that teaches converts and new Muslims to read the Quran, starting from the Arabic alphabet. Built with Expo/React Native, it uses a mastery-based learning system with lessons, quizzes, and spaced repetition. The app works offline and targets iOS and Android.

This milestone focuses on transforming Tila's visual experience from functional to beautiful — Duolingo-level engagement married with Quranic elegance and a genuine wow factor.

**Core Value:** The first impression must be stunning. When someone opens Tila for the first time, they should feel welcomed, inspired, and excited to learn — not intimidated by Arabic.

### Constraints

- **Platform**: Expo SDK 55, React Native 0.83, New Architecture enabled — must work within this stack
- **Orientation**: Portrait-only
- **Offline**: No network dependencies for UI — all assets bundled
- **Performance**: Animations must run at 60fps on mid-range Android devices
- **Existing design tokens**: Keep current color palette (green + gold + cream), fonts (Amiri, Inter, Lora), and 8px spacing
- **No business logic changes**: UI overhaul only — engine, data, hooks, DB stay untouched
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.9.2 - All application code (`src/`, `app/`)
- Strict mode enabled via `tsconfig.json` (`"strict": true`)
- Extends `expo/tsconfig.base`
- JavaScript - Config files (`metro.config.js`, `eslint.config.js`)
## Runtime
- React Native 0.83.2 (New Architecture enabled via `newArchEnabled: true` in `app.config.ts`)
- Expo SDK 55 (managed workflow with EAS Build for native compilation)
- React 19.2.0
- npm
- Lockfile: `package-lock.json` (present)
## Frameworks
- Expo ~55.0.8 - Application framework, managed workflow
- React Native 0.83.2 - Mobile runtime
- Expo Router ~55.0.7 - File-based routing (`app/` directory)
- React Navigation 7.1.33 - Navigation primitives (used by Expo Router)
- Vitest 4.1.2 - Unit test runner
- Config: `vitest.config.ts`
- Test pattern: `src/__tests__/**/*.test.{js,ts}`
- Metro bundler (configured via `metro.config.js`, wrapped with Sentry)
- EAS Build (cloud builds, config in `eas.json`)
- EAS CLI >= 15.0.0 required
- ESLint 9 with flat config (`eslint.config.js`)
- Uses `eslint-config-expo/flat`
## Key Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `expo-sqlite` | ~55.0.11 | Local SQLite database - all persistent state |
| `expo-router` | ~55.0.7 | File-based routing |
| `react-native-reanimated` | 4.2.1 | Animations and transitions |
| `react-native-screens` | ~4.23.0 | Native screen management |
| `react-native-safe-area-context` | ~5.6.2 | Safe area insets |
| Package | Version | Purpose |
|---------|---------|---------|
| `posthog-react-native` | ^4.39.0 | Product analytics and event tracking |
| `@sentry/react-native` | ~7.11.0 | Error tracking and crash reporting |
| Package | Version | Purpose |
|---------|---------|---------|
| `expo-font` | ~55.0.4 | Custom font loading |
| `@expo-google-fonts/amiri` | ^0.4.1 | Arabic display font |
| `@expo-google-fonts/inter` | ^0.4.2 | Body text font |
| `@expo-google-fonts/lora` | ^0.4.2 | Heading font |
| `expo-audio` | ~55.0.9 | Audio playback (SFX + letter pronunciation) |
| `expo-haptics` | ~55.0.9 | Haptic feedback |
| `react-native-svg` | 15.15.3 | SVG rendering |
| `expo-splash-screen` | ~55.0.12 | Splash screen management |
| Package | Version | Purpose |
|---------|---------|---------|
| `expo-secure-store` | ~55.0.9 | Secure key-value storage (install date tracking) |
| `expo-constants` | ~55.0.9 | App constants and config |
| `expo-asset` | ~55.0.10 | Static asset management |
| `expo-linking` | ~55.0.8 | Deep linking |
| `expo-status-bar` | ~55.0.4 | Status bar control |
| `expo-symbols` | ~55.0.5 | SF Symbols support |
| `expo-web-browser` | ~55.0.10 | In-app browser |
| `expo-dev-client` | ~55.0.18 | Development builds |
| `react-native-worklets` | 0.7.2 | Worklet threading for Reanimated |
## Configuration
- `app.config.ts` - Dynamic Expo config (owner: `tila.app`, scheme: `tila`)
- Portrait-only orientation
- Typed routes enabled (`experiments.typedRoutes: true`)
- iOS bundle ID: `com.tilaapp.tila`
- Android package: `com.tila.app`
- `tsconfig.json` - Strict mode, extends `expo/tsconfig.base`
- Path alias: `@/*` maps to project root
- `eas.json` - EAS Build profiles: development, development:simulator, preview, production
- App version source: remote (managed by EAS)
- Production builds: auto-increment enabled
- `metro.config.js` - Metro bundler with Sentry source map integration
- No `.env` files present - API keys are hardcoded in source (PostHog, Sentry)
- `expo-secure-store` used for runtime key-value persistence
## Platform Targets
- iPhone only (`supportsTablet: false`)
- No background modes
- Non-exempt encryption declared (`ITSAppUsesNonExemptEncryption: false`)
- Standard Android target
- Adaptive icon configured
- Expo dev client for development builds
- Simulator/emulator profiles in EAS config
- Commands: `npm start`, `npm run android`, `npm run ios`
- `npm run validate` runs lint + typecheck
- `npm test` runs Vitest
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: PascalCase `.tsx` (e.g., `src/components/LessonQuiz.tsx`, `src/design/components/Button.tsx`)
- Hooks: camelCase with `use` prefix `.ts` (e.g., `src/hooks/useProgress.ts`, `src/hooks/useMastery.ts`)
- Engine logic: camelCase `.js` (e.g., `src/engine/mastery.js`, `src/engine/outcome.js`)
- Engine logic (newer): camelCase `.ts` (e.g., `src/engine/progress.ts`, `src/engine/habit.ts`)
- Data files: camelCase `.js` (e.g., `src/data/letters.js`, `src/data/lessons.js`)
- Type files: camelCase `.ts` (e.g., `src/types/quiz.ts`, `src/types/lesson.ts`)
- Test files: camelCase `.test.js` or `.test.ts` (e.g., `src/__tests__/mastery.test.js`)
- Config files: camelCase (e.g., `vitest.config.ts`, `eslint.config.js`, `app.config.ts`)
- Use camelCase for all functions: `normalizeEntityKey`, `generateRecognitionQs`, `mapQuizResultsToAttempts`
- React components use PascalCase function names: `function Button()`, `function LessonQuiz()`
- Hooks: `useProgress`, `useMastery`, `useHabit`, `useLessonQuiz`, `useColors`, `useTheme`
- Boolean getters/checkers: `isLessonUnlocked`, `isPhase4Unlocked`
- Factory/builder functions: `buildReviewLessonPayload`, `buildFallbackQuestion`, `buildLegacyProgressView`
- Use camelCase: `lessonId`, `completedLessonIds`, `currentWird`
- Constants: UPPER_SNAKE_CASE for module-level constants: `MASTERY_MIN_ATTEMPTS`, `MASTERY_ACCURACY_THRESHOLD`, `SCHEMA_VERSION`, `ERROR_CATEGORIES`
- Data arrays: UPPER_SNAKE_CASE: `ARABIC_LETTERS`, `LESSONS`, `CONNECTED_FORMS`
- Interfaces: PascalCase with descriptive suffix: `QuizResultItem`, `QuestionAttempt`, `EntityState`, `ButtonProps`
- Type aliases: PascalCase: `ButtonVariant`, `ThemeMode`, `ColorTokens`, `EventName`
- Props interfaces: `{ComponentName}Props` pattern: `ButtonProps`, `LessonQuizProps`, `LessonGridProps`
## Code Style
- No Prettier config detected. Formatting is enforced via ESLint only.
- Indentation: 2 spaces
- Semicolons: used consistently
- Quotes: double quotes in imports and JSX, single quotes in some inline strings (inconsistent)
- Trailing commas: used in multi-line constructs
- ESLint 9 with flat config at `eslint.config.js`
- Uses `eslint-config-expo/flat` as the base config
- Only custom rule: `dist/*` is ignored
- Run via `npx expo lint` or `npm run lint`
- Strict mode enabled in `tsconfig.json`
- Extends `expo/tsconfig.base`
- Path alias: `@/*` maps to project root
- However: `@/` alias is NOT widely used in practice. Most imports use relative paths: `../../src/design/theme`, `../engine/mastery.js`
- Engine files are a mix of `.js` (older, ported from webapp) and `.ts` (newer)
## Import Organization
- Relative paths with explicit extensions for `.js` engine files: `../engine/mastery.js`
- Relative paths without extensions for `.ts`/`.tsx` files: `../hooks/useProgress`
- App routes import from `src/` using `../../src/` relative paths (no `@/` alias in practice)
- `src/design/components/index.ts` — exports all design components
- `src/engine/index.ts` — empty barrel (placeholder)
- `src/design/index.ts` — empty barrel (placeholder)
## Error Handling
- Engine functions accept `null`/`undefined` gracefully and return safe defaults (empty arrays, empty objects, `null`)
- Database operations use try/catch for migrations where columns may already exist (`src/db/client.ts`)
- Analytics init wraps each service in try/catch to prevent crash on init failure (`src/analytics/index.ts`)
- Context hooks throw descriptive errors when used outside providers: `throw new Error("useDatabase must be used within DatabaseProvider")` (`src/db/provider.tsx`)
- No global error boundary detected in the React tree
- Heavy use of nullish coalescing (`??`) and optional chaining (`?.`)
- State initialized as `null` with explicit loading states: `useState<ProgressState | null>(null)`
## Logging
- No structured logging framework
- `console.warn` used for analytics init failures: `console.warn('PostHog init failed:', e)` (`src/analytics/index.ts`)
## Comments
- JSDoc-style `/** */` comments on exported engine functions explaining purpose and rules (`src/engine/mastery.js`)
- Section headers using `// ── Section Name ──` pattern throughout engine and test files
- File-level doc comments explaining the module's role at the top of files (`src/engine/progress.ts`, `src/db/schema.ts`)
- Inline comments for non-obvious behavior: `// Columns may already exist if DB was created fresh with v2 schema`
- Used on engine functions in `.js` files to document parameters and return types informally
- Not used in `.tsx` component files — prop types serve as documentation via TypeScript interfaces
## Function Design
- Hooks are small (20-60 lines), single-purpose: `src/hooks/useMastery.ts` (37 lines), `src/hooks/useProgress.ts` (65 lines)
- Engine functions are pure and focused — one function per concern
- Components are larger (100-300+ lines) — screens like `app/lesson/[id].tsx` contain significant logic
- Engine functions accept plain objects, not React-specific types
- Callbacks wrapped in `useCallback` with explicit dependency arrays in hooks
- Props interfaces defined adjacent to component, not in separate type files
- Hooks return object spread: `return { ...state, loading, completeLesson, updateProfile, refresh }`
- Engine functions return plain objects or arrays
- No Result/Either pattern — errors return `null` or safe defaults
## Module Design
- Named exports everywhere: `export function`, `export interface`, `export const`
- Default exports ONLY for Expo Router screen components: `export default function LessonScreen()` (`app/lesson/[id].tsx`)
- No default exports in `src/` utility/component files
- Functional components with hooks, no class components
- Design system components: function + StyleSheet.create at bottom of file (`src/design/components/Button.tsx`)
- Feature components: same pattern, props interface defined inline above component
- No Redux/Zustand — all persistent state in SQLite via hooks
- React Context for cross-cutting concerns only: `ThemeContext` (`src/design/theme.ts`), `DatabaseContext` (`src/db/provider.tsx`)
- Local component state via `useState` / `useRef`
## Design System Usage
## Language Split
- **TypeScript (`.ts`/`.tsx`):** All React components, hooks, types, DB layer, analytics
- **JavaScript (`.js`):** Engine logic (mastery, questions, selectors, engagement, outcome, dateUtils, features) — ported from original webapp, not yet migrated to TS
- When adding new engine logic, prefer `.ts`. When modifying existing `.js` engine files, keep as `.js` unless doing a dedicated migration.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- **Offline-first**: All state persisted in local SQLite. No remote API for learning data.
- **Engine/UI separation**: `src/engine/` contains pure JS logic with zero React dependencies. All learning algorithms, mastery calculations, question generation, and unlock logic live here.
- **Hook bridge pattern**: `src/hooks/` contains thin React hooks that wire engine logic to the database and expose it to screens.
- **No global state library**: No Redux, Zustand, or MobX. React Context is used only for two concerns: theme (`ThemeContext`) and database access (`DatabaseContext`).
- **File-based routing**: Expo Router maps `app/` directory to screens. Navigation is URL-based.
## Layers
- Purpose: Screen-level components, navigation configuration, Expo Router layouts
- Location: `app/`
- Contains: Root layout, tab navigator, dynamic lesson screens, flow screens (onboarding, return-welcome, etc.)
- Depends on: `src/hooks/`, `src/components/`, `src/design/`, `src/data/`, `src/engine/selectors`, `src/analytics/`
- Used by: Expo Router (entry point)
- Purpose: Reusable UI components organized by feature domain
- Location: `src/components/`
- Contains: Feature components for exercises, home screen, onboarding, progress, quiz. Also top-level lesson wrappers (`LessonQuiz.tsx`, `LessonHybrid.tsx`, `LessonIntro.tsx`, `LessonSummary.tsx`).
- Depends on: `src/design/`, `src/hooks/`, `src/engine/`, `src/data/`, `src/analytics/`
- Used by: Screen files in `app/`
- Purpose: Shared visual foundation - tokens, theme, and primitive UI components
- Location: `src/design/`
- Contains: Color tokens (light + dark), typography presets, spacing scale, shadow definitions, primitive components (ArabicText, Button, Card, HearButton, QuizOption)
- Depends on: Nothing (leaf layer)
- Used by: All UI code across `app/` and `src/components/`
- Purpose: Bridge between React UI and pure engine logic. Load from DB, call engine, save results.
- Location: `src/hooks/`
- Contains: `useProgress.ts`, `useMastery.ts`, `useHabit.ts`, `useLessonQuiz.ts`, `useLessonHybrid.ts`
- Depends on: `src/db/provider`, `src/engine/`
- Used by: Screen files and components
- Purpose: Pure JavaScript business logic with zero React/RN dependencies. Core learning algorithm.
- Location: `src/engine/`
- Contains: Question generation, mastery state machine, SRS scheduling, habit tracking, engagement scoring, lesson unlock logic, review planning, selectors
- Depends on: `src/data/` (static curriculum data only)
- Used by: `src/hooks/`, some screen files directly for selectors
- Purpose: SQLite schema, connection management, React context provider
- Location: `src/db/`
- Contains: Schema definition, migrations, singleton client, DatabaseProvider/useDatabase
- Depends on: `expo-sqlite`
- Used by: `src/hooks/`, `src/engine/progress.ts`
- Purpose: Static curriculum content - lesson definitions, Arabic letter metadata, harakat data, connected forms
- Location: `src/data/`
- Contains: `lessons.js`, `letters.js`, `harakat.js`, `connectedForms.js`
- Depends on: Nothing (leaf layer)
- Used by: `src/engine/`, screen files, components
- Purpose: Typed event tracking via PostHog + error monitoring via Sentry
- Location: `src/analytics/`
- Contains: `index.ts` (facade), `events.ts` (typed event map), `posthog.ts`, `sentry.ts`
- Depends on: PostHog SDK, Sentry SDK
- Used by: Screen files, root layout
- Purpose: Audio playback for letter pronunciations and SFX
- Location: `src/audio/`
- Contains: `player.ts` (singleton player), `index.ts` (asset registry for 28 Arabic letters)
- Depends on: `expo-audio`, bundled assets in `assets/audio/`
- Used by: Components that play audio (HearButton, quiz screens)
## Data Flow
- All persistent state lives in SQLite (single-user, no user_id columns)
- React state is used only for ephemeral UI state (current question index, quiz results, animation flags)
- `useProgress()` is the primary data gateway - loads all progress state in one parallel query batch
- No cross-component shared state except ThemeContext and DatabaseContext
## Key Abstractions
- Purpose: Complete snapshot of user's learning state loaded from SQLite
- Contains: `completedLessonIds`, `mastery` (entities/skills/confusions), `habit`, onboarding flags
- Pattern: Loaded once via `loadProgress()`, refreshed after writes via `refresh()` callback
- Purpose: Tracks per-letter and per-combo learning proficiency with SRS scheduling
- Entity keys: `"letter:2"`, `"combo:ba-fatha"`
- Skill keys: `"visual:2"`, `"sound:2"`, `"contrast:2-3"`
- Confusion keys: `"recognition:2->3"`, `"harakat:ba-fatha->ba-kasra"`
- States: `introduced` -> `unstable` -> `accurate` -> `retained`
- SRS intervals: {streak 1: 1 day, 2: 3 days, 3: 7 days, 4: 14 days}
- Purpose: Static curriculum definition
- Each lesson has: `id`, `phase` (1-4), `lessonMode`, `title`, `teachIds` (new letters), `reviewIds` (review letters)
- Organized into 4 phases: Letter Recognition, Letter Sounds, Harakat, Connected Forms
- `lessonType: "hybrid"` triggers the hybrid exercise framework instead of standard quiz
- Purpose: Determines which lessons/phases are available based on completion + mastery
- Within a phase: sequential unlock (must complete previous lesson)
- Phase transitions: requires completion threshold count + 70% of taught letters at "accurate" or "retained" mastery
## Entry Points
- Triggers: App launch
- Responsibilities: Font loading, splash screen, analytics init, ThemeContext + DatabaseProvider wrapping, Stack navigator config
- Triggers: Tab navigation, app open (after onboarding)
- Responsibilities: Show lesson grid, wird streak, hero card. Redirects to onboarding or return-welcome if needed.
- Triggers: `router.push({ pathname: '/lesson/[id]', params: { id } })`
- Responsibilities: Orchestrates lesson flow through 3 stages: intro -> quiz -> summary. Handles quiz completion, lesson saving, habit tracking, analytics, and post-lesson routing.
- Triggers: Navigation from home screen review CTA
- Responsibilities: Builds review lesson payload from mastery state, runs quiz, saves results
## Error Handling
- DB initialization catches migration errors silently (columns may already exist)
- Analytics init wrapped in try/catch with console.warn fallback
- `useDatabase()` throws if called outside `DatabaseProvider`
- Question generation has `filterValidQuestions()` safeguard that replaces broken questions with fallbacks
- No global error boundary component detected
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
