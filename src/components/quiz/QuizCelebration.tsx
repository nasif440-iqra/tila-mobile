import { StyleSheet, Pressable, Text } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useColors } from "../../design/theme";
import { typography, spacing } from "../../design/tokens";

// ── Types ──

interface QuizCelebrationProps {
  onDismiss: () => void;
}

// ── Component ──

export function QuizCelebration({ onDismiss }: QuizCelebrationProps) {
  const colors = useColors();

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={[styles.midCelebOverlay, { backgroundColor: `${colors.bg}E6` }]}
    >
      <Pressable onPress={onDismiss} style={styles.midCelebContent}>
        <Text style={styles.midCelebEmoji}>
          {"\uD83C\uDF1F"}
        </Text>
        <Text style={[styles.midCelebTitle, { color: colors.primary }]}>
          Keep going!
        </Text>
        <Text style={[styles.midCelebSubtitle, { color: colors.textSoft }]}>
          You{"\u2019"}re halfway there
        </Text>
        <Text style={[styles.midCelebTap, { color: colors.textMuted }]}>
          Tap to continue
        </Text>
      </Pressable>
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
