# Stack Research: Premium UI Polish for Tila

**Domain:** Mobile app UI polish (Expo / React Native)
**Researched:** 2026-03-28
**Confidence:** HIGH

## Current State

Tila already has react-native-reanimated 4.2.1, react-native-svg 15.15.3, react-native-worklets 0.7.2, and expo-haptics. This research covers what to ADD, not what to replace.

## Recommended Stack

### Core Technologies (Already Installed -- Leverage More)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-native-reanimated | 4.2.1 (installed) | All animations: transitions, layout, entering/exiting | Already installed. v4 adds CSS Animations API -- use it for declarative transitions instead of manual worklets where possible. The new `animationName` keyframes API and `transitionProperty` are production-ready. |
| react-native-svg | 15.15.3 (installed) | Custom illustrations, decorative elements, progress indicators | Already installed. Use for custom Arabic calligraphy decorations, progress arcs, and any bespoke visual elements. |
| expo-haptics | ~55.0.9 (installed) | Tactile feedback on celebrations, correct answers | Already installed. Pair with visual celebrations for multi-sensory polish. |

### New Core Additions

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-native-gesture-handler | ~2.30.0 | Swipe gestures, interactive dismissals, drag interactions | Standard for any polished RN app. Required by many navigation patterns. Expo SDK 55 compatible. Install via `npx expo install`. Not currently in dependencies but likely needed for interactive lesson transitions and swipeable cards. |
| expo-linear-gradient | ~55.0.x | Background gradients, card overlays, shimmer bases | First-party Expo package. Warm cream-to-gold gradients for cards, section headers, and onboarding backgrounds. Zero config needed. |
| expo-blur | ~55.0.x | Frosted glass effects on modals, overlays, navigation | Stable on Android as of SDK 55 (uses RenderNode API on Android 12+). Use for modal overlays, celebration screens, and premium card effects. |
| @shopify/react-native-skia | ~2.5.4 | GPU-accelerated custom drawing: particles, shaders, advanced visual effects | The premium visual effects engine. Use for confetti particles, shimmer effects, glow effects, and any visual that CSS/Reanimated cannot achieve. Compatible with RN 0.83 and New Architecture. Winner apps (like Callie, 2025 Expo App Awards) use Skia for standout visuals. |
| lottie-react-native | ~7.3.6 | Pre-built celebration animations, loading states, micro-interactions | Industry standard for designer-created animations. Use for celebration moments (lesson complete, streak milestones), loading states, and onboarding illustrations. Massive library of free/purchasable animations on LottieFiles. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-css-animations | latest | Pre-built animation presets (spin, pulse, shimmer, bounce) for Reanimated 4 | Use for common micro-interactions: loading spinners, notification pulses, skeleton shimmer screens. From Software Mansion Labs -- built specifically for Reanimated 4's CSS API. |
| phosphor-react-native | latest | 9,000+ icons in 6 weights (thin, light, regular, bold, fill, duotone) | Use as the primary icon system. Duotone weight is perfect for the warm+playful design direction. Tree-shakeable so bundle stays small. |

### NOT Recommended -- Defer or Skip

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-fast-confetti | ~0.8.x | GPU confetti via Skia Atlas API | Only if Lottie confetti animations feel too generic. Requires both Reanimated AND Skia as peer deps -- heavy. Build custom particle effects with Skia directly instead. |

## Installation

