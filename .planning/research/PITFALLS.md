# Domain Pitfalls: Emotional UI / Animation / Arabic Rendering

**Domain:** Ambient motion and atmospheric UI in React Native / Expo
**Researched:** 2026-04-03

## Critical Pitfalls

Mistakes that cause rewrites, frame drops, or App Store rejections.

### Pitfall 1: Animating Layout Properties

**What goes wrong:** Using animated width, height, margin, or padding for ambient effects triggers layout recalculation on every frame.
**Why it happens:** Developers think "make it bigger" means animate width/height. React Native's layout engine (Yoga) re-runs on every frame.
**Consequences:** Frame drops to 15-30fps on mid-range Android. Choppy, broken atmosphere. Worse than no animation.
**Prevention:** Only animate transform (translateX/Y, scale, rotate) and opacity. These are GPU-composited without layout recalculation. Scale creates the illusion of size change without layout cost.
**Detection:** Profile with React Native Perf Monitor. If "UI" thread shows >16ms per frame during animation, layout properties are likely the cause.

### Pitfall 2: Too Many Concurrent Shared Values

**What goes wrong:** Stacking 30+ Reanimated shared values on a single screen causes frame drops even with transform-only animations.
**Why it happens:** Each shared value runs a worklet on the UI thread. The UI thread has a per-frame budget (~16ms at 60fps). Too many worklets exceed this budget.
**Consequences:** Ambient motion stutters. Ironic: the "atmosphere" feels broken and janky instead of warm.
**Prevention:** Budget 15-20 shared values per screen maximum. FloatingLettersLayer uses 12 (one per letter) -- this is close to the practical limit for concurrent repeating animations. If you need more visual complexity, use static SVG elements (zero animation cost) alongside a few animated ones.
**Detection:** Count shared values per screen during code review. If a screen has >20 withRepeat animations, it needs optimization.

### Pitfall 3: SVG Gradient Stop Animation

**What goes wrong:** Trying to animate stopOpacity or stopColor on SVG RadialGradient/LinearGradient Stop elements via useAnimatedProps.
**Why it happens:** Seems logical -- animate the gradient to change glow intensity. But SVG gradient stops require property adapters and processColor wrappers in Reanimated, and the behavior differs between iOS and Android.
**Consequences:** Silent failures on one platform, visual glitches on another. Hours debugging cross-platform inconsistencies.
**Prevention:** Never animate SVG internals. Animate the container View's opacity and transform instead. WarmGlow.tsx demonstrates the correct pattern: static SVG gradient inside an Animated.View whose opacity/scale is animated.
**Detection:** Code review: search for useAnimatedProps applied to Stop, RadialGradient, or LinearGradient components.

### Pitfall 4: Missing Reduce Motion Support

**What goes wrong:** Ambient animations play regardless of the OS "Reduce Motion" accessibility setting.
**Why it happens:** Developers build animations first, plan to add accessibility later, then ship without it.
**Consequences:** App Store rejection (Apple checks accessibility). Users with vestibular disorders experience discomfort. Violates WCAG.
**Prevention:** Every animated component must check useReducedMotion() from react-native-reanimated and render a static fallback. Build this into animation primitives, not individual screens. Consider wrapping the root layout with ReducedMotionConfig.
**Detection:** Toggle "Reduce Motion" in iOS Settings or Android Accessibility before every PR that touches animation.

### Pitfall 5: Arabic Text Clipping

**What goes wrong:** Arabic diacritics (harakat) -- the marks above and below letters -- get clipped by View boundaries. Letters with tall ascenders (lam-alif) or deep descenders (yaa) get cut off.
**Why it happens:** React Native's layout engine calculates bounds based on the font's reported metrics, but Arabic fonts (especially Amiri) have diacritics that extend beyond the reported line height.
**Consequences:** Users see partially rendered Arabic. For a Quran learning app, this is a catastrophic credibility destroyer.
**Prevention:** Add generous padding (16-24px) around all Arabic text containers. Use explicit lineHeight that accounts for diacritics (2.2x-2.5x the fontSize for Amiri with tashkeel). Never use overflow: 'hidden' on Arabic text containers. Test with fully voweled Arabic text (every letter has a harakat).
**Detection:** Visual test with the phrase "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ" at every size the app uses.

## Moderate Pitfalls

### Pitfall 6: expo-blur Modal Limitation (SDK 55)

**What goes wrong:** BlurView inside React Native Modal does not blur correctly on Android in Expo SDK 55.
**Why it happens:** The new dimezisBlurView blur method requires a BlurTargetView wrapper, which cannot cross Modal boundaries.
**Prevention:** Do not use expo-blur inside Modal components on Android. For modal-like overlays with blur, use a full-screen View with absolute positioning instead of React Native Modal.

