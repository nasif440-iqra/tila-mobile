import { useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { WarmGlow } from "../onboarding/WarmGlow";
import { useColors } from "../../design/theme";
import { springs, durations, easings } from "../../design/animations";
import { spacing, fontFamilies } from "../../design/tokens";
import { CrescentIcon } from "../../design/CrescentIcon";

// ── Props ──

export interface AnimatedStreakBadgeProps {
  count: number;
  enterDelay?: number;
}

// ── Component ──

export function AnimatedStreakBadge({ count, enterDelay = 0 }: AnimatedStreakBadgeProps) {
  const colors = useColors();
  const prevCount = useRef(count);

  // Entrance animation
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(
      enterDelay,
      withTiming(1, { duration: durations.normal, easing: easings.contentReveal }),
    );
  }, []);

  // Milestone pulse: detect count increase
  useEffect(() => {
    if (count > prevCount.current) {
      scale.value = withSpring(1.05, springs.bouncy, () => {
        scale.value = withSpring(1, springs.bouncy);
      });
    }
    prevCount.current = count;
  }, [count]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      {/* Breathing glow behind the pill */}
      <WarmGlow
        animated={true}
        size={60}
        color={colors.accentGlow}
        pulseMin={0.04}
        pulseMax={0.12}
      />

      {/* Pill badge */}
      <View style={[styles.pill, { borderColor: colors.border }]}>
        <CrescentIcon size={14} color={colors.accent} />
        <Text style={[styles.count, { color: colors.text }]}>{count}</Text>
        <Text style={[styles.label, { color: colors.textMuted }]}>Wird</Text>
      </View>
    </Animated.View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 9999,
    borderWidth: 1,
  },
  count: {
    fontSize: 13,
    fontFamily: fontFamilies.bodySemiBold,
  },
  label: {
    fontSize: 11,
    fontFamily: fontFamilies.bodyMedium,
  },
});
