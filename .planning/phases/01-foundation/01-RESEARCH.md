# Phase 1: Foundation - Research

**Researched:** 2026-04-04
**Domain:** Arabic typography, ambient animation systems, accessibility (Reduce Motion), React Native / Reanimated
**Confidence:** HIGH

## Summary

Phase 1 delivers infrastructure primitives that every subsequent phase depends on. The five deliverables are: (1) fix Arabic text clipping by updating lineHeight ratios and adding overflow:visible, (2) create a global ambient background system with 6 presets replacing per-screen gradient hacks, (3) add breathing/drift/settle animation tiers to the design system, (4) implement Reduce Motion accessibility support, and (5) fix the FloatingLettersLayer 12-minute Android freeze bug.

The existing codebase provides strong foundations. WarmGlow (SVG RadialGradient) is proven and used by 14 source files. The animation token system in `animations.ts` is clean and extensible. ArabicText is a simple component with a clear SIZE_MAP pattern. The main gaps are: lineHeight ratios are too small (1.39-1.50x vs the needed 2.0-2.2x), no ambient animation tiers exist, useReducedMotion is not called anywhere in the codebase, and FloatingLettersLayer uses withRepeat(-1, true) which triggers a known Android freeze bug.

**Primary recommendation:** Structure work as 5 discrete tasks matching the 5 requirements, with typography tokens and animation tokens first (no dependencies), then AtmosphereBackground system (depends on animation tokens), then FloatingLettersLayer fix and Reduce Motion (can reference new animation tokens). Relocate WarmGlow and FloatingLettersLayer to `src/design/atmosphere/` as part of the ambient background work.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-05: Fix ALL Arabic tiers (display 72px, large 36px, body 24px), minimum 1.67x lineHeight for Quranic text with stacked diacritics
- D-06: Add overflow:visible to Arabic text containers
- D-07: Add quiz-hero size tier (48-56px) between display and large
- D-08: Full cross-platform audit on iOS and Android
- D-09: Breathing cycle = 4.5 seconds (2s inhale, 0.5s hold, 2s exhale)
- D-10: Drift cycle = 18-24 seconds
- D-11: Keep existing interaction timers unchanged; add breathing and drift as new tiers
- D-12: Full Reduce Motion implementation (disable ambient, replace entrances with opacity fades, static warm backgrounds)
- D-13: Use useReducedMotion() from Reanimated 4.2.1
- D-14: Replace withRepeat(-1) with restart-loop pattern in FloatingLettersLayer

### Claude's Discretion
- D-01: Where to wrap ambient background (root layout vs per-screen)
- D-02: WarmGlow fate (relocate+enhance vs build new using WarmGlow internally)
- D-03: Preset system (named moods vs raw composition)
- D-04: WarmGradient replacement approach (replace all now vs deprecate+migrate)
- Specific lineHeight multiplier values per tier (minimum 1.67x, empirically tested)
- Animation easing curves for breathing and drift
- FloatingLettersLayer restart-loop implementation approach

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUN-01 | Arabic text never clips diacritics on any screen -- lineHeight ratios updated, overflow visible, cross-platform verified | Typography tokens research (current vs target ratios), ArabicText component analysis, 23 files import ArabicText |
| FOUN-02 | Global ambient background system with presets (home, sacred, quiz, celebration, loading, onboarding) replaces per-screen background hacks | WarmGlow analysis (14 importers), WarmGradient analysis (5 importers), layered atmosphere architecture pattern, expo-linear-gradient availability |
| FOUN-03 | Animation tier expansion -- breathing (4.5s), drift (18-24s), and settle timings added alongside existing interaction tier | Current animations.ts structure (clean, extensible), UI-SPEC animation constants, easing requirements |
| FOUN-04 | Reduce Motion support -- all ambient animations disabled, entrance animations replaced with opacity fades | useReducedMotion not used anywhere yet, needs integration into every animated primitive, ReducedMotionConfig available for root-level |
| FOUN-05 | FloatingLettersLayer withRepeat(-1) 12-minute freeze bug fixed | withRepeat Android bug analysis, restart-loop pattern research, current code uses withRepeat(-1, true) with 12 concurrent shared values |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- No Changes)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-reanimated | 4.2.1 | All ambient motion: breathing, drift, settle, reduce motion | UI-thread worklets, useReducedMotion hook, withRepeat/withTiming/withSequence |
| react-native-svg | 15.15.3 | RadialGradient for WarmGlow, SVG-based atmospheric effects | Native rendering, proven in WarmGlow.tsx |
| expo-linear-gradient | 55.0.11 | Linear gradient base layer for ambient backgrounds | Native view, already installed |

