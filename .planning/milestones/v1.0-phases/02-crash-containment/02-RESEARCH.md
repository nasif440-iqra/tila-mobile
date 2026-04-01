# Phase 2: Crash Containment - Research

**Researched:** 2026-03-31
**Domain:** Error handling, error boundaries, async safety in React Native / Expo
**Confidence:** HIGH

## Summary

Phase 2 adds defensive wrappers for three categories of unknown runtime failures: audio playback crashes, screen-level render errors, and unhandled promise rejections. All three fixes are independent with no ordering dependency.

The codebase is well-structured for these changes. The audio player (`src/audio/player.ts`) has two clear functions (`playVoice`, `playSFX`) that need try/catch wrapping. The error boundary work requires installing `react-error-boundary` (v6.1.1, confirmed available on npm) and creating a `ScreenErrorFallback` component that extends the existing `ErrorFallback` pattern. The unhandled promise audit found exactly 2 bare `.then()` calls needing guarded async conversion, plus `configureAudioSession()` in a test screen as a minor fire-and-forget async call.

**Primary recommendation:** Execute all three fixes in parallel since they touch different files with no overlap. Wire Sentry reporting explicitly in screen-level boundaries -- child boundaries consume errors before the root `Sentry.ErrorBoundary` sees them.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Wrap `player.replace()` + `player.play()` in try/catch in both `playVoice()` and `playSFX()`
- D-02: Catch handler: `console.warn` only -- audio failures are silent to user (non-fatal)
- D-03: No user-facing error UI for audio -- silent failure is correct behavior
- D-04: Install `react-error-boundary` (^6.1.1) -- NOT yet in repo, must `npm install`
- D-05: Add boundaries to lesson screen and home screen only (selective, not blanket)
- D-06: Each screen boundary MUST explicitly report to Sentry via `onError` -- the root Sentry.ErrorBoundary does NOT see errors caught by child boundaries
- D-07: Root Sentry.ErrorBoundary stays as last-resort catch-all -- do not remove it
- D-08: Create a `ScreenErrorFallback` component (or extend `ErrorFallback` with `onGoHome` prop) -- existing ErrorFallback only supports retry, not navigation
- D-09: "Go Home" action calls `router.replace('/')` to navigate back to home tab
- D-10: Convert `loadPremiumLessonGrants` effects to guarded async loaders with cancellation flag + try/catch
- D-11: Catch sets `grantedLessonIds` to `[]` (safe default), cancelled flag prevents stale setState on unmount
- D-12: `src/monetization/provider.tsx` already has `.catch()` -- verify coverage, no change needed
- D-13: Grep for any other fire-and-forget patterns and fix them with same guarded async pattern
- D-14: Catch handlers should console.warn, not throw

### Claude's Discretion
- Exact ErrorBoundary component wiring (whether to use `useErrorBoundary` hook or `ErrorBoundary` component wrapper)
- Whether to create a separate `ScreenErrorFallback` or adapt existing `ErrorFallback` with a navigation prop
- Test file organization for regression tests

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONT-01 | Audio playback calls wrapped in try/catch -- play() failures don't crash the app | Audio player source confirmed: `playVoice` (line 159) and `playSFX` (line 194) have zero error handling. `_playing` assignment in `playSFX` must stay inside try block after `play()`. |
| CONT-02 | Unhandled promise rejection audit -- all fire-and-forget async calls have catch paths | Repo-wide grep completed: 2 confirmed bare `.then()` calls in `app/(tabs)/index.tsx:305` and `app/lesson/review.tsx:47`. `src/monetization/provider.tsx` and `src/db/provider.tsx` already have `.catch()` + mounted flags. `configureAudioSession()` in `app/audio-test.tsx` is fire-and-forget async (minor, test screen only). |
| CONT-03 | Selective screen-level error boundaries on screens with expensive async setup or monetization | `react-error-boundary` v6.1.1 confirmed available, not yet installed. Existing `ErrorFallback` component at `src/components/feedback/ErrorFallback.tsx` supports `onRetry` only. Need new `ScreenErrorFallback` with "Go Home" navigation via `router.replace('/')`. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-error-boundary | 6.1.1 | Screen-level error boundary components | De facto standard for declarative error boundaries in React. 5M+ weekly npm downloads. Provides `ErrorBoundary` component with `FallbackComponent`, `onError`, `onReset` props. |
| @sentry/react-native | ~7.11.0 | Error reporting from boundaries | Already installed. Must call `Sentry.captureException()` explicitly from child boundary `onError` callbacks. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-router | ~55.0.7 | Navigation from error fallback | Already installed. `router.replace('/')` for "Go Home" action in ScreenErrorFallback. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-error-boundary | Manual class component | More boilerplate, no `resetKeys`, no `onReset` callback. react-error-boundary is 3KB and battle-tested. |
| Separate ScreenErrorFallback | Extend ErrorFallback with optional `onGoHome` prop | Either works. Separate component is cleaner -- ErrorFallback serves DB init recovery (no navigation context), ScreenErrorFallback serves in-app screen crashes (has navigation). Different concerns. |

