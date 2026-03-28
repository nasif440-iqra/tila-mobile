# Phase 2: Onboarding Wow Factor - Research

**Researched:** 2026-03-28
**Domain:** Onboarding flow visual elevation, branded asset integration, sacred moment choreography (React Native / Reanimated)
**Confidence:** HIGH

## Summary

Phase 2 transforms the existing 8-step onboarding into a 9-step flow by elevating visual warmth across all screens, replacing the inline SVG logo with the real branded asset, creating a sacred "first letter" reveal moment with deliberate stillness and haptic feedback, and adding a Bismillah breathing moment both as an onboarding step and as a per-session overlay before the first lesson. The entire phase operates within the existing technology stack -- no new dependencies are needed.

The codebase is well-structured for this work. Every onboarding step already uses `OnboardingStepLayout`, `WarmGlow`, animation constants from `animations.ts`, and the shared design tokens. The changes are primarily: (1) enhancing `WarmGlow` with animated opacity pulsing, (2) creating a `BrandedLogo` component from the SVG mark, (3) adding a `BismillahMoment` onboarding step and `BismillahOverlay` for lesson entry, (4) adjusting `OnboardingFlow` step indices and timing, and (5) enriching the LetterReveal and Finish steps with the specified choreography.

**Primary recommendation:** Implement as three waves -- Wave 1: WarmGlow enhancement + BrandedLogo component + Welcome screen upgrade; Wave 2: BismillahMoment step + LetterReveal sacred moment + OnboardingFlow orchestration; Wave 3: BismillahOverlay for lesson entry + Finish celebration + remaining screen polish (Tilawat, Hadith).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Replace the hand-coded SVG logo in Welcome screen with the real branded logos from `assets/logo/`. Use `tila-transparent-mark.svg` for the mark and the appropriate lockup for the full brand display.
- **D-02:** All onboarding screens should use the branded assets consistently -- the crescent moon, stars, arch, and gold accents are the visual identity.
- **D-03:** Elegant but restrained -- not over-the-top. Warm glow intensifies, Alif fades in beautifully with a brief pause, then audio plays. Special but dignified.
- **D-04:** A beat of stillness (1-2 seconds) before the audio plays -- let the letter sit with visual weight before sound confirms it.
- **D-05:** Subtle haptic pulse when the letter appears (milestone-tier from Phase 1 haptics system).
- **D-06:** Gold accent glow should be the visual signature -- matches the branded crescent moon + keystone accent color.
- **D-07:** Bismillah appears during onboarding flow (between StartingPoint and LetterReveal, or as its own step).
- **D-08:** Bismillah also appears before the FIRST lesson of each app session -- not every lesson, just the first one per session. This makes it a centering ritual.
- **D-09:** Duration: 2-3 seconds. Brief enough to not feel like friction. Beautiful Arabic calligraphy with gentle fade and warm glow.
- **D-10:** No skip button on the Bismillah moment -- it's part of the experience, and at 2-3 seconds it's not long enough to annoy.
- **D-11:** Elevate ALL onboarding screens, not just the letter moment. Every step should feel visually warm and intentional.
- **D-12:** Welcome screen gets the biggest upgrade -- real branded logo, richer entrance animations, warmer visual treatment.
- **D-13:** Tilawat and Hadith screens should feel reverent -- these set the Islamic context. Elegant typography, warm tones, subtle glow.
- **D-14:** Finish screen should feel celebratory -- the user just completed onboarding, acknowledge it warmly.
- **D-15:** Use Phase 1's shared animation presets (`src/design/animations.ts`) for all timing -- no new magic numbers.
- **D-16:** Step transitions should feel flowing -- staggered content entrances, smooth fades between steps.
- **D-17:** Floating letters layer (already exists) should be preserved and potentially enhanced with warmer gold tones.

