# Phase 3: Home Screen - Research

**Researched:** 2026-03-28
**Domain:** React Native UI polish -- animated components, Reanimated entrance/interaction patterns
**Confidence:** HIGH

## Summary

Phase 3 transforms the existing home screen from a functional layout into a warm, polished experience. The current code already has the correct structure (header, hero card, journey path) and uses the design system tokens. The work is purely additive visual polish: entrance animations, breathing glows, press feedback, and extracting two new components (AnimatedStreakBadge, JourneyNode).

The UI-SPEC is exceptionally detailed -- every pixel dimension, animation preset, timing delay, and color token is specified. The existing design system (animations.ts, haptics.ts, tokens.ts) and WarmGlow component from Phase 2 provide all building blocks. No new libraries, tokens, or infrastructure are needed.

**Primary recommendation:** Implement as component extraction + animation layering on the existing code. The three modified files (index.tsx, HeroCard.tsx, LessonGrid.tsx) plus two new components (AnimatedStreakBadge.tsx, JourneyNode.tsx) cover the full scope.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Quiet confidence -- subtly beautiful, not flashy
- D-02: Life in the polish -- micro-animations, gentle breathing, smooth transitions
- D-03: Easy to look at -- clean hierarchy, nothing overwhelming
- D-04: Hero card is the most prominent element with clear, enticing CTA
- D-05: Claude's discretion on specific visual treatment (elevated card, warm glow, entrance animation)
- D-06: Three distinct visual states (complete, current, locked) immediately distinguishable but harmonious
- D-07: Current/next lesson subtly draws the eye -- gentle animation or glow
- D-08: Streak counter feels alive -- gentle animation or visual flair
- D-09: Use Phase 1's shared animation presets -- no new magic numbers
- D-10: Haptics on interactive elements using Phase 1 haptic presets
- D-11: Entrance animations as subtle staggered fades

### Claude's Discretion
- Specific visual treatment for hero card (shadows, gradients, glow effects)
- Journey path organic feel (serpentine refinements, connector line styling)
- Streak counter animation approach (pulse, glow, number animation)
- Whether to add subtle background elements (warm glow, decorative accents)
- Complete/current/locked state visual design (colors, opacity, icons)
- Scroll behavior and content density
- Whether the "tila" header needs enhancement

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HOME-01 | Home screen feels inviting and encouraging, not like a utility screen | WarmGlow behind hero card, staggered entrance animations, breathing streak badge create warmth. Card elevated mode adds polish depth. |
| HOME-02 | Hero lesson card is visually prominent with clear call to action | Card elevated + WarmGlow + entrance animation (FadeIn + translateY). Button component already has press feedback + haptics. Letter circle scales in with gentle spring. |
| HOME-03 | Journey path / lesson grid clearly shows progress with beautiful visual states | JourneyNode extraction with three distinct states: complete (filled circle + checkmark, 0.85 opacity), current (bordered + dot + subtle glow pulse, full opacity), locked (dimmed 0.4 + letter/lock icon). Press animation on interactive nodes. |
| HOME-04 | Streak counter is visually engaging (not just a number) | AnimatedStreakBadge with WarmGlow breathing behind it, FadeIn entrance, milestone scale pulse on new day streaks. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Framework:** Expo 55, React Native 0.83, React 19, TypeScript 5.9, New Architecture enabled
- **Testing:** Vitest (not Jest), tests in `src/__tests__/**/*.test.{js,ts}`
- **Linting:** `npm run lint` (ESLint Expo flat config), `npm run typecheck` (tsc --noEmit)
- **Validation:** `npm run validate` (lint + typecheck)
- **No Redux/Zustand:** All persistent state in SQLite, React Context for theme/DB only
- **Import alias:** `@/*` maps to project root
- **Haptics:** Plain utility functions, not hooks -- fire-and-forget pattern
- **Animation presets:** Centralized in `src/design/animations.ts` -- no magic numbers in components

## Standard Stack

