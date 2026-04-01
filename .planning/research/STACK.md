# Technology Stack: Stability & App Store Readiness

**Project:** Tila — Hardening for App Store Submission
**Researched:** 2026-03-31
**Mode:** Additive — what to add to the existing stack, not replace it

## Existing Stack (Do Not Change)

These are locked. This research covers what to layer on top.

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

**Do NOT use:** `react-native-error-boundary` (carloscuesta). It has fewer features, no hook API, and lower maintenance cadence. `react-error-boundary` by bvaughn is the community standard and works identically in React Native.

**Implementation pattern:** Screen-level boundaries wrapping each route, plus a root-level boundary in `_layout.tsx` as the last-resort fallback. Sentry's `Sentry.ErrorBoundary` exists but is for web — use `react-error-boundary` and manually call `Sentry.captureException` in the `onError` callback.

```typescript
// Per-screen pattern
import { ErrorBoundary } from "react-error-boundary";

function ScreenErrorFallback({ error, resetErrorBoundary }) {
  // Log to Sentry
  Sentry.captureException(error);
  return <ErrorRecoveryScreen onRetry={resetErrorBoundary} />;
}

// In route layout
<ErrorBoundary FallbackComponent={ScreenErrorFallback}>
  <Slot />
</ErrorBoundary>
```

### 2. Test Coverage Tooling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `@vitest/coverage-v8` | ^4.1.2 | Code coverage reports | Matches existing Vitest 4.1.2 exactly. V8-based coverage is faster than Istanbul for Node environments. Generates text, HTML, and JSON reports. Zero config beyond adding the package. | HIGH |

**Do NOT use:** `@vitest/coverage-istanbul` — slower, and V8 provider is the Vitest-recommended default. Also do NOT use `vitest-react-native` — it is experimental/WIP and unnecessary for testing pure engine logic and hooks (which is the priority here).

**Configuration:**
```typescript
// vitest.config.ts addition
export default defineConfig({
  test: {
    include: ["src/__tests__/**/*.test.{js,ts}"],
    setupFiles: ["src/__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/engine/**", "src/hooks/**", "src/db/**"],
      exclude: ["src/__tests__/**", "src/design/**", "src/components/**"],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  },
});
```

### 3. Database Migration Safety

**No new library needed.** The existing `expo-sqlite` API is sufficient. What's needed is a pattern fix, not a dependency.

| Approach | Purpose | Why | Confidence |
|----------|---------|-----|------------|
| Transaction-wrapped migrations | Atomic migration execution | `db.withExclusiveTransactionAsync()` ensures a failed migration rolls back cleanly instead of leaving the DB in a half-migrated state. Already available in expo-sqlite 55. | HIGH |
| PRAGMA table_info checks | Column existence verification | Already partially used (migrations v3-v5). Migration v2 uses bare try/catch which swallows real errors. Standardize on PRAGMA checks for all migrations. | HIGH |

**Do NOT use:** Drizzle ORM, Knex, or any ORM/query-builder. The app has 8 simple tables with hand-written SQL. Adding an ORM for migration safety is massive over-engineering. Fix the migration pattern, not the toolchain.

**Pattern fix for existing migrations:**
```typescript
async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const currentVersion = await getCurrentVersion(db);

  // Each migration wrapped in exclusive transaction
  if (currentVersion < 2) {
    await db.withExclusiveTransactionAsync(async (tx) => {
      // Check column existence via PRAGMA before ALTER
      const cols = await tx.getAllAsync<{ name: string }>(
        "PRAGMA table_info(user_profile)"
      );
      const existing = new Set(cols.map(c => c.name));
      if (!existing.has("wird_intro_seen")) {
        await tx.execAsync("ALTER TABLE user_profile ADD COLUMN wird_intro_seen INTEGER NOT NULL DEFAULT 0;");
      }
      // ... remaining columns
      await tx.runAsync("INSERT OR REPLACE INTO schema_version (version) VALUES (2)");
    });
  }
}
```

### 4. Audio Error Handling

**No new library needed.** The existing `expo-audio` API handles this — the app just needs try/catch wrappers.

| Approach | Purpose | Why | Confidence |
|----------|---------|-----|------------|
| try/catch on all `player.play()` and `player.replace()` calls | Prevent unhandled promise rejections | expo-audio can throw on corrupted assets, interrupted playback, or audio session conflicts. Currently the `playVoice` function is async but `playSFX` is sync with no error handling. Both need guards. | HIGH |

**Current problem:** `playVoice` is `async` but callers (`playLetterName`, `playLetterSound`) discard the promise — any rejection is unhandled. `playSFX` calls `player.play()` synchronously but `play()` can fail silently or throw on some devices.

**Fix pattern:**
```typescript
async function playVoice(source: AudioSource): Promise<void> {
  if (_muted) return;
  try {
    const player = getVoicePlayer();
    player.replace(source);
    player.play();
  } catch (e) {
    console.warn("[Audio] Voice playback failed:", e);
    // Do NOT crash — audio failure is non-fatal
  }
}

function playSFX(source: AudioSource, priority: number, guardMs: number): void {
  if (_muted) return;
  try {
    // ... existing priority logic ...
    player.replace(source);
    player.play();
  } catch (e) {
    console.warn("[Audio] SFX playback failed:", e);
  }
}
```

### 5. Offline Subscription Handling

**No new library needed.** RevenueCat SDK (`react-native-purchases` 9.15.0) already caches entitlements locally.

| Approach | Purpose | Why | Confidence |
|----------|---------|-----|------------|
| `Purchases.getCustomerInfo()` with try/catch + cached fallback | Graceful offline subscription checks | RevenueCat SDK caches the last known CustomerInfo on-device. When offline, `getCustomerInfo()` returns cached data. The app needs to handle the case where the SDK fails to initialize (missing API key, unconfigured) by defaulting to "free tier" rather than crashing. | HIGH |

**Key pattern:** Never gate UI rendering on subscription state. Load subscription state async, default to free tier, upgrade UI when state resolves.

```typescript
async function getSubscriptionState(): Promise<"free" | "premium"> {
  try {
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active["premium"] ? "premium" : "free";
  } catch {
    // Offline, unconfigured, or error — default to free
    // RevenueCat SDK caches last known state, so this rarely fires
    // for previously-authenticated users
    return "free";
  }
}
```

### 6. Type Safety Improvements

**No new library needed.** TypeScript 5.9 already has everything required.

| Approach | Purpose | Why | Confidence |
|----------|---------|-----|------------|
| Strict hook return types | Eliminate `any` leakage from hooks | Hooks currently return spread objects without explicit return types. Adding explicit interfaces prevents downstream `any` propagation. | HIGH |
| `satisfies` operator on data constants | Type-check static data without widening | `LESSONS satisfies Lesson[]` catches data errors at compile time without changing runtime behavior. Available since TS 4.9, underused in codebase. | HIGH |

### 7. App Store Submission Tooling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| EAS Build (already configured) | CLI >= 15.0.0 | Production builds | Already in `eas.json`. No new tooling needed for builds. | HIGH |
| EAS Submit | (part of EAS CLI) | App Store / Play Store submission | `eas submit` automates upload to both stores. Already available, just needs production build profile. | HIGH |

**Pre-submission checklist (no tooling, just process):**
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

```bash
# New dependencies (just 2 packages)
npm install react-error-boundary

# Dev dependencies
npm install -D @vitest/coverage-v8
```

Total new packages: **2**. Everything else is pattern fixes in existing code.

## What This Does NOT Cover

These are explicitly out of scope for this hardening milestone:

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
