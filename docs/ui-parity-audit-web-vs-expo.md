# Visual Parity Audit: tila1 (Web) vs tila-mobile (Expo)

**Date:** 2026-03-29
**Methodology:** Full source comparison of visual code in both repos

---

## Executive Summary

The mobile app preserved the **color palette, font families, and basic component structure** from the web app but lost the **atmosphere, depth, and art direction** that made the web version feel premium. The core issue is exactly what you suspected: architecture was preserved more than visual philosophy.

The web app feels like a **crafted spiritual learning experience**. The mobile app feels like a **well-organized React Native template** that happens to use the same colors.

---

## Top 10 Regressions (Ranked by Visual Impact)

### 1. NO AMBIENT BACKGROUND TREATMENT
**Web:** Every screen has a warm gradient header (`linear-gradient(180deg, #F2EADE 0%, transparent 100%)`) that creates depth and warmth. The top 280px fades from warm beige to cream.
**Mobile:** Flat solid `#F8F6F0` everywhere. No gradient, no layering, no depth.
**Impact:** CRITICAL. This is the single biggest reason the mobile app feels flat. The gradient is the atmospheric foundation that makes everything else feel warm.

### 2. WEAK GLOW SYSTEM
**Web:** The "Noor" glow uses `radial-gradient` with gold at center fading to transparent, PLUS a breathing animation that pulses opacity 0.35-0.65 and scale 1.0-1.08 over 4 seconds. Sizes range 80-360px.
**Mobile:** `WarmGlow` component is a solid-color circle with opacity animation (typically 0.06-0.18). No radial gradient, no scale breathing, much lower opacity range.
**Impact:** HIGH. The glow is the app's spiritual signature. Current mobile version is barely visible.

### 3. SHADOWS TOO SMALL AND TIGHT
**Web:** Card shadow is `0 12px 40px rgba(22,51,35,0.06)` -- large blur, tall offset, green-tinted. Hero cards cast long, diffuse shadows.
**Mobile:** Card shadow is `offset(0,2), blur 8, opacity 0.08` -- tiny, tight, barely visible.
**Impact:** HIGH. Cards look stuck to the surface instead of floating. No sense of layered depth.

### 4. CARD RADII TOO SMALL
**Web:** Main cards use 32px radius, quiz options 16px, onboarding cards 32px.
**Mobile:** Main cards use 16-24px radius, quiz options 24px (actually larger than web for options, but hero card is smaller).
**Impact:** MEDIUM-HIGH. The 32px radius on hero cards gives a softer, more luxurious feel that's lost at 16-24px.

### 5. NO DECORATIVE CARD ELEMENTS
**Web:** Hero card has corner blobs (soft cream/gold shapes with 100% border-radius on one corner), review cards have accent treatments.
**Mobile:** Cards are plain white rectangles with uniform padding.
**Impact:** MEDIUM. Removes the bespoke, art-directed feel from the most prominent UI element.

### 6. QUIZ OPTIONS LACK EXPRESSIVENESS
**Web:** Options have 2.5px borders, hover state (border-color change + shadow shift), correctGlow keyframe (pulsing green shadow), "+1" floating text on correct, and revealed-correct glow pulse. 5+ distinct visual states.
**Mobile:** Options have no visible border in default state, no hover/pressed-visible border change, correct/wrong animations are scale-pulse and shake only. Missing: glow effects, floating score indicator, border emphasis.
**Impact:** MEDIUM-HIGH. Quiz is the most-used screen. Interactions feel muted.

### 7. NO SCREEN-LEVEL FEEDBACK FLASHES
**Web:** Gold tint overlay on streak milestones (full-screen rgba(196,164,100,0.06), 800ms). Red flash on wrong answers (full-screen rgba(189,82,77,0.08), 400ms).
**Mobile:** Nothing. Wrong answers only affect the option card itself.
**Impact:** MEDIUM. The flashes create emotional punctuation that makes streaks feel earned and mistakes feel consequential.

### 8. STREAK SYSTEM LESS DRAMATIC
**Web:** Three visual tiers (3, 5, 7+) with escalating treatment. Tier 3 uses gradient background + confetti + Arabic "Masha'Allah". Banner is a fixed-position pill with rich shadow.
**Mobile:** Single banner style (`accentLight` bg, `accent` border) for all milestones. No confetti, no tier escalation, no Arabic celebration text.
**Impact:** MEDIUM. Streaks should feel increasingly special.

### 9. NO GLASSMORPHISM ON PILLS/BADGES
**Web:** Header pills use `rgba(255,255,255,0.6)` + `backdrop-filter: blur(8px)` + subtle border + shadow. Creates a premium frosted-glass effect.
**Mobile:** Pills use solid backgrounds (`bg`, `primarySoft`, `accentLight`). No blur, no translucency.
**Impact:** LOW-MEDIUM. Subtle but contributes to the premium feel.

### 10. MISSING CELEBRATION CONFETTI
**Web:** Uses `canvas-confetti` with app-branded colors (green, gold, cream). 60 particles on pass, 80 on perfect score from dual origins.
**Mobile:** No confetti. Summary celebrations rely only on haptics + WarmGlow + emoji.
**Impact:** MEDIUM. Confetti is the peak emotional payoff of the learning loop.

