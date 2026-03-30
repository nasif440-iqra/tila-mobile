import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";

interface WarmGlowProps {
  size?: number;
  opacity?: number;
  animated?: boolean;
  color?: string;
  pulseMin?: number;
  pulseMax?: number;
}

/**
 * Radial glow effect using SVG RadialGradient for smooth falloff.
 * Replaces the concentric-ring View approach which created visible "staircase" banding.
 */

function parseColor(color: string): { r: number; g: number; b: number; a: number } {
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
      a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1,
    };
  }
  // Default warm gold
  return { r: 196, g: 164, b: 100, a: 0.3 };
}

// SVG glow with true radial gradient — smooth falloff matching web
function GlowSvg({
  size,
  opacity,
  color,
}: {
  size: number;
  opacity: number;
  color: string;
}) {
  const { r, g, b } = parseColor(color);
  const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id={`glow-${size}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={hex} stopOpacity={opacity} />
          <Stop offset="45%" stopColor={hex} stopOpacity={opacity * 0.5} />
          <Stop offset="70%" stopColor={hex} stopOpacity={opacity * 0.15} />
          <Stop offset="100%" stopColor={hex} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={size} height={size} fill={`url(#glow-${size})`} />
    </Svg>
  );
}

// Static glow
function StaticWarmGlow({
  size,
  opacity,
  color,
}: {
  size: number;
  opacity: number;
  color: string;
}) {
  return (
    <View
      style={{
        position: "absolute",
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
      pointerEvents="none"
    >
      <GlowSvg size={size} opacity={opacity} color={color} />
    </View>
  );
}

// Animated glow with breathing scale + opacity
function AnimatedWarmGlow({
  size,
  color,
  pulseMin,
  pulseMax,
}: {
  size: number;
  color: string;
  pulseMin: number;
  pulseMax: number;
}) {
  const pulseOpacity = useSharedValue(pulseMin);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(pulseMax, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(pulseMin, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  // Static base opacity — animated opacity multiplies on top
  const baseOpacity = (pulseMin + pulseMax) / 2;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        },
        animStyle,
      ]}
      pointerEvents="none"
    >
      <GlowSvg size={size} opacity={baseOpacity * 2} color={color} />
    </Animated.View>
  );
}

// Public API — drop-in replacement, same props
export function WarmGlow({
  size = 340,
  opacity = 0.12,
  animated = false,
  color = "rgba(196, 164, 100, 0.3)",
  pulseMin = 0.08,
  pulseMax = 0.25,
}: WarmGlowProps) {
  if (!animated) {
    return <StaticWarmGlow size={size} opacity={opacity} color={color} />;
  }
  return (
    <AnimatedWarmGlow
      size={size}
      color={color}
      pulseMin={pulseMin}
      pulseMax={pulseMax}
    />
  );
}
