# Pitfalls Research

**Domain:** React Native mobile app UI overhaul (Arabic learning, Expo/Reanimated)
**Researched:** 2026-03-28
**Confidence:** HIGH (based on codebase audit, official docs, and documented community issues)

## Critical Pitfalls

### Pitfall 1: Arabic Diacritics (Harakat) Clipping with Amiri Font

**What goes wrong:**
Arabic diacritical marks (tashkeel) — fatha, kasra, damma, shadda, sukun — render above and below the baseline. The Amiri font is particularly tall with generous ascenders/descenders for these marks. When `lineHeight` is too tight, harakat get clipped, especially kasra (below-letter marks) and stacked marks like shadda+fatha. This is a known bug in both LibreOffice rendering engines and React Native's Text component. The current `ArabicText` component uses fixed lineHeight values (72, 54, 36) which may clip at certain sizes or when container views have `overflow: hidden`.

**Why it happens:**
Developers test with plain Arabic letters (no diacritics) and everything looks fine. Harakat add 30-50% to the vertical space a glyph needs. React Native's layout engine calculates text bounds based on the font metrics, but Amiri's diacritics can extend beyond reported bounds on Android.

**How to avoid:**
- Test every Arabic text component with heavily-diacritized text: use "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ" as a standard test string (contains stacked marks)
- Add vertical padding (at minimum `spacing.xs` = 4px) to any container rendering `ArabicText`, never set `overflow: hidden` on text containers
- Verify lineHeight ratios: Amiri needs at minimum 1.5x fontSize for safe diacritic rendering. Current `arabicDisplay` uses 1.5x (48 -> 72) which is the safe minimum; do not reduce these ratios
- Test on both iOS and Android — Android's text renderer handles Amiri diacritics differently than iOS

**Warning signs:**
- Arabic text appears to have the bottom cut off on quiz option buttons
- Letters with kasra (e.g. بِ) show truncated marks on Android
- QA reports "some Arabic looks fine, some looks broken" — the difference is presence of diacritics

**Phase to address:**
Phase 2 (Design System) — when typography tokens are refined. Also Phase 3 (Polish) for any new components rendering Arabic.

---

### Pitfall 2: Animation Performance Collapse on Mid-Range Android

**What goes wrong:**
Animations that run at 60fps on iOS and high-end Android drop to 15-30fps on mid-range Android devices (Samsung Galaxy A series, Xiaomi Redmi, etc.). This manifests as janky transitions, stuttery scroll interactions, and visible frame drops during celebrations. The app targets new Muslims/converts who are more likely to use budget Android devices.

**Why it happens:**
Three compounding factors in this codebase:
1. **Layout-affecting animations**: Animating `width`, `height`, `margin`, `padding`, or `top`/`left` triggers layout recalculation every frame. Only `transform` and `opacity` run on the GPU compositing layer.
2. **Too many simultaneous animated components**: The `FloatingLettersLayer` animates 15+ Arabic letters simultaneously. The `LessonGrid` serpentine path could animate 30+ nodes on entrance. Reanimated docs recommend max 100 animated components on low-end Android.
3. **New Architecture performance regression**: The app uses New Architecture (enabled in Expo 55). Reanimated 4.2.1 has known performance regressions with New Architecture. The fix requires enabling `USE_COMMIT_HOOK_ONLY_FOR_REACT_COMMITS` feature flag.

**How to avoid:**
- Exclusively animate `transform` (translateX, translateY, scale, rotate) and `opacity` — never animate layout properties
- Cap simultaneous animated components: max 20 on screen at once for Android safety
- Profile on a real mid-range Android device (Samsung Galaxy A14 or equivalent, ~$150 phone) — emulators hide GPU bottlenecks
- Enable `USE_COMMIT_HOOK_ONLY_FOR_REACT_COMMITS` in react-native-reanimated config for New Architecture
- Use `cancelAnimation()` on shared values when components unmount — leaked animations accumulate
- For celebration effects, prefer a single Reanimated component with transforms over many small particle components

**Warning signs:**
- Dev says "animations look great" but only tested on iPhone 15 or Pixel 8
- Celebration screens trigger visible jank
- FloatingLettersLayer causes entrance delay on onboarding
- JS thread usage spikes during transitions (visible in Flipper/React DevTools profiler)

**Phase to address:**
Phase 4 (Transitions/Animations) — must be the final phase because it is the easiest to regress. Performance budget should be established in Phase 1.

---

### Pitfall 3: Big-Bang Visual Changes Break User Mental Models

