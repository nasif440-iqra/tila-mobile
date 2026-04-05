# Phase 8: Cloud Sync & Social - Research

**Researched:** 2026-04-02
**Domain:** Cloud sync, authentication, social features, dark mode, integration tests
**Confidence:** HIGH

## Summary

Phase 8 adds user accounts (Supabase Auth), cloud sync (SQLite-to-Postgres), minimal social features (friend streaks), dark mode, and integration tests to an offline-first Expo app. The existing codebase is well-structured for this: SQLite tables have `updated_at` timestamps, dark mode tokens already exist (just forced to light), the theme system supports system preference detection, and the provider-wrapping pattern in `_layout.tsx` is extensible.

The core architectural challenge is the sync layer: keeping SQLite as the source of truth while pushing/pulling data to Supabase Postgres. Since this is a single-user learning app with last-write-wins conflict resolution, no heavy sync framework (PowerSync, WatermelonDB) is needed. A lightweight custom sync service using Supabase's REST API with `updated_at` timestamp comparison is sufficient and avoids introducing a complex dependency for what is fundamentally "upload my tables, download my tables."

**Primary recommendation:** Build a thin sync service (`src/sync/`) that upserts local SQLite rows to Supabase Postgres and vice versa, keyed on `updated_at` timestamps. Use Supabase Auth with native Apple/Google sign-in + email. Wrap auth + sync in React Context providers following the existing DatabaseProvider/SubscriptionProvider pattern.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Backend service is **Supabase** (Postgres + Auth + Row Level Security)
- **D-02:** Auth methods: **Email + password, Google Sign-In, Apple Sign-In** (all three required)
- **D-03:** Account prompt appears **after lesson 3** with "Save your progress" framing
- **D-04:** Account prompt is **soft/dismissable** -- re-appears after lesson 5 and lesson 7 if still anonymous
- **D-05:** Anonymous-to-authenticated upgrade must preserve all local progress (RET-03 requirement)
- **D-06:** Conflict resolution: **last-write-wins** (timestamp-based). Single-user learning app -- conflicts are rare.
- **D-07:** Sync triggers: **after each lesson completion + on app foreground**. Batched, not real-time.
- **D-08:** Offline-first guarantee: local SQLite stays source of truth. Cloud is a backup/sync target, never the primary read source.
- **D-09:** Friend discovery via **share link/invite code** -- no phone contact access, no username search
- **D-10:** Friend visibility: **minimal -- streak count only**. No lesson progress, no accuracy, no last-active.
- **D-11:** Interaction model: **view-only**. No messaging, no nudges, no reactions.
- **D-12:** Phase 8 executes in **two waves**: Wave A (infra+auth+sync), Wave B (social+polish)

### Claude's Discretion
- **Sync scope:** Sync all user-facing tables (mastery_entities, lesson_completions, habit tracking, user_profile). Subscription state stays with RevenueCat SDK (already cloud-synced).

