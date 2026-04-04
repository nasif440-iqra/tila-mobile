---
phase: 1
slug: foundation
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-04
---

# Phase 1 — UI Design Contract: Foundation

> Visual and interaction contract for infrastructure primitives. This phase delivers zero new screens -- it defines the typography, ambient background, animation, and accessibility contracts that Phases 2 and 3 build on.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (React Native -- shadcn not applicable) |
| Preset | not applicable |
| Component library | Custom design system in `src/design/` |
| Icon library | Not applicable to this phase |
| Font (Arabic) | Amiri (Amiri_400Regular, Amiri_700Bold) |
| Font (Body) | Inter (400, 500, 600, 700) |
| Font (Heading) | Lora (400, 500, 600, 700, 400 Italic) |

Source: `src/design/tokens.ts` (existing)

---

## Spacing Scale

Existing scale in `src/design/tokens.ts`. No changes in this phase.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline padding |
| sm | 8px | Compact element spacing |
| md | 12px | Default element spacing |
| lg | 16px | Section padding |
| xl | 24px | Major content gaps |
| xxl | 32px | Layout gaps |
| xxxl | 48px | Major section breaks |
| xxxxl | 64px | Page-level spacing |

Exceptions for this phase:
- Arabic text containers require 16-24px vertical padding to prevent diacritic clipping (not a spacing token change -- applied as container padding in ArabicText component)

Source: `src/design/tokens.ts` (existing, unchanged)

---

## Typography — Arabic Tiers

This is the primary typography deliverable. Current lineHeight ratios clip diacritics.

### Current State (BROKEN)

| Tier | fontSize | lineHeight | Ratio | Status |
|------|----------|------------|-------|--------|
| arabicDisplay | 72px | 100px | 1.39x | CLIPS diacritics |
| arabicLarge | 36px | 54px | 1.50x | CLIPS on stacked harakat |
| arabicBody | 24px | 36px | 1.50x | CLIPS on stacked harakat |

### Target State (this phase delivers)

| Tier | fontSize | lineHeight | Ratio | Rationale |
|------|----------|------------|-------|-----------|
| arabicDisplay | 72px | 158px | 2.20x | Fully voweled Quranic text with Amiri. Research minimum for display sizes with stacked diacritics. |
| arabicQuizHero | 52px | 114px | 2.20x | NEW tier. Quiz contexts where Arabic is primary content. Between display and large. |
| arabicLarge | 36px | 72px | 2.00x | Lesson content, option labels. Slightly lower ratio acceptable at smaller sizes. |
| arabicBody | 24px | 48px | 2.00x | Inline Arabic in explanations. |

Font: Amiri_400Regular for all tiers. Amiri_700Bold available but not default.

### Typography Rules

1. `overflow: 'visible'` on all Arabic text containers -- never `overflow: 'hidden'`
2. Minimum 16px vertical padding on containers holding Arabic text at display/quizHero sizes
3. Minimum 8px vertical padding on containers holding Arabic text at large/body sizes
4. All ratios are empirical minimums -- if testing with full Bismillah phrase shows any clipping, increase by 0.1x increments
5. Test string for validation: "bismillah ar-rahman ar-raheem" in full Arabic with all diacritics

### Latin Typography (unchanged)

Existing Latin typography in `src/design/tokens.ts` is not modified in this phase. For reference:

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| heading1 | 24px | Lora Bold (700) | 32px (1.33x) |
| heading2 | 20px | Lora SemiBold (600) | 28px (1.40x) |
| body | 15px | Inter Regular (400) | 22px (1.47x) |
| bodySmall | 13px | Inter Regular (400) | 18px (1.38x) |

Source: D-05, D-06, D-07 from CONTEXT.md; PITFALLS.md Pitfall 5; SUMMARY.md lineHeight research

---

## Color — Ambient Background Presets

### Base Palette (existing, unchanged)

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#F8F6F0` (warm cream) | App background, content surfaces |
| Secondary (30%) | `#F2EADE` (warm beige) | Cards, warm background washes |
| Accent (10%) | `#C4A464` (gold) | Glow effects, breathing highlights, feedback ripples |
| Primary | `#163323` (deep green) | Text, floating letters, dark anchors |

Accent reserved for: ambient glow centers, breathing animation highlights, correct-answer ripple, gold border on mastery, quiz-hero letter glow. Never for backgrounds or large surface fills.

### Ambient Background Preset Definitions

Each preset defines a layered gradient stack. Layer 1 is the base linear gradient. Layer 2 is a radial glow (WarmGlow component).

#### Preset: `home`
| Property | Value |
|----------|-------|
| Linear base | `#F8F6F0` (100%) to `#F2EADE` (100%), top to bottom |
| Radial glow | center-top (50%, 15%), color `#C4A464`, opacity 0.06, radius 70% of screen width |
| Ambient motion | FloatingLettersLayer enabled, drift speed normal |
| Emotional register | Quiet warmth. Like afternoon light in a reading room. |