### Supporting (No New Packages)

No new packages required for this phase. The entire deliverable is achievable with the existing stack.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-linear-gradient | View-based banding (WarmGradient) | WarmGradient uses 5 opacity bands with visible staircasing -- inferior |
| SVG RadialGradient | @shopify/react-native-skia | +4-6MB bundle size, second render pipeline, overkill |
| useReducedMotion (Reanimated) | AccessibilityInfo.isReduceMotionEnabled | Async vs synchronous; Reanimated hook is synchronous and reactive |

## Architecture Patterns

### Recommended Project Structure

```
src/design/
  tokens.ts              # Modified: add arabicQuizHero, update lineHeight ratios
  animations.ts          # Modified: add breathing, drift, settle tiers
  atmosphere/            # NEW directory
    AtmosphereBackground.tsx  # NEW: preset-based ambient background
    WarmGlow.tsx              # RELOCATED from src/components/onboarding/
    FloatingLettersLayer.tsx  # RELOCATED + PATCHED from src/components/onboarding/
    index.ts                  # NEW: barrel export
  components/
    ArabicText.tsx        # Modified: add quizHero tier, overflow:visible
    index.ts              # Modified: export updates if needed
```

### Pattern 1: Layered Atmosphere (from ARCHITECTURE.md)

**What:** Every screen composes atmosphere as stacked layers: (1) linear gradient base, (2) radial glow, (3) ambient motion (floating letters), (4) content.

**When to use:** Every screen that uses AtmosphereBackground.

**Implementation approach:** AtmosphereBackground accepts a `preset` prop ('home' | 'quiz' | 'sacred' | 'celebration' | 'loading' | 'onboarding') and renders the correct gradient + glow + optional FloatingLettersLayer combination. Each preset is defined as a plain object with gradient colors, glow position/opacity/radius, and whether floating letters are enabled.

### Pattern 2: Reduce Motion at the Primitive Level

**What:** Every animated primitive checks `useReducedMotion()` and renders a static fallback.

**When to use:** Every component that uses withRepeat, breathing, or drift animations.

**Key insight:** Check reduce motion in the animated primitive (WarmGlow, FloatingLettersLayer, AtmosphereBackground), NOT in screens. This ensures consistency without per-screen boilerplate.

```typescript
// Pattern: reduce motion in every animated primitive
function BreathingGlow({ size, color }: Props) {
  const opacity = useSharedValue(0.08);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return; // Static at resting value
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.25, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.08, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, false,
    );
  }, [reduceMotion]);
  // ...
}
```

### Pattern 3: Restart-Loop for withRepeat Bug

**What:** Replace `withRepeat(-1)` with a callback-based restart pattern that re-triggers the animation sequence on completion, avoiding the Android freeze.

**When to use:** Any animation that must loop infinitely, specifically FloatingLettersLayer.

**Approach:** Use `withTiming` with a `callback` parameter. When the animation completes (finished === true), call `runOnJS` to trigger a re-start. This avoids the internal Reanimated counter that overflows on Android.