### Pitfall 7: SVG Pattern ID Collisions

**What goes wrong:** Multiple SVG Pattern/Gradient definitions using the same `id` attribute cause one to override the other.
**Why it happens:** SVG IDs are global within the rendering context. Two components both using `id="glow"` will conflict.
**Prevention:** Use unique, descriptive IDs. Include component name and/or size in the ID: `id={`glow-hero-${size}`}`. The existing WarmGlow.tsx uses `id={`glow-${size}`}` which is good but could still collide if two same-sized glows exist.
**Detection:** Visual inspection: if one glow/gradient disappears or renders incorrectly when another appears, check for ID collisions.

### Pitfall 8: withRepeat Memory on Unmount

**What goes wrong:** Animations started with withRepeat(-1) may continue running briefly after component unmount.
**Why it happens:** Reanimated animations run on the UI thread and cleanup is asynchronous.
**Prevention:** Reanimated 4.x handles this automatically for shared values created with useSharedValue. Do NOT use raw Animated.Value from the Animated API for repeating animations. Stick to Reanimated's useSharedValue exclusively.

### Pitfall 9: Hardcoded Dimensions for Backgrounds

**What goes wrong:** Using fixed pixel dimensions (e.g., width: 375, height: 812) for atmosphere backgrounds.
**Why it happens:** Developer tests on one device size and hardcodes.
**Consequences:** Atmosphere does not fill screen on tablets, foldables, or different phone sizes.
**Prevention:** Use Dimensions.get('window') or StyleSheet.absoluteFill for full-screen atmosphere layers. The existing FloatingLettersLayer.tsx uses percentage-based positioning, which is correct.

### Pitfall 10: Easing Choice Affects Emotional Register

**What goes wrong:** Using withSpring or Easing.bounce for ambient motion creates playful/arcade energy instead of reverence.
**Why it happens:** Spring physics feel natural for interactive elements. Developers default to what feels "smooth."
**Consequences:** The app feels like a game instead of a sacred space. Undermines the entire emotional design contract.
**Prevention:** Use Easing.inOut(Easing.ease) exclusively for ambient motion. Use Easing.out(Easing.ease) for entrance animations. Reserve withSpring only for interactive gestures (drag, swipe) if ever needed -- and even then, use high damping.

## Minor Pitfalls

### Pitfall 11: Gradient Banding on Low-End Android

**What goes wrong:** Smooth gradients show visible color steps ("banding") on displays with low color depth.
**Prevention:** Use multi-stop gradients (4+ stops) with intermediate color values. The WarmGlow SVG gradient uses 4 stops, which is sufficient.

### Pitfall 12: Floating Letter Overlap with Interactive Elements

**What goes wrong:** Ambient floating letters intercept touch events, blocking buttons below.
**Prevention:** Always set pointerEvents="none" on atmosphere layers. Both WarmGlow and FloatingLettersLayer already do this correctly.

### Pitfall 13: Font Loading Race with Arabic Display

**What goes wrong:** Arabic text renders in system fallback font before Amiri loads, causing text to jump/reflow.
**Prevention:** The app already uses expo-font with SplashScreen.preventAutoHideAsync(). Ensure the splash screen remains until all fonts are loaded.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Ambient backgrounds | Too many concurrent animations (#2) | Budget 15-20 shared values per screen |
| Letter Hero glow | Animating SVG stops (#3) | Animate container, not gradient internals |
| Answer feedback | Easing choice (#10) | withTiming + ease, never withSpring |
| Sacred screens | Arabic clipping (#5) | Generous padding, test with full tashkeel |
| Blur effects | Modal limitation (#6) | Avoid blur inside Modal on Android |
| Geometric patterns | SVG ID collision (#7) | Unique IDs per pattern instance |
| Reduce Motion | Missing accessibility (#4) | Build into primitives from day one |
| Typography overhaul | Arabic clipping (#5) | lineHeight 2.2-2.5x fontSize for Amiri |

## Sources

- [Reanimated Performance Guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/) -- layout vs transform animation costs
- [Reanimated Accessibility](https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/) -- useReducedMotion, ReducedMotionConfig
- [expo-blur BlurTargetView issue](https://github.com/expo/expo/issues/44165) -- Modal boundary limitation in SDK 55
- [react-native-svg USAGE.md](https://github.com/software-mansion/react-native-svg/blob/main/USAGE.md) -- Pattern, RadialGradient docs
- Existing WarmGlow.tsx, FloatingLettersLayer.tsx -- working patterns in codebase
- [Reanimated useAnimatedProps SVG issues](https://github.com/software-mansion/react-native-reanimated/discussions/5543) -- gradient stop animation problems
