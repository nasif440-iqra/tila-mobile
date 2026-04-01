---
phase: 02-crash-containment
plan: 02
subsystem: error-handling
tags: [error-boundary, crash-containment, sentry, recovery-ui]
dependency_graph:
  requires: [02-01]
  provides: [screen-error-boundaries, screen-recovery-ui]
  affects: [app/lesson/[id].tsx, app/(tabs)/index.tsx]
tech_stack:
  added: [react-error-boundary@^6.1.1]
  patterns: [ErrorBoundary-per-screen, Sentry-onError-explicit-reporting]
key_files:
  created:
    - src/components/feedback/ScreenErrorFallback.tsx
    - src/__tests__/screen-boundary.test.ts
  modified:
    - app/lesson/[id].tsx
    - app/(tabs)/index.tsx
    - package.json
    - package-lock.json
decisions:
  - Used react-error-boundary (not Sentry.ErrorBoundary) for screen-level wrapping to get FallbackProps contract with resetErrorBoundary
  - Explicit Sentry.captureException in each screen boundary onError since child boundaries consume errors before root sees them
  - Created separate ScreenErrorFallback (not extending ErrorFallback) to keep root and screen fallbacks independent
metrics:
  duration: 2m30s
  completed: 2026-04-01
---

# Phase 02 Plan 02: Screen-Level Error Boundaries Summary

Screen-level ErrorBoundary wrappers on lesson and home screens with ScreenErrorFallback recovery UI (Try Again + Go Home) and explicit Sentry error reporting.

## What Was Done

### Task 1: Install react-error-boundary and create ScreenErrorFallback component
- Installed `react-error-boundary` ^6.1.1 as a production dependency
- Created `src/components/feedback/ScreenErrorFallback.tsx` accepting `FallbackProps` from react-error-boundary
- Component renders "Something went wrong" with "Try Again" (calls `resetErrorBoundary`) and "Go Home" (calls `router.replace("/")`) buttons
- Follows project design system: `useColors()`, `typography`, `spacing`, `radii` tokens
- **Commit:** 9dd7e81

### Task 2: Wire ErrorBoundary into lesson and home screens with Sentry reporting + regression tests
- Wrapped lesson screen (`app/lesson/[id].tsx`) main content in `<ErrorBoundary>` with `onError` callback calling `Sentry.captureException` with component stack context
- Wrapped home screen (`app/(tabs)/index.tsx`) main content in `<ErrorBoundary>` with same Sentry reporting pattern
- Root `Sentry.ErrorBoundary` in `app/_layout.tsx` left completely untouched (last-resort catch-all)
- Created 14 regression tests in `src/__tests__/screen-boundary.test.ts` covering: import presence, JSX usage, Sentry reporting, FallbackComponent wiring, ScreenErrorFallback contract, and root boundary preservation
- All 14 tests pass
- **Commit:** 7eb9330

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. **react-error-boundary over Sentry.ErrorBoundary for screen wrappers**: react-error-boundary provides `FallbackProps` with `resetErrorBoundary`, which is cleaner than Sentry's fallback API for screen-level recovery
2. **Explicit Sentry.captureException in onError**: Child ErrorBoundary catches consume errors before the root Sentry.ErrorBoundary sees them, so each screen boundary must explicitly report to Sentry
3. **Separate ScreenErrorFallback component**: Created new component rather than extending ErrorFallback to keep root and screen-level fallbacks independent and avoid coupling

## Verification Results

- `npx vitest run src/__tests__/screen-boundary.test.ts` -- 14/14 tests pass
- `npm test` -- 36 passed, 2 failed (pre-existing failures in outcome.test.js and progress-stats.test.ts, unrelated to this plan)
- `npm run typecheck` -- pre-existing type errors only (SpotTheBreak.tsx, theme.ts), no new errors from this plan
- `app/_layout.tsx` unchanged -- root Sentry.ErrorBoundary intact, no ScreenErrorFallback import

## Known Stubs

None.

## Self-Check: PASSED
