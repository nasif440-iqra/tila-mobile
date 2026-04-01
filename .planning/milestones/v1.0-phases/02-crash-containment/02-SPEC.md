# Phase 2: Crash Containment — Technical Spec

**Purpose:** Add defensive wrappers so unknown runtime failures are caught per-screen instead of taking down the entire app. Three targets: audio playback, screen-level error boundaries, and unhandled promise rejections.

**Context:** Phase 1 fixed 5 known bugs. Phase 2 adds a safety net for *unknown* failures — things we haven't found yet that could surface during App Store review or in production.

---

## Fix 1: Audio playback try/catch wrappers

**File:** `src/audio/player.ts` (lines 159-163, 194-207)

**What happens now:** Both `playVoice()` and `playSFX()` call `player.replace(source)` and `player.play()` without any error handling. If expo-audio throws (corrupted asset, interrupted audio session, device audio unavailable), the error propagates as an unhandled rejection (playVoice is async) or an uncaught exception (playSFX is sync).

**Current code — playVoice (async, no catch):**
```typescript
async function playVoice(source: AudioSource): Promise<void> {
  if (_muted) return;
  const player = getVoicePlayer();
  player.replace(source);   // ← Can throw
  player.play();            // ← Can throw, not awaited
}
```

**Current code — playSFX (sync, no catch):**
```typescript
function playSFX(source: AudioSource, priority: number, guardMs: number): void {
  if (_muted) return;
  // ... priority guard ...
  const player = getSFXPlayer();
  player.replace(source);   // ← Can throw
  player.play();            // ← Can throw
  _playing = { priority, startedAt: now, guardMs };
}
```

**Why it matters:** Audio failures should be silent to the user — a missing sound effect is not worth crashing the app or showing an error. But right now, a single bad audio call can crash the entire app or fire an unhandled promise rejection in Sentry.

**Proposed fix:**
- Wrap the `replace()` + `play()` calls in `playVoice` and `playSFX` with try/catch
- On catch: `console.warn` the error (for debugging) but do NOT propagate — audio failures are non-fatal
- Do NOT add user-facing error UI for audio — silent failure is correct behavior here
- **Important for `playSFX`:** The `_playing = { priority, startedAt: now, guardMs }` assignment must stay INSIDE the try block, after the successful `play()` call. If `replace()` or `play()` throws, `_playing` should NOT be updated — otherwise a failed sound is marked as "playing" and blocks subsequent legitimate SFX requests for the guard window duration

**What "fixed" looks like:**
- Audio playback failure (missing file, interrupted session) does not crash the app
- No error shown to the user when audio fails
- Error logged to console for developer debugging

---

## Fix 2: Selective screen-level error boundaries

**File:** `app/_layout.tsx` (lines 72-104), `app/lesson/[id].tsx`, `app/(tabs)/index.tsx`

**What happens now:** There is one `Sentry.ErrorBoundary` at the root level (wrapping the entire app in `_layout.tsx`). If any screen throws a render error, Sentry catches it and shows the `ErrorFallback` component. But this replaces the ENTIRE app with the error screen — the user can't navigate to other screens, can't go home, can't do anything except retry (which re-renders the broken component).

**Current structure:**
```
ThemeContext.Provider
  └── Sentry.ErrorBoundary (root — catches everything)
        └── DatabaseProvider
              └── SubscriptionProvider
                    └── AnalyticsGate
                          └── Stack (all screens)
```

**Why it matters:** A crash in the lesson screen shouldn't prevent the user from going home. Per-screen boundaries contain the blast radius — one broken screen shows recovery UI ("Go Home"), while the rest of the app remains functional.

**Proposed fix — selective, not blanket:**

**Step 1: Install `react-error-boundary`.**
This package is NOT currently in the repo. It needs to be added:
```bash
npm install react-error-boundary
```
This is a real dependency change — not something already sitting in node_modules.

**Step 2: Add screen-level boundaries to two screens:**
- **Lesson screen** (`app/lesson/[id].tsx`) — complex quiz logic, audio, mastery updates
- **Home screen** (`app/(tabs)/index.tsx`) — derived state, routing logic, monetization checks

Do NOT add boundaries to every screen. Simple screens (onboarding, return-welcome, wird-intro) don't need them — the root Sentry boundary is sufficient there.

**Step 3: Wire Sentry reporting explicitly in each screen-level boundary.**
Once a child `ErrorBoundary` catches an error, the root `Sentry.ErrorBoundary` does NOT see it — the error is consumed by the child. So each screen-level boundary MUST explicitly report to Sentry via its `onError` callback:
```typescript
<ErrorBoundary
  onError={(error, info) => {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }}
  FallbackComponent={ScreenErrorFallback}
>
```
Do not assume the root boundary will keep covering child-boundary crashes. It won't.

**Step 4: Create a screen-scoped fallback component (or extend ErrorFallback).**
The existing `ErrorFallback` component only supports `onRetry` — it renders a "Try Again" button that re-renders the broken component. For screen-level boundaries, the fallback needs to support "Go Home" navigation, which `ErrorFallback` does not currently do.

Options:
- Create a new `ScreenErrorFallback` component that renders both "Try Again" and "Go Home" buttons
- Or extend `ErrorFallback` to accept an optional `onGoHome` prop alongside `onRetry`

