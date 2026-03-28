# Phase 1: Design Foundation & Transitions - Research

**Researched:** 2026-03-28
**Domain:** React Native animation presets, haptic feedback systems, screen transitions (Expo Router / Reanimated 4)
**Confidence:** HIGH

## Summary

Phase 1 creates the foundational infrastructure that all subsequent UI phases build on: a centralized animation presets module, a haptic feedback system with named presets, and consistent screen transitions across all routes. No new screens or features are added -- this phase elevates the existing codebase by replacing scattered magic numbers with shared constants and establishing reusable patterns.

The codebase already has the core libraries installed (Reanimated 4.2.1, expo-haptics, react-native-screens 4.23). The work is primarily about organization and consistency: creating `src/design/animations.ts` for animation presets, creating a haptic utility with named presets, configuring Expo Router Stack transitions per-screen, and doing a polish pass on the 5 design system components (Button, Card, ArabicText, HearButton, QuizOption).

**Primary recommendation:** Build bottom-up: animation presets module first, then haptics utility, then component polish using those presets, then screen transition configuration in `app/_layout.tsx`. Each step depends on the previous one.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Components should feel premium but not heavy -- subtle depth via shadows and borders, clean lines, refined spacing. Not flat/minimal and not overly skeuomorphic.
- **D-02:** Button press animations should feel satisfying -- spring-based scale with slight bounce, not just a flat opacity change. Current 0.97 scale is a good start, may refine spring constants.
- **D-03:** Cards should have gentle elevation differences between resting and interactive states (not dramatic lifts).
- **D-04:** Balanced animation personality -- elegant base with occasional energy. Logic-driven: content reveals are smooth and flowing (ease curves), success/reward moments get bouncy springs, errors are quick and sharp.
- **D-05:** Default animation timing: 250-400ms for transitions, 150-250ms for micro-interactions, 500-700ms for entrance animations. Stagger delays 50-100ms between elements.
- **D-06:** Spring configs: gentle springs for UI (stiffness 200-300, damping 20-25) for general motion, snappier springs (stiffness 400-500, damping 15-20) for feedback moments.
- **D-07:** All animation presets centralized in a single shared module (`src/design/animations.ts` or similar) -- no more magic numbers in individual components.
- **D-08:** Haptics should be meaningful, not everywhere. Three tiers: (1) Light impact on interactive taps (buttons, options), (2) Success notification on correct answers / completions, (3) Error notification on wrong answers. No haptics on passive scrolling or navigation.
- **D-09:** Create a `useHaptics()` hook or haptic utility with named presets (tap, success, error, milestone) so every component uses the same patterns.
- **D-10:** Three transition types, used consistently with logic: (1) Slide-up for modal/overlay screens (lessons, celebrations), (2) Fade for in-place content changes (quiz stages, exercise switches), (3) Push/slide for forward navigation (tab switches, onboarding steps).
- **D-11:** Transition speed: gentle and flowing by default (300-400ms), faster for feedback-driven transitions like quiz answer states (150-200ms). The logic: user-initiated navigation = flowing, system responses = snappy.

