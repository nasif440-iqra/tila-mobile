# External Integrations

**Analysis Date:** 2026-03-28

## APIs & External Services

**Analytics:**
- PostHog - Product analytics and event tracking
  - SDK: `posthog-react-native` ^4.39.0
  - Client init: `src/analytics/posthog.ts`
  - Host: `https://us.i.posthog.com`
  - Config: API key hardcoded in `src/analytics/posthog.ts`
  - Features: Event capture only. Session replay disabled, feature flags disabled, app lifecycle capture disabled, person profiles identified-only.

**Error Tracking:**
- Sentry - Crash reporting and error monitoring
  - SDK: `@sentry/react-native` ~7.11.0
  - Client init: `src/analytics/sentry.ts`
  - Sentry org: `tila`, project: `tila-mobile`
  - Config: DSN hardcoded in `src/analytics/sentry.ts`
  - Metro integration: `metro.config.js` uses `getSentryExpoConfig` for source maps
  - Expo plugin: `@sentry/react-native/expo` registered in `app.config.ts`
  - Features: Error reporting only. Tracing disabled (`tracesSampleRate: 0`). Disabled in dev mode (`enabled: !__DEV__`).

**Analytics Initialization:**
- Both services initialized together via `initAnalytics()` in `src/analytics/index.ts`
- Called once in `app/_layout.tsx` on mount
- PostHog anonymous ID is forwarded to Sentry for user correlation
- Typed event system via `src/analytics/events.ts` with strict `EventMap` type

## Data Storage

**Primary Database:**
- SQLite via `expo-sqlite` ~55.0.11
  - Database name: `tila.db`
  - Client: `src/db/client.ts` (singleton pattern)
  - Schema: `src/db/schema.ts` (version 2)
  - Provider: `src/db/provider.tsx` (React context)
  - Foreign keys enabled via PRAGMA
  - Single-user design (no user_id columns)

**Tables:**
- `user_profile` - Onboarding state, preferences
- `lesson_attempts` - Lesson completion records
- `question_attempts` - Individual question responses (FK to lesson_attempts)
- `mastery_entities` - Letter mastery with spaced repetition (interval_days, next_review)
- `mastery_skills` - Skill-level mastery tracking
- `mastery_confusions` - Confusion pair tracking
- `habit` - Daily practice streaks and wird tracking
- `schema_version` - Migration version tracking

**Migration approach:**
- Version-based migrations in `src/db/client.ts` `runMigrations()`
- Current schema version: 2
- Tables created with IF NOT EXISTS (idempotent)
- ALTER TABLE for additive changes with try/catch for existing columns

**Secure Storage:**
- `expo-secure-store` for sensitive key-value pairs
  - Used for: `tila_install_date` (install tracking in `app/_layout.tsx`)

**File Storage:**
- Local filesystem only (bundled assets)
- No cloud file storage

**Caching:**
- None (SQLite serves as the persistence layer)

## Authentication & Identity

**Auth Provider:**
- None - fully offline, single-user app
- Anonymous identity via PostHog anonymous ID
- No user accounts or login

## Monitoring & Observability

**Error Tracking:**
- Sentry (production only, see above)

**Analytics:**
- PostHog (see above)
- Typed events defined in `src/analytics/events.ts`
- `track()` function in `src/analytics/index.ts` enforces event type safety

**Logs:**
- `console.warn` for non-critical init failures
- No structured logging framework

## CI/CD & Deployment

**Build Platform:**
- EAS Build (Expo Application Services)
  - Config: `eas.json`
  - CLI requirement: >= 15.0.0
  - EAS project ID: `c0ef7427-a094-45c2-b7cd-bef77dae665b`

**Build Profiles:**
- `development` - Dev client, internal distribution
- `development:simulator` - iOS simulator dev build
- `preview` - Internal distribution (testing)
- `production` - Auto-increment version, production distribution

**Submission:**
- EAS Submit configured for production (`eas.json` submit section)
- iOS: Pending Apple Developer enrollment
- Android: First build shipped

**CI Pipeline:**
- No CI pipeline detected (no GitHub Actions, no `.github/workflows/`)

## Environment Configuration

**Required env vars:**
- None - no `.env` files present

**Hardcoded keys (in source):**
- PostHog API key in `src/analytics/posthog.ts`
- Sentry DSN in `src/analytics/sentry.ts`

**Secrets location:**
- Runtime secrets: `expo-secure-store` (on-device)
- Build secrets: EAS (managed remotely)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Audio Assets

**Bundled audio (not an external service, but a significant integration):**
- SFX effects: 19 bundled WAV/MP3 files in `assets/audio/effects/`
- Letter names: 28 WAV files in `assets/audio/names/` (all Arabic letters)
- Letter sounds: 28 WAV files in `assets/audio/sounds/`
- Managed via `src/audio/player.ts` with two-lane playback (voice + SFX)
- Uses `expo-audio` with `expo-haptics` for feedback

## Deep Linking

**URL Scheme:**
- `tila://` (configured in `app.config.ts` as `scheme: "tila"`)
- Handled by `expo-linking` and `expo-router`

---

*Integration audit: 2026-03-28*
