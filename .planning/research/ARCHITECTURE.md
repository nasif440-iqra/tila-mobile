# Architecture Patterns: Hardening & Error Handling

**Domain:** React Native / Expo production app hardening
**Researched:** 2026-03-31

## Current Architecture (Baseline)

Tila's existing layered architecture is well-structured for hardening. The key insight: hardening works *with* these layers, not against them.

```
ThemeContext.Provider
  Sentry.ErrorBoundary         <-- already exists (root level)
    DatabaseProvider
      SubscriptionProvider
        AnalyticsGate
          Stack Navigator
            Screen Components
              Feature Components
                Design System Components
```

**Data flow (unchanged by hardening):**
```
Screen -> Hook -> Engine -> SQLite
  UI        Bridge   Pure JS   Persistence
```

## Recommended Hardening Architecture

### Error Boundary Placement

Error boundaries catch rendering/lifecycle errors only -- not event handlers, async code, or promises. Place them where recovery makes sense, not everywhere.

**Layer 1: Root boundary (EXISTS)**
- `Sentry.ErrorBoundary` in `_layout.tsx` already catches catastrophic failures
- Shows `ErrorFallback` with retry
- This is correct and sufficient for the root level

**Layer 2: Screen-level boundaries (ADD)**
- Wrap each screen's *content* (not the screen component itself -- Expo Router owns that)
- Goal: if the lesson screen crashes, the user can navigate back to home; if home crashes, the lesson screen still works
- Place inside the screen component, wrapping the return JSX
- Use `react-error-boundary` (recommended in STACK.md) with `onError` callback to Sentry

```
app/(tabs)/index.tsx:
  ErrorBoundary (onError -> Sentry, FallbackComponent -> ScreenErrorFallback)
    HomeContent

app/lesson/[id].tsx:
  ErrorBoundary (onError -> Sentry, FallbackComponent -> ScreenErrorFallback)
    LessonContent

app/(tabs)/progress.tsx:
  ErrorBoundary (onError -> Sentry, FallbackComponent -> ScreenErrorFallback)
    ProgressContent
```

**Layer 3: Feature-level boundaries (SELECTIVE)**
- Only for components that are independently useful when siblings fail
- The quiz area within a lesson: if celebration animation crashes, quiz should survive
- NOT needed for every component -- that is over-engineering

Candidates for feature-level boundaries:
- `LessonQuiz` / `LessonHybrid` (protect quiz from celebration/summary crashes)
- Home screen hero card (protect lesson grid if hero data is bad)
- SubscriptionProvider children (protect app if RevenueCat crashes)

**Do NOT add boundaries around:**
- Individual design system components (Button, Card, ArabicText)
- Individual quiz options
- Navigation components
- Pure display components

### Component Boundaries

| Component | Responsibility | Error Strategy | Communicates With |
|-----------|---------------|----------------|-------------------|
| `ErrorBoundary` (react-error-boundary) | Catch render errors per-screen, report to Sentry, show contextual recovery UI | `onError` -> `Sentry.captureException`, `FallbackComponent` -> retry/navigate | Sentry, screen content |
| `DatabaseProvider` (enhanced) | Initialize DB with timeout, show error state on failure | Promise timeout + error state + retry | SQLite, all hooks |
| Audio player (hardened) | Catch all audio errors silently | try/catch every play call, never throw | expo-audio |
| `SubscriptionProvider` (enhanced) | Handle RevenueCat SDK failures gracefully | Default to free tier on any error | RevenueCat SDK |
| Engine functions (defensive) | Return safe defaults on bad input | Null checks, fallback returns | Static data, SQLite |
| Hooks (defensive) | Handle null/undefined from engine, loading states | Optional chaining, null-safe defaults, error state | Engine, DB, UI |

### Data Flow with Error Handling