### Claude's Discretion
- Animation preset module structure and naming conventions
- Specific spring constant tuning (can be refined during implementation)
- Which components need the most polish vs. which are already acceptable
- Whether to refactor existing animation code in onboarding/animations.ts or create a new shared module that supersedes it
- Token enforcement strategy (how strictly to audit existing usage)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DES-01 | All screens use consistent spacing, typography, and color tokens from the design system | Token system already complete in tokens.ts; need audit pass to replace any raw values |
| DES-02 | Design system components (Button, Card, ArabicText, HearButton, QuizOption) are polished to premium quality | All 5 components analyzed; Button and QuizOption need spring preset migration; Card needs interactive state; HearButton needs press animation |
| DES-03 | Animation timing is centralized in shared presets, not scattered across files | 8+ files with hardcoded animation values identified; new src/design/animations.ts module designed |
| DES-04 | All interactive elements have consistent haptic feedback (light tap on press, success on correct, error on wrong) | expo-haptics already in 13+ files but inconsistently; haptics utility with named presets designed |
| TRANS-01 | Screen-to-screen navigation transitions feel smooth and intentional | Expo Router Stack supports slide_from_bottom, fade, simple_push; current config partially done |
| TRANS-02 | In-screen content transitions (stage changes, exercise switches) are fluid | Lesson screen already uses FadeIn/FadeOut from onboarding/animations.ts; presets will standardize |
| TRANS-03 | Maximum 3 transition types used consistently: slide-up for modals, fade for in-place, push for navigation | react-native-screens provides all needed animation types; mapping to screens documented |
| STATE-04 | All screen transitions are smooth with no jarring jumps | Current default is fade/300ms with lessons using slide_from_bottom/400ms; need to add missing screen configs |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- No New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-reanimated | 4.2.1 | All animations: springs, sequences, entering/exiting layout animations | Already installed. withSpring for press feedback, withTiming for transitions, FadeIn/FadeOut for layout animations. Runs on UI thread at 60fps. |
| expo-haptics | ~55.0.9 | Tactile feedback: taps, success, error notifications | Already installed. Three APIs: impactAsync (3 intensities), notificationAsync (success/warning/error), selectionAsync. |
| react-native-screens | ~4.23.0 | Native screen transitions via Expo Router Stack | Already installed. Provides slide_from_bottom, fade, simple_push, slide_from_right, none animation types. |
| expo-router | ~55.0.7 | File-based routing with Stack navigator | Already installed. Stack.Screen options.animation controls per-screen transitions. |

### Supporting (No New Dependencies)

This phase requires zero new package installations. All needed functionality exists in the current dependency tree.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reanimated withSpring | Reanimated 4 CSS Transitions API (transitionProperty) | CSS API is simpler for basic state changes but less control over spring physics. Use withSpring for press feedback (needs spring feel); CSS transitions are fine for opacity/color changes. |
| Custom haptics utility | expo-better-haptics (third-party) | Adds custom pattern support but expo-haptics covers all 3 tiers needed (D-08). No benefit for this phase. |
| Reanimated layout animations | Expo Router customTransition | customTransition gives more control but is experimental. Use the stable animation prop values for reliability. |

**Installation:** None required. All dependencies are present.

## Architecture Patterns

### Recommended Project Structure (New Files Only)

```
src/
  design/
    animations.ts       # NEW: Centralized animation presets (springs, durations, staggers, easings)
    haptics.ts          # NEW: Haptic feedback utility with named presets
    tokens.ts           # EXISTING: No changes in Phase 1
    theme.ts            # EXISTING: No changes in Phase 1
    components/
      Button.tsx        # MODIFY: Use animation presets, refine spring
      Card.tsx          # MODIFY: Add interactive state with gentle elevation
      ArabicText.tsx    # REVIEW: Verify no changes needed
      HearButton.tsx    # MODIFY: Add press animation, use haptics utility
      QuizOption.tsx    # MODIFY: Use animation presets, use haptics utility
app/
  _layout.tsx           # MODIFY: Refine per-screen transition config
```

### Pattern 1: Centralized Animation Presets Module

**What:** A single `src/design/animations.ts` file that exports all spring configs, duration presets, stagger constants, and easing curves as typed constants. Components import named presets instead of hardcoding values.

**When to use:** Every component that animates anything.

**Why:** Currently 8+ files hardcode the same spring values (`{ stiffness: 400, damping: 25 }` appears in Button.tsx, QuizOption.tsx, QuizProgress.tsx). The onboarding animations.ts file has stagger/transition constants but only for onboarding. This pattern centralizes everything.