**Installation:**
```bash
npm install react-error-boundary
```

**Version verification:** `react-error-boundary@6.1.1` confirmed as latest via `npm view react-error-boundary version` on 2026-03-31.

## Architecture Patterns

### Recommended Component Placement
```
src/components/feedback/
  ErrorFallback.tsx          # Existing -- DB init recovery (onRetry only)
  ScreenErrorFallback.tsx    # NEW -- Screen crash recovery (onRetry + onGoHome)
```

### Pattern 1: Screen-Level Error Boundary Wrapping
**What:** Wrap the screen's return JSX in an `<ErrorBoundary>` from `react-error-boundary`, with `onError` explicitly reporting to Sentry.
**When to use:** Screens with complex async setup, monetization checks, or heavy derived state (lesson screen, home screen).
**Example:**
```typescript
// Source: https://github.com/bvaughn/react-error-boundary
import { ErrorBoundary } from "react-error-boundary";
import * as Sentry from "@sentry/react-native";
import { ScreenErrorFallback } from "../../src/components/feedback/ScreenErrorFallback";

// Inside the screen component's return:
<ErrorBoundary
  onError={(error, info) => {
    Sentry.captureException(error, {
      extra: { componentStack: info.componentStack },
    });
  }}
  FallbackComponent={ScreenErrorFallback}
>
  {/* Screen content */}
</ErrorBoundary>
```

### Pattern 2: Guarded Async Loader in useEffect
**What:** Replace bare `.then(setState)` with async function inside useEffect that uses a cancelled flag and try/catch.
**When to use:** Any useEffect that calls an async function and sets state from the result.
**Example:**
```typescript
useEffect(() => {
  let cancelled = false;

  async function loadGrants() {
    try {
      const grants = await loadPremiumLessonGrants(db);
      if (!cancelled) setGrantedLessonIds(grants);
    } catch (e) {
      console.warn('Failed to load premium grants:', e);
      if (!cancelled) setGrantedLessonIds([]);
    }
  }

  if (!progress.loading) loadGrants();

  return () => { cancelled = true; };
}, [db, progress.loading]);
```

### Pattern 3: Audio Try/Catch with Guard State Protection
**What:** Wrap `replace()` + `play()` in try/catch. For `playSFX`, keep `_playing` assignment inside the try block after successful `play()`.
**When to use:** All audio playback functions.
**Example:**
```typescript
function playSFX(source: AudioSource, priority: number, guardMs: number): void {
  if (_muted) return;
  const now = Date.now();
  if (_playing && priority >= _playing.priority && now - _playing.startedAt < _playing.guardMs) {
    return;
  }
  try {
    const player = getSFXPlayer();
    player.replace(source);
    player.play();
    _playing = { priority, startedAt: now, guardMs };  // INSIDE try -- only set on success
  } catch (e) {
    console.warn('SFX playback failed:', e);
  }
}
```

### Pattern 4: ScreenErrorFallback Component
**What:** A fallback component that receives `error` and `resetErrorBoundary` from react-error-boundary's `FallbackComponent` contract, and adds a "Go Home" button.
**When to use:** Screen-level error boundaries (not root-level).
**Example:**
```typescript
import { FallbackProps } from "react-error-boundary";
import { router } from "expo-router";

export function ScreenErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const colors = useColors();
  // Render: "Something went wrong" + "Try Again" (resetErrorBoundary) + "Go Home" (router.replace('/'))
}
```

### Anti-Patterns to Avoid
- **Wrapping every screen in a boundary:** Only lesson and home screens need it. Simple screens (onboarding, return-welcome) are covered by the root Sentry boundary.
- **Assuming root Sentry.ErrorBoundary catches child boundary errors:** It does NOT. Child boundaries consume the error. Explicit `Sentry.captureException` in `onError` is mandatory.
- **Setting `_playing` state outside try block in playSFX:** If `replace()` or `play()` throws, the guard state incorrectly marks a failed sound as "playing", blocking subsequent SFX.
- **Adding `.catch()` instead of guarded async:** Bare `.catch()` handles rejection but does not prevent stale setState on unmount. The guarded async pattern with `cancelled` flag handles both.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error boundary component | Custom class component with getDerivedStateFromError | `react-error-boundary` v6 | Handles reset, error recovery, fallback rendering, `onError` callbacks. 3KB, well-maintained. |
| Unmount-safe async | Custom AbortController wrapper | Cancelled flag pattern | Simple, idiomatic React, no extra dependencies. AbortController is overkill for state-setting effects. |