#### Preset: `quiz`
| Property | Value |
|----------|-------|
| Linear base | `#F8F6F0` (100%) to `#F2EADE` (100%), top to bottom |
| Radial glow | center (50%, 35%), color `#C4A464`, opacity 0.08, radius 60% of screen width |
| Ambient motion | FloatingLettersLayer disabled (shared value budget reserved for quiz interactions) |
| Emotional register | Focused warmth. Attention drawn to center where the letter lives. |

#### Preset: `sacred`
| Property | Value |
|----------|-------|
| Linear base | `#F2EADE` (100%) to `#F8F6F0` (100%), top to bottom (reversed -- warmer at top) |
| Radial glow | center-top (50%, 20%), color `#C4A464`, opacity 0.10, radius 80% of screen width |
| Ambient motion | FloatingLettersLayer enabled, drift speed slow (1.5x normal duration) |
| Emotional register | Threshold warmth. Like light falling through a mosque window. |

#### Preset: `celebration`
| Property | Value |
|----------|-------|
| Linear base | `#F8F6F0` (100%) to `#F2EADE` (100%), top to bottom |
| Radial glow | center (50%, 40%), color `#C4A464`, opacity 0.12, radius 90% of screen width |
| Ambient motion | FloatingLettersLayer enabled, drift speed normal |
| Emotional register | Warm embrace. Dignified acknowledgment, not arcade excitement. |

#### Preset: `loading`
| Property | Value |
|----------|-------|
| Linear base | `#F8F6F0` (100%) to `#F8F6F0` (100%), solid |
| Radial glow | center (50%, 50%), color `#C4A464`, opacity 0.04, radius 50% of screen width |
| Ambient motion | None |
| Emotional register | Quiet patience. The room exists before the content arrives. |

#### Preset: `onboarding`
| Property | Value |
|----------|-------|
| Linear base | `#F2EADE` (100%) to `#F8F6F0` (100%), top to bottom |
| Radial glow | center-top (50%, 25%), color `#C4A464`, opacity 0.08, radius 75% of screen width |
| Ambient motion | FloatingLettersLayer enabled, drift speed slow |
| Emotional register | Welcoming threshold. Softness as invitation for people who are not sure they belong. |

### Gradient Implementation Rules

1. Linear gradient uses `expo-linear-gradient` (already installed)
2. Radial glow uses WarmGlow SVG RadialGradient component (existing, to be relocated to `src/design/atmosphere/`)
3. Never animate SVG gradient stop properties -- animate the container View opacity/scale only
4. All atmosphere layers use `pointerEvents="none"` and `StyleSheet.absoluteFill`
5. Gradient stop count: minimum 4 stops per radial gradient to prevent banding on low-end Android

Source: D-01 through D-04 from CONTEXT.md; ARCHITECTURE.md layered atmosphere model; SUMMARY.md WarmGlow analysis

---

## Animation Tiers

### Existing Tiers (unchanged)

| Tier | Tokens | Range | Usage |
|------|--------|-------|-------|
| Interaction | springs.press, durations.fast-dramatic | 150-600ms | Button presses, feedback, transitions |
| Stagger | staggers.fast-dramatic | 50-120ms delay | List entrances, grid reveals |

### New Tiers (this phase adds)

| Tier | Token | Duration | Easing | Usage |
|------|-------|----------|--------|-------|
| Breathing | `breathing.inhale` | 2000ms | `Easing.inOut(Easing.ease)` | Scale/opacity increase (0.08 to 0.25 opacity, or 1.0 to 1.06 scale) |
| Breathing | `breathing.hold` | 500ms | linear | Pause at peak |
| Breathing | `breathing.exhale` | 2000ms | `Easing.inOut(Easing.ease)` | Scale/opacity decrease back to rest |
| Breathing | `breathing.cycle` | 4500ms | (composite) | Full inhale + hold + exhale. The heartbeat of the ambient system. |
| Drift | `drift.slow` | 24000ms | `Easing.inOut(Easing.ease)` | Barely perceptible background movement. Like sunlight on a wall. |
| Drift | `drift.normal` | 18000ms | `Easing.inOut(Easing.ease)` | Default floating letter drift speed. |
| Drift | `drift.range` | 20-40px | n/a | translateX/Y displacement range for drifting elements. |
| Settle | `settle.duration` | 600ms | `Easing.out(Easing.ease)` | Element arriving at rest position. Gentle deceleration. |

### Animation Constants

```
breathing = {
  inhale: 2000,
  hold: 500,
  exhale: 2000,
  cycle: 4500,
  opacityMin: 0.08,
  opacityMax: 0.25,
  scaleMin: 1.0,
  scaleMax: 1.06,
}

drift = {
  slow: 24000,
  normal: 18000,
  rangeX: { min: 20, max: 40 },
  rangeY: { min: 10, max: 25 },
}

settle = {
  duration: 600,
}
```

### Animation Rules (non-negotiable)

1. Only animate `opacity` and `transform` (scale, translateX, translateY, rotate). Never animate layout properties (width, height, margin, padding).
2. Use `Easing.inOut(Easing.ease)` for all ambient motion (breathing, drift). Never `withSpring` for ambient effects -- springs create playful energy that contradicts sacred register.
3. Use `Easing.out(Easing.ease)` for entrance animations.
4. Budget: 15-20 concurrent shared values per screen maximum. FloatingLettersLayer uses 12.
5. All repeating animations use `withRepeat` with the restart-loop pattern (not raw `-1` on Android).

