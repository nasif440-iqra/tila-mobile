# Phase 4: Lesson Experience - Research

**Researched:** 2026-03-28
**Domain:** React Native UI polish -- animations, haptics, engagement copy, visual warmth
**Confidence:** HIGH

## Summary

Phase 4 polishes the core learning loop: lesson intro, quiz interactions, exercise screens, and lesson summary. The codebase is well-structured with clear component boundaries. The primary work is (1) migrating 6 exercise components from direct `expo-haptics` imports to the Phase 1 haptic utility functions, (2) migrating 2 components from hardcoded spring configs to design presets, (3) adding WarmGlow ambient warmth to LessonIntro and LessonSummary, (4) enhancing QuizCelebration and QuizProgress with haptics/scale animations, (5) softening WrongAnswerPanel with encouraging copy from the engagement module, and (6) adding score-proportional celebration to LessonSummary.

No new dependencies are needed. All animation presets, haptic utilities, WarmGlow component, and engagement copy pools already exist. The work is purely modification of existing components using established patterns from Phase 1-3.

**Primary recommendation:** Organize work by component group -- haptic migration (mechanical, all 6 exercises), then quiz polish (QuizProgress, QuizCelebration, QuizQuestion, WrongAnswerPanel), then lesson screens (LessonIntro, LessonSummary, LessonHybrid). Haptic migration is the highest-volume lowest-risk work and should go first.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Letter presentation should feel beautiful -- the intro sets the tone before quiz questions begin
- D-02: Use WarmGlow behind letter circles for visual warmth (reuse from Phase 2/3)
- D-03: Staggered entrance animations -- header, letters, description, CTA fade in naturally
- D-04: QuizOption already polished in Phase 1. This phase ensures the SURROUNDING quiz experience matches
- D-05: Correct answer feedback: warm sparkle + haptic (hapticSuccess from Phase 1). Brief encouraging message
- D-06: Wrong answer feedback: gentle shake + encouraging correction (hapticError from Phase 1). Not punishing
- D-07: Celebration proportional to score -- great scores (80%+) get visual excitement, okay scores get warm encouragement
- D-08: Animated accuracy count-up should feel satisfying -- enhanced with color transitions
- D-09: Closing quotes and encouragement messages should feel warm and Islamic in character
- D-10: All 6 exercise types should share a consistent polished look
- D-11: Stage indicator badges should use design tokens consistently
- D-12: Exercise transitions should be smooth fades
- D-13: Use Phase 1's shared animation presets -- no new magic numbers
- D-14: Haptics on all interactive elements using Phase 1 haptic presets
- D-15: Same "life in the polish" principle -- subtle micro-animations

### Claude's Discretion
- Specific visual treatment for lesson intro letter presentation
- Celebration animation approach for lesson summary (Reanimated-based particles/burst vs simpler approach)
- How to make the progress bar feel more alive (animated fill, color transitions)
- Exercise screen polish priorities (which exercises need the most work)
- QuizCelebration (mid-lesson) enhancement approach
- Whether to add WarmGlow to any exercise screens
- Specific encouraging messages for wrong answers and lesson completion

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LES-01 | Lesson intro screen sets the tone with beautiful letter presentation | WarmGlow behind letter circles, staggered scale entrance with springs.gentle, FadeIn presets. Component: LessonIntro.tsx |
| LES-02 | Quiz interactions feel responsive with smooth state transitions | Migrate QuizProgress to springs.gentle, add progress bar color transition at >85%, add streak hapticSuccess. Component: QuizProgress.tsx, QuizQuestion.tsx |
| LES-03 | Correct answers get a warm subtle celebration (sparkle + haptic) | Scale pulse on correct feedback pill using springs.press, haptics already handled by QuizOption. Component: QuizQuestion.tsx |
| LES-04 | Wrong answers give clear but encouraging feedback | Add WRONG_ENCOURAGEMENT prefix from engagement.js, soften copy tone. Component: WrongAnswerPanel.tsx |
| LES-05 | Lesson summary celebrates completion with visual excitement | Score-proportional WarmGlow (3 tiers), hapticMilestone for strong, color transition on count-up. Component: LessonSummary.tsx |
| LES-06 | Exercise screens feel polished and consistent | Haptic migration for 6 exercises (GuidedReveal, TapInOrder, BuildUpReader, FreeReader, SpotTheBreak, ComprehensionExercise), WarmGlow on GuidedReveal header, LessonHybrid spring migration |
</phase_requirements>

