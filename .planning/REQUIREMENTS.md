# Requirements: Tila Emotional Design Overhaul

**Defined:** 2026-04-03
**Core Value:** Every screen should feel like entering a quiet, beautiful room that was made for people who aren't sure they belong yet.

## v1 Requirements

The 5 things that must land: one ambient visual language, sacred screens unfold instead of display, quiz letter becomes the subject, correct/wrong feedback feels human and calm, Arabic looks respected and intentional.

### Foundation

- [ ] **FOUN-01**: Arabic text never clips diacritics on any screen — lineHeight ratios updated, overflow visible, cross-platform verified
- [ ] **FOUN-02**: Global ambient background system with presets (home, sacred, quiz, celebration, loading, onboarding) replaces per-screen background hacks
- [ ] **FOUN-03**: Animation tier expansion — breathing (2-4s), drift (18-32s), and settle timings added to shared animations alongside existing interaction tier
- [ ] **FOUN-04**: Reduce Motion support — all ambient animations disabled, entrance animations replaced with opacity fades when device setting is on
- [ ] **FOUN-05**: FloatingLettersLayer withRepeat(-1) 12-minute freeze bug fixed with restart-loop pattern

### Quiz Experience

- [ ] **QUIZ-01**: LetterHero component — Arabic letter dominates top half of quiz screen with slow breathing animation (2s inhale, 0.5s hold, 2s exhale) and warm gold glow
- [ ] **QUIZ-02**: Correct answer triggers warm gold ripple expanding from tapped option (500ms, 15-20% opacity) with hapticSelection — no floating "+1"
- [ ] **QUIZ-03**: Wrong answer feels like encouragement — option dims briefly (opacity dip 200ms), correct answer illuminates with warm glow, no shake, no red, no X icon
- [ ] **QUIZ-04**: WrongAnswerPanel uses warm palette (accentLight bg, brown text, no danger colors) with existing encouragement copy
- [ ] **QUIZ-05**: Arabic text in quiz options uses generous sizing (48-56px hero tier) so letters are always the primary content, never labels

### Sacred Moments

- [ ] **SACR-01**: Sacred phrase reveal primitive — word-by-word fade-in (600-800ms per word, 300-400ms stagger) with transliteration appearing beneath each word
- [ ] **SACR-02**: Bismillah micro-lesson — 4 semantic units (Bismi / Allahi / Ar-Rahmani / Ar-Raheem) with word-by-word Arabic, transliteration, and meaning. Both spiritual threshold and first teaching moment.
- [ ] **SACR-03**: Onboarding Welcome screen atmosphere — warm ambient background, gentle entrance, quiet welcome feeling
- [ ] **SACR-04**: Onboarding Tilawah screen — sacred phrase reveals word-by-word instead of static quote card
- [ ] **SACR-05**: Onboarding Hadith screen — sacred phrase reveals word-by-word instead of static quote card
- [ ] **SACR-06**: Onboarding Finish screen atmosphere — lands with gravity, not bounce. "You've already begun" feels earned.

## v1.1 Requirements

Ship shortly after v1. Valuable secondary surfaces that aren't required to prove the new design language.

### Polish

- **PLSH-01**: Streak escalation — Day 3 quiet banner, Day 5 warmer banner, Day 7 dignified full-screen with breathing Arabic phrase
- **PLSH-02**: Home screen quiet welcome — entrance stagger, hero card settles gently, no urgency
- **PLSH-03**: State screens polish — loading, empty, error screens use ambient background and warm messaging
- **PLSH-04**: Progress screen reflection — mastery glow on letter grid (glow intensity proportional to mastery level)

## v2 Requirements

Deferred unless v1 is stable and scope allows.

### Enhancements

- **ENHN-01**: Geometric pattern prototype — Islamic geometric pattern at 3-5% opacity as ambient texture
- **ENHN-02**: Deeper progress glow refinements beyond basic mastery-proportional glow
- **ENHN-03**: Custom celebration copy logic beyond basic streak tiering
- **ENHN-04**: Subtle audio experimentation (completion tones, ambient sound)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Confetti / particle explosions | Arcade energy. Beauty that performs. Contradicts emotional contract. |
| Floating "+1" score indicator | Gamification. Reduces sacred learning to point accumulation. |
| Shake animation on wrong answer | Physically aggressive. Contradicts "Close!" energy. |
| Red/danger coloring on wrong answers | Punitive. Wrong answers should feel like "not yet." |
| Streak loss anxiety messaging | Exploits loss aversion. Spiritually harmful for reconnecting learners. |
| Countdown timers / urgency | Dark pattern. Contradicts sanctuary feeling. |
| Complex parallax / 3D effects | Performance killer on Android. Beauty that performs. |
| Achievement badges / trophies | Gamification of sacred learning. Trivializes spiritual journey. |
| Leaderboards / social comparison | Competition has no place in spiritual learning. |
| Skeleton screens with shimmer | Generic tech pattern. Breaks atmosphere. |
| Sound effects on every interaction | Arcade energy. Audio should be quiet and intentional. |
| @shopify/react-native-skia | 4-6MB overhead for effects achievable with existing stack. |
| Business logic / engine changes | Out of scope for design milestone. |
| Routing changes | Expo Router structure stays the same. |
| Dark mode | Separate milestone. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUN-01 | Phase 1 | Pending |
| FOUN-02 | Phase 1 | Pending |
| FOUN-03 | Phase 1 | Pending |
| FOUN-04 | Phase 1 | Pending |
| FOUN-05 | Phase 1 | Pending |
| QUIZ-01 | Phase 2 | Pending |
| QUIZ-02 | Phase 2 | Pending |
| QUIZ-03 | Phase 2 | Pending |
| QUIZ-04 | Phase 2 | Pending |
| QUIZ-05 | Phase 2 | Pending |
| SACR-01 | Phase 3 | Pending |
| SACR-02 | Phase 3 | Pending |
| SACR-03 | Phase 3 | Pending |
| SACR-04 | Phase 3 | Pending |
| SACR-05 | Phase 3 | Pending |
| SACR-06 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-03*
*Last updated: 2026-04-03 after initial definition*
