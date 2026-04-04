---
phase: 01-foundation
plan: 02
subsystem: atmosphere
tags: [atmosphere, animation, accessibility, reduce-motion, warmglow, floating-letters]
dependency_graph:
  requires: [arabic-typography-tokens, animation-ambient-tiers]
  provides: [atmosphere-background, warm-glow-relocated, floating-letters-fixed, reduce-motion-support]
  affects: [src/design/atmosphere/, src/components/onboarding/WarmGlow.tsx, src/components/onboarding/FloatingLettersLayer.tsx]
tech_stack:
  added: []
  patterns: [restart-loop-animation, reduce-motion-primitive, preset-based-atmosphere, re-export-shim]
key_files:
  created:
    - src/design/atmosphere/AtmosphereBackground.tsx
    - src/design/atmosphere/WarmGlow.tsx
    - src/design/atmosphere/FloatingLettersLayer.tsx
    - src/design/atmosphere/index.ts
    - src/__tests__/atmosphere-background.test.ts
    - src/__tests__/floating-letters-fix.test.ts
    - src/__tests__/reduce-motion.test.ts
  modified:
    - src/components/onboarding/WarmGlow.tsx
    - src/components/onboarding/FloatingLettersLayer.tsx
decisions:
  - "Restart-loop pattern via runOnJS callback replaces withRepeat(-1) to fix Android 12-minute freeze"
  - "useId() from React 19 for unique SVG gradient IDs to prevent collision when multiple WarmGlow instances render"
  - "Re-export shims at old paths for backward compatibility instead of bulk import updates"
  - "useReducedMotion checked in each animated primitive, not in screens, for consistency"
metrics:
  duration: 266s
  completed: "2026-04-04T20:11:31Z"
  tasks: 2
  files: 9
---

# Phase 01 Plan 02: Ambient Atmosphere System Summary

Relocated WarmGlow and FloatingLettersLayer to src/design/atmosphere/ with restart-loop animation fix, useReducedMotion accessibility, unique SVG IDs, and AtmosphereBackground component with 6 named presets (home, quiz, sacred, celebration, loading, onboarding).

## Task Results

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Relocate WarmGlow and fix FloatingLettersLayer with reduce motion | 3438372 | Done |
| 2 | Create AtmosphereBackground with 6 presets | 872cfae | Done |

## Changes Made

### Task 1: Relocate WarmGlow and fix FloatingLettersLayer

**Problem:** WarmGlow and FloatingLettersLayer lived in src/components/onboarding/ but are used across the entire app. FloatingLettersLayer used withRepeat(-1) which causes a 12-minute Android freeze. Neither component respected Reduce Motion accessibility. WarmGlow used size-based SVG IDs causing collisions when multiple instances render simultaneously.

**Changes:**
- `src/design/atmosphere/WarmGlow.tsx`: Relocated from onboarding. Added useReducedMotion (static fallback when enabled), useId() for unique SVG gradient IDs, breathing tokens from animations.ts for timing values.
- `src/design/atmosphere/FloatingLettersLayer.tsx`: Relocated from onboarding. Replaced withRepeat(-1, true) with restart-loop pattern using runOnJS callback. Added useReducedMotion (static positions when enabled). Updated import paths for new location.
- `src/design/atmosphere/index.ts`: Barrel export for atmosphere module.
- `src/components/onboarding/WarmGlow.tsx`: Re-export shim pointing to new location (14 importers unaffected).
- `src/components/onboarding/FloatingLettersLayer.tsx`: Re-export shim pointing to new location.
- `src/__tests__/floating-letters-fix.test.ts`: 5 source-audit tests confirming no withRepeat(-1), useReducedMotion present, drift import, runOnJS usage.
- `src/__tests__/reduce-motion.test.ts`: 4 source-audit tests confirming both WarmGlow and FloatingLettersLayer import useReducedMotion from react-native-reanimated.

### Task 2: Create AtmosphereBackground with 6 presets

**Problem:** No unified ambient background system existed. Screens used ad-hoc WarmGlow/WarmGradient placement with inconsistent gradient colors and glow positions.

**Changes:**
- `src/design/atmosphere/AtmosphereBackground.tsx`: Preset-based layered atmosphere component. Renders three layers: (1) LinearGradient base from expo-linear-gradient, (2) WarmGlow radial positioned per preset, (3) optional FloatingLettersLayer. Six presets matching UI-SPEC: home (reading room warmth), quiz (focused, no floating letters), sacred (mosque light, slow drift), celebration (warm embrace), loading (quiet patience, no motion), onboarding (welcoming threshold, slow drift). Exports PRESETS config object and AtmospherePreset type.
- Updated barrel export with AtmosphereBackground, PRESETS, AtmospherePreset.
- `src/__tests__/atmosphere-background.test.ts`: 15 tests verifying all 6 preset names exist, floatingLetters values for quiz/loading/sacred/home, required keys in each preset, LinearGradient usage, barrel exports.

## Verification Results

- `npx vitest run src/__tests__/floating-letters-fix.test.ts src/__tests__/reduce-motion.test.ts src/__tests__/atmosphere-background.test.ts` -- 24/24 passed
- `npm test` -- 745 tests passed, 0 failed (71 files, 6 skipped)
- `grep -r "withRepeat(-1" src/design/atmosphere/` -- zero matches (bug eliminated)
- `grep -r "useReducedMotion" src/design/atmosphere/` -- matches in WarmGlow and FloatingLettersLayer
- `npm run typecheck` -- no new errors from this plan's files (all pre-existing)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test false positive from comment containing withRepeat(-1)**
- **Found during:** Task 1 test run
- **Issue:** The comment `// avoids withRepeat(-1) Android freeze bug` in FloatingLettersLayer contained the exact string the test was checking for absence of
- **Fix:** Rephrased comment to `// avoids infinite withRepeat Android freeze bug`
- **Files modified:** src/design/atmosphere/FloatingLettersLayer.tsx
- **Commit:** 3438372

**2. [Rule 1 - Bug] Removed unused withDelay import**
- **Found during:** Task 1
- **Issue:** withDelay was imported from reanimated but no longer used after switching to restart-loop pattern with setTimeout for stagger
- **Fix:** Removed unused import
- **Files modified:** src/design/atmosphere/FloatingLettersLayer.tsx
- **Commit:** 3438372

## Decisions Made

1. **Restart-loop via runOnJS**: Used runOnJS callback from withTiming completion to restart drift animation instead of withRepeat(-1). This avoids the Android counter overflow that causes the 12-minute freeze while maintaining identical visual behavior.
2. **useId() for SVG IDs**: React 19's useId() generates unique IDs per component instance, preventing SVG gradient ID collisions when multiple WarmGlow components render simultaneously (e.g., on celebration screens).
3. **Re-export shims over bulk migration**: Left re-export shims at src/components/onboarding/ paths instead of updating 14+ import statements across the codebase. This is safer for incremental migration and will be cleaned up when screens are refactored in later phases.
4. **useReducedMotion in primitives, not screens**: Each animated primitive (WarmGlow, FloatingLettersLayer) checks useReducedMotion internally. This ensures consistent accessibility without requiring every screen to remember to handle it.

## Self-Check: PASSED

- All 9 created/modified files exist on disk
- Commit 3438372 (Task 1) verified in git log
- Commit 872cfae (Task 2) verified in git log
