import { useState, useEffect, useCallback } from "react";
import { StyleSheet, Pressable, Text, View } from "react-native";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useColors } from "../../design/theme";
import { typography, spacing, fontFamilies } from "../../design/tokens";
import { ArabicText } from "../../design/components";
import { WarmGlow } from "../onboarding/WarmGlow";
import { hapticMilestone, hapticTap } from "../../design/haptics";
import { springs, durations } from "../../design/animations";
import { LETTER_MASTERY_COPY, pickCopy } from "../../engine/engagement";

// ── Types ──

interface LetterMasteryCelebrationProps {
  masteredLetters: Array<{ letter: string; name: string }>;
  onDismiss: () => void;
}

// ── Component ──

export function LetterMasteryCelebration({
  masteredLetters,
  onDismiss,
}: LetterMasteryCelebrationProps) {
  const colors = useColors();
  const [dismissable, setDismissable] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Animation: scale content in with bouncy spring
  const contentScale = useSharedValue(0.9);

  useEffect(() => {
    // Haptic on mount
    hapticMilestone();

    // Animate content scale
    contentScale.value = withSpring(1, springs.bouncy);

    // Enable dismiss and show hint after 500ms
    const timer = setTimeout(() => {
      setDismissable(true);
      setShowHint(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [contentScale]);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
  }));

  const handleDismiss = useCallback(() => {
    if (!dismissable) return;
    hapticTap();
    onDismiss();
  }, [dismissable, onDismiss]);

  // Build display strings
  const letterNames = masteredLetters.map((l) => l.name);
  const namesDisplay =
    letterNames.length === 1
      ? letterNames[0]
      : letterNames.slice(0, -1).join(", ") + " and " + letterNames[letterNames.length - 1];

  // Pick Islamic mastery message with letter name(s) substituted
  const message = pickCopy(LETTER_MASTERY_COPY).replace("{letter}", namesDisplay);

  return (
    <Animated.View
      entering={FadeIn.duration(durations.normal)}
      style={[styles.overlay, { backgroundColor: `${colors.bg}E6` }]}
    >
      <Pressable onPress={handleDismiss} style={styles.pressable}>
        <Animated.View style={[styles.content, contentAnimatedStyle]}>
          {/* WarmGlow behind letter */}
          <View style={styles.glowContainer}>
            <WarmGlow size={180} opacity={0.2} />
          </View>

          {/* Arabic letter(s) */}
          <View style={styles.lettersRow}>
            {masteredLetters.map((l, i) => (
              <ArabicText
                key={i}
                style={{ ...styles.arabicLetter, color: colors.accent }}
              >
                {l.letter}
              </ArabicText>
            ))}
          </View>

          {/* Letter name(s) */}
          <Animated.Text
            entering={FadeIn.delay(300).duration(durations.slow)}
            style={[styles.letterName, { color: colors.primary }]}
          >
            {namesDisplay}
          </Animated.Text>

          {/* Islamic mastery message */}
          <Animated.Text
            entering={FadeIn.delay(300).duration(durations.slow)}
            style={[styles.message, { color: colors.textSoft }]}
          >
            {message}
          </Animated.Text>

          {/* Tap to continue hint */}
          {showHint && (
            <Animated.Text
              entering={FadeIn.duration(durations.normal)}
              style={[styles.hint, { color: colors.textMuted }]}
            >
              Tap to continue
            </Animated.Text>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
  },
  pressable: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  content: {
    alignItems: "center",
    padding: spacing.xxl,
  },
  glowContainer: {
    position: "absolute",
    top: -40,
    alignItems: "center",
    justifyContent: "center",
  },
  lettersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  arabicLetter: {
    fontFamily: fontFamilies.arabicRegular,
    fontSize: 72,
    lineHeight: 100,
  },
  letterName: {
    ...typography.heading2,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    textAlign: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  hint: {
    ...typography.caption,
  },
});
