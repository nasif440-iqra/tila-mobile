# Phase 2: Quiz Experience - Research

**Researched:** 2026-04-04
**Domain:** React Native animation (Reanimated), quiz UI redesign, emotional feedback patterns
**Confidence:** HIGH

## Summary

Phase 2 modifies four existing files (QuizOption.tsx, QuizQuestion.tsx, WrongAnswerPanel.tsx, ArabicText.tsx) to transform the quiz screen from functional to emotionally warm. The changes are well-scoped: remove punitive feedback (shake, red, X icon, floating +1), add warm feedback (gold ripple, gentle dim, warm cream panel), enlarge the LetterHero circle, and add a `quizOption` typography tier. All animation primitives (Reanimated shared values, WarmGlow breathing, haptics) already exist from Phase 1 -- this phase rewires them, not builds them.

The codebase is in excellent shape for this work. Phase 1 delivered breathing animation tokens, WarmGlow with useReducedMotion, and the arabicQuizHero typography token at 52px. QuizOption already has a clean 5-state model (default, selectedCorrect, selectedWrong, revealedCorrect, dimmed) with per-state color mapping. The UI-SPEC provides pixel-exact animation sequences with timing values. No new dependencies are needed.

**Primary recommendation:** Execute as a single plan with 2 waves: Wave 1 adds the `quizOption` typography tier (safe, foundational), Wave 2 rewrites QuizOption animations + WrongAnswerPanel colors + LetterHero sizing (all dependent on each other for visual coherence).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Claude's Discretion on LetterHero prominence -- Claude picks the approach for "living presence." 160px circle, display (72px) text, breathing glow.
- D-02: Use WarmGlow from `src/design/atmosphere/WarmGlow.tsx` with breathing token timing. Do NOT integrate AtmosphereBackground into quiz.
- D-03: Gold border expansion ripple on correct answer. Clean Reanimated shared values, no particle effects.
- D-04: Remove floating "+1" animation entirely. No plusOneOpacity, plusOneY, plusOneScale shared values.
- D-05: All other options dim simultaneously with correct option's ripple -- no staggered delay.
- D-06: Keep hapticSuccess() on correct answers.
- D-07: Remove shake animation on wrong answers. Instead, dim the wrong option briefly.
- D-08: Illuminate correct answer with warm glow when user picks wrong.
- D-09: Replace hapticError() with hapticTap() on wrong answers.
- D-10: WrongAnswerPanel: replace danger colors with warm cream/brown. Remove X icon. Keep encouragement copy.
- D-11: Add `quizOption` size tier to ArabicText at 52px via design system tokens.
- D-12: Apply `quizOption` tier to all Arabic text in quiz option buttons.