```typescript
// Restart-loop pattern (conceptual)
function startDrift(offset: SharedValue<number>, range: number, duration: number) {
  'worklet';
  offset.value = withSequence(
    withTiming(range, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
    withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.ease) },
      (finished) => {
        if (finished) {
          startDrift(offset, range, duration); // Recursive restart on UI thread
        }
      }
    ),
  );
}
```

**Alternative approach:** Use `withRepeat` with a large finite count (e.g., 1000) instead of -1, and re-trigger on unmount/remount. Simpler but less elegant.

### Anti-Patterns to Avoid

- **Animating SVG gradient stops:** Never animate stopOpacity or stopColor. Animate the container View's opacity/scale instead. WarmGlow already does this correctly.
- **Layout property animation:** Never animate width, height, margin, padding. Only opacity and transform (scale, translate, rotate).
- **Spring physics for ambient motion:** Never use withSpring for breathing/drift. It creates playful energy that contradicts sacred register. Use withTiming + Easing.inOut(Easing.ease).
- **Per-screen atmosphere code:** Never copy-paste gradient/glow code per screen. Use AtmosphereBackground with presets.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reduce Motion detection | Manual AccessibilityInfo listener | `useReducedMotion()` from Reanimated 4.2.1 | Synchronous, reactive, handles both iOS and Android, already installed |
| Radial gradients | Concentric View rings with decreasing opacity | SVG RadialGradient (WarmGlow pattern) | View rings create visible banding; SVG is smooth |
| Linear gradients | Banded View layers (WarmGradient pattern) | expo-linear-gradient | Native gradient view, smooth, no banding |

## Common Pitfalls

### Pitfall 1: Arabic LineHeight Too Conservative

**What goes wrong:** Setting lineHeight to 1.5x or 1.67x seems generous but still clips stacked diacritics (tanween + kasra combinations) in Amiri font at display sizes.
**Why it happens:** Amiri's Quranic diacritics extend further than most Arabic fonts. The font metrics report smaller bounds than the actual glyph extent.
**How to avoid:** UI-SPEC mandates 2.20x for display/quizHero and 2.00x for large/body. Test with the full Bismillah phrase with all diacritics at every tier.
**Warning signs:** Diacritics visually touching or overlapping with text on adjacent lines.

### Pitfall 2: withRepeat(-1) Android Freeze

**What goes wrong:** Infinite withRepeat animations freeze all Reanimated animations after approximately 12 minutes on Android. The freeze time decreases proportionally with more concurrent withRepeat calls.
**Why it happens:** Internal counter overflow or garbage collection pressure from the Reanimated scheduling system on Android. FloatingLettersLayer uses 12 concurrent withRepeat(-1, true) calls, which accelerates the problem.
**How to avoid:** Use restart-loop pattern (recursive worklet callback) or large finite repeat count. Never use withRepeat(-1) on Android for long-running animations.
**Warning signs:** All animations on screen freeze simultaneously after 10-15 minutes.

### Pitfall 3: SVG ID Collisions

**What goes wrong:** WarmGlow uses `id={glow-${size}}` for its RadialGradient. If two WarmGlow instances with the same size render simultaneously, one gradient overrides the other.
**Why it happens:** SVG IDs are global within the rendering context.
**How to avoid:** Use unique IDs per instance (include a counter or React key). When relocating WarmGlow, add a unique ID strategy (e.g., useId() hook from React 19).

### Pitfall 4: Import Path Breakage on Relocation

**What goes wrong:** Relocating WarmGlow from `src/components/onboarding/WarmGlow.tsx` to `src/design/atmosphere/WarmGlow.tsx` breaks 14 source files and 6 test files that import from the old path.
**Why it happens:** Direct relative imports throughout the codebase.
**How to avoid:** Either (a) update all import paths in one atomic commit, or (b) leave a re-export shim at the old path that re-exports from the new location. Option (b) is safer for incremental migration. Similarly, FloatingLettersLayer is imported by 1 file (OnboardingFlow.tsx).

### Pitfall 5: Shared Value Budget Exceeded

