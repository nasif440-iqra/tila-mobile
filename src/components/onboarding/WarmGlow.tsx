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

interface WarmGlowProps {
  size?: number;
  opacity?: number;
  animated?: boolean;
  color?: string;
  pulseMin?: number;
  pulseMax?: number;
}

// Internal: static variant — no Reanimated hooks
function StaticWarmGlow({
  size,
  opacity,
  color,
}: {
  size: number;
  opacity: number;
  color?: string;
}) {
  return (
    <View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color ?? `rgba(196, 164, 100, ${opacity})`,
      }}
    />
  );
}

// Internal: animated variant — uses Reanimated hooks
function AnimatedWarmGlow({
  size,
  color,
  pulseMin,
  pulseMax,
}: {
  size: number;
  color?: string;
  pulseMin: number;
  pulseMax: number;
}) {
  const pulseOpacity = useSharedValue(pulseMin);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(pulseMax, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(pulseMin, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
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

// Public API — thin wrapper that delegates based on animated prop
export function WarmGlow({
  size = 340,
  opacity = 0.12,
  animated = false,
  color,
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