Source: D-09 through D-11 from CONTEXT.md; PITFALLS.md Pitfalls 1, 2, 10; ARCHITECTURE.md Pattern 1

---

## Reduce Motion Contract

When device "Reduce Motion" is enabled (checked via `useReducedMotion()` from Reanimated 4.2.1):

| Category | Normal Behavior | Reduce Motion Fallback |
|----------|----------------|----------------------|
| Breathing animations | 4.5s opacity/scale cycle | Static at `opacityMin` (0.08) value. No animation. |
| Drift animations | 18-24s translateX/Y cycle | Elements placed at initial position. No movement. |
| FloatingLettersLayer | 12 drifting letters | 12 letters rendered at static positions, no animation. Still visible for atmosphere. |
| Ambient glow | Breathing opacity pulse | Static glow at resting opacity. |
| Entrance animations | Slide + opacity stagger | Simple opacity fade, 300ms, no translate. |
| Screen transitions | Slide/push transitions | Cross-fade only, 300ms. |
| Ambient background gradients | Static (already no animation) | No change -- gradients are already static. |

### Reduce Motion Implementation Rules

1. Check `useReducedMotion()` in every animated primitive, not in screens.
2. When reduce motion is true, set shared values to their resting state immediately (no animation call).
3. Entrance fallback: `withTiming(1, { duration: 300 })` on opacity only. No translateY.
4. The ambient background gradient layers still render -- only motion is disabled, not visual atmosphere.

Source: D-12, D-13 from CONTEXT.md; PITFALLS.md Pitfall 4; SUMMARY.md reduce motion section

---

## FloatingLettersLayer Bug Fix Contract

| Property | Current | Target |
|----------|---------|--------|
| Animation pattern | `withRepeat(-1)` | Restart-loop pattern (implementation at Claude's discretion per D-14) |
| Visual behavior | 12 Arabic letters drifting at low opacity | Identical -- same letter count, same opacity range, same drift speed |
| Stability | Freezes after ~12 minutes on Android | Runs 15+ minutes without freeze |
| Shared value count | 12 | 12 (unchanged -- within per-screen budget) |
| Pointer events | `pointerEvents="none"` | `pointerEvents="none"` (unchanged) |

Source: D-14 from CONTEXT.md; PITFALLS.md Pitfall 8; REQUIREMENTS.md FOUN-05

---

## Copywriting Contract

This phase has no user-facing copy changes. It delivers infrastructure primitives.

| Element | Copy |
|---------|------|
| Primary CTA | Not applicable -- no new screens or buttons |
| Empty state heading | Not applicable |
| Empty state body | Not applicable |
| Error state | Not applicable |
| Destructive confirmation | Not applicable |

Note: Copywriting contracts for user-facing screens will be defined in Phase 2 (Quiz) and Phase 3 (Sacred Moments) UI-SPECs.

---

## Component Inventory (primitives this phase delivers)

| Component | Location | New/Modified | Responsibility |
|-----------|----------|-------------|----------------|
| ArabicText | `src/design/components/ArabicText.tsx` | Modified | Add `quizHero` size tier, update all lineHeight ratios, add `overflow: 'visible'` |
| Typography tokens | `src/design/tokens.ts` | Modified | Add `arabicQuizHero` definition, update lineHeight values for all Arabic tiers |
| Animation tokens | `src/design/animations.ts` | Modified | Add `breathing`, `drift`, and `settle` tier objects alongside existing interaction tokens |
| AtmosphereBackground | `src/design/atmosphere/AtmosphereBackground.tsx` | New | Preset-based gradient + radial glow. 6 presets. Wraps screens. |
| WarmGlow | `src/design/atmosphere/WarmGlow.tsx` | Relocated | Move from `src/components/onboarding/`. API unchanged. |
| FloatingLettersLayer | `src/design/atmosphere/FloatingLettersLayer.tsx` | Relocated + patched | Move from `src/components/onboarding/`. Fix withRepeat(-1) bug. |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| Not applicable | React Native project -- no shadcn registry | Not applicable |

---

## Cross-Platform Verification

| Check | iOS | Android |
|-------|-----|---------|
| Arabic diacritics at display (72px) | No clipping with Bismillah test string | No clipping with Bismillah test string |
| Arabic diacritics at quizHero (52px) | No clipping | No clipping |
| Arabic diacritics at large (36px) | No clipping | No clipping |
| Arabic diacritics at body (24px) | No clipping | No clipping |
| Ambient gradient renders | Smooth, no banding | Smooth, no banding (4+ gradient stops) |
| FloatingLettersLayer 15-min stability | No freeze | No freeze |
| Reduce Motion disables all ambient | All motion stops | All motion stops |
| Reduce Motion preserves static atmosphere | Gradients + static letters visible | Gradients + static letters visible |

Test string: full Bismillah in Arabic with all diacritics and harakat marks.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (not applicable -- infrastructure phase)
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS (not applicable -- React Native)

**Approval:** pending