### Claude's Discretion
- Exact placement of Bismillah in the onboarding step sequence (could be a new step or integrated into LetterReveal)
- How to implement "first lesson per session" detection for Bismillah (likely via session timestamp in SecureStore)
- Specific animation choreography for each screen's entrance
- Whether to add new visual elements (decorative borders, Islamic geometric patterns) or enhance existing ones
- How to render SVG logo assets in React Native (react-native-svg or image conversion)
- FloatingLettersLayer enhancement approach

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ONB-01 | Onboarding flow feels special and inspiring -- not a generic walkthrough | BrandedLogo component, enhanced WarmGlow with animated pulsing, FloatingLettersLayer gold tint, staggered choreography per UI-SPEC |
| ONB-02 | "First letter" moment feels sacred and exciting -- gold particles, gentle animation, moment of stillness before audio | LetterReveal elevation: stillness beat (1200ms), hapticMilestone(), dual WarmGlow (outer gold + inner accent ring), adjusted auto-advance from 3500ms to 4500ms |
| ONB-03 | Onboarding transitions are smooth with staggered entrance animations | Existing FadeIn/FadeOut/FadeInDown/FadeInUp with SPLASH_STAGGER_BASE/SPLASH_STAGGER_DURATION already in place; Phase 2 preserves and enhances these |
| ONB-04 | Visual warmth throughout (warm glow effects, elegant Arabic floating elements) | WarmGlow animated variant (withRepeat pulsing), FloatingLettersLayer extended to steps 0-3 with accent tint option, bgWarm background on all steps |
| MIND-01 | Bismillah breathing moment before lessons -- brief mindful pause acknowledging the sacred nature of Quran learning | BismillahMoment onboarding step (step 4) + BismillahOverlay component for first-lesson-per-session in app/lesson/[id].tsx |
| MIND-02 | Moment is brief (2-3 seconds) and adds to the experience, not friction | 2500ms auto-advance timer, no skip button, FadeIn/FadeOut choreography, session detection via SecureStore to prevent repetition |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- No New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-reanimated | 4.2.1 | All animations: WarmGlow pulsing, content stagger, stillness beat, logo animations, BismillahOverlay fade | Already installed. Layout animations (FadeIn, FadeInDown, etc.) and imperative API (withRepeat, withSequence, withTiming) cover 100% of Phase 2 needs. |
| react-native-svg | 15.15.3 | BrandedLogo component (Svg, Path, Circle from tila-transparent-mark.svg) | Already installed. Used in current Welcome LogoMark. Extend to render the real branded asset. |
| expo-haptics | ~55.0.9 | hapticMilestone() on Alif reveal, hapticSelection() on Bismillah, hapticSuccess() on Finish | Already installed. Phase 1 created preset functions in src/design/haptics.ts. |
| expo-secure-store | ~55.0.9 | Session-level Bismillah tracking (first lesson per app session) | Already installed. Used in app/_layout.tsx for install date. Extend pattern for session tracking. |

### Supporting (Already Available)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-router | ~55.0.7 | Navigation from onboarding to tabs, lesson screen | Already used. No changes needed to routing. |
| react-native-safe-area-context | ~5.6.2 | Safe area insets in OnboardingStepLayout footer | Already used. No changes needed. |

### Not Needed for Phase 2

| Library | Why Not |
|---------|---------|
| expo-linear-gradient | WarmGlow uses radial CSS background (rgba circle), not gradient. No gradient needed in Phase 2. |
| @shopify/react-native-skia | All effects achievable with Reanimated opacity/transform. Skia deferred to v2 per STATE.md. |
| lottie-react-native | No pre-built animation files needed. All animations are code-driven. Deferred to Phase 5 (celebrations). |
| expo-blur | No frosted glass effects in Phase 2 onboarding spec. |

## Architecture Patterns

### Component Changes Map

```
src/components/onboarding/
  WarmGlow.tsx              (MODIFY: add animated pulsing, color prop)
  FloatingLettersLayer.tsx  (MODIFY: add tint prop for gold variant)
  OnboardingFlow.tsx        (MODIFY: insert Bismillah step, adjust indices)
  BrandedLogo.tsx           (CREATE: SVG logo from branded asset)
  animations.ts             (MODIFY: add BISMILLAH/STILLNESS constants)
  steps/
    Welcome.tsx             (MODIFY: replace LogoMark with BrandedLogo)
    BismillahMoment.tsx     (CREATE: sacred breathing pause step)
    LetterReveal.tsx        (MODIFY: stillness beat, dual glow, haptic)
    Tilawat.tsx             (MODIFY: animated WarmGlow, CTA text)
    Hadith.tsx              (MODIFY: animated WarmGlow, CTA text)
    Finish.tsx              (MODIFY: spring scale checkmark, hapticSuccess)
    LetterAudio.tsx         (NO CHANGE)
    LetterQuiz.tsx          (NO CHANGE)
    StartingPoint.tsx       (NO CHANGE)
src/components/shared/
  BismillahOverlay.tsx      (CREATE: lesson entry overlay)
app/lesson/[id].tsx         (MODIFY: integrate BismillahOverlay)
```

