---
phase: 03-home-screen
plan: 01
subsystem: home-components
tags: [components, animations, streak, journey-node]
dependency_graph:
  requires: [animations.ts, haptics.ts, WarmGlow, design-tokens]
  provides: [AnimatedStreakBadge, JourneyNode, JourneyNodeProps]
  affects: [home-screen, Plan-02-wiring]
tech_stack:
  added: []
  patterns: [breathing-glow-badge, three-state-node, press-feedback-pattern]
key_files:
  created:
    - src/components/home/AnimatedStreakBadge.tsx
    - src/components/home/JourneyNode.tsx
    - src/__tests__/home-hero.test.ts
    - src/__tests__/home-journey.test.ts
    - src/__tests__/home-streak.test.ts
  modified: []
decisions:
  - "JourneyNode glow ring uses standalone Animated.View (not WarmGlow) per Research Open Question 1"
  - "AnimatedStreakBadge uses WarmGlow with pulseMin 0.04 / pulseMax 0.12 for subtle breathing"
metrics:
  duration_seconds: 151
  completed: "2026-03-28T19:40:35Z"
---

# Phase 03 Plan 01: Home Component Extraction Summary

AnimatedStreakBadge with breathing WarmGlow and milestone pulse, JourneyNode with three distinct visual states (complete/current/locked), press feedback, and entrance stagger.

## What Was Built

### AnimatedStreakBadge (`src/components/home/AnimatedStreakBadge.tsx`)
- Pill-shaped badge with crescent icon, count number, and "Wird" label
- WarmGlow component positioned behind badge for breathing ambient glow (pulseMin 0.04, pulseMax 0.12)
- Entrance fade-in animation with configurable `enterDelay` using `durations.normal` and `easings.contentReveal`
- Milestone pulse: detects count increase via useRef comparison, triggers `springs.bouncy` scale animation 1.0 -> 1.05 -> 1.0
- All colors resolved internally via `useColors()` (no color props)

### JourneyNode (`src/components/home/JourneyNode.tsx`)
- Three visual states per D-06 spec:
  - **Complete**: 40px green circle with checkmark, opacity 0.85, pressable
  - **Current**: 44px bordered circle with dot, subtle glow ring (52px, 3000ms opacity cycle 0.08-0.15), "Up next" label card, pressable
  - **Locked**: 40px circle with Arabic letter preview or lock icon, opacity 0.4, disabled
- Press feedback using `AnimatedPressable` with `springs.press` and `pressScale.subtle` + `hapticTap()`
- Entrance stagger animation: FadeIn + translateY(8 -> 0) with configurable `enterDelay`
- CheckIcon and LockIcon SVGs extracted from LessonGrid.tsx as local helpers

### Test Stubs
- `home-hero.test.ts`: 6 todo stubs for HeroCard (HOME-02)
- `home-journey.test.ts`: 7 todo stubs for JourneyNode (HOME-03)
- `home-streak.test.ts`: 3 todo stubs for AnimatedStreakBadge (HOME-04)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 5ee89fb | Wave 0 test stubs for HOME-02, HOME-03, HOME-04 |
| 2 | 8895837 | AnimatedStreakBadge with breathing WarmGlow |
| 3 | 8d02eed | JourneyNode with three visual states and press feedback |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- TypeScript: No new errors introduced (all pre-existing errors unrelated to new components)
- Vitest: 12 passed, 6 skipped, 411 tests passed + 38 todo (including 16 new todos)
- No direct expo-haptics imports in new components (uses design/haptics.ts)
- All animation values reference design system presets (no magic numbers)
- Both components export named exports (AnimatedStreakBadge, JourneyNode, JourneyNodeProps)

## Known Stubs

None - both components are fully implemented with all specified behavior.

## Self-Check: PASSED

- All 5 created files exist on disk
- All 3 task commits verified in git log (5ee89fb, 8895837, 8d02eed)
