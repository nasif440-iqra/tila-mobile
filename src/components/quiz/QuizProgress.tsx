import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  interpolateColor,
} from "react-native-reanimated";
import { useColors } from "../../design/theme";
import { typography, spacing } from "../../design/tokens";
import { springs } from "../../design/animations";

// ── Types ──

interface QuizProgressProps {
  questionIndex: number;
  originalQCount: number;
  progressPct: number;
  isRecycled: boolean;
}

// ── Component ──

export function QuizProgress({
  questionIndex,
  originalQCount,
  progressPct,
  isRecycled,
}: QuizProgressProps) {
  const colors = useColors();

  // Spring-animated progress bar
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withSpring(progressPct, springs.gentle);
  }, [progressPct]);

  const nearComplete = useDerivedValue(() =>
    progressWidth.value > 85 ? 1 : 0
  );

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
    backgroundColor: interpolateColor(
      nearComplete.value,
      [0, 1],
      [colors.primary, colors.accent]
    ),
  }));

  return (
    <>
      {/* Progress bar */}
      <View style={styles.progressSection}>
        <View
          style={[styles.progressTrack, { backgroundColor: colors.border }]}
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.round(progressPct),
          }}
        >
          <Animated.View
            style={[
              styles.progressFill,
              progressBarStyle,
            ]}
          />
        </View>
        <Text style={[styles.progressCounter, { color: colors.textSoft }]}>
          {Math.min(questionIndex + 1, originalQCount)}/
          {originalQCount}
        </Text>
      </View>

      {/* Recycled question hint */}
      {isRecycled && (
        <Text style={[styles.recycledHint, { color: colors.textMuted }]}>
          {"Review \u2014 missed questions come back once"}
        </Text>
      )}
    </>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressCounter: {
    ...typography.caption,
    fontWeight: "700",
    minWidth: 40,
    textAlign: "right",
  },
  recycledHint: {
    ...typography.caption,
    textAlign: "center",
    fontStyle: "italic",
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
});