---

## Root Cause Analysis

| Cause | Evidence |
|-------|----------|
| **Systematic over-normalization** | Every card uses the same `Card` component with the same shadow/radius. Web has 4+ card variants. |
| **Token conservatism** | Mobile shadow tokens have 1/5 the blur radius of web. Radii are tighter. No warm gradient token. |
| **Missing ambient layer** | No equivalent of the CSS `::before` gradient or floating background letters. |
| **WarmGlow underperformance** | Opacity range 0.06-0.18 vs web's 0.35-0.65. No radial gradient, no scale breathing. |
| **Generic component philosophy** | `QuizOption` has 4 states (default, correct, wrong, dimmed). Web has 6+ (add hover, correctGlow, revealedGlow). |
| **No screen-level effects** | No overlay system for flashes, no confetti system, no screen-level transitions. |

---

## What Mobile Does BETTER (Preserve These)

1. **Haptic feedback system** -- Web has no haptics. Mobile's 4-tier haptic system (tap/success/error/milestone) adds physicality that's impossible on web. **Keep.**
2. **Animation token system** -- `springs`, `durations`, `staggers` are well-organized and consistent. Web has ad-hoc spring values scattered in components. **Keep the architecture.**
3. **TypeScript throughout UI** -- Web components are JSX. Mobile's typed props/interfaces prevent bugs. **Keep.**
4. **Hybrid lesson exercises** -- `BuildUpReader`, `GuidedReveal`, `TapInOrder` etc. are mobile-native innovations not in the web app. **Keep and polish.**
5. **Press feedback via AnimatedPressable** -- Consistent spring-based press feedback. Web relies on CSS hover/active which is less intentional. **Keep.**
6. **WarmGlow as a component** -- Good abstraction. Just needs stronger visual output. **Keep architecture, upgrade rendering.**
7. **Quiz option card sizing** -- Mobile's 88px min-height with 24px radius actually provides better touch targets than web's tighter options. **Keep sizing.**

---

## File-by-File Comparison Notes

### Design Tokens (`tokens.ts` vs `tokens.css`)

| Token | Web | Mobile | Gap |
|-------|-----|--------|-----|
| Card shadow blur | 40px | 8px | 5x smaller |
| Card shadow offset-y | 12px | 2px | 6x smaller |
| Main card radius | 32px | 16px (Card) / 24px (HeroCard) | Smaller |
| Quiz option border | 2.5px solid | None visible | Missing |
| Background gradient | `linear-gradient(#F2EADE, transparent)` | None | Missing entirely |
| Accent glow opacity | 0.35-0.65 | 0.06-0.18 | 3-4x weaker |
| Shadow color tint | Green-tinted `rgba(22,51,35,...)` | Green-tinted | Same (good) |

### Home Screen

| Element | Web | Mobile | Gap |
|---------|-----|--------|-----|
| Background gradient | 280px warm->transparent | Flat solid | Missing |
| Hero card radius | 32px | 24px | Smaller |
| Hero card shadow | 12px/40px blur | 4px/12px blur | Much smaller |
| Hero card corner blobs | Yes (cream + gold) | No | Missing |
| Hero letter glow | 200px+, radial gradient, breathing | 160px, solid circle, opacity pulse | Weaker |
| Greeting typography | Lora 28px, labeled section | Not present | Missing |
| Journey node glow (current) | 80px breathing Noor | Opacity pulse ring | Weaker |
| Current lesson label | Glassmorphic card | Bordered card | Different (OK) |

### Quiz Screen

| Element | Web | Mobile | Gap |
|---------|-----|--------|-----|
| Option default border | 2.5px solid #EBE6DC | None | Missing |
| Option hover state | Border-color + shadow change | N/A (no hover on mobile) | N/A |
| Correct glow animation | Box-shadow pulse (correctGlow keyframe) | Scale pulse only | Missing glow |
| "+1" floating text | Gold "+1" floats up + fades | None | Missing |
| Wrong answer red flash | Full-screen 400ms flash | None | Missing |
| Streak gold tint | Full-screen 800ms tint | None | Missing |
| Progress bar gradient | Green->lighter green gradient | Solid + color interpolation | Different (mobile OK) |
| Option grid layout | Responsive: 2-col for 4, wrap for 3 | 2x2 flex wrap always | Similar |

### Lesson Intro

| Element | Web | Mobile |
|---------|-----|--------|
| Layout | Centered card with decorative elements | Full-screen with center content |
| Letter circle background | `#F2F5F3` with inset shadow | `primarySoft` flat |
| Glow behind letters | Large Noor breathing glow | `WarmGlow` at lower intensity |
| Mode-specific variants | Same template for all | Same template for all |

### Lesson Summary

| Element | Web | Mobile |
|---------|-----|--------|
| Confetti on pass | 60 particles, branded colors | None |
| Confetti on perfect | 80 particles from dual origins | None |
| Noor reveal | Dramatic entrance with scale + opacity | WarmGlow, lower intensity |
| Score circle | Animated border based on score | Animated number + colored glow |
| Up-next preview | Warm card with gold corner blob | Not present |

