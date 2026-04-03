# External Integrations

**Analysis Date:** 2026-04-03

## APIs & External Services

**Supabase (Backend-as-a-Service):**
- **Purpose:** Cloud database (PostgreSQL), real-time subscriptions, authentication (email/OAuth), user data sync
- **Client:** `@supabase/supabase-js` v2.101.1 in `src/auth/supabase.ts`
- **Auth:** Public API key (`EXPO_PUBLIC_SUPABASE_ANON_KEY`) + URL (`EXPO_PUBLIC_SUPABASE_URL`)
- **Services Used:**
  - PostgreSQL database for user profiles, friendships, friend streaks, cloud sync
  - Supabase Auth for email, Google, and Apple OAuth
  - Real-time subscriptions (configured but usage not fully explored in sampled files)
  - RLS (Row-Level Security) policies for data isolation

**PostHog (Product Analytics):**
- **Purpose:** Event tracking, user behavior analytics, feature flag evaluation
- **Client:** `posthog-react-native` v4.39.0 in `src/analytics/posthog.ts`
- **Auth:** API key (`EXPO_PUBLIC_POSTHOG_KEY`)
- **Configuration:**
  - Host: `EXPO_PUBLIC_POSTHOG_HOST` (defaults to `https://us.i.posthog.com`)
  - Session replay: Disabled (`enableSessionReplay: false`)
  - Feature flags: Disabled (`preloadFeatureFlags: false`)
  - Personal profiles: `'identified_only'` (only when user identified)
- **Consent:** Only initialized if `user_profile.analytics_consent = true`
- **Events:** Defined in `src/analytics/events.ts` with full TypeScript typing

**Sentry (Error Tracking & Performance Monitoring):**
- **Purpose:** Crash reporting, error tracking, performance monitoring
- **Client:** `@sentry/react-native` v7.11.0 in `src/analytics/sentry.ts`
- **Auth:** DSN (`EXPO_PUBLIC_SENTRY_DSN`)
- **Configuration:**
  - Traces sampling: 0% (crash reporting only, no performance traces in production)
  - Enabled only in production (`enabled: !__DEV__`)
  - Crash breadcrumbs automatically captured by SDK
- **Integration:** Metro bundler wraps config with Sentry (in `metro.config.js`)
- **User identification:** Called via `identify()` with user UUID or PostHog anon ID

**RevenueCat (Subscription Management):**
- **Purpose:** In-app subscriptions, paywall, entitlements, billing
- **Client:** `react-native-purchases` v9.15.0 + UI component `react-native-purchases-ui` in `src/monetization/revenuecat.ts`
- **Auth:** Platform-specific API keys
  - iOS: `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
  - Android: `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`
- **Products:** 
  - $8.99/month subscription
  - $49.99/year subscription
  - 7-day free trial
  - 6 lessons free (non-subscription)
- **Implementation:** Lazy-initialized with fallback to free tier if API key missing or initialization fails

**Google Sign-In (OAuth Provider):**
- **Purpose:** Native Google authentication on Android + iOS
- **Client:** `@react-native-google-signin/google-signin` v16.1.2 in `src/auth/google.ts`
- **Auth:** Web OAuth client ID (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`)
  - Must be Web application OAuth client (not iOS/Android app-specific client)
  - Configured at module load via `GoogleSignin.configure()`
- **Flow:** Native credential prompt → `signIn()` → ID token → Supabase `signInWithIdToken()`
- **Error Handling:** Try/catch with detailed error return

**Apple Sign-In (OAuth Provider):**
- **Purpose:** Native Apple authentication on iOS/iPad
- **Client:** `expo-apple-authentication` v55.0.11 in `src/auth/apple.ts`
- **Auth:** No external API key (uses iOS app-level capability configured in `app.config.ts`)
- **Flow:** 
  1. Generate SHA-256 hashed nonce (via `expo-crypto`)
  2. Native credential prompt with FULL_NAME + EMAIL scopes
  3. Get identity token + nonce
  4. Supabase `signInWithIdToken()` with nonce
  5. Capture full name on first sign-in (Apple only sends once)