## Common Pitfalls

### Pitfall 1: Child Boundary Silences Root Sentry Reporting
**What goes wrong:** Screen-level `ErrorBoundary` catches the error, shows fallback, but root `Sentry.ErrorBoundary` never sees it -- error goes unreported.
**Why it happens:** React error boundaries consume errors. Once a child boundary catches, parents never see it.
**How to avoid:** Every screen-level `ErrorBoundary` MUST include `onError` that calls `Sentry.captureException(error, { extra: { componentStack: info.componentStack } })`.
**Warning signs:** Crashes in production with no corresponding Sentry events.

### Pitfall 2: Stale setState After Navigation
**What goes wrong:** User navigates away from home screen while `loadPremiumLessonGrants` is in flight. Promise resolves, calls `setGrantedLessonIds` on unmounted component.
**Why it happens:** Bare `.then(setState)` has no cancellation mechanism.
**How to avoid:** Guarded async pattern with `cancelled` flag in useEffect cleanup.
**Warning signs:** "Can't perform a React state update on an unmounted component" warning in dev.

### Pitfall 3: playSFX Guard State Corruption
**What goes wrong:** `player.replace()` throws, but `_playing` is set anyway (if assignment is outside try block). Subsequent legitimate SFX calls are blocked for the guard window duration.
**Why it happens:** `_playing` assignment placed before or outside the try/catch.
**How to avoid:** Keep `_playing = { priority, startedAt, guardMs }` INSIDE the try block, AFTER `player.play()`.
**Warning signs:** Sound effects randomly stop working for brief periods.

### Pitfall 4: FallbackComponent Props Contract
**What goes wrong:** `ScreenErrorFallback` doesn't match the `FallbackProps` interface from `react-error-boundary`, causing TypeScript errors or runtime issues.
**Why it happens:** `react-error-boundary` expects `FallbackComponent` to accept `{ error: Error, resetErrorBoundary: () => void }`.
**How to avoid:** Import `FallbackProps` from `react-error-boundary` and use it as the component's props type.
**Warning signs:** TypeScript compile errors when wiring the boundary.

## Code Examples

### Existing ErrorFallback (reference for ScreenErrorFallback styling)
```typescript
// Source: src/components/feedback/ErrorFallback.tsx
// Uses: useColors(), typography, spacing, radii from design system
// Props: { onRetry: () => void }
// Layout: Centered, warm cream bg, "Something went wrong" heading, "Try Again" button
```

### Existing Root Boundary Structure (DO NOT MODIFY)
```typescript
// Source: app/_layout.tsx lines 72-104
<Sentry.ErrorBoundary fallback={({ resetError }) => (
  <ErrorFallback onRetry={resetError} />
)}>
  <DatabaseProvider fallback={<AppLoadingScreen />}>
    <SubscriptionProvider>
      <AnalyticsGate>
        <Stack>...</Stack>
      </AnalyticsGate>
    </SubscriptionProvider>
  </DatabaseProvider>
</Sentry.ErrorBoundary>
```

