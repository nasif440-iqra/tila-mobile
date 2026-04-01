---
phase: 02-onboarding-wow-factor
plan: 01
subsystem: onboarding-visual-foundation
tags: [animation, reanimated, svg, design-system, onboarding]
dependency_graph:
  requires: [02-00]
  provides: [WarmGlow-animated, FloatingLettersLayer-tint, BrandedLogo, sacred-timing-constants]
  affects: [02-02, 02-03]
tech_stack:
  added: []
  patterns: [AnimatedComponent-for-SVG, useAnimatedProps, StaticAnimated-component-split]
key_files:
  created:
    - src/components/onboarding/BrandedLogo.tsx
  modified:
    - src/components/onboarding/WarmGlow.tsx
    - src/components/onboarding/FloatingLettersLayer.tsx
    - src/components/onboarding/animations.ts
decisions:
  - "WarmGlow uses two internal components (StaticWarmGlow/AnimatedWarmGlow) to avoid hooks-order violation"
  - "BrandedLogo uses 5 shared values with useAnimatedProps for SVG attribute animation"
  - "FloatingLettersLayer animation budget of 12 letters accepted with justification (lightweight opacity tweens)"
metrics:
  duration: ~3min
  completed: 2026-03-28
---

# Phase 02 Plan 01: Visual Foundation Components Summary

Animated warm glow with pulsing, floating letters with gold tint variant, branded SVG logo with 5-value Reanimated animations, and sacred moment timing constants for downstream onboarding steps.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Enhance WarmGlow + FloatingLettersLayer + animation constants | a415b79 | WarmGlow.tsx, FloatingLettersLayer.tsx, animations.ts |
| 2 | Create BrandedLogo component from SVG asset | 652d000 | BrandedLogo.tsx |

## What Was Built

### WarmGlow (Enhanced)
- Added `animated` prop (default false) for backward compatibility
- Added `color`, `pulseMin`, `pulseMax` props for customization
- Split into two internal components: `StaticWarmGlow` (plain View) and `AnimatedWarmGlow` (Reanimated) to avoid Rules of Hooks violation
- Animated variant pulses opacity between configurable min/max using `withRepeat` + `withSequence`

### FloatingLettersLayer (Enhanced)
- Added `tint` prop: `'primary' | 'accent'` for gold variant
- `useColors()` called unconditionally at component top (hooks compliance)
- Animation budget comment added per review justification

### BrandedLogo (New)
- Renders crescent moon, 5 stars, 2 arches, keystone circle, base dots, base line from tila-transparent-mark.svg
- Uses `Svg` with `viewBox="0 0 400 480"`, scales via width/height props
- 5 animated shared values: glowOpacity, starOpacity1, starOpacity2, archOpacity, keystoneScale
- Uses `Animated.createAnimatedComponent(Circle/Path)` + `useAnimatedProps` for SVG attribute animation
- All colors from `useColors()` design tokens (no hardcoded hex)
- No text elements (rendered separately in Welcome.tsx)

### Animation Constants (New)
- `BISMILLAH_DISPLAY_DURATION = 2500` -- auto-advance timer for Bismillah step
- `STILLNESS_BEAT_DURATION = 1200` -- deliberate pause before Alif appears
- `LETTER_REVEAL_HAPTIC_DELAY = 1900` -- computed from SPLASH_STAGGER_DURATION + STILLNESS_BEAT_DURATION

## Decisions Made

1. **StaticWarmGlow/AnimatedWarmGlow split**: Instead of conditional hooks or early returns, the public WarmGlow function delegates to two hook-free/hook-consistent internal components. This cleanly avoids Rules of Hooks violations.

2. **5 shared values for BrandedLogo**: Stars grouped into 2 animation groups (3+2) sharing opacity values. Glow circles share one value. Well under the 8-value budget from UI-SPEC.

3. **12-letter animation budget accepted**: FloatingLettersLayer's 12 letters use simple opacity tweens on UI thread with minimal overhead. Total ~23 animated values on Welcome screen is acceptable for lightweight animations. Comment added for future profiling reference.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- All 388 tests pass (Vitest)
- ESLint: 0 errors on changed files (only expected exhaustive-deps warnings matching existing codebase pattern)
- TypeScript: 0 errors on changed files (pre-existing errors in unrelated files)
- BrandedLogo: exactly 5 useSharedValue calls, 0 hardcoded hex colors
- All existing animation constant exports preserved

## Known Stubs

None -- all components are fully implemented with real data and animations.

## Self-Check: PASSED

- [x] src/components/onboarding/WarmGlow.tsx exists
- [x] src/components/onboarding/FloatingLettersLayer.tsx exists
- [x] src/components/onboarding/BrandedLogo.tsx exists
- [x] src/components/onboarding/animations.ts exists
- [x] Commit a415b79 exists
- [x] Commit 652d000 exists