### Claude's Discretion
- LetterHero circle size and overall prominence approach
- Exact gold color for correct-answer ripple (work with existing accent #C4A464)
- Exact dim opacity for wrong/other options
- WrongAnswerPanel warm cream/brown exact colors (derive from token palette)
- Whether to show correct letter's name alongside glow in wrong-answer state
- Animation easing curves for ripple expansion and option dimming
- Reduce Motion fallback behavior for new quiz animations

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| QUIZ-01 | LetterHero component -- Arabic letter dominates top half with slow breathing and warm gold glow | LetterPrompt in QuizQuestion.tsx already renders WarmGlow + circle. Enlarge circle 120->160px, WarmGlow 180->240px. WarmGlow already has breathing via Phase 1. |
| QUIZ-02 | Correct answer triggers warm gold ripple from tapped option with haptic -- no floating "+1" | QuizOption.tsx selectedCorrect branch: remove plusOne* shared values (lines 53-56, 71-79, 214-218), change glow overlay color from primary to accent, add border width animation. |
| QUIZ-03 | Wrong answer dims briefly, correct illuminates with warm glow, no shake/red/X | QuizOption.tsx selectedWrong branch: remove translateX shake (lines 83-89), add opacity dip, swap hapticError->hapticTap. revealedCorrect branch: add warm glow animation. |
| QUIZ-04 | WrongAnswerPanel uses warm palette, no danger colors | WrongAnswerPanel.tsx: replace dangerLight/danger/dangerDark with accentLight/border/brown from existing tokens. Remove X icon element. |
| QUIZ-05 | Arabic text in quiz options uses generous sizing (48-56px) | Add `quizOption` to ArabicSize union in ArabicText.tsx mapping to existing arabicQuizHero token (52px). Change QuizOption isArabic rendering from size="large" to size="quizOption". |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-reanimated | 4.2.1 (installed) | All quiz animations (shared values, withTiming, withSequence) | Already in use for QuizOption. [VERIFIED: package.json] |
| expo-haptics | 55.0.11 (installed) | Haptic feedback (hapticTap, hapticSuccess) | Already wrapped in src/design/haptics.ts. [VERIFIED: package.json] |
| react-native-svg | 15.15.3 (installed) | WarmGlow SVG RadialGradient rendering | Already in use by WarmGlow.tsx. [VERIFIED: package.json] |

### Supporting
No new libraries needed. This phase uses only existing dependencies.

### Alternatives Considered
None -- all decisions are locked. No library choices to make.

**Installation:**
```bash
# No installation needed -- all dependencies already present
```

## Architecture Patterns

### Files Modified (no new files)
```
src/
  design/
    components/
      ArabicText.tsx        # Add quizOption size alias
      QuizOption.tsx         # Rewrite animation branches, remove +1/shake, add gold ripple
  components/
    quiz/
      QuizQuestion.tsx       # Enlarge LetterHero circle 120->160, WarmGlow 180->240
      WrongAnswerPanel.tsx   # Replace danger colors, remove X icon
```

### Pattern 1: 5-State Option Model (existing, modify in place)
**What:** QuizOption already has a discriminated state model: default, selectedCorrect, selectedWrong, revealedCorrect, dimmed. Each state maps to colors and animations via a useEffect switch.
**When to use:** All animation/color changes go through the existing state branches -- do not add new states.
**Key code location:** QuizOption.tsx lines 57-103 (useEffect on state), lines 142-164 (color mappings)
[VERIFIED: QuizOption.tsx source]

### Pattern 2: Source-Audit Testing (project convention)
**What:** Tests read source files with fs.readFileSync and assert patterns via regex/string matching. NOT component rendering tests.
**When to use:** All tests in this project follow this pattern for UI components. This is the established convention.
**Example:**
```typescript
// Source: src/__tests__/wrong-answer.test.ts
import * as fs from "fs";
const source = fs.readFileSync(SOURCE_PATH, "utf-8");
expect(source).toMatch(/pickCopy.*WRONG_ENCOURAGEMENT/);
```
[VERIFIED: quiz-question.test.ts, wrong-answer.test.ts]

### Pattern 3: Design Token Extension
**What:** Typography tiers defined in tokens.ts, consumed via ArabicText SIZE_MAP. New sizes added as entries in both.
**When to use:** Adding quizOption tier follows exact same pattern as Phase 1's quizHero addition.
**Key insight:** The UI-SPEC says `quizOption` reuses the arabicQuizHero token values (52px/114px) -- it is a semantic alias, not a new token.
[VERIFIED: ArabicText.tsx, tokens.ts]

### Pattern 4: WarmGlow Import Path
**What:** QuizQuestion.tsx currently imports WarmGlow from `../../components/onboarding/WarmGlow` (the re-export shim). Phase 1 moved the canonical WarmGlow to `src/design/atmosphere/WarmGlow.tsx` with a shim at the old path.
**When to use:** When modifying QuizQuestion.tsx, update the import to use the canonical path `../../design/atmosphere/WarmGlow` or import from `../../design/atmosphere`.
[VERIFIED: QuizQuestion.tsx line 13, Phase 1 02-SUMMARY.md]

### Anti-Patterns to Avoid
- **Adding new shared values:** The UI-SPEC budgets 14 shared values for the quiz screen (within 15-20 limit). The phase REMOVES 4 shared values (plusOneOpacity, plusOneY, plusOneScale, translateX shake usage). Do not add values beyond what the UI-SPEC specifies.
- **Hardcoded colors:** All colors must come from `useColors()` hook. The UI-SPEC maps every element to a named token (accentLight, brown, textMuted, etc.) -- use these, not hex literals.
- **Modifying QuizOption's 5-state type union:** The states remain the same. Only the animations and colors within each state change.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Radial glow effect | Custom View with opacity layers | WarmGlow from src/design/atmosphere/ | Already has SVG RadialGradient, breathing animation, useReducedMotion [VERIFIED: WarmGlow.tsx] |
| Breathing timing | Manual withRepeat timing values | `breathing` tokens from src/design/animations.ts | Centralized timing: inhale 2000ms, hold 500ms, exhale 2000ms, cycle 4500ms [VERIFIED: animations.ts] |
| Haptic feedback | Direct expo-haptics calls | hapticTap/hapticSuccess from src/design/haptics.ts | Already wrapped with correct feedback types [VERIFIED: haptics.ts] |
| Arabic text sizing | Inline fontSize/lineHeight | ArabicText component with size prop | Handles fontFamily, lineHeight ratio, overflow:visible, RTL direction [VERIFIED: ArabicText.tsx] |

## Common Pitfalls

### Pitfall 1: Shared Value Cleanup on State Reset
**What goes wrong:** When state changes back to "default" (new question), old animation values from previous state may linger, causing visual glitches.
**Why it happens:** The current QuizOption already has a reset branch (lines 94-101) that zeros out all shared values. If new animations are added without corresponding resets, the next question renders with stale animation state.
**How to avoid:** Every shared value animated in selectedCorrect or selectedWrong branches MUST be reset in the default/else branch.
**Warning signs:** Glow persisting between questions, border width stuck at thick.
[VERIFIED: QuizOption.tsx lines 94-101]

### Pitfall 2: Opacity Stacking on Wrong Answer
**What goes wrong:** The wrong option gets opacity dip (0.5->0.7) AND the dimmed state (0.35). If both apply, the wrong option is nearly invisible.
**Why it happens:** The dimmed opacity is applied via inline style `opacity: isDimmed ? 0.35 : 1` (line 179). The selectedWrong state is NOT dimmed -- it has its own animation. Need to ensure selectedWrong and dimmed are mutually exclusive (they already are in the state mapping).
**How to avoid:** Confirm that selectedWrong option has animated opacity (0.5->0.7 per UI-SPEC), NOT the dimmed static opacity. The `isDimmed` check only applies to state === "dimmed".
**Warning signs:** Wrong answer option barely visible.
[VERIFIED: QuizOption.tsx line 139, 179]

### Pitfall 3: WarmGlow Positioning Inside Enlarged Circle
**What goes wrong:** WarmGlow renders absolutely positioned. When LetterHero circle grows from 120px to 160px, the WarmGlow (180->240px) may not center correctly if the wrapper container doesn't accommodate the larger element.
**Why it happens:** letterCircleWrapper uses `alignItems: "center"` and `justifyContent: "center"` which should center both elements. But the WarmGlow's absolute positioning means it needs to be centered relative to the circle center.
**How to avoid:** The current pattern (WarmGlow + circle both inside a centered wrapper) already works at 120/180. Just update the dimensions -- the layout pattern is correct.
**Warning signs:** Glow offset from circle center.
[VERIFIED: QuizQuestion.tsx lines 82-104, styles.letterCircleWrapper]

### Pitfall 4: Border Width Animation Jank
**What goes wrong:** Animating borderWidth with Reanimated can cause layout recalculations and jank on Android.
**Why it happens:** borderWidth changes affect layout. On the UI thread, Reanimated handles transform/opacity well but layout properties less smoothly.
**How to avoid:** The UI-SPEC specifies border width change from 1.5px to 3px over 200ms. This is a small change. If jank occurs, use a transform scale on a border-only overlay instead. But try the direct approach first -- at 200ms it should be acceptable. [ASSUMED]
**Warning signs:** Frame drops during correct answer on mid-range Android.

### Pitfall 5: Gold Glow Overlay Color
**What goes wrong:** The UI-SPEC changes the glow overlay from `colors.primary` (dark green) to `colors.accent` (gold). The current overlay uses `StyleSheet.absoluteFill` with `backgroundColor: colors.primary` and animated opacity.
**Why it happens:** Simple color token swap in the existing overlay View.
**How to avoid:** Change the backgroundColor in the glow overlay from `colors.primary` to `colors.accent`. The opacity values also change (current: 0.3->0.1->0, target: 0->0.15->0).
[VERIFIED: QuizOption.tsx lines 186-195, UI-SPEC correct answer contract]

## Code Examples

### Example 1: Adding quizOption to ArabicText
```typescript
// Source: UI-SPEC + existing ArabicText.tsx pattern
type ArabicSize = "display" | "quizHero" | "quizOption" | "large" | "body";

const SIZE_MAP: Record<ArabicSize, { fontFamily: string; fontSize: number; lineHeight: number }> = {
  display: typography.arabicDisplay,
  quizHero: typography.arabicQuizHero,
  quizOption: typography.arabicQuizHero,  // semantic alias, same 52px/114px
  large: typography.arabicLarge,
  body: typography.arabicBody,
};
```
[VERIFIED: ArabicText.tsx existing pattern, UI-SPEC typography section]

### Example 2: Correct Answer Gold Ripple (replacing current)
```typescript
// Source: UI-SPEC Correct Answer Feedback Contract
if (state === "selectedCorrect") {
  // Scale pulse (unchanged timing)
  scale.value = withSequence(
    withTiming(1.04, { duration: 150 }),
    withTiming(1, { duration: 150 })
  );
  // Gold glow overlay (changed: accent color, lower peak opacity)
  glowOpacity.value = withSequence(
    withTiming(0.15, { duration: 200, easing: Easing.out(Easing.cubic) }),
    withTiming(0, { duration: 300, easing: Easing.in(Easing.cubic) })
  );
  hapticSuccess();
  // NOTE: plusOne* animations removed entirely
}
```
[VERIFIED: UI-SPEC animation sequence table]

### Example 3: Wrong Answer Dim (replacing shake)
```typescript
// Source: UI-SPEC Wrong Answer Feedback Contract
if (state === "selectedWrong") {
  // Gentle opacity dip instead of shake
  wrongOpacity.value = withSequence(
    withTiming(0.5, { duration: 200, easing: Easing.out(Easing.cubic) }),
    withTiming(0.7, { duration: 200, easing: Easing.in(Easing.cubic) })
  );
  hapticTap();  // was hapticError()
}
```
[VERIFIED: UI-SPEC wrong answer animation table]

### Example 4: WrongAnswerPanel Color Swap
```typescript
// Source: UI-SPEC WrongAnswerPanel Redesign Contract
// Before:
{ backgroundColor: colors.dangerLight }  // #FCE6E5 red tint
<Text style={{ color: colors.danger }}>X</Text>  // red X icon
<Text style={{ color: colors.dangerDark }}>...</Text>  // dark red text

// After:
{ backgroundColor: colors.accentLight }  // #F5EDDB warm cream
// X icon removed entirely
<Text style={{ color: colors.brown }}>...</Text>  // #3D2B1F warm brown
```
[VERIFIED: UI-SPEC color mapping table, tokens.ts color values]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run src/__tests__/quiz-correct-feedback.test.ts --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| QUIZ-01 | LetterHero 160px circle, WarmGlow 240px, display size text, breathing animated | source-audit | `npx vitest run src/__tests__/quiz-letterhero.test.ts -x` | Wave 0 |
| QUIZ-02 | No +1 animation, gold glow overlay uses accent color | source-audit | `npx vitest run src/__tests__/quiz-correct-feedback.test.ts -x` | Wave 0 |
| QUIZ-03 | No shake, no hapticError, opacity dim on wrong, glow on revealedCorrect | source-audit | `npx vitest run src/__tests__/quiz-correct-feedback.test.ts -x` | Wave 0 |
| QUIZ-04 | WrongAnswerPanel no danger colors, no X icon, uses accentLight/brown | source-audit | `npx vitest run src/__tests__/quiz-wrong-feedback.test.ts -x` | Wave 0 |
| QUIZ-05 | ArabicText has quizOption size, QuizOption uses quizOption | source-audit | `npx vitest run src/__tests__/quiz-correct-feedback.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/__tests__/quiz-*.test.ts --reporter=verbose`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/quiz-letterhero.test.ts` -- covers QUIZ-01 (circle size, WarmGlow size, import path, breathing animated prop)
- [ ] `src/__tests__/quiz-correct-feedback.test.ts` -- covers QUIZ-02, QUIZ-03, QUIZ-05 (no +1, no shake, no hapticError, accent glow, quizOption size, revealedCorrect glow)
- [ ] `src/__tests__/quiz-wrong-feedback.test.ts` -- covers QUIZ-04 (no danger tokens, no X icon, accentLight/brown)

Existing tests to update:
- `src/__tests__/quiz-question.test.ts` -- currently passing, may need update if assertions become stale
- `src/__tests__/wrong-answer.test.ts` -- currently passing, assertions still valid (checks encouragement text, not colors)

## Security Domain

Not applicable -- this phase is purely UI animation/color changes with no data handling, authentication, or external communication.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Border width animation (1.5->3px over 200ms) will not cause jank on mid-range Android | Pitfalls #4 | Might need to use transform-based border instead; minor implementation change |

## Open Questions (RESOLVED)

1. **Non-Arabic option text weight** — RESOLVED: Implement at 20px per UI-SPEC (heading2 Lora SemiBold 600) per 02-02 Task 1 STEP D, action step 24. Fall back to 17px if cramped during visual verification.

2. **Existing test compatibility** — RESOLVED: 02-02 Task 2 explicitly includes wrong-answer.test.ts in its verify command. Existing tests check behavioral patterns and WRONG_ENCOURAGEMENT import (both preserved), not color values. Verified safe to proceed.

## Sources

### Primary (HIGH confidence)
- QuizOption.tsx source -- exact current implementation of 5-state model, animations, +1 floating text
- QuizQuestion.tsx source -- exact current LetterPrompt layout, WarmGlow sizing, circle dimensions
- WrongAnswerPanel.tsx source -- exact current danger colors, X icon, layout structure
- ArabicText.tsx source -- exact current SIZE_MAP, ArabicSize union type
- tokens.ts source -- all color tokens (accentLight, brown, textMuted), typography tokens (arabicQuizHero)
- animations.ts source -- breathing tokens (inhale 2000, hold 500, exhale 2000, cycle 4500)
- haptics.ts source -- hapticTap (ImpactFeedbackStyle.Light), hapticSuccess, hapticError functions
- WarmGlow.tsx source -- AnimatedWarmGlow API (size, color, pulseMin, pulseMax, animated props)
- Phase 1 summaries -- confirmed WarmGlow relocated, breathing tokens added, arabicQuizHero at 52px/114px
- 02-UI-SPEC.md -- pixel-exact animation sequences, color mappings, shared value budget
- 02-CONTEXT.md -- locked decisions D-01 through D-12

### Secondary (MEDIUM confidence)
- npm registry: react-native-reanimated latest is 4.3.0, project uses 4.2.1 [VERIFIED: npm view]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all verified in package.json and source
- Architecture: HIGH -- all four files read in full, patterns documented from source
- Pitfalls: HIGH -- derived from actual code analysis, not theoretical

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (stable -- no dependency changes needed)
