# Phase 6: Progress Screen - Research

**Researched:** 2026-03-28
**Domain:** React Native UI polish (Reanimated animations, visual hierarchy, mastery visualization)
**Confidence:** HIGH

## Summary

Phase 6 transforms the existing progress screen from a functional data display into a motivating, visually polished mastery visualization. The current implementation (`app/(tabs)/progress.tsx`) already has the correct data flow and component structure (StatsRow, PhasePanel, LetterMasteryGrid) -- the work is purely visual polish and animation, not new data plumbing.

The established pattern from Phases 1-5 is clear: use `react-native-reanimated` with the centralized animation presets from `src/design/animations.ts`, apply staggered entrance animations via `withDelay` + `withTiming`, and leverage the existing design tokens for all colors, spacing, and typography. The WarmGlow component is available for ambient warmth effects.

**Primary recommendation:** Polish all three existing progress components in-place using the same Reanimated stagger pattern from the home screen, add 5 distinct mastery state visuals to LetterMasteryGrid, and animate PhasePanel progress bars with `springs.gentle`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Same design philosophy as prior phases -- quiet confidence, subtle beauty, life in the polish. Progress screen should feel motivating, not overwhelming.
- D-02: Clear visual hierarchy -- eye flows: stats at top, then phase progress, then letter mastery grid.
- D-03: 5 distinct visual states that are immediately distinguishable: not_started (dimmed), introduced (light), unstable (amber), accurate (green), retained (deep green with glow).
- D-04: Each state should use color + opacity + border to differentiate -- not just color alone.
- D-05: Progress bars should animate smoothly using Phase 1 animation presets (springs.gentle).
- D-06: Clear completion status per phase -- done/total lessons, visual progress percentage.
- D-07: Stats presented with beautiful typography and clear hierarchy.
- D-08: Use existing design token typography roles (statNumber, sectionHeader, etc.).
- D-09: Use Phase 1's shared animation presets -- no new magic numbers.
- D-10: Staggered entrance animations like home screen -- content appears naturally.
- D-11: WarmGlow could add subtle warmth behind key stats or the mastery grid header.

### Claude's Discretion
- Specific color mapping for each mastery state
- Progress bar visual design (height, roundness, fill animation approach)
- Stats layout (row, grid, cards)
- Whether to add WarmGlow anywhere on this screen
- Letter cell tap behavior (show details or just visual)
- Stagger timing for entrance animations

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROG-01 | Progress screen feels informative and motivating, not just a data dump | Staggered entrance animations, WarmGlow ambient effects, typography hierarchy with design tokens |
| PROG-02 | Letter mastery grid is visually clear with distinct states | 5-state color/opacity/border mapping using existing color tokens |
| PROG-03 | Phase progress indicators are polished with smooth progress bars | Animated progress bar fill using springs.gentle from animations.ts |
| PROG-04 | Stats are presented beautifully with clear hierarchy | Typography tokens (statNumber, sectionHeader), Card component, spacing tokens |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Purpose | Why Standard |
|---------|---------|--------------|
| react-native-reanimated | Progress bar animation, entrance staggers | Already used across all prior phases |
| expo-haptics | Optional tap feedback on letter cells | Already wrapped in src/design/haptics.ts |

### Supporting (already available)
| Library | Purpose | When to Use |
|---------|---------|-------------|
| WarmGlow component | Ambient warmth behind mastery grid header | Reuse from src/components/onboarding/WarmGlow.tsx |
| Design tokens | Colors, typography, spacing | src/design/tokens.ts -- all values already defined |
| Animation presets | Springs, durations, staggers, easings | src/design/animations.ts -- no new values needed |
| Card component | Stat cards, phase panels | src/design/components -- already used in StatsRow and PhasePanel |

**Installation:** None required. All dependencies are already in the project.

## Architecture Patterns

### Current Component Structure (no changes needed)
```
app/(tabs)/progress.tsx          -- Screen route, data derivation, layout
src/components/progress/
  StatsRow.tsx                   -- Stats display row
  PhasePanel.tsx                 -- Phase progress cards
  LetterMasteryGrid.tsx          -- Letter mastery grid
```

The existing structure is correct. Each component gets polished in-place.

### Pattern 1: Staggered Entrance Animation (from Home Screen)
**What:** Each section fades in with a slight translateY, staggered by delay.
**When to use:** Progress screen sections (stats, phase panels, mastery grid).
**Example (from home screen HeroCard/LessonGrid):**
```typescript
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from "react-native-reanimated";
import { durations, easings, staggers } from "../../design/animations";

// In component:
const opacity = useSharedValue(0);
const translateY = useSharedValue(12);

useEffect(() => {
  opacity.value = withDelay(
    enterDelay, // stagger offset per section
    withTiming(1, { duration: durations.normal, easing: easings.contentReveal })
  );
  translateY.value = withDelay(
    enterDelay,
    withTiming(0, { duration: durations.normal, easing: easings.contentReveal })
  );
}, []);

const animStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
  transform: [{ translateY: translateY.value }],
}));

return <Animated.View style={animStyle}>...</Animated.View>;
```

