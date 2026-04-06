---
quick_id: 260406-iq4
description: Fix 5 device testing issues from phase 03 Sacred Moments
completed: 2026-04-06
commit: 95e3c16
---

# Quick Task 260406-iq4: Device Testing Fixes

## What Changed

1. **AtmosphereBackground dark mode** — Added `DARK_PRESETS` with dark gradient colors (#0F1A14, #142019). Component now selects presets based on `useTheme()` mode. Fixes light backgrounds appearing in dark mode.

2. **Tilawat spelling** — Changed all occurrences of "Tilawah" to "Tilawat" (comment, word data, accessibility label, display text).

3. **Hadith English-only** — Removed PhraseReveal Arabic word reveal. Screen now shows English quote directly with staggered fade-in. WarmGlow, ArchOutline, source attribution all preserved.

4. **Bismillah timing + layout** — Changed from `layout="vertical"` to `layout="horizontal"`. Increased `wordDuration` from 700ms to 1200ms and `staggerDelay` from 350ms to 800ms for slower, more dramatic reveal.

5. **Font readability** — Addressed by fix #1 (dark mode atmosphere) which ensures backgrounds match the app's dark color scheme, restoring proper contrast for themed text colors.

## Files Modified

- `src/design/atmosphere/AtmosphereBackground.tsx` — DARK_PRESETS + theme-aware selection
- `src/components/onboarding/steps/Tilawat.tsx` — Spelling fix
- `src/components/onboarding/steps/Hadith.tsx` — Removed PhraseReveal, direct English quote
- `src/components/onboarding/steps/BismillahMoment.tsx` — Horizontal layout, slower timing
- `src/__tests__/bismillah.test.ts` — Updated to expect horizontal layout