**What goes wrong:** AtmosphereBackground + FloatingLettersLayer + screen-specific animations exceed 20 concurrent shared values, causing frame drops on mid-range Android.
**Why it happens:** Each layer adds shared values: FloatingLettersLayer uses 12, breathing glow uses 2, any screen animations add more.
**How to avoid:** Budget 15-20 shared values per screen. FloatingLettersLayer's 12 is close to limit. AtmosphereBackground presets that disable FloatingLettersLayer (quiz, loading) free budget for screen-specific animations.

### Pitfall 6: WarmGradient Not Fully Replaced

**What goes wrong:** WarmGradient is imported by 5 source files (index.tsx, progress.tsx, LessonSummary.tsx, LessonQuiz.tsx, LessonIntro.tsx) plus exported from design/components/index.ts. If not all imports are updated, screens will have inconsistent backgrounds.
**Why it happens:** Incremental migration leaves some screens on old system.
**How to avoid:** Track all WarmGradient importers and ensure they are either migrated to AtmosphereBackground or at minimum still functional. Decision D-04 gives discretion on timing.

## Code Examples

### Current Typography (BROKEN -- to be fixed)

```typescript
// Source: src/design/tokens.ts (current state)
arabicDisplay: { fontFamily: "Amiri_400Regular", fontSize: 72, lineHeight: 100 }, // 1.39x CLIPS
arabicLarge:   { fontFamily: "Amiri_400Regular", fontSize: 36, lineHeight: 54 },  // 1.50x CLIPS
arabicBody:    { fontFamily: "Amiri_400Regular", fontSize: 24, lineHeight: 36 },  // 1.50x CLIPS
```

### Target Typography (from UI-SPEC)

```typescript
// Target state per UI-SPEC
arabicDisplay:  { fontFamily: "Amiri_400Regular", fontSize: 72, lineHeight: 158 }, // 2.20x
arabicQuizHero: { fontFamily: "Amiri_400Regular", fontSize: 52, lineHeight: 114 }, // 2.20x NEW
arabicLarge:    { fontFamily: "Amiri_400Regular", fontSize: 36, lineHeight: 72 },  // 2.00x
arabicBody:     { fontFamily: "Amiri_400Regular", fontSize: 24, lineHeight: 48 },  // 2.00x
```

### Current Animation Tokens (to be extended)

```typescript
// Source: src/design/animations.ts (current state -- interaction tier only)
export const springs = { press, bouncy, gentle, snap };
export const durations = { fast: 150, micro: 200, normal: 300, slow: 400, dramatic: 600 };
export const staggers = { fast, normal, dramatic };
export const easings = { contentReveal, entrance, exit, smooth };
```

### Target Animation Tokens (new tiers from UI-SPEC)

```typescript
// New exports to add to animations.ts
export const breathing = {
  inhale: 2000,
  hold: 500,
  exhale: 2000,
  cycle: 4500,
  opacityMin: 0.08,
  opacityMax: 0.25,
  scaleMin: 1.0,
  scaleMax: 1.06,
} as const;

export const drift = {
  slow: 24000,
  normal: 18000,
  rangeX: { min: 20, max: 40 },
  rangeY: { min: 10, max: 25 },
} as const;

export const settle = {
  duration: 600,
} as const;
```

### ArabicText quizHero Addition Pattern

```typescript
// Source: src/design/components/ArabicText.tsx (current pattern to extend)
type ArabicSize = "display" | "quizHero" | "large" | "body"; // Add quizHero

const SIZE_MAP: Record<ArabicSize, { fontFamily: string; fontSize: number; lineHeight: number }> = {
  display: typography.arabicDisplay,
  quizHero: typography.arabicQuizHero, // NEW
  large: typography.arabicLarge,
  body: typography.arabicBody,
};

// Add overflow: 'visible' to the Text style
<Text style={[sizeStyle(size), { overflow: 'visible', /* ... */ }, style]}>
```

