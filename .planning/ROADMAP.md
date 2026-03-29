# Roadmap: Tila UI Overhaul

## Overview

Transform Tila from functionally complete but visually generic into a premium, Duolingo-level experience with Quranic elegance. The overhaul starts with design system and animation infrastructure, then delivers the onboarding wow factor (highest priority first impression), followed by screen-by-screen polish of home, lessons, and progress, layering in celebrations, and finishing with edge-case states. Every phase builds on the foundation and delivers a coherent, verifiable visual upgrade.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Design Foundation & Transitions** - Polish design system components, centralize animation presets, add haptics, establish transition patterns
- [ ] **Phase 2: Onboarding Wow Factor** - Transform onboarding into a stunning, inspiring first impression with sacred first-letter moment and mindful pause
- [ ] **Phase 3: Home Screen** - Make the home screen inviting with hero lesson card, beautiful journey path, and engaging streak display
- [ ] **Phase 4: Lesson Experience** - Polish the core learning loop with beautiful intros, responsive quiz interactions, and completion celebrations
- [ ] **Phase 5: Celebrations & Feedback** - Build tiered celebration system from subtle warmth to genuine excitement with Islamic encouragement
- [ ] **Phase 6: Progress Screen** - Transform progress from data dump to motivating, beautiful mastery visualization
- [ ] **Phase 7: Loading & Error States** - Add graceful loading, empty, and error states so no screen ever feels broken or blank

## Phase Details

### Phase 1: Design Foundation & Transitions
**Goal**: Every screen shares a consistent, premium visual language with smooth transitions and tactile feedback
**Depends on**: Nothing (first phase)
**Requirements**: DES-01, DES-02, DES-03, DES-04, TRANS-01, TRANS-02, TRANS-03, STATE-04
**Success Criteria** (what must be TRUE):
  1. Navigating between any two screens uses one of exactly 3 transition types (slide-up, fade, push) with no jarring jumps
  2. Every tappable element provides haptic feedback appropriate to its action (light tap on press, success buzz on correct, error buzz on wrong)
  3. Design system components (Button, Card, ArabicText, HearButton, QuizOption) look polished and premium across all screens where they appear
  4. Animation timings are consistent app-wide (shared presets file, not per-component magic numbers)
**Plans:** 4 plans
Plans:
- [x] 01-01-PLAN.md — Create animation presets module and haptics utility with tests
- [ ] 01-02-PLAN.md — Polish design system components (Button, Card, HearButton, QuizOption) with shared presets
- [x] 01-03-PLAN.md — Configure screen transitions and migrate onboarding/animations.ts consumers
- [ ] 01-04-PLAN.md — Automated validation + visual/haptic verification checkpoint
**UI hint**: yes

### Phase 2: Onboarding Wow Factor
**Goal**: A new user opening Tila for the first time feels welcomed, inspired, and excited — not intimidated by Arabic
**Depends on**: Phase 1
**Requirements**: ONB-01, ONB-02, ONB-03, ONB-04, MIND-01, MIND-02
**Success Criteria** (what must be TRUE):
  1. The onboarding flow feels distinct and special — warm glow effects, elegant floating Arabic elements, staggered entrance animations
  2. The "first letter" moment has a sacred quality: gold particles, gentle animation, a beat of stillness before the audio plays
  3. A brief Bismillah breathing moment (2-3 seconds) precedes lesson entry, adding reverence without friction
  4. Transitions between onboarding steps are smooth with staggered content entrances (no content popping in all at once)
**Plans:** 2/4 plans executed
Plans:
- [x] 02-00-PLAN.md — Wave 0: Test stubs for all Phase 2 requirements (onboarding-flow, bismillah, warm-glow, onboarding-animations)
- [ ] 02-01-PLAN.md — Foundation components: WarmGlow animated variant, FloatingLettersLayer tint, BrandedLogo, animation constants
- [ ] 02-02-PLAN.md — BismillahMoment step, OnboardingFlow 9-step rewrite, Welcome/Tilawat/Hadith screen elevations
- [x] 02-03-PLAN.md — LetterReveal sacred moment, Finish celebration, BismillahOverlay for lesson entry
**UI hint**: yes

### Phase 3: Home Screen
**Goal**: The home screen feels like opening a beautiful book — inviting, clear, and encouraging
**Depends on**: Phase 1
**Requirements**: HOME-01, HOME-02, HOME-03, HOME-04
**Success Criteria** (what must be TRUE):
  1. The home screen feels warm and inviting on first glance, not like a utility grid
  2. The hero lesson card is the most visually prominent element with a clear, enticing call to action
  3. The lesson journey/grid shows distinct visual states for complete, current, and locked lessons
  4. The streak counter is visually engaging with animation or visual flair (not just a plain number)
**Plans:** 2 plans
Plans:
- [x] 03-01-PLAN.md — Wave 0 test stubs + AnimatedStreakBadge + JourneyNode new components
- [x] 03-02-PLAN.md — HeroCard polish, LessonGrid wiring, index.tsx staggered entrances + visual checkpoint
**UI hint**: yes

