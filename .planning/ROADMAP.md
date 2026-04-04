# Roadmap: Tila Emotional Design Overhaul

## Overview

Three phases transform Tila from a functional content app into an inhabited space. Phase 1 fixes the typography foundation and builds the ambient/animation infrastructure every subsequent screen depends on. Phase 2 redesigns the quiz -- the screen users spend the most time on -- so Arabic letters feel alive and feedback feels human. Phase 3 applies the established design language to sacred moments and onboarding, where first impressions and emotional differentiation live.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Arabic typography fix, ambient background system, animation tiers, reduce motion, FloatingLetters bug patch
- [ ] **Phase 2: Quiz Experience** - LetterHero breathing component, answer feedback overhaul (warm ripple / encouraging nudge), quiz Arabic sizing
- [ ] **Phase 3: Sacred Moments** - Bismillah micro-lesson, phrase reveal primitive, onboarding atmosphere (Welcome, Tilawah, Hadith, Finish)

## Phase Details

### Phase 1: Foundation
**Goal**: Every screen has a consistent ambient atmosphere, Arabic text never clips, and all animations respect accessibility settings
**Depends on**: Nothing (first phase)
**Requirements**: FOUN-01, FOUN-02, FOUN-03, FOUN-04, FOUN-05
**Success Criteria** (what must be TRUE):
  1. Arabic text with full diacritics (test with "bismillah" phrase) renders without clipping on both iOS and Android at every size tier used in the app
  2. Switching between Home, Quiz, Onboarding, and Loading screens shows a consistent ambient gradient background (no raw cream/white screens, no per-screen visual discontinuity)
  3. Enabling "Reduce Motion" in device settings disables all breathing/drift animations and replaces entrances with simple opacity fades
  4. FloatingLettersLayer runs for 15+ minutes without freezing or visual glitch on Android
  5. Animation system includes breathing (2-4s), drift (18-32s), and settle timing presets accessible from shared animation config
**Plans:** 2 plans
Plans:
- [ ] 01-01-PLAN.md — Arabic typography fix (lineHeight ratios, quizHero tier, overflow:visible) + animation tier tokens (breathing, drift, settle)
- [ ] 01-02-PLAN.md — Atmosphere system (relocate WarmGlow/FloatingLettersLayer, fix withRepeat bug, reduce motion, AtmosphereBackground with 6 presets)
**UI hint**: yes

### Phase 2: Quiz Experience
**Goal**: The quiz screen makes Arabic letters feel like living presences and answer feedback feels warm and encouraging, never punitive
**Depends on**: Phase 1
**Requirements**: QUIZ-01, QUIZ-02, QUIZ-03, QUIZ-04, QUIZ-05
**Success Criteria** (what must be TRUE):
  1. Quiz screen shows the target Arabic letter large in the top half with a visible slow breathing animation and warm glow -- the letter is the dominant visual element, not a label
  2. Tapping the correct answer triggers a warm gold ripple expanding from the tapped option with haptic feedback -- no floating "+1" appears anywhere
  3. Tapping the wrong answer dims the option briefly and illuminates the correct answer with a warm glow -- no shake, no red flash, no X icon
  4. The wrong answer explanation panel uses warm cream/brown colors with encouraging tone -- no danger/error colors
  5. Arabic letters in quiz options are sized at 48-56px so they read as primary content, not small labels
**Plans**: TBD
**UI hint**: yes

### Phase 3: Sacred Moments
**Goal**: Onboarding and Bismillah feel like spiritual thresholds, not static content -- text unfolds word-by-word instead of appearing all at once, creating genuine moments of revelation
**Depends on**: Phase 2
**Requirements**: SACR-02, SACR-01, SACR-03, SACR-04, SACR-05, SACR-06
**Success Criteria** (what must be TRUE):
  1. Bismillah screen presents 4 semantic units (Bismi / Allahi / Ar-Rahmani / Ar-Raheem) with Arabic, transliteration, and meaning for each -- functions as both spiritual threshold and first teaching moment
  2. Sacred Arabic phrases (Bismillah, Tilawah quote, Hadith quote) reveal word-by-word with transliteration appearing beneath each word -- not displayed all at once
  3. Onboarding Welcome screen opens with atmospheric warmth (ambient background, gentle entrance) -- feels like entering a quiet room, not loading a form
  4. Onboarding Tilawah and Hadith screens use the word-by-word reveal instead of static quote cards
  5. Onboarding Finish screen lands with gravity ("You've already begun" feels earned) -- no bounce, no celebratory excess
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Foundation | 0/2 | Planning complete | - |
| 2. Quiz Experience | 0/? | Not started | - |
| 3. Sacred Moments | 0/? | Not started | - |

## Self-Review Gate

Before marking any phase complete, list the screens changed, shared components added or modified, and what would still feel flat to a first-time user.