### Deferred Ideas (OUT OF SCOPE)
- Nudge/encourage system between friends
- Dua request feature
- Rich friend profiles (letters mastered, last active, lesson reached)
- QR code friend adding
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RET-02 | Shared state layer for progress, habit, and subscription | AppStateProvider wrapping existing hooks; single source of canonical state via React Context |
| RET-03 | Cloud sync with user accounts, anonymous-to-authenticated upgrade | Supabase Auth + signInWithIdToken for native social auth + local progress preservation on account link |
| RET-04 | Learning history synced to cloud | Sync service pushes lesson_attempts, mastery_entities, mastery_skills, mastery_confusions, habit tables |
| RET-05 | Social features -- friend connections, streaks | Supabase friendships table + RLS policies; friends see streak count only via Supabase RPC/view |
| RET-06 | Offline-first guarantee maintained | SQLite remains read source; sync is fire-and-forget with retry on failure; no UI blocks on network |
| RET-07 | Privacy manifest updated for auth + cloud sync | Add NSPrivacyCollectedDataTypes for email, user ID, usage data (Supabase auth + sync) |
| RET-08 | Adaptive return welcome screen | Extend existing return-welcome.tsx with tiered messaging based on getDayDifference |
| RET-09 | Integration tests for critical flows | Vitest integration tests mocking DB + Supabase client for onboarding, lesson completion, premium locking, restore purchases |
| RET-10 | Dark mode activated using existing tokens | Remove forced light mode in _layout.tsx; persist user preference in user_profile; respect system scheme |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.101.1 | Supabase client (auth, database, RLS) | Official Supabase JS client. Isomorphic, works in React Native. Typed API. |
| `expo-apple-authentication` | ~55.0.9 | Native Apple Sign-In | Expo SDK 55 compatible. Native Sign in with Apple modal (no OAuth redirect). Required for App Store. |
| `@react-native-google-signin/google-signin` | ^16.1.2 | Native Google Sign-In | De-facto standard for native Google auth on RN. Returns idToken for Supabase signInWithIdToken. |
| `expo-secure-store` | ~55.0.9 | Secure token storage | Already installed. Stores encryption key for session data. iOS Keychain / Android Keystore backed. |
| `expo-crypto` | ~55.0.9 | Nonce generation for auth | Crypto-safe random values for Apple/Google auth nonces. Expo SDK 55 compatible. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@react-native-async-storage/async-storage` | ^2.1.2 | Supabase session persistence | Required by supabase-js for session storage in React Native. Supabase Auth stores refresh tokens here. |
| `react-native-url-polyfill` | ^2.0.0 | URL API polyfill | Required by supabase-js in React Native. Provides URL/URLSearchParams. |
| `aes-js` | ^3.1.2 | Session encryption | Encrypt Supabase session data stored in AsyncStorage. Key stored in SecureStore. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom sync service | PowerSync | PowerSync adds real-time bidirectional sync, but is overkill for single-user LWW. Adds SDK dependency + PowerSync cloud account. |
| Custom sync service | Supastash | Community library, newer, less mature. Custom sync is ~200 lines and fully understood. |
| Custom sync service | WatermelonDB | Requires replacing expo-sqlite entirely. Massive migration for a problem that doesn't need it. |
| @react-native-google-signin | expo-auth-session | expo-auth-session uses OAuth redirect (browser popup). Native is better UX and avoids deep linking complexity for Google. |

**Installation:**
```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill aes-js expo-apple-authentication expo-crypto @react-native-google-signin/google-signin
```

**Version verification:** All versions checked against npm registry on 2026-04-02.

## Architecture Patterns

### Recommended Project Structure
```
src/
  auth/
    supabase.ts           # Supabase client initialization
    provider.tsx          # AuthProvider context (session, user, sign-in/out)
    hooks.ts              # useAuth() hook
    apple.ts              # Apple Sign-In helper
    google.ts             # Google Sign-In helper
    types.ts              # Auth types
  sync/
    service.ts            # Core sync logic (push/pull per table)
    provider.tsx          # SyncProvider context (sync status, trigger)
    hooks.ts              # useSync() hook
    tables.ts             # Table sync configs (column mappings, merge logic)
    types.ts              # Sync types
  social/
    friends.ts            # Friend management (add, remove, list)
    provider.tsx          # SocialProvider (friends list, streaks)
    hooks.ts              # useFriends() hook
    invite.ts             # Invite link/code generation and resolution
    types.ts              # Social types
  state/
    provider.tsx          # AppStateProvider wrapping progress+habit+subscription
    hooks.ts              # useAppState() hook — unified access
    types.ts              # Shared state types
  db/
    schema.ts             # Add user_id, cloud sync metadata columns
    migrations.ts         # Extract migrations from client.ts (new pattern)
    client.ts             # Existing, add sync-related queries
    provider.tsx          # Existing, unchanged
```

### Pattern 1: Auth Provider with Anonymous Support
**What:** Auth provider that supports both anonymous and authenticated users. Anonymous users get a local-only UUID. On sign-in, local data is associated with the Supabase user ID.
**When to use:** Root layout provider wrapping, immediately inside DatabaseProvider.
**Example:**
```typescript
// src/auth/provider.tsx
interface AuthState {
  user: User | null;        // Supabase user (null = anonymous)
  session: Session | null;  // Supabase session
  isAnonymous: boolean;
  loading: boolean;
}