## Standard Stack

### Core (already installed, no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-reanimated | (installed) | All animations -- FadeIn, springs, withSpring, shared values | Already used in every component |
| expo-haptics | (installed) | Haptic feedback via utility wrappers | Already used, migrating to centralized utilities |
| react-native | 0.83 | Core framework | Project foundation |

### Supporting (already in project)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/design/animations.ts` | N/A | springs, durations, staggers, easings, pressScale | All animation timing |
| `src/design/haptics.ts` | N/A | hapticTap, hapticSuccess, hapticError, hapticMilestone | All haptic calls |
| `src/engine/engagement.js` | N/A | WRONG_ENCOURAGEMENT, MID_CELEBRATE_COPY, CLOSING_QUOTES, pickCopy | All engagement copy |
| `src/components/onboarding/WarmGlow.tsx` | N/A | Animated ambient glow behind elements | LessonIntro, LessonSummary, GuidedReveal |

**Installation:** None needed. All dependencies already present.

## Architecture Patterns

### Component Modification Pattern (no new components)

Phase 4 creates zero new components. All work is modifications to 14 existing files:

```
src/components/
  LessonIntro.tsx          -- WarmGlow + staggered scale entrance
  LessonQuiz.tsx           -- No direct changes (delegates to sub-components)
  LessonHybrid.tsx         -- Spring migration + haptic migration
  LessonSummary.tsx        -- WarmGlow + haptic tiers + enhanced count-up
  quiz/
    QuizProgress.tsx       -- Spring migration + color transition
    QuizCelebration.tsx    -- Scale entrance + hapticMilestone + MID_CELEBRATE_COPY
    QuizQuestion.tsx       -- Scale pulse on correct pill + haptic calls
    WrongAnswerPanel.tsx   -- WRONG_ENCOURAGEMENT copy prefix
  exercises/
    GuidedReveal.tsx       -- Haptic migration + WarmGlow on header
    TapInOrder.tsx         -- Haptic migration + completion celebration
    BuildUpReader.tsx      -- Haptic migration
    FreeReader.tsx         -- Haptic migration
    SpotTheBreak.tsx       -- Haptic migration
    ComprehensionExercise.tsx -- Haptic migration
```

### Pattern 1: Haptic Migration (6 exercises)

**What:** Replace direct `import * as Haptics from "expo-haptics"` with targeted imports from `src/design/haptics.ts`.
**When to use:** Every exercise component.
**Example:**

```typescript
// BEFORE (in GuidedReveal.tsx)
import * as Haptics from "expo-haptics";
// ...
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// AFTER
import { hapticTap } from "../../design/haptics";
// ...
hapticTap();
```

Mapping:
- `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` -> `hapticTap()`
- `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)` -> `hapticSuccess()`
- `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)` -> `hapticError()`

### Pattern 2: Spring Config Migration

**What:** Replace hardcoded spring configs with design presets.
**When to use:** LessonHybrid and QuizProgress.
**Example:**

```typescript
// BEFORE (in QuizProgress.tsx)
progressWidth.value = withSpring(progressPct, {
  stiffness: 120,
  damping: 20,
});

// AFTER
import { springs } from "../../design/animations";
progressWidth.value = withSpring(progressPct, springs.gentle);
```

Note: `springs.gentle` is `{ stiffness: 200, damping: 22 }` which is slightly different from the current `{ stiffness: 120, damping: 20 }`. This is intentional per UI spec -- the gentle spring is snappier and more responsive.

