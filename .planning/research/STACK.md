# Technology Stack: Emotional UI Design

**Project:** Tila - Emotional Design Overhaul
**Researched:** 2026-04-03
**Overall Confidence:** HIGH

## Recommendation: Do NOT Add Skia. Use What You Have.

The existing stack -- react-native-reanimated 4.2.1 + react-native-svg 15.15.3 + expo-linear-gradient 55.0.11 -- handles every effect described in the PROJECT.md requirements. Adding @shopify/react-native-skia would increase app download size by 4-6 MB and introduce a second rendering pipeline for effects achievable with the current stack. The codebase already demonstrates the correct pattern (WarmGlow.tsx uses SVG RadialGradient with Reanimated breathing animations).

## Recommended Stack (Additions Only)

### Already Installed -- No Changes Needed

| Technology | Version | Purpose | Performance on Mid-Range Android |
|------------|---------|---------|----------------------------------|
| react-native-reanimated | 4.2.1 | All ambient motion: breathing, drifting, settling, ripples, scale pulses | UI-thread worklets, 60fps guaranteed for opacity/transform animations |
| react-native-svg | 15.15.3 | RadialGradient glows, geometric patterns via `<Pattern>`, SVG-based ripple effects | Native rendering, performant for static + lightly animated SVGs |
| expo-linear-gradient | 55.0.11 | Linear gradient backgrounds, atmospheric color washes | Native view, negligible perf cost |

### New Addition: expo-blur

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| expo-blur | ~55.0.11 | Soft atmospheric blur for overlay effects, frosted glass on sacred screens | Already part of Expo SDK 55. Uses native blur (RenderNode API on Android 12+). Animatable intensity via Reanimated. Adds warm depth to layered compositions. | HIGH |

**Performance note:** expo-blur uses RenderNode API on Android SDK 31+ (Android 12+) which is efficient. On Android 9-11, falls back to less efficient RenderScript. For mid-range Android devices from the last 3 years, this is fine. Use `dimezisBlurViewSdk31Plus` blur method if you want to skip blur on old devices entirely.

**Known limitation (SDK 55):** BlurView inside React Native Modal requires `BlurTargetView` wrapper on Android. This only matters if you use blur inside modals.

### New Addition: No Other Packages

No other packages needed. Here is why:

**Lottie (lottie-react-native):** Not needed. The emotional design spec calls for ambient, structural motion (breathing, drifting, settling) -- all achievable with Reanimated shared values. Lottie is for pre-authored vector animations (character animations, complex illustrated sequences). Tila's motion language is parametric, not pre-authored.

**@shopify/react-native-skia:** Not needed. Would add 4-6 MB to download size. Skia excels at: real-time drawing, canvas-based rendering, complex shader effects, 120fps data visualization. Tila needs: radial gradient glows (SVG RadialGradient does this), geometric patterns (SVG Pattern does this), opacity/scale/translate animations (Reanimated does this). The WarmGlow component already proves the SVG approach works.

**Moti:** Not needed. Moti wraps Reanimated with a simpler API, but the codebase already uses Reanimated directly and the team is comfortable with it. Adding an abstraction layer adds bundle size without capability gain.

## Effect-to-Technology Mapping

This maps every required effect from PROJECT.md to the specific technology and approach.

### Ambient Background System

| Effect | Technology | Approach |
|--------|-----------|----------|
| Layered gradient backgrounds | expo-linear-gradient + react-native-svg | Stack LinearGradient (vertical wash) with SVG RadialGradient (warm center glow) |
| Slow ambient motion | react-native-reanimated | `withRepeat` + `withTiming` on opacity/translateY with long durations (8-15s). Budget: 2-4 shared values per screen |
| Geometric patterns | react-native-svg `<Pattern>` | SVG `<Defs><Pattern>` with repeated geometric shapes. Static render, zero animation cost |
| Floating Arabic letters | react-native-reanimated | Already implemented (FloatingLettersLayer.tsx). 12 letters, 1 shared value each. Works. |

### Letter Hero / Glow Effects

| Effect | Technology | Approach |
|--------|-----------|----------|
| Breathing letter with warm glow | react-native-reanimated + react-native-svg | Scale (1.0-1.06) + opacity pulse on SVG RadialGradient wrapper. Already proven in WarmGlow.tsx |
| Radial glow behind letters | react-native-svg RadialGradient | Multi-stop RadialGradient with smooth falloff. Already implemented. |
| Correct answer warm ripple | react-native-reanimated | Scale (0 to 1.5) + opacity (0.6 to 0) on a circular SVG, duration 400-600ms |
| Wrong answer gentle nudge | react-native-reanimated | Small translateX oscillation (3px, 200ms) + subtle color shift. No red, no shake. |