### Core (already installed, no changes)
| Library | Purpose | Why Standard |
|---------|---------|--------------|
| react-native-reanimated | All animations (entrance, press, breathing glow, staggered reveals) | Already used in Card, Button, WarmGlow. Phase 1 presets built on it. |
| expo-haptics | Haptic feedback on press interactions | Already wrapped in `src/design/haptics.ts` utility functions |
| react-native-svg | CheckIcon, LockIcon SVG rendering in journey nodes | Already used in current LessonGrid |

### Supporting (already installed)
| Library | Purpose | When to Use |
|---------|---------|-------------|
| react-native-safe-area-context | SafeAreaView on home screen | Already in use |
| expo-router | Navigation from lesson nodes to `/lesson/[id]` | Already in use |

### No New Dependencies
Phase 3 requires zero new npm packages. Everything needed is already installed and in use.

## Architecture Patterns

### Component Structure
```
src/components/home/
  HeroCard.tsx           # MODIFY: Add WarmGlow, entrance animation, Card interactive
  LessonGrid.tsx         # MODIFY: Extract JourneyNode, add stagger entrance
  AnimatedStreakBadge.tsx # NEW: Breathing glow + animated streak badge
  JourneyNode.tsx        # NEW: Extracted node with 3 visual states + press animation

app/(tabs)/
  index.tsx              # MODIFY: Replace StreakBadge with AnimatedStreakBadge, add staggered entrances
```

### Pattern 1: Staggered Entrance Animation
**What:** Each section of the home screen fades in with a slight delay after the previous section starts, creating a natural "content appearing" feel rather than everything popping in at once.
**When to use:** Home screen mount, all entrance animations.
**Implementation approach:**
```typescript
// Use useSharedValue + withDelay + withTiming for each section
// Delays from UI-SPEC:
//   Header: 0ms
//   Streak badge: 200ms
//   Hero card: 80ms (FadeIn + translateY from 12px)
//   Hero letter circle: card delay + 100ms (scale 0.8 to 1.0, spring gentle)
//   Journey section header: 160ms
//   Journey nodes: first at section + 200ms, then 50ms stagger between each
```

### Pattern 2: Breathing Glow (WarmGlow reuse)
**What:** Subtle pulsing opacity on WarmGlow component creates "alive" feeling without being distracting.
**When to use:** Behind hero card letter circle, behind streak badge, on current lesson node.
**Key parameters from UI-SPEC:**
- Hero letter circle: WarmGlow size 160px, pulseMin 0.06, pulseMax 0.18
- Streak badge: WarmGlow size 60px, pulseMin 0.04, pulseMax 0.12
- Current node glow: opacity 0.08 to 0.15, 3000ms cycle, accentGlow color, size 52px

### Pattern 3: Press Feedback on Nodes
**What:** Animated scale-down on press using springs.press + hapticTap.
**When to use:** Interactive lesson nodes (complete + current states), NOT locked nodes.
**Implementation:** Same pattern as Card interactive mode -- useSharedValue for scale, withSpring on pressIn/pressOut, AnimatedPressable wrapper.

### Anti-Patterns to Avoid
- **Creating new animation constants:** All timing/spring values MUST come from `src/design/animations.ts`. The UI-SPEC maps every animation to an existing preset.
- **Importing expo-haptics directly:** Always use `hapticTap()` from `src/design/haptics.ts`.
- **Inline Reanimated in index.tsx:** Keep animation logic inside components (AnimatedStreakBadge, JourneyNode, HeroCard). The index.tsx file orchestrates layout and data, not animations.
- **Over-animating:** Locked nodes have NO animation, NO press feedback. Completed nodes are slightly dimmed (0.85 opacity) to keep current node prominent.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Press scale animation | Custom Pressable + scale logic | Card interactive mode pattern (already in Card.tsx) | Consistent spring config, haptic integration |
| Breathing glow | Custom opacity animation | WarmGlow component from Phase 2 | Already handles static/animated modes, configurable pulse range |
| Entrance fade | Manual opacity + translateY | Reanimated withDelay + withTiming + easings.contentReveal | Standard pattern already in onboarding |
| Haptic feedback | Direct expo-haptics calls | hapticTap() from haptics.ts | Centralized, consistent tier system |