- **Availability:** Checked via `isAppleSignInAvailable()` (false on Android, older iOS)

## Data Storage

**Databases:**

**SQLite (Local):**
- **Type:** Embedded SQLite via `expo-sqlite` v55.0.13
- **Location:** `tila.db` (device storage, not synced)
- **Connection:** Async client in `src/db/client.ts` with `getDatabase()` singleton
- **Client:** Native `expo-sqlite` API (no ORM)
- **Tables (8):**
  - `user_profile` - User metadata, theme preference, onboarding flags, sync_user_id, name
  - `mastery_entities` - Letter mastery state machine (states: not_started → introduced → unstable → accurate → retained)
  - `mastery_skills` - Skill scores per letter
  - `mastery_confusions` - Commonly confused letter pairs
  - `habit` - Daily streak tracking
  - `lesson_attempts` - Per-lesson attempt history
  - `question_attempts` - Per-question attempt details
  - `premium_lesson_grants` - Lesson access grants (for paid/trial users)
  - `schema_version` - Migration tracking (current: v7)
- **Schema Migrations:** 7 migrations (v1→v7) with PRAGMA table_info checks for safe ALTER TABLE operations
- **Foreign Keys:** Enforced via `PRAGMA foreign_keys = ON`
- **Indexes:** Implicit via primary keys (not fully explored)

**PostgreSQL (Supabase Cloud):**
- **Purpose:** User profiles, cloud sync source-of-truth, friendships, social features
- **Tables:** Mirror of local SQLite tables + social tables (friendships, friend_streaks view)
- **RLS:** Row-Level Security enabled to prevent cross-user data leakage
- **Sync:** Via `src/sync/service.ts` using last-write-wins (LWW) conflict resolution

**File Storage:**
- **Audio Assets:** Bundled in app binary via Expo Asset system
  - Letter pronunciation files: 1 name + 1 sound per Arabic letter (28 letters)
  - SFX files: Question feedback sounds
- **No external file storage:** All assets are bundled (no cloud storage integration detected)

**Caching:**
- **Device:** Expo Secure Store (encrypted key storage), AsyncStorage (session data)
- **Supabase Session:** Encrypted and stored in AsyncStorage with key in SecureStore
- **PostHog:** Client-side event queue (flushed on demand)

## Authentication & Identity

**Auth Provider:**
- **Supabase Auth** - Multi-provider OAuth gateway

**Authentication Methods:**
1. **Email/Password** - Via Supabase Auth (custom implementation)
2. **Google Sign-In** - Native provider, ID token flow
3. **Apple Sign-In** - Native provider (iOS only), ID token + nonce flow
4. **Anonymous** - Implicit (unauthenticated users can access first 6 lessons)

**Session Management:**
- **Storage:** AES-256 encrypted in AsyncStorage (encryption key in SecureStore)
- **Auto-refresh:** Enabled (`autoRefreshToken: true`)
- **Persistence:** Session persisted across app restarts (`persistSession: true`)
- **Isolation:** User data isolated via Supabase RLS policies and `sync_user_id` in `user_profile`

**User Identification:**
- **Analytics:** PostHog `identify(userId)` called after auth
- **Error Tracking:** Sentry `setSentryUser(id)` called with user UUID or anon ID
- **Database:** Local user_profile linked to Supabase auth via `user_id`

## Monitoring & Observability

**Error Tracking:**
- **Sentry** - Production crash reporting (DSN: `EXPO_PUBLIC_SENTRY_DSN`)
  - Initialization: `src/analytics/sentry.ts`
  - User tagging: `setSentryUser(id)`
  - Crash breadcrumbs: Auto-captured
  - Traces: Disabled (0% sample rate)

**Logs:**
- **Console logs:** Development only (via `console.log`, `console.warn`)
- **PostHog events:** Structured event tracking (crash-safe, survives app restart via queue)
- **No centralized log aggregation:** Logs are local to app or in Sentry

