# Feature Landscape: Emotional UI Design for Arabic Learning

**Domain:** Atmospheric/emotional mobile UI for a sacred-text learning app
**Researched:** 2026-04-03
**Overall confidence:** MEDIUM-HIGH (patterns well-established from Headspace/Calm/Duolingo research; Arabic typography specifics verified against codebase and React Native issue tracker)

---

## Table Stakes

Features users expect from an app that claims to feel warm, reverent, and welcoming. Missing any of these and the emotional promise falls flat -- users will feel the gap between marketing and experience.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Global ambient background** | Every atmospheric app (Calm, Headspace, prayer apps) has consistent background treatment. Without it, screens feel like different apps stitched together. | Medium | Current `WarmGradient` is a banded View hack (5 opacity layers, visible staircase). Needs true gradient or SVG-based approach applied globally via a shared layout wrapper, not per-screen. Headspace never shows a raw white/cream background -- every surface has atmospheric treatment. |
| **Consistent motion language** | Headspace uses 400-800ms transitions with deceleration easing. Calm uses 120-second background cycles. Apps that mix snappy and sluggish motion feel janky, not calm. | Medium | Current `animations.ts` has springs/durations for interactions (150-600ms) but nothing for atmospheric motion. Need a "breathing" tier (2-4s inhale/exhale cycles) and "drift" tier (30-60s slow movements) alongside the existing interaction tier. |
| **Arabic text never clipped** | Diacritics (harakat) clipping is an active React Native bug (issues #55220, #29507, #7687). Arabic ascenders, descenders, and vowel marks get cut off by lineHeight constraints. If a user sees their sacred text cut off, trust is destroyed instantly. | High | Current `ArabicText` uses fixed lineHeight ratios (72/100 for display, 36/54 for large, 24/36 for body). React Native clips Arabic glyphs when lineHeight is tight, especially on Android where font ascent/descent metrics interact badly with line spacing. Fix requires: (1) generous lineHeight ratios (1.5x+ for display sizes with diacritics), (2) `overflow: 'visible'` on containers, (3) per-platform testing since Android and iOS render differently. Amiri font supports Quranic notation via OpenType but RN doesn't leverage all features. |
| **Generous Arabic typography sizing** | Arabic is the content. In Quran apps and Arabic learning tools, the letter/phrase dominates the screen. Treating Arabic as body text signals disrespect for the subject matter. | Low | Current display size (72px) is good for hero positions. Quiz options use `arabicLarge` (36px) which can feel small on larger devices. Need responsive scaling or a dedicated quiz-hero size tier between display and large (e.g., 48-56px) so Arabic always feels like the primary content, never a label. |
| **Correct answer feels good (not gamified)** | Duolingo's core insight: celebration on correct answers drives retention (+1.7% Day 7 retention from milestone animations alone). Users need confirmation they got it right. Without positive feedback, correct answers feel like nothing happened. | Medium | Current implementation: pulse (150ms) + glow + floating "+1". The "+1" is gamified and PROJECT.md explicitly calls for its removal. The glow pulse is good but too brief. Need warm feedback that lingers 400-600ms (Headspace timing philosophy: longer durations reinforce calm). Haptic should be `selection` weight, not aggressive `success`. |
| **Wrong answer doesn't punish** | Duolingo's "failure feels safe" principle. Their weekly review quizzes removed point penalties entirely and saw 65% adoption. Users learning sacred text are already vulnerable -- punishment drives them away. | Medium | Current: shake animation (5 oscillations, 50-70ms each) + red `dangerLight` (#FCE6E5) background + X icon + `hapticError`. This directly contradicts the Emotional Design Contract ("no red flash, no shake, no punishment"). Every element -- shake, red, X, error haptic -- needs replacement. |
| **Reduce Motion accessibility** | iOS and Android both expose reduce-motion preferences. Apple rejects apps that ignore accessibility. Headspace disables all ambient animation for reduce-motion users. Not optional. | Low | Not yet implemented. All breathing/drifting/floating animations must check `useReduceMotion()` from Reanimated (already available) and fall back to opacity-only transitions. Static warm backgrounds replace animated ones. |
| **Loading/empty/error states feel inhabited** | Headspace principle: every screen is part of the same world. A raw spinner or "No data" text breaks the atmosphere like a fluorescent light in a mosque. | Low | Current `AppLoadingScreen`, `EmptyState`, `ErrorFallback` exist but are utilitarian. Apply the global ambient background, use warm messaging ("Preparing your lesson..." not "Loading..."), match the typography hierarchy. Minimal effort, high atmospheric impact. |

## Differentiators

Features that make users feel "this app was made for me." Not expected from a learning app, but they create the mosque-like quality described in the Emotional Design Contract. These are competitive advantages no Arabic learning competitor offers.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **LetterHero: breathing Arabic letter** | Arabic letters as "living presences" -- breathing, glowing softly, inviting. This IS the emotional core. Every Arabic learning app shows static letters on cards. Tila shows them as living characters. A user seeing a letter breathe for the first time will know this app is different. | Medium | Current `LetterPrompt` in `QuizQuestion.tsx` has a circle + `WarmGlow` + display-size Arabic -- a good starting point. Upgrade: slow breathing scale cycle (inhale 2s, hold 0.5s, exhale 2s -- matching meditative rhythm, same 4-2-6 pattern Headspace uses physiologically), warm gold glow that pulses with the breath, letter that feels alive. Use Reanimated shared values on UI thread for 60fps. The glow uses existing `WarmGlow` SVG radial gradient which already avoids banding. |
| **Sacred phrase reveal (word-by-word)** | Bismillah, Tilawah, Hadith screens show sacred text. Revealing word-by-word with staggered fade-in creates "the text is speaking to you." No competitor does this -- they dump the full phrase at once. Staggered text reveal is a well-established web pattern (used by Framer, shadcn) but almost no mobile app applies it to sacred content. | Medium | Pattern: each word fades in over 600-800ms with 300-400ms stagger between words. Opacity 0 to 1 + subtle translateY (8px to 0). Transliteration appears beneath each word as it reveals. Meaning line fades in last with longer delay. Current `BismillahMoment` does a single FadeIn for the entire phrase -- the upgrade is word-level decomposition. Requires splitting Arabic phrases into word arrays with per-word transliteration data. |
| **Warm ripple on correct answer** | Instead of pulse + "+1", a warm gold ripple expands from the tapped option outward, like a stone dropped in still water. Organic, not arcade. Feels like the app is responding to your touch with warmth, not scoring points. | Medium | Implementation: circular SVG overlay expanding from tap point coordinates. Gold (#C4A464) at 15-20% opacity, expanding radius over 500ms with Easing.out(cubic), fading as it grows. Accompanied by `hapticSelection` (softer than current `hapticSuccess`). The ripple origin from the actual touch point makes it feel responsive to the human, not a canned animation. |
| **Encouraging nudge on wrong answer** | Replace shake + red with: option briefly dims (opacity 1 to 0.7 to 1 over 200ms), then the correct answer illuminates with warm gold glow and border. Bottom panel slides up in cream (#F5EDDB) with encouragement copy and no X icon. The wrong answer literally guides you to the right one -- "not yet, but look here." | Medium | Current `WrongAnswerPanel` uses `dangerLight` (#FCE6E5) bg, `danger` (#BD524D) X icon, `dangerDark` (#7A2E2B) text. Replace with: `accentLight` (#F5EDDB) bg, warm brown text (`brown` #3D2B1F), no X icon. Replace `hapticError` with `hapticSelection`. The encouragement copy already exists via `WRONG_ENCOURAGEMENT` from the engine -- good messages, wrong visual wrapper. |
| **Streak escalation with dignified milestones** | Streaks escalate in emotional weight, not gamification loudness. Day 3: quiet text acknowledgment. Day 5: warmer acknowledgment with soft glow. Day 7: dignified full-screen moment with breathing Arabic phrase and ambient warmth. The Smashing Magazine article identifies the critical design tension: streaks should celebrate what was accomplished, never guilt what was missed. | Low | Current `StreakMilestoneOverlay` already has 3/5/7 tiers with Arabic "Masha'Allah" at Day 7 -- solid foundation. Upgrades: (1) Day 7 gets the sacred reveal treatment (Arabic phrase fades in word-by-word), (2) Day 7 uses the global ambient background instead of flat `#F8F6F0`, (3) Auto-dismiss timing (1.6s/2.2s) is correct -- not too long, not too short. The existing ring pulse and emoji are tasteful already. |
| **Bismillah as micro-lesson** | Transforms a 4-second splash into a teaching moment. Word-by-word Arabic + transliteration + meaning. "This is sacred, AND you're about to be able to read it yourself." No Quran learning app makes the Bismillah interactive for absolute beginners. This is the moment where a new Muslim realizes "I can do this." | High | Requires: (1) word-level segmentation of Bismillah into 4 semantic units: Bismi / Allahi / Ar-Rahmani / Ar-Raheem, (2) per-word transliteration strings, (3) per-word meaning strings, (4) tap-to-hear per word using existing audio system, (5) sacred reveal animation per word. Current `BismillahMoment` is display-only with a 4-second auto-advance. This upgrade is substantial but emotionally pivotal -- it's the first promise of the app's value. |
| **Ambient geometric patterns** | Islamic geometric patterns as barely-visible background texture at 3-5% opacity. Like patterns in mosque architecture -- present whether you notice them or not. Adds subliminal cultural resonance without decoration. The Emotional Design Contract says "patterns exist whether you notice them or not." | High | Implementation: SVG pattern tile with simple 8-pointed star or basic tessellation, rendered once and tiled. Must be extremely subtle (3-5% opacity) and must not compete with content. Performance concern: complex SVG paths on mid-range Android can drop frames. Needs prototype + performance test early. If performance budget doesn't allow, a static PNG tile at low opacity is the fallback. Optional: slow drift (translateX over 60s) for living quality. |
| **Home screen quiet welcome** | First 2 seconds feel like entering a calm room. Not a dashboard, not a feed. Warm background settles in, hero card fades up gently, lesson grid appears with stagger. The absence of urgency IS the feature. Headspace's home surfaces one recommended action -- reduces decision fatigue. | Low | Current home has `HeroCard` and `LessonGrid`. Upgrade: 400ms warm background fade-in on mount, hero card slides up with `gentle` spring (stiffness 200, damping 22 -- already defined in `animations.ts`), grid items stagger in with `normal` stagger (80ms delay, 400ms duration -- also already defined). This is mostly about applying existing primitives intentionally, not building new ones. |
| **Progress screen as reflection** | Instead of stats-forward design, lead with "letters you've learned" displayed beautifully in Arabic, with mastery indicated by glow intensity rather than progress bars. The letters the user has mastered glow warmly; unlearned letters are faint. It's a visual representation of their journey, not a report card. | Medium | Current progress has `StatsRow`, `PhasePanel`, `LetterMasteryGrid`. The grid currently shows letters -- upgrade by adding warm glow proportional to mastery level (not_started = no glow, retained = full warm glow at 30% opacity). Stats row becomes secondary, moved below the letter display. Reuses `WarmGlow` component at varying intensities. |

## Anti-Features

Features to deliberately NOT build. These violate the Emotional Design Contract or introduce gamification that undermines the sacred, welcoming tone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Confetti / particle explosions** | Arcade energy. Duolingo uses confetti because they're a game. Tila is a sanctuary. Confetti at a mosque would be bizarre. The Emotional Design Contract says "beauty that doesn't perform." Confetti performs. | Warm ripple + soft glow. Celebration through light, not debris. |
| **Floating "+1" score indicator** | Gamification. Reduces sacred learning to point accumulation. Already identified for removal in PROJECT.md. Makes every correct answer about earning, not learning. | Remove entirely. The warm ripple IS the feedback. No numeric score display during quiz flow. |
| **Shake animation on wrong answer** | Physically aggressive feedback. Five oscillations of horizontal shake + error haptic for someone trying to learn their sacred text. Contradicts "Close! energy" and "softness as welcome." | Gentle opacity dip (1 to 0.7 to 1 over 200ms) with `hapticSelection`. The option briefly dims, then the correct answer illuminates. Guidance, not punishment. |
| **Red/danger coloring on wrong answers** | Red universally signals stop, error, danger, failure. Wrong answers in sacred text learning should feel like "not yet" not "wrong." The current `dangerLight` (#FCE6E5) and `danger` (#BD524D) palette creates a clinical, punitive feeling. | Warm tones only: `accentLight` (#F5EDDB) for panel background, `brown` (#3D2B1F) for text, `accent` (#C4A464) for emphasis borders. The wrong answer panel should feel like part of the warm space, not an intrusion. |
| **Streak loss anxiety messaging** | "You lost your streak!" exploits loss aversion. The Smashing Magazine streak design article explicitly calls out apps that "sell solutions to anxiety that your product created." For someone reconnecting with their faith, guilt about missing a day is spiritually harmful. | "You showed up for X days. That's beautiful." Always celebrate what was accomplished. Never mention what was lost. Grace periods or gentle decay over hard resets. |
| **Countdown timers / urgency** | Headspace explicitly avoids countdown timers for subscriptions. Their founder said "a meditation app that uses dark patterns undermines everything it stands for." Same applies to sacred learning. The "Maybe Later" option must always be visible and unambiguous. | No limited-time language anywhere. Subscription prompts are invitations, not ultimatums. |
| **Complex parallax / 3D effects** | Performance killer on mid-range Android (constraint from PROJECT.md). Also: flashy effects "perform" -- they say "look at this" instead of being ambient. The design contract says "beauty that doesn't perform." | Simple opacity + translateY for depth layering. Stacked 2D layers with varying opacity create depth perception without GPU overhead. |
| **Sound effects on every interaction** | Arcade energy. Beeps and boops belong in games. The audio space in this app should feel quiet and intentional, like a mosque where sounds have meaning. | Audio only for: letter pronunciation (pedagogical), sacred moments (Bismillah audio via existing `playSacredMoment`), and a gentle completion tone at lesson end. Button taps use haptics only, no audio. |
| **Achievement badges / trophies** | Gamification of sacred learning. "You earned the Gold Alif badge!" trivializes the spiritual journey. Badges reduce intrinsic motivation to extrinsic reward-seeking. | Milestone moments use Arabic phrases of encouragement (Masha'Allah, Alhamdulillah) that ARE the reward -- the learner recognizes sacred words they're learning. The recognition itself is the achievement. |
| **Leaderboards / social comparison** | Competition has no place in spiritual learning. Comparing progress creates shame -- the opposite of "a space for the uncertain." A convert who's on lesson 3 while others are on lesson 30 would feel exactly the alienation the app promises to prevent. | If social features come later, focus on encouragement ("Your friend started learning too!") and shared journey, never ranking or comparison. |
| **Skeleton screens with shimmer** | Generic tech pattern that screams "app loading data." Breaks atmosphere. The shimmer animation is attention-grabbing where the app should be settling. | Warm fade-in from the background color. Content appears gently, as if it was always there but just became visible. |

## Feature Dependencies

```
Arabic Clipping Fix ──────> LetterHero (display-size Arabic with diacritics must never clip)
                    ──────> Sacred phrase reveal (Bismillah vowel marks)
                    ──────> Quiz options (Arabic answer text at 36px)
                    ──────> Progress letter grid (all 28 letters displayed)

Global Ambient Background ──> Home screen quiet welcome (needs atmospheric context)
                          ──> Progress screen reflection (needs warm backdrop)
                          ──> State screens polish (loading, empty, error)
                          ──> Sacred phrase reveal (needs atmospheric context)
                          ──> Streak Day 7 full-screen (needs ambient backdrop)

Breathing Animation Tier ──> LetterHero (uses 4.5s breathing cycle)
(added to animations.ts)  > Ambient background drift (uses 30-60s slow motion)
                          > Sacred phrase reveal (uses slow stagger timing)
                          > WarmGlow pulse (currently hardcoded, should use shared timing)

Reduce Motion ────────────> Global Ambient Background (fallback to static gradient)
                          > LetterHero breathing (fallback to static letter + glow)
                          > Sacred phrase reveal (fallback to instant display)
                          > Streak celebrations (fallback to opacity-only)
                          > Home/Progress entrance animations (fallback to instant)

Answer Feedback Overhaul ─> QuizOption redesign (remove +1, remove shake, add ripple)
(warm ripple + nudge)     > WrongAnswerPanel redesign (cream not red, no X icon)
                          > Correct answer ripple component (new SVG primitive)

Sacred Phrase Reveal ─────> Bismillah micro-lesson (uses reveal system + adds interactivity)
                          > Onboarding atmosphere (Tilawah, Hadith use reveal)
                          > Streak Day 7 Arabic phrase (uses reveal for Masha'Allah)
```

## MVP Recommendation

Build in this order, based on dependencies and emotional impact per effort:

**Phase 1 -- Foundation (unblocks everything else):**
1. Arabic clipping audit and fix (global lineHeight + overflow fixes)
2. Global ambient background system (replace WarmGradient, create shared layout wrapper)
3. Breathing/drift animation tier added to `animations.ts`
4. Reduce Motion infrastructure (`useReduceMotion` checks in all animated primitives)

**Phase 2 -- Core emotional transformation (highest user-facing impact):**
1. LetterHero component (breathing letter with harmonized warm glow)
2. Answer feedback overhaul: warm ripple on correct, encouraging nudge on wrong
3. WrongAnswerPanel redesign: cream palette, no X icon, warm brown text
4. Remove floating "+1" indicator from QuizOption

**Phase 3 -- Sacred moments (the differentiators):**
1. Sacred phrase reveal system (reusable word-by-word animation primitive)
2. Bismillah micro-lesson upgrade (word-by-word + transliteration + meaning + tap-to-hear)
3. Onboarding atmosphere upgrade (Tilawah, Hadith screens use sacred reveal)
4. Streak Day 7 escalation (full-screen with sacred reveal + ambient background)

**Phase 4 -- Atmospheric completeness (polish layer):**
1. Home screen quiet welcome (entrance stagger, hero settle)
2. Progress screen as reflection (mastery glow on letter grid)
3. State screens (loading, empty, error with atmospheric treatment)
4. Ambient geometric patterns (prototype early, cut if Android performance fails)
5. Contrast and touch-target accessibility audit

**Defer to post-milestone:**
- Geometric patterns: HIGH complexity, uncertain Android performance. Prototype in Phase 1 to validate, but don't depend on it.
- Frosted glass/blur effects: expo-blur exists but adds visual noise. The warm gradient approach is more aligned with "cleanliness as reverence."

## Sources

- [Headspace: Designing for Calm](https://blakecrosley.com/guides/design/headspace) -- animation timing (400-800ms), color strategy (no pure black/white), atmospheric design philosophy, sleep UI patterns, subscription ethics
- [Duolingo: Gamification as Design Language](https://blakecrosley.com/guides/design/duolingo) -- quiz feedback patterns, what to borrow (celebration energy) vs avoid (gamification layer)
- [Duolingo Streak Milestone Design Blog](https://blog.duolingo.com/streak-milestone-design-animation/) -- escalation design, engagement metrics (+1.7% Day 7 retention), animation timing philosophy
- [Designing a Streak System: UX and Psychology (Smashing Magazine)](https://www.smashingmagazine.com/2026/02/designing-streak-system-ux-psychology/) -- ethical streak design, dignified vs gamified, grace periods, reframing loss as progress
- [React Native: RTL Arabic text clipping #55220](https://github.com/facebook/react-native/issues/55220) -- active bug (Jan 2026) affecting Arabic rendering in RTL mode
- [React Native: lineHeight distribution #29507](https://github.com/facebook/react-native/issues/29507) -- lineHeight clipping glyphs, differences between RN web and native
- [React Native: Text cut off when lineHeight < fontSize #7687](https://github.com/facebook/react-native/issues/7687) -- longstanding issue with font ascent/descent metrics
- [React Native: Android line-height clipping #13126](https://github.com/facebook/react-native/issues/13126) -- Android-specific ascent/descent interaction
- [Amiri font project (aliftype)](https://aliftype.com/amiri/english.html) -- OpenType features, Quranic notation support, contextual forms and ligatures
- [6 Mindfulness App Design Trends 2026](https://www.bighuman.com/blog/trends-in-mindfulness-app-design) -- atmospheric UI patterns in wellness apps
- [Streaks and Milestones for Gamification (Plotline)](https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps/) -- milestone celebration design, visual satisfaction patterns
- [Quiz Feedback UX Patterns](https://medium.com/@maxmaier/finding-the-best-pattern-for-quiz-feedback-9e174b8fd6b8) -- feedback clarity, reducing ambiguity in answer states
