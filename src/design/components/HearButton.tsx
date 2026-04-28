import { Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { useState, useCallback } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useColors } from "../theme";
import { springs, pressScale } from "../animations";
import { hapticTap } from "../haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface HearButtonProps {
  onPlay: () => void | Promise<void>;
  size?: number;
  accessibilityLabel?: string;
  /**
   * When true, the button is non-interactive and visually de-emphasized.
   * Used to indicate the audio asset isn't yet available without removing
   * the visual affordance.
   */
  disabled?: boolean;
}

export function HearButton({
  onPlay,
  size = 48,
  accessibilityLabel = "Play audio",
  disabled = false,
}: HearButtonProps) {
  const colors = useColors();
  const [loading, setLoading] = useState(false);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(pressScale.subtle, springs.press);
  }

  function handlePressOut() {
    scale.value = withSpring(1, springs.press);
  }

  const handlePress = useCallback(async () => {
    if (loading || disabled) return;
    hapticTap();
    setLoading(true);
    try {
      await onPlay();
    } finally {
      setLoading(false);
    }
  }, [onPlay, loading, disabled]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={loading || disabled}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primarySoft,
          opacity: loading ? 0.6 : disabled ? 0.4 : 1,
        },
        animatedStyle,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none">
          <Path
            d="M11 5L6 9H2v6h4l5 4V5z"
            fill={colors.primary}
          />
          <Path
            d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"
            stroke={colors.primary}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
});
