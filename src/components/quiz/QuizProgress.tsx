import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  interpolateColor,
  SlideInDown,
  SlideOutUp,
} from "react-native-reanimated";
import { useColors } from "../../design/theme";
import { typography, spacing, radii, shadows } from "../../design/tokens";
import { springs } from "../../design/animations";
import { hapticSuccess, hapticMilestone } from "../../design/haptics";

// ── Types ──

interface QuizProgressProps {
  questionIndex: number;
  originalQCount: number;
  progressPct: number;
  streak: number;
  isRecycled: boolean;
}

// ── Streak tiers ──

const STREAK_MILESTONES = [3, 5, 7] as const;

interface StreakTier {
  message: string;
  emoji: string;
  tier: 1 | 2 | 3;
}

function getStreakTier(streak: number): StreakTier {
  if (streak >= 7) return { message: "Masha'Allah!", emoji: "\uD83D\uDD25\u2728", tier: 3 };
  if (streak >= 5) return { message: "Sharp focus!", emoji: "\u2B50\u2B50", tier: 2 };
  return { message: "Nice streak!", emoji: "\u2728", tier: 1 };
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
    progressWidth.value = withSpring(progressPct, springs.gentle);
  }, [progressPct, progressWidth]);

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

  // Streak banner detection
  useEffect(() => {
    if (
      streak > prevStreakRef.current &&
      STREAK_MILESTONES.includes(streak as 3 | 5 | 7)
    ) {
      if (streak >= 7) {
        hapticMilestone();
      } else {
        hapticSuccess();
      }
      setBannerStreak(streak);
      const timer = setTimeout(() => setBannerStreak(null), streak >= 7 ? 2500 : 1500);
      return () => clearTimeout(timer);
    }
    prevStreakRef.current = streak;
  }, [streak]);

  const tier = bannerStreak ? getStreakTier(bannerStreak) : null;

  return (
    <>
      {/* Streak banner overlay */}
      {bannerStreak !== null && tier && (
        <Animated.View
          entering={SlideInDown.springify().stiffness(300).damping(20)}
          exiting={SlideOutUp.duration(300)}
          style={[
            styles.streakBanner,
            shadows.cardLifted,
            tier.tier === 3
              ? { backgroundColor: colors.primary, borderColor: "rgba(196, 164, 100, 0.35)" }
              : tier.tier === 2
                ? { backgroundColor: colors.bgCard, borderColor: colors.accent }
                : { backgroundColor: colors.accentLight, borderColor: colors.accent },
          ]}
        >
          <Text
            style={[
              styles.streakText,
              {
                color: tier.tier === 3 ? colors.accent : colors.accent,
              },
            ]}
          >
            {tier.emoji} {bannerStreak} in a row {tier.tier >= 2 ? " \u2014 " + tier.message : ""}
          </Text>
          {tier.tier === 3 && (
            <Text style={[styles.streakArabic, { color: "rgba(196, 164, 100, 0.7)" }]}>
              {"\u0645\u0627 \u0634\u0627\u0621 \u0627\u0644\u0644\u0647"}
            </Text>
          )}
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
  streakBanner: {
    position: "absolute",
    top: spacing.xxxl,
    left: spacing.xl,
    right: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.full,
    borderWidth: 1.5,
    alignItems: "center",
    zIndex: 100,
  },
  streakText: {
    ...typography.bodyLarge,
    fontWeight: "700",
  },
  streakArabic: {
    fontFamily: "Amiri_400Regular",
    fontSize: 14,
    marginTop: 2,
  },
});