### Ambient Background Preset Pattern

```typescript
// Conceptual AtmosphereBackground structure
type AtmospherePreset = 'home' | 'quiz' | 'sacred' | 'celebration' | 'loading' | 'onboarding';

interface PresetConfig {
  linearColors: [string, string];
  linearDirection: 'top-to-bottom' | 'bottom-to-top';
  glowPosition: { x: string; y: string };
  glowColor: string;
  glowOpacity: number;
  glowRadius: number; // percentage of screen width
  floatingLetters: boolean;
  floatingLetterSpeed: 'normal' | 'slow';
}

const PRESETS: Record<AtmospherePreset, PresetConfig> = {
  home: { /* per UI-SPEC */ },
  quiz: { floatingLetters: false, /* ... */ },
  // ...
};
```

### WarmGlow Import Mapping (14 source files to update if relocated)

```
src/components/onboarding/steps/Hadith.tsx       -> ../WarmGlow (sibling)
src/components/home/HeroCard.tsx                  -> ../onboarding/WarmGlow
src/components/home/AnimatedStreakBadge.tsx        -> ../onboarding/WarmGlow
src/components/feedback/AppLoadingScreen.tsx       -> ../onboarding/WarmGlow
src/components/LessonSummary.tsx                  -> ./onboarding/WarmGlow
src/components/LessonIntro.tsx                    -> ./onboarding/WarmGlow
src/components/quiz/QuizCelebration.tsx           -> ../onboarding/WarmGlow
src/components/quiz/QuizQuestion.tsx              -> ../onboarding/WarmGlow
src/components/celebrations/LetterMasteryCelebration.tsx -> ../onboarding/WarmGlow
src/components/shared/BismillahOverlay.tsx        -> ../onboarding/WarmGlow
src/components/exercises/GuidedReveal.tsx         -> ../onboarding/WarmGlow
app/phase-complete.tsx                            -> ../src/components/onboarding/WarmGlow
```

Tests referencing WarmGlow import paths: 6 files (warm-glow.test.ts, exercise-haptics.test.ts, lesson-intro.test.ts, lesson-summary.test.ts, phase-complete-celebration.test.ts, app-loading.test.ts).

### WarmGradient Import Mapping (5 source files to replace/update)

