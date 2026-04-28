# External Integrations

**Analysis Date:** 2026-04-27

This document covers third-party services and SDKs the app integrates with. Implementation files and entry points are cited so future changes can navigate directly to the wiring.

## APIs & External Services

### Supabase (auth + Postgres)

- **SDK:** `@supabase/supabase-js` ^2.101.1
- **Purpose:** Cloud authentication (email/password, Apple Sign-In, Google Sign-In) and a Postgres backend for cross-device sync and social features.
- **Client:** `src/auth/supabase.ts` — single shared `supabase` client created with `createClient(url, anonKey, { auth: { storage: new LargeSecureStore(), autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } })`.
- **Auth env vars:**
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **Session storage:** `LargeSecureStore` (defined in `src/auth/supabase.ts`) encrypts the Supabase session payload with AES-256-CTR and keeps the ciphertext in `@react-native-async-storage/async-storage`. The 32-byte encryption key is generated with `expo-crypto`'s `getRandomValues` and stashed in `expo-secure-store` under the key `supabase-encryption-key`. This works around SecureStore's 2KB per-item limit.
- **Polyfill:** `import 'react-native-url-polyfill/auto'` is the first import in `src/auth/supabase.ts` (Supabase requires the URL global on RN).
- **Provider entry:** `src/auth/provider.tsx` → `AuthProvider` mounted in `app/_layout.tsx`. Subscribes to `supabase.auth.onAuthStateChange` and exposes `{ user, session, isAnonymous, loading, initialized, signInWith[Email|Apple|Google], signUpWithEmail, signOut }` via `AuthContext`.
- **Hook:** `src/auth/hooks.ts` (`useAuth`).
- **Sync usage:** `src/sync/service.ts` reads/writes the tables listed in `src/sync/tables.ts` (`user_profiles`, `mastery_entities`, `mastery_skills`, `mastery_confusions`, `lesson_attempts`, `question_attempts`, `habit`, `premium_lesson_grants`) using a last-write-wins strategy keyed off `user_id` plus per-table primary keys (some use a `local_id` remap via `remoteKeyColumn`).
- **Social usage:** `src/social/friends.ts` (tables `friend_streaks` view + `friendships`) and `src/social/invite.ts` (table `invite_codes`).

### Apple Sign-In

- **SDK:** `expo-apple-authentication` ~55.0.11
- **Purpose:** Native iOS Apple Sign-In, used as an OAuth bridge to Supabase (`signInWithIdToken`).
- **Entry file:** `src/auth/apple.ts` (`signInWithApple`, `isAppleSignInAvailable`).
- **Flow specifics:**
  - Generates a `Crypto.randomUUID()` raw nonce and SHA-256 hashes it via `expo-crypto` `digestStringAsync` before passing the hashed value to Apple and the raw value to Supabase.
  - Captures `fullName` only on first authorization (Apple sends it once) and writes it back via `supabase.auth.updateUser({ data: { full_name } })`.
- **Plugin gating:** `app.config.ts` only includes the `expo-apple-authentication` plugin and `usesAppleSignIn: true` when `EAS_BUILD_PROFILE !== "development"`. Dev builds intentionally drop Apple Sign-In to keep them buildable without entitlement provisioning.

### Google Sign-In

