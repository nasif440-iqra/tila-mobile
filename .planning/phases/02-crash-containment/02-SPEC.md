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

Add `react-error-boundary` (already approved in project research) on screens with expensive async setup or high crash risk:
- **Lesson screen** (`app/lesson/[id].tsx`) — complex quiz logic, audio, mastery updates
- **Home screen** (`app/(tabs)/index.tsx`) — derived state, routing logic, monetization checks

Do NOT add boundaries to every screen. Simple screens (onboarding, return-welcome, wird-intro) don't need them — the root Sentry boundary is sufficient there.

**Each screen-level boundary should:**
- Catch render errors within that screen
- Show a recovery UI with "Go Home" button (using the existing `ErrorFallback` component or a variant with navigation)
- Report the error to Sentry (already happens via root boundary, but screen-level reporting adds context)

**What "fixed" looks like:**
- A thrown error in the lesson screen shows "Go Home" button instead of white screen
- User can navigate home and continue using the app after a screen-level crash
- Root Sentry boundary remains as the last-resort catch-all

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

**Proposed fix:**
- Add `.catch()` to every `.then()` call that currently lacks one
- Catch handler should: log the error (console.warn), and either set a safe fallback state or silently ignore (depending on criticality)
- For `loadPremiumLessonGrants`: catch sets `grantedLessonIds` to `[]` (empty array — safe default, user just doesn't see grants)
- Do a grep for any other fire-and-forget patterns: `someAsyncFn()` without `await` or `.catch()` in non-async contexts

**What "fixed" looks like:**
- No unhandled promise rejections appear in Sentry from app code
- Each async call either has a `.catch()` or is properly `await`ed inside a try/catch
- Failed premium grant loading falls back gracefully to empty array

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
*For expert review before implementation*