```
app/(tabs)/index.tsx      -> ../../src/design/components (barrel)
app/(tabs)/progress.tsx   -> ../../src/design/components (barrel)
src/components/LessonSummary.tsx -> ../design/components (barrel)
src/components/LessonQuiz.tsx    -> ../design/components (barrel)
src/components/LessonIntro.tsx   -> ../design/components (barrel)
src/design/components/index.ts   -> ./WarmGradient (barrel export)
```

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
| FOUN-01 | Arabic lineHeight ratios updated, overflow:visible, quizHero tier added | unit (source audit) | `npx vitest run src/__tests__/arabic-typography.test.ts -x` | No -- Wave 0 |
| FOUN-02 | AtmosphereBackground component exists with 6 presets, WarmGlow relocated | unit (source audit) | `npx vitest run src/__tests__/atmosphere-background.test.ts -x` | No -- Wave 0 |
| FOUN-03 | Animation tokens include breathing, drift, settle | unit | `npx vitest run src/__tests__/animations.test.ts -x` | Yes (needs extension) |
| FOUN-04 | Animated primitives check useReducedMotion | unit (source audit) | `npx vitest run src/__tests__/reduce-motion.test.ts -x` | No -- Wave 0 |
| FOUN-05 | FloatingLettersLayer does not use withRepeat(-1) | unit (source audit) | `npx vitest run src/__tests__/floating-letters-fix.test.ts -x` | No -- Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test`
- **Per wave merge:** `npm test && npm run validate`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps

- [ ] `src/__tests__/arabic-typography.test.ts` -- covers FOUN-01: verify tokens.ts has arabicQuizHero, all Arabic tiers have lineHeight >= 2.0x fontSize, ArabicText includes overflow:visible
- [ ] `src/__tests__/atmosphere-background.test.ts` -- covers FOUN-02: verify AtmosphereBackground exports, preset configs exist for all 6 presets, WarmGlow relocated
- [ ] `src/__tests__/animations.test.ts` -- EXTEND existing: add tests for breathing, drift, settle token presence and values
- [ ] `src/__tests__/reduce-motion.test.ts` -- covers FOUN-04: verify animated primitives import useReducedMotion
- [ ] `src/__tests__/floating-letters-fix.test.ts` -- covers FOUN-05: verify FloatingLettersLayer source does NOT contain `withRepeat(-1` or `withRepeat( -1`

## Project Constraints (from CLAUDE.md)

- Stack locked: Expo SDK 55, React Native 0.83, React 19, TypeScript 5.9, Reanimated 4.2.1
- No business logic changes -- engine algorithms stay the same
- Offline-first -- all changes must work without network
- Performance -- no regressions on mid-range Android (60fps must hold)
- Backwards compatible -- existing user data must not be corrupted
- Tests use Vitest (not Jest), live in `src/__tests__/**/*.test.{js,ts}`
- Run `npm run validate` (lint + typecheck) -- zero errors required
- Run `npm test` -- all tests pass
- Import alias `@/*` maps to project root

## Sources

### Primary (HIGH confidence)
- `src/design/tokens.ts` -- current typography values (lineHeight 1.39-1.50x, confirmed broken)
- `src/design/animations.ts` -- current animation tokens (interaction tier only, no breathing/drift)
- `src/design/components/ArabicText.tsx` -- current component (3 sizes, no overflow:visible)
- `src/components/onboarding/WarmGlow.tsx` -- SVG RadialGradient with breathing animation (proven pattern)
- `src/components/onboarding/FloatingLettersLayer.tsx` -- uses withRepeat(-1, true) with 12 shared values
- `src/design/components/WarmGradient.tsx` -- banded View gradient (5 bands, visible staircasing)
- `app/_layout.tsx` -- root layout structure (provider nesting, Stack navigation)
- `.planning/research/PITFALLS.md` -- 13 documented pitfalls for this domain
- `.planning/research/ARCHITECTURE.md` -- layered atmosphere model, component boundaries
- `.planning/research/STACK.md` -- stack decisions, no new packages needed
- `.planning/phases/01-foundation/01-UI-SPEC.md` -- exact pixel values, preset definitions, animation constants
- `.planning/phases/01-foundation/01-CONTEXT.md` -- all 14 decisions

### Secondary (MEDIUM confidence)
- [Reanimated withRepeat Android freeze - GitHub #4387](https://github.com/software-mansion/react-native-reanimated/issues/4387) -- withRepeat(-1) breaks after ~12 min on Android, fix merged in #4579 but similar patterns may still cause issues with many concurrent instances
- [Reanimated Performance Guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/) -- layout vs transform animation costs
- [Reanimated Accessibility](https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/) -- useReducedMotion, ReducedMotionConfig

### Tertiary (LOW confidence)
- Restart-loop pattern using recursive worklet callbacks -- this is a known pattern but specific behavior with Reanimated 4.2.1 should be validated during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and proven in codebase
- Architecture: HIGH -- layered atmosphere model well-documented, existing patterns provide clear extension points
- Typography: HIGH -- exact values specified in UI-SPEC, current broken values confirmed in source
- Animation tiers: HIGH -- exact values specified in UI-SPEC, clean extension point in animations.ts
- FloatingLettersLayer fix: MEDIUM -- restart-loop pattern is sound but specific Reanimated 4.2.1 worklet recursion behavior needs validation
- Reduce Motion: HIGH -- useReducedMotion available in Reanimated 4.2.1, pattern well-documented

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (stable domain -- Expo SDK 55 locked)
