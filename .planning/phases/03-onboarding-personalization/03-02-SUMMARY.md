---
phase: 03-onboarding-personalization
plan: 02
subsystem: ui
tags: [react-native, phrase-reveal, sacred-moments, onboarding, reanimated]

# Dependency graph
requires:
  - phase: 03-01
    provides: "PhraseReveal component with PhraseWord API"
provides:
  - "BismillahMoment rewritten as micro-lesson with PhraseReveal vertical layout"
  - "Tilawat using PhraseReveal instead of ShimmerWord"
  - "Hadith with Arabic PhraseReveal horizontal layout and post-reveal English translation"
affects: [onboarding]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PhraseWord data arrays defined as module-level constants for sacred text"
    - "Post-reveal state pattern: onComplete callback sets revealComplete, gating UI elements"

key-files:
  created: []
  modified:
    - src/design/components/PhraseReveal.tsx
    - src/design/components/index.ts
    - src/components/onboarding/steps/BismillahMoment.tsx
    - src/components/onboarding/steps/Tilawat.tsx
    - src/components/onboarding/steps/Hadith.tsx
    - src/__tests__/phrase-reveal.test.ts
    - src/__tests__/phrase-reveal-barrel.test.ts
    - src/__tests__/sacred-moments-animations.test.ts
    - src/__tests__/finish-settle.test.ts
    - src/__tests__/onboarding-flow-structure.test.ts
    - src/__tests__/onboarding-atmosphere.test.ts
    - src/__tests__/bismillah.test.ts

key-decisions:
  - "PhraseReveal rebuilt with PhraseWord interface (arabic, transliteration, meaning) replacing generic phrases:string[] API"
  - "BismillahMoment auto-advance timer replaced with Continue CTA that appears after reveal completes"
  - "Hadith English translation gated behind Arabic PhraseReveal completion for reading-first experience"

patterns-established:
  - "Sacred text components use PhraseWord[] constants with PhraseReveal for consistent word-by-word reveal"
  - "Post-reveal CTA pattern: useState(false) + onComplete callback + conditional rendering"

requirements-completed: []

# Metrics
duration: 8min
completed: 2026-04-06
---

# Phase 03 Plan 02: Sacred Moments PhraseReveal Integration Summary

**Rebuilt PhraseReveal with PhraseWord API (arabic/transliteration/meaning), then rewrote BismillahMoment, Tilawat, and Hadith to use word-by-word reveal with tap-to-skip and reduced motion support**

## Performance

- **Duration:** 8 min
- **Tasks:** 5 (2 fix + 3 feat)
- **Files modified:** 12
- **Tests:** 829 passing across 81 files

## Accomplishments

### Job 1: PhraseReveal Rebuild
- Replaced generic `phrases: string[]` API with `PhraseWord` interface (`arabic`, `transliteration`, optional `meaning`)
- Added `onComplete` callback with timer cleanup on unmount and skip
- Added `Pressable` tap-to-skip with accessibility hint
- Added `useReducedMotion` from Reanimated for immediate reveal when reduced motion enabled
- Horizontal layout uses `flexDirection: 'row-reverse'`, `writingDirection: 'rtl'` for Arabic text flow
- Added `minHeight` reservation and `flexShrink: 0` on word units
- Exported `PhraseWord` and `PhraseRevealProps` types from barrel

### Job 2: Screen Rewrites
- **BismillahMoment:** 4 BISMILLAH_WORDS with meanings, vertical layout, Continue CTA after reveal (no auto-advance timer)
- **Tilawat:** Single TILAWAH_WORDS entry replacing ShimmerWord animated opacity loop
- **Hadith:** 5 HADITH_WORDS in horizontal RTL layout, English translation appears only after Arabic reveal completes

### Test Rewrites
- All 6 Wave 0 test scaffolds rewritten to verify correct PhraseWord API
- Bismillah test updated to verify PhraseReveal integration and no auto-advance

## Task Commits

1. **fix(03-01): rebuild PhraseReveal** - `9251d20`
2. **fix(03-01): rewrite Wave 0 test scaffolds** - `a6386af`
3. **feat(03-02): rewrite BismillahMoment** - `1bff83a`
4. **feat(03-02): replace Tilawat ShimmerWord** - `b1c57a7`
5. **feat(03-02): add Arabic PhraseReveal to Hadith** - `f9de531`

## Deviations from Plan

None - plan executed as specified.

## Known Stubs

None - all PhraseWord data arrays contain real Arabic text with transliterations and meanings where appropriate.

## Self-Check: PASSED

All 12 created/modified files verified present. All 5 commits verified in git log.