**Example:**
```typescript
// src/design/animations.ts
// Source: Derived from D-05, D-06 decisions + existing codebase patterns

import { Easing } from "react-native-reanimated";

// ── Spring Configs (for withSpring) ──

export const springs = {
  /** Press feedback: snappy, satisfying (buttons, options, tappables) */
  press: { stiffness: 400, damping: 20, mass: 0.8 },
  /** Bouncy entrance: content appearing with energy (cards, modals) */
  bouncy: { stiffness: 300, damping: 18 },
  /** Gentle settle: smooth, flowing motion (layout shifts, progress bars) */
  gentle: { stiffness: 200, damping: 22 },
  /** Quick snap: immediate response (toggles, switches) */
  snap: { stiffness: 500, damping: 25 },
} as const;

// ── Duration Presets (for withTiming) ──

export const durations = {
  /** System response: error shake, state change */
  fast: 150,
  /** Micro-interaction: button color change, icon swap */
  micro: 200,
  /** Standard transition: screen content fade, card reveal */
  normal: 300,
  /** Flowing transition: screen navigation, entrance animation */
  slow: 400,
  /** Dramatic entrance: onboarding splash, celebration */
  dramatic: 600,
} as const;

// ── Stagger Presets (for sequential element entrances) ──

export const staggers = {
  /** Fast list items: quiz options, grid nodes */
  fast: { delay: 50, duration: 300 },
  /** Normal content: onboarding elements, stats */
  normal: { delay: 80, duration: 400 },
  /** Dramatic reveal: celebration elements, splash */
  dramatic: { delay: 120, duration: 600 },
} as const;

// ── Easing Presets ──

export const easings = {
  /** Content reveals: smooth and flowing */
  contentReveal: Easing.out(Easing.cubic),
  /** Entrance: starts slow, speeds up */
  entrance: Easing.out(Easing.exp),
  /** Exit: quick start, gentle stop */
  exit: Easing.in(Easing.cubic),
  /** Symmetric: smooth both ways */
  smooth: Easing.inOut(Easing.ease),
} as const;

// ── Screen Transition Durations ──

export const screenTransitions = {
  /** Slide-up for modal screens (lessons, celebrations) */
  slideUp: 400,
  /** Fade for in-place content changes (quiz stages) */
  fade: 300,
  /** Push for forward navigation */
  push: 350,
  /** Fast feedback transitions (quiz answer states) */
  feedback: 200,
} as const;

// ── Press Animation Values ──

export const pressScale = {
  /** Standard interactive element */
  normal: 0.97,
  /** Subtle press for smaller elements */
  subtle: 0.98,
  /** Bouncy press for reward moments */
  bouncy: 0.95,
} as const;
```

### Pattern 2: Haptic Feedback Utility with Named Presets

**What:** A utility module (not a hook -- no React dependency needed) that wraps expo-haptics with semantic names matching the 3-tier system from D-08.

**When to use:** Every interactive element that needs tactile feedback.

**Why:** Currently 13+ files import expo-haptics directly and use raw API calls. The same `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` call appears in Button, HearButton, QuizOption, tab press listener, exercises, etc. A utility provides semantic naming and a single place to adjust behavior.

**Example:**
```typescript
// src/design/haptics.ts
// Source: D-08, D-09 decisions + expo-haptics API

import * as Haptics from "expo-haptics";

/** Tier 1: Light tap for interactive presses (buttons, options, cards) */
export function hapticTap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Tier 2: Success notification (correct answers, lesson complete) */
export function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Tier 3: Error notification (wrong answers) */
export function hapticError() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/** Milestone: Heavy impact for significant achievements */
export function hapticMilestone() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Selection change: subtle feedback for picker/selection changes */
export function hapticSelection() {
  Haptics.selectionAsync();
}
```

**Note:** This is a plain utility module, not a React hook. No React state needed -- haptic functions are fire-and-forget side effects. Components call `hapticTap()` instead of `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`.

### Pattern 3: Screen Transition Mapping

**What:** Configure Expo Router Stack.Screen options to map each screen route to one of exactly 3 transition types per D-10.

**When to use:** In `app/_layout.tsx` for all screen routes.

**Current state:**
- Default: `animation: "fade"`, `animationDuration: 300` (good)
- `lesson/[id]`: `animation: "slide_from_bottom"`, `animationDuration: 400` (good)
- `lesson/review`: `animation: "slide_from_bottom"`, `animationDuration: 400` (good)
- Missing explicit config for: `onboarding`, `return-welcome`, `wird-intro`, `phase-complete`, `post-lesson-onboard`

**Target mapping:**