```
Screen
  |-- ErrorBoundary (react-error-boundary)
  |     |-- catches: rendering crashes, bad state -> shows retry UI
  |     |-- reports: onError -> Sentry.captureException with screen tag
  |
  |-- Hook (useProgress, useLessonQuiz)
  |     |-- defensive: null-safe returns, loading states, error field
  |     |-- catches: DB errors in try/catch -> returns error state
  |
  |-- Engine (mastery.js, questions/, selectors.js)
  |     |-- defensive: validates inputs, returns safe defaults
  |     |-- never throws: returns null/empty on bad input
  |
  |-- SQLite (db/client.ts)
  |     |-- defensive: migration errors caught individually
  |     |-- timeout: getDatabase() has 10s timeout
  |     |-- recovery: show "DB failed" screen, offer retry
  |
  |-- Audio (player.ts)
  |     |-- defensive: every play() wrapped in try/catch
  |     |-- silent failure: audio errors never surface to user
  |
  |-- RevenueCat (monetization/)
        |-- defensive: all SDK calls check init state first
        |-- fallback: default to free tier on any failure
```

## Patterns to Follow

### Pattern 1: Screen Error Boundary with react-error-boundary

**What:** Use `react-error-boundary`'s `ErrorBoundary` component with `onError` reporting to Sentry and a themed `FallbackComponent`.

**When:** Every screen-level component in `app/`.

**Example:**
```typescript
import { ErrorBoundary } from "react-error-boundary";
import * as Sentry from "@sentry/react-native";

function ScreenErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const colors = useColors();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Something went wrong</Text>
      <Text>Your progress is saved.</Text>
      <Button onPress={resetErrorBoundary} title="Try Again" />
      <Button onPress={() => router.replace("/")} title="Go Home" />
    </View>
  );
}

// In screen component:
export default function LessonScreen() {
  return (
    <ErrorBoundary
      FallbackComponent={ScreenErrorFallback}
      onError={(error, info) => {
        Sentry.withScope((scope) => {
          scope.setTag("screen", "lesson");
          scope.setExtra("componentStack", info.componentStack);
          Sentry.captureException(error);
        });
      }}
    >
      <LessonScreenContent />
    </ErrorBoundary>
  );
}
```

### Pattern 2: Database Initialization with Timeout

**What:** Wrap `getDatabase()` in a timeout so the app never hangs on DB init. Show an error screen with retry if init fails.

**When:** `DatabaseProvider` -- the single point where DB is initialized.

**Example:**
```typescript
export function DatabaseProvider({ children, fallback }: Props) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const initialize = useCallback(async () => {
    setError(null);
    try {
      const database = await Promise.race([
        getDatabase(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Database initialization timed out")), 10_000)
        ),
      ]);
      setDb(database);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      Sentry.captureException(e);
    }
  }, []);

  useEffect(() => { initialize(); }, [initialize]);

  if (error) return <DatabaseErrorScreen error={error} onRetry={initialize} />;
  if (!db) return <>{fallback}</>;
  return <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>;
}
```

### Pattern 3: Silent Audio Failure

**What:** Wrap every audio playback call in try/catch. Audio failure should never crash the app or show an error to the user -- it silently fails.

**When:** Every function in `src/audio/player.ts`.

**Example:**
```typescript
async function playVoice(source: AudioSource): Promise<void> {
  if (_muted) return;
  try {
    const player = getVoicePlayer();
    player.replace(source);
    player.play();
  } catch (e) {
    // Audio failure is non-critical -- log but never throw
    console.warn("[Audio] playVoice failed:", e);
  }
}

function playSFX(source: AudioSource, priority: number, guardMs: number): void {
  if (_muted) return;
  try {
    // ... existing priority logic ...
    const player = getSFXPlayer();
    player.replace(source);
    player.play();
    _playing = { priority, startedAt: Date.now(), guardMs };
  } catch (e) {
    console.warn("[Audio] SFX playback failed:", e);
  }
}
```