// In _layout.tsx provider hierarchy:
// ThemeContext > Sentry.ErrorBoundary > DatabaseProvider > AuthProvider > SyncProvider > SubscriptionProvider > ...
```

### Pattern 2: Lightweight Last-Write-Wins Sync
**What:** For each syncable table, compare local `updated_at` with remote `updated_at`. Push newer local rows, pull newer remote rows. Sync runs as a single batch operation.
**When to use:** After lesson completion, on app foreground (AppState 'active' event).
**Example:**
```typescript
// src/sync/service.ts
async function syncTable(
  db: SQLiteDatabase,
  supabase: SupabaseClient,
  config: TableSyncConfig
): Promise<SyncResult> {
  // 1. Read all local rows with their updated_at
  // 2. Fetch remote rows for this user_id
  // 3. For each row: compare updated_at
  //    - Local newer → upsert to Supabase
  //    - Remote newer → upsert to local SQLite
  //    - Equal → skip
  // 4. New local rows (no remote match) → insert to Supabase
  // 5. New remote rows (no local match) → insert to SQLite
}
```

### Pattern 3: Account Prompt via Lesson Completion Counter
**What:** After lesson 3 completion, check if user is anonymous. If so, show "Save your progress" prompt. Dismissable. Re-prompt at lessons 5 and 7.
**When to use:** In the lesson completion flow, after results screen.
**Example:**
```typescript
// Check in post-lesson flow:
const shouldPromptAccount = 
  isAnonymous && 
  !hasDeclinedRecently &&
  [3, 5, 7].includes(completedLessonId);
```

### Pattern 4: Dark Mode Toggle (Minimal Change)
**What:** The theme system already supports dark mode. Remove the forced `"light"` in `_layout.tsx`, add a user preference stored in `user_profile`, and use system scheme as default.
**When to use:** Phase 8 Wave B.
**Example:**
```typescript
// In _layout.tsx, change from:
const [themeMode] = useState<ThemeMode>("light");
// To:
const [themeMode, setThemeMode] = useState<ThemeMode>("system");
// Load preference from user_profile on mount
// Persist preference changes to user_profile
```

### Anti-Patterns to Avoid
- **Reading from Supabase as primary source:** The app must read from SQLite always. Supabase is a sync target, never the read source for learning state.
- **Blocking UI on sync:** Sync failures should be silent. Show a subtle status indicator, never block user interaction.
- **Syncing subscription state via Supabase:** RevenueCat already handles cross-device subscription sync. Do not duplicate this.
- **Complex CRDT/vector clock sync:** Last-write-wins is explicitly decided. Do not build conflict resolution beyond timestamp comparison.
- **OAuth redirect for native auth:** Use native `signInWithIdToken` for Apple and Google. OAuth redirect (browser popup) is worse UX on mobile.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session token storage | Custom encrypted storage | Supabase Auth + AsyncStorage + aes-js encryption with SecureStore key | Supabase handles token refresh, session persistence, and expiry. |
| Apple Sign-In flow | Custom ASAuthorizationController bindings | expo-apple-authentication + Supabase signInWithIdToken | Apple auth has strict nonce/credential handling; the Expo module handles it. |
| Google Sign-In flow | Custom OAuth redirect | @react-native-google-signin + Supabase signInWithIdToken | Native Google credential prompt is superior UX and avoids deep link config. |
| Row-level security | Custom middleware/auth checks | Supabase RLS policies | Database-level security that works regardless of client. Cannot be bypassed. |
| Friend invite deep links | Custom URL parsing | Expo Router deep linking + Expo Linking | Already configured (`scheme: "tila"` in app.config.ts). |
| Subscription state sync | Custom Supabase sync for subscriptions | RevenueCat SDK (already in place) | RevenueCat caches CustomerInfo on-device and syncs to their cloud. |

**Key insight:** Supabase provides auth, database, and security as a unified platform. The only custom code needed is the sync adapter between local SQLite and remote Postgres.

## Common Pitfalls

### Pitfall 1: Supabase Session Size Exceeds SecureStore Limit
**What goes wrong:** Supabase sessions are larger than 2048 bytes (SecureStore's per-item limit). Storing session directly in SecureStore fails silently.
**Why it happens:** JWT tokens + user metadata exceed the 2KB limit.
**How to avoid:** Use AsyncStorage for session data, encrypted with AES-256. Store the AES key (32 bytes) in SecureStore. This is the pattern recommended by Expo + Supabase official docs.
**Warning signs:** Auth works in development but sessions don't persist after app restart.

### Pitfall 2: Anonymous-to-Authenticated Data Loss
**What goes wrong:** When a user creates an account, their local SQLite data has no `user_id`. The sync service pushes empty data or creates duplicate records.
**Why it happens:** Local tables are single-user (no `user_id` column per CONTEXT.md schema). On first auth, there's no user_id to match.
**How to avoid:** On first sign-in: (1) add the Supabase user UUID to user_profile, (2) tag all existing rows with the user_id, (3) push all local data to Supabase as the initial sync. The migration from single-user to user-id-tagged is a one-time operation.
**Warning signs:** User signs in and sees empty progress. Or: user signs in on second device and doesn't see data from first device.

### Pitfall 3: Google Sign-In Web Client ID Confusion
**What goes wrong:** Google Sign-In fails with cryptic error. Token validation on Supabase side rejects the ID token.
**Why it happens:** You must use the **Web application** OAuth client ID (not iOS or Android) in both `GoogleSignin.configure({ webClientId })` and Supabase Auth provider settings. This is counter-intuitive but required.
**How to avoid:** Create a Web application OAuth client in Google Cloud Console. Use that client ID everywhere.
**Warning signs:** "Invalid token" errors from Supabase, or "DEVELOPER_ERROR" from Google Sign-In SDK.

### Pitfall 4: Apple Sign-In Full Name Only on First Auth
**What goes wrong:** User signs in with Apple, app doesn't capture their name. On subsequent sign-ins, Apple no longer sends the name.
**Why it happens:** Apple's privacy design sends `fullName` only on the very first authorization. It's null on all subsequent calls.
**How to avoid:** Capture `credential.fullName` on first sign-in and immediately persist it via `supabase.auth.updateUser({ data: { full_name: ... } })`.
**Warning signs:** User's display name is null/empty despite using Apple Sign-In.

### Pitfall 5: Sync Race Condition on App Foreground
**What goes wrong:** Multiple sync operations fire simultaneously (foreground + completion + manual trigger), causing duplicate writes or DB locks.
**Why it happens:** AppState 'active' event fires while a lesson-completion sync is in progress.
**How to avoid:** Use a sync lock (simple boolean flag). If sync is in progress, queue the request. Process queue when current sync completes.
**Warning signs:** Duplicate rows in Supabase, or expo-sqlite "database is locked" errors.

### Pitfall 6: Dark Mode Shadow Colors
**What goes wrong:** Card shadows that look good on light backgrounds are invisible or create strange halos on dark backgrounds.
**Why it happens:** `shadows` in tokens.ts use `#163323` (dark green) as shadowColor, which works on cream but not on dark backgrounds.
**How to avoid:** Add dark-mode shadow variants or make shadow colors dynamic based on theme. Or use elevation-only on Android (already works).
**Warning signs:** Cards look flat/unstyled in dark mode despite having shadow styles.