| Screen | Transition Type | Animation Value | Duration | Rationale |
|--------|----------------|-----------------|----------|-----------|
| `(tabs)` (default) | Fade | `fade` | 300ms | In-place content change, tab switching |
| `lesson/[id]` | Slide-up | `slide_from_bottom` | 400ms | Modal/overlay -- entering a lesson |
| `lesson/review` | Slide-up | `slide_from_bottom` | 400ms | Modal/overlay -- entering review |
| `onboarding` | Fade | `fade` | 300ms | Initial screen, no "from" context |
| `return-welcome` | Fade | `fade` | 300ms | Welcome back, in-place appearance |
| `wird-intro` | Slide-up | `slide_from_bottom` | 400ms | Overlay/modal introducing concept |
| `phase-complete` | Slide-up | `slide_from_bottom` | 400ms | Celebration overlay |
| `post-lesson-onboard` | Slide-up | `slide_from_bottom` | 400ms | Modal after first lesson |

### Anti-Patterns to Avoid

- **Hardcoded animation values in components:** After creating animations.ts, all existing magic numbers must be replaced. No `{ stiffness: 400, damping: 25 }` anywhere except the presets module.
- **Direct expo-haptics imports in components:** After creating haptics.ts, components import from the utility, not directly from expo-haptics.
- **Animation logic in screen files:** Keep withSpring/withTiming calls inside components or the presets module, not in `app/` screen files.
- **Animating layout properties:** Only animate `transform` and `opacity`. Never animate `width`, `height`, `margin`, `padding` directly -- use scale transforms instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spring-based press feedback | Custom spring math in each component | Reanimated `withSpring` + shared spring configs from `animations.ts` | Spring physics is complex; Reanimated runs it on UI thread |
| Screen transitions | Custom animated screen wrappers | Expo Router Stack `animation` prop (native transitions via react-native-screens) | Native transitions are smoother than JS-driven ones; react-native-screens renders transitions on the native thread |
| Shake animation for wrong answers | Custom sine-wave or manual keyframe sequences | Reanimated `withSequence` + `withTiming` with shared duration constants | The existing shake pattern in QuizOption/TapInOrder/SpotTheBreak works well; just centralize the timing values |
| Haptic feedback abstraction | Complex hook with state management | Plain utility functions wrapping expo-haptics | Haptics are stateless fire-and-forget calls; no React state needed |

## Common Pitfalls

### Pitfall 1: Shared Value Reads on JS Thread

**What goes wrong:** Reading `sharedValue.value` in render or useEffect blocks the JS thread.
**Why it happens:** Reanimated API makes `.value` access easy everywhere but each read is a synchronous bridge cross.
**How to avoid:** Only read `.value` inside `useAnimatedStyle`, `useDerivedValue`, or worklet functions. Use `useAnimatedReaction` to sync animation state to React state when needed.
**Warning signs:** Button presses feel delayed after animations start; navigation stutters.

### Pitfall 2: Animation Performance on Mid-Range Android

**What goes wrong:** Animations drop to 15-30fps on budget Android devices.
**Why it happens:** Animating layout properties (width, height, margin) triggers layout recalculation every frame instead of running on the GPU compositing layer.
**How to avoid:** Exclusively animate `transform` (translateX, translateY, scale, rotate) and `opacity`. Cap simultaneous animated components at ~20 per screen.
**Warning signs:** Dev tests only on iPhone/Pixel and reports "looks great."

### Pitfall 3: Duplicate Haptic Calls

**What goes wrong:** A component triggers haptics in its own handler AND the parent also triggers haptics on the same press event.
**Why it happens:** Both QuizOption (has hapticTap on press) and the parent quiz component might both respond to the same interaction.
**How to avoid:** Haptic feedback should be owned by the leaf component that handles the press. Parent components should not add haptics on top of child component presses.
**Warning signs:** Double vibrations on single taps.

### Pitfall 4: Transition Duration Mismatch Between Native and Content

**What goes wrong:** The native screen transition (slide_from_bottom) takes 400ms, but the content inside the screen starts its entrance animation immediately, causing a visual clash.
**Why it happens:** Expo Router triggers the screen transition and React mounts the component simultaneously. If the component has FadeIn entering animations, they compete with the screen transition.
**How to avoid:** For screens using slide_from_bottom, do NOT add entering layout animations on the top-level content. The native transition IS the entrance. Only add entering animations for content that appears AFTER the screen is visible (e.g., staggered list items with a delay matching the transition duration).
**Warning signs:** Content appears to flicker or double-animate when navigating to a new screen.

### Pitfall 5: onboarding/animations.ts Becomes Orphaned

