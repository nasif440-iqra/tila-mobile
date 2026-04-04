# Architecture Patterns: Emotional UI Design

**Domain:** Ambient motion and atmospheric UI for React Native / Expo
**Researched:** 2026-04-03

## Recommended Architecture

### Layered Atmosphere Model

Every screen is composed of atmosphere layers, bottom to top:

```
Layer 4: Content (text, buttons, interactive elements)
Layer 3: Overlays (blur, frosted glass, sacred overlays)
Layer 2: Ambient Motion (floating letters, breathing glows, drifting shapes)
Layer 1: Background (gradient stack -- linear base + radial warm center)
```

This is NOT a new navigation layer. These are View layers within each screen, composed via a shared AtmosphereBackground component that renders Layers 1-2 and lets screens inject content into Layers 3-4.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| AtmosphereBackground | Renders gradient base + radial glow. Shared across all screens. | ThemeContext (colors) |
| FloatingLettersLayer | Ambient drifting Arabic letters (already exists) | AtmosphereBackground (layered above) |
| WarmGlow | SVG RadialGradient with optional breathing animation (already exists) | Any component needing a glow halo |
| LetterHero | Large Arabic letter with breathing glow, used in quiz/lesson hero areas | WarmGlow, Reanimated |
| FeedbackRipple | Expanding circle for correct answer feedback | Reanimated (scale + opacity) |
| FeedbackNudge | Gentle horizontal nudge for wrong answer | Reanimated (translateX) |
| PhraseReveal | Staggered phrase-by-phrase text reveal | Reanimated (withDelay + opacity) |
| GeometricPattern | SVG Pattern-based Islamic geometric backgrounds | react-native-svg Pattern |
| ReduceMotionGate | Wrapper that checks useReducedMotion and passes static vs animated | Reanimated useReducedMotion |

### Data Flow

Atmosphere components have zero data dependencies. They receive only:
- Colors from ThemeContext (already exists)
- Animation parameters as props (duration, intensity, color)
- Reduce motion preference from Reanimated

```
Screen
  -> AtmosphereBackground (colors from ThemeContext)
  -> FloatingLettersLayer (color prop)
  -> [Screen Content]
    -> LetterHero (letter, animated boolean)
    -> FeedbackRipple (trigger from quiz logic)
```

No new contexts. No new state management. No data fetching. This is purely presentational.

## Patterns to Follow

### Pattern 1: Shared Value Animation with Reduce Motion

**What:** Every ambient animation uses Reanimated shared values and respects reduce motion.
**When:** Any repeating animation (breathing, drifting, pulsing).

```typescript
import { useReducedMotion } from 'react-native-reanimated';

function BreathingGlow({ size, color }: Props) {
  const opacity = useSharedValue(0.08);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.25, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.08, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [reduceMotion]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animStyle} pointerEvents="none">
      <GlowSvg size={size} color={color} />
    </Animated.View>
  );
}
```

### Pattern 2: Composable Atmosphere Layers

**What:** Background atmosphere is a composable stack, not a monolithic component.
**When:** Building any screen that needs ambient atmosphere.

```typescript
function LessonScreen() {
  return (
    <View style={{ flex: 1 }}>
      <AtmosphereBackground intensity="warm" />
      <FloatingLettersLayer color={colors.primary} tint="accent" />
      <SafeAreaView style={{ flex: 1 }}>
        <LetterHero letter={currentLetter} />
        {/* quiz content */}
      </SafeAreaView>
    </View>
  );
}
```

### Pattern 3: Feedback as Fire-and-Forget

**What:** Answer feedback animations trigger once and auto-complete, no state management.
**When:** Correct/wrong answer moments.

```typescript
function FeedbackRipple({ trigger }: { trigger: boolean }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (!trigger) return;
    scale.value = 0;
    opacity.value = 0.6;
    scale.value = withTiming(1.5, { duration: 500 });
    opacity.value = withTiming(0, { duration: 500 });
  }, [trigger]);
  // renders circular SVG that scales up and fades out
}
```

### Pattern 4: SVG Patterns as Static Defs

**What:** Geometric patterns defined once in SVG Defs, referenced by fill.
**When:** Islamic geometric backgrounds.
**Why:** SVG Pattern elements are rendered once and tiled natively. Zero per-frame cost.

```typescript
function GeometricPattern({ opacity = 0.03 }: { opacity?: number }) {
  return (
    <Svg style={StyleSheet.absoluteFill}>
      <Defs>
        <Pattern id="geo" width={40} height={40} patternUnits="userSpaceOnUse">
          <Path d="M20 0 L40 20 L20 40 L0 20 Z"
                fill={colors.accent} opacity={opacity} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#geo)" />
    </Svg>
  );
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Animating SVG Gradient Stops Directly
**What:** Using useAnimatedProps to animate stopOpacity or stopColor on RadialGradient Stop elements.
**Why bad:** SVG gradient stops require property adapters and processColor workarounds. Buggy across platforms.
**Instead:** Animate the opacity/scale of the entire SVG container (this is what WarmGlow.tsx already does correctly).

### Anti-Pattern 2: Animating Layout Properties
**What:** Using animated width, height, margin, or padding for ambient effects.
**Why bad:** Forces layout recalculation on every frame. Kills 60fps on mid-range Android.
**Instead:** Only animate transform (translateX/Y, scale, rotate) and opacity. GPU-composited, no layout cost.

### Anti-Pattern 3: Per-Screen Atmosphere Code
**What:** Copy-pasting gradient/glow/letter code into each screen component.
**Why bad:** Inconsistent atmosphere, maintenance burden, harder to tune globally.
**Instead:** Shared AtmosphereBackground component with intensity/variant props.

### Anti-Pattern 4: Spring Physics for Ambient Motion
**What:** Using withSpring for breathing/drifting animations.
**Why bad:** Springs are bouncy/playful. Wrong emotional register for reverent Quran learning.
**Instead:** withTiming + Easing.inOut(Easing.ease) for all ambient motion. Smooth, dignified, predictable.

### Anti-Pattern 5: Multiple Skia Canvases
**What:** If Skia were used, creating a separate Canvas per glow effect.
**Why bad:** Each Canvas is heavyweight in memory. Multiple on one screen causes frame drops.
**Instead:** Not relevant since we use react-native-svg, but worth noting if Skia is ever reconsidered.

## Scalability Considerations

| Concern | 5 screens | 15 screens | 30+ screens |
|---------|-----------|------------|-------------|
| Animation consistency | Shared components handle it | Same | Same |
| Shared value budget | ~20 per screen, fine | Same per screen | Same -- screens unmount on navigation |
| SVG Pattern memory | Negligible | Negligible | Negligible -- patterns are tiled |
| Maintenance | Low -- 6-8 primitive components | Low | Low -- screens compose primitives |

## Sources

- Existing WarmGlow.tsx and FloatingLettersLayer.tsx patterns in codebase
- [Reanimated Performance Guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
- [react-native-svg Pattern documentation](https://github.com/software-mansion/react-native-svg/blob/main/USAGE.md)
- [Reanimated useAnimatedProps](https://docs.swmansion.com/react-native-reanimated/docs/core/useAnimatedProps/)
