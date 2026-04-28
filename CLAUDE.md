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
Route (app/lesson/[id].tsx)
  → LessonRunner (src/curriculum/runtime)
    → LessonData (src/curriculum/lessons/*) + UI renderers (src/curriculum/ui/*)
    → MasteryRecorder (currently noopMasteryRecorder)
       → Engine (src/engine/*) → SQLite (src/db/*)
```

There is **no Redux or Zustand**. All persistent state lives in SQLite. React Context is used only for theme and database access.

> **Curriculum reset (2026-04-20).** The pre-reset `lessonMode`/question-generator pipeline (`src/engine/questions/`, `useLessonQuiz`, `LESSONS` array, `engagement.ts`/`insights.ts`/`selectors.ts`/`outcome.ts`) was excised on `main`. Lessons are now driven by hand-compiled `LessonData` files under `src/curriculum/lessons/`, executed by `LessonRunner`. Mastery tables are preserved in SQLite but the write path is quarantined behind `noopMasteryRecorder` until the new mastery pipeline lands.

### Key Directories

- **`src/curriculum/`** — Lesson authoring + runtime (post-reset home of all lesson code).
  - `types.ts` — `LessonData`, `Screen` (`teach` | `exercise`), `TeachingBlock` union (text, heading, glyph-display, shape-variants, audio, name-sound-pair, mark-preview, reading-direction), and the seven `Exercise` types (`tap`, `hear`, `choose`, `build`, `read`, `fix`).
  - `runtime/` — `LessonRunner.tsx`, `cursor.ts`, `outcome.ts`, `completion-store.ts` (AsyncStorage), `url-resolver.ts`, `mastery-recorder.ts` (interface + `noopMasteryRecorder`).
  - `lessons/` — Hand-compiled `LessonData` files (`lesson-01.ts`) plus `index.ts` registry. Authored from human specs in top-level `curriculum/phase-N/<nn>-<slug>.md`.
  - `ui/` — `LessonChrome`, `TeachingScreenView`, `LessonCompletionView`, plus per-exercise renderers in `exercises/` (`TapExercise`, `HearExercise`, `ReadExercise`). `choose`/`build`/`fix` are typed but not yet rendered.
- **`src/engine/`** — Pure JS, zero React. Currently: `mastery.ts` (entity/skill/confusion state machine — preserved but quarantined), `progress.ts`, `habit.ts`, `features.ts`, `dateUtils.ts`.
- **`src/db/`** — SQLite schema, migrations, client, and React context provider. Schema version is tracked for migrations.
- **`src/hooks/`** — `useProgress`, `useMastery`, `useHabit`, `useThemePreference`. (No `useLessonQuiz` — removed in the reset.)
- **`src/data/`** — Static letter data (`letters.js`, `harakat.js`, `connectedForms.js`). The old `LESSONS` array is gone — lessons live in `src/curriculum/lessons/`.
- **`src/design/`** — Design system: tokens (colors, typography, spacing, shadows) and shared components (ArabicText, Button, Card, HearButton, QuizOption).
- **`src/analytics/`** — Typed event tracking via PostHog + Sentry. Events defined in `events.ts` with a strict TypeScript event map.
- **`src/audio/`** — Audio player singleton with bundled SFX and per-letter pronunciation assets (name + sound for all 28 Arabic letters).
- **`src/components/`** — Feature components by domain: `auth/`, `feedback/`, `home/`, `monetization/`, `onboarding/`, `shared/`, `social/`. (Lesson-time UI now lives under `src/curriculum/ui/` — the old `exercises/`, `quiz/`, `progress/` folders were removed.)

### Design System

- **Fonts**: Amiri (Arabic), Inter (body), Lora (headings)
- **Colors**: Primary `#163323` (dark green), Accent `#C4A464` (gold), Background `#F8F6F0` (warm cream)
- **Spacing**: 8px base rhythm
- **Theme**: `useColors()` hook from `ThemeContext`. Dark mode defined in tokens but not yet active (forced light).

### Import Alias

`@/*` maps to the project root (configured in tsconfig.json).

### Mastery System

Defined in `src/engine/mastery.ts`: letters progress through `not_started → introduced → unstable → accurate → retained`, with spaced-repetition tracked via `interval_days` and `next_review` on `mastery_entities`. The state machine and SQLite tables are intact, but `LessonRunner` currently writes through `noopMasteryRecorder` — no attempts are persisted until the post-reset mastery pipeline is wired in.

### Lesson Structure

A lesson is a typed `LessonData` (see `src/curriculum/types.ts`):

- **Metadata**: `id`, `phase`, `module`, `title`, `outcome`, `durationTargetSeconds`, `kind` (`onboarding` | `standard`), `introducedEntities`, `reviewEntities`, `passCriteria`.
- **`screens: Screen[]`** — ordered queue. Each screen is either:
  - `kind: "teach"` — composes `TeachingBlock`s (text, heading, glyph-display, shape-variants, audio, name-sound-pair, mark-preview, reading-direction). Audio blocks may opt into `autoPlay` (teach-only).
  - `kind: "exercise"` — wraps one `Exercise` and tags it as `warm-recall` | `practice` | `mastery-check`, with `scored`, `countsAsDecoding`, and `retryMode` flags.
- **Entity keys** are colon-namespaced strings: `letter:alif`, `combo:ba+fatha`, `mark:fatha`.

**Authoring flow** (per `src/curriculum/README.md`):

1. Write the human spec at `curriculum/phase-N/<nn>-<slug>.md`.
2. Hand-compile a sibling `src/curriculum/lessons/lesson-<nn>.ts` exporting `LessonData`.
3. Register it in `src/curriculum/lessons/index.ts`.
4. Add a shape test at `src/__tests__/curriculum/lesson-<nn>-shape.test.ts`.
5. Expose a CTA on the home screen.

Lesson 1 (`lesson-01.ts`) is the only shipped lesson today. A sandbox reference lesson lives behind `EXPO_PUBLIC_DEV_REFERENCE_LESSON=true` at `app/sandbox-lesson.tsx` for runtime smoke-testing.

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

### Languages

**Primary:**
- TypeScript 5.9.2 — All application code under `app/` and `src/`. Strict mode enabled (`tsconfig.json`).

**Secondary:**
- JavaScript (CommonJS) — Tooling configs only: `metro.config.js`, `eslint.config.js`. No application-level JS sources are imported from `src/data/` anymore (the curriculum reset removed `src/data/lessons.js`; the surviving `letters.js`, `harakat.js`, `connectedForms.js` reference data is the only JS in `src/`).

### Runtime

**Environment:**
- Expo SDK 55.0.9 (managed workflow with dev client)
- React Native 0.83.4
- React 19.2.0 / React DOM 19.2.0
- New Architecture enabled (`app.config.ts` → `newArchEnabled: true`) — Fabric renderer + TurboModules. Requires `react-native-worklets` 0.7.2 (peer of Reanimated 4).

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (committed, lockfileVersion v3)

### Frameworks

**Core:**
- `expo` ~55.0.9 — Managed Expo platform, also provides CLI (`expo start`, `expo lint`).
- `expo-router` ~55.0.10 — File-based router used in `app/`. `package.json` `main` points at `expo-router/entry`. Typed routes enabled (`app.config.ts` → `experiments.typedRoutes: true`).
- `react-native` 0.83.4 + `react` 19.2.0.
- `@react-navigation/native` ^7.1.33 — Underlying navigation primitives consumed by Expo Router.
- `react-native-safe-area-context` ~5.6.2, `react-native-screens` ~4.23.0 — Native screen container + insets.

**State management:**
- React Context only (`ThemeContext`, `DatabaseContext`, `AuthContext`, `SyncContext`, `SubscriptionContext`, `AppStateContext`, `SocialContext`).
- No Redux, no Zustand, no MobX. SQLite is the single source of truth for persistent learning state.

**UI / animation:**
- `react-native-reanimated` 4.2.1 (with `react-native-worklets` 0.7.2)
- `react-native-svg` 15.15.3
- `react-native-purchases-ui` ^9.15.0 — RevenueCat-hosted paywall component.
- `expo-haptics` ~55.0.11
- `expo-linear-gradient` ~55.0.11
- `expo-symbols` ~55.0.7 — SF Symbols (iOS) / Material Symbols (Android).
- `expo-splash-screen` ~55.0.15, `expo-status-bar` ~55.0.5
- `react-error-boundary` ^6.1.1 (React-19 compatible) — used alongside `Sentry.ErrorBoundary` in `app/_layout.tsx`.

**Fonts:**
- `expo-font` ~55.0.4
- `@expo-google-fonts/amiri` ^0.4.1 — Arabic serif (Amiri Regular + Bold).
- `@expo-google-fonts/inter` ^0.4.2 — Body sans (Regular, Medium, SemiBold, Bold).
- `@expo-google-fonts/lora` ^0.4.2 — Headings serif (Regular, Medium, SemiBold, Bold, Italic).

**Testing:**
- `vitest` ^4.1.2 — test runner (NOT Jest). Config: `vitest.config.ts`.
- `@vitest/coverage-v8` ^4.1.2 — V8 coverage provider; `coverage` reporter outputs `text` and `json-summary`.
- Test glob: `src/__tests__/**/*.test.{js,ts}`. Setup file: `src/__tests__/setup.ts`.
- Coverage targets `src/**/*.{ts,tsx,js,jsx}` and `app/**/*.{ts,tsx,js,jsx}`, excluding `src/__tests__/**` and `node_modules/**`.

**Build / dev:**
- Metro bundler — wrapped through `@sentry/react-native/metro` in `metro.config.js` (single line: `module.exports = getSentryExpoConfig(__dirname);`).
- `expo-dev-client` ~55.0.22 — required for native modules under EAS Build.
- ESLint 9 (`eslint`) + `eslint-config-expo` ~55.0.0, flat-config (`eslint.config.js`). `dist/*` is the only ignore.
- TypeScript ~5.9.2 (`tsc --noEmit` for typecheck).
- `ts-node` ^10.9.2, `dotenv` ^17.3.1 — dev-only utilities (no runtime usage in `src/`).

### Key Dependencies

**Critical (data + auth + monetization):**
- `expo-sqlite` ~55.0.13 — Local persistence. Single DB `tila.db` opened in `src/db/client.ts`. Schema version 7 with manual migrations 2-7.
- `@supabase/supabase-js` ^2.101.1 — Cloud auth + Postgres tables for sync/social. Client in `src/auth/supabase.ts`.
- `@react-native-async-storage/async-storage` 2.2.0 — Encrypted Supabase session payload storage (sessions exceed SecureStore's 2KB limit).
- `expo-secure-store` ~55.0.11 — Stores the AES-256 key for the encrypted Supabase session in iOS Keychain / Android Keystore.
- `aes-js` ^3.1.2 (+ `@types/aes-js` ^3.1.4) — AES-256 CTR for the `LargeSecureStore` wrapper around Supabase sessions (`src/auth/supabase.ts`).
- `expo-crypto` ~55.0.12 — `Crypto.getRandomValues` for the AES key + SHA-256 nonce hashing for Apple Sign-In.
- `react-native-purchases` ^9.15.0 — RevenueCat SDK (`src/monetization/revenuecat.ts`). Currently a no-op at runtime: `SubscriptionProvider` returns a hard-coded "everything unlocked" beta stub (`src/monetization/provider.tsx`), so `Purchases.configure()` is wired but the provider does not call it.
- `react-native-purchases-ui` ^9.15.0 — `RevenueCatUI.presentPaywall()` used in `src/monetization/paywall.ts`.
- `expo-apple-authentication` ~55.0.11 — Native Apple Sign-In (iOS only; plugin and `usesAppleSignIn` are gated by `IS_DEV` so dev builds skip it).
- `@react-native-google-signin/google-signin` ^16.1.2 — Native Google Sign-In; `GoogleSignin.configure()` is called lazily to avoid an iOS TurboModule SIGABRT (`src/auth/google.ts`).

**Analytics + observability:**
- `posthog-react-native` ^4.39.0 — Product analytics (`src/analytics/posthog.ts`).
- `@sentry/react-native` ~7.11.0 — Error tracking + Metro plugin (`src/analytics/sentry.ts`, `metro.config.js`, Expo plugin block in `app.config.ts`).

**Audio + media:**
- `expo-audio` ~55.0.11 — Single voice player + single SFX player in `src/audio/player.ts`. 28 letter-name + 28 letter-sound WAVs are bundled via `require()`. Sound effects: `correct`, `wrong`, `lesson_start`, `lesson_complete`, `lesson_complete_perfect`, `onboarding_complete`, `sacred_moment`.
- `expo-asset` ~55.0.10 — Static asset registration.

**Routing + linking:**
- `expo-linking` ~55.0.11 — Deep links (`tila://invite/<code>` shape produced in `src/social/invite.ts`).
- `expo-web-browser` ~55.0.12 — In-app browser for OAuth callbacks (Expo plugin).
- `expo-constants` ~55.0.9 — Reads `app.config.ts` `extra` (`eas.projectId`).

**Web polyfills (used by Supabase under React Native):**
- `react-native-url-polyfill` ^3.0.0 — `import 'react-native-url-polyfill/auto'` at the top of `src/auth/supabase.ts`.
- `react-native-web` ~0.21.0, `react-dom` 19.2.0 — Present for `expo start --web` development only; not a production target.

### Configuration

**Environment:**
- `.env` and `.env.local` — present at repo root. Values are NOT inspected here; only their existence is noted. All runtime env reads use the `EXPO_PUBLIC_*` convention (Expo inlines these at build time).
- Runtime-consumed env vars (referenced by `src/`):
  - `EXPO_PUBLIC_SUPABASE_URL` — `src/auth/supabase.ts`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY` — `src/auth/supabase.ts`
  - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` — `src/auth/google.ts`
  - `EXPO_PUBLIC_REVENUECAT_IOS_KEY` — `src/monetization/revenuecat.ts` (wired but not invoked by current beta provider stub)
  - `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` — `src/monetization/revenuecat.ts` (same)
  - `EXPO_PUBLIC_POSTHOG_KEY` — `src/analytics/posthog.ts`
  - `EXPO_PUBLIC_POSTHOG_HOST` — `src/analytics/posthog.ts` (defaults to `https://us.i.posthog.com`)
  - `EXPO_PUBLIC_SENTRY_DSN` — `src/analytics/sentry.ts`
  - `EXPO_PUBLIC_DEV_REFERENCE_LESSON` — gate for the hidden dev reference lesson at `app/sandbox-lesson.tsx` (per `src/curriculum/README.md`)
  - `EAS_BUILD_PROFILE` — read in `app.config.ts` to flip `IS_DEV` (controls whether `expo-apple-authentication` plugin and `usesAppleSignIn` are included)

**App config:**
- `app.config.ts` — Expo manifest (TS). Owner `tila.app`, slug `tila`, scheme `tila`, portrait orientation, automatic `userInterfaceStyle`, `newArchEnabled: true`, splash background `#F8F6F0`. iOS bundle `com.tilaapp.tila`, Android package `com.tila.app`. Includes iOS `NSPrivacyAccessedAPITypes` (`UserDefaults` reason `CA92.1`) and `NSPrivacyCollectedDataTypes` (Email, UserID, OtherUsageData — all linked, not used for tracking, purpose `AppFunctionality`). `ITSAppUsesNonExemptEncryption: false`. Plugins: `expo-router`, `expo-font`, `expo-splash-screen`, `expo-sqlite`, `expo-audio`, `expo-secure-store`, `expo-asset`, conditionally `expo-apple-authentication`, `expo-web-browser`, `@react-native-google-signin/google-signin`, and `@sentry/react-native/expo` (org `tila`, project `tila-mobile`). `extra.eas.projectId = c0ef7427-a094-45c2-b7cd-bef77dae665b`.
- `tsconfig.json` — extends `expo/tsconfig.base`. Strict mode on. Path alias `@/*` → `./*` (project root). Includes `**/*.ts`, `**/*.tsx`, `.expo/types/**/*.ts`, `expo-env.d.ts`.
- `vitest.config.ts` — see Testing above.
- `metro.config.js` — Sentry-wrapped Metro config (one line).
- `eslint.config.js` — flat config wrapping `eslint-config-expo/flat`, ignores `dist/*`.

**Build:**
- `eas.json` — CLI version `>= 15.0.0`, `appVersionSource: "remote"` (versions managed in EAS dashboard).
  - Profiles:
    - `development` — `developmentClient: true`, internal distribution.
    - `development:simulator` — internal, `ios.simulator: true`.
    - `preview` — internal distribution.
    - `production` — `autoIncrement: true`.
  - Submit: production iOS configured with `ascAppId: "6761349651"`. Android submit not configured in `eas.json` at this time.

### Platform Requirements

**Development:**
- Node.js + npm (npm lockfile is committed).
- Expo CLI via `npx expo` or local `expo start`.
- Xcode 15+ (iOS) and/or Android SDK 34+ (Android emulator/device) for native builds via EAS.
- A working Supabase project, PostHog project, Sentry project, RevenueCat project, and Google OAuth Web client are required for the corresponding features to function in dev. Apple Sign-In requires an Apple Developer account.

**Production:**
- iOS: App Store distribution via `eas submit --platform ios` (`ascAppId 6761349651`).
- Android: Google Play distribution via `eas submit --platform android` (no submit profile encoded in `eas.json` yet — configured outside the file).
- Versioning is remote: bump occurs in EAS dashboard, not in `app.config.ts`.

### Build & Deployment Notes

- New Architecture is on; any added native module must be NA-compatible.
- Sentry source maps + Metro symbolication run automatically via the `@sentry/react-native/metro` wrapper plus the Sentry Expo plugin.
- The codebase went through a curriculum reset on 2026-04-20 (see `.planning/STATE.md` and `src/curriculum/README.md`). `src/engine/questions/`, `useLessonQuiz`, `LESSONS`, `engagement.ts`, `insights.ts`, `selectors.ts`, and `outcome.ts` no longer exist on `main`. Lesson code now lives in `src/curriculum/` (`runtime/LessonRunner.tsx`, `lessons/lesson-01.ts`, `ui/`). EAS builds on `main` were paused during reset and are still gated on device verification of the sandbox reference lesson.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

### Naming Patterns

**Files:**
- React components: `PascalCase.tsx` — `LessonRunner.tsx`, `LessonChrome.tsx`, `TapExercise.tsx`, `HearExercise.tsx`, `ReadExercise.tsx`
- Pure utilities/runtime modules: `kebab-case.ts` — `mastery-recorder.ts`, `completion-store.ts`, `url-resolver.ts`, `cursor.ts`, `outcome.ts`
- Hooks: `useCamelCase.ts` with `use` prefix — `useProgress.ts`, `useMastery.ts`, `useHabit.ts`, `useThemePreference.ts`
- Engine modules: lowercase single word — `mastery.ts`, `progress.ts`, `habit.ts`, `dateUtils.ts`, `features.ts`
- Auth modules: lowercase domain word — `apple.ts`, `google.ts`, `email.ts`, `provider.tsx`, `supabase.ts`, `types.ts`
- Lesson data files: `lesson-NN.ts` (zero-padded) — `src/curriculum/lessons/lesson-01.ts`
- Test files: `*.test.{ts,js}` co-located in `src/__tests__/` — `curriculum-cursor.test.ts`, `mastery.test.js`
- Test helpers: `helpers/mock-*.ts` — `src/__tests__/helpers/mock-db.ts`, `src/__tests__/helpers/mock-supabase.ts`

**Directories:**
- Domain folders use kebab-case or single-word lowercase: `src/curriculum/`, `src/curriculum/runtime/`, `src/curriculum/ui/exercises/`, `src/curriculum/lessons/`
- Test grouping mirrors source: `src/__tests__/curriculum/` for curriculum-specific tests

**Functions:**
- Exported pure functions: `camelCase` — `advanceCursor`, `retreatCursor`, `computeLessonOutcome`, `resolveLessonId`, `normalizeEntityKey`, `mergeQuizResultsIntoMastery`
- React components: `PascalCase` — `LessonRunner`, `TapExercise`, `AuthProvider`, `LessonChrome`
- Event handlers: `handle` prefix — `handleTap`, `handleCheck`, `handleReplay`, `handleContinue`, `handleSignInWithEmail`, `handleSignOut`
- Helper/internal: descriptive `camelCase` — `playModelAudio`, `keyFor`, `emitEntityAttempts`, `confirmExit`, `isScored`, `isDecoding`
- Type guards: `is` prefix — `isScored(screen)`, `isDecoding(screen)` in `src/curriculum/runtime/outcome.ts`
- Selectors / derived getters: `get` or `derive` prefix — `deriveMasteryState`, `deriveSkillKeysFromQuestion`, `deriveConfusionKey`, `getCompletion`

**Variables:**
- Local state: `camelCase` — `authState`, `optionStates`, `locked`, `playing`, `reduceMotion`, `isComplete`
- React state setters: `set` + PascalCase — `setAuthState`, `setOptionStates`, `setIsComplete`, `setReduceMotion`
- Refs: descriptive name + `Ref` suffix — `outcomesRef`, `lockTimer`, `audioTimer`, `advanceTimerRef`, `wrongTimerRef`, `attemptRef`, `initializedRef`
- Constants: `SCREAMING_SNAKE_CASE` — `READ_ATTEMPT_DELAY_MS`, `READ_AUDIO_DURATION_MS`, `FADE_MS`, `WRONG_FEEDBACK_MS`, `CORRECT_ADVANCE_MS`, `KEY_PREFIX`, `INITIAL_STATE`, `EXPECTED_SCREEN_IDS`, `KNOWN_ENTITY_KEYS`, `PART_LABELS`

**Types:**
- Interfaces / type aliases: `PascalCase` — `LessonData`, `Screen`, `TeachingScreen`, `ExerciseScreen`, `Exercise`, `TapExercise`, `HearExercise`, `ReadExercise`, `EntityAttempt`, `ScreenOutcome`, `LessonOutcome`, `MasteryRecorder`, `EntityAttemptEvent`, `LessonOutcomeEvent`, `CompletionStore`, `AuthState`, `AuthContextValue`, `AdvanceResult`, `RetreatResult`
- Discriminated-union member field is `kind` (`"teach" | "exercise"`) on `Screen`, and `type` (`"tap" | "hear" | "read" | …`) on `Exercise` and `TeachingBlock` (`src/curriculum/types.ts`)
- Entity-key string aliases: `EntityKey` — see `src/curriculum/types.ts:3`. Format: `letter:ba`, `combo:ba+fatha`, `mark:fatha`. **Note:** legacy engine code in `src/engine/mastery.ts` still uses the older `letter:2` (numeric id) and `combo:ba-fatha` (hyphen) format. New curriculum code uses `letter:ba` (slug) and `combo:ba+fatha` (plus). Do not unify these without a migration.

### Code Style

**Formatting:**
- ESLint flat config, `eslint-config-expo` (`eslint.config.js`)
- No Prettier config — ESLint enforces formatting
- 2-space indentation, double quotes for strings (curriculum + engine), single quotes appear in legacy auth/test files (`src/auth/provider.tsx`, `src/__tests__/auth-flow.test.ts`). Do not mix within a file; match what's already there.
- Trailing semicolons required
- Run with: `npm run lint` (invokes `npx expo lint`)

**Linting:**
- TypeScript strict mode enforced via `tsconfig.json` (`"strict": true`)
- Run with: `npm run typecheck` (invokes `tsc --noEmit`)
- Combined gate: `npm run validate` (runs `npm run lint && npm run typecheck`). Always run before committing.
- Inline lint suppressions are explicit and narrow: `// eslint-disable-next-line no-console` (only on `console.warn` debug paths in `src/curriculum/runtime/completion-store.ts` and `mastery-recorder.ts`)

### Import Organization

**Order observed across the codebase:**
1. Node / external deps (`react`, `react-native`, `@supabase/supabase-js`, `@react-native-async-storage/async-storage`, `vitest`)
2. Type-only imports (`import type { ... }`) — kept separate from runtime imports
3. Internal absolute or relative imports

**Path Aliases:**
- `@/*` maps to project root (`tsconfig.json:6`)
- Used sparingly; most curriculum and engine code uses **relative imports** because intra-domain (e.g., `import type { LessonData } from "../types"`, `import { advanceCursor } from "./cursor"`)
- `@/`-aliased imports are preferred for cross-domain access from `app/` route files

**Type imports:**
- Always use `import type { … }` for compile-time-only symbols. Examples:
  - `import type { LessonData, Screen, EntityKey } from "../types";` (`src/curriculum/runtime/LessonRunner.tsx:6`)
  - `import type { AuthEvent, Session } from '@supabase/supabase-js';` (`src/auth/provider.tsx:2`)
  - `import type { ReactNode } from "react";` (`src/curriculum/runtime/LessonRunner.tsx:2`)

**Default vs named:**
- Named imports for everything by default
- Default imports only when the module exports a default (e.g., `import AsyncStorage from "@react-native-async-storage/async-storage";`)
- Components export by name: `export function LessonRunner(...)` — no default-export components in `src/curriculum/`

**Barrels:**
- Used selectively. Example: `src/curriculum/lessons/index.ts` exports `lessonRegistry`. `src/curriculum/ui/exercises/index.tsx` exports the `renderExercise` dispatcher.
- Engine has a placeholder barrel `src/engine/index.ts` (effectively empty: `export {};`). Import engine functions directly from their module file.

### Error Handling

**Async wrapper pattern (auth, storage):**
```ts
// src/auth/email.ts
export async function signInWithEmail(email, password): Promise<{ data, error: Error | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { data: null, error: new Error(error.message) };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
```
- All auth/sync functions return a `{ data?, error: Error | null }` discriminated result instead of throwing.
- Caller pattern: `if (error) return { error };` (early-return guard) — see `src/auth/provider.tsx:75`.
- Error narrowing: `err instanceof Error ? err : new Error(String(err))`.

**Storage / non-critical async (warn-and-swallow):**
- `src/curriculum/runtime/completion-store.ts` and `mastery-recorder.ts` wrap each AsyncStorage call in try/catch, log via `console.warn` guarded by `if (typeof __DEV__ !== "undefined" && __DEV__)`, and return a safe default (`false` for reads, no-op for writes). Never re-throws.

**Audio (warn-and-continue):**
- `src/audio/player.ts` `playVoice` and `playSFX` are wrapped in try/catch and log via `console.warn("Voice playback failed:" …)` / `console.warn("SFX playback failed:" …)`. Catch blocks **must not re-throw** — enforced by `src/__tests__/audio-safety.test.ts` (CONT-01).

**Database init (state-machine + timeout):**
- `DatabaseProvider` uses a three-state machine (`"loading" | "error" | "ready"`), a 15-second timeout, an `attemptRef` guard against stale promise resolution, and renders an `<ErrorFallback>` on failure. Behavior locked in by `src/__tests__/db-init.test.ts`.

**Component runtime failures:**
- Wrap with `react-error-boundary` (`react-error-boundary` v6.1.1 is in `package.json`).
- Error events captured via `Sentry.captureException()` from the analytics layer.

**Defensive engine inputs:**
- Pure cursor / outcome helpers handle out-of-range inputs without throwing. Examples in `src/curriculum/runtime/cursor.ts`: `advanceCursor(0, 0)` returns `{ nextIndex: null, complete: true }`; `retreatCursor(0, 5)` returns `{ prevIndex: null }`. Tests in `src/__tests__/curriculum-cursor.test.ts` enforce this.

### Logging

**Production:**
- `Sentry.captureException()`, `Sentry.captureMessage()`, `Sentry.addBreadcrumb()` from `@sentry/react-native`
- PostHog `track('event_name', payload)` — typed event map in `src/analytics/events.ts`. Always use the typed wrapper, never call `posthog.capture` directly.

**Development:**
- `console.warn(...)` for non-fatal failures, **guarded** by `if (typeof __DEV__ !== "undefined" && __DEV__)` and an inline `// eslint-disable-next-line no-console` (see `completion-store.ts:20-22`, `mastery-recorder.ts:33-34`).
- Tagged prefixes for grep-ability: `[completion-store]`, `[mastery:stub]`.

**Forbidden in production paths:**
- Bare `console.log` — only `console.warn` inside `__DEV__` guards is acceptable.
- No verbose stdout output in shipping code.

### Comments

**Section dividers:**
- Use box-drawing comments to mark logical sections inside larger files:
  ```ts
  // ────────────────────────────────────────────────────────────
  // Teaching blocks — composable atoms for teaching screens
  // ────────────────────────────────────────────────────────────
  ```
  See `src/curriculum/types.ts:5-7`, `:86-88`, `:159-161`.
- Shorter inline section dividers: `// ── Visibility gates ──` (`src/curriculum/ui/exercises/ReadExercise.tsx:111`), `// ── Mock the Supabase singleton used by auth functions ──` (`src/__tests__/auth-flow.test.ts:13`).

**JSDoc:**
- Used on exported pure functions and on type-union members that need authoring guidance. Examples:
  - `src/curriculum/runtime/cursor.ts:3-6` — describes terminal-state semantics for `advanceCursor`.
  - `src/curriculum/runtime/url-resolver.ts:1-5` — describes the param-mapping contract.
  - `src/curriculum/types.ts` JSDocs document SPEC constraints inline on individual block fields (e.g., `autoPlay` permitted only on Teach screens — Constraint 3).
- Not required on every function. Apply when (a) the function is a public engine/runtime API, (b) the behavior encodes a SPEC constraint, or (c) the parameter shape isn't obvious from the type alone.

**Constraint references:**
- When a code path enforces a curriculum-spec rule, cite it: `// SPEC Constraint 2: micro-attempt enforcement.` (`src/curriculum/ui/exercises/ReadExercise.tsx:17`). Tests reference the same constraint by name (`src/__tests__/curriculum/read-exercise-contract.test.ts:5`).

**Avoid:**
- Redundant comments restating the next line of code.
- TODO/FIXME without an owner/issue reference (current code has near-zero of these — keep it that way).

### Function Design

**Parameter shapes:**
- 1–2 args: positional (`advanceCursor(current: number, total: number)`, `keyFor(lessonId: string)`, `signInWithEmail(email, password)`)
- 3+ args or component props: destructured object — see `LessonRunner({ lesson, masteryRecorder, onComplete, renderScreen })` (`src/curriculum/runtime/LessonRunner.tsx:35`)
- Optional callbacks marked with `?`: `onPlayAudio?: (path: string) => void` (`src/curriculum/ui/exercises/HearExercise.tsx:13`)

**Return shapes:**
- Async result-object pattern: `Promise<{ data: T | null; error: Error | null }>` (`src/auth/email.ts`)
- Pure utilities return small typed result records: `AdvanceResult = { nextIndex: number | null; complete: boolean }`, `RetreatResult = { prevIndex: number | null }`
- Hooks return objects (not tuples) so callers destructure by name: `useProgress()` returns `{ ...state, loading, saveMasteryOnly, updateProfile, refresh }` (`src/hooks/useProgress.ts:61-67`).

**Pure-function discipline:**
- Everything under `src/curriculum/runtime/cursor.ts`, `outcome.ts`, `url-resolver.ts` is pure (no side effects, no React, no platform APIs). Keep it that way — these are the most-tested modules.
- `src/engine/*` is also pure JS with zero React deps. New engine code must follow this rule.

**Side-effect isolation:**
- Side effects (audio playback, navigation, analytics) are passed in as callback props — never imported inside a pure module. Example: `LessonRunner` accepts `masteryRecorder` and `renderScreen`; it does not call analytics or audio directly.

**Component props:**
- Each component declares an `interface Props { … }` immediately above its function. See `src/curriculum/ui/exercises/TapExercise.tsx:8`, `HearExercise.tsx:8`, `ReadExercise.tsx:8`.
- Props that share a shape across exercises (`screenId`, `advance`, `reportAttempt`, `onPlayAudio`) are kept in identical positions for dispatcher symmetry — see `renderExercise` in `src/curriculum/ui/exercises/index.tsx:18-65`.

**Cleanup discipline:**
- Every `setTimeout` stored in a ref (`useRef<ReturnType<typeof setTimeout> | null>(null)`) and cleared in a `useEffect` cleanup. See `TapExercise.tsx:38-43`, `ReadExercise.tsx:69-79`.
- Every event subscription returned from `addEventListener` is removed in cleanup. See `ReadExercise.tsx:43-50`, `LessonChrome.tsx:50-55`.

### Module Design

**Exports:**
- Named exports preferred for everything (functions, components, constants, types).
- No default-exported components in `src/curriculum/`. Default exports are reserved for libraries that require them (e.g., `AsyncStorage`).
- Test-only exports use a `__testing` suffix object so they don't pollute the public surface: `export const __testing = { READ_ATTEMPT_DELAY_MS, READ_AUDIO_DURATION_MS };` (`src/curriculum/ui/exercises/ReadExercise.tsx:251`).

**Single responsibility:**
- One concern per file. `cursor.ts` only knows about cursor math; `outcome.ts` only computes pass/fail; `mastery-recorder.ts` only describes the persistence interface; `completion-store.ts` only persists lesson-completion booleans.
- The `MasteryRecorder` interface lives next to the no-op implementation. Real SQLite-backed implementations should live in their own file and conform to the same interface — do not extend the interface without updating the noop.

**Dispatcher pattern:**
- Polymorphic rendering uses an exhaustive switch over a discriminated union — see `renderExercise` in `src/curriculum/ui/exercises/index.tsx:26-65`. New exercise types must extend the `case` set; the unimplemented branch returns `<UnimplementedExercise type={...} />` rather than throwing.

**Boundary rules (enforced by convention, not lint):**
- `src/curriculum/runtime/*` may not import from `react-native` (LessonRunner is the lone exception, and it imports only `useState`/`useCallback`/`useRef` from `react`, never `react-native`).
- `src/curriculum/ui/*` may import from `react-native` and the design system.
- `app/lesson/[id].tsx` is the only place that wires `LessonRunner` to navigation, audio, and the SQLite-backed mastery recorder.

### TypeScript Conventions

**Strict mode:**
- `"strict": true` in `tsconfig.json` — no implicit `any`, no implicit returns, strict null checks all on.

**Discriminated unions over enums:**
- Use string-literal unions with a discriminant field instead of TS enums. Examples:
  - `Screen.kind: "teach" | "exercise"`
  - `Exercise.type: "tap" | "hear" | "choose" | "build" | "read" | "fix"`
  - `TeachingBlock.type: "text" | "heading" | "reading-direction" | "glyph-display" | "shape-variants" | "audio" | "name-sound-pair" | "mark-preview"`
  - `AuthMethod = "apple" | "google" | "email"`
- Narrow with `if (screen.kind === "exercise") { … }`. The compiler then knows `screen.exercise` is defined.

**Avoid `any`:**
- Engine internals that predate the type tightening still use `any` in places (e.g., `question: any` in some legacy components). Treat any new `any` as a code smell and use `unknown` + a type guard instead.
- For unknown maps from native modules: `Record<string, unknown>` (see `vitest.config.ts` setup mocks).

**Type-only imports:**
- Always use `import type { … }` for compile-time-only symbols (interfaces, type aliases, prop types). Reduces bundle size and avoids accidental runtime imports of barrel files.

**Generics:**
- Single uppercase letters: `T`, `K`, `V`. Used in mock helpers and the `MasteryRecorder` event types.

**`@ts-expect-error`:**
- Used to encode required-field assertions in tests (e.g., `src/__tests__/curriculum/read-exercise-contract.test.ts:7` proves `audioModel` is required by deliberately omitting it).

**Const assertions and readonly:**
- Constant lookup tables use plain `const` records: `const PART_LABELS: Record<string, string> = { … }` (`src/curriculum/ui/LessonChrome.tsx:18`). No need for `as const` unless inferring narrow literal types.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

### Pattern Overview

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

### Layers

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

### Data Flow

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

### Database Tables

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

### Contexts / Providers

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

### Key Abstractions

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

### Entry Points

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

### Error Handling

**Strategy:** Layered boundaries + result-object-returning async operations. Never let an unhandled rejection bubble.

**Patterns:**
- **Outer boundary:** `Sentry.ErrorBoundary` in `app/_layout.tsx` with `ErrorFallback` retry. Captures unhandled render errors automatically.
- **Per-screen boundary:** Home wraps its content in `react-error-boundary`'s `ErrorBoundary` with `ScreenErrorFallback` and a Sentry `onError`.
- **Database init:** `DatabaseProvider` uses an attempt-id ref + 15 s timeout to surface a retry UI rather than hang.
- **Async operations:** Auth, sync, and monetization return `{ error: Error | null }` shaped results. Sync's `syncAll` "never throws — returns errors in `SyncResult` for offline-first safety" (see `src/sync/service.ts`).
- **Transactions:** All multi-row writes use `db.withExclusiveTransactionAsync` and read fresh DB rows inside the transaction (see `useHabit.recordPractice` and `AppStateProvider.recordPractice`) to avoid stale-closure bugs.
- **Audio failures:** `playByPath` failures swallow silently in production; `__DEV__` logs.
- **Type narrowing on caught errors:** `err instanceof Error ? err : new Error(String(err))` (see `DatabaseProvider`).

### Cross-Cutting Concerns

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
