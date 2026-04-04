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

**Tila — Emotional Design Overhaul**

Tila is a mobile app that teaches converts and new Muslims to read the Quran, starting from the Arabic alphabet. This milestone transforms Tila's visual and emotional experience from a functional content app into an inhabited space — like walking into a beautiful mosque for the first time: light shaped by architecture, warmth without fanfare, a place that tells the uncertain visitor "this was always yours." Built with Expo 55 / React Native 0.83, offline-first SQLite, mastery-based SRS learning.

**Core Value:** Every screen should feel like entering a quiet, beautiful room that was made for people who aren't sure they belong yet — a sanctuary for learners reconnecting with their faith.

### Constraints

- **Stack**: Expo SDK 55, React Native 0.83, New Architecture — no framework changes
- **No business logic changes**: Engine algorithms, quiz correctness, progression, analytics, monetization all stay the same
- **Offline-first**: All visual changes must work without network connectivity
- **Performance**: No regressions on mid-range Android (60fps animations must hold)
- **Backwards compatible**: Existing user data (SQLite) must not be affected
- **Accessibility**: Reduce Motion support required. Touch targets and contrast must pass audit.
- **Cultural sensitivity**: No inappropriate Islamic imagery. Reverent, not theatrical. No game-like patterns.
- **Maintainability**: Shared primitives over per-screen hacks. New components must be reusable.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.9.2 - All application code, strict mode enabled
- JavaScript - Configuration files (metro.config.js, eslint.config.js)
## Runtime & Environment
- Expo SDK 55.0.9 - Managed React Native platform with built-in CLI and EAS Build integration
- React Native 0.83.4 - Cross-platform mobile app framework with New Architecture enabled
- Node.js (via npm) - Development environment
- npm - Lockfile: package-lock.json (v3, locked)
## Frameworks & Core Libraries
- React 19.2.0 - UI library with Server Components support
- Expo Router 55.0.10 - File-based routing for Expo (similar to Next.js)
- React Navigation 7.1.33 - Navigation primitives (underlying Expo Router)
- React Context - Theme context (`ThemeContext`) and database context (`DatabaseProvider`)
- Custom Hooks - Business logic bridging (in `src/hooks/`)
- No Redux, Zustand, or other state managers
- Vitest 4.1.2 - Unit test runner configured in `vitest.config.ts`
- @vitest/coverage-v8 4.1.2 - Code coverage provider (V8-based)
- Test files: `src/__tests__/**/*.test.{js,ts}` with setup in `src/__tests__/setup.ts`
- Metro - React Native bundler (configured via `metro.config.js` with Sentry integration)
- Expo Dev Client 55.0.22 - Development client for EAS Build
- EAS CLI (>= 15.0.0) - Build and submission orchestration
## Key Dependencies
### Database & Storage
- expo-sqlite 55.0.13 - Native SQLite database with async API
- expo-secure-store 55.0.11 - iOS Keychain / Android Keystore wrapper
- @react-native-async-storage/async-storage 2.2.0 - Persistent key-value storage with AES-256 encryption for Supabase sessions
### Backend & Cloud Integrations
- @supabase/supabase-js 2.101.1 - Client library for PostgreSQL, auth, and real-time
- expo-apple-authentication 55.0.11 - Native Apple Sign-In (iOS/iPad only)
- @react-native-google-signin/google-signin 16.1.2 - Native Google Sign-In
- Supabase Auth - Email/password, SSO providers (via Supabase)
### Monetization
- react-native-purchases 9.15.0 - Subscription management SDK
- react-native-purchases-ui 9.15.0 - Pre-built paywall UI
### Analytics & Error Tracking
- posthog-react-native 4.39.0 - Product analytics
- @sentry/react-native 7.11.0 - Error tracking and performance monitoring
### Encryption & Cryptography
- aes-js 3.1.2 - AES-256 CTR mode for Supabase session encryption
- expo-crypto 55.0.12 - Native cryptographic operations (SHA-256 hashing for Apple Sign-In nonce)
### Fonts & Typography
- @expo-google-fonts/amiri 0.4.1 - Arabic serif font (Quranic text)
- @expo-google-fonts/inter 0.4.2 - English sans-serif (body text)
- @expo-google-fonts/lora 0.4.2 - English serif (headings)
- expo-font 55.0.4 - Font loading and caching
### Audio
- expo-audio 55.0.11 - Native audio player for pronunciation assets
### UI & Animation
- react-native-reanimated 4.2.1 - Performant gesture-driven animations (New Architecture compatible)
- expo-haptics 55.0.11 - Haptic feedback (vibration, impact)
- react-native-svg 15.15.3 - SVG rendering
- expo-symbols 55.0.7 - SF Symbols on iOS, Material Symbols on Android
- expo-linear-gradient 55.0.11 - Linear gradient backgrounds
- react-native-safe-area-context 5.6.2 - Safe area insets (notch awareness)
- react-native-screens 4.23.0 - Native screen container optimization
### Web Support & Polyfills
- react-native-web 0.21.0 - Web target for development (not production-used)
- react-native-url-polyfill 3.0.0 - URL API for React Native environment
### Error Boundaries
- react-error-boundary 6.1.1 - Component-level crash recovery (v6.1.1 compatible with React 19)
## Configuration Files
- `app.config.ts` - Expo app manifest (plugins, permissions, privacy manifests for iOS)
- `tsconfig.json` - TypeScript compiler options (strict mode, path alias `@/*` → root)
- `vitest.config.ts` - Test runner setup (coverage provider, test glob patterns)
- `metro.config.js` - React Native bundler config with Sentry integration
- `eslint.config.js` - ESLint with Expo flat config
- `eas.json` - EAS Build profiles (development, development:simulator, preview, production) with App Store submission config
- `.expo/` - Expo cache directory
- `dist/` - Build artifacts directory
## Environment Configuration
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public API key
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` - Google OAuth Web client ID (not iOS/Android)
- `EXPO_PUBLIC_REVENUECAT_IOS_KEY` - RevenueCat SDK key for iOS
- `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` - RevenueCat SDK key for Android
- `EXPO_PUBLIC_POSTHOG_KEY` - PostHog API key
- `EXPO_PUBLIC_POSTHOG_HOST` - PostHog server URL (defaults to `https://us.i.posthog.com`)
- `EXPO_PUBLIC_SENTRY_DSN` - Sentry project DSN
- `.env` - Local development secrets
- `.env.local` - Machine-specific overrides
## Platform Requirements
- Node.js + npm
- Expo CLI (installed via npm)
- iOS: Xcode 15+ (simulator or device)
- Android: Android SDK 34+ (emulator or device)
- Apple Developer account (for iOS builds via EAS)
- Google Play Developer account (for Android production builds)
- **iOS:** App Store distribution (EAS Submit to App Store)
- **Android:** Google Play distribution (EAS Submit to Play Store)
- Enabled in `app.config.ts` (`newArchEnabled: true`)
- Requires React Native 0.83+ (compatible)
- Fabric renderer + TurboModule interop module
## Build & Deployment
- Development builds: Internal distribution via EAS Build
- Production: Managed by EAS CLI (>= 15.0.0)
- App versioning: Remote via EAS `appVersionSource: "remote"` (version managed in EAS dashboard)
- Auto-increment: Enabled for production builds
- iOS: Via EAS Submit with ascAppId `6761349651`
- Android: Via EAS Submit to Play Store
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React/TSX components use PascalCase: `QuizQuestion.tsx`, `Button.tsx`, `LetterPrompt`
- Utility/service files use camelCase: `useProgress.ts`, `mastery.ts`, `provider.tsx`
- Test files: `*.test.ts`, `*.test.js` (co-located in `src/__tests__/`)
- Hooks use `use` prefix: `useProgress`, `useLessonQuiz`, `useMastery`, `useHabit`
- Directory names: kebab-case or camelCase depending on domain (e.g., `src/engine/questions/`, `src/design/components/`)
- Exported pure functions: camelCase (e.g., `normalizeEntityKey`, `recordEntityAttempt`)
- React component functions: PascalCase
- Internal/private functions: camelCase prefixed with lowercase or using `handle`/`get` convention (e.g., `handlePressIn`, `getVariantStyles`)
- Event handlers: `handle` prefix (e.g., `handlePress`, `handleSignInWithEmail`)
- Selector functions: `get` prefix (e.g., `getDueEntityKeys`, `getWeakEntityKeys`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `MASTERY_MIN_ATTEMPTS`, `OPTIONS_MAX_WIDTH`, `ROW_PITCH`)
- State variables: camelCase (e.g., `authState`, `loading`, `selectedId`)
- React state setters: `set` + PascalCase (e.g., `setAuthState`, `setLoading`)
- Animated values: descriptive camelCase (e.g., `opacity`, `translateY`, `scale`)
- TypeScript interfaces/types: PascalCase (e.g., `ButtonProps`, `AuthState`, `EntityState`)
- Type unions/discriminated types: PascalCase (e.g., `ButtonVariant = "primary" | "secondary"`)
- Generic types: uppercase single letters (e.g., `T`, `K`, `V`)
- Entity key format: descriptive lowercase with colon separator (e.g., `letter:2`, `combo:ba-fatha`, `recognition:2->3`)
## Code Style
- ESLint with Expo flat config (`eslint-config-expo`) enforces rules
- No dedicated Prettier config; ESLint handles formatting
- Imports organized in groups with spacing (React/dependencies → relative imports)
- 2-space indentation (inferred from component files)
- Run with: `npm run lint` (invokes `expo lint`)
- Typecheck with: `tsc --noEmit` or `npm run typecheck`
- Validate all: `npm run validate` (runs both lint and typecheck)
## Import Organization
- `@/*` maps to project root (configured in `tsconfig.json`)
- Used in imports for absolute paths: `import { useDatabase } from "@/src/db/provider"`
- Prefer descriptive relative imports when in same domain (e.g., within `src/engine/`, use relative)
- Named imports preferred: `import { normalizeEntityKey } from "../engine/mastery"`
- Default imports for components/providers: `import Animated from "react-native-reanimated"`
- Destructured imports from barrels: `import { QuizOption, ArabicText, HearButton } from "../../design/components"`
## Error Handling
- Try/catch for async operations returning `{ error: Error | null }` (see `src/auth/provider.tsx`)
- Guard clauses before operations: `if (error) return { error };`
- Error type narrowing: `err instanceof Error ? err : new Error(String(err))`
- Async operations include rejection handling: `.catch()` clauses where needed
- No unhandled promise rejections; all async operations wrapped or caught
- Database operations use transaction guards: `db.withExclusiveTransactionAsync()`
- Error recovery uses explicit state machines (loading → error → ready)
## Logging
- Console used minimally; critical errors passed to Sentry (`@sentry/react-native`)
- Analytics events tracked via PostHog (`posthog-react-native`)
- Sentry configured for error capture: `captureException()`, `captureMessage()`, `addBreadcrumb()`
- No verbose console output in production code
## Comments
- Complex algorithms with multiple branches or state transitions
- "Section dividers" using `// ──` pattern for visual organization (common in components)
- JSDoc for exported public functions and hooks (observe selectively used)
- Not universally applied; used for complex functions and mastery-related logic
- Example from `src/engine/mastery.ts`:
- Single-line comments for explanations: `// Only run entrance on question change, not on answer-state changes`
- Section dividers for readability: `// ── Staggered option wrapper ──`
- Avoid redundant comments; code should be self-explanatory
## Function Design
- Prefer object destructuring for multiple parameters (component props)
- Single/double parameters acceptable for utility functions
- Optional parameters marked with `?`: `onRetry?: () => void`
- Callbacks use explicit types: `(id: number) => void`
- Async functions return `Promise<T>` with explicit type annotation
- Pure functions return typed values matching signature
- Hooks return tuples or objects: `[state, setState]` or `{ state, actions }`
- Error-handling functions return result objects: `{ error: Error | null, data?: T }`
## Module Design
- Named exports preferred for functions and types: `export function normalizeEntityKey(...) { }`
- Default exports used for components: `export default function Button(...) { }`
- Single barrel export per domain: `src/design/components/index.ts` re-exports all design components
- Used selectively: `src/design/components/index.ts` exports `{ Button, Card, ArabicText, QuizOption, HearButton, WarmGradient }`
- Enables cleaner imports: `import { Button } from "@/src/design/components"`
- Not over-used in engine/questions; imports use relative paths for clarity
- Each module has single responsibility (mastery logic, audio player, auth provider)
- Pure functions (`engine/*`) have no React or platform dependencies
- Hooks bridge UI and engine: load from DB → call engine logic → save results
## TypeScript-Specific
- Strict mode enabled: `"strict": true` in `tsconfig.json`
- Explicit return types on exported functions (not always enforced in components)
- Interfaces for component props: `interface QuizQuestionProps { ... }`
- Type narrowing used for discriminated unions (mastery states, auth events)
- Props typed with `any` (e.g., `question: any` in components) flagged for improvement
- Gradual typing applied; pure functions fully typed, components more permissive
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Single-user, offline-first architecture with optional cloud sync layer (Supabase)
- Clear separation: Engine (pure business logic) → Hooks (data bridge) → Components (UI)
- SQLite as single source of truth for learning state (no Redux/Zustand)
- Provider-based context for theme, database, auth, sync, subscription, state
- File-based routing (Expo Router) with dynamic lesson screens
- No React dependencies in engine layer allows portable business logic
## Layers
- Purpose: Pure JavaScript learning algorithm, mastery state machine, habit tracking, engagement scoring
- Location: `src/engine/`
- Contains: mastery.ts, progress.ts, engagement.ts, insights.ts, habit.ts, outcome.ts, questions/
- Depends on: Nothing (pure JS, zero React)
- Used by: Hooks layer (via `useLessonQuiz`, `useProgress`, `useMastery`, `useHabit`)
- Exports: Question generators, mastery updaters, progress loaders, engagement tiers
- Purpose: SQLite client, schema management, database provider
- Location: `src/db/`
- Contains: client.ts (connection, migrations), schema.ts (CREATE TABLE, versions), provider.tsx (React context), index.ts
- Depends on: expo-sqlite, data migrations are run on app startup
- Used by: All hooks, providers, sync service
- Exports: useDatabase() hook, getDatabase() function, DatabaseProvider wrapper
- Purpose: Bridge between UI and engine; loads DB state, calls engine, saves results
- Location: `src/hooks/`
- Contains: useLessonQuiz, useProgress, useMastery, useHabit, useThemePreference
- Depends on: Database provider, engine layer
- Used by: Feature components (LessonScreen, progress components)
- Exports: Stateful quiz/progress management with side effects
- **Feature components** (`src/components/`): Domain-organized components (exercises/, home/, onboarding/, progress/, quiz/, auth/, social/)
- **Design system** (`src/design/`): Theme context, tokens (colors, typography, spacing), shared components (Button, Card, ArabicText)
- **Layout** (`app/`): Expo Router file structure with _layout.tsx (root, tabs), dynamic lesson screen
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
- `user_profile`: Onboarding flags, theme preference, sync user ID
- `lesson_attempts`: Lesson completion records
- `question_attempts`: Per-question correctness tracking
- `mastery_entities`: Letter/combo mastery (entity_key, correct, attempts, interval_days, session_streak, next_review)
- `mastery_skills`: Skill tracking (skill_key, correct, attempts)
- `mastery_confusions`: Letter confusion pairs (confusion_key, count, last_seen)
- `habit`: Daily practice streak (last_practice_date, current_wird, longest_wird, today_lesson_count)
- `premium_lesson_grants`: Unlocked premium lessons (lesson_id, granted_at)
- **ThemeContext**: colors, mode (light/dark) — reads theme_mode from user_profile on startup
- **DatabaseContext**: SQLite instance reference
- **AuthContext**: Current user session (Supabase)
- **SyncContext**: Sync status, last sync timestamp
- **SubscriptionContext**: Cached RevenueCat customer info
- **AppStateContext**: Aggregates progress + habit + subscription (convenience layer)
## Key Abstractions
- Purpose: Generate quiz questions by lesson mode (recognition, sound, contrast, harakat, checkpoint, review, connected-forms, connected-reading)
- Examples: `src/engine/questions/recognition.ts`, `src/engine/questions/harakat.ts`
- Pattern: Each generator receives a Lesson + progress object, returns Question[] array
- Dispatcher: `generateLessonQuestions()` in `src/engine/questions/index.ts` routes by `lesson.lessonMode`
- Types: Question, QuestionOption defined in `src/types/question.ts`
- Purpose: Track letter/combo learning progression (not_started → introduced → unstable → accurate → retained)
- Pattern: Entity key normalization ("letter:2", "combo:ba-fatha") → skill key derivation (visual, sound, harakat) → confusion pair tracking
- Key functions: `normalizeEntityKey()`, `deriveSkillKeysFromQuestion()`, `mergeQuizResultsIntoMastery()` in `src/engine/mastery.ts`
- Integration: Questions report targetId; results flow through mastery state update in hook
- Purpose: Schedule next review via interval_days and next_review columns
- Pattern: After correct answer, interval_days increases exponentially; next_review is calculated timestamp
- Location: Review logic in `src/engine/selectors.ts` (planReviewSession), update logic in `src/engine/progress.ts`
- Purpose: Determine completion tier (firstLesson, perfect, great, good, struggling, harakatPerfect, harakatGreat, harakatStruggling)
- Location: `src/engine/engagement.ts`
- Used for: Post-lesson celebration messaging, habit encouragement
- Purpose: Extract per-lesson insights (confused pairs, weak skills, mastered letters)
- Location: `src/engine/insights.ts`
- Used for: LessonSummary display to user
## Entry Points
- Location: `app/_layout.tsx`
- Triggers: App startup
- Responsibilities:
- Location: `app/(tabs)/_layout.tsx`
- Triggers: User reaches authenticated state
- Responsibilities:
- Renders lesson grid (LessonGrid component)
- Shows hero card with streak info, daily goal, will intro state
- Conditionally shows onboarding flows (onboarding.tsx, return-welcome.tsx, wird-intro.tsx)
- Location: `app/lesson/[id].tsx`
- Param: lesson ID (routed from LessonGrid)
- Responsibilities:
- Dedicated screen for spaced repetition review sessions
- Calls `planReviewSession()` engine function to build review queue
## Error Handling
## Cross-Cutting Concerns
- PostHog event tracking: `track('event_name', { custom_data })` from `src/analytics/index.ts`
- Event map defined in `src/analytics/events.ts` with strict TypeScript types
- Sentry error capture: automatic via error boundaries + manual `captureException()`
- Console logging: debug-friendly, no sensitive data
- Question generation: `filterValidQuestions()` validates each question, logs failures
- Entity keys: `normalizeEntityKey()` handles edge cases (letter IDs, combo IDs, harakat strings)
- API responses: Supabase types are checked at compile time (TypeScript)
- Supabase session management in `AuthProvider`
- Anonymous users bypass sync and premium features
- Signed-in users trigger sync on app foreground (AppState listener)
- RevenueCat checks subscription status independently (no server call on offline)
- All multi-table writes wrapped in `db.withExclusiveTransactionAsync()`
- Examples: Lesson completion (attempt + questions + mastery), sync pushes
- Ensures atomicity: either all writes succeed or none are persisted
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
