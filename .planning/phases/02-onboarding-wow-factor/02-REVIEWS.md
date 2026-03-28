---
phase: 2
reviewers: [claude]
reviewed_at: 2026-03-28
plans_reviewed: [02-00-PLAN.md, 02-01-PLAN.md, 02-02-PLAN.md, 02-03-PLAN.md]
---

# Cross-AI Plan Review — Phase 2

## Claude Review (Separate Session)

# Phase 2: Onboarding Wow Factor — Plan Review

## Overall Assessment

These four plans are exceptionally well-structured. The wave-based decomposition (test stubs → foundation components → orchestration + screens → sacred moments + overlay) is sound, dependencies are correctly ordered, and the research/UI-SPEC backing is thorough. The plans are implementable as written with minimal ambiguity.

---

## Plan 02-00: Test Stubs (Wave 0)

### Summary
Creates four test stub files establishing verification targets before implementation. Includes real regression tests for existing animation constants alongside todo stubs for new behavior. Low risk, high value.

### Strengths
- Regression tests for existing constants catch accidental breakage during refactoring
- Todo stubs map cleanly to requirement IDs (ONB-01 through MIND-02)
- Follows existing test patterns from Phase 1 (animations.test.ts, haptics.test.ts)

### Concerns
- **LOW:** The `onboarding-flow.test.ts` stubs reference `STEP` constant exports and `STEP_NAMES` — these don't exist yet (created in Plan 02). The todo tests won't fail, but a developer reading them might be confused about what to import. Consider adding a comment noting these are forward-looking stubs.
- **LOW:** `warm-glow.test.ts` has only 3 todo stubs. Given WarmGlow is the most reused component in Phase 2, consider adding stubs for the backward-compatibility contract (static mode renders plain View, not Animated.View).

### Suggestions
- Add a stub in `warm-glow.test.ts`: `it.todo("static mode (animated=false) does not import Reanimated")` — this is the key backward-compat guarantee from Pitfall 5.
- Add a stub in `bismillah.test.ts` for the overlay: `it.todo("BismillahOverlay renders with bgWarm background at 0.97 opacity")` — catches Pitfall 4.

### Risk Assessment: **LOW**
Test stubs can't break anything. The only risk is incomplete coverage, which is minor since the stubs are starting points.

---

## Plan 02-01: Foundation Components (Wave 1)

### Summary
Builds the shared visual building blocks: WarmGlow animated variant, FloatingLettersLayer tint prop, BrandedLogo from SVG, and new animation constants. Clean separation of concerns — all downstream plans depend on these outputs.