### Pattern 4: Engine Input Validation

**What:** Every engine function validates its inputs and returns safe defaults instead of throwing. The engine layer should be impossible to crash with bad data.

**When:** All functions in `src/engine/`.

**Example:**
```javascript
// Before (can crash on null mastery)
export function mergeQuizResultsIntoMastery(mastery, results, today) {
  for (const result of results) {
    const entity = mastery.entities[result.targetKey];
    // crashes if mastery is null
  }
}

// After (defensive)
export function mergeQuizResultsIntoMastery(mastery, results, today) {
  if (!mastery || !results || !Array.isArray(results)) {
    return mastery ?? { entities: {}, skills: {}, confusions: {} };
  }
  const entities = mastery.entities ?? {};
  // ... safe access throughout
}
```

### Pattern 5: Hook Error State

**What:** Every data hook returns an `error` field alongside `loading` and data. Screens can show contextual error UI without crashing.

**When:** All hooks in `src/hooks/`.

**Example:**
```typescript
export function useProgress() {
  const [state, setState] = useState<ProgressState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await loadProgress(db);
      setState(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      Sentry.captureException(e);
    } finally {
      setLoading(false);
    }
  }, [db]);

  return { ...state, loading, error, refresh, /* ... */ };
}
```

### Pattern 6: RevenueCat Initialization Guard

**What:** Track whether RevenueCat SDK was successfully configured. Guard all SDK calls behind this check. Never call `Purchases.*` methods on an unconfigured SDK.

**When:** All code in `src/monetization/`.