- **SDK:** `@react-native-google-signin/google-signin` ^16.1.2
- **Purpose:** Native Google Sign-In, also bridged to Supabase via `signInWithIdToken`.
- **Entry file:** `src/auth/google.ts` (`signInWithGoogle`).
- **Env var:** `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (the Web OAuth client ID, not iOS/Android).
- **Quirk:** `GoogleSignin.configure()` is invoked lazily inside `ensureConfigured()` because calling it at module load crashes iOS with a TurboModule SIGABRT. `GoogleSignin.hasPlayServices()` is awaited before `signIn()`.
- **Plugin:** Listed in `app.config.ts` plugins array (`@react-native-google-signin/google-signin`).

### Email / Password (Supabase)

- **Entry file:** `src/auth/email.ts` — `signInWithEmail`, `signUpWithEmail`, `signOut`, `resetPassword`. All thin wrappers over `supabase.auth.*`.

## Data Storage

### Local SQLite (primary source of truth)

- **SDK:** `expo-sqlite` ~55.0.13
- **DB name:** `tila.db`
- **Client:** `src/db/client.ts` — `getDatabase()` opens the DB, enables foreign keys, executes `CREATE_TABLES` and `SEED_DEFAULTS` from `src/db/schema.ts`, runs migrations 2→7, and stamps the schema version. `resetDatabase()` drops and recreates all tables.
- **Provider:** `src/db/provider.tsx` (`DatabaseProvider`, `useDatabase`) with a 15s init timeout and an `ErrorFallback` retry path. Mounted as the second-outermost provider in `app/_layout.tsx` so it gates the rest of the tree.
- **Tables:** `user_profile`, `lesson_attempts`, `question_attempts`, `mastery_entities`, `mastery_skills`, `mastery_confusions`, `habit`, `premium_lesson_grants`, `schema_version`. Single-user design — no `user_id` columns locally. The cloud copies in Supabase add a `user_id` partition column.

### Remote Postgres (Supabase)

- See "Supabase" above. Sync table mapping is in `src/sync/tables.ts`. Sync service: `src/sync/service.ts` (`syncAll`, `syncTable`). Sync provider: `src/sync/provider.tsx` (`SyncProvider`) — defers initial sync 2s after mount and re-fires on `AppState` `active`, skips entirely for anonymous users. Auth-to-cloud migration: `src/sync/migration.ts` (`migrateToAuthenticated`) stamps `sync_user_id` and pushes local data on first sign-in.

### Encrypted key/value (Supabase session)

- **SDKs:** `@react-native-async-storage/async-storage` 2.2.0, `expo-secure-store` ~55.0.11, `aes-js` ^3.1.2.
- **Where:** `src/auth/supabase.ts` (`LargeSecureStore`). Plain AsyncStorage is not used elsewhere as a primary store.

### File / asset storage

- **Local bundled assets only.** No remote object storage. Audio assets live in `assets/audio/names/`, `assets/audio/sounds/`, and `assets/audio/effects/` and are bundled at build time via `require()` in `src/audio/player.ts`.

### Caching

- No dedicated cache layer (no Redis, no MMKV, no react-query). SQLite reads + React state are the cache.

## Authentication & Identity

- **Provider:** Supabase Auth (handled by the `supabase` client). All four auth surfaces (Apple, Google, email sign-in, email sign-up) funnel through `supabase.auth.signInWithIdToken` / `signInWithPassword` / `signUp`.
- **Anonymous fallback:** `src/auth/provider.tsx` initializes with `isAnonymous: true`. The app is fully usable offline without an account; sync + social are gated on `!isAnonymous`.
- **Session refresh:** `autoRefreshToken: true` in the Supabase client; the auth provider listens for `SIGNED_IN`, `TOKEN_REFRESHED`, `INITIAL_SESSION`, and `SIGNED_OUT` events.

## Monetization (RevenueCat)

- **SDKs:** `react-native-purchases` ^9.15.0, `react-native-purchases-ui` ^9.15.0
- **Init wiring:** `src/monetization/revenuecat.ts` — `initRevenueCat()` selects the iOS or Android key by `Platform.OS`, calls `Purchases.setLogLevel(VERBOSE)` in `__DEV__`, then `Purchases.configure({ apiKey })`. Failures are reported via `Sentry.captureException`.
- **Provider:** `src/monetization/provider.tsx` — currently a **beta stub**. `SubscriptionProvider` returns a hard-coded `{ isPremiumActive: true, stage: "free", showPaywall: () => "not_presented" }` value and never calls `initRevenueCat()` or any `Purchases.*` API. The comment in the file notes "RevenueCat is disabled during beta testing. To re-enable: restore this file from git (pre-beta version)."
- **Paywall:** `src/monetization/paywall.ts` — `presentPaywall(trigger)` calls `RevenueCatUI.presentPaywall()` and inspects `PAYWALL_RESULT.{PURCHASED, RESTORED, CANCELLED, NOT_PRESENTED, ERROR}`. On purchase/restore it fetches `Purchases.getCustomerInfo()` to log the active `premium` entitlement to PostHog. Reachable code today, but no caller invokes it because the provider stub returns `not_presented` synchronously.
- **Hooks:** `src/monetization/hooks.ts` — `useSubscription()`, `useCanAccessLesson(_lessonId)` (always returns `true` post-reset), `usePremiumReviewRights(_grantedLessonIds)` (always returns `[]`), `FREE_LESSON_CUTOFF = Number.MAX_SAFE_INTEGER`. These are intentional stubs awaiting the new curriculum gating model.
- **Env vars:** `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` (both consumed only by `revenuecat.ts`).
- **Analytics:** Purchase / paywall events go through `src/monetization/analytics.ts` (typed wrappers around `track(...)`).

## Analytics & Observability

### PostHog (product analytics)

- **SDK:** `posthog-react-native` ^4.39.0
- **Init:** `src/analytics/posthog.ts` — `initPostHog()` constructs a `PostHog(apiKey, { host, captureAppLifecycleEvents: false, enableSessionReplay: false, preloadFeatureFlags: false, personProfiles: 'identified_only' })`. Held as a module-scoped singleton.
- **Public API:** `src/analytics/index.ts` — `initAnalytics(consent)`, `enablePostHog()`, `track<E>(event, props)`, `identify(userId)`, `flush()`. PostHog is only initialized when `analyticsConsent === true`; Sentry runs unconditionally.
- **Event map:** `src/analytics/events.ts` — strict TypeScript `EventMap` over events including `app_opened`, `onboarding_*`, `phase_completed`, `letter_audio_played`, `mastery_state_changed`, `paywall_*`, `purchase_*`, `restore_*`, `trial_expired`, `entitlement_changed`, `auth_*`, `sync_completed`, `sync_failed`. (Per `.planning/STATE.md`, lesson-specific events were removed during the curriculum reset.)
- **Consent gate:** `src/components/shared/AnalyticsGate.tsx` (and `AnalyticsConsentModal.tsx`) drive whether `initAnalytics(true)` ever fires.
- **Env vars:** `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST` (default `https://us.i.posthog.com`).

