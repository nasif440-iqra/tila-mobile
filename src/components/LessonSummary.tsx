import { useEffect, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
  useDerivedValue,
  runOnJS,
} from "react-native-reanimated";
import { useAudioPlayer } from "expo-audio";
import { useColors } from "../design/theme";
import { typography, spacing, radii, fontFamilies } from "../design/tokens";
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

  // Accuracy color
  const accuracyColor =
    percentage >= 80
      ? colors.primary
      : percentage >= 50
        ? colors.accent
        : colors.danger;

  // Icon background
  const iconBg = passed ? colors.primarySoft : colors.accentLight;
  const iconColor = passed ? colors.primary : colors.accent;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.content}>
        {/* 1. Result icon */}
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          {passed ? (
            <CheckIcon size={36} color={iconColor} />
          ) : (
            <RefreshIcon size={36} color={iconColor} />
          )}
        </View>

        {/* 2. Accuracy display */}
        <Animated.View entering={FadeIn.delay(200).duration(400)}>
          <Text
            style={[
              styles.accuracyText,
              { color: accuracyColor, fontFamily: fontFamilies.headingBold },
            ]}
          >
            {displayPct}%
          </Text>
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
  content: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    borderRadius: radii.xl,
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