**Example:**
```typescript
let _initialized = false;

export function initRevenueCat(): void {
  // ... existing logic ...
  Purchases.configure({ apiKey });
  _initialized = true;
}

export function isRevenueCatReady(): boolean {
  return _initialized;
}

// In SubscriptionProvider:
useEffect(() => {
  if (!isRevenueCatReady()) {
    setLoading(false); // Default to free tier
    return;
  }
  Purchases.getCustomerInfo()
    .then(/* ... */)
    .catch(() => setLoading(false));
}, []);
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Error Boundary Everywhere
**What:** Wrapping every component in an error boundary.
**Why bad:** Adds component tree depth, hurts performance, fragments the UI. User sees random "something went wrong" boxes scattered across the screen.
**Instead:** Three levels max: root, screen, select feature components.

### Anti-Pattern 2: Swallowing Errors Silently
**What:** Empty `catch {}` blocks that hide failures.
**Why bad:** Bugs ship undetected. Sentry stays empty while users have degraded experiences. The v2 migration `catch {}` is the poster child for this.
**Instead:** Catch, log to Sentry (or console.warn for non-critical), return safe default. Every catch block should either report or have a comment explaining why silence is correct.

### Anti-Pattern 3: Defensive Coding in Render Functions
**What:** Adding null checks and try/catch inside JSX render functions.
**Why bad:** Makes render functions unreadable. Error boundaries exist for this purpose.
**Instead:** Validate data in hooks/engine. If render receives bad data, let the error boundary catch it.

### Anti-Pattern 4: Retry Loops for Local Operations
**What:** Automatic retry with exponential backoff for DB or audio operations.
**Why bad:** For local operations (not network), if it fails once it usually fails again. Retry loops just delay the inevitable and waste battery.
**Instead:** Single retry on user tap. For DB init, one automatic attempt then show error screen.

### Anti-Pattern 5: Global Error Handler as Primary Strategy
**What:** Using `ErrorUtils.setGlobalHandler()` as the main error strategy.
**Why bad:** Global handler catches uncaught errors but cannot recover the component tree. The app is left in a broken state with no navigation.
**Instead:** Global handler as a last resort (Sentry already does this via its native integration). Error boundaries for component tree recovery.

## Hardening Order (Build Sequence)

The order matters because each layer protects the layers above it. Fix from the bottom up.

### Phase 1: Foundation (fix first -- blocks everything)
1. **Database initialization safety** -- timeout + error screen + retry
   - Without a working DB, nothing else works
   - Current: no timeout, no error handling in DatabaseProvider
   - Risk: app hangs forever on DB init failure

2. **Critical bug fixes** -- quiz ref reset, streak race condition, midnight routing
   - These cause visible broken behavior during App Store review
   - Independent of each other, can be fixed in parallel

3. **Unhandled promise rejection audit** -- catch all fire-and-forget async
   - `initRevenueCat()` in _layout.tsx, audio playback, subscription queries
   - Production Hermes treats unhandled rejections as crashes

### Phase 2: Containment Layer
4. **Screen-level error boundaries** -- `react-error-boundary` on each screen
   - Depends on: root boundary already existing (it does)
   - Wrap each screen: home, lesson, progress, onboarding
   - Each boundary reports to Sentry with screen tag

5. **Audio defensive wrapper** -- try/catch on all playback
   - Current: no error handling in player.ts
   - Silent failure -- audio bugs should never crash the app

6. **RevenueCat graceful degradation** -- init guard + free-tier default
   - Current: SubscriptionProvider catches some errors but not all paths
   - Ensure unconfigured SDK = free tier, not crash

### Phase 3: Data Safety
7. **Migration safety** -- transaction wrapping + PRAGMA checks
   - Fix v2 migration bare catch, standardize on PRAGMA pattern
   - Transaction-wrap all migrations so failures roll back cleanly

8. **Engine input validation** -- null/undefined guards
   - Pure JS layer, easy to test, zero UI risk
   - Prevents cascading crashes from bad data flowing up

### Phase 4: Quality Gate
9. **Hook error states** -- add error field to all hooks
   - Enables screens to show contextual error UI
   - Depends on engine being defensive (Phase 3)

10. **Type safety** -- hook return types, eliminate critical `any`
    - Compile-time safety net for future changes

11. **Test coverage** -- engine tests, migration tests, coverage tooling
    - Validates all fixes, catches regressions

## Scalability Considerations

| Concern | Current (hundreds) | At 10K users | At 100K users |
|---------|-------------------|--------------|---------------|
| Error volume | Console.warn only | Need Sentry alerting rules | Add sampling to avoid quota |
| DB migrations | Run on startup, fine | Same -- local DB | Same -- still local |
| Error boundaries | Screen-level sufficient | Same | Same |
| Audio errors | Silent fail, fine | Same | Same |
| Crash recovery | App restart | Same for offline app | Same |

Tila is offline-first with local SQLite. Most scalability concerns (connection pooling, rate limiting, caching) do not apply. The architecture stays the same at any user count. The only scaling concern is Sentry event volume -- configure sampling above 10K users.

## Sources

- [Sentry React Native Error Boundary](https://docs.sentry.io/platforms/react-native/integrations/error-boundary/) -- HIGH confidence, official docs
- [react-error-boundary npm](https://www.npmjs.com/package/react-error-boundary) -- HIGH confidence, v6.1.1 React 19 compatible
- [React Native Error Boundaries - Advanced Techniques](https://www.reactnative.university/blog/react-native-error-boundaries) -- MEDIUM confidence
- [Expo Error Recovery](https://docs.expo.dev/eas-update/error-recovery/) -- HIGH confidence, official docs
- [Expo SQLite Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/) -- HIGH confidence, official docs
- [React Error Boundaries](https://react.dev/reference/react/Component) -- HIGH confidence, official docs
- [Stop React Native Crashes: Production-Ready Error Handling](https://dzone.com/articles/react-native-error-handling-guide) -- MEDIUM confidence
- Codebase audit of `app/_layout.tsx`, `src/db/client.ts`, `src/db/provider.tsx`, `src/audio/player.ts`, `src/hooks/`, `src/monetization/provider.tsx` -- direct evidence
