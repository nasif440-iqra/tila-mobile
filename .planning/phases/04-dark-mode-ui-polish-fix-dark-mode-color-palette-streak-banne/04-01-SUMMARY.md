---
phase: "04-dark-mode-ui-polish"
plan: "01"
subsystem: "design-system"
tags: [dark-mode, color-tokens, atmosphere, onboarding, ui-polish]
dependency_graph:
  requires: []
  provides: [warm-dark-palette, dark-atmosphere-presets, minimal-progress-bar]
  affects: [all-dark-mode-screens, onboarding-flow]
tech_stack:
  added: []
  patterns: [theme-aware-preset-selection]
key_files:
  created: []
  modified:
    - src/design/tokens.ts
    - src/design/atmosphere/AtmosphereBackground.tsx
    - src/components/onboarding/ProgressBar.tsx
decisions:
  - "Used warm charcoal-brown (#1A1613, #211D18) for dark backgrounds instead of cold green"
  - "Preserved gold accent #C4A464 unchanged across both modes"
  - "Made AtmosphereBackground theme-aware by importing useTheme and selecting DARK_PRESETS vs PRESETS"
  - "Applied opacity-based approach for progress bar subtlety (0.4 track, 0.6 fill)"
metrics:
  duration: "2m"
  completed: "2026-04-06"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 3
---

# Phase 04 Plan 01: Dark Mode Warm Palette & Progress Bar Summary

Rewrote dark mode from cold green sci-fi terminal to warm earth tones evoking a dimly lit mosque at night, with charcoal-brown backgrounds, cream text, and preserved gold accents. Added theme-aware DARK_PRESETS to AtmosphereBackground and made onboarding progress bar thin and unobtrusive.

## Completed Tasks

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Rewrite darkColors to warm earth tone palette | 6c39819 | Replaced all cold green tokens with warm charcoal-brown/cream palette, updated darkShadows to warm brown |
| 2 | Update AtmosphereBackground DARK_PRESETS | 60d0f95 | Added DARK_PRESETS with warm brown gradients, made component theme-aware via useTheme |
| 3 | Restyle onboarding ProgressBar | 61b9419 | Reduced height 2.5->1.5, gap 3->2, added track opacity 0.4, fill opacity 0.6 |

## Changes Made

### Task 1: darkColors warm earth tone palette
- Replaced cold green backgrounds (#0F1A14, #142019, #1C2A22) with warm charcoal-brown (#1A1613, #211D18, #2A2420)
- Replaced mint green primaries (#A8D5BA, #7ABF95) with warm cream (#E8DCC8, #C4B89C)
- Updated text colors from cool grays to warm cream tones (#EDE8E0, #A89E94, #8A8078)
- Updated border from green-gray (#2A3028) to warm brown (#332C26)
- Gold accent #C4A464 preserved unchanged per D-02
- darkShadows shadowColor changed from pure black (#000000) to warm dark brown (#0D0A08)
- lightColors completely untouched

### Task 2: DARK_PRESETS with warm brown gradients
- Added new `DARK_PRESETS` object with 6 preset configs matching the light PRESETS structure
- All dark presets use warm brown gradient colors (#1A1613, #211D18) instead of old cold green
- Gold glow color (rgba(196, 164, 100, 0.2)) preserved across all dark presets
- Made AtmosphereBackground component theme-aware: imports `useTheme`, selects preset set based on `mode`
- Light PRESETS completely unchanged

### Task 3: Minimal progress bar
- Reduced track height from 2.5 to 1.5 for thinner appearance
- Reduced gap between segments from 3 to 2
- Added opacity 0.4 to track background for subtlety
- Added opacity 0.6 to fill for softer visibility
- Reduced border radius to match thinner profile
- Same props interface and segmented behavior preserved

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] AtmosphereBackground had no DARK_PRESETS or theme awareness**
- **Found during:** Task 2
- **Issue:** The plan said to "update" DARK_PRESETS but the component only had light PRESETS with no dark mode logic
- **Fix:** Created DARK_PRESETS from scratch and added theme-aware preset selection via useTheme import
- **Files modified:** src/design/atmosphere/AtmosphereBackground.tsx
- **Commit:** 60d0f95

## Decisions Made

1. Used `useTheme()` hook (already exported from theme.ts) for dark mode detection in AtmosphereBackground rather than passing mode as a prop
2. Applied opacity via inline styles on track and fill rather than creating rgba color strings, keeping the approach simple and readable

## Self-Check: PASSED

All 3 files verified on disk. All 3 commits verified in git log. Content checks passed for warm palette values, DARK_PRESETS presence, and thin progress bar dimensions.