## Common Pitfalls

### Pitfall 1: Animation Jank on Low-End Android
**What goes wrong:** Too many simultaneous Reanimated animations on mount causes frame drops.
**Why it happens:** Every WarmGlow, every staggered node, and every entrance runs its own useSharedValue animation.
**How to avoid:** Stagger delays naturally spread the load. WarmGlow breathing animations are simple opacity tweens (lightweight). Limit concurrent animations on mount to the visible viewport -- journey nodes below the fold don't need immediate entrance animation.
**Warning signs:** Dropped frames on first render, visible judder on Pixel 3a or similar.

### Pitfall 2: WarmGlow Positioning
**What goes wrong:** WarmGlow is `position: absolute` and needs to be centered behind the target element. If the parent container doesn't have explicit dimensions or `alignItems: 'center'`, the glow drifts.
**Why it happens:** WarmGlow renders as an absolute-positioned circle. The parent must be a positioned container with centering.
**How to avoid:** Wrap target element + WarmGlow in a View with `alignItems: 'center', justifyContent: 'center'`. WarmGlow should be the first child (rendered behind) with the target element on top.

### Pitfall 3: Stagger Timing Math
**What goes wrong:** Entrance animations overlap or appear to pause if delays are calculated incorrectly.
**Why it happens:** Each section's delay is relative to mount time, not the previous section's completion.
**How to avoid:** Use the absolute delay values from the UI-SPEC timing table directly (0ms, 80ms, 160ms, 200ms+N*50ms). These are already calibrated to look natural.

### Pitfall 4: Current Node Glow Cycle Time
**What goes wrong:** The current node's subtle glow pulse uses a 3000ms cycle (different from WarmGlow's default 4000ms cycle of 2000ms up + 2000ms down).
**Why it happens:** UI-SPEC specifies a faster 3000ms total cycle for the node glow to be subtly more noticeable than the ambient hero glow.
**How to avoid:** Either customize WarmGlow's timing via props or implement the current node glow as a separate small animation (just opacity 0.08 to 0.15 on a 52px circle).

### Pitfall 5: StreakBadge Extraction Side Effects
**What goes wrong:** The current StreakBadge is an inline function in index.tsx. Moving it to its own file requires ensuring the colors prop interface matches or switching to useColors() internally.
**Why it happens:** Inline components have access to parent scope. Extracted components need explicit prop contracts or hooks.
**How to avoid:** AnimatedStreakBadge should call useColors() internally (same pattern as HeroCard and LessonGrid), not receive colors as a prop.

## Code Examples

### Entrance Animation Pattern (from existing codebase patterns)
```typescript
// Pattern used in onboarding (Phase 2), apply same approach here
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { durations, easings } from "@/src/design/animations";

// In component:
const opacity = useSharedValue(0);
const translateY = useSharedValue(12);

useEffect(() => {
  opacity.value = withDelay(
    delayMs,
    withTiming(1, { duration: durations.slow, easing: easings.contentReveal })
  );
  translateY.value = withDelay(
    delayMs,
    withTiming(0, { duration: durations.slow, easing: easings.contentReveal })
  );
}, []);

const animStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
  transform: [{ translateY: translateY.value }],
}));
```

### Press Feedback Pattern (from Card.tsx)
```typescript
// Already implemented in Card.tsx -- JourneyNode can follow the same pattern
const scale = useSharedValue(1);

function handlePressIn() {
  scale.value = withSpring(pressScale.subtle, springs.press);
}
function handlePressOut() {
  scale.value = withSpring(1, springs.press);
}
function handlePress() {
  hapticTap();
  onPress?.();
}
```

