---
phase: 01-foundation
plan: 01
subsystem: design-system
tags: [typography, animation, arabic, tokens]
dependency_graph:
  requires: []
  provides: [arabic-typography-tokens, animation-ambient-tiers, quizHero-size]
  affects: [src/design/tokens.ts, src/design/animations.ts, src/design/components/ArabicText.tsx]
tech_stack:
  added: []
  patterns: [TDD-red-green, design-token-extension]
key_files:
  created:
    - src/__tests__/arabic-typography.test.ts
  modified:
    - src/design/tokens.ts
    - src/design/animations.ts
    - src/design/components/ArabicText.tsx
    - src/__tests__/animations.test.ts
decisions:
  - "lineHeight ratios 2.20x for display/quizHero, 2.00x for large/body per UI-SPEC D-05/D-07"
  - "overflow:'visible' as const applied to ArabicText style for diacritic rendering"
metrics:
  duration: 173s
  completed: "2026-04-04T20:03:45Z"
  tasks: 2
  files: 5
---

# Phase 01 Plan 01: Arabic Typography & Animation Tokens Summary

Fixed Arabic diacritics clipping (lineHeight 1.39-1.50x to 2.00-2.20x) with new quizHero tier (52px/114px) and ambient animation tokens (breathing 4.5s, drift 18-24s, settle 600ms).

## Task Results

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Fix Arabic typography tokens and add quizHero tier | f7ae798 | Done |
| 2 | Add breathing, drift, and settle animation tiers | e7dea27 | Done |

## Changes Made

### Task 1: Arabic Typography Tokens + quizHero

**Problem:** Arabic text with diacritics (harakat) was being clipped because lineHeight ratios were 1.39-1.50x fontSize, well below the 2.0x minimum needed for proper Amiri font rendering with full diacritics.

**Changes:**
- `src/design/tokens.ts`: Updated arabicDisplay lineHeight 100 -> 158 (2.20x), arabicLarge 54 -> 72 (2.00x), arabicBody 36 -> 48 (2.00x). Added arabicQuizHero tier (fontSize 52, lineHeight 114, 2.20x).
- `src/design/components/ArabicText.tsx`: Extended ArabicSize union with `quizHero`, added to SIZE_MAP, added `overflow: 'visible' as const` to prevent container clipping.
- `src/__tests__/arabic-typography.test.ts`: 7 tests verifying exact fontSize/lineHeight values, 2.0x minimum ratio across all Arabic tiers, and ArabicText component source contains quizHero and overflow:visible.

### Task 2: Ambient Animation Tiers

**Problem:** No animation tokens existed for ambient/atmospheric effects (breathing patterns, slow drifts, content settling) needed by the emotional design system.

**Changes:**
- `src/design/animations.ts`: Added `breathing` (2s inhale, 500ms hold, 2s exhale, 4500ms cycle with opacity 0.08-0.25 and scale 1.0-1.06), `drift` (slow 24s, normal 18s with X/Y displacement ranges), `settle` (600ms duration). All existing exports unchanged.
- `src/__tests__/animations.test.ts`: Extended with 11 new tests for breathing (6), drift (4), settle (1). All 11 existing tests untouched and still passing.

## Verification Results

- `npx vitest run src/__tests__/arabic-typography.test.ts` -- 7/7 passed
- `npx vitest run src/__tests__/animations.test.ts` -- 22/22 passed (11 existing + 11 new)
- `npm run validate` -- all pre-existing errors only; no new errors from this plan's changes

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

1. **lineHeight ratios per UI-SPEC**: 2.20x for display/quizHero (larger sizes need more breathing room), 2.00x for large/body. These are the exact values from D-05 and D-07.
2. **overflow:'visible' as const**: Applied to the inline style object in ArabicText rather than via StyleSheet for co-location with other text styles.

## Self-Check: PASSED

- All 5 created/modified files exist on disk
- Commit f7ae798 (Task 1) verified in git log
- Commit e7dea27 (Task 2) verified in git log
