import { useEffect, useMemo } from "react";
import { StyleSheet, Pressable, Text } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useColors } from "../../design/theme";
import { typography, spacing } from "../../design/tokens";
import { springs } from "../../design/animations";
import { hapticMilestone, hapticTap } from "../../design/haptics";
import { MID_CELEBRATE_COPY, pickCopy } from "../../engine/engagement";

// ── Types ──

interface QuizCelebrationProps {
  onDismiss: () => void;
}

// ── Component ──

export function QuizCelebration({ onDismiss }: QuizCelebrationProps) {
  const colors = useColors();

  const contentScale = useSharedValue(0.9);
  const subtitle = useMemo(
    () => pickCopy((MID_CELEBRATE_COPY as any).default),
    []
  );

  useEffect(() => {
    hapticMilestone();
    contentScale.value = withSpring(1, springs.bouncy);
  }, [contentScale]);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={[styles.midCelebOverlay, { backgroundColor: `${colors.bg}E6` }]}
    >
      <Animated.View style={scaleStyle}>
        <Pressable
          onPress={() => {
            hapticTap();
            onDismiss();
          }}
          style={styles.midCelebContent}
        >
          <Text style={styles.midCelebEmoji}>
            {"\uD83C\uDF1F"}
          </Text>
          <Text style={[styles.midCelebTitle, { color: colors.primary }]}>
            Keep going!
          </Text>
          <Text style={[styles.midCelebSubtitle, { color: colors.textSoft }]}>
            {subtitle}
          </Text>
          <Text style={[styles.midCelebTap, { color: colors.textMuted }]}>
            Tap to continue
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  midCelebOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
  },
  midCelebContent: {
    alignItems: "center",
    padding: spacing.xxl,
  },
  midCelebEmoji: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
  midCelebTitle: {
    ...typography.heading1,
    marginBottom: spacing.sm,
  },
  midCelebSubtitle: {
    ...typography.body,
    marginBottom: spacing.xl,
  },
  midCelebTap: {
    ...typography.caption,
  },
});