### WarmGlow Reuse (from Phase 2)
```typescript
// Behind hero letter circle
<View style={{ alignItems: "center", justifyContent: "center" }}>
  <WarmGlow
    animated
    size={160}
    color={colors.accentGlow}
    pulseMin={0.06}
    pulseMax={0.18}
  />
  <View style={styles.letterCircle}>
    <ArabicText size="display" color={colors.text}>{letter}</ArabicText>
  </View>
</View>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static StreakBadge (inline function) | AnimatedStreakBadge (own file, breathing glow) | Phase 3 | Visual engagement for streak display |
| Inline node rendering in LessonGrid | Extracted JourneyNode component | Phase 3 | Cleaner code, per-node animation support |
| No entrance animations on home | Staggered fade-in entrance | Phase 3 | Screen feels alive on open |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HOME-01 | Home screen renders with animated components | smoke / manual | Manual visual inspection | N/A -- visual polish, not testable via unit |
| HOME-02 | HeroCard renders with correct CTA text variants | unit | `npx vitest run src/__tests__/home-hero.test.ts -x` | Wave 0 |
| HOME-03 | JourneyNode renders correct visual state (complete/current/locked) | unit | `npx vitest run src/__tests__/home-journey.test.ts -x` | Wave 0 |
| HOME-04 | AnimatedStreakBadge renders when streak > 0, hidden when 0 | unit | `npx vitest run src/__tests__/home-streak.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm run validate && npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/home-hero.test.ts` -- covers HOME-02 (CTA label logic: Start/Continue/Review)
- [ ] `src/__tests__/home-journey.test.ts` -- covers HOME-03 (node state determination: complete/current/locked)
- [ ] `src/__tests__/home-streak.test.ts` -- covers HOME-04 (streak badge visibility logic)

Note: HOME-01 is a holistic visual/feel requirement verified by visual inspection, not unit tests. The component-level tests for HOME-02/03/04 collectively validate the building blocks.

## Open Questions

1. **Current node glow: WarmGlow reuse vs. custom?**
   - What we know: UI-SPEC calls for a 3000ms cycle at opacity 0.08-0.15 on a 52px circle. WarmGlow defaults to 4000ms cycle (2000+2000).
   - What's unclear: Whether to add a `cycleDuration` prop to WarmGlow or build a tiny standalone animation.
   - Recommendation: Add the glow as a standalone Animated.View with custom timing directly in JourneyNode -- it is only 6 lines of Reanimated code and avoids over-generalizing WarmGlow. If future phases need parameterized cycle times, refactor then.

2. **Milestone streak pulse trigger**
   - What we know: UI-SPEC says "when streak reaches a new day milestone: brief scale pulse using springs.bouncy from 1.0 to 1.05 back to 1.0"
   - What's unclear: How to detect "new day milestone" -- the `useHabit` hook provides `currentWird` but no "just incremented" signal.
   - Recommendation: Compare `currentWird` against a ref storing previous value. If it increased since last render, trigger the pulse. Simple and stateless.

## Sources

### Primary (HIGH confidence)
- `03-UI-SPEC.md` -- Complete visual specification with exact values for every element
- `03-CONTEXT.md` -- User decisions and constraints
- Existing codebase: `animations.ts`, `haptics.ts`, `tokens.ts`, `WarmGlow.tsx`, `Card.tsx`, `Button.tsx`
- Current home screen code: `index.tsx`, `HeroCard.tsx`, `LessonGrid.tsx`

### Secondary (MEDIUM confidence)
- Phase 2 implementation patterns (BismillahOverlay, onboarding animations) -- established project conventions for Reanimated usage

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all libraries already in use
- Architecture: HIGH -- UI-SPEC provides exact component inventory and file locations
- Pitfalls: HIGH -- based on direct code inspection of current implementation and Reanimated patterns
- Animations: HIGH -- all presets exist in animations.ts, all values specified in UI-SPEC

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable -- no dependency changes expected)