### Confirmed Fire-and-Forget Audit Results
```
NEEDS FIX:
  app/(tabs)/index.tsx:305    loadPremiumLessonGrants(db).then(setGrantedLessonIds)   -- no .catch(), no cancellation
  app/lesson/review.tsx:47    loadPremiumLessonGrants(db).then(setGrantedLessonIds)   -- no .catch(), no cancellation

ALREADY SAFE:
  src/db/provider.tsx:42      getDatabase().then(...)                                  -- has .catch(), has mounted flag
  src/monetization/provider.tsx:99  Purchases.getCustomerInfo().then(...)              -- has .catch(), has mounted flag

MINOR (test screen only):
  app/audio-test.tsx:12       configureAudioSession()                                  -- async function called without await, test-only screen

NOT ASYNC (false positive):
  app/_layout.tsx:55          initRevenueCat()                                         -- synchronous function, no promise
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-01 | playVoice/playSFX don't propagate errors when player.play() throws | unit (source analysis + mock) | `npx vitest run src/__tests__/audio-safety.test.ts` | Wave 0 |
| CONT-02 | No bare .then(setState) without catch in home/review screens | unit (source analysis) | `npx vitest run src/__tests__/promise-safety.test.ts` | Wave 0 |
| CONT-03a | Lesson screen has ErrorBoundary with Sentry onError | unit (source analysis) | `npx vitest run src/__tests__/screen-boundary.test.ts` | Wave 0 |
| CONT-03b | ScreenErrorFallback renders with "Try Again" and "Go Home" buttons | unit (source analysis) | `npx vitest run src/__tests__/screen-boundary.test.ts` | Wave 0 |

### Existing Test Context
- `src/__tests__/error-boundary.test.ts` already exists -- tests the existing `ErrorFallback` component via source analysis (checks for `onRetry`, "Try Again" text, `useColors`). New screen boundary tests should follow this same source-analysis pattern.
- `src/__tests__/setup.ts` already mocks `@sentry/react-native` with `captureException: vi.fn()` -- ready for boundary tests.

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/audio-safety.test.ts` -- covers CONT-01
- [ ] `src/__tests__/promise-safety.test.ts` -- covers CONT-02
- [ ] `src/__tests__/screen-boundary.test.ts` -- covers CONT-03a and CONT-03b

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Class-based error boundaries | `react-error-boundary` v6 declarative API | 2024 (v5->v6 migration) | Simpler API, `FallbackComponent` props contract, `useErrorBoundary` hook removed in v5+ (use `showBoundary` instead) |
| Bare .then().catch() | Guarded async in useEffect with cancelled flag | React 18+ best practice | Prevents stale state updates, cleaner cleanup |

**Deprecated/outdated:**
- `useErrorBoundary` hook: Removed in react-error-boundary v5. Replaced by `useErrorBoundary` -> renamed to `showBoundary` via `useErrorBoundary()` hook returning `{ showBoundary, resetBoundary }`. Not needed for this phase -- we use the `ErrorBoundary` component directly.

## Open Questions

1. **configureAudioSession() in audio-test.tsx**
   - What we know: It's an async function called without await in a test-only screen (`app/audio-test.tsx`).
   - What's unclear: Whether this test screen ships to production or is dev-only.
   - Recommendation: LOW priority. If it ships, add try/catch. If dev-only, ignore. The planner should include this as a minor item in the audit task.

## Project Constraints (from CLAUDE.md)

- **Stack:** Expo 55, React Native 0.83, React 19, TypeScript 5.9 -- all changes must work within this stack
- **No business logic changes:** UI overhaul only constraint from CLAUDE.md does NOT apply here -- this is a stability milestone, not the UI overhaul. Crash containment changes are explicitly scoped.
- **Test framework:** Vitest (not Jest). Tests in `src/__tests__/**/*.test.{js,ts}`.
- **Naming:** Components PascalCase `.tsx`, test files camelCase `.test.ts`
- **Exports:** Named exports everywhere. Default exports ONLY for Expo Router screen components.
- **Error handling pattern:** Nullish coalescing (`??`), optional chaining (`?.`), try/catch with console.warn for non-fatal
- **Imports:** Relative paths, no `@/` alias in practice
- **Design system:** Use `useColors()`, `typography`, `spacing`, `radii` from design tokens
- **No Prettier:** Formatting via ESLint only, 2-space indent, semicolons

## Sources

### Primary (HIGH confidence)
- Source code audit of `src/audio/player.ts`, `app/_layout.tsx`, `app/(tabs)/index.tsx`, `app/lesson/review.tsx`, `src/monetization/provider.tsx`, `src/db/provider.tsx` -- direct file reads
- npm registry: `react-error-boundary@6.1.1` confirmed as latest version
- [react-error-boundary GitHub](https://github.com/bvaughn/react-error-boundary) -- API documentation for `ErrorBoundary`, `FallbackComponent`, `onError`, `onReset` props
- [react-error-boundary npm](https://www.npmjs.com/package/react-error-boundary) -- version and download stats
- [Sentry React Error Boundary docs](https://docs.sentry.io/platforms/javascript/guides/react/features/error-boundary/) -- confirms child boundaries must report explicitly

### Secondary (MEDIUM confidence)
- Repo-wide grep for `.then(` patterns across `src/` and `app/` directories -- comprehensive audit

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - `react-error-boundary` v6.1.1 confirmed on npm, API well-documented
- Architecture: HIGH - All source files read, exact line numbers identified, patterns verified against existing codebase
- Pitfalls: HIGH - Child boundary / Sentry interaction confirmed via Sentry docs, stale setState is well-known React pattern

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable domain, no fast-moving dependencies)