### Pattern 3: WarmGlow Integration

**What:** Add WarmGlow component behind visual focus elements for ambient warmth.
**When to use:** LessonIntro letter circles, LessonSummary icon, GuidedReveal letter header.
**Example:**

```typescript
import { WarmGlow } from "../components/onboarding/WarmGlow";

// Position WarmGlow absolutely behind content
<View style={{ alignItems: "center", justifyContent: "center" }}>
  <WarmGlow
    size={160}
    animated
    color="rgba(196,164,100,0.3)"
    pulseMin={0.05}
    pulseMax={0.15}
  />
  {/* Content goes on top */}
  <View style={styles.letterCircle}>
    <ArabicText ...>{letter}</ArabicText>
  </View>
</View>
```

### Pattern 4: Score-Proportional Celebration (LessonSummary)

**What:** Three tiers of visual/haptic response based on accuracy.
**When to use:** LessonSummary mount.

```typescript
// Strong (>=80%): WarmGlow + hapticMilestone
// Partial (50-79%): Smaller WarmGlow + hapticSuccess
// Weak (<50%): No WarmGlow + hapticTap (gentle acknowledgement)

useEffect(() => {
  if (percentage >= 80) hapticMilestone();
  else if (percentage >= 50) hapticSuccess();
  else hapticTap();
}, []);
```

### Anti-Patterns to Avoid
- **Direct Haptics import in components:** Always use haptic utility functions from `src/design/haptics.ts`
- **Hardcoded spring/duration values:** Always reference `springs.*`, `durations.*` from `src/design/animations.ts`
- **New animation presets:** D-13 explicitly prohibits new magic numbers. Use existing presets only.
- **Heavy celebration for low scores:** D-07 requires proportional celebration. Don't show WarmGlow for <50% accuracy.
- **Punishing wrong-answer tone:** Wrong answers must feel supportive, not like failure. Target audience includes converts who may feel intimidated.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Haptic feedback | Direct `Haptics.impactAsync()` calls | `hapticTap()`, `hapticSuccess()`, `hapticError()`, `hapticMilestone()` | Centralized, testable, consistent tiers |
| Animation timing | Inline `{ stiffness: N, damping: N }` | `springs.gentle`, `springs.bouncy`, `springs.press` | D-13: no new magic numbers |
| Ambient warmth | Custom gradient/glow components | `WarmGlow` from Phase 2 | Already built, tested, and used in onboarding |
| Encouraging copy | Inline strings | `WRONG_ENCOURAGEMENT`, `MID_CELEBRATE_COPY`, `CLOSING_QUOTES` from engagement.js | Production-quality, spiritually aligned, reviewed copy |
| Confetti/particles | Complex particle system | WarmGlow intensity tiers | Simpler, consistent with Phase 2/3 approach, no new dependencies |

**Key insight:** Phase 4 is a polish phase, not a features phase. Everything needed already exists in the codebase. The work is wiring existing building blocks into existing components.

## Common Pitfalls

### Pitfall 1: Breaking QuizOption Haptics
**What goes wrong:** Adding haptic calls in QuizQuestion for correct/wrong answers creates duplicate haptics since QuizOption already fires haptics internally.
**Why it happens:** QuizOption was polished in Phase 1 with its own haptic calls on press.
**How to avoid:** The UI spec explicitly states "Haptic: handled by QuizOption (leaf component owns haptic -- no duplicate)" for correct feedback. Only add haptics to elements that don't already have them.
**Warning signs:** Double-vibration on answer selection.

### Pitfall 2: Spring Config Behavioral Change
**What goes wrong:** Migrating from `{ stiffness: 120, damping: 20 }` to `springs.gentle` (`{ stiffness: 200, damping: 22 }`) changes animation feel.
**Why it happens:** The values are intentionally different -- gentle is snappier. But if the existing feel was preferred, this could be jarring.
**How to avoid:** This is intentional per spec. Test on device to confirm the snappier feel is better. The higher stiffness makes progress bars feel more responsive.
**Warning signs:** Progress bar or exercise transitions feeling too fast.