### Sacred Screen Atmosphere

| Effect | Technology | Approach |
|--------|-----------|----------|
| Phrase-by-phrase reveal | react-native-reanimated | Staggered opacity + translateY (20px to 0) per phrase segment. `withDelay` for sequencing |
| Frosted overlay on sacred text | expo-blur | BlurView with intensity 15-25, tint "light". Layer behind text for depth |
| Warm ambient glow | react-native-svg | RadialGradient positioned center-bottom, subtle gold-to-transparent |

## Animation Budget Guidelines

For 60fps on mid-range Android, follow these budgets:

| Context | Max Shared Values | Max Animated Components | Notes |
|---------|-------------------|------------------------|-------|
| Static screen (Home) | 8-12 | 4-6 | Background ambient + floating letters |
| Active screen (Quiz) | 15-20 | 8-10 | Hero breathing + answer feedback + ambient |
| Celebration moment | 20-25 | 10-12 | Brief burst, auto-cleans up |
| Transition | 4-6 | 2-3 | Enter/exit only |

**Rules:**
- Only animate `opacity`, `transform` (scale, translate, rotate). Never animate layout properties (width, height, margin, padding) -- these trigger layout recalculation every frame.
- Use `Easing.inOut(Easing.ease)` for all ambient motion. No spring physics for ambient effects.
- Long durations (8-15s) for ambient. Short durations (200-600ms) for feedback.
- Always pair with `useReducedMotion()` from Reanimated for accessibility.

## Accessibility: Reduce Motion Support

react-native-reanimated 4.2.1 provides built-in accessibility support:

```typescript
import { useReducedMotion } from 'react-native-reanimated';

// In any component with ambient motion:
const reduceMotion = useReducedMotion();
// If true: skip withRepeat animations, show static states
// Keep: opacity fades for entrances (these are accessibility-OK)
// Remove: scale breathing, translate drifting, floating letters
```

**ReducedMotionConfig component:** Can wrap sections of the app to globally disable animations when the OS reduce-motion setting is on. Consider wrapping the root layout.

## Alternatives Considered and Rejected

| Category | Recommended | Rejected | Why Not |
|----------|-------------|----------|---------|
| Graphics engine | react-native-svg (existing) | @shopify/react-native-skia | +4-6 MB download size, second rendering pipeline, overkill for gradient/pattern effects |
| Animation | react-native-reanimated (existing) | Moti, react-native-animatable | Abstraction over what's already used; no capability gain |
| Pre-authored animation | None | lottie-react-native | Effects are parametric (breathing, drifting), not pre-authored sequences |
| Gradient backgrounds | expo-linear-gradient + SVG RadialGradient | react-native-linear-gradient, expo-blur gradient | expo-linear-gradient already installed; SVG handles radial; no gap |
| Blur effects | expo-blur | @react-native-community/blur | expo-blur is SDK-aligned, maintained by Expo team, version-locked |
| Pattern rendering | react-native-svg Pattern | Hand-coded Views, Image-based patterns | SVG Pattern is resolution-independent, lightweight, and animatable |

## Installation

```bash
# Only new package needed
npx expo install expo-blur
```

That is it. One package. Everything else is already installed.

## Version Compatibility Matrix

| Package | Installed | Expo 55 Compatible | New Architecture | Notes |
|---------|-----------|-------------------|-----------------|-------|
| react-native-reanimated | 4.2.1 | Yes | Yes (Fabric) | UI-thread worklets |
| react-native-svg | 15.15.3 | Yes | Yes | Native SVG rendering |
| expo-linear-gradient | 55.0.11 | Yes (SDK-locked) | Yes | Native gradient view |
| expo-blur | ~55.0.11 | Yes (SDK-locked) | Yes | Native blur (RenderNode) |

## Sources

- [react-native-svg Usage - Pattern, RadialGradient](https://github.com/software-mansion/react-native-svg/blob/main/USAGE.md)
- [Reanimated Performance Guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
- [Reanimated useReducedMotion](https://docs.swmansion.com/react-native-reanimated/docs/device/useReducedMotion/)
- [Reanimated useAnimatedProps](https://docs.swmansion.com/react-native-reanimated/docs/core/useAnimatedProps/)
- [Reanimated Accessibility Guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/)
- [React Native Skia Bundle Size](https://shopify.github.io/react-native-skia/docs/getting-started/bundle-size/) -- 4MB Android, 6MB iOS increase
- [expo-blur Documentation (SDK 55)](https://docs.expo.dev/versions/latest/sdk/blur-view/)
- [Expo SVG Documentation](https://docs.expo.dev/versions/latest/sdk/svg/)
- [SVG Animation Guide 2025](https://www.svgai.org/blog/guides/react-native-svg-animation)