### Pattern 1: WarmGlow Animated Variant

**What:** Enhance the static WarmGlow with an optional animated opacity pulsing cycle.
**When to use:** On all onboarding splash screens and the Bismillah step for ambient warmth.
**Implementation:**

```typescript
// WarmGlow.tsx - enhanced
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export function WarmGlow({
  size = 340,
  opacity = 0.12,
  animated = false,
  color,
  pulseRange = [0.08, 0.25],
}: {
  size?: number;
  opacity?: number;
  animated?: boolean;
  color?: string;
  pulseRange?: [number, number];
}) {
  // When animated=true, pulse between pulseRange values on 4s cycle
  // When animated=false, static opacity (backward compatible)
  // Use color prop for accent (gold) vs default (accent from rgba)
}
```

**Key constraint:** The `animated` prop defaults to `false` so existing usage (Hadith, LetterReveal before upgrade) is not broken.

### Pattern 2: BrandedLogo Component from SVG

**What:** Extract static SVG shapes from `tila-transparent-mark.svg` into a React Native component using `react-native-svg`, then reimplement CSS @keyframes animations using Reanimated.
**When to use:** Welcome screen, replacing the inline `LogoMark` component.

The branded SVG contains:
- 2 glow circles (opacity pulse 0.04-0.12, 4s cycle)
- 1 crescent moon group (translateY 0 to -2px, 5s cycle)
- 5 stars (opacity 0.2-1.0 + scale 0.7-1.4, 3s cycle, staggered starts)
- 2 arch paths (opacity 0.5-0.9, 4s cycle)
- 1 keystone circle (scale 1.0-1.25, 3s cycle)

**Performance budget:** 8 animated shared values total (2 glows + 5 stars + 1 keystone). Moon translateY can share a value with one glow. Well under the 20-component cap.

**Critical note:** Do NOT use `react-native-svg-transformer` because the branded SVGs contain CSS `@keyframes` which are not supported in React Native SVG rendering. Must extract paths manually and reimplement with Reanimated.

### Pattern 3: Session-Level Bismillah Detection

**What:** Track whether Bismillah has been shown in the current app session to avoid showing it on every lesson.
**When to use:** `app/lesson/[id].tsx` to conditionally render `BismillahOverlay`.

**Recommended approach:** Use an in-memory module-level variable (not SecureStore) for session tracking. Rationale:
- A "session" ends when the app process is killed, which naturally resets module-level state
- SecureStore persists across restarts, requiring timestamp comparison logic and edge cases
- A simple `let bismillahShownThisSession = false` in the BismillahOverlay module achieves exactly the right behavior
- If the user backgrounds the app briefly and returns, Bismillah does NOT repeat (correct -- same session)
- If the app is killed and reopened, Bismillah DOES show again (correct -- new session)

```typescript
// src/components/shared/BismillahOverlay.tsx
let bismillahShownThisSession = false;

export function markBismillahShown() {
  bismillahShownThisSession = true;
}

export function shouldShowBismillah(): boolean {
  return !bismillahShownThisSession;
}
```

This is simpler and more correct than SecureStore timestamps. The CONTEXT.md mentions SecureStore as "likely" but defers the exact implementation to Claude's discretion.

### Pattern 4: Step Index Adjustment

**What:** Insert BismillahMoment as step 4, shifting all subsequent steps by 1.
**Impact on OnboardingFlow.tsx:**

| Old Index | Old Step | New Index | New Step |
|-----------|----------|-----------|----------|
| 0 | Welcome | 0 | Welcome |
| 1 | Tilawat | 1 | Tilawat |
| 2 | Hadith | 2 | Hadith |
| 3 | StartingPoint | 3 | StartingPoint |
| -- | -- | 4 | **BismillahMoment** (NEW) |
| 4 | LetterReveal | 5 | LetterReveal |
| 5 | LetterAudio | 6 | LetterAudio |
| 6 | LetterQuiz | 7 | LetterQuiz |
| 7 | Finish | 8 | Finish |

**TOTAL_STEPS** changes from 8 to 9. **STEP_NAMES** array gains `'bismillah'` at index 4.