---

## Implementation Plan

### Phase 1: Quiz Screen Recovery (HIGHEST IMPACT)

**Goal:** Make the quiz flow feel premium, expressive, and emotionally engaging -- matching the web's drama.

**Files to touch:**
- `src/design/tokens.ts` -- upgrade shadow tokens, add quiz-specific tokens
- `src/design/components/QuizOption.tsx` -- add border states, glow animation, floating "+1"
- `src/components/quiz/QuizQuestion.tsx` -- add screen flash overlay
- `src/components/quiz/QuizProgress.tsx` -- upgrade streak banner tiers
- `src/components/LessonQuiz.tsx` -- add flash overlay container
- `src/components/onboarding/WarmGlow.tsx` -- upgrade with radial gradient + scale breathing

**Specific changes:**
1. Add 2px border to quiz options in default state (warm beige `#EBE6DC`)
2. Add green glow animation on correct answer (animated shadow/border)
3. Add floating "+1" indicator on correct answers
4. Add full-screen red flash on wrong answer (400ms)
5. Add full-screen gold tint on streak milestones (800ms)
6. Implement 3-tier streak banners (3: simple, 5: enhanced, 7+: celebration + confetti)
7. Upgrade WarmGlow to use LinearGradient for radial-gradient-like effect + scale breathing

**Risks:**
- Shadow animations on Android may need elevation workaround
- Confetti library needed for tier-3 streaks

**Acceptance criteria:**
- Quiz options have visible warm border in default state
- Correct answers produce a visible glow + floating "+1"
- Wrong answers flash the screen briefly red
- Streak milestones at 3/5/7 have distinct visual tiers
- Overall quiz feels dramatically more alive than current

### Phase 2: Home Screen Recovery

**Goal:** First impression feels warm, premium, and art-directed rather than template-like.

**Files to touch:**
- `app/(tabs)/index.tsx` -- add background gradient layer
- `src/components/home/HeroCard.tsx` -- upgrade radius, shadows, add corner decorations
- `src/components/home/JourneyNode.tsx` -- upgrade current-node glow
- `src/components/home/LessonGrid.tsx` -- refine spacing
- `src/design/tokens.ts` -- add hero-grade shadow variant
- `src/components/onboarding/WarmGlow.tsx` -- already upgraded in Phase 1

**Specific changes:**
1. Add warm gradient background (top 300px: `#F2EADE` -> transparent) behind home screen
2. Upgrade hero card: radius to 28-32px, deeper shadow, decorative corner accents
3. Strengthen hero letter glow (bigger, more visible, radial gradient)
4. Upgrade current journey node: stronger breathing glow ring
5. Add premium shadow to hero card (12px offset, 32px blur)

**Risks:**
- LinearGradient as background layer needs performance testing on scroll
- Corner decorations need overflow hidden to clip properly

**Acceptance criteria:**
- Home screen has visible warm-to-cream gradient at top
- Hero card feels elevated and art-directed, not flat
- Current lesson node has a visible, breathing glow
- Overall mood is warm and inviting, not sterile

### Phase 3: Lesson Intro Recovery

**Goal:** Lesson intro screens feel like a moment of anticipation, not a loading gate.

**Files to touch:**
- `src/components/LessonIntro.tsx` -- upgrade layout, letter presentation, glow
- Potentially create mode-specific intro variants if warranted

**Specific changes:**
1. Strengthen letter glow (larger, more visible radial effect)
2. Add subtle inset shadow on letter circles for depth
3. Improve entrance choreography (more dramatic stagger)
4. Evaluate whether mode-specific variants are needed (recognition vs sound vs contrast vs harakat)

**Risks:**
- Mode-specific variants add code. Only create if the generic intro truly hurts specific modes.

**Acceptance criteria:**
- Intro screen feels like a premium reveal moment
- Letters feel presented, not just displayed
- Glow is clearly visible and adds atmosphere

### Phase 4: Design System Refinements

**Goal:** Elevate the base design tokens so ALL screens benefit, not just the ones touched in Phases 1-3.

**Files to touch:**
- `src/design/tokens.ts` -- shadow upgrades, new shadow variants
- `src/design/components/Card.tsx` -- default radius + shadow upgrade
- `src/components/LessonSummary.tsx` -- add confetti, upgrade celebration
- `src/components/celebrations/LetterMasteryCelebration.tsx` -- upgrade glow

**Specific changes:**
1. Upgrade default card shadow (larger blur, taller offset)
2. Add `heroShadow` variant (32px+ blur for featured cards)
3. Add confetti system for lesson completion celebrations
4. Upgrade mastery celebration glow intensity
5. Consider glassmorphism for select badges/pills (if performant on Android)

**Risks:**
- Shadow changes affect every card in the app; need to verify no regressions
- Confetti library adds bundle size

**Acceptance criteria:**
- Cards throughout the app feel more elevated
- Lesson completion has confetti celebration
- Celebrations feel like peak emotional moments
