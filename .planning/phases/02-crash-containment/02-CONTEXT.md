# Phase 2: Crash Containment - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning (pending expert review of spec)

<domain>
## Phase Boundary

Add defensive wrappers for unknown runtime failures: audio try/catch, selective screen-level error boundaries, and unhandled promise rejection cleanup. No new features.

</domain>

<decisions>
## Implementation Decisions

### Fix 1: Audio playback guards
- **D-01:** Wrap `player.replace()` + `player.play()` in try/catch in both `playVoice()` and `playSFX()`
- **D-02:** Catch handler: `console.warn` only — audio failures are silent to user (non-fatal)
- **D-03:** No user-facing error UI for audio — silent failure is correct behavior

### Fix 2: Screen-level error boundaries
- **D-04:** Install `react-error-boundary` (^6.1.1) — approved in project research
- **D-05:** Add boundaries to lesson screen and home screen only (selective, not blanket)
- **D-06:** Recovery UI shows "Go Home" button — user can navigate away from broken screen
- **D-07:** Root Sentry.ErrorBoundary stays as last-resort catch-all — do not remove it
- **D-08:** Reuse existing ErrorFallback component (or variant with navigation prop)

### Fix 3: Unhandled promise audit
- **D-09:** Add `.catch()` to all identified `.then()` calls without catch handlers
- **D-10:** `loadPremiumLessonGrants` catch → set `grantedLessonIds` to `[]` (safe default)
- **D-11:** Grep for any other fire-and-forget patterns and fix them
- **D-12:** Catch handlers should console.warn, not throw

### Claude's Discretion
- Exact ErrorBoundary component wiring (whether to use `useErrorBoundary` hook or `ErrorBoundary` component wrapper)
- Whether to create a separate `ScreenErrorFallback` or adapt existing `ErrorFallback` with a navigation prop
- Test file organization for regression tests

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Spec
- `.planning/phases/02-crash-containment/02-SPEC.md` — Technical spec with exact code locations and proposed fixes

### Source files (fix locations)
- `src/audio/player.ts` — Fix 1: playVoice and playSFX without try/catch
- `app/_layout.tsx` — Fix 2: root Sentry.ErrorBoundary (keep, don't replace)
- `app/lesson/[id].tsx` — Fix 2: needs screen-level boundary
- `app/(tabs)/index.tsx` — Fix 2: needs screen-level boundary + Fix 3: unhandled .then()
- `app/lesson/review.tsx` — Fix 3: unhandled .then()
- `src/monetization/provider.tsx` — Fix 3: verify .catch() coverage

### Phase 1 context (carry forward)
- `.planning/phases/01-correctness-blockers/01-CONTEXT.md` — ErrorFallback already exists and is used in DB init recovery
- `src/components/feedback/ErrorFallback.tsx` — Existing error UI component

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ErrorFallback` component — already exists with `onRetry` prop, used by DatabaseProvider
- `Sentry.ErrorBoundary` — root-level, stays in place
- `useColors()` hook — available inside error boundaries (ThemeContext wraps everything)

### Established Patterns
- Audio: singleton players (`_voicePlayer`, `_sfxPlayer`) with `replace()` + `play()` pattern
- Error UI: `ErrorFallback` with retry button, warm cream background
- Provider nesting: ThemeContext → Sentry → DB → Subscription → Analytics → Stack

### Integration Points
- `app/_layout.tsx` line 72 — root error boundary
- `app/lesson/[id].tsx` — lesson screen where boundary wraps content
- `app/(tabs)/index.tsx` — home screen where boundary wraps content

</code_context>

<specifics>
## Specific Ideas

No specific visual or behavioral preferences. Expert review of 02-SPEC.md pending.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-crash-containment*
*Context gathered: 2026-04-01*
