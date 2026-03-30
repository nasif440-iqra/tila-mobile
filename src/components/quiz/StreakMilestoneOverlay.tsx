import { useEffect, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useColors } from "../../design/theme";
import { spacing, fontFamilies } from "../../design/tokens";
import { hapticMilestone, hapticSuccess } from "../../design/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface StreakMilestoneOverlayProps {
  streak: number;
  onDismiss: () => void;
}

const MILESTONES: Record<number, { emoji: string; headline: string; subline: string; arabicPrefix?: string }> = {
  3: {
    emoji: "\u2728",
    headline: "3 in a row!",
    subline: "You\u2019re finding your rhythm.",
  },
  5: {
    emoji: "\u2B50",
    headline: "5 in a row!",
    subline: "Sharp focus \u2014 keep this going.",
  },
  7: {
    emoji: "\uD83C\uDF1F",
    headline: "7 in a row!",
    arabicPrefix: "\u0645\u0627 \u0634\u0627\u0621 \u0627\u0644\u0644\u0647",
    subline: "Beautiful work.",
  },
};

export function StreakMilestoneOverlay({ streak, onDismiss }: StreakMilestoneOverlayProps) {
  const colors = useColors();
  const milestone = MILESTONES[streak] ?? MILESTONES[3];

  const backdropOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.92);
  const emojiScale = useSharedValue(0.5);
  const emojiOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.6);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    if (streak >= 7) hapticMilestone();
    else hapticSuccess();

    // Backdrop
    backdropOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });

    // Ring pulse
    ringOpacity.value = withDelay(100, withTiming(0.3, { duration: 300 }));
    ringScale.value = withDelay(100, withSequence(
      withTiming(1.3, { duration: 500, easing: Easing.out(Easing.cubic) }),
      withTiming(1.1, { duration: 300 }),
    ));

    // Emoji
    emojiOpacity.value = withDelay(150, withTiming(1, { duration: 250 }));
    emojiScale.value = withDelay(150, withSequence(
      withTiming(1.15, { duration: 300, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 200 }),
    ));

    // Content
    contentOpacity.value = withDelay(300, withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }));
    contentScale.value = withDelay(300, withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }));
  }, []);

  const handleDismiss = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: 160, easing: Easing.in(Easing.cubic) });
    contentOpacity.value = withTiming(0, { duration: 160 });
    contentScale.value = withTiming(0.96, { duration: 160, easing: Easing.in(Easing.cubic) }, () => {
      runOnJS(onDismiss)();
    });
  }, [onDismiss]);

  // Auto-dismiss after a brief hold
  useEffect(() => {
    const holdMs = streak >= 7 ? 2200 : 1600;
    const timer = setTimeout(handleDismiss, holdMs);
    return () => clearTimeout(timer);
  }, []);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  const emojiStyle = useAnimatedStyle(() => ({
    opacity: emojiOpacity.value,
    transform: [{ scale: emojiScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
      </Animated.View>

      {/* Content */}
      <View style={styles.centerWrap} pointerEvents="box-none">
        <Pressable onPress={handleDismiss} style={styles.contentTap}>
          {/* Ring */}
          <Animated.View
            style={[
              styles.ring,
              { borderColor: colors.accent },
              ringStyle,
            ]}
          />

          {/* Emoji */}
          <Animated.View style={emojiStyle}>
            <Text style={styles.emoji}>{milestone.emoji}</Text>
          </Animated.View>

          {/* Text */}
          <Animated.View style={[styles.textBlock, contentStyle]}>
            <Text style={[styles.headline, { color: colors.text }]}>
              {milestone.headline}
            </Text>
            {milestone.arabicPrefix && (
              <Text style={[styles.arabicLine, { color: colors.accent }]}>
                {milestone.arabicPrefix}
              </Text>
            )}
            <Text style={[styles.subline, { color: colors.textSoft }]}>
              {milestone.subline}
            </Text>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F8F6F0",
  },
  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  contentTap: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxxl,
  },
  ring: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  },
  emoji: {
    fontSize: 48,
    lineHeight: 56,
    marginBottom: spacing.lg,
  },
  textBlock: {
    alignItems: "center",
  },
  headline: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 24,
    lineHeight: 32,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  arabicLine: {
    fontFamily: fontFamilies.arabicRegular,
    fontSize: 26,
    lineHeight: 38,
    textAlign: "center",
    writingDirection: "rtl",
    marginBottom: spacing.xs,
  },
  subline: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 260,
  },
});