**What goes wrong:**
Changing too many screens simultaneously causes existing users to feel lost. They open the app after an update and cannot find familiar features. Navigation patterns they relied on muscle memory for are suddenly different. Retention drops, especially for users who were mid-curriculum.

**Why it happens:**
Developers see the "before" as ugly and the "after" as beautiful, so they ship everything at once. But users who have been using the app for weeks have built spatial memory — "the lesson I was on is in the middle of the screen, I swipe to progress." Moving things breaks that.

**How to avoid:**
- Preserve the information architecture: tab order (Home, Progress), lesson grid position, and navigation flows must not change
- Keep the same color palette (already planned — green/gold/cream stays)
- Phase the rollout: structure first (spacing/layout), then visual design (colors/type refinement), then polish (new components), then motion (transitions) — exactly the 4-phase plan in the spec
- Never move a primary CTA to a different position on the same screen between phases
- If the home screen lesson grid changes layout (e.g., serpentine to cards), ensure lesson position maps are preserved so the same lesson is still roughly in the same scroll position

**Warning signs:**
- Support messages like "where did X go?" after an update
- User engagement metrics (session length, lessons completed) drop after a UI release
- A/B test shows new UI has worse retention than old

**Phase to address:**
All phases — but Phase 1 (Structure) must be especially careful because it changes layout bones. Phase 1 should change spacing and consistency only, never move elements to new positions.

---

### Pitfall 4: RTL Text Inside LTR App Layout Causes Invisible Alignment Bugs

**What goes wrong:**
The app is an LTR app (English UI) that displays RTL content (Arabic text). This mixed-directionality creates subtle alignment bugs. Text aligns incorrectly when containers use `flexDirection: 'row'`. Padding that looks correct on one side is on the wrong side. New UI components added during the overhaul inherit the wrong text direction. On Android, if the device language is set to Arabic, `I18nManager.forceRTL(false)` does not work reliably (documented React Native bug), causing the entire layout to flip.

**Why it happens:**
The current codebase handles this correctly in a few places (`ArabicText` sets `writingDirection: 'rtl'`, exercise components use `flexDirection: 'row-reverse'`), but these are hand-coded per component. During a UI overhaul, new components are created that render Arabic text without inheriting these RTL-aware patterns. Developers test on English-language devices and never see the issue.

**How to avoid:**
- Centralize RTL handling: every component that renders Arabic MUST use the `ArabicText` component, never raw `<Text>` with Arabic strings
- Create a design system rule: any flex row containing Arabic content uses `flexDirection: 'row-reverse'`
- Test on a device with system language set to Arabic — this triggers Android's aggressive RTL forcing
- Add `I18nManager.forceRTL(false)` and `I18nManager.allowRTL(false)` in app entry point to prevent system RTL from flipping the whole layout
- Document which components are RTL-aware in the design system

**Warning signs:**
- Arabic text aligns left instead of right in new components
- Quiz options with Arabic content have uneven padding
- Layout looks completely mirrored when tested on Arabic-language device
- Numbers mixed with Arabic text render in wrong order

**Phase to address:**
Phase 2 (Design System) — establish RTL rules in the design system. Phase 3 (Polish) — audit all new components for RTL correctness.

---

### Pitfall 5: Regression of Existing Working Features During Overhaul

**What goes wrong:**
The UI overhaul touches 17+ files across all screens (per Phase 1 spec). Changing spacing, layout, and component structure in onboarding, home, progress, and quiz flows simultaneously creates a high surface area for regressions. A spacing change in `OnboardingStepLayout` breaks the footer CTA on one step. A token replacement in `LessonGrid` causes the serpentine path to misalign. The quiz options grid wraps incorrectly at the new maxWidth. These regressions ship because there are zero component tests and zero screen tests.

**Why it happens:**
The codebase has 9 test files covering only engine logic. Zero components, hooks, screens, or navigation paths are tested. The overhaul changes visual code exclusively — exactly the untested parts. There is no CI pipeline to catch regressions. The only safety net is manual testing (`npm run validate` checks types and lint only).

**How to avoid:**
- Before starting Phase 1, add snapshot tests for every screen being modified (onboarding steps, home, progress, quiz). Even basic `render()` + `toJSON()` catches crashes.
- Run the full app through every screen manually after each phase, with a checklist:
  - [ ] Onboarding completes end-to-end (all 8 steps)
  - [ ] Home screen shows lesson grid correctly
  - [ ] A lesson can be started, completed, and scored
  - [ ] Progress screen shows accurate mastery data
  - [ ] Return user flow works (skip onboarding)