### Pitfall 3: WarmGlow Positioning
**What goes wrong:** WarmGlow renders as `position: "absolute"` which can overflow or clip if parent doesn't have proper overflow handling.
**Why it happens:** WarmGlow uses absolute positioning to sit behind content.
**How to avoid:** Ensure the parent container has `alignItems: "center"`, `justifyContent: "center"`, and no `overflow: "hidden"` that would clip the glow. The glow size should be larger than the content it sits behind (e.g., 160px glow behind 120px circle).
**Warning signs:** Glow clipped or misaligned on different screen sizes.

### Pitfall 4: Stale Hooks in Map Callbacks (TapInOrder, SpotTheBreak)
**What goes wrong:** Both TapInOrder and SpotTheBreak call `useSharedValue` and `useAnimatedStyle` inside `.map()` callbacks, which violates React hooks rules.
**Why it happens:** This is a pre-existing pattern in the codebase -- the components already work but technically break hooks rules.
**How to avoid:** When modifying these components for haptic migration, do NOT refactor the hooks pattern -- that's out of scope for Phase 4. Only change the haptic imports. If hooks warnings appear, note them as tech debt but don't fix in this phase.
**Warning signs:** React warnings about hooks in loops.

### Pitfall 5: Engagement.js is JavaScript, not TypeScript
**What goes wrong:** Import type errors when consuming engagement.js from TypeScript components.
**Why it happens:** `engagement.js` exports plain JS. TypeScript components importing from it need to handle the lack of type declarations.
**How to avoid:** Use type assertions or `as` casts when importing from engagement.js. The existing LessonSummary.tsx already does this: `(COMPLETION_HEADLINES as Record<string, string>)[tier]`. Follow the same pattern for WRONG_ENCOURAGEMENT and MID_CELEBRATE_COPY.
**Warning signs:** TS errors on `pickCopy` or copy array imports.

## Code Examples

### Haptic Migration -- GuidedReveal (representative of all 6 exercises)

```typescript
// BEFORE (line 4):
import * as Haptics from "expo-haptics";
// BEFORE (line 90):
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// AFTER (line 4):
import { hapticTap } from "../../design/haptics";
// AFTER (line 90):
hapticTap();
```

### WarmGlow on LessonIntro Letter Circle

```typescript
import { WarmGlow } from "../components/onboarding/WarmGlow";

// Inside LetterCard component, wrap the circle:
<View style={[styles.letterItem, { alignItems: "center", justifyContent: "center" }]}>
  <View style={{ alignItems: "center", justifyContent: "center" }}>
    <WarmGlow
      size={isSmall ? 120 : 160}
      animated
      color="rgba(196,164,100,0.3)"
      pulseMin={0.05}
      pulseMax={0.15}
    />
    <View style={[styles.letterCircle, isSmall && styles.letterCircleSmall, { backgroundColor: colors.primarySoft }]}>
      <ArabicText ...>{letter.letter}</ArabicText>
    </View>
  </View>
  {/* name and hear button below */}
</View>
```

### Score-Proportional WarmGlow on LessonSummary

```typescript
import { WarmGlow } from "../components/onboarding/WarmGlow";
import { hapticMilestone, hapticSuccess, hapticTap } from "../design/haptics";

// On mount:
useEffect(() => {
  if (percentage >= 80) hapticMilestone();
  else if (percentage >= 50) hapticSuccess();
  else hapticTap();
}, []);

// In render, around icon circle:
{percentage >= 50 && (
  <WarmGlow
    size={percentage >= 80 ? 140 : 100}
    animated
    color="rgba(196,164,100,0.3)"
    pulseMin={percentage >= 80 ? 0.08 : 0.04}
    pulseMax={percentage >= 80 ? 0.22 : 0.10}
  />
)}
```

### QuizCelebration Enhancement