### Sentry (error tracking + tracing)

- **SDK:** `@sentry/react-native` ~7.11.0
- **Init:** `src/analytics/sentry.ts` — `initSentry()` calls `Sentry.init({ dsn, tracesSampleRate: 0, enabled: !__DEV__ })`. `setSentryUser(id)` is called from `initAnalytics` after PostHog returns an anonymous ID, and from `identify`.
- **Error boundary:** `Sentry.ErrorBoundary` wraps the entire tree in `app/_layout.tsx` with a custom `ErrorFallback`.
- **Manual capture:** `Sentry.captureException(e)` used in `src/monetization/revenuecat.ts` on init failure.
- **Metro plugin:** `metro.config.js` exports `getSentryExpoConfig(__dirname)` — wires source-map upload + symbolication.
- **Expo plugin:** `app.config.ts` includes `["@sentry/react-native/expo", { organization: "tila", project: "tila-mobile" }]`.
- **Env var:** `EXPO_PUBLIC_SENTRY_DSN` (Sentry init silently no-ops if unset).

## Audio (expo-audio)

- **SDK:** `expo-audio` ~55.0.11
- **Player module:** `src/audio/player.ts` — exposes `configureAudioSession()`, `playLetterName(id)`, `playLetterSound(id)`, `playLetterHarakatSound(id, harakat)`, `playByPath(logicalPath)`, plus SFX helpers (`playCorrect`, `playWrong`, `playLessonStart`, `playLessonComplete`, `playLessonCompletePerfect`, `playOnboardingComplete`, `playSacredMoment`) and `setMuted` / `isMuted`.
- **Architecture:** Two long-lived `AudioPlayer` singletons — one "voice" lane for letter pronunciations and one "SFX" lane with a priority/guard system (`critical` > `celebration` > `feedback`). Sources are swapped via `player.replace(source); player.play()` to avoid create/destroy churn.
- **Asset bundling:** 28 letter-name WAVs (`assets/audio/names/*.wav`) and 28 letter-sound WAVs (`assets/audio/sounds/*.wav`) are statically `require()`-d. Two filename overrides exist (`thaa→tha`, `laam→lam`). Harakat audio map currently only contains `2-fatha` (Ba); kasra/dhamma intentionally absent — UI must show a disabled HearButton when the path resolves to nothing rather than silently fall back.
- **Curriculum-path router:** `playByPath(path)` maps a small set of human-readable paths (e.g. `audio/letter/ba_fatha_sound.mp3`) to player calls. Unknown paths warn in `__DEV__` and no-op.
- **Plugin:** `expo-audio` is listed in `app.config.ts` plugins.
- **`src/audio/index.ts`:** placeholder barrel — does not re-export anything currently.

