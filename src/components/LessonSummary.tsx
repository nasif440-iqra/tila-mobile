import { useEffect, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  useDerivedValue,
  runOnJS,
  interpolateColor,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useAudioPlayer } from "expo-audio";
import { useColors } from "../design/theme";
import { typography, spacing, radii, shadows, fontFamilies } from "../design/tokens";
import { Button } from "../design/components";
import { getSFXAsset } from "../audio/player";
import {
  getCompletionTier,
  COMPLETION_HEADLINES,
  COMPLETION_SUBLINES,
  CLOSING_QUOTES,
  pickCopy,
} from "../engine/engagement";
import { useState } from "react";
import { WarmGlow } from "./onboarding/WarmGlow";
import { hapticMilestone, hapticSuccess, hapticTap } from "../design/haptics";

// ── Types ──

interface LessonSummaryProps {
  lesson: any;
  results: { correct: number; total: number; questions: any[] };
  passed: boolean;
  accuracy: number; // 0-1
  onContinue: () => void;
  onRetry: () => void;
}

// ── Component ──

export function LessonSummary({
  lesson,
  results,
  passed,
  accuracy,
  onContinue,
  onRetry,
}: LessonSummaryProps) {
  const colors = useColors();
  const percentage = Math.round(accuracy * 100);

  // Animated count-up for accuracy
  const animatedPct = useSharedValue(0);
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    animatedPct.value = withDelay(
      300,
      withTiming(percentage, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
  }, [percentage]);

  // Poll the shared value to update the display text
  useDerivedValue(() => {
    runOnJS(setDisplayPct)(Math.round(animatedPct.value));
  });

  // Score-proportional haptic on mount
  useEffect(() => {
    if (percentage >= 80) hapticMilestone();
    else if (percentage >= 50) hapticSuccess();
    else hapticTap();
  }, []);

  // Count-up color interpolation (D-08)
  const countUpColor = useDerivedValue(() => {
    // Interpolate based on the current animated percentage value
    // 0-49: danger (red), 50-79: accent (gold), 80-100: primary (green)
    if (animatedPct.value < 50) {
      return interpolateColor(
        animatedPct.value,
        [0, 49],
        [colors.danger, colors.danger]
      );
    } else if (animatedPct.value < 80) {
      return interpolateColor(
        animatedPct.value,
        [50, 79],
        [colors.accent, colors.accent]
      );
    }
    return interpolateColor(
      animatedPct.value,
      [80, 100],
      [colors.accent, colors.primary]
    );
  });

  const countUpColorStyle = useAnimatedStyle(() => ({
    color: countUpColor.value,
  }));

  // Audio — play completion SFX on mount
  const sfxAsset = passed
    ? accuracy === 1
      ? getSFXAsset("lesson_complete_perfect")
      : getSFXAsset("lesson_complete")
    : null;
  const player = useAudioPlayer(sfxAsset);

  useEffect(() => {
    if (passed && player) {
      player.play();
    }
  }, [passed, player]);

  // Stable closing quote
  const closingQuote = useMemo(() => pickCopy(CLOSING_QUOTES), []);

  // Performance messaging
  const tier = getCompletionTier(percentage, false, false);
  const headline = (COMPLETION_HEADLINES as Record<string, string>)[tier] ?? "Lesson complete.";
  const subline = (COMPLETION_SUBLINES as Record<string, string>)[tier] ?? "";

  // Icon background
  const iconBg = passed ? colors.primarySoft : colors.accentLight;
  const iconColor = passed ? colors.primary : colors.accent;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Warm ambient gradient */}
      <LinearGradient
        colors={[colors.bgWarm, "transparent"]}
        locations={[0, 1]}
        style={styles.ambientGradient}
        pointerEvents="none"
      />

      <Animated.View entering={FadeIn.duration(500)} style={[styles.content, { backgroundColor: colors.bgCard }]}>
        {/* 1. Result icon with score-proportional WarmGlow */}
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          {percentage >= 50 && (
            <WarmGlow
              size={percentage >= 80 ? 180 : 120}
              animated
              color="rgba(196,164,100,0.3)"
              pulseMin={percentage >= 80 ? 0.15 : 0.08}
              pulseMax={percentage >= 80 ? 0.4 : 0.2}
            />
          )}
          <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
            {passed ? (
              <CheckIcon size={36} color={iconColor} />
            ) : (
              <RefreshIcon size={36} color={iconColor} />
            )}
          </View>
        </View>

        {/* 2. Accuracy display with animated color */}
        <Animated.View entering={FadeIn.delay(200).duration(400)}>
          <Animated.Text
            style={[
              styles.accuracyText,
              { fontFamily: fontFamilies.headingBold },
              countUpColorStyle,
            ]}
          >
            {displayPct}%
          </Animated.Text>
        </Animated.View>

        {/* 3. Performance message */}
        <Animated.View
          entering={FadeIn.delay(400).duration(400)}
          style={styles.messagingBlock}
        >
          <Text style={[typography.heading2, styles.headline, { color: colors.text }]}>
            {headline}
          </Text>
          <Text style={[typography.body, styles.subline, { color: colors.textSoft }]}>
            {subline}
          </Text>
        </Animated.View>

        {/* 4. Score bar */}
        <Animated.View entering={FadeIn.delay(550).duration(400)}>
          <Text style={[typography.bodySmall, styles.scoreText, { color: colors.textMuted }]}>
            {results.correct} out of {results.total} correct
          </Text>
        </Animated.View>

        {/* 5. Closing quote */}
        <Animated.View
          entering={FadeIn.delay(700).duration(400)}
          style={styles.quoteBlock}
        >
          <Text
            style={[
              styles.quoteText,
              { color: colors.textMuted, fontFamily: fontFamilies.headingItalic },
            ]}
          >
            "{closingQuote}"
          </Text>
        </Animated.View>

        {/* 6. Action buttons */}
        <Animated.View
          entering={FadeIn.delay(900).duration(400)}
          style={styles.actions}
        >
          {passed ? (
            <Button title="Continue" onPress={onContinue} />
          ) : (
            <>
              <Button title="Try Again" onPress={onRetry} />
              <View style={styles.ghostButtonSpacer} />
              <Button
                title="Continue Anyway"
                variant="ghost"
                onPress={onContinue}
              />
            </>
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ── Inline SVG-style icons as RN components ──

function CheckIcon({ size, color }: { size: number; color: string }) {
  // Simple checkmark using a bordered View trick — or we use Text with unicode
  return (
    <Text style={{ fontSize: size, color, lineHeight: size + 4 }}>
      {"\u2713"}
    </Text>
  );
}

function RefreshIcon({ size, color }: { size: number; color: string }) {
  // Refresh/retry arrow using unicode
  return (
    <Text style={{ fontSize: size, color, lineHeight: size + 4 }}>
      {"\u21BB"}
    </Text>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  ambientGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  content: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    borderRadius: radii.xxl,
    ...shadows.cardLifted,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  accuracyText: {
    fontSize: 56,
    lineHeight: 64,
    fontWeight: "700",
    marginBottom: spacing.lg,
  },
  messagingBlock: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  headline: {
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  subline: {
    textAlign: "center",
    maxWidth: 300,
  },
  scoreText: {
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  quoteBlock: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
  },
  quoteText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    fontStyle: "italic",
  },
  actions: {
    width: "100%",
  },
  ghostButtonSpacer: {
    height: spacing.sm,
  },
});