Things that must be updated:
- `TOTAL_STEPS` constant
- `STEP_NAMES` array
- LetterReveal auto-advance timer (was `step === 4`, becomes `step === 5`)
- BismillahMoment auto-advance timer (new, at step 4, 2500ms)
- Progress bar visibility logic (hide on Welcome, LetterReveal, LetterQuiz -- indices shift)
- FloatingLettersLayer visibility (currently `step <= 2`, extend to `step <= 3` per UI-SPEC)
- Analytics step tracking (indices change for all steps after Bismillah)

### Anti-Patterns to Avoid

- **Do NOT animate Arabic text with scale or rotate.** Diacritics become unreadable at non-1.0 scale. Use opacity-only animations for Bismillah calligraphy and Alif reveal (FadeIn, not FadeInDown with scale).
- **Do NOT use setTimeout for animation sequencing.** Use Reanimated `withDelay` and `withSequence` instead. The existing `setTimeout` for LetterReveal auto-advance is acceptable because it controls step state, not animation timing. However, the BismillahMoment auto-advance should follow the same `setTimeout` pattern for consistency (state transition, not animation).
- **Do NOT hardcode timing values.** All durations must reference `src/design/animations.ts` or `src/components/onboarding/animations.ts`. New constants (BISMILLAH_DISPLAY_DURATION, STILLNESS_BEAT_DURATION) go in the onboarding animations file.
- **Do NOT add more than 8 animated values to BrandedLogo.** The logo plus content stagger plus WarmGlow must stay under 15 total animated values per step (performance cap from UI-SPEC).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animated opacity pulsing | Manual `useEffect` + `requestAnimationFrame` loop | Reanimated `withRepeat(withSequence(withTiming))` | Runs on UI thread, cancellable, no JS thread blocking |
| SVG logo rendering | Image conversion (PNG export of SVG) | `react-native-svg` Svg/Path/Circle components | Already installed; allows Reanimated animated props on SVG elements |
| Session detection | SecureStore with timestamp comparison and edge case handling | Module-level boolean variable | App process kill naturally resets state; simpler and more correct |
| Staggered entrance choreography | Custom delay calculation per element | Existing SPLASH_STAGGER_BASE/SPLASH_STAGGER_DURATION constants with index multiplication | Already proven pattern used across all onboarding steps |
| Haptic feedback | Direct `Haptics.impactAsync()` calls | Named presets from `src/design/haptics.ts` (hapticMilestone, hapticSelection, hapticSuccess) | Consistent naming, centralized configuration |

## Common Pitfalls

### Pitfall 1: Step Index Off-By-One After Bismillah Insertion

**What goes wrong:** Adding a step at index 4 shifts all subsequent indices. If even one conditional check (auto-advance timer, progress bar visibility, floating letters visibility, analytics tracking) uses the old index, behavior breaks silently.
**Why it happens:** The step indices are used in 5+ places across OnboardingFlow.tsx, and developers fix some but miss others.
**How to avoid:** Extract step indices into named constants at the top of OnboardingFlow.tsx:
```typescript
const STEP = {
  WELCOME: 0, TILAWAT: 1, HADITH: 2, STARTING_POINT: 3,
  BISMILLAH: 4, LETTER_REVEAL: 5, LETTER_AUDIO: 6,
  LETTER_QUIZ: 7, FINISH: 8,
} as const;
```
Then replace all numeric step references with `STEP.LETTER_REVEAL` etc.
**Warning signs:** LetterReveal auto-advances immediately (wrong step check), progress bar shows on wrong steps, analytics logs wrong step names.

### Pitfall 2: Branded Logo Animation Count Explosion

**What goes wrong:** The branded SVG has 5 stars with staggered animations, 2 glow circles, arch opacity cycling, moon breathing, and keystone pulsing. If each gets its own `useSharedValue`, that is 11+ animated values on the Welcome screen alone, plus FloatingLettersLayer (12 animated values) and WarmGlow (1), totaling 24+ -- exceeding the 20-component performance cap.
**Why it happens:** Developers faithfully translate every CSS animation from the SVG without considering the total animation budget.
**How to avoid:** FloatingLettersLayer is only visible on steps 0-3 (including Welcome), so the budget on Welcome is tightest. Options: (a) group stars into 2-3 animation groups sharing values instead of 5 individual ones, (b) simplify logo animations to 4-5 shared values (1 glow pulse, 1 moon breathe, 2 star groups, 1 keystone), (c) reduce FloatingLettersLayer to 8 letters when on the Welcome step. Target: max 15 animated values total on Welcome.
**Warning signs:** Frame drops on Welcome screen entrance on mid-range Android.