Either way, the "Go Home" action should call `router.replace('/')` to navigate the user back to the home tab.

**Each screen-level boundary should:**
- Catch render errors within that screen
- Explicitly report caught error to Sentry via `onError` (the root boundary will NOT do this)
- Show a recovery UI with both "Try Again" and "Go Home" buttons
- "Go Home" navigates via `router.replace('/')` so the user can continue using the app

**What "fixed" looks like:**
- A thrown error in the lesson screen shows "Try Again" + "Go Home" buttons instead of white screen
- The error is reported to Sentry with component stack context
- User can navigate home and continue using the app after a screen-level crash
- Root Sentry boundary remains as the last-resort catch-all for screens without their own boundary

---

## Fix 3: Unhandled promise rejection audit

**Files:** Multiple — `src/monetization/provider.tsx`, `app/(tabs)/index.tsx`, `app/lesson/review.tsx`

**What happens now:** Several `.then()` calls have no `.catch()` handler. If the promise rejects, the rejection is unhandled — it shows up in Sentry as an unhandled promise rejection and may crash the app on some React Native versions.

**Identified unhandled .then() calls:**

| File | Line | Code | Risk |
|------|------|------|------|
| `src/monetization/provider.tsx` | 99 | `Purchases.getCustomerInfo().then(...)` | Has a `.catch()` — OK, but verify it covers all paths |
| `app/(tabs)/index.tsx` | 305 | `loadPremiumLessonGrants(db).then(setGrantedLessonIds)` | No `.catch()` — if DB query fails, unhandled rejection |
| `app/lesson/review.tsx` | 47 | `loadPremiumLessonGrants(db).then(setGrantedLessonIds)` | Same pattern, no `.catch()` |

**Note:** The `src/db/provider.tsx` `.then()` was already fixed in Phase 1 (Bug 1 — has `.catch()` now).

**Why it matters:** Unhandled promise rejections in production React Native apps can cause silent crashes, Sentry noise, and erratic behavior. Apple reviewers may trigger these by testing on slow/restricted devices.

**Proposed fix — guarded async loaders, not just .catch():**

Simply adding `.catch()` handles the rejection, but the two `loadPremiumLessonGrants` effects also have a stale async update pattern: `.then(setGrantedLessonIds)` can fire after the component unmounts or navigates away, causing a React state update on an unmounted component.

**For `app/(tabs)/index.tsx` and `app/lesson/review.tsx`:**
Convert the bare `.then()` to a guarded async loader inside useEffect:

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

This handles three problems in one:
1. Rejected promise → caught, falls back to `[]`
2. Unmount during async → cancelled flag prevents stale setState
3. Navigation away → cleanup runs, no state leak

**For `src/monetization/provider.tsx`:** Already has `.catch()`. Verify the catch covers all paths (it does — sets `loading: false` on catch). No change needed.

**Mandatory repo-wide audit (hard requirement, not optional):** After fixing the two known `loadPremiumLessonGrants` effects, grep the entire `src/` and `app/` directories for every `.then(` and every fire-and-forget async call in non-async contexts. Do not stop after the two known cases — this codebase has grown and there may be others. Fix any found using the same guarded async pattern. Phase 2 is not complete until this audit is done and results are documented in the SUMMARY.

**What "fixed" looks like:**
- No unhandled promise rejections appear in Sentry from app code
- Grant-loading effects use guarded async loaders with cancellation flags
- Failed premium grant loading falls back gracefully to empty array
- No stale state updates on unmounted components

---

## Regression Tests

Each fix needs at least one regression test proving the bad path is prevented.

| Fix | Test description |
|-----|-----------------|
| Fix 1 | Audio: Mock `player.play()` to throw → verify `playVoice`/`playSFX` do not propagate the error. Source analysis: verify try/catch wraps both functions. |
| Fix 2 | Boundary: (a) Source analysis: verify `app/lesson/[id].tsx` contains an `ErrorBoundary` wrapper with `onError` calling `Sentry.captureException`. (b) **Behavioral test (required):** render a component that throws inside the boundary, verify the local `ScreenErrorFallback` renders (not the root fallback or white screen). This is more meaningful than just proving the wrapper exists — source greps can pass while the actual UX is broken. |
| Fix 3 | Grants: Verify `loadPremiumLessonGrants` effects use guarded async pattern (cancelled flag + try/catch). Source analysis: no bare `.then(setGrantedLessonIds)` without catch in home or review screens. |

---

## Summary

| # | Fix | Severity | Files | Risk if unfixed |
|---|-----|----------|-------|-----------------|
| 1 | Audio try/catch wrappers | MEDIUM | src/audio/player.ts | Audio failure crashes app |
| 2 | Screen-level error boundaries | HIGH | app/lesson/[id].tsx, app/(tabs)/index.tsx | Screen crash = entire app crash |
| 3 | Unhandled promise audit | MEDIUM | Multiple | Sentry noise + silent crashes |

**Dependencies:** All three are independent. No ordering required.

**New dependency:** `react-error-boundary` (^6.1.1) — already approved in project research, needs `npm install`.

---

*Spec created: 2026-04-01*
*Revised: 2026-04-01 after expert review — fixed Sentry coverage assumption (child boundaries must report explicitly), clarified react-error-boundary is not installed yet, expanded Fix 3 to guarded async loaders with cancellation, added fallback component design requirement, added regression test expectations*