- Add a pre-commit hook running `npm run validate` (already exists but not enforced)
- Consider adding visual regression screenshots using Maestro or Detox for key screens

**Warning signs:**
- "It builds and typechecks" becomes the only quality gate
- Developers skip manual testing of unchanged screens
- Bug reports come from screens that "weren't supposed to change"

**Phase to address:**
Pre-Phase 1 — testing infrastructure should be added before the overhaul begins, not during or after.

---

### Pitfall 6: Shared Value Reads on JS Thread Causing Stalls

**What goes wrong:**
Accessing `sharedValue.value` in a React component's render path or in a `useEffect` blocks the JavaScript thread until the value is fetched from the UI thread. In an animation-heavy overhaul, this becomes common: developers read animation progress to conditionally render, check if an animation completed, or derive state from animated values. Each read is a synchronous bridge cross. Stack enough of them (e.g., 8 onboarding steps each reading animation state) and the JS thread stalls visibly — buttons stop responding, navigation delays by 200-400ms.

**Why it happens:**
Reanimated's API makes it easy to read `.value` anywhere. The performance cost is invisible in development (same-device bridge) but real on production Android. The current codebase uses `useSharedValue` and `useAnimatedStyle` correctly in most places, but the overhaul will add many more animated components.

**How to avoid:**
- Never read `sharedValue.value` outside of a worklet or `useAnimatedStyle`
- Use `runOnJS` to callback from worklet to JS when animation completes, instead of polling `.value`
- Use `useDerivedValue` for any computation that depends on shared values
- Lint rule: flag any `.value` access that is not inside `useAnimatedStyle`, `useDerivedValue`, or a `'worklet'` function
- For conditional rendering based on animation state, use `useAnimatedReaction` to set regular React state

**Warning signs:**
- Button presses feel delayed after animations start
- Navigation between screens stutters
- Profiler shows "JS thread blocked" spikes during animated transitions

**Phase to address:**
Phase 4 (Transitions) — when the most animation code is written. Establish the pattern in Phase 1 if any timing adjustments involve shared values.

---

### Pitfall 7: Design Token Drift During Multi-Phase Overhaul

**What goes wrong:**
In a 4-phase overhaul spanning weeks/months, design tokens evolve. Phase 1 standardizes spacing. Phase 2 adds new typography presets. Phase 3 adds new component tokens. If earlier phases hardcode values that should reference tokens added in later phases, you end up with a codebase where some files use old patterns and some use new ones. The design system becomes inconsistent again — the exact problem the overhaul was supposed to fix.

**Why it happens:**
Each phase has its own scope ("Phase 1 does not change token definitions"). This is correct for scope control, but it means Phase 1 code will need to be revisited when Phase 2 adds role-based typography presets (like `pageTitle`, `sectionHeader` — already defined in tokens.ts but not yet applied). Without a plan to backfill, the debt accumulates.

**How to avoid:**
- Plan a "token reconciliation" pass at the end of Phase 2 and Phase 4
- When Phase 2 introduces new tokens, include a checklist of Phase 1 files that should adopt them
- Use a `TODO(phase-N)` comment convention: `// TODO(phase-2): replace heading2 with pageTitle`
- Keep a running list of "deferred token adoption" items per phase
- Phase 4 should end with a full token audit: every spacing value, color, and typography preset in the codebase should reference a token

**Warning signs:**
- New token presets exist in `tokens.ts` but are used in zero files
- Some screens use `heading2` while similar screens use `pageTitle` for the same visual role
- Spacing audit finds raw numbers that were added during Phase 3