### Pitfall 3: Bismillah Diacritics Clipping

**What goes wrong:** The Bismillah text `بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ` has extensive diacritical marks (kasra, shadda, sukun, fatha). At 40px Amiri font size, these marks extend significantly above and below the baseline. If the container has tight `lineHeight` or `overflow: hidden`, marks get clipped on Android.
**Why it happens:** The BismillahMoment is a new component and the developer may not test with the full diacritized text on Android.
**How to avoid:** Use lineHeight of at least 1.5x fontSize (40px font -> 60px lineHeight, as specified in UI-SPEC). Add `spacing.xs` (4px) vertical padding on the text container. Test on Android emulator with the full Bismillah text. Never set `overflow: hidden` on the text container.
**Warning signs:** Bottom marks (kasra) appear cut off on Android but look fine on iOS.

### Pitfall 4: BismillahOverlay Mounting Race in Lesson Screen

**What goes wrong:** The `BismillahOverlay` checks `shouldShowBismillah()` and renders an absolute overlay. If the lesson screen's content (LessonIntro) starts its own entrance animation simultaneously, the user sees a jarring flash when the overlay fades out and the intro animates in behind it.
**Why it happens:** Both the overlay and the lesson content mount at the same time, running competing animations.
**How to avoid:** The overlay renders as an absolute-positioned layer with `bgWarm` at opacity 0.97, which visually covers the lesson content. The lesson content should still mount and prepare underneath. When the overlay fades out after 2500ms (with 500ms FadeOut), the lesson content is already in its resting state. The key is: lesson content should NOT have entrance animations delayed by the Bismillah duration -- let it render statically underneath, and the overlay handles the visual timing.
**Warning signs:** Content flashes or jumps when overlay dismisses.

### Pitfall 5: WarmGlow Animated Prop Breaking Existing Usage

**What goes wrong:** Changing `WarmGlow` from a static `View` to conditionally use `Animated.View` could introduce layout differences. If the animated variant has different default sizing or positioning, existing screens (Hadith, LetterAudio) that use WarmGlow may shift visually.
**Why it happens:** `Animated.View` and `View` have subtle layout differences in some edge cases with absolute positioning.
**How to avoid:** Keep the default `animated={false}` using a plain `View` (no Reanimated imports for the static case). Only wrap in `Animated.View` when `animated={true}`. This way existing consumers see zero change.
**Warning signs:** Warm glow circle shifts position or changes size on screens not being modified.

## Code Examples

### WarmGlow Animated Enhancement

```typescript
// Source: UI-SPEC Screen-by-Screen Choreography
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";
import { useColors } from "../../design/theme";

interface WarmGlowProps {
  size?: number;
  opacity?: number;
  animated?: boolean;
  color?: string;
  pulseMin?: number;
  pulseMax?: number;
}

export function WarmGlow({
  size = 340,
  opacity = 0.12,
  animated = false,
  color,
  pulseMin = 0.08,
  pulseMax = 0.25,
}: WarmGlowProps) {
  const colors = useColors();
  const glowColor = color ?? `rgba(196, 164, 100, ${opacity})`;

  if (!animated) {
    return (
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `rgba(196, 164, 100, ${opacity})`,
        }}
      />
    );
  }

  // Animated variant
  const pulseOpacity = useSharedValue(pulseMin);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(pulseMax, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(pulseMin, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // infinite
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color ?? "rgba(196, 164, 100, 1)",
        },
        animStyle,
      ]}
    />
  );
}
```

### BismillahMoment Step

