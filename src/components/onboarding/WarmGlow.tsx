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
import { LinearGradient } from "expo-linear-gradient";

interface WarmGlowProps {
  size?: number;
  opacity?: number;
  animated?: boolean;
  color?: string;
  pulseMin?: number;
  pulseMax?: number;
}

// Internal: static variant -- no Reanimated hooks
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
        overflow: "hidden",
      }}
    >
      <LinearGradient
        colors={[
          color ?? `rgba(196, 164, 100, ${opacity})`,
          color ? color.replace(/[\d.]+\)$/, `${opacity * 0.4})`) : `rgba(196, 164, 100, ${opacity * 0.4})`,
          "transparent",
        ]}
        locations={[0, 0.5, 0.85]}
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
      />
    </View>
  );
}

// Internal: animated variant -- uses Reanimated hooks + breathing scale
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
  const pulseScale = useSharedValue(1);

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
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
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
    transform: [{ scale: pulseScale.value }],
  }));

  const midOpacity = (pulseMin + pulseMax) / 2;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: "hidden",
        },
        animStyle,
      ]}
    >
      <LinearGradient
        colors={[
          color ?? `rgba(196, 164, 100, ${midOpacity * 2.5})`,
          color ? color.replace(/[\d.]+\)$/, `${midOpacity * 1.2})`) : `rgba(196, 164, 100, ${midOpacity * 1.2})`,
          "transparent",
        ]}
        locations={[0, 0.45, 0.8]}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
}

// Public API -- thin wrapper that delegates based on animated prop
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
