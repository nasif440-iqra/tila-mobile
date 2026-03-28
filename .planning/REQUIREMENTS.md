# Requirements: Tila UI Overhaul

**Defined:** 2026-03-28
**Core Value:** The first impression must be stunning. When someone opens Tila for the first time, they should feel welcomed, inspired, and excited to learn.

## v1 Requirements

Requirements for UI overhaul v1. Each maps to roadmap phases.

### Design Foundation

- [x] **DES-01**: All screens use consistent spacing, typography, and color tokens from the design system
- [x] **DES-02**: Design system components (Button, Card, ArabicText, HearButton, QuizOption) are polished to premium quality
- [x] **DES-03**: Animation timing is centralized in shared presets, not scattered across files
- [x] **DES-04**: All interactive elements have consistent haptic feedback (light tap on press, success on correct, error on wrong)

### Onboarding

- [ ] **ONB-01**: Onboarding flow feels special and inspiring — not a generic walkthrough
- [x] **ONB-02**: "First letter" moment feels sacred and exciting — gold particles, gentle animation, moment of stillness before audio
- [ ] **ONB-03**: Onboarding transitions are smooth with staggered entrance animations
- [ ] **ONB-04**: Visual warmth throughout (warm glow effects, elegant Arabic floating elements)

### Home Screen

- [ ] **HOME-01**: Home screen feels inviting and encouraging, not like a utility screen
- [ ] **HOME-02**: Hero lesson card is visually prominent with clear call to action
- [ ] **HOME-03**: Journey path / lesson grid clearly shows progress with beautiful visual states (complete, current, locked)
- [ ] **HOME-04**: Streak counter is visually engaging (not just a number)

### Lesson Experience

- [ ] **LES-01**: Lesson intro screen sets the tone with beautiful letter presentation
- [ ] **LES-02**: Quiz interactions feel responsive with smooth state transitions
- [ ] **LES-03**: Correct answers get a warm subtle celebration (sparkle + haptic)
- [ ] **LES-04**: Wrong answers give clear but encouraging feedback (shake + gentle correction)
- [ ] **LES-05**: Lesson summary celebrates completion with visual excitement (confetti/particles for good scores)
- [ ] **LES-06**: Exercise screens (guided reveal, tap-in-order, build-up reader, etc.) feel polished and consistent

### Celebrations & Feedback

- [ ] **CEL-01**: Tiered celebration system — small wins get subtle warmth, big wins get genuine excitement
- [ ] **CEL-02**: Lesson completion celebration with animated visual effect (confetti, particles, or burst)
- [ ] **CEL-03**: Letter mastery celebration is a bigger deal than a single correct answer
- [ ] **CEL-04**: Phase completion gets a special milestone celebration
- [ ] **CEL-05**: Warm Islamic encouragement messages replace generic "Great job!" text

### Mindful Moments

- [x] **MIND-01**: Bismillah breathing moment before lessons — brief mindful pause acknowledging the sacred nature of Quran learning
- [x] **MIND-02**: Moment is brief (2-3 seconds) and adds to the experience, not friction

### Progress Screen

- [ ] **PROG-01**: Progress screen feels informative and motivating, not just a data dump
- [ ] **PROG-02**: Letter mastery grid is visually clear with distinct states
- [ ] **PROG-03**: Phase progress indicators are polished with smooth progress bars
- [ ] **PROG-04**: Stats are presented beautifully with clear hierarchy

### Loading & Error States

- [ ] **STATE-01**: App shows beautiful loading state while initializing (not a blank screen)
- [ ] **STATE-02**: Empty states show encouraging messages and guidance (not blank space)
- [ ] **STATE-03**: Error boundary catches crashes gracefully with recovery option
- [x] **STATE-04**: All screen transitions are smooth with no jarring jumps

### Screen Transitions

- [x] **TRANS-01**: Screen-to-screen navigation transitions feel smooth and intentional
- [x] **TRANS-02**: In-screen content transitions (stage changes, exercise switches) are fluid
- [x] **TRANS-03**: Maximum 3 transition types used consistently: slide-up for modals, fade for in-place, push for navigation

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Visual Enrichment

- **VIS-01**: Letter mastery constellation — mastered letters illuminate an Islamic geometric pattern
- **VIS-02**: Calligraphic stroke animations — Arabic letters drawn stroke-by-stroke
- **VIS-03**: Gold-accented progress rings around lesson nodes and stats
- **VIS-04**: Wird system visual improvement — richer streak visualization

### Additional Polish

- **POL-01**: Dark mode with proper warm-to-dark token mapping
- **POL-02**: Sound design — subtle audio cues for celebrations and feedback
- **POL-03**: Advanced Skia shader effects for premium ambient visuals

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Character mascot | Tila's identity is warm + sacred, not cartoon. Arabic letters are the "characters." |
| Leaderboards / social competition | Quran learning is personal. Competition creates anxiety for converts. Requires cloud sync. |
| XP / gems / complex gamification | Over-gamification cheapens sacred content. Existing mastery system IS the progression. |
| Animated backgrounds everywhere | Kills 60fps on mid-range Android. Competes with content for attention. |
| Parallax scrolling | Makes functional lesson grid harder to use. |
| Custom transitions per screen | Cognitive overhead. 3 transition types max. |
| Push notifications | Separate milestone |
| Monetization | Separate milestone |
| Cloud sync | Separate milestone |
| New curriculum content | Separate concern entirely |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DES-01 | Phase 1 | Complete |
| DES-02 | Phase 1 | Complete |
| DES-03 | Phase 1 | Complete |
| DES-04 | Phase 1 | Complete |
| TRANS-01 | Phase 1 | Complete |
| TRANS-02 | Phase 1 | Complete |
| TRANS-03 | Phase 1 | Complete |
| STATE-04 | Phase 1 | Complete |
| ONB-01 | Phase 2 | Complete |
| ONB-02 | Phase 2 | Complete |
| ONB-03 | Phase 2 | Complete |
| ONB-04 | Phase 2 | Complete |
| MIND-01 | Phase 2 | Complete |
| MIND-02 | Phase 2 | Complete |
| HOME-01 | Phase 3 | Pending |
| HOME-02 | Phase 3 | Pending |
| HOME-03 | Phase 3 | Pending |
| HOME-04 | Phase 3 | Pending |
| LES-01 | Phase 4 | Pending |
| LES-02 | Phase 4 | Pending |
| LES-03 | Phase 4 | Pending |
| LES-04 | Phase 4 | Pending |
| LES-05 | Phase 4 | Pending |
| LES-06 | Phase 4 | Pending |
| CEL-01 | Phase 5 | Pending |
| CEL-02 | Phase 5 | Pending |
| CEL-03 | Phase 5 | Pending |
| CEL-04 | Phase 5 | Pending |
| CEL-05 | Phase 5 | Pending |
| PROG-01 | Phase 6 | Pending |
| PROG-02 | Phase 6 | Pending |
| PROG-03 | Phase 6 | Pending |
| PROG-04 | Phase 6 | Pending |
| STATE-01 | Phase 7 | Pending |
| STATE-02 | Phase 7 | Pending |
| STATE-03 | Phase 7 | Pending |

---
*Defined: 2026-03-28*