```typescript
// Source: UI-SPEC Step 4: BismillahMoment (NEW)
import { useEffect } from "react";
import Animated, { FadeIn } from "react-native-reanimated";
import { useColors } from "../../../design/theme";
import { ArabicText } from "../../../design/components";
import { spacing, fontFamilies } from "../../../design/tokens";
import { hapticSelection } from "../../../design/haptics";
import { WarmGlow } from "../WarmGlow";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import { BISMILLAH_DISPLAY_DURATION } from "../animations";
import { durations } from "../../../design/animations";

export function BismillahMoment({ onNext }: { onNext: () => void }) {
  const colors = useColors();

  useEffect(() => {
    hapticSelection();
    const timer = setTimeout(onNext, BISMILLAH_DISPLAY_DURATION);
    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <OnboardingStepLayout variant="splash" fadeInDuration={durations.dramatic}>
      <WarmGlow size={280} opacity={0.18} animated color={colors.accent} pulseMin={0.12} pulseMax={0.25} />
      <Animated.View entering={FadeIn.delay(200).duration(800)}>
        <ArabicText
          size="display"
          color={colors.primaryDark}
          style={{ fontSize: 40, lineHeight: 60, textAlign: "center", zIndex: 1 }}
        >
          {"\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u0670\u0647\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650"}
        </ArabicText>
      </Animated.View>
      <Animated.Text
        entering={FadeIn.delay(600).duration(600)}
        style={{
          fontFamily: fontFamilies.bodyRegular,
          fontSize: 13,
          lineHeight: 18,
          color: colors.textMuted,
          textAlign: "center",
          fontStyle: "italic",
          marginTop: spacing.lg,
          zIndex: 1,
        }}
      >
        In the name of God, the Most Gracious, the Most Merciful
      </Animated.Text>
    </OnboardingStepLayout>
  );
}
```

### Session-Level BismillahOverlay

```typescript
// Source: UI-SPEC BismillahOverlay (Lesson Entry) section
// src/components/shared/BismillahOverlay.tsx

let bismillahShownThisSession = false;

export function shouldShowBismillah(): boolean {
  return !bismillahShownThisSession;
}

export function markBismillahShown() {
  bismillahShownThisSession = true;
}

// BismillahOverlay component renders absolute-positioned overlay
// with same visual treatment as BismillahMoment
// Auto-fades out after BISMILLAH_OVERLAY_DURATION (2500ms)
// FadeOut duration: BISMILLAH_FADEOUT (500ms)
// Calls markBismillahShown() on mount
```

### Lesson Screen Integration

```typescript
// In app/lesson/[id].tsx - add BismillahOverlay
import { shouldShowBismillah } from "../../src/components/shared/BismillahOverlay";

// Inside LessonScreen component:
const [showBismillah, setShowBismillah] = useState(shouldShowBismillah());

// In render:
return (
  <Animated.View style={{ flex: 1 }}>
    {renderStage()}
    {showBismillah && (
      <BismillahOverlay onComplete={() => setShowBismillah(false)} />
    )}
  </Animated.View>
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static WarmGlow (View with fixed opacity) | Animated WarmGlow (Reanimated withRepeat pulsing) | Phase 2 | Adds ambient life to all onboarding screens |
| Inline SVG LogoMark (hand-coded simplified shapes) | BrandedLogo component (real branded SVG with Reanimated animations) | Phase 2 | Professional branded identity on first screen |
| 8-step onboarding | 9-step onboarding with Bismillah | Phase 2 | Sacred centering moment before first letter |
| Immediate letter reveal (250ms stagger) | Stillness beat (1200ms pause) before letter reveal | Phase 2 | Creates weight and reverence for the sacred moment |

## Open Questions

1. **Reduced Motion Accessibility**
   - What we know: UI-SPEC specifies checking `AccessibilityInfo.isReduceMotionEnabled()` and skipping WarmGlow pulsing, FloatingLettersLayer, and using instant opacity changes.
   - What's unclear: The codebase has zero existing reduced motion support. Adding it comprehensively would touch every animated component.
   - Recommendation: Add a `useReducedMotion()` hook that caches the result. Apply it in the new/modified components (WarmGlow, BrandedLogo, BismillahMoment). Do not retrofit existing unmodified components in this phase.

2. **BrandedLogo Animation Fidelity**
   - What we know: The SVG has 10+ CSS @keyframes animations. React Native cannot render CSS animations in SVG.
   - What's unclear: How many of these animations are visually important vs. subtle enough to skip.
   - Recommendation: Implement the most visible ones (glow pulse, star sparkle, keystone pulse) and skip subtle ones (moon translateY of -2px, individual arch glow differences). Keep to 5-6 shared values max for the logo.

3. **Bismillah Arabic Text Correctness**
   - What we know: The UI-SPEC specifies `بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ` with full diacritics.
   - What's unclear: Whether this exact Unicode sequence renders correctly with Amiri on both platforms. Some diacritics combinations have known rendering issues on Android.
   - Recommendation: Test the exact Unicode string on both iOS and Android emulators early in implementation. If rendering issues appear, consult an Arabic typography reference for alternative Unicode sequences.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | vitest.config.ts |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ONB-01 | Onboarding flow renders all 9 steps | unit (render) | `npx vitest run src/__tests__/onboarding-flow.test.ts -x` | Wave 0 |
| ONB-02 | LetterReveal has stillness beat timing + haptic call | unit | `npx vitest run src/__tests__/onboarding-flow.test.ts -x` | Wave 0 |
| ONB-03 | Step transitions use correct animation presets | unit | `npx vitest run src/__tests__/onboarding-animations.test.ts -x` | Wave 0 |
| ONB-04 | WarmGlow animated variant activates pulsing | unit | `npx vitest run src/__tests__/warm-glow.test.ts -x` | Wave 0 |
| MIND-01 | BismillahMoment renders with correct text + auto-advances | unit | `npx vitest run src/__tests__/bismillah.test.ts -x` | Wave 0 |
| MIND-02 | BismillahOverlay session detection works correctly | unit | `npx vitest run src/__tests__/bismillah.test.ts -x` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test`
- **Per wave merge:** `npm test && npm run validate`
- **Phase gate:** Full suite green + manual walkthrough of all 9 onboarding steps + Bismillah overlay on lesson entry

