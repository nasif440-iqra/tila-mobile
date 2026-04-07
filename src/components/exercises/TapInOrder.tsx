import { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, I18nManager } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { hapticSuccess, hapticError } from "../../design/haptics";
import { playCorrect, playWrong } from "../../audio/player";
import { useColors } from "../../design/theme";
import { typography, spacing, radii } from "../../design/tokens";
import { ArabicText } from "../../design/components";

// ── Types ──

interface TapLetter {
  id: number;
  arabic: string;
  sound: string;
}

interface TapInOrderExerciseData {
  type: "tap_in_order";
  letters: TapLetter[];
}

interface ExerciseResult {
  correct: boolean;
  targetId?: number;
}

interface Props {
  exercise: TapInOrderExerciseData;
  onComplete: (result: ExerciseResult) => void;
}

// ── Individual letter button with its own shake animation ──

function LetterButton({
  letter,
  index,
  isTapped,
  isNext,
  done,
  onTap,
  colors,
}: {
  letter: TapLetter;
  index: number;
  isTapped: boolean;
  isNext: boolean;
  done: boolean;
  onTap: (index: number) => void;
  colors: any;
}) {
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  function handlePress() {
    onTap(index);
  }

  // Expose shake method via parent callback
  function triggerShake() {
    translateX.value = withSequence(
      withTiming(-4, { duration: 50 }),
      withTiming(4, { duration: 50 }),
      withTiming(-4, { duration: 50 }),
      withTiming(4, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }

  // Store shake trigger on the component for parent access
  // We use a simpler approach: shake on wrong tap in handleTap
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        disabled={done || isTapped}
        accessibilityLabel={`${letter.arabic}, tap ${index + 1}`}
        style={[
          styles.letterBox,
          {
            borderColor: isTapped
              ? colors.primary
              : isNext
                ? colors.accent
                : colors.border,
            backgroundColor: isTapped ? colors.primary : colors.bgCard,
          },
          isNext && !done && { shadowColor: colors.accent, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
        ]}
      >
        <ArabicText size="body" color={isTapped ? colors.white : colors.text}>
          {letter.arabic}
        </ArabicText>
      </Pressable>
    </Animated.View>
  );
}

// ── Component ──

export function TapInOrder({ exercise, onComplete }: Props) {
  const colors = useColors();
  const { letters } = exercise;
  const [tappedCount, setTappedCount] = useState(0);
  const [done, setDone] = useState(false);

  // We manage shake per-letter via shared values
  const shakeValues = letters.map(() => useSharedValue(0));

  const handleTap = useCallback(
    (index: number) => {
      if (done || index < tappedCount) return;

      if (index === tappedCount) {
        // Correct tap
        hapticSuccess();
        const next = tappedCount + 1;
        setTappedCount(next);

        if (next === letters.length) {
          playCorrect();
          setDone(true);
          setTimeout(() => {
            onComplete({ correct: true, targetId: letters[0]?.id });
          }, 600);
        }
      } else {
        // Wrong tap - shake
        playWrong();
        hapticError();
        shakeValues[index].value = withSequence(
          withTiming(-4, { duration: 50 }),
          withTiming(4, { duration: 50 }),
          withTiming(-4, { duration: 50 }),
          withTiming(4, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
      }
    },
    [done, tappedCount, letters, onComplete, shakeValues]
  );

  const soundChain = letters.map((l) => l.sound).join("-");

  return (
    <View style={styles.container}>
      <Text style={[typography.body, styles.instruction, { color: colors.textSoft }]}>
        Tap the letters in reading order (right to left)
      </Text>

      {/* Letter boxes - RTL direction */}
      <View style={styles.lettersRow}>
        {letters.map((letter, index) => {
          const isTapped = index < tappedCount;
          const isNext = index === tappedCount;

          const shakeStyle = useAnimatedStyle(() => ({
            transform: [{ translateX: shakeValues[index].value }],
          }));

          return (
            <Animated.View key={letter.id} style={shakeStyle}>
              <Pressable
                onPress={() => handleTap(index)}
                disabled={done || isTapped}
                accessibilityLabel={`${letter.arabic}, tap ${index + 1} of ${letters.length}`}
                style={[
                  styles.letterBox,
                  {
                    borderColor: isTapped
                      ? colors.primary
                      : isNext
                        ? colors.accent
                        : colors.border,
                    backgroundColor: isTapped ? colors.primary : colors.bgCard,
                  },
                  isNext &&
                    !done && {
                      shadowColor: colors.accentGlow,
                      shadowOpacity: 0.5,
                      shadowRadius: 8,
                      elevation: 4,
                    },
                ]}
              >
                <ArabicText size="large" color={isTapped ? colors.white : colors.text}>
                  {letter.arabic}
                </ArabicText>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Progress indicators */}
      <View style={styles.indicatorRow}>
        {letters.map((letter, index) => {
          const isTapped = index < tappedCount;
          return (
            <View
              key={letter.id}
              style={[
                styles.indicator,
                {
                  backgroundColor: isTapped ? colors.primarySoft : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: isTapped ? colors.primary : colors.textMuted,
                    fontWeight: isTapped ? "600" : "400",
                  },
                ]}
              >
                {isTapped ? `${letter.sound} \u2713` : "?"}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Success message */}
      {done && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.successBanner, { backgroundColor: colors.primarySoft }]}
        >
          <Text style={[typography.body, { color: colors.primary, fontWeight: "600" }]}>
            {"\u2713"} You read that right to left: {soundChain}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  instruction: {
    textAlign: "center",
  },
  lettersRow: {
    flexDirection: "row-reverse", // RTL: index 0 on the right
    gap: spacing.md,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  letterBox: {
    width: 80,
    height: 80,
    borderRadius: radii.md,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  indicatorRow: {
    flexDirection: "row-reverse", // RTL
    gap: spacing.sm,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  indicator: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  successBanner: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
});