```typescript
import { springs } from "../../design/animations";
import { hapticMilestone } from "../../design/haptics";
import { MID_CELEBRATE_COPY, pickCopy } from "../../engine/engagement";

// Add scale entrance + haptic:
useEffect(() => { hapticMilestone(); }, []);

// Replace static subtitle with random from MID_CELEBRATE_COPY:
const subtitle = useMemo(() => pickCopy(MID_CELEBRATE_COPY.default), []);
```

### WrongAnswerPanel Encouraging Prefix

```typescript
import { WRONG_ENCOURAGEMENT, pickCopy } from "../../engine/engagement";

// Add encouraging prefix to explanation:
const encouragement = useMemo(() => pickCopy(WRONG_ENCOURAGEMENT), []);
const explanationText =
  explanation
    ? `${encouragement} ${explanation}`
    : correctLetter
      ? `${encouragement} The correct answer is ${correctLetter.name} (${correctLetter.letter})`
      : "Not quite -- try again next time!";
```

### QuizProgress Color Transition at >85%

```typescript
import { springs } from "../../design/animations";
import { withTiming } from "react-native-reanimated";

// Add color interpolation shared value:
const progressColor = useDerivedValue(() => {
  return progressWidth.value > 85 ? 1 : 0;
});

// In animated style, interpolate between primary and accent:
const progressBarStyle = useAnimatedStyle(() => ({
  width: `${progressWidth.value}%`,
  backgroundColor: interpolateColor(
    progressColor.value,
    [0, 1],
    [colors.primary, colors.accent]
  ),
}));
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct Haptics imports | Centralized haptic utilities | Phase 1 (2026-03) | 6 exercise components still use old pattern, need migration |
| Hardcoded spring configs | Design animation presets | Phase 1 (2026-03) | 2 components (LessonHybrid, QuizProgress) still use old pattern |
| No ambient warmth | WarmGlow component | Phase 2 (2026-03) | Ready to apply to lesson screens |
| Generic feedback copy | Engagement module with Islamic-aligned copy | Pre-Phase 1 | WRONG_ENCOURAGEMENT and MID_CELEBRATE_COPY not yet wired into quiz components |

## Open Questions

1. **QuizProgress color interpolation approach**
   - What we know: UI spec says fill color transitions to accent at >85%. Reanimated's `interpolateColor` works with shared values.
   - What's unclear: Whether to use `interpolateColor` with the progress shared value directly, or a separate shared value tracking the threshold crossing.
   - Recommendation: Use `useDerivedValue` to create a 0/1 flag based on progress > 85, then interpolateColor between primary and accent. This avoids color flickering during spring overshoot.

2. **Celebration approach for LessonSummary**
   - What we know: UI spec specifies WarmGlow intensity tiers (not confetti/particles). This is simpler than D-07's mention of "confetti/particles".
   - What's unclear: Whether WarmGlow alone provides enough visual excitement for perfect scores.
   - Recommendation: Go with WarmGlow as specified in UI spec. It's consistent with Phase 2/3 approach and avoids new dependencies. If insufficient, can enhance in Phase 5 (celebrations phase).

3. **LessonIntro staggered scale entrance**
   - What we know: UI spec calls for scale from 0.9 to 1.0 using springs.gentle, staggered by 50ms per card.
   - What's unclear: Whether to use Reanimated's `entering` prop with custom spring, or manually animate a shared value.
   - Recommendation: Use Reanimated's `FadeIn.delay(150 + index * 50).duration(500)` for opacity, combined with a separate `useSharedValue` for scale that springs from 0.9 to 1.0. The entering prop doesn't natively support custom spring configs, so the scale needs to be separate.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | vitest.config.ts (project root) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LES-01 | LessonIntro renders WarmGlow + staggered entrance | unit (snapshot/structure) | `npx vitest run src/__tests__/lesson-intro.test.ts -x` | Wave 0 |
| LES-02 | QuizProgress uses springs.gentle, no hardcoded springs | unit (import check) | `npx vitest run src/__tests__/quiz-progress.test.ts -x` | Wave 0 |
| LES-03 | QuizQuestion correct pill has scale entrance | unit (render check) | `npx vitest run src/__tests__/quiz-question.test.ts -x` | Wave 0 |
| LES-04 | WrongAnswerPanel includes encouragement from pool | unit (copy check) | `npx vitest run src/__tests__/wrong-answer.test.ts -x` | Wave 0 |
| LES-05 | LessonSummary WarmGlow varies by score tier | unit (conditional render) | `npx vitest run src/__tests__/lesson-summary.test.ts -x` | Wave 0 |
| LES-06 | Exercise haptic migration -- no direct Haptics imports | unit (import audit) | `npx vitest run src/__tests__/exercise-haptics.test.ts -x` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/__tests__/lesson-intro.test.ts` -- covers LES-01 (WarmGlow integration, stagger)
- [ ] `src/__tests__/quiz-progress.test.ts` -- covers LES-02 (spring preset, color transition)
- [ ] `src/__tests__/quiz-question.test.ts` -- covers LES-03 (correct feedback enhancement)
- [ ] `src/__tests__/wrong-answer.test.ts` -- covers LES-04 (encouragement copy)
- [ ] `src/__tests__/lesson-summary.test.ts` -- covers LES-05 (score-proportional celebration)
- [ ] `src/__tests__/exercise-haptics.test.ts` -- covers LES-06 (all 6 exercises use haptic utilities)

