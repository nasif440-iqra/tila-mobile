# Project Research Summary

**Project:** Tila — Emotional UI Design Overhaul
**Domain:** Atmospheric/emotional mobile UI for a sacred-text Arabic learning app
**Researched:** 2026-04-03
**Confidence:** HIGH

## Executive Summary

Tila's emotional UI overhaul is building a mosque-like digital atmosphere for Muslim converts learning Quranic Arabic. The research verdict is unambiguous: do not add new rendering technology. The existing stack (Reanimated 4.2.1, react-native-svg 15.15.3, expo-linear-gradient) handles every required effect, and the codebase already contains two working proof-of-concept components — WarmGlow.tsx and FloatingLettersLayer.tsx — that demonstrate the correct patterns. The only justified new dependency is expo-blur for frosted-glass sacred screen overlays: one package, SDK-aligned, no new rendering pipeline. The architectural model is a composable layered atmosphere system (four layers: background, ambient motion, overlays, content) with zero data dependencies — atmosphere components receive only colors from ThemeContext and animation parameters as props, no new contexts or state management needed.

The emotional design contract is explicit and research-validated. Headspace and Calm research confirms that atmospheric consistency across every screen is the baseline expectation users bring from wellness apps — raw cream backgrounds on any screen break the illusion. Duolingo research confirms that warm positive feedback meaningfully improves retention (+1.7% Day 7 from milestone animations) while its shake/red/punishment patterns are explicitly wrong for sacred learning and must be replaced entirely. The Arabic text rendering situation is a hard blocker: active React Native bugs (issues #55220, #29507, #7687) mean diacritics will clip with the current lineHeight ratios. The codebase uses a 1.39x lineHeight ratio; the research establishes a minimum of 1.67x and recommends 2.2-2.5x for fully voweled Quranic text with Amiri font. For a Quran learning app, clipped diacritics are a credibility destroyer and must be fixed before any visual work builds on top of them.

The primary risks are Android performance and a known Reanimated/New Architecture regression. The 15-20 concurrent shared values per screen is a hard budget, not a suggestion — FloatingLettersLayer already consumes 12 of those values with its ambient letters, leaving limited headroom for additional effects on that screen. A known withRepeat(-1) memory leak affects FloatingLettersLayer and causes animations to break after approximately 12 minutes on Android; this bug already exists in the codebase and must be patched in Phase 1. SVG-based animated gradient stops are buggy cross-platform — but the correct pattern (animate the container View, never the SVG internals) is already established in WarmGlow.tsx and must be followed without deviation.

---

## Key Findings

### Recommended Stack

The existing stack is sufficient for all required effects. Adding Skia would increase app download size by 4-6 MB and introduce a second rendering pipeline for effects already achievable with SVG. Lottie is for pre-authored animations, not the parametric ambient motion (breathing, drifting, settling) that Tila's design calls for. Moti wraps Reanimated with an abstraction layer but adds no capability the team doesn't already use directly.

**Core technologies — all already installed except expo-blur:**
- `react-native-reanimated 4.2.1` — all ambient motion: breathing, drifting, settling, ripples, scale pulses. UI-thread worklets guarantee 60fps for opacity/transform animations. Provides `useReducedMotion()` for accessibility at no additional cost.
- `react-native-svg 15.15.3` — RadialGradient glows, SVG Pattern geometric backgrounds, correct-answer ripple circles. Static SVG has negligible performance cost. Never animate gradient stop properties directly — animate the container.
- `expo-linear-gradient 55.0.11` — linear gradient backgrounds and atmospheric color washes. Native view, negligible cost.
- `expo-blur ~55.0.11` (NEW — one install) — frosted glass overlays for sacred screens. SDK-aligned, uses native RenderNode API on Android 12+. Critical limitation: do not use inside React Native Modal on Android (SDK 55 bug).

**Animation rules — non-negotiable for 60fps on mid-range Android:**
- Only animate `opacity` and `transform` (scale, translate, rotate). Never animate layout properties (width, height, margin, padding) — these trigger full Yoga layout recalculation every frame.
- Use `Easing.inOut(Easing.ease)` for all ambient motion. Never `withSpring` for ambient effects — spring physics create playful/arcade energy that contradicts the sacred register.
- Budget: 15-20 concurrent shared values per screen maximum. FloatingLettersLayer uses 12 — this is the practical ambient limit for that screen.
- Always pair every repeating animation with `useReducedMotion()` from Reanimated.

### Expected Features

**Must have (table stakes — missing any of these breaks the emotional promise):**
- Global ambient background on every screen — users from Calm/Headspace expect consistent atmospheric treatment; the current banded WarmGradient hack (5 opacity View layers with visible staircase) must be replaced with a true gradient shared layout component
- Arabic text never clipped — current 1.39x lineHeight ratio WILL clip diacritics; requires minimum 1.67x, and 2.2-2.5x for fully voweled Quranic text; never use `overflow: 'hidden'` on Arabic text containers
- Reduce Motion accessibility — required for App Store approval; Apple verifies this; must be built into animation primitives from day one, not retrofitted
- Consistent motion language — breathing tier (2-4s cycles) and drift tier (30-60s slow movement) must be added to animations.ts alongside the existing interaction tier
- Correct answer feels rewarding — warm gold ripple expanding from tap point replaces the current pulse + floating "+1" gamification indicator
- Wrong answer does not punish — shake + red directly contradicts the Emotional Design Contract; replace with gentle opacity dip (1 to 0.7 to 1 over 200ms) and warm guidance toward the correct answer
- Loading/empty/error states feel inhabited — raw spinners break the atmosphere; apply global ambient treatment with warm messaging

**Should have (differentiators — what makes Tila unlike any other Arabic learning app):**
- LetterHero component with 4.5s meditative breathing cycle and harmonized warm glow — Arabic letters as living presences, not static card content; no competitor does this
- Sacred phrase reveal — word-by-word staggered fade-in (600-800ms per word, 300-400ms stagger between words) for Bismillah and onboarding screens; current BismillahMoment does a single FadeIn for the entire phrase
- Warm ripple on correct answer — gold circle expanding from the actual tap coordinates, organic not arcade, accompanied by hapticSelection not hapticSuccess
- Encouraging nudge on wrong answer — cream panel (accentLight #F5EDDB), warm brown text (#3D2B1F), correct answer illuminates with gold border, no X icon; guidance not punishment
- Streak escalation — Day 7 full-screen moment with sacred reveal + ambient background using Arabic "Masha'Allah"; dignified, not gamified; current StreakMilestoneOverlay is a solid foundation
- Home screen quiet welcome — 400ms warm background fade-in on mount, hero card settles with gentle spring, grid items stagger in using existing animation.ts primitives
- Progress screen as reflection — mastery glow intensity on the 28-letter grid (not_started = no glow, retained = full warm glow at 30% opacity) instead of stats-forward design
- WarmGlow relocation — currently lives in src/components/onboarding/ but is used in 10+ components across the codebase; must move to src/design/atmosphere/

**Defer to post-milestone:**
- Bismillah interactive micro-lesson — HIGH complexity (word segmentation, per-word audio integration, tap-to-hear interactivity); emotionally pivotal but too large for this milestone
- Ambient Islamic geometric patterns — uncertain Android performance; prototype in Phase 1 to validate, cut if frame budget is exceeded; static PNG tile is the fallback
- Frosted glass blur overlays — expo-blur works but adds visual noise; the warm gradient approach is more aligned with "cleanliness as reverence"; also blocked by Modal limitation on Android

**Explicit anti-features (do not build):**
Confetti/particle explosions, floating "+1" score indicators, shake animation on wrong answers, red/danger coloring anywhere in the quiz flow, streak loss anxiety messaging, countdown timers or urgency language, achievement badges/trophies, skeleton screens with shimmer, leaderboards or social comparison.

### Architecture Approach

Every screen composes four layers: Layer 1 (gradient base), Layer 2 (ambient motion — floating letters, breathing glows), Layer 3 (overlays — blur, sacred moments), Layer 4 (content — text, buttons, interactive elements). This is NOT a new navigation structure — it is presentational composition via a shared `AtmosphereBackground` component within each screen. The AtmosphereBackground should support a preset system (home, sacred, quiz, celebration, loading, onboarding) so each screen context gets appropriate atmospheric intensity without per-screen customization. Atmosphere components have zero data dependencies and require no new React contexts or state management.

**Major components:**
1. `AtmosphereBackground` — gradient base + radial glow with preset system; shared across all screens; replaces per-screen WarmGradient implementations
2. `FloatingLettersLayer` — ambient drifting Arabic letters (already exists; needs withRepeat 12-minute bug patch)
3. `WarmGlow` — SVG RadialGradient with optional breathing animation (already exists; relocate from src/components/onboarding/ to src/design/atmosphere/)
4. `LetterHero` — large Arabic letter with 4.5s breathing glow for quiz/lesson hero areas; built on WarmGlow
5. `FeedbackRipple` — expanding gold circle for correct answer; fire-and-forget, no state management, triggers from quiz logic
6. `FeedbackNudge` — gentle horizontal translateX oscillation for wrong answer; replaces shake animation
7. `PhraseReveal` — reusable staggered word-by-word animation primitive; used by Bismillah, onboarding screens, and Day 7 streak
8. `ReduceMotionGate` — wrapper checking `useReducedMotion()`; bake into every animated primitive from day one

**Critical patterns to enforce:**
- Animate the container View, never SVG gradient internals — WarmGlow.tsx already demonstrates this; do not deviate
- Fire-and-forget feedback: correct/wrong animations trigger once and auto-complete with no state management overhead
- SVG Pattern IDs must be unique per instance: `id={\`glow-hero-${size}\`}` prevents silent gradient collisions
- `pointerEvents="none"` on all atmosphere layers — WarmGlow and FloatingLettersLayer already do this correctly

### Critical Pitfalls

1. **Animating layout properties (width, height, margin, padding)** — triggers Yoga layout recalculation every frame; drops to 15-30fps on mid-range Android. Prevention: only animate `opacity` and `transform`. Detection: React Native Perf Monitor; UI thread >16ms per frame during animation indicates layout animation.

2. **Arabic text clipping** — React Native bugs (#55220, #29507, #7687, #13126) clip diacritics when lineHeight is tight. Current codebase ratio (1.39x) WILL clip. Prevention: minimum 1.67x lineHeight, 2.2-2.5x for fully voweled Quranic text with Amiri. Never use `overflow: 'hidden'` on Arabic containers. Test every size with "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ".

3. **withRepeat(-1) 12-minute memory leak on Android** — repeating animations break after approximately 12 minutes. FloatingLettersLayer already has this bug. Prevention: use Reanimated 4.x useSharedValue (not raw Animated.Value); profile and patch in Phase 1 before the bug ships to users.

4. **Missing Reduce Motion support** — Apple App Store checks accessibility; ignoring OS reduce-motion settings risks rejection. Prevention: build `useReducedMotion()` into every animated primitive at construction time, wrap root layout with `ReducedMotionConfig`. Do not retrofit.

5. **Too many concurrent shared values** — exceeding 20 withRepeat animations per screen exhausts UI thread budget. FloatingLettersLayer uses 12 — the ambient headroom per screen is limited. Prevention: budget strictly, use static SVG for visual complexity that does not require frame-by-frame animation.

6. **SVG gradient stop animation** — animating stopOpacity or stopColor via useAnimatedProps is buggy cross-platform (Reanimated GitHub issue #5543). Prevention: always animate the container View, never SVG internals. WarmGlow.tsx is the reference implementation.

7. **Reanimated + New Architecture Android regression** — known regression exists in this combination on Android. Prevention: performance-profile on a mid-range Android device (Pixel 3a class) before building the full ambient system; mitigation strategy must be decided before Phase 2 begins.

---

## Implications for Roadmap

Based on feature dependencies, emotional impact per effort, and pitfall prevention ordering, four phases are recommended.

### Phase 1: Foundation (Infrastructure Before Atmosphere)

**Rationale:** Arabic clipping fix, reduce motion infrastructure, and animation tier additions are blockers for every subsequent phase. Building LetterHero on broken Arabic rendering requires rework. Building ambient animations without reduce motion support risks App Store rejection. Patching the withRepeat memory leak now prevents it from shipping. Profiling the Android regression now prevents discovering it after the animation system is fully built. These are unglamorous but non-negotiable.

**Delivers:** Safe Arabic rendering at all sizes (lineHeight audit and fix across all ArabicText usages), reduce motion infrastructure baked into all animated primitives, breathing/drift tiers added to animations.ts, WarmGlow relocated to src/design/atmosphere/, FloatingLettersLayer withRepeat memory leak patched, Reanimated/New Architecture Android regression profiled with performance baseline established.

**Addresses:** Arabic text clipping (table stakes blocker), Reduce Motion accessibility (App Store requirement), withRepeat 12-minute bug, WarmGlow relocation, animation budget baseline.

**Avoids:** Pitfalls 2 (Arabic clipping), 4 (reduce motion), 3 (withRepeat leak), 7 (Android regression discovered late).

**Research flag:** Profile Reanimated 4.2.1 + New Architecture on mid-range Android before committing to Phase 2. If regression is significant, adjust shared value budget downward and determine fallback rendering paths.

### Phase 2: Core Emotional Transformation (Highest Impact Per Effort)

**Rationale:** The answer feedback system and global ambient atmosphere are the highest-impact emotional changes per unit of effort. A user who feels punished for wrong answers or sees inconsistent backgrounds across screens cannot be retained regardless of other improvements. These changes address the most visible violations of the emotional contract. AtmosphereBackground must be built before sacred moments because sacred moments need atmospheric context to land correctly.

**Delivers:** Global AtmosphereBackground component with preset system (replaces per-screen WarmGradient hack), answer feedback overhaul (FeedbackRipple on correct, FeedbackNudge on wrong), WrongAnswerPanel redesign (cream palette, warm brown text, no X icon, hapticSelection), floating "+1" removal from QuizOption, LetterHero component with 4.5s breathing animation.

**Addresses:** Global ambient background (table stakes), correct answer feedback (table stakes), wrong answer redesign eliminating shake/red (table stakes), LetterHero breathing letter (primary differentiator).

**Avoids:** Pitfalls 1 (layout animation in atmosphere layers), 6 (SVG gradient stop animation in LetterHero/WarmGlow), 5 (SVG ID collisions), 10 (wrong easing — withTiming not withSpring for all ambient motion).

**Research flag:** Standard, well-documented patterns. WarmGlow and FloatingLettersLayer already prove the approach. No additional research needed.

### Phase 3: Sacred Moments (The Differentiators)

**Rationale:** Sacred phrase reveal, onboarding atmosphere, and streak escalation are the features no Arabic learning competitor offers. They build on the established atmosphere foundation. PhraseReveal is a shared primitive — build it once and reuse it in Bismillah display, onboarding screens, and Day 7 streak. Bismillah is display-only in this phase; the interactive micro-lesson is post-milestone.

**Delivers:** PhraseReveal primitive (reusable word-by-word staggered animation), Bismillah screen upgraded to sacred reveal (display mode, not interactive), onboarding screens (Tilawah, Hadith) using the reveal system, Streak Day 7 full-screen moment with sacred reveal + ambient background and Arabic encouragement phrase.

**Addresses:** Sacred phrase reveal (differentiator), Bismillah atmospheric upgrade (differentiator — display only), streak escalation (differentiator).

**Avoids:** Pitfall 2 (Arabic clipping — test all reveal text with full diacritics at every size), Pitfall 4 (reduce motion — PhraseReveal falls back to instant full display), Pitfall 5 (shared value budget — staggered reveal is sequential, not concurrent).

**Research flag:** Standard patterns. withDelay staggering in Reanimated is well-documented. Timing values (600-800ms per word, 300-400ms stagger) may need design iteration but the technical approach is proven.

### Phase 4: Atmospheric Completeness (Polish Layer)

**Rationale:** Home welcome, progress screen reflection, state screens, and the geometric pattern prototype round out the experience. These have the fewest dependencies and lowest risk. Geometric patterns are included here as conditional — prototype early in the phase, accept or cut based on Android performance measurement. Do not let the pattern decision block other Phase 4 deliverables.

**Delivers:** Home screen quiet welcome (entrance stagger, hero settle, 400ms background fade-in), progress screen mastery glow on letter grid (glow intensity proportional to mastery state), state screens (loading, empty, error) with atmospheric treatment and warm messaging, ambient geometric pattern prototype — accept if performance passes on mid-range Android, cut if it does not.

**Addresses:** Home quiet welcome (differentiator), progress as reflection (differentiator), inhabited state screens (table stakes), geometric patterns (conditional differentiator).

**Avoids:** Pitfall 2 (concurrent shared values — geometric patterns may remain static if animation budget is exceeded), Pitfall 9 (hardcoded dimensions — use StyleSheet.absoluteFill for all background layers).

**Research flag:** Geometric pattern performance on mid-range Android is genuinely uncertain. Prototype and measure frame rate with drift animation enabled. If a Pixel 3a class device shows drops below 55fps, cut the translateX drift and ship static patterns at 3-5% opacity.

### Phase Ordering Rationale

- Phase 1 is mandatory first because Arabic clipping and reduce motion are dependency blockers, not polish. Building visual features on incorrect typography requires rework; shipping without reduce motion risks App Store rejection.
- Phase 2 precedes sacred moments because AtmosphereBackground is the atmospheric canvas that sacred moments paint on. PhraseReveal inside an inconsistent background context loses half its emotional impact.
- Phase 3 before polish because differentiators have higher emotional ROI per effort than atmospheric completeness. A user's first sacred phrase reveal is more memorable than a smooth home screen entrance.
- Phase 4 is last because it has the fewest cross-phase dependencies and can be shortened if earlier phases run long.
- Bismillah interactive micro-lesson is explicitly excluded from all phases — it requires word segmentation data, per-word audio system integration, and tap interactivity at HIGH complexity. It belongs in a subsequent milestone after App Store submission.

### Research Flags

Phases needing deeper investigation during planning:
- **Phase 1 (Android regression):** Profile Reanimated 4.2.1 + New Architecture on mid-range Android (Pixel 3a class or equivalent) before committing to Phase 2 animation complexity. If severe, reduce per-screen shared value budget below 15.
- **Phase 4 (Geometric patterns):** Android performance for animated SVG patterns is unverified. Treat as a conditional deliverable — prototype and measure, cut drift animation if budget fails.

Phases with standard, well-documented patterns (research-phase not needed):
- **Phase 2:** WarmGlow.tsx and FloatingLettersLayer.tsx prove the approach. Answer feedback is straightforward Reanimated fire-and-forget.
- **Phase 3:** PhraseReveal with withDelay staggering is a standard Reanimated pattern with wide documentation.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | One-package recommendation (expo-blur) verified against SDK 55 compatibility. Rejections of Skia (+4-6 MB verified), Lottie (wrong use case), and Moti (abstraction with no gain) are well-reasoned. Existing stack verified against codebase. |
| Features | MEDIUM-HIGH | Table stakes derived from Headspace/Calm/Duolingo research with identified sources. Arabic typography specifics verified against active React Native issue tracker (issues open as of Jan 2026). Anti-features grounded in Emotional Design Contract. Bismillah interactive complexity is an estimate, not a measured scope. |
| Architecture | HIGH | Layered atmosphere model matches existing codebase patterns precisely. WarmGlow and FloatingLettersLayer are working proof-of-concept implementations. Data flow (zero new contexts) verified against current architecture. WarmGlow relocation need confirmed by cross-codebase usage audit (10+ components in wrong directory). |
| Pitfalls | HIGH | Layout animation cost, SVG gradient stop bugs, Arabic clipping, and withRepeat behavior all verified against official Reanimated docs and active React Native issue tracker. 12-minute withRepeat bug confirmed as existing defect in FloatingLettersLayer. Reanimated/New Architecture Android regression flagged from dedicated pitfall research. |

**Overall confidence:** HIGH

### Gaps to Address

- **Android regression severity:** Reanimated + New Architecture regression on Android is documented but severity in this codebase is unquantified. Must profile on a mid-range device before Phase 2 begins. This is the highest-stakes unknown in the entire research.
- **Geometric pattern performance:** The static SVG Pattern approach is safe (tiled, zero per-frame cost). The animated drift (translateX over 60s, single shared value) needs a prototype performance test. Flag as a cut candidate entering Phase 4 if budget is already tight from Phase 2 atmosphere work.
- **lineHeight ratios per size tier:** The 2.2-2.5x lineHeight recommendation for fully voweled Arabic applies at display sizes. Smaller sizes (arabicLarge at 36px, arabicBody at 24px) may need different ratios. Phase 1 must empirically test each size tier with "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ" rather than applying a single multiplier globally.
- **expo-blur modal boundary:** If any sacred overlays are implemented as React Native Modal components on Android, blur cannot cross the Modal boundary (SDK 55 limitation). Architecture must use absolute-positioned full-screen Views instead of Modal for any overlay that needs blur.

---

## Sources

### Primary (HIGH confidence)
- [Reanimated Performance Guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/) — layout vs transform animation costs, shared value budget
- [Reanimated useReducedMotion](https://docs.swmansion.com/react-native-reanimated/docs/device/useReducedMotion/) — accessibility implementation
- [Reanimated Accessibility Guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/) — ReducedMotionConfig
- [Reanimated useAnimatedProps SVG issues #5543](https://github.com/software-mansion/react-native-reanimated/discussions/5543) — gradient stop animation problems confirmed
- [expo-blur Documentation (SDK 55)](https://docs.expo.dev/versions/latest/sdk/blur-view/) — BlurTargetView requirement, Android Modal limitation
- [expo-blur BlurTargetView issue #44165](https://github.com/expo/expo/issues/44165) — Modal boundary limitation confirmed
- [react-native-svg USAGE.md](https://github.com/software-mansion/react-native-svg/blob/main/USAGE.md) — Pattern, RadialGradient, animation approach
- [React Native Skia Bundle Size](https://shopify.github.io/react-native-skia/docs/getting-started/bundle-size/) — 4MB Android, 6MB iOS size increase confirmed
- Existing WarmGlow.tsx and FloatingLettersLayer.tsx — confirmed working patterns in codebase

### Secondary (MEDIUM confidence)
- [React Native RTL Arabic text clipping #55220](https://github.com/facebook/react-native/issues/55220) — active bug confirmed Jan 2026
- [React Native lineHeight distribution #29507](https://github.com/facebook/react-native/issues/29507) — lineHeight clipping diacritics
- [React Native Text cut off #7687](https://github.com/facebook/react-native/issues/7687) — font ascent/descent interaction
- [React Native Android line-height #13126](https://github.com/facebook/react-native/issues/13126) — Android-specific ascent/descent
- [Amiri font project](https://aliftype.com/amiri/english.html) — OpenType features, Quranic notation support, contextual ligatures

### Tertiary (MEDIUM confidence — design research)
- [Headspace: Designing for Calm](https://blakecrosley.com/guides/design/headspace) — animation timing philosophy, atmospheric consistency, subscription ethics
- [Duolingo: Gamification as Design Language](https://blakecrosley.com/guides/design/duolingo) — quiz feedback patterns, what to borrow vs avoid
- [Duolingo Streak Milestone Design](https://blog.duolingo.com/streak-milestone-design-animation/) — +1.7% Day 7 retention from milestone animations
- [Designing a Streak System: UX and Psychology](https://www.smashingmagazine.com/2026/02/designing-streak-system-ux-psychology/) — ethical streak design, grace periods, reframing loss
- [6 Mindfulness App Design Trends 2026](https://www.bighuman.com/blog/trends-in-mindfulness-app-design) — atmospheric UI patterns in wellness apps
- [Quiz Feedback UX Patterns](https://medium.com/@maxmaier/finding-the-best-pattern-for-quiz-feedback-9e174b8fd6b8) — feedback clarity, ambiguity reduction

---
*Research completed: 2026-04-03*
*Ready for roadmap: yes*