## Cryptography

- **SDK:** `expo-crypto` ~55.0.12, `aes-js` ^3.1.2
- **Uses:**
  - `Crypto.getRandomValues(new Uint8Array(32))` to mint the per-install AES-256 key in `src/auth/supabase.ts`.
  - `Crypto.randomUUID()` + `Crypto.digestStringAsync(SHA256, raw)` for Apple Sign-In nonce hashing in `src/auth/apple.ts`.
  - `aes-js` AES-256-CTR for the Supabase session ciphertext.

## CI/CD & Deployment

### Hosting

- **iOS:** App Store via EAS Submit (`eas.json` → `submit.production.ios.ascAppId = 6761349651`).
- **Android:** Google Play (Play Console-side, no `submit.production.android` block in `eas.json` yet).

### Build pipeline

- **EAS Build** (`eas.json`, CLI `>= 15.0.0`, `appVersionSource: "remote"`):
  - `development` — internal dev client.
  - `development:simulator` — internal dev client, iOS simulator.
  - `preview` — internal preview build.
  - `production` — `autoIncrement: true`.
- No GitHub Actions, no CircleCI, no Bitrise wiring detected in the repo.

### Source maps + crash symbolication

- Sentry is wired into both Metro (`metro.config.js`) and the Expo plugin chain (`app.config.ts`). Source maps upload happens automatically as part of EAS Build under that wrapper.

## Webhooks & Callbacks

- **Incoming HTTP webhooks:** None — the app has no server. RevenueCat / Supabase / PostHog / Sentry are consumed entirely via SDKs from the device.
- **Deep links:** Scheme `tila://` declared in `app.config.ts`. `src/social/invite.ts` produces `tila://invite/<code>` URLs and shares them via the native `Share` sheet.
- **OAuth callbacks:** Apple and Google use `signInWithIdToken` (no redirect URL needed). `expo-web-browser` is included as a plugin in case a redirect-style flow is needed.

## Environment Configuration

**Required env vars (build-time, must be `EXPO_PUBLIC_*` to be inlined):**

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_REVENUECAT_IOS_KEY` (currently unused at runtime due to beta provider stub)
- `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` (same)
- `EXPO_PUBLIC_POSTHOG_KEY`
- `EXPO_PUBLIC_POSTHOG_HOST` (defaults to `https://us.i.posthog.com` if absent)
- `EXPO_PUBLIC_SENTRY_DSN`

**Optional / dev:**

- `EXPO_PUBLIC_DEV_REFERENCE_LESSON` — gate for the dev-only `app/sandbox-lesson.tsx` reference lesson (per `src/curriculum/README.md`).
- `EAS_BUILD_PROFILE` — read in `app.config.ts` to flip Apple Sign-In gating.

**Secrets location:**

- `.env` and `.env.local` exist at the repo root (contents not inspected here). Production secrets live in the EAS dashboard for build-time injection.

## Provider Mount Order (entry point)

`app/_layout.tsx` mounts providers in this order, outermost first:

1. `Sentry.ErrorBoundary` (with `ErrorFallback`)
2. `DatabaseProvider` (gates the rest with `AppLoadingScreen` until SQLite is open)
3. `ThemeWrapper` → `ThemeContext` (reads `theme_mode` from `user_profile` via `useThemePreference`)
4. `AuthProvider`
5. `SyncProvider`
6. `SubscriptionProvider`
7. `AppStateProvider`
8. `SocialProvider`
9. `AnalyticsGate` (drives consent + analytics init)
10. `AppNavigator` (Expo Router `<Stack>`)

This is the canonical wiring map for any new integration that needs context from existing layers.

---

*Integration audit: 2026-04-27*