### Wave 0 Gaps

- [ ] `src/__tests__/onboarding-flow.test.ts` -- covers ONB-01, ONB-02, ONB-03 (step count, step names, auto-advance timing)
- [ ] `src/__tests__/bismillah.test.ts` -- covers MIND-01, MIND-02 (session detection, auto-advance, text content)
- [ ] `src/__tests__/warm-glow.test.ts` -- covers ONB-04 (animated prop behavior)
- [ ] `src/__tests__/onboarding-animations.test.ts` -- covers ONB-03 (new animation constants defined, no magic numbers)

**Note:** Existing `src/__tests__/animations.test.ts` and `src/__tests__/haptics.test.ts` already validate the shared animation presets and haptic functions from Phase 1. These do not need modification.

## Project Constraints (from CLAUDE.md)

- **Testing:** Tests use Vitest (not Jest), located in `src/__tests__/**/*.test.{js,ts}`
- **Commands:** `npm run validate` runs lint + typecheck; `npm test` runs Vitest
- **Routing:** File-based Expo Router. `app/lesson/[id].tsx` is the lesson entry point for Bismillah overlay integration
- **State management:** No Redux/Zustand. All persistent state in SQLite. React Context for theme and database only.
- **Import alias:** `@/*` maps to project root
- **Architecture:** Expo 55, React Native 0.83, React 19, TypeScript 5.9. New Architecture enabled. Portrait-only.
- **Design system:** Fonts: Amiri (Arabic), Inter (body), Lora (headings). Colors: Primary #163323, Accent #C4A464, Background #F8F6F0. Spacing: 8px base.
- **Audio:** `playOnboardingAdvance()` on step change, `playLetterName()` for letter audio -- existing patterns to preserve.

## Sources

### Primary (HIGH confidence)
- `02-UI-SPEC.md` -- Complete screen-by-screen choreography, animation timing, component inventory, performance constraints
- `02-CONTEXT.md` -- 17 locked decisions (D-01 through D-17), Claude's discretion areas
- Codebase audit -- All 8 existing onboarding step files, OnboardingFlow orchestrator, WarmGlow, FloatingLettersLayer, animation presets, haptics presets, design tokens
- `assets/logo/tila-transparent-mark.svg` -- Branded SVG source with CSS animation definitions

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` -- Stack decisions (Reanimated 4.2.1 as primary, no Skia/Lottie for Phase 2)
- `.planning/research/PITFALLS.md` -- Arabic diacritics clipping, Android animation performance, shared value JS reads
- `.planning/research/FEATURES.md` -- Feature prioritization, competitor analysis, animation strategy

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all libraries already installed and proven in Phase 1
- Architecture: HIGH -- codebase patterns are clear, UI-SPEC provides exact choreography
- Pitfalls: HIGH -- documented from Phase 1 research and codebase-specific patterns
- Session detection: MEDIUM -- module-level variable approach is simpler than SecureStore but needs validation that React Native process lifecycle matches expectations on both platforms

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable -- no fast-moving dependencies)