**Session Replay:**
- **PostHog:** Disabled (`enableSessionReplay: false`)

## CI/CD & Deployment

**Hosting:**
- **iOS:** App Store (via EAS Submit)
- **Android:** Google Play Store (via EAS Submit)

**CI Pipeline:**
- **EAS Build:** Cloud-hosted native builds (managed by Expo)
  - Profiles: development, development:simulator, preview, production
  - Auto-increment: Enabled for production
  - Version management: Remote via EAS dashboard (`appVersionSource: "remote"`)

**Local Testing:**
- No GitHub Actions or CI/CD pipeline detected
- Manual validation via `npm run validate` (lint + typecheck) and `npm test`

## Environment Configuration

**Required Environment Variables:**

| Variable | Purpose | Secret? | Default |
|----------|---------|---------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | No | Required |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase public API key | No | Required |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google OAuth Web client ID | No | Required |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | RevenueCat iOS SDK key | Yes | Optional (free tier fallback) |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | RevenueCat Android SDK key | Yes | Optional (free tier fallback) |
| `EXPO_PUBLIC_POSTHOG_KEY` | PostHog API key | Yes | Optional (consent-gated) |
| `EXPO_PUBLIC_POSTHOG_HOST` | PostHog server URL | No | `https://us.i.posthog.com` |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry project DSN | No | Optional (crash reporting disabled if missing) |

**Secrets Storage:**
- **Local Development:** `.env` and `.env.local` (in .gitignore)
- **EAS Build:** Via EAS secrets management (set in EAS dashboard or `eas secret`)
- **iOS Build:** Xcode-managed credentials (Apple Developer certificate, provisioning profile)
- **Android Build:** Play Store signing key (managed by Google Play or uploaded to EAS)

**Fallback Behavior (Graceful Degradation):**
- **Supabase:** Required for sync, auth, social features. App fails if URL/key missing.
- **RevenueCat:** If API key missing or init fails, app defaults to free tier (no crash).
- **PostHog:** If key missing, analytics disabled but app continues (no crash).
- **Sentry:** If DSN missing, crash reporting disabled but app continues (no crash).
- **Google Sign-In:** If Web Client ID missing, Google auth unavailable but Apple/email auth works.

## Webhooks & Callbacks

**Incoming Webhooks:**
- None detected. App is client-only (no webhook endpoints).

**Outgoing Webhooks:**
- **Supabase:** Real-time subscription callbacks (exact tables not fully explored)
  - Callback handlers in `src/sync/` and `src/social/` (for sync and friend streaks)
- **PostHog:** Event flush callbacks (on-demand via `flush()`)
- **RevenueCat:** Customer info updated callback (subscription status changes trigger re-fetch)

**Callbacks Not Fully Integrated:**
- Push notifications: Infrastructure not yet implemented (future milestone per CLAUDE.md)
- Email notifications: Supabase could send transactional emails but not observed in sampled code

## Integration Failure Modes & Mitigations

| Integration | Failure Mode | Mitigation | User Impact |
|-------------|--------------|-----------|-------------|
| Supabase Auth | Network down | App continues in offline mode; auth tokens cached | Limited to 6 free lessons until network restored |
| Supabase Sync | Network down | Queued locally; synced when network returns | Data stays local until sync completes |
| RevenueCat | Init fails | Defaults to free tier; user can manually retry | No paid content visible; no crash |
| PostHog | Init fails | Graceful skip; user untracked but app works | User experience unaffected |
| Sentry | Init fails | Graceful skip; crashes not reported but don't hang app | Crashes go unreported; no app hang |
| Google Sign-In | Missing Web Client ID | Google auth unavailable; Apple/email auth still works | User can sign in via Apple/email |
| Apple Sign-In | Device not capable | `isAppleSignInAvailable()` returns false; hidden from UI | Android users see Google/email only |
| Audio Playback | Asset missing | try/catch wraps all `player.play()` calls | Lesson continues without sound feedback |

---

*Integration audit: 2026-04-03*