**Phase to address:**
Phase 2 (Design System) introduces the most new tokens. Phase 4 should include a reconciliation pass as its final step.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `FadeIn`/`FadeOut` layout animations for all transitions | Quick to implement, looks decent | Cannot customize easing, cannot synchronize with gesture state, creates jarring layout shifts when entering/exiting components | Acceptable for simple content reveals; replace with shared value animations for interactive or gesture-linked transitions |
| Inline `Animated.View` wrappers around every element | Fast way to add entrance animations | Every wrapper is an extra view in the render tree, degrades Android performance, makes layout debugging harder | Acceptable for max 5-6 elements per screen; beyond that, use staggered groups |
| Copying animation timing values instead of referencing presets | Faster than importing, "just this one time" | Animation rhythm becomes inconsistent again (the pre-Phase-1 state), maintenance burden increases | Never — always reference `animations.ts` presets |
| Using `setTimeout` for animation sequencing | Works for simple delays | Not cancellable, races with navigation, fires after component unmount causing state-update-on-unmounted warnings | Never — use Reanimated `withDelay` or `withSequence` instead |
| Skipping `React.memo` on list items during overhaul | "We'll optimize later" | LessonGrid with 30+ items re-renders all nodes on any state change; jank on scroll compounds with animation jank | Never for list items — always memo. Acceptable for components rendered once per screen |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Reanimated 4 + New Architecture | Assuming performance parity with Legacy Architecture | Enable `USE_COMMIT_HOOK_ONLY_FOR_REACT_COMMITS` feature flag; test on real devices; Reanimated 4.2.1 docs acknowledge the regression |
| Expo Router + Animated transitions | Wrapping screen components in `Animated.View` breaks Expo Router's layout expectations | Use Reanimated layout animations on inner content, not the screen container. Expo Router manages screen transitions via its own stack navigator |
| Amiri font + `numberOfLines` prop | Setting `numberOfLines={1}` on Arabic text clips diacritics vertically | Avoid `numberOfLines` on Arabic text; if truncation needed, use character-level truncation in JS before rendering |
| react-native-svg + Reanimated | Animating SVG path properties through Reanimated shared values | Use `AnimatedProps` from `react-native-reanimated` with SVG components. Direct `.value` assignment to SVG props does not trigger native updates |
| PostHog analytics + screen transitions | Tracking screen views in component mount effects fires before transition completes, recording wrong screen | Track screen views in `onTransitionEnd` callback or after a `requestAnimationFrame` delay |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| FloatingLettersLayer rendering 15+ animated views | Onboarding entrance takes 500ms+, visible jank on step transition | Reduce to 8-10 letters; use `opacity: 0` to hide off-screen letters instead of conditional rendering | Any device under ~$200, or any device after 2+ hours of use (thermal throttling) |
| Full `loadProgress()` (6 queries) after every UI interaction | 200ms+ freeze after completing a quiz question on older devices | Return updated state from mutation functions instead of re-querying everything | After 100+ mastery records (intermediate learner) |
| LessonGrid rendering all 30+ lessons without virtualization | Scroll jank, especially with SVG icons per lesson node | Use `FlatList` or `FlashList` instead of `ScrollView` + `.map()` for the lesson list; or `React.memo` every node | Immediately on low-end Android; after 30+ lessons on mid-range |
| Mounting new `Animated.View` per quiz question (enter/exit animation) | Memory leak — each question creates new shared values that are not cleaned up | Reuse a single animated container; swap content via state, animate with `withTiming` on existing shared values | After 10+ questions in a single lesson session |
| Shadow rendering on Android | `elevation` + complex card shapes cause GPU overdraw; shadows on transparent backgrounds double-render | Use `shadows.card` sparingly on Android; prefer subtle `borderWidth` + `borderColor` for card separation on Android; shadows are cheap on iOS | Any screen with 5+ elevated cards visible simultaneously |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Celebration animations blocking progression | User completes a question but cannot tap "Next" for 1-2 seconds while confetti plays | Make celebrations non-blocking: animate in parallel with enabling the next-action button, or allow tap-through |
| Over-animating Arabic text | Letters bounce/scale during reveal but diacritics become unreadable at non-1.0 scale | Arabic text should fade in (opacity only), never scale or rotate. English UI elements can bounce |
| Inconsistent haptic feedback | Some interactions vibrate, others do not; users cannot predict what will give feedback | Define a haptic policy: correct answer = light impact, wrong answer = notification error, milestone = medium impact. Apply consistently or not at all |
| Onboarding length perception | 8 steps feels long to anxious new users, especially if animations add 15+ seconds of wait time | Keep total onboarding under 90 seconds with animations. Each step's entrance animation should be under 2 seconds. The progress bar must be visible from step 1 |
| Golden accent overuse | Gold (#C4A464) used for every emphasis, highlight, and decoration dilutes its impact | Reserve gold for: active/selected states, achievement badges, and sacred text highlights only. Use `primaryLight` for general emphasis |

## "Looks Done But Isn't" Checklist

- [ ] **Arabic diacritics:** Test every Arabic display with full tashkeel string "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ" — verify no clipping on both platforms
- [ ] **Android mid-range test:** Run full app flow on a device under $200 — onboarding through lesson completion, watch for frame drops
- [ ] **RTL device test:** Test on a device with system language set to Arabic — verify app stays LTR and Arabic text renders correctly
- [ ] **Keyboard interaction:** Quiz screens with text input must handle keyboard appearance without hiding the input field or breaking animations
- [ ] **Long Arabic text:** Test with longest lesson content (connected reading passages) — verify text does not overflow containers
- [ ] **Safe area:** All screens must respect safe area insets on notched devices (iPhone 14+, Samsung S24) — footer CTAs must not overlap home indicator
- [ ] **Dark mode tokens:** Even though dark mode is deferred, verify that `useColors()` is used everywhere instead of direct color values — so dark mode activation later is a single toggle
- [ ] **Font loading failure:** Test what happens when Amiri/Inter/Lora fonts fail to load — current `app/_layout.tsx` blocks on font loading, but verify fallback behavior
- [ ] **Animation cancellation:** Navigate away from a screen mid-animation (e.g., back during onboarding) — verify no "state update on unmounted component" warnings
- [ ] **Orientation lock:** Verify portrait lock is maintained on all new/modified screens — some Android devices may rotate to landscape during transitions

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Arabic clipping | LOW | Add padding to affected containers, increase lineHeight ratios — no architecture change needed |
| Android performance collapse | MEDIUM | Audit animated component count, replace layout animations with transform-only, reduce FloatingLettersLayer — may require rethinking celebration designs |
| User mental model break | HIGH | Cannot un-ship a confusing update; must hotfix with guidance (tooltips, "what's new" screen) or revert |
| RTL alignment bugs | LOW | Add `writingDirection: 'rtl'` and fix `flexDirection` on affected components — mechanical fixes |
| Feature regression | MEDIUM | Depends on what broke; if caught before release, easy fix; if shipped, requires hotfix build through EAS |
| Shared value JS reads | LOW | Replace `.value` reads with `useAnimatedReaction` or `runOnJS` — mechanical refactor |
| Token drift | MEDIUM | Requires a dedicated audit pass; the longer it is deferred, the more files need updating |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Arabic diacritics clipping | Phase 2 (Design System) | Render test with full-tashkeel string on both platforms |
| Android animation performance | Phase 4 (Transitions) | 60fps verified on Galaxy A14 or equivalent; Flipper profiler shows no JS thread blocks |
| User mental model break | Phase 1 (Structure) | Existing user can complete their current lesson without confusion after update |
| RTL in LTR app | Phase 2 (Design System) | Design system documents RTL rules; tested on Arabic-language device |
| Feature regression | Pre-Phase 1 | Snapshot tests exist for all modified screens; manual QA checklist executed per phase |
| Shared value JS reads | Phase 4 (Transitions) | No `.value` reads outside worklets; grep audit passes |
| Token drift | Phase 2 + Phase 4 end | Token audit finds zero raw values in component files; all tokens in `tokens.ts` have usage |
| Celebration blocking UX | Phase 3 (Polish) | User can tap "Next" within 500ms of completing a question |
| Over-animating Arabic | Phase 4 (Transitions) | Arabic text only uses opacity animations, never scale/rotate |
| FloatingLettersLayer perf | Phase 4 (Transitions) | Max 10 animated letters; onboarding entrance under 300ms on Android |

## Sources

- [Reanimated Performance Guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/) — official docs on animation limits, shared value pitfalls, New Architecture regressions
- [React Native RTL Arabic text clipping (Issue #55220)](https://github.com/facebook/react-native/issues/55220) — active bug report on Arabic text clipping in RTL mode
- [I18nManager forceRTL not working (Issue #32915)](https://github.com/facebook/react-native/issues/32915) — documented bug with Arabic device language forcing RTL
- [Amiri font tashkeel cropping (Bug #85426)](https://bugs.documentfoundation.org/show_bug.cgi?id=85426) — Amiri-specific diacritics clipping issue
- [Callstack: 60fps Animations in React Native](https://www.callstack.com/blog/60fps-animations-in-react-native) — practical guide to animation performance
- [Expo Blog: Reducing Lag in Expo Apps](https://expo.dev/blog/best-practices-for-reducing-lag-in-expo-apps) — official Expo performance guidance
- [Callstack: Performance Regression Testing](https://www.callstack.com/blog/performance-regression-testing-react-native) — preventing UI regressions
- Codebase audit: `.planning/codebase/CONCERNS.md` — known issues with error handling, type safety, performance bottlenecks

---
*Pitfalls research for: Tila UI Overhaul (Expo/React Native Arabic learning app)*
*Researched: 2026-03-28*
