---
phase: 08-cloud-sync-social
plan: "06"
subsystem: design-system, return-welcome
tags: [dark-mode, theme, adaptive-ux, return-engagement]
dependency_graph:
  requires: [08-03]
  provides: [dark-mode-activation, adaptive-return-welcome, theme-preference-persistence]
  affects: [app/_layout.tsx, src/design/tokens.ts, app/return-welcome.tsx]
tech_stack:
  added: []
  patterns: [ThemeWrapper-pattern, absence-tier-content]
key_files:
  created:
    - src/hooks/useThemePreference.ts
  modified:
    - src/design/tokens.ts
    - app/_layout.tsx
    - app/return-welcome.tsx
    - src/analytics/events.ts
decisions:
  - ThemeWrapper pattern inside DatabaseProvider solves chicken-and-egg between theme and DB
  - AppNavigator extracted for dynamic contentStyle background from theme context
  - Three absence tiers at <=1, 2-7, 8+ days with distinct hadiths and messaging
  - Dark shadows use black shadowColor instead of green for proper dark mode rendering
metrics:
  duration_seconds: 327
  completed: "2026-04-02T20:15:33Z"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 5
---

# Phase 08 Plan 06: Dark Mode & Adaptive Return Welcome Summary

Dark mode activated from existing tokens with SQLite-persisted theme preference; return welcome screen shows three tiers of absence-aware messaging with unique hadiths.

## What Was Done

### Task 1: Theme preference hook and dark mode activation
- Created `src/hooks/useThemePreference.ts` that reads/writes `theme_mode` from `user_profile` table
- Added `darkShadows` tokens and `getShadows()` helper to `src/design/tokens.ts` for theme-aware shadows
- Restructured `app/_layout.tsx`: moved `ThemeContext.Provider` inside `DatabaseProvider` via `ThemeWrapper` component
- Extracted `AppNavigator` component to consume theme-aware `contentStyle` background color
- Removed hardcoded `useState<ThemeMode>("light")` -- now defaults to `"system"` preference
- System preference detection works via `useColorScheme()` + `resolveColors()`

### Task 2: Adaptive return welcome screen
- Replaced single hardcoded hadith with three-tier content based on absence duration
- Short (<=1 day): "Welcome back" + consistency hadith + "Continue" button
- Medium (2-7 days): "We missed you" + knowledge-seeking hadith + streak-aware encouragement
- Long (8+ days): "It's never too late" + tree-planting proverb + compassionate re-engagement
- Added `absence_tier` to `ReturnWelcomeShownProps` analytics event type
- Used unicode typographic quotes and dashes for polished text rendering

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 8985e9e | feat(08-06): activate dark mode with theme preference hook and dynamic shadows |
| 2 | bb3e556 | feat(08-06): add adaptive return welcome screen with absence-based tiers |

## Decisions Made

1. **ThemeWrapper inside DatabaseProvider**: Theme preference requires DB access, but ThemeContext was previously wrapping DatabaseProvider. Solved by moving ThemeContext.Provider inside DatabaseProvider via a ThemeWrapper component. Falls back to system scheme during the brief pre-DB loading period.

2. **AppNavigator extraction**: Stack's `contentStyle` needs theme colors, but the Stack was in RootLayout which no longer has direct access to resolved colors. Extracted AppNavigator as a child of ThemeWrapper to consume `useColors()`.

3. **Three absence tiers (not two)**: Plan mentioned "1 day / 3-7 days / 14+ days" but implemented as <=1 / 2-7 / 8+ for smoother coverage of all absence durations without gaps.

4. **Dark shadow color**: Used `#000000` instead of `#163323` (dark green) for dark mode shadows per pitfall guidance -- green shadows on dark backgrounds are invisible.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ColorSchemeName type mismatch**
- **Found during:** Task 1
- **Issue:** React Native's `useColorScheme()` returns `ColorSchemeName` which TypeScript doesn't assignable to `resolveColors`'s parameter type
- **Fix:** Cast `systemScheme` to `"light" | "dark" | null | undefined` in ThemeWrapper
- **Files modified:** app/_layout.tsx
- **Commit:** 8985e9e

**2. [Rule 3 - Blocking] ShadowTokens literal type mismatch**
- **Found during:** Task 1
- **Issue:** `typeof shadows` produces literal string types (e.g., `"#163323"`), making `darkShadows` (with `"#000000"`) incompatible
- **Fix:** Defined `ShadowStyle` interface and `ShadowTokens` as an explicit interface instead of `typeof shadows`
- **Files modified:** src/design/tokens.ts
- **Commit:** 8985e9e

**3. [Rule 2 - Missing functionality] absence_tier analytics property**
- **Found during:** Task 2
- **Issue:** `ReturnWelcomeShownProps` type didn't include `absence_tier` field
- **Fix:** Added `absence_tier: "short" | "medium" | "long"` to the analytics event interface
- **Files modified:** src/analytics/events.ts
- **Commit:** bb3e556

## Verification

- `npm run typecheck`: passes (0 new errors; pre-existing errors from other agents' unresolved imports unchanged)
- `npm test`: 61 test files passed, 667 tests passed
- Dark mode uses existing `darkColors` tokens from tokens.ts
- System preference detection resolves via `resolveColors("system", systemScheme)`
- Return welcome has three distinct content tiers

## Known Stubs

None -- all data sources are wired and functional.

## Self-Check: PASSED

All 5 files verified present. Both commits (8985e9e, bb3e556) verified in git log.
