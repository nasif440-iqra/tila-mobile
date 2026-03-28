import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import Svg, { Circle, Path, Line } from "react-native-svg";
import { useColors } from "../../design/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const easeInOut = Easing.inOut(Easing.ease);

interface BrandedLogoProps {
  width?: number;
  height?: number;
}

/**
 * Branded logo mark rendered from tila-transparent-mark.svg with Reanimated animations.
 * Replaces CSS @keyframes with native animated values.
 *
 * Performance budget: 5 shared values (well under 8 max per UI-SPEC).
 */
export function BrandedLogo({ width = 120, height = 160 }: BrandedLogoProps) {
  const colors = useColors();

  // ── 5 shared values total ──
  const glowOpacity = useSharedValue(0.04);
  const starOpacity1 = useSharedValue(0.2);
  const starOpacity2 = useSharedValue(0.2);
  const archOpacity = useSharedValue(0.5);
  const keystoneScale = useSharedValue(1.0);

  useEffect(() => {
    // Glow: pulse between 0.04 and 0.12
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.12, { duration: 2000, easing: easeInOut }),
        withTiming(0.04, { duration: 2000, easing: easeInOut }),
      ),
      -1,
      false,
    );

    // Stars group 1 (stars 1,2,3): pulse opacity 0.2 -> 1.0
    starOpacity1.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: 1200, easing: easeInOut }),
        withTiming(0.2, { duration: 1800, easing: easeInOut }),
      ),
      -1,
      false,
    );

    // Stars group 2 (stars 4,5): same pattern with 1000ms delay
    starOpacity2.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(1.0, { duration: 1200, easing: easeInOut }),
          withTiming(0.2, { duration: 1800, easing: easeInOut }),
        ),
        -1,
        false,
      ),
    );

    // Arches: pulse opacity 0.5 -> 0.9
    archOpacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 2000, easing: easeInOut }),
        withTiming(0.5, { duration: 2000, easing: easeInOut }),
      ),
      -1,
      false,
    );

    // Keystone: pulse scale 1.0 -> 1.25 (via radius change)
    keystoneScale.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 1500, easing: easeInOut }),
        withTiming(1.0, { duration: 1500, easing: easeInOut }),
      ),
      -1,
      false,
    );
  }, []);

  // ── Animated props ──

  const glowOuterProps = useAnimatedProps(() => ({
    opacity: glowOpacity.value,
  }));

  const glowInnerProps = useAnimatedProps(() => ({
    opacity: glowOpacity.value * 1.33, // inner glow slightly brighter
  }));

  // Stars group 1: stars at (140,95), (265,110), (245,80)
  const star1Props = useAnimatedProps(() => ({
    opacity: starOpacity1.value * 0.4,
  }));

  // Stars group 2: stars at (132,135), (162,72)
  const star2Props = useAnimatedProps(() => ({
    opacity: starOpacity2.value * 0.4,
  }));

  // Outer arch
  const archOuterProps = useAnimatedProps(() => ({
    opacity: archOpacity.value,
  }));

  // Inner arch
  const archInnerProps = useAnimatedProps(() => ({
    opacity: archOpacity.value * 0.3, // inner arch much subtler
  }));

  // Keystone circle: animate radius for scale effect
  const keystoneProps = useAnimatedProps(() => ({
    r: 4 * keystoneScale.value,
    opacity: 0.5 + keystoneScale.value * 0.24, // 0.7 at 1.0, ~1.0 at 1.25
  }));

  return (
    <Svg width={width} height={height} viewBox="0 0 400 480" fill="none">
      {/* Glow circles */}
      <AnimatedCircle
        cx={200}
        cy={160}
        r={80}
        fill={colors.primary}
        animatedProps={glowOuterProps}
      />
      <AnimatedCircle
        cx={200}
        cy={160}
        r={55}
        fill={colors.primary}
        animatedProps={glowInnerProps}
      />

      {/* Crescent moon (static) */}
      <Circle cx={200} cy={160} r={52} fill={colors.primary} />
      <Circle cx={218} cy={146} r={42} fill={colors.bgWarm} />

      {/* Stars group 1: (140,95), (265,110), (245,80) */}
      <AnimatedCircle
        cx={140}
        cy={95}
        r={3}
        fill={colors.primary}
        animatedProps={star1Props}
      />
      <AnimatedCircle
        cx={265}
        cy={110}
        r={2.5}
        fill={colors.primary}
        animatedProps={star1Props}
      />
      <AnimatedCircle
        cx={245}
        cy={80}
        r={2}
        fill={colors.primary}
        animatedProps={star1Props}
      />

      {/* Stars group 2: (132,135), (162,72) */}
      <AnimatedCircle
        cx={132}
        cy={135}
        r={2}
        fill={colors.primary}
        animatedProps={star2Props}
      />
      <AnimatedCircle
        cx={162}
        cy={72}
        r={2.5}
        fill={colors.primary}
        animatedProps={star2Props}
      />

      {/* Outer arch */}
      <AnimatedPath
        d="M122 310 L122 185 Q122 58 200 46 Q278 58 278 185 L278 310"
        stroke={colors.primary}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
        animatedProps={archOuterProps}
      />

      {/* Inner arch */}
      <AnimatedPath
        d="M140 310 L140 190 Q140 80 200 68 Q260 80 260 190 L260 310"
        stroke={colors.primary}
        strokeWidth={1}
        fill="none"
        animatedProps={archInnerProps}
      />

      {/* Keystone circle */}
      <AnimatedCircle
        cx={200}
        cy={44}
        fill={colors.primary}
        animatedProps={keystoneProps}
      />

      {/* Base dots (static) */}
      <Circle cx={122} cy={310} r={2.5} fill={colors.primary} opacity={0.25} />
      <Circle cx={278} cy={310} r={2.5} fill={colors.primary} opacity={0.25} />

      {/* Base line (static) */}
      <Line
        x1={112}
        y1={310}
        x2={288}
        y2={310}
        stroke={colors.primary}
        strokeWidth={0.5}
        opacity={0.15}
      />
    </Svg>
  );
}
