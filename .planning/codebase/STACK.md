# Technology Stack

**Analysis Date:** 2026-04-27

## Languages

**Primary:**
- TypeScript 5.9.2 — All application code under `app/` and `src/`. Strict mode enabled (`tsconfig.json`).

**Secondary:**
- JavaScript (CommonJS) — Tooling configs only: `metro.config.js`, `eslint.config.js`. No application-level JS sources are imported from `src/data/` anymore (the curriculum reset removed `src/data/lessons.js`; the surviving `letters.js`, `harakat.js`, `connectedForms.js` reference data is the only JS in `src/`).

## Runtime

**Environment:**
- Expo SDK 55.0.9 (managed workflow with dev client)
- React Native 0.83.4
- React 19.2.0 / React DOM 19.2.0
- New Architecture enabled (`app.config.ts` → `newArchEnabled: true`) — Fabric renderer + TurboModules. Requires `react-native-worklets` 0.7.2 (peer of Reanimated 4).

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (committed, lockfileVersion v3)

## Frameworks

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

## Key Dependencies

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

## Configuration

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

## Platform Requirements

**Development:**
- Node.js + npm (npm lockfile is committed).
- Expo CLI via `npx expo` or local `expo start`.
- Xcode 15+ (iOS) and/or Android SDK 34+ (Android emulator/device) for native builds via EAS.
- A working Supabase project, PostHog project, Sentry project, RevenueCat project, and Google OAuth Web client are required for the corresponding features to function in dev. Apple Sign-In requires an Apple Developer account.

**Production:**
- iOS: App Store distribution via `eas submit --platform ios` (`ascAppId 6761349651`).
- Android: Google Play distribution via `eas submit --platform android` (no submit profile encoded in `eas.json` yet — configured outside the file).
- Versioning is remote: bump occurs in EAS dashboard, not in `app.config.ts`.

## Build & Deployment Notes

- New Architecture is on; any added native module must be NA-compatible.
- Sentry source maps + Metro symbolication run automatically via the `@sentry/react-native/metro` wrapper plus the Sentry Expo plugin.
- The codebase went through a curriculum reset on 2026-04-20 (see `.planning/STATE.md` and `src/curriculum/README.md`). `src/engine/questions/`, `useLessonQuiz`, `LESSONS`, `engagement.ts`, `insights.ts`, `selectors.ts`, and `outcome.ts` no longer exist on `main`. Lesson code now lives in `src/curriculum/` (`runtime/LessonRunner.tsx`, `lessons/lesson-01.ts`, `ui/`). EAS builds on `main` were paused during reset and are still gated on device verification of the sandbox reference lesson.

---

*Stack analysis: 2026-04-27*
