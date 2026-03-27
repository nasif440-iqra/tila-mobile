import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  SlideInDown,
  SlideOutUp,
} from "react-native-reanimated";
import { useColors } from "../../design/theme";
import { typography, spacing, radii } from "../../design/tokens";

// ── Types ──

interface QuizProgressProps {
  questionIndex: number;
  totalQuestions: number;
  originalQCount: number;
  progressPct: number;
  streak: number;
  isRecycled: boolean;
}

// ── Streak thresholds ──

const STREAK_MILESTONES = [3, 5, 7] as const;

function getStreakMessage(streak: number): string {
  if (streak >= 7) return "Unstoppable! \uD83D\uDD25";
  if (streak >= 5) return "On fire! \u2B50";
  return "Nice streak! \u2728";
}

// ── Component ──

export function QuizProgress({
  questionIndex,
  originalQCount,
  progressPct,
  streak,
  isRecycled,
}: QuizProgressProps) {
  const colors = useColors();

  const [bannerStreak, setBannerStreak] = useState<number | null>(null);
  const prevStreakRef = useRef(0);

  // Spring-animated progress bar
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withSpring(progressPct, {
      stiffness: 120,
      damping: 20,
    });
  }, [progressPct, progressWidth]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // Streak banner detection
  useEffect(() => {
    if (
      streak > prevStreakRef.current &&
      STREAK_MILESTONES.includes(streak as 3 | 5 | 7)
    ) {
      setBannerStreak(streak);
      const timer = setTimeout(() => setBannerStreak(null), 1500);
      return () => clearTimeout(timer);
    }
    prevStreakRef.current = streak;
  }, [streak]);

  return (
    <>
      {/* Streak banner overlay */}
      {bannerStreak !== null && (
        <Animated.View
          entering={SlideInDown.springify().stiffness(300).damping(20)}
          exiting={SlideOutUp.duration(300)}
          style={[
            styles.streakBanner,
            { backgroundColor: colors.accentLight, borderColor: colors.accent },
          ]}
        >
          <Text
            style={[
              styles.streakText,
              { color: colors.accent },
            ]}
          >
            {bannerStreak} in a row! {getStreakMessage(bannerStreak)}
          </Text>
        </Animated.View>
      )}

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
              { backgroundColor: colors.primary },
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
          Review -- missed questions come back once
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
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
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
  streakBanner: {
    position: "absolute",
    top: spacing.xxxl,
    left: spacing.xl,
    right: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 2,
    alignItems: "center",
    zIndex: 100,
  },
  streakText: {
    ...typography.bodyLarge,
    fontWeight: "700",
  },
});