### Phase 4: Lesson Experience
**Goal**: The core learning loop feels responsive, polished, and emotionally supportive — every interaction lands
**Depends on**: Phase 1
**Requirements**: LES-01, LES-02, LES-03, LES-04, LES-05, LES-06
**Success Criteria** (what must be TRUE):
  1. Lesson intro screen presents the letter beautifully, setting the tone before quiz questions begin
  2. Selecting a quiz answer feels instant — tap response, visual state change, and feedback happen within one frame cycle
  3. Correct answers produce a warm sparkle + haptic; wrong answers produce a gentle shake + encouraging correction (not punishing)
  4. Lesson completion summary celebrates with visual excitement proportional to score (confetti/particles for great scores, warm encouragement for okay scores)
  5. All exercise types (guided reveal, tap-in-order, build-up reader, free reader) share a consistent polished look
**Plans:** 4 plans
Plans:
- [x] 04-00-PLAN.md — Wave 0: Test stubs for all 6 phase requirements (LES-01 through LES-06)
- [x] 04-01-PLAN.md — Exercise haptic migration + LessonHybrid spring/haptic migration + GuidedReveal WarmGlow + stage badges (D-11) + exercise fades (D-12)
- [ ] 04-02-PLAN.md — Quiz polish: QuizProgress springs + color transition, QuizCelebration scale + haptic + copy, QuizQuestion correct pulse, WrongAnswerPanel encouragement
- [x] 04-03-PLAN.md — LessonIntro WarmGlow + staggered scale entrance, LessonSummary score-proportional celebration + count-up color interpolation
**UI hint**: yes

### Phase 5: Celebrations & Feedback
**Goal**: Achievements feel appropriately celebrated — small wins get subtle warmth, big wins get genuine excitement, all with Islamic character
**Depends on**: Phase 4
**Requirements**: CEL-01, CEL-02, CEL-03, CEL-04, CEL-05
**Success Criteria** (what must be TRUE):
  1. A tiered celebration system exists: micro (correct answer sparkle), small (lesson complete), big (letter mastered), milestone (phase complete) — each visually distinct
  2. Letter mastery celebration is noticeably more impactful than a single correct-answer celebration
  3. Phase completion triggers a special milestone celebration that feels like a genuine achievement
  4. Encouragement messages use warm Islamic phrases (Bismillah, MashaAllah, Alhamdulillah) instead of generic "Great job!" text
**Plans:** 3 plans
Plans:
- [x] 05-01-PLAN.md — Wave 0 test stubs + Islamic copy expansion + mastery pipeline wiring
- [x] 05-02-PLAN.md — LetterMasteryCelebration component + lesson flow mastery detection
- [x] 05-03-PLAN.md — Phase completion milestone enhancement + 4-tier system validation
**UI hint**: yes

### Phase 6: Progress Screen
**Goal**: Users feel motivated and informed when reviewing their progress — mastery is visible and beautiful
**Depends on**: Phase 1
**Requirements**: PROG-01, PROG-02, PROG-03, PROG-04
**Success Criteria** (what must be TRUE):
  1. The progress screen feels motivating, not overwhelming — clear visual hierarchy guides the eye
  2. The letter mastery grid shows 5 distinct visual states (not_started, introduced, unstable, accurate, retained) that are immediately distinguishable
  3. Phase progress bars animate smoothly and show clear completion status
  4. Stats (lessons completed, letters mastered, streak) are presented with beautiful typography and clear hierarchy
**Plans:** 2 plans
Plans:
- [x] 06-01-PLAN.md — LetterMasteryGrid 5-state visuals + PhasePanel animated progress bars
- [x] 06-02-PLAN.md — StatsRow polish + progress.tsx staggered entrance animations
**UI hint**: yes

### Phase 7: Loading & Error States
**Goal**: No screen ever feels broken, blank, or abandoned — every state is designed
**Depends on**: Phase 1
**Requirements**: STATE-01, STATE-02, STATE-03
**Success Criteria** (what must be TRUE):
  1. App launch shows a beautiful branded loading state (not a white screen or spinner)
  2. Empty states (no progress yet, no lessons completed) show encouraging guidance instead of blank space
  3. If the app crashes, an error boundary catches it gracefully and offers a recovery path (restart/retry)
**Plans:** 2 plans
Plans:
- [x] 07-01-PLAN.md — Create AppLoadingScreen, ErrorFallback, EmptyState components with Wave 0 tests
- [x] 07-02-PLAN.md — Wire components into _layout.tsx, provider.tsx, progress.tsx + visual checkpoint
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Design Foundation & Transitions | 2/4 | Executing | - |
| 2. Onboarding Wow Factor | 1/4 | In Progress|  |
| 3. Home Screen | 2/2 | Checkpoint pending | - |
| 4. Lesson Experience | 3/4 | Executing | - |
| 5. Celebrations & Feedback | 3/3 | Complete | 2026-03-29 |
| 6. Progress Screen | 2/2 | Complete | 2026-03-29 |
| 7. Loading & Error States | 2/2 | Checkpoint pending | - |
