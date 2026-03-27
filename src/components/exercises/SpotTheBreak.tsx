import { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  FadeInDown,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useColors } from "../../design/theme";
import { typography, spacing, radii } from "../../design/tokens";
import { ArabicText, Button } from "../../design/components";
import { getLetter } from "../../data/letters";

// ── Types ──

interface WordData {
  arabic: string;
  transliteration?: string;
}

interface SegmentData {
  arabic: string;
  isBreakAfter?: boolean;
}

interface SpotTheBreakExerciseData {
  type: "spot_the_break";
  word: WordData;
  segments: SegmentData[];
  breakerLetterId?: number;
  explanation?: string;
}

interface ExerciseResult {
  correct: boolean;
  targetId?: number;
}

interface Props {
  exercise: SpotTheBreakExerciseData;
  onComplete: (result: ExerciseResult) => void;
}

// ── Component ──

export function SpotTheBreak({ exercise, onComplete }: Props) {
  const colors = useColors();
  const { word, segments, breakerLetterId, explanation } = exercise;

  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const breakerLetter = breakerLetterId != null ? getLetter(breakerLetterId) : null;
  const breakerName = breakerLetter?.name ?? "";

  // Find the correct segment index
  const correctIndex = segments.findIndex((s) => s.isBreakAfter);

  // Shake values for each segment
  const shakeValues = segments.map(() => useSharedValue(0));

  const handleTap = useCallback(
    (index: number) => {
      if (done || selected !== null) return;

      setSelected(index);

      if (index === correctIndex) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setDone(true);
        setTimeout(() => {
          onComplete({ correct: true, targetId: breakerLetterId });
        }, 1200);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        shakeValues[index].value = withSequence(
          withTiming(-4, { duration: 50 }),
          withTiming(4, { duration: 50 }),
          withTiming(-4, { duration: 50 }),
          withTiming(4, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
      }
    },
    [done, selected, correctIndex, onComplete, breakerLetterId, shakeValues]
  );

  const handleGotIt = useCallback(() => {
    onComplete({ correct: false, targetId: breakerLetterId });
  }, [onComplete, breakerLetterId]);

  const isAnswered = selected !== null;
  const isCorrect = selected === correctIndex;

  return (
    <View style={styles.container}>
      <Text style={[typography.body, styles.instruction, { color: colors.textSoft }]}>
        Tap where the word breaks (where a letter doesn't connect forward)
      </Text>

      {/* Full word display */}
      <ArabicText size="display" color={colors.text}>
        {word.arabic}
      </ArabicText>

      {word.transliteration && (
        <Text style={[typography.bodySmall, { color: colors.textMuted, fontStyle: "italic" }]}>
          {word.transliteration}
        </Text>
      )}

      {/* Segment buttons in RTL */}
      <View style={styles.segmentsRow}>
        {segments.map((segment, index) => {
          const isTapped = selected === index;
          const isCorrectSegment = index === correctIndex;

          let borderColor = colors.border;
          let bgColor = colors.bgCard;

          if (isTapped && isCorrect) {
            borderColor = colors.primary;
            bgColor = colors.primarySoft;
          } else if (isTapped && !isCorrect) {
            borderColor = colors.danger;
            bgColor = colors.dangerLight;
          } else if (isAnswered && isCorrectSegment) {
            borderColor = colors.primary;
            bgColor = colors.primarySoft;
          }

          const shakeStyle = useAnimatedStyle(() => ({
            transform: [{ translateX: shakeValues[index].value }],
          }));

          return (
            <Animated.View key={index} style={shakeStyle}>
              <Pressable
                onPress={() => handleTap(index)}
                disabled={isAnswered}
                accessibilityLabel={`Segment ${index + 1}: ${segment.arabic}`}
                style={[
                  styles.segmentButton,
                  {
                    borderColor,
                    backgroundColor: bgColor,
                  },
                ]}
              >
                <ArabicText size="body" color={colors.text}>
                  {segment.arabic}
                </ArabicText>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Feedback panel */}
      {isAnswered && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[
            styles.feedbackPanel,
            {
              backgroundColor: isCorrect ? colors.primarySoft : colors.dangerLight,
            },
          ]}
        >
          {breakerName && (
            <Text
              style={[
                typography.body,
                {
                  color: isCorrect ? colors.primary : colors.danger,
                  fontWeight: "600",
                  textAlign: "center",
                },
              ]}
            >
              {isCorrect ? "Correct!" : "Not quite."} The breaker is{" "}
              {breakerLetter?.letter} ({breakerName})
            </Text>
          )}

          {explanation && (
            <Text
              style={[
                typography.bodySmall,
                {
                  color: isCorrect ? colors.primary : colors.danger,
                  textAlign: "center",
                  lineHeight: 20,
                },
              ]}
            >
              {explanation}
            </Text>
          )}

          {!isCorrect && (
            <Button title="Got it" onPress={handleGotIt} />
          )}
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
  segmentsRow: {
    flexDirection: "row-reverse", // RTL
    gap: spacing.md,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  segmentButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 2,
  },
  feedbackPanel: {
    width: "100%",
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: "center",
  },
});