### Pattern 2: Spring-Animated Progress Bar
**What:** Progress bar width animates from 0% to actual percentage using a spring.
**When to use:** PhasePanel progress bars (D-05).
**Example:**
```typescript
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from "react-native-reanimated";
import { springs } from "../../design/animations";

const progress = useSharedValue(0);

useEffect(() => {
  progress.value = withDelay(
    enterDelay,
    withSpring(pct / 100, springs.gentle)
  );
}, [pct]);

const fillStyle = useAnimatedStyle(() => ({
  width: `${progress.value * 100}%`,
}));

// In JSX:
<View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
  <Animated.View style={[styles.progressFill, { backgroundColor: colors.primary }, fillStyle]} />
</View>
```

### Pattern 3: 5-State Mastery Color Mapping
**What:** Each mastery state gets distinct color + opacity + border treatment.
**When to use:** LetterMasteryGrid letter cells (D-03, D-04).
**Recommended mapping using existing color tokens:**

| State | Background | Border | Text Color | Opacity | Extra |
|-------|-----------|--------|------------|---------|-------|
| not_started | colors.bgCard | transparent | colors.textMuted | 0.35 | Dimmed, barely visible |
| introduced | colors.bgCard | colors.border | colors.textSoft | 1.0 | Light, present but neutral |
| unstable | colors.accentLight (#F5EDDB) | colors.accent (#C4A464) | colors.text | 1.0 | Amber warmth |
| accurate | colors.primarySoft (#E8F0EB) | colors.primary (#163323) | colors.primaryDark | 1.0 | Green, strong |
| retained | colors.primarySoft (#E8F0EB) | colors.primary (#163323) | colors.primaryDark | 1.0 | Deep green + WarmGlow or shadow |

The current implementation already has a similar mapping but `accurate` and `retained` are visually identical. The key improvement is making `retained` stand out from `accurate` -- options include:
- A subtle green-tinted glow/shadow on retained cells
- Using `primaryDark` as background for retained (darker green)
- Adding a small checkmark or star indicator
- Using `shadows.card` on retained cells for lifted effect

### Anti-Patterns to Avoid
- **New magic numbers:** All animation timings must come from `src/design/animations.ts` presets. This is a locked decision (D-09).
- **Heavy per-cell animations:** 28 Arabic letters in the grid -- do NOT give each cell its own animated value. Use stagger on the grid container or simple opacity, not 28 separate spring animations.
- **Overloading with WarmGlow:** WarmGlow is a positioned absolute element. Using it behind every cell would be expensive. At most, one WarmGlow behind the mastery grid section header.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animation springs | Custom spring configs | `springs.gentle` from animations.ts | Consistency with all other phases (D-09) |
| Stagger timing | Manual delay calculations | `staggers.normal` or `staggers.fast` from animations.ts | Established pattern |
| Card styling | Custom View with shadows | `Card` component from design/components | Already used in StatsRow and PhasePanel |
| Typography roles | Inline font styles | `typography.statNumber`, `typography.sectionHeader` etc. from tokens.ts | D-08 locked decision |
| Haptic feedback | Direct Haptics API calls | `hapticTap()` from design/haptics.ts | Established pattern |

## Common Pitfalls

### Pitfall 1: Percentage Width Animation
**What goes wrong:** Animating `width` as a percentage string (e.g., `"75%"`) does not work with Reanimated's `useAnimatedStyle` -- it only works with numeric values or interpolation.
**Why it happens:** React Native's layout engine accepts percentage strings, but Reanimated operates on numeric shared values.
**How to avoid:** Animate a 0-1 shared value and use `width: \`${progress.value * 100}%\`` in the animated style, OR use `useAnimatedStyle` with a numeric pixel width calculated from the container's measured width via `onLayout`.
**Warning signs:** Progress bar jumps to full width or doesn't animate at all.

### Pitfall 2: Too Many Animated Values in Grid
**What goes wrong:** Creating 28 separate `useSharedValue` calls for each letter cell causes performance issues and complexity.
**Why it happens:** Tempting to animate each cell individually for stagger effect.
**How to avoid:** Wrap the entire grid in a single animated container for entrance. If per-cell stagger is desired, use `FadeIn.delay(index * stagger)` from Reanimated's layout animations, which is more efficient. Or simply animate the grid container and skip per-cell animation.
**Warning signs:** Jank on older Android devices, complex hook arrays.

### Pitfall 3: WarmGlow Positioning
**What goes wrong:** WarmGlow uses `position: "absolute"` and needs a positioned parent container to center correctly.
**Why it happens:** Without explicit positioning context, the glow appears at wrong coordinates.
**How to avoid:** Wrap WarmGlow in a container with `alignItems: "center", justifyContent: "center"` and explicit dimensions, then `pointerEvents: "none"` so it doesn't block touches.
**Warning signs:** Glow appears in top-left corner or blocks scroll interaction.

### Pitfall 4: Retained vs Accurate Indistinguishable
**What goes wrong:** Both states use green colors and are hard to tell apart.
**Why it happens:** The current implementation maps both to the same colors.
**How to avoid:** Add a distinguishing visual beyond color for retained state -- shadow lift, a subtle badge, or a different shade. The D-03/D-04 decisions require 5 **immediately distinguishable** states.
**Warning signs:** Users cannot tell which letters are at retained level vs accurate level.

## Code Examples

### Current Data Flow (no changes needed)
The progress screen already derives all necessary data:
```typescript
// From progress.tsx -- data derivation is complete and correct
const phaseCounts = useMemo(() => getPhaseCounts(completedLessonIds), [completedLessonIds]);
const learnedIds = useMemo(() => getLearnedLetterIds(completedLessonIds), [completedLessonIds]);
const stats = useMemo(() => { /* accuracy calc */ }, [mastery.entities]);
```

### Entrance Stagger Delays (recommended)
```typescript
// In progress.tsx, pass enterDelay to each section:
// Stats:       0ms (immediate)
// Phase cards: staggers.normal.delay * 1 = 80ms
// Mastery:     staggers.normal.delay * 2 = 160ms
```

### WarmGlow Behind Section Header (optional)
```typescript
import { WarmGlow } from "../../components/onboarding/WarmGlow";

// In progress.tsx, wrap the mastery grid header:
<View style={{ alignItems: "center", justifyContent: "center" }}>
  <WarmGlow size={200} opacity={0.06} />
  <Text style={[typography.sectionHeader, { color: colors.brownLight }]}>
    Letter Mastery
  </Text>
</View>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static width percentage | Animated shared value with spring | Phase 1 (animations.ts) | Smooth progress bar fill |
| Inline animation configs | Centralized presets | Phase 1 | Consistent timing across app |
| Color-only differentiation | Color + opacity + border | Phase 6 (D-04) | Accessible mastery states |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | vitest.config.ts |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROG-01 | Progress screen uses staggered entrance animations | source-audit | `npm test -- --run src/__tests__/progress-animations.test.ts` | Wave 0 |
| PROG-02 | Letter mastery grid has 5 distinct visual states | source-audit | `npm test -- --run src/__tests__/progress-mastery-grid.test.ts` | Wave 0 |
| PROG-03 | Phase progress bars use animated fill with springs.gentle | source-audit | `npm test -- --run src/__tests__/progress-phase-bars.test.ts` | Wave 0 |
| PROG-04 | Stats use design token typography roles | source-audit | `npm test -- --run src/__tests__/progress-stats.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test -- --run`
- **Phase gate:** Full suite green before verify

### Wave 0 Gaps
- [ ] `src/__tests__/progress-animations.test.ts` -- covers PROG-01 (source-audit for Reanimated imports and animation preset usage)
- [ ] `src/__tests__/progress-mastery-grid.test.ts` -- covers PROG-02 (source-audit for 5 distinct state branches)
- [ ] `src/__tests__/progress-phase-bars.test.ts` -- covers PROG-03 (source-audit for springs.gentle usage)
- [ ] `src/__tests__/progress-stats.test.ts` -- covers PROG-04 (source-audit for typography token usage)

Note: Following the established source-audit test pattern from Phase 4 (D: "Source-audit test pattern: read source as string + regex assertions instead of rendering"). These tests read component source files and assert presence of animation imports, design token usage, and mastery state differentiation.

## Open Questions

1. **Retained vs Accurate visual differentiation**
   - What we know: Both are "green" states. D-03 says retained should have a "glow."
   - What's unclear: Exact implementation -- per-cell WarmGlow is expensive for 28 cells.
   - Recommendation: Use `shadows.card` or `shadows.cardLifted` on retained cells for a lifted/glow effect. Shadow is cheap and visually distinct from flat accurate cells. Alternatively, use `primaryDark` as the background (darker green) for retained cells.

2. **Letter cell tap behavior**
   - What we know: Listed as Claude's discretion.
   - What's unclear: Whether tapping should show any info or just be visual.
   - Recommendation: Keep it simple for v1 -- no tap behavior. The grid is informational. Tap-to-detail can be a v2 enhancement.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/design/animations.ts`, `src/design/tokens.ts`, `src/design/haptics.ts` -- all animation presets and tokens verified
- Existing codebase: `src/components/home/LessonGrid.tsx`, `src/components/home/HeroCard.tsx` -- stagger entrance pattern verified
- Existing codebase: `src/components/onboarding/WarmGlow.tsx` -- WarmGlow API verified
- Existing codebase: `src/engine/mastery.js` -- 5 mastery states confirmed (introduced, unstable, accurate, retained, + not_started as default)
- Existing codebase: Current progress components -- data flow and structure verified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and used extensively across 5 prior phases
- Architecture: HIGH - existing component structure is correct, only visual polish needed
- Pitfalls: HIGH - based on direct codebase analysis and established patterns from prior phases

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable -- no external dependencies, all internal codebase patterns)