### Strengths
- WarmGlow backward compatibility is well-protected (animated defaults to false, static path uses plain View)
- BrandedLogo animation budget is disciplined (5 shared values, well under the 15-per-step cap)
- LETTER_REVEAL_HAPTIC_DELAY as a computed constant eliminates magic numbers downstream
- Explicitly calls out NOT using react-native-svg-transformer (correct — CSS @keyframes won't work)

### Concerns
- **MEDIUM:** The WarmGlow code example has a React hooks violation. When `animated=false`, the function returns early *before* the `useSharedValue` and `useAnimatedStyle` calls. This violates the Rules of Hooks (hooks must be called unconditionally). The fix: always call the hooks, but only use the animated branch in the render. Or restructure as two separate components internally.
  
  ```typescript
  // PROBLEM: conditional return before hooks
  if (!animated) {
    return <View ... />;  // ← early return
  }
  const pulseOpacity = useSharedValue(pulseMin);  // ← hook after conditional return
  ```

- **MEDIUM:** FloatingLettersLayer change introduces `useColors()` hook call that only runs when `tint === 'accent'`. But hooks can't be called conditionally. The plan says "if `tint === 'accent'`, call `useColors()`" — this must be restructured to always call `useColors()` and only use the accent value conditionally.

- **LOW:** BrandedLogo uses `Animated.createAnimatedComponent(Circle)` — verify this works with react-native-svg 15.15.3 + Reanimated 4.2.1. There have been historical compatibility issues between animated SVG components and newer Reanimated versions. The combination should work, but it's worth a quick compile-and-render check.

- **LOW:** The arch paths from the SVG are mentioned but the plan doesn't provide the exact `d` attribute values. The executor will need to extract these from `tila-transparent-mark.svg`. This is straightforward but could slow down execution if the SVG is complex.

### Suggestions
- Fix the WarmGlow hooks violation: either (a) always call hooks and conditionally render, or (b) split into `StaticWarmGlow` and `AnimatedWarmGlow` internal components with a wrapper that delegates. Option (a) is simpler:
  ```typescript
  export function WarmGlow({ animated = false, ... }) {
    const pulseOpacity = useSharedValue(pulseMin);
    // ... always set up hooks ...
    if (!animated) {
      return <View ... />;
    }
    return <Animated.View ... />;
  }
  ```
  But this means Reanimated is always imported even for static usage. Better approach: **two internal components**, one static (no hooks), one animated (with hooks), and a thin wrapper that picks based on the prop.

- Always call `useColors()` in FloatingLettersLayer regardless of tint prop — it's cheap and avoids the conditional hook issue.

### Risk Assessment: **MEDIUM**
The hooks violations in WarmGlow and FloatingLettersLayer will cause runtime crashes if not addressed. These are straightforward to fix but the plan as written would produce broken code.

---

## Plan 02-02: BismillahMoment + OnboardingFlow + Screen Elevations (Wave 2)

### Summary
The core orchestration change — inserts Bismillah as step 4, rewrites OnboardingFlow with named STEP constants, and elevates Welcome/Tilawat/Hadith. Well-structured with clear acceptance criteria.

### Strengths
- STEP constant object eliminates the off-by-one pitfall elegantly — this is the single best architectural decision in the plans
- Exporting STEP for test consumption is a nice touch
- CTA copy changes ("Begin Reading", "Continue Journey") are minimal, low-risk improvements
- BismillahMoment is self-contained with its own auto-advance timer — clean separation from the orchestrator
- Explicitly preserves stagger constants (ONB-03 compliance)

### Concerns
- **MEDIUM:** The plan says to update LetterReveal auto-advance timeout from 3500 to 4500, but the LetterReveal auto-advance logic is *in OnboardingFlow.tsx*, not in LetterReveal.tsx itself. Plan 03 also modifies LetterReveal.tsx. There's potential for a merge conflict or inconsistency if both plans touch the same auto-advance timer. Clarify: the timer in OnboardingFlow that checks `step === STEP.LETTER_REVEAL` and calls `setStep(STEP.LETTER_AUDIO)` after 4500ms is here (Plan 02), while the internal animation choreography is in Plan 03. This is actually fine if the boundary is clear, but the plan should explicitly state "Plan 03 handles LetterReveal's internal animations; this plan only handles the orchestrator's auto-advance timer."

- **MEDIUM:** The plan removes the `LogoMark` function from Welcome.tsx and replaces it with `BrandedLogo`. But if Plan 01 (BrandedLogo creation) hasn't been executed yet or fails, Welcome.tsx will have a broken import. The dependency chain (02-01 → 02-02) handles this, but the plan should note that Task 2 (Welcome elevation) MUST NOT start until Plan 01's Task 2 (BrandedLogo) is verified.

- **LOW:** Analytics step tracking is mentioned in the RESEARCH pitfalls but not addressed in the plan. If analytics events log step indices, they'll now report different numbers for the same steps. The plan should either (a) update analytics to use STEP_NAMES instead of indices, or (b) explicitly defer this to a later plan/phase with a note.

- **LOW:** The plan says "No additional timer needed here" for Bismillah in OnboardingFlow, which is correct since BismillahMoment handles its own timer. But the existing LetterReveal auto-advance IS in OnboardingFlow (not in the component). Verify this pattern inconsistency is intentional — having some auto-advances in the orchestrator and some in the component could confuse future maintainers.

### Suggestions
- Add a comment in OnboardingFlow noting the auto-advance pattern: "LetterReveal and Bismillah auto-advance from their own component timers via onNext/goNext. Other steps advance via user button press."
- Address analytics step tracking — even a `// TODO: Update analytics to use STEP_NAMES` is better than silent breakage.
- Add explicit note: "Task 2 depends on Plan 01 Task 2 (BrandedLogo must exist before Welcome can import it)."

### Risk Assessment: **LOW-MEDIUM**
The STEP constants approach is robust. Main risk is the analytics gap and the auto-advance timer ownership confusion between Plans 02 and 03.

---

## Plan 02-03: LetterReveal Sacred Moment + Finish + BismillahOverlay (Wave 2)

### Summary
The emotional peak of Phase 2 — the sacred letter reveal with stillness beat, celebratory finish, and the daily Bismillah ritual overlay. Architecturally clean with the module-level session detection pattern.

### Strengths
- LETTER_REVEAL_HAPTIC_DELAY constant eliminates all magic numbers — every timing value is derived from named constants
- Module-level session detection is elegant and correct for the React Native process lifecycle
- BismillahOverlay's absolute positioning with 0.97 opacity background solves the mounting race (Pitfall 4)
- Lazy initializer `useState(() => shouldShowBismillah())` avoids unnecessary recalculation

### Concerns
- **HIGH:** The Finish.tsx checkmark animation replaces Reanimated's `entering` prop with manual `useSharedValue` + `withSpring`. But the plan starts the scale at 0.5 and also uses `opacity: scale.value` — meaning the checkmark would be at 50% opacity when fully visible (scale 1.0 = opacity 1.0, but scale 0.5 = opacity 0.5 on initial render). The opacity mapping needs to be separate or the starting scale should be 0 (not 0.5) if you want opacity to track. Better: use a separate opacity shared value, or use `interpolate(scale.value, [0.5, 1], [0, 1])` for opacity.

- **MEDIUM:** BismillahOverlay uses `setTimeout` with 550ms (slightly after 500ms fade) to call `onComplete`. This is fragile — if the animation runs slightly longer due to frame scheduling, the component unmounts mid-fade. A more robust approach: use Reanimated's `withTiming` callback via `runOnJS` to signal completion when the opacity reaches 0.

- **MEDIUM:** The plan says Plans 02 and 03 are both Wave 2 (`depends_on: ["02-00", "02-01"]`), meaning they can execute in parallel. But Plan 02 Task 1 modifies OnboardingFlow.tsx (step indices, auto-advance timer), and Plan 03 Task 1 modifies LetterReveal.tsx which relies on the step index changes. If they truly run in parallel, Plan 03's LetterReveal changes are fine (separate file), but the auto-advance timer in OnboardingFlow is modified by Plan 02 and relied upon by Plan 03's LETTER_REVEAL_HAPTIC_DELAY. Since these are different files, parallel execution should work, but verify there's no shared state issue.

- **LOW:** `let bismillahShownThisSession = false` at module scope — if React Native's Fast Refresh reinitializes the module during development, this will reset and show Bismillah again. This is a dev-only issue and acceptable, but worth noting so developers don't file a bug.

- **LOW:** The BismillahOverlay FadeIn entering animations (`FadeIn.delay(200).duration(800)` for Arabic text) will run INSIDE the `Animated.View` that also has the overlay opacity animation. When the overlay starts fading out at 2500ms, the content inside has been fully visible for ~1700ms. This should be fine visually, but the content FadeIn and the overlay FadeOut are independent animation trees — verify they don't interfere.

### Suggestions
- **Fix Finish checkmark opacity:** Use `interpolate` from Reanimated:
  ```typescript
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [0.5, 1.0], [0, 1]),
  }));
  ```
  Or start scale at 0 and map opacity accordingly.

- **Use runOnJS for BismillahOverlay completion:** Instead of `setTimeout(onComplete, 550)`:
  ```typescript
  overlayOpacity.value = withTiming(0, { duration: 500 }, (finished) => {
    if (finished) {
      runOnJS(onComplete)();
    }
  });
  ```
  This is deterministic — completion fires exactly when the animation finishes.

- Add a brief dev note about Fast Refresh resetting the module-level boolean.

### Risk Assessment: **MEDIUM**
The Finish checkmark opacity bug will produce a visually incorrect result. The BismillahOverlay timing fragility is a minor but real race condition. Both are straightforward fixes.

---

## Cross-Plan Assessment

### Dependency Chain
```
02-00 (stubs) → 02-01 (foundation) → 02-02 (orchestration) ─┐
                                    → 02-03 (sacred moments) ─┘
```
This is correct. Plans 02 and 03 can execute in parallel after 01 completes. No circular dependencies.

### Requirement Coverage

| Req | Plan(s) | Covered? |
|-----|---------|----------|
| ONB-01 | 02-02 (BrandedLogo in Welcome, 9-step flow) | Yes |
| ONB-02 | 02-03 (LetterReveal stillness + haptic + dual glow) | Yes |
| ONB-03 | 02-01 (constants), 02-02 (stagger preservation) | Yes |
| ONB-04 | 02-01 (WarmGlow animated), 02-02 (screens use it) | Yes |
| MIND-01 | 02-02 (BismillahMoment), 02-03 (BismillahOverlay) | Yes |
| MIND-02 | 02-02 (2.5s auto-advance), 02-03 (session detection) | Yes |

All 6 requirements are covered. No gaps.

### Performance Budget Check
- Welcome step: BrandedLogo (5 values) + FloatingLettersLayer (12 letters, each with ~1 value) + WarmGlow (1 value) + content stagger (~5 entering animations) = ~23. **This exceeds the 15-value-per-step target.** The plans acknowledge this tension (Pitfall 2) but don't enforce a mitigation. The FloatingLettersLayer at 12 animated letters is the elephant in the room. Consider: (a) reducing FloatingLettersLayer to 8 letters on Welcome, or (b) accepting the ~23 count since FloatingLettersLayer letters use simple opacity animations that are lightweight on the UI thread.

### Missing Pieces
1. **Reduced motion accessibility** — mentioned in RESEARCH Open Question 1 but not addressed in any plan. Consider adding `useReducedMotion()` at least in the new components (WarmGlow, BrandedLogo, BismillahMoment). This could be a separate micro-plan or deferred.
2. **Analytics step index update** — step indices shift but analytics tracking isn't updated. Silent data quality issue.
3. **Existing test suite** — Plans don't mention running the full existing test suite after changes. `npm test` should be run as a gate, not just `npm run validate`.

---

## Summary of Action Items

| Priority | Issue | Plan | Fix |
|----------|-------|------|-----|
| **HIGH** | WarmGlow hooks violation (conditional return before hooks) | 02-01 | Restructure to always call hooks or use two internal components |
| **HIGH** | Finish checkmark opacity mapped to scale value (0.5 opacity at rest) | 02-03 | Use interpolate or separate opacity shared value |
| **MEDIUM** | FloatingLettersLayer conditional useColors() hook call | 02-01 | Always call useColors(), use value conditionally |
| **MEDIUM** | BismillahOverlay completion uses fragile setTimeout(550) | 02-03 | Use withTiming callback + runOnJS |
| **MEDIUM** | Welcome step animation budget ~23 (exceeds 15 target) | 02-01/02-02 | Reduce FloatingLettersLayer count on Welcome or accept |
| **LOW** | Analytics step tracking not updated after Bismillah insertion | 02-02 | Add TODO or update analytics to use STEP_NAMES |
| **LOW** | Reduced motion accessibility not addressed | All | Defer or add useReducedMotion() in new components |
| **LOW** | Full test suite (`npm test`) not in verification steps | All | Add `npm test` alongside `npm run validate` |

## Overall Risk: **MEDIUM**

The plans are well-researched and thorough. The two HIGH issues (hooks violation, opacity bug) are implementation-level errors in the code examples, not architectural flaws — they're quick fixes. The architectural decisions (STEP constants, module-level session detection, wave-based decomposition) are sound. With the fixes above, these plans should execute cleanly.
---

## Consensus Summary

Single reviewer — key findings below.

### Key Concerns
- **HIGH:** WarmGlow hooks violation — conditional return before hooks in animated mode (Plan 02-01)
- **HIGH:** Finish checkmark opacity mapped to scale value causes 0.5 opacity at rest (Plan 02-03)
- **MEDIUM:** FloatingLettersLayer conditional useColors() hook call (Plan 02-01)
- **MEDIUM:** BismillahOverlay completion uses fragile setTimeout(550) instead of animation callback (Plan 02-03)
- **MEDIUM:** Welcome step animation budget ~23 exceeds 15 target (FloatingLettersLayer is the culprit)

### Strengths
- Exceptionally well-structured wave decomposition
- Dependencies correctly ordered, no file overlap in parallel plans
- STEP constants prevent off-by-one errors from Bismillah insertion
- Module-level session detection is simpler and more reliable than SecureStore

### Overall Risk: MEDIUM
Implementation-level code example errors (hooks, opacity), not architectural flaws. Quick fixes during execution.