**What goes wrong:** Creating a new `src/design/animations.ts` while the old `src/components/onboarding/animations.ts` still exists and is imported by `app/lesson/[id].tsx` and `app/lesson/review.tsx`.
**Why it happens:** Forgetting to migrate consumers of the old file.
**How to avoid:** After creating the new presets module, update all imports from `onboarding/animations.ts` to use `design/animations.ts`. Then either delete the old file or have it re-export from the new location for backward compatibility.
**Warning signs:** Two files defining animation constants; imports split between them.

## Code Examples

### Component Polish: Button with Shared Presets

```typescript
// src/design/components/Button.tsx (after Phase 1)
// Source: Codebase analysis + D-02, D-06 decisions

import { springs, pressScale } from "../animations";
import { hapticTap } from "../haptics";

// In handlePressIn:
scale.value = withSpring(pressScale.normal, springs.press);

// In handlePressOut:
scale.value = withSpring(1, springs.press);

// In handlePress:
hapticTap();
onPress();
```

### Component Polish: Card with Interactive State

```typescript
// src/design/components/Card.tsx (after Phase 1)
// Source: D-03 decision

interface CardProps {
  children: React.ReactNode;
  elevated?: boolean;
  interactive?: boolean;  // NEW: for pressable cards
  onPress?: () => void;
  style?: ViewStyle;
}

// If interactive, wrap in AnimatedPressable with press animation
// Resting: shadows.card
// Pressed: slight scale (0.98) + shadows.card (same shadow, no dramatic lift)
// Elevated: shadows.cardLifted
```

### Screen Transition Config

```typescript
// app/_layout.tsx — target configuration
// Source: D-10, D-11 decisions + react-native-screens API

import { screenTransitions } from "../src/design/animations";

<Stack screenOptions={{
  headerShown: false,
  contentStyle: { backgroundColor: colors.bg },
  animation: "fade",
  animationDuration: screenTransitions.fade,
}}>
  {/* Modal/overlay screens: slide up */}
  <Stack.Screen name="lesson/[id]" options={{
    animation: "slide_from_bottom",
    animationDuration: screenTransitions.slideUp,
  }} />
  <Stack.Screen name="lesson/review" options={{
    animation: "slide_from_bottom",
    animationDuration: screenTransitions.slideUp,
  }} />
  <Stack.Screen name="phase-complete" options={{
    animation: "slide_from_bottom",
    animationDuration: screenTransitions.slideUp,
  }} />
  <Stack.Screen name="wird-intro" options={{
    animation: "slide_from_bottom",
    animationDuration: screenTransitions.slideUp,
  }} />
  <Stack.Screen name="post-lesson-onboard" options={{
    animation: "slide_from_bottom",
    animationDuration: screenTransitions.slideUp,
  }} />
  {/* Fade screens use the default */}
</Stack>
```

### Migrating Existing Animation Constants