```bash
# New core additions (use npx expo install for SDK-compatible versions)
npx expo install react-native-gesture-handler expo-linear-gradient expo-blur

# Skia (check Expo docs for exact compatible version)
npx expo install @shopify/react-native-skia

# Lottie
npx expo install lottie-react-native

# Supporting (npm for non-Expo packages)
npm install react-native-css-animations phosphor-react-native
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Reanimated 4 CSS API | Moti 0.30.0 | Never for this project. Moti is a Reanimated wrapper that simplifies the API, but Reanimated 4's new CSS API already provides that simplicity natively. Moti hasn't been updated in over a year and was designed for Reanimated 3. Use Reanimated directly. |
| @shopify/react-native-skia | Custom Canvas/SVG | Only if Skia's bundle size (~3-5MB) is unacceptable. SVG can handle simple decorations; Skia is needed for shaders, particles, and GPU effects. For Tila's "wow factor" goal, Skia is worth the size. |
| lottie-react-native | @lottiefiles/dotlottie-react-native | If you need the newer dotLottie binary format for smaller file sizes. lottie-react-native is more mature and better documented. Start with lottie-react-native; migrate individual animations to dotLottie later if bundle size becomes a concern. |
| phosphor-react-native | @expo/vector-icons (built-in) | If you only need basic icons. @expo/vector-icons ships with Expo but offers fewer icon families and no duotone weight. Phosphor's 6-weight system provides better visual hierarchy for a premium feel. |
| expo-blur | @react-native-community/blur | Never. expo-blur is first-party, maintained by Expo team, and optimized for SDK 55. No reason to use a third-party alternative. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Moti | Last updated 1+ year ago. Designed for Reanimated 3. Reanimated 4's CSS API provides the same declarative simplicity natively. Adding a stale wrapper over a library you already have is unnecessary complexity. | react-native-reanimated 4 CSS Animations API directly |
| react-native-animatable | Legacy library, not optimized for New Architecture, doesn't use Reanimated's worklet thread. Animations run on JS thread = jank on mid-range Android. | react-native-reanimated 4 with react-native-css-animations presets |
| NativeWind/Tailwind for animations | Adds a CSS-in-JS layer that conflicts with Tila's existing style system (design tokens + StyleSheet). Animation-specific benefits are minimal vs Reanimated 4's native CSS API. | Keep existing design token system + Reanimated 4 |
| react-native-confetti-cannon | Old library, doesn't use worklet thread, performance issues on Android. | Lottie confetti animations or custom Skia particle effects |
| Rive (rive-react-native) | Smaller ecosystem than Lottie, fewer free assets, requires learning a new tool (Rive editor). Lottie has vastly more community content. | lottie-react-native |

## Stack Patterns by Use Case

**For screen transitions (entering/exiting):**
- Use Reanimated 4 layout animations (`Entering`, `Exiting` props on `Animated.View`)
- Combine with react-native-screens native transitions for 60fps

**For micro-interactions (button press, option select, toggle):**
- Use Reanimated 4 CSS Transitions API (`transitionProperty`, `transitionDuration`)
- Simpler than worklets, runs on UI thread

**For celebration moments (lesson complete, streak milestone):**
- Use Lottie for the primary animation (confetti burst, star explosion)
- Layer with expo-haptics for tactile feedback
- Use Skia for custom particle/glow overlay if Lottie isn't enough

**For decorative backgrounds (gradients, ambient effects):**
- Use expo-linear-gradient for static/simple gradients
- Use Skia Canvas for animated gradients, noise textures, or shader effects

**For modal/overlay polish:**
- Use expo-blur BlurView as the backdrop
- Use Reanimated 4 for the modal entrance animation

**For loading/skeleton states:**
- Use react-native-css-animations `shimmer` preset
- Apply over expo-linear-gradient base

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| react-native-reanimated 4.2.1 | RN 0.83, Expo SDK 55, React 19 | Already installed and working. Requires New Architecture (enabled). |
| @shopify/react-native-skia ~2.5.4 | RN 0.79+, Expo SDK 55 | Actively maintained. Expo has official Skia template. Requires dev client (not Expo Go). |
| lottie-react-native ~7.3.6 | Expo SDK 55 | Install via `npx expo install` for correct version. |
| react-native-gesture-handler ~2.30.0 | Expo SDK 55 | Bundled with Expo. Use `npx expo install` for SDK-compatible version. |
| expo-linear-gradient ~55.0.x | Expo SDK 55 | First-party. Version matches SDK. |
| expo-blur ~55.0.x | Expo SDK 55 | First-party. Stable on Android as of SDK 55. |
| phosphor-react-native | Any RN with SVG support | Depends on react-native-svg (already installed at 15.15.3). |

## Important Notes

1. **Skia requires dev client builds.** It will not work in Expo Go. Since Tila already uses EAS Build with dev client, this is not a blocker.

2. **Bundle size considerations.** Skia adds ~3-5MB to the binary. For an offline-first app that bundles audio assets, this is negligible. The visual quality gain far outweighs the size cost.

3. **Reanimated 4 CSS API is the primary animation tool.** Use worklets only when CSS API cannot express the animation (e.g., gesture-driven, physics-based). The CSS API is simpler, less error-prone, and sufficient for 80%+ of UI polish animations.

4. **Lottie files should be bundled, not fetched.** Since Tila is offline-first, all Lottie JSON files must be included in the app bundle via expo-asset or direct imports.

5. **Performance budget.** All animations must hit 60fps on mid-range Android. Reanimated runs on UI thread (safe). Skia runs on GPU (safe). Lottie uses native renderers (safe). The main risk is layering too many simultaneous animations -- test on real mid-range hardware.

## Sources

- [Reanimated 4 Stable Release Blog](https://blog.swmansion.com/reanimated-4-stable-release-the-future-of-react-native-animations-ba68210c3713) -- HIGH confidence
- [Reanimated Compatibility Table](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/) -- HIGH confidence
- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) -- HIGH confidence
- [React Native Skia - Expo Docs](https://docs.expo.dev/versions/latest/sdk/skia/) -- HIGH confidence
- [React Native Skia Installation](https://shopify.github.io/react-native-skia/docs/getting-started/installation/) -- HIGH confidence
- [Expo BlurView Docs](https://docs.expo.dev/versions/latest/sdk/blur-view/) -- HIGH confidence
- [Expo LinearGradient Docs](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) -- HIGH confidence
- [lottie-react-native npm](https://www.npmjs.com/package/lottie-react-native) -- HIGH confidence
- [react-native-css-animations GitHub](https://github.com/software-mansion-labs/react-native-css-animations) -- MEDIUM confidence (lab project, not official release)
- [Phosphor Icons](https://phosphoricons.com/) -- HIGH confidence
- [Callie - Expo App Awards 2025 (Skia + Reanimated showcase)](https://expo.dev/blog/making-ai-feel-human-in-a-mobile-app-with-expo-reanimated-and-skia) -- MEDIUM confidence

---
*Stack research for: Tila UI Overhaul -- Premium Polish*
*Researched: 2026-03-28*
