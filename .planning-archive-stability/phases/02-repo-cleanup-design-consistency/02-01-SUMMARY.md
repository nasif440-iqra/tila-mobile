---
phase: 02-repo-cleanup-design-consistency
plan: 01
subsystem: infra
tags: [scaffold, cleanup, revenuecat, sentry, design-system]

# Dependency graph
requires: []
provides:
  - "Clean repo with no Expo scaffold leftovers"
  - "RevenueCat init crash guard with Sentry logging"
  - "Not-found screen using real design system"
affects: [02-repo-cleanup-design-consistency]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SDK init guard: try/catch + Sentry.captureException + console.warn for graceful degradation"

key-files:
  created:
    - "src/__tests__/scaffold-cleanup.test.ts"
    - "src/__tests__/revenuecat-guard.test.ts"
  modified:
    - "app/+not-found.tsx"
    - "src/monetization/revenuecat.ts"

key-decisions:
  - "Deleted ExternalLink.tsx alongside plan's 8 scaffold files (only imported by EditScreenInfo.tsx, also deleted)"
  - "Used HTML entity &apos; for apostrophe in JSX to satisfy ESLint react/no-unescaped-entities rule"

patterns-established:
  - "SDK init guard pattern: try/catch + Sentry.captureException + console.warn, silent degradation to free tier"
  - "File-existence tests: Vitest + fs.existsSync for verifying scaffold removal"

requirements-completed: [STAB-03, STAB-04, STAB-05]

# Metrics
duration: 2min
completed: 2026-04-01
---

# Phase 02 Plan 01: Scaffold Cleanup & RevenueCat Guard Summary

**Deleted 9 Expo scaffold files, rewired not-found screen to design system, and wrapped RevenueCat init in try/catch with Sentry logging for silent free-tier degradation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-01T22:59:52Z
- **Completed:** 2026-04-01T23:02:19Z
- **Tasks:** 2
- **Files modified:** 13 (9 deleted, 2 created, 2 modified)

## Accomplishments
- Removed 9 Expo scaffold files and empty components/ + constants/ directories
- Updated app/+not-found.tsx to use design system colors via useColors() hook
- Wrapped RevenueCat Purchases.configure() in try/catch with Sentry exception capture
- Added 2 new test files (13 tests total) verifying scaffold removal and RevenueCat guard

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete scaffold files and update not-found screen** - `b6d8d0b` (chore)
2. **Task 2: Guard RevenueCat initialization with try/catch and Sentry** - `76bc0d2` (fix)

## Files Created/Modified
- `app/+not-found.tsx` - Rewired from scaffold Themed components to design system useColors()
- `src/monetization/revenuecat.ts` - Added Sentry import, wrapped configure() in try/catch
- `src/__tests__/scaffold-cleanup.test.ts` - 9 tests verifying scaffold files deleted and not-found updated
- `src/__tests__/revenuecat-guard.test.ts` - 4 tests verifying try/catch, Sentry, and warning patterns
- Deleted: `components/EditScreenInfo.tsx`, `components/Themed.tsx`, `components/StyledText.tsx`, `components/ExternalLink.tsx`, `components/useClientOnlyValue.ts`, `components/useClientOnlyValue.web.ts`, `components/useColorScheme.ts`, `components/useColorScheme.web.ts`, `constants/Colors.ts`, `assets/fonts/SpaceMono-Regular.ttf`

## Decisions Made
- Deleted `ExternalLink.tsx` in addition to planned 8 files — it was only imported by `EditScreenInfo.tsx` (also deleted), so leaving it would create an orphan scaffold file
- Used `&apos;` HTML entity in JSX text to satisfy ESLint's `react/no-unescaped-entities` rule
- STAB-04 (audio error handling) confirmed pre-satisfied from v1.0 — no work needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Deleted ExternalLink.tsx (not in plan)**
- **Found during:** Task 1 (scaffold deletion)
- **Issue:** ExternalLink.tsx was only imported by EditScreenInfo.tsx. Deleting EditScreenInfo without ExternalLink leaves an orphan scaffold file
- **Fix:** Deleted components/ExternalLink.tsx alongside the planned files
- **Files modified:** components/ExternalLink.tsx (deleted)
- **Verification:** grep confirms no imports of ExternalLink remain
- **Committed in:** b6d8d0b (Task 1 commit)

**2. [Rule 1 - Bug] Fixed ESLint error in not-found screen**
- **Found during:** Task 1 (not-found screen update)
- **Issue:** Unescaped apostrophe in "doesn't" triggered react/no-unescaped-entities lint error
- **Fix:** Replaced `'` with `&apos;` HTML entity
- **Files modified:** app/+not-found.tsx
- **Verification:** npm run validate shows no new errors
- **Committed in:** b6d8d0b (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both fixes necessary for clean repo and passing lint. No scope creep.

## Issues Encountered
None — pre-existing lint errors (13) and typecheck errors (14) confirmed unchanged by scaffold deletion.

## Known Stubs
None — no placeholder data or TODO markers in modified files.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Repo is clean of scaffold leftovers, ready for design consistency work in plan 02
- RevenueCat init is crash-safe, supporting monetization hardening

## Self-Check: PASSED

- All 4 created/modified files exist on disk
- All 3 scaffold files confirmed deleted
- Commits b6d8d0b and 76bc0d2 found in git log
- 614 tests pass (51 test files), including 13 new tests

---
*Phase: 02-repo-cleanup-design-consistency*
*Completed: 2026-04-01*
