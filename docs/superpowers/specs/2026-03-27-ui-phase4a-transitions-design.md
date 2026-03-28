# UI Phase 4a: Screen & Step Transitions — Design Spec

**Date:** 2026-03-27
**Context:** First of 3 UX detail sub-phases. Adds purposeful transitions to the four key navigation zones: lesson entry, lesson exit, exercise-to-exercise flow, and onboarding step progression. Phase 1-3 built structure, design system, and polish; Phase 4a makes navigation feel alive.

**Visual direction:** Spring-damped, directional transitions that create psychological momentum. Lessons slide up like a focused workspace. Exercises flow left-to-right like turning pages. Everything uses springs, never linear timing.

---

## Strategy

The app currently uses a global `animation: "fade"` with 300ms for all screen transitions, and exercises within lessons enter with `FadeInDown.springify()` but have no exit animation. Onboarding steps have no transition animation at all — they just appear. Phase 4a adds intentional transitions to each navigation zone.

**What this phase does:**
- Lesson screens slide up from bottom (entry) and back down (exit)
- Exercises within lessons cross-fade with directional slide (exit left, enter right)
- Onboarding steps get the same directional flow (exit left, enter right)
- Add animation timing presets for transitions to the existing animation constants file
- Lesson stage transitions (intro→quiz, quiz→summary) get cross-fades

**What this phase does NOT do:**
- No Lottie celebrations (Phase 4b)
- No loading skeletons (Phase 4c)
- No haptic pattern changes (Phase 4b)
- No empty states (Phase 4b)
- No tab switching animations (low impact)
- No shared element transitions (too complex for the payoff)

---

## Zone 1: Lesson Entry & Exit

### How it works

The lesson route (`app/lesson/[id].tsx` and `app/lesson/review.tsx`) currently inherits the global `fade` animation from the root Stack. Change the root Stack to configure lesson routes with `slide_from_bottom` animation.

### Changes

In `app/_layout.tsx`, add a `Screen` component for the lesson route group with specific animation options:

```typescript
<Stack.Screen
  name="lesson/[id]"
  options={{
    animation: "slide_from_bottom",
    animationDuration: 400,
  }}
/>
<Stack.Screen
  name="lesson/review"
  options={{
    animation: "slide_from_bottom",
    animationDuration: 400,
  }}
/>
```

The `slide_from_bottom` animation in expo-router/react-navigation handles both entry (slide up) and exit (slide down) automatically. When `router.back()` or `router.replace()` is called from LessonSummary, the screen slides back down.

### Exit behavior

Currently, `handleContinue` in `app/lesson/[id].tsx` uses `router.replace("/(tabs)")` (line 138). For the slide-down exit to work properly, this should use `router.back()` instead when possible, since `replace` doesn't trigger the exit animation.

Check `handleContinue` logic:
- If navigating back to tabs after a normal lesson: use `router.back()`
- If navigating to a post-onboarding route: keep `router.replace()` (this is a special case, acceptable to fade)

---

## Zone 2: Lesson Stage Transitions (Intro → Quiz → Summary)

### How it works

Inside `app/lesson/[id].tsx`, the `stage` state switches between `"intro"`, `"quiz"`, and `"summary"`. Currently these stages render with conditional `if` blocks — no animation on the switch.

### Changes

Wrap each stage's rendered component in an `Animated.View` with entering/exiting layout animations:

```typescript
<Animated.View
  key={stage}
  entering={FadeIn.duration(300)}
  exiting={FadeOut.duration(200)}
>
  {/* stage content */}
</Animated.View>
```

This uses `key={stage}` to trigger mount/unmount animations when the stage changes. The fade is intentionally simple — stage transitions should feel smooth but not draw attention. The directional slides are reserved for within-stage exercise transitions.

Apply the same pattern to `app/lesson/review.tsx` for its `stage` transitions.

---

## Zone 3: Exercise-to-Exercise Transitions (LessonHybrid)

### Current state

In `src/components/LessonHybrid.tsx` (lines 254-261):

```typescript
<Animated.View
  key={hybrid.exerciseIndex}
  entering={FadeInDown.springify().stiffness(320).damping(28)}
  style={styles.exerciseWrapper}
>
  {renderExercise()}
</Animated.View>
```

