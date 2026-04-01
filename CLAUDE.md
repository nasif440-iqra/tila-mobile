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

**Tila — Stability & App Store Readiness**

Tila is a mobile app that teaches converts and new Muslims to read the Quran, starting from the Arabic alphabet. Built with Expo 55 / React Native 0.83, it uses mastery-based learning with spaced repetition, offline-first SQLite storage, and a freemium model (RevenueCat). The UI overhaul milestone is ~90% complete. This milestone hardens the codebase for App Store submission.

**Core Value:** The app must never crash, hang, or lose user progress. Every session — from first launch to lesson 50 — must feel solid and trustworthy.

### Constraints

- **Stack**: Expo SDK 55, React Native 0.83, New Architecture — no framework changes
- **No business logic changes**: Engine algorithms stay the same, we're fixing bugs not redesigning
- **Offline-first**: All fixes must work without network connectivity
- **Performance**: No regressions on mid-range Android (60fps animations must hold)
- **Backwards compatible**: Existing user data (SQLite) must not be corrupted by fixes
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Existing Stack (Do Not Change)
| Technology | Version | Status |
|------------|---------|--------|
| Expo SDK | 55.0.8 | Locked |
| React Native | 0.83.2 | Locked |
| React | 19.2.0 | Locked |
| TypeScript | 5.9.2 | Locked |
| expo-sqlite | 55.0.11 | Locked |
| react-native-purchases | 9.15.0 | Locked |
| Sentry | 7.11.0 | Locked |
| PostHog | 4.39.0 | Locked |
| Vitest | 4.1.2 | Locked |
| react-native-reanimated | 4.2.1 | Locked |
| expo-audio | 55.0.9 | Locked |
## Recommended Additions
### 1. Error Boundaries
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `react-error-boundary` | ^6.1.1 | Component-level crash recovery | De-facto standard by Brian Vaughn (React team). Works with React 19. Provides `ErrorBoundary` component, `useErrorBoundary` hook, and `withErrorBoundary` HOC. Expo Router docs reference this pattern. Handles reset/retry natively. | HIGH |
### 2. Test Coverage Tooling
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `@vitest/coverage-v8` | ^4.1.2 | Code coverage reports | Matches existing Vitest 4.1.2 exactly. V8-based coverage is faster than Istanbul for Node environments. Generates text, HTML, and JSON reports. Zero config beyond adding the package. | HIGH |
### 3. Database Migration Safety
| Approach | Purpose | Why | Confidence |
|----------|---------|-----|------------|
| Transaction-wrapped migrations | Atomic migration execution | `db.withExclusiveTransactionAsync()` ensures a failed migration rolls back cleanly instead of leaving the DB in a half-migrated state. Already available in expo-sqlite 55. | HIGH |
| PRAGMA table_info checks | Column existence verification | Already partially used (migrations v3-v5). Migration v2 uses bare try/catch which swallows real errors. Standardize on PRAGMA checks for all migrations. | HIGH |
### 4. Audio Error Handling
| Approach | Purpose | Why | Confidence |
|----------|---------|-----|------------|
| try/catch on all `player.play()` and `player.replace()` calls | Prevent unhandled promise rejections | expo-audio can throw on corrupted assets, interrupted playback, or audio session conflicts. Currently the `playVoice` function is async but `playSFX` is sync with no error handling. Both need guards. | HIGH |
### 5. Offline Subscription Handling
| Approach | Purpose | Why | Confidence |
|----------|---------|-----|------------|
| `Purchases.getCustomerInfo()` with try/catch + cached fallback | Graceful offline subscription checks | RevenueCat SDK caches the last known CustomerInfo on-device. When offline, `getCustomerInfo()` returns cached data. The app needs to handle the case where the SDK fails to initialize (missing API key, unconfigured) by defaulting to "free tier" rather than crashing. | HIGH |
### 6. Type Safety Improvements
| Approach | Purpose | Why | Confidence |
|----------|---------|-----|------------|
| Strict hook return types | Eliminate `any` leakage from hooks | Hooks currently return spread objects without explicit return types. Adding explicit interfaces prevents downstream `any` propagation. | HIGH |
| `satisfies` operator on data constants | Type-check static data without widening | `LESSONS satisfies Lesson[]` catches data errors at compile time without changing runtime behavior. Available since TS 4.9, underused in codebase. | HIGH |
### 7. App Store Submission Tooling
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| EAS Build (already configured) | CLI >= 15.0.0 | Production builds | Already in `eas.json`. No new tooling needed for builds. | HIGH |
| EAS Submit | (part of EAS CLI) | App Store / Play Store submission | `eas submit` automates upload to both stores. Already available, just needs production build profile. | HIGH |
- Run `npm run validate` (lint + typecheck) — zero errors required
- Run `npm test` — all tests pass
- Production build on real device (not simulator) — full lesson flow test
- "Reviewer run": install fresh, complete onboarding, finish lesson 1, check subscription screen, verify offline behavior
## Alternatives Considered and Rejected
| Category | Recommended | Rejected | Why Not |
|----------|-------------|----------|---------|
| Error boundaries | `react-error-boundary` | `react-native-error-boundary`, hand-rolled class components | Less features, no hook API, more boilerplate |
| Coverage | `@vitest/coverage-v8` | `@vitest/coverage-istanbul`, `c8` standalone | V8 is faster, Istanbul unnecessary overhead, c8 is deprecated |
| DB migrations | Pattern fix (transactions + PRAGMA) | Drizzle ORM, TypeORM, Knex | Massive over-engineering for 8 tables and 5 migrations |
| Audio errors | try/catch wrappers | `expo-av` (legacy API), third-party audio libs | expo-audio is the current Expo standard; switching APIs adds risk |
| Subscription offline | RevenueCat SDK cache (built-in) | Custom caching layer, AsyncStorage mirror | RevenueCat already caches; duplicating is unnecessary complexity |
| State management | Keep current (SQLite + hooks) | Zustand, Jotai, Redux | Adding state management for "stability" is scope creep |
| Testing | Keep Vitest, add coverage | Switch to Jest, add Detox/Maestro E2E | Jest migration is unnecessary churn; E2E is future milestone |
## Installation
# New dependencies (just 2 packages)
# Dev dependencies
## What This Does NOT Cover
- **Dark mode** — tokens exist but activation is a separate milestone
- **E2E testing** (Detox, Maestro) — valuable but separate milestone after stability
- **Cloud sync / backend** — future milestone
- **Push notifications** — future milestone
- **Performance profiling tools** (Flipper, React DevTools Profiler) — dev workflow, not hardening
- **CI/CD pipeline** (GitHub Actions) — valuable but not blocking App Store submission
## Sources
- [Expo Router Error Handling](https://docs.expo.dev/router/error-handling/) — official Expo docs on error boundaries in file-based routing
- [react-error-boundary npm](https://www.npmjs.com/package/react-error-boundary) — v6.1.1, React 19 compatible
- [Expo SQLite Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/) — `withExclusiveTransactionAsync` API
- [@vitest/coverage-v8 npm](https://www.npmjs.com/package/@vitest/coverage-v8) — v4.1.2, matches Vitest version
- [RevenueCat React Native Docs](https://www.revenuecat.com/docs/getting-started/installation/reactnative) — offline caching behavior
- [Expo Audio Documentation](https://docs.expo.dev/versions/latest/sdk/audio/) — AudioPlayer API
- [App Store Best Practices — Expo](https://docs.expo.dev/distribution/app-stores/) — submission checklist
- [App Store Review Guidelines 2025](https://nextnative.dev/blog/app-store-review-guidelines) — common rejection reasons
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
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
