import { useEffect, useRef, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";
import { ArabicText } from "./ArabicText";
import { useColors } from "../theme";
import { fontFamilies, spacing } from "../tokens";

// ── Types ──

export interface PhraseWord {
  arabic: string;
  transliteration: string;
  meaning?: string;
}

export interface PhraseRevealProps {
  words: PhraseWord[];
  wordDuration?: number;
  staggerDelay?: number;
  onComplete?: () => void;
  layout?: "horizontal" | "vertical";
  arabicSize?: "large" | "display";
  arabicStyle?: object;
  accessibilityLabel?: string;
}

// ── Internal RevealWord component ──

function RevealWord({
  word,
  delay,
  duration,
  arabicSize,
  arabicStyle,
  showImmediately,
}: {
  word: PhraseWord;
  delay: number;
  duration: number;
  arabicSize: "large" | "display";
  arabicStyle?: object;
  showImmediately: boolean;
}) {
  const colors = useColors();
  const opacity = useSharedValue(showImmediately ? 1 : 0);
  const translateY = useSharedValue(showImmediately ? 0 : 8);

  useEffect(() => {
    if (showImmediately) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration, easing: Easing.out(Easing.cubic) })
    );
  }, [delay, duration, showImmediately, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.wordUnit, animatedStyle]}>
      <ArabicText
        size={arabicSize}
        color={colors.primaryDark}
        style={arabicStyle}
      >
        {word.arabic}
      </ArabicText>
      <Text style={[styles.transliteration, { color: colors.textMuted }]}>
        {word.transliteration}
      </Text>
      {word.meaning !== undefined && (
        <Text style={[styles.meaning, { color: colors.textSoft }]}>
          {word.meaning}
        </Text>
      )}
    </Animated.View>
  );
}

// ── PhraseReveal ──

export function PhraseReveal({
  words,
  wordDuration = 700,
  staggerDelay = 350,
  onComplete,
  layout = "vertical",
  arabicSize = "large",
  arabicStyle,
  accessibilityLabel,
}: PhraseRevealProps) {
  const reduceMotion = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skippedRef = useRef(false);

  // Calculate total reveal time
  const totalRevealTime =
    words.length > 0
      ? (words.length - 1) * staggerDelay + wordDuration
      : 0;

  // Schedule onComplete callback after all words revealed
  useEffect(() => {
    if (!onComplete) return;

    if (reduceMotion) {
      // Show immediately, fire onComplete after a brief beat
      timerRef.current = setTimeout(onComplete, 100);
    } else {
      timerRef.current = setTimeout(onComplete, totalRevealTime);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onComplete, totalRevealTime, reduceMotion]);

  const handleSkip = useCallback(() => {
    if (skippedRef.current) return;
    skippedRef.current = true;

    // Clear pending timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Fire completion immediately
    if (onComplete) onComplete();
  }, [onComplete]);

  const isHorizontal = layout === "horizontal";

  return (
    <Pressable
      onPress={handleSkip}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to reveal all words"
      accessibilityRole="button"
    >
      <View
        style={[
          styles.container,
          isHorizontal && styles.containerHorizontal,
          { minHeight: arabicSize === "display" ? 160 : 80 },
        ]}
      >
        {words.map((word, index) => (
          <RevealWord
            key={`${index}-${word.arabic}`}
            word={word}
            delay={index * staggerDelay}
            duration={wordDuration}
            arabicSize={arabicSize}
            arabicStyle={arabicStyle}
            showImmediately={!!reduceMotion}
          />
        ))}
      </View>
    </Pressable>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.lg,
  },
  containerHorizontal: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    writingDirection: "rtl",
    justifyContent: "center",
    gap: spacing.xl,
  },
  wordUnit: {
    alignItems: "center",
    flexShrink: 0,
  },
  transliteration: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  meaning: {
    fontFamily: fontFamilies.headingItalic,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
});