```typescript
// BEFORE (scattered across files):
// Button.tsx: withSpring(0.97, { stiffness: 400, damping: 25 })
// QuizOption.tsx: withSpring(0.97, { stiffness: 400, damping: 25 })
// QuizProgress.tsx: withSpring(progressPct, { stiffness: 200, damping: 25 })
// onboarding/animations.ts: STAGGER_BASE = 150, TRANSITION_FADE_IN = 300

// AFTER (all from animations.ts):
// Button.tsx: withSpring(pressScale.normal, springs.press)
// QuizOption.tsx: withSpring(pressScale.normal, springs.press)
// QuizProgress.tsx: withSpring(progressPct, springs.gentle)
// lesson/[id].tsx: FadeIn.duration(durations.normal)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Reanimated 3 worklets for everything | Reanimated 4 CSS Animations API for declarative patterns + worklets for interactive | Reanimated 4.0 (2025) | CSS API is simpler for non-interactive animations; worklets still needed for spring-based press feedback |
| Manual animation orchestration | Layout animations (entering/exiting) on Animated.View | Reanimated 3+ | FadeIn/SlideIn handle mount/unmount animation automatically |
| Per-component haptic imports | Centralized haptic utility | Best practice pattern | Reduces inconsistency and makes policy changes trivial |

**Deprecated/outdated:**
- Moti (Reanimated wrapper): Unmaintained for 1+ year, designed for Reanimated 3. Do not use.
- react-native-animatable: JS thread animations, not compatible with New Architecture. Do not use.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (latest, installed as devDep) |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DES-01 | Token usage consistency | lint/manual | `npm run validate` (typecheck + lint) | N/A -- manual audit |
| DES-02 | Component polish renders without crash | unit | `npm test -- --run` | No -- Wave 0 |
| DES-03 | animations.ts exports all required presets | unit | `npm test -- --run` | No -- Wave 0 |
| DES-04 | haptics.ts exports all required functions | unit | `npm test -- --run` | No -- Wave 0 |
| TRANS-01 | Screen transitions configured correctly | manual | Manual navigation test | N/A -- manual |
| TRANS-02 | In-screen transitions use shared presets | manual + grep | `grep -r "duration:" src/design/components/` | N/A |
| TRANS-03 | Max 3 transition types in _layout.tsx | unit | `npm test -- --run` | No -- Wave 0 |
| STATE-04 | No jarring jumps between screens | manual | Manual navigation through all routes | N/A -- manual |

### Sampling Rate

- **Per task commit:** `npm run validate` (typecheck + lint)
- **Per wave merge:** `npm test` (full Vitest suite)
- **Phase gate:** Full suite green + manual navigation walkthrough

### Wave 0 Gaps

- [ ] `src/__tests__/animations.test.ts` -- validate animations.ts exports correct types and values for all preset categories
- [ ] `src/__tests__/haptics.test.ts` -- validate haptics.ts exports all required functions
- [ ] No component render tests needed for Phase 1 (components are modified, not created; manual visual verification is the appropriate gate)

## Project Constraints (from CLAUDE.md)

- **Test framework:** Vitest (not Jest). Tests in `src/__tests__/**/*.test.{js,ts}`.
- **Validation commands:** `npm run validate` (lint + typecheck), `npm test` (unit tests).
- **Style system:** `StyleSheet.create` -- no CSS-in-JS. Design tokens via `tokens.ts`, colors via `useColors()` hook.
- **No Redux/Zustand:** State in SQLite via hooks. Context for theme and DB only.
- **Import convention:** Named exports everywhere except Expo Router screen defaults. Relative paths (not `@/`).
- **Engine firewall:** `src/engine/`, `src/hooks/`, `src/db/`, `src/data/` are untouched -- UI overhaul operates only in `src/design/`, `src/components/`, and `app/`.
- **New Architecture:** Enabled. Reanimated 4.2.1 compatible.
- **Fonts:** Amiri (Arabic), Inter (body), Lora (headings) -- loaded in root layout.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/design/tokens.ts`, `src/design/components/Button.tsx`, `src/design/components/QuizOption.tsx`, `src/design/components/Card.tsx`, `src/design/components/HearButton.tsx`
- Codebase analysis: `app/_layout.tsx` (current transition config), `src/components/onboarding/animations.ts` (existing presets)
- Codebase grep: 8+ files with hardcoded animation values, 13+ files with direct expo-haptics imports
- [Expo Router Stack docs](https://docs.expo.dev/router/advanced/stack/) -- screen animation options
- [Reanimated Entering/Exiting docs](https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/entering-exiting-animations/) -- layout animation API
- [Expo Haptics docs](https://docs.expo.dev/versions/latest/sdk/haptics/) -- haptic feedback API
- [react-native-screens types](https://github.com/software-mansion/react-native-screens/blob/main/src/types.tsx) -- StackAnimationTypes

### Secondary (MEDIUM confidence)
- [Reanimated 4 stable release blog](https://blog.swmansion.com/reanimated-4-stable-release-the-future-of-react-native-animations-ba68210c3713) -- CSS Animations API capabilities
- `.planning/research/STACK.md` -- verified library recommendations
- `.planning/research/ARCHITECTURE.md` -- animation architecture patterns
- `.planning/research/PITFALLS.md` -- performance and integration pitfalls

### Tertiary (LOW confidence)
- None -- all findings verified against installed packages and official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed, versions confirmed from package.json
- Architecture: HIGH -- patterns derived from existing codebase analysis + user decisions
- Pitfalls: HIGH -- documented in prior pitfalls research, verified against Reanimated and Expo docs

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable -- no library upgrades expected in this window)
