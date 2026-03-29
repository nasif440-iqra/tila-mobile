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

/**
 * Radial glow effect using concentric View layers.
 * Replaces the previous LinearGradient-based implementation which crashed
 * on-device with "Unimplemented component: ViewManagerAdapter_ExpoLinearGradient".
 */

function parseColor(color: string): { r: number; g: number; b: number } {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
  }
  // Default warm gold
  return { r: 196, g: 164, b: 100 };
}

// Concentric rings that simulate a radial gradient
function GlowLayers({
  size,
  opacity,
  color,
}: {
  size: number;
  opacity: number;
  color: string;
}) {
  const { r, g, b } = parseColor(color);

  // 4 concentric layers: inner (most opaque) → outer (fading)
  const layers = [
    { scale: 0.35, opacityMul: 1.0 },
    { scale: 0.55, opacityMul: 0.6 },
    { scale: 0.75, opacityMul: 0.3 },
    { scale: 1.0, opacityMul: 0.1 },
  ];

  return (
    <>
      {layers.map((layer, i) => {
        const layerSize = size * layer.scale;
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              width: layerSize,
              height: layerSize,
              borderRadius: layerSize / 2,
              backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity * layer.opacityMul})`,
            }}
          />
        );
      })}
    </>
  );
}

// Internal: static variant
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
    >
      <GlowLayers size={size} opacity={opacity} color={color} />
    </View>
  );
}

// Internal: animated variant with breathing scale + opacity
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
          alignItems: "center",
          justifyContent: "center",
        },
        animStyle,
      ]}
    >
      <GlowLayers size={size} opacity={midOpacity * 2.5} color={color} />
    </Animated.View>
  );
}

// Public API
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