## Detailed Change Inventory

For planner task sizing, here is the exact change needed per file:

| File | Lines Changed (est.) | Complexity | Changes |
|------|---------------------|------------|---------|
| GuidedReveal.tsx | ~10 | Low | Haptic import swap (1 call), WarmGlow behind header |
| TapInOrder.tsx | ~6 | Low | Haptic import swap (2 calls: success + error) |
| BuildUpReader.tsx | ~4 | Low | Haptic import swap (1 call) |
| FreeReader.tsx | ~6 | Low | Haptic import swap (2 calls: success + tap) |
| SpotTheBreak.tsx | ~6 | Low | Haptic import swap (2 calls: success + error) |
| ComprehensionExercise.tsx | ~6 | Low | Haptic import swap (2 calls: success + error) |
| QuizProgress.tsx | ~15 | Medium | Spring migration, color interpolation at 85%, hapticSuccess on streak |
| QuizCelebration.tsx | ~20 | Medium | Scale entrance, hapticMilestone, MID_CELEBRATE_COPY |
| QuizQuestion.tsx | ~10 | Low | Scale pulse on correct feedback pill |
| WrongAnswerPanel.tsx | ~10 | Low | WRONG_ENCOURAGEMENT prefix |
| LessonIntro.tsx | ~30 | Medium | WarmGlow per letter, staggered scale entrance |
| LessonSummary.tsx | ~35 | Medium | WarmGlow tiers, haptic tiers, enhanced count-up color |
| LessonHybrid.tsx | ~8 | Low | Spring migration, haptic import swap |

**Total estimated changes:** ~166 lines across 13 files.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: All 14 target component files read and analyzed
- `src/design/animations.ts` -- verified all preset values
- `src/design/haptics.ts` -- verified all utility function signatures
- `src/engine/engagement.js` -- verified WRONG_ENCOURAGEMENT, MID_CELEBRATE_COPY, CLOSING_QUOTES exports
- `src/components/onboarding/WarmGlow.tsx` -- verified props interface and usage pattern
- `04-UI-SPEC.md` -- comprehensive visual specification with exact values
- `04-CONTEXT.md` -- locked decisions D-01 through D-15

### Secondary (MEDIUM confidence)
- Existing Phase 1-3 patterns in codebase for how WarmGlow, haptics, and springs are integrated

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- everything already installed and used in the project
- Architecture: HIGH -- modifying existing components with established patterns
- Pitfalls: HIGH -- identified from direct code reading of all 14 files
- Change sizing: MEDIUM -- line estimates are approximate, actual may vary by 20%

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable -- no dependency changes expected)