### Pitfall 7: Privacy Manifest Rejection
**What goes wrong:** App Store review rejects the update because the privacy manifest doesn't declare cloud data collection.
**Why it happens:** Adding Supabase auth + sync means the app now collects email addresses, user identifiers, and usage data.
**How to avoid:** Update `NSPrivacyCollectedDataTypes` in app.config.ts before submitting. Declare: email address (for auth), user ID (for sync), usage data (for learning progress sync).
**Warning signs:** App Store rejection email citing missing privacy declarations.

## Code Examples

### Supabase Client Initialization
```typescript
// src/auth/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as aesjs from 'aes-js';

// LargeSecureStore: encrypts data for AsyncStorage, key in SecureStore
class LargeSecureStore {
  private async _getEncryptionKey(): Promise<Uint8Array> {
    const existing = await SecureStore.getItemAsync('supabase-encryption-key');
    if (existing) return aesjs.utils.hex.toBytes(existing);
    const key = crypto.getRandomValues(new Uint8Array(32));
    await SecureStore.setItemAsync(
      'supabase-encryption-key',
      aesjs.utils.hex.fromBytes(key)
    );
    return key;
  }

  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;
    const encKey = await this._getEncryptionKey();
    const bytes = aesjs.utils.hex.toBytes(encrypted);
    const aesCtr = new aesjs.ModeOfOperation.ctr(encKey);
    const decrypted = aesCtr.decrypt(bytes);
    return aesjs.utils.utf8.fromBytes(decrypted);
  }

  async setItem(key: string, value: string): Promise<void> {
    const encKey = await this._getEncryptionKey();
    const bytes = aesjs.utils.utf8.toBytes(value);
    const aesCtr = new aesjs.ModeOfOperation.ctr(encKey);
    const encrypted = aesCtr.encrypt(bytes);
    await AsyncStorage.setItem(key, aesjs.utils.hex.fromBytes(encrypted));
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new LargeSecureStore(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```
Source: [Expo + Supabase Guide](https://docs.expo.dev/guides/using-supabase/), [Supabase RN Auth Quickstart](https://supabase.com/docs/guides/auth/quickstarts/react-native)

### Native Apple Sign-In
```typescript
// src/auth/apple.ts
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';

export async function signInWithApple() {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken!,
    nonce: rawNonce,
  });

  // Capture full name on first sign-in (Apple only sends it once)
  if (credential.fullName?.givenName) {
    await supabase.auth.updateUser({
      data: {
        full_name: `${credential.fullName.givenName} ${credential.fullName.familyName ?? ''}`.trim(),
      },
    });
  }

  return { data, error };
}
```
Source: [Supabase Apple Login Docs](https://supabase.com/docs/guides/auth/social-login/auth-apple)

### Native Google Sign-In
```typescript
// src/auth/google.ts
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
});

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();

  if (!response.data?.idToken) {
    throw new Error('No idToken returned from Google Sign-In');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: response.data.idToken,
  });

  return { data, error };
}
```
Source: [Supabase Google Login Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)

### Supabase Schema (Remote Postgres)
```sql
-- Tables mirror local SQLite but add user_id and use Supabase-managed timestamps
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarded BOOLEAN DEFAULT FALSE,
  starting_point TEXT,
  motivation TEXT,
  name TEXT,
  daily_goal INT,
  theme_mode TEXT DEFAULT 'system',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE mastery_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_key TEXT NOT NULL,
  correct INT DEFAULT 0,
  attempts INT DEFAULT 0,
  last_seen TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  interval_days INT DEFAULT 1,
  session_streak INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entity_key)
);

-- RLS: users can only access their own data
ALTER TABLE mastery_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their mastery data"
  ON mastery_entities FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Similar for: mastery_skills, mastery_confusions, lesson_attempts,
--              question_attempts, habit, premium_lesson_grants

-- Social: friendships table
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  friend_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see their own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Friend streaks view (streak-only visibility)
CREATE VIEW friend_streaks AS
  SELECT f.user_id AS viewer_id,
         f.friend_id,
         up.name AS friend_name,
         h.current_wird AS streak_count
  FROM friendships f
  JOIN user_profiles up ON up.user_id = f.friend_id
  JOIN habit h ON h.user_id = f.friend_id
  WHERE f.status = 'accepted';

-- Invite codes
CREATE TABLE invite_codes (
  code TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);
```

### Sync Service Core Logic
```typescript
// src/sync/service.ts
interface TableSyncConfig {
  localTable: string;
  remoteTable: string;
  primaryKey: string;       // e.g., 'entity_key' for mastery_entities
  columns: string[];
  timestampColumn: string;  // 'updated_at'
}

async function syncTable(
  db: SQLiteDatabase,
  supabase: SupabaseClient,
  userId: string,
  config: TableSyncConfig
): Promise<void> {
  // 1. Get all local rows
  const localRows = await db.getAllAsync(
    `SELECT * FROM ${config.localTable}`
  );

  // 2. Get all remote rows for this user
  const { data: remoteRows } = await supabase
    .from(config.remoteTable)
    .select('*')
    .eq('user_id', userId);

  // 3. Build lookup maps
  const remoteMap = new Map(
    (remoteRows ?? []).map(r => [r[config.primaryKey], r])
  );

  // 4. Push local-newer rows to remote
  const toUpsert = localRows.filter(local => {
    const remote = remoteMap.get(local[config.primaryKey]);
    return !remote || new Date(local.updated_at) > new Date(remote.updated_at);
  }).map(local => ({
    user_id: userId,
    ...local,
  }));

  if (toUpsert.length > 0) {
    await supabase.from(config.remoteTable).upsert(toUpsert, {
      onConflict: `user_id,${config.primaryKey}`,
    });
  }

  // 5. Pull remote-newer rows to local
  for (const [key, remote] of remoteMap) {
    const local = localRows.find(l => l[config.primaryKey] === key);
    if (!local || new Date(remote.updated_at) > new Date(local.updated_at)) {
      // Upsert into local SQLite
      await upsertLocalRow(db, config, remote);
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AsyncStorage for Supabase sessions | Encrypted AsyncStorage (AES + SecureStore key) | 2024 | Prevents token theft from unencrypted device storage |
| OAuth redirect for Google/Apple | Native signInWithIdToken | 2023-2024 | Better UX, no browser popup, faster auth flow |
| supabase-js v1 | supabase-js v2.x (current: 2.101.1) | 2023 | Breaking API changes; all docs/examples use v2 |
| Expo AuthSession for Google | @react-native-google-signin native | 2024-2025 | Native credential prompt instead of web redirect |
| PowerSync/WatermelonDB for sync | Custom LWW for simple single-user apps | Ongoing | Heavy sync frameworks unnecessary for simple use cases |

**Deprecated/outdated:**
- `react-native-url-polyfill/auto` import may not be needed in React Native 0.83+ (URL API partially available), but include it for safety.
- `expo-auth-session` for Google auth: works but gives inferior UX vs native. Use only as fallback on platforms where native isn't available.

## Open Questions

1. **Supabase Project Setup**
   - What we know: Need a Supabase project with Auth, Database, and RLS enabled
   - What's unclear: Whether the founder has created the Supabase project yet, and what the URL/anon key are
   - Recommendation: Phase plan Wave 0 should include "Create Supabase project and configure env vars" as a prerequisite task

2. **Google Cloud Console OAuth Setup**
   - What we know: Need a Web application OAuth client ID and SHA-1 fingerprint for Android
   - What's unclear: Whether Google Cloud project exists, whether OAuth consent screen is configured
   - Recommendation: Include Google Cloud OAuth setup as a prerequisite task

3. **Apple Sign-In Entitlement**
   - What we know: Need "Sign in with Apple" capability enabled in Apple Developer portal for bundle ID com.tilaapp.tila
   - What's unclear: Whether this is already configured
   - Recommendation: Verify in Apple Developer portal; requires a dev build (not Expo Go) to test

4. **Schema Migration for user_id**
   - What we know: Current SQLite schema is single-user (no user_id columns). Need to add user_id for sync association.
   - What's unclear: Whether to add user_id columns to local SQLite or just use it as a sync metadata field
   - Recommendation: Add a `sync_user_id` column to `user_profile` only. Other tables don't need user_id locally since they're already single-user. The sync service maps local rows to the authenticated user_id when pushing to Supabase.

5. **Invite Link Deep Linking**
   - What we know: `scheme: "tila"` already configured in app.config.ts. Expo Router supports deep linking.
   - What's unclear: Whether a universal link / app link domain is needed for invite codes, or if custom scheme (tila://invite/CODE) is sufficient
   - Recommendation: Start with custom scheme `tila://invite/{code}`. Universal links require a web domain and AASA file hosting, which can be added later.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| expo-secure-store | Auth token encryption | Yes | ~55.0.9 (installed) | -- |
| expo-crypto | Nonce generation | Not installed | ~55.0.9 (SDK 55) | Install via `npx expo install` |
| expo-apple-authentication | Apple Sign-In | Not installed | ~55.0.9 (SDK 55) | Install via `npx expo install` |
| Supabase project | All cloud features | Unknown | -- | Must be created before development |
| Google Cloud OAuth | Google Sign-In | Unknown | -- | Must be configured before development |
| Apple Developer "Sign in with Apple" | Apple Sign-In | Unknown | -- | Must be enabled in portal |
| Node.js | Dev tooling | Yes | Via Expo CLI | -- |

**Missing dependencies with no fallback:**
- Supabase project (URL + anon key) -- blocks all cloud work
- Google Cloud OAuth client ID -- blocks Google Sign-In
- Apple "Sign in with Apple" entitlement -- blocks Apple Sign-In

**Missing dependencies with fallback:**
- expo-crypto, expo-apple-authentication, @react-native-google-signin/google-signin -- standard npm install

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | vitest.config.ts |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RET-02 | AppStateProvider provides canonical state | unit | `npx vitest run src/__tests__/app-state-provider.test.ts -x` | Wave 0 |
| RET-03 | Sign-in creates session, anonymous upgrade preserves data | integration | `npx vitest run src/__tests__/auth-flow.test.ts -x` | Wave 0 |
| RET-04 | Sync pushes local data to Supabase, pulls remote data | unit | `npx vitest run src/__tests__/sync-service.test.ts -x` | Wave 0 |
| RET-05 | Friend add/remove/list, streak visibility | unit | `npx vitest run src/__tests__/social-friends.test.ts -x` | Wave 0 |
| RET-06 | Sync fails gracefully offline, local reads unaffected | unit | `npx vitest run src/__tests__/sync-offline.test.ts -x` | Wave 0 |
| RET-07 | Privacy manifest includes auth+sync declarations | manual-only | Visual inspection of app.config.ts | -- |
| RET-08 | Return welcome adapts to absence length | unit | `npx vitest run src/__tests__/return-welcome-adaptive.test.ts -x` | Wave 0 |
| RET-09 | Integration tests: onboarding, lesson, premium, restore | integration | `npx vitest run src/__tests__/integration-*.test.ts -x` | Wave 0 |
| RET-10 | Dark mode uses correct tokens, respects system pref | unit | `npx vitest run src/__tests__/dark-mode.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm run validate && npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/app-state-provider.test.ts` -- covers RET-02
- [ ] `src/__tests__/auth-flow.test.ts` -- covers RET-03 (mock Supabase client)
- [ ] `src/__tests__/sync-service.test.ts` -- covers RET-04, RET-06
- [ ] `src/__tests__/social-friends.test.ts` -- covers RET-05
- [ ] `src/__tests__/return-welcome-adaptive.test.ts` -- covers RET-08
- [ ] `src/__tests__/dark-mode.test.ts` -- covers RET-10
- [ ] `src/__tests__/integration-onboarding.test.ts` -- covers RET-09
- [ ] `src/__tests__/integration-lesson-completion.test.ts` -- covers RET-09
- [ ] `src/__tests__/integration-premium-locking.test.ts` -- covers RET-09
- [ ] `src/__tests__/integration-restore-purchases.test.ts` -- covers RET-09

## Project Constraints (from CLAUDE.md)

- **Stack locked:** Expo SDK 55, React Native 0.83, React 19, TypeScript 5.9 -- no framework changes
- **No business logic changes:** Engine algorithms stay the same
- **Offline-first:** All features must work without network connectivity
- **Performance:** No regressions on mid-range Android (60fps)
- **Backwards compatible:** Existing user SQLite data must not be corrupted
- **Test framework:** Vitest (not Jest). Tests in `src/__tests__/**/*.test.{js,ts}`
- **Import alias:** `@/*` maps to project root
- **Validation:** `npm run validate` (lint + typecheck) must pass with zero errors
- **Design system:** Amiri (Arabic), Inter (body), Lora (headings). Primary #163323, Accent #C4A464, Background #F8F6F0
- **No Redux/Zustand:** State via SQLite + hooks + React Context only
- **GSD workflow:** Use GSD commands for file changes

## Sources

### Primary (HIGH confidence)
- [Expo + Supabase Guide](https://docs.expo.dev/guides/using-supabase/) -- official Expo docs on Supabase integration
- [Supabase RN Auth Quickstart](https://supabase.com/docs/guides/auth/quickstarts/react-native) -- official auth setup
- [Supabase Apple Login](https://supabase.com/docs/guides/auth/social-login/auth-apple) -- native Apple sign-in with signInWithIdToken
- [Supabase Google Login](https://supabase.com/docs/guides/auth/social-login/auth-google) -- native Google sign-in with signInWithIdToken
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) -- row-level security patterns
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) -- v2.101.1, verified 2026-04-02
- [expo-apple-authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/) -- Expo SDK 55 compatible

### Secondary (MEDIUM confidence)
- [Supabase offline discussion](https://github.com/orgs/supabase/discussions/357) -- community patterns for offline-first sync
- [Supabase + PowerSync](https://www.powersync.com/blog/offline-first-apps-made-simple-supabase-powersync) -- alternative sync approach (rejected for complexity)
- [Supastash](https://github.com/0xZekeA/supastash) -- community sync engine (rejected for maturity)
- [Supabase RLS Best Practices](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) -- multi-tenant RLS patterns

### Tertiary (LOW confidence)
- None -- all critical claims verified against official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages verified against npm registry, official docs cross-referenced
- Architecture: HIGH -- sync pattern is straightforward LWW, auth uses documented native flows, existing codebase patterns followed
- Pitfalls: HIGH -- based on official documentation warnings (session size, Apple name, nonce handling) and community reports
- Social features: MEDIUM -- simple schema but invite link deep-linking untested against Expo Router specifics
- Dark mode: HIGH -- existing tokens and theme system already support it; change is minimal

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (30 days -- Supabase SDK and auth patterns are stable)