Currently: exercises enter with `FadeInDown` (spring) but have **no exit animation**. The old exercise just unmounts.

### Changes

Add an exiting animation and change the entering direction to create forward momentum:

```typescript
<Animated.View
  key={hybrid.exerciseIndex}
  entering={FadeIn.duration(300).delay(100)}
  exiting={FadeOut.duration(200)}
  style={styles.exerciseWrapper}
>
  {renderExercise()}
</Animated.View>
```

**Why fade instead of directional slide:** The exercises already have internal staggered animations (FadeInDown on elements within GuidedReveal, BuildUpReader, etc.). Adding a container-level horizontal slide would compound with the internal animations and feel chaotic. A simple fade crossover at the container level lets the internal element animations provide the visual interest.

The 100ms delay on entering ensures the exiting animation has time to start before the new content appears, preventing a jarring overlap.

---

## Zone 4: Onboarding Step Transitions

### Current state

In `src/components/onboarding/OnboardingFlow.tsx` (lines 144-171), steps render in conditional `{step === N && <Component />}` blocks inside a `ScrollView`. There is no animation when switching between steps — the new step just appears.

Each step already has its own internal entry animations (FadeIn, FadeInDown with stagger) via `OnboardingStepLayout`, but the step-level transition itself is invisible.

### Changes

Wrap the step rendering in an `Animated.View` keyed by the step index:

```typescript
<Animated.View
  key={step}
  entering={FadeIn.duration(400)}
  exiting={FadeOut.duration(250)}
  style={{ flex: 1 }}
>
  {step === 0 && <Welcome onNext={goNext} />}
  {step === 1 && <Tilawat onNext={goNext} />}
  {/* ... etc */}
</Animated.View>
```

**Why fade instead of directional slide:** Same reasoning as exercises — each step has its own staggered internal animations. A horizontal slide on the container plus FadeInDown on internal elements would fight each other. The container-level fade provides a clean handoff, and the internal stagger animations create the sense of forward progression.

**Special case — step 4 (LetterReveal):** This step auto-advances after 3.5s. The exit fade (250ms) will overlap with step 5's entry fade, creating a natural crossfade. No special handling needed.

---

## Animation Timing Presets

### New constants

Add to `src/components/onboarding/animations.ts` (or create a new shared file if these are used beyond onboarding):

```typescript
// ── Transition presets (Phase 4a) ──
export const TRANSITION_FADE_IN = 300;      // ms — container-level fade in
export const TRANSITION_FADE_OUT = 200;     // ms — container-level fade out
export const TRANSITION_FADE_IN_DELAY = 100; // ms — delay before new content fades in
export const TRANSITION_LESSON_DURATION = 400; // ms — lesson slide up/down
```

These presets are used across Zones 2-4 for consistency.

---

## Files Changed

### Modified files
```
app/_layout.tsx                                     — lesson route slide_from_bottom animation
app/lesson/[id].tsx                                 — stage transition animations, exit navigation fix
app/lesson/review.tsx                               — stage transition animations
src/components/LessonHybrid.tsx                     — exercise exit animation, entering change
src/components/onboarding/OnboardingFlow.tsx        — step transition animations
src/components/onboarding/animations.ts             — transition timing presets
```

---

## Success Criteria

- [ ] Lesson screens slide up from bottom when entering, slide down when exiting
- [ ] Lesson stage transitions (intro→quiz→summary) fade smoothly
- [ ] Exercises within LessonHybrid have exit animation (fade out) before next enters
- [ ] Onboarding steps transition with fade out/in when advancing
- [ ] Transition timing presets exist in animations.ts
- [ ] Auto-advancing steps (LetterReveal) crossfade naturally
- [ ] No visual glitches from overlapping animations
- [ ] Existing internal element animations (stagger, FadeInDown) still work within steps/exercises
- [ ] App builds and runs correctly
- [ ] Dark theme unaffected

---

## Non-Goals

- No Lottie celebrations (Phase 4b)
- No loading skeletons (Phase 4c)
- No haptic changes (Phase 4b)
- No empty states (Phase 4b)
- No tab transition animations
- No shared element transitions
- No gesture-based dismiss (swipe down to close lesson)
