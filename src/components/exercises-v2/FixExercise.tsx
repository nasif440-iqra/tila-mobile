import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ArabicText } from "@/src/design/components/ArabicText";
import { QuizOption } from "@/src/design/components/QuizOption";
import { useColors } from "@/src/design/theme";
import { typography, spacing, radii, borderWidths } from "@/src/design/tokens";
import type { ExerciseItem, FixSegment } from "@/src/types/exercise";

interface Props {
  item: ExerciseItem;
  onAnswer: (correct: boolean, answerId: string) => void;
}

export function FixExercise({ item, onAnswer }: Props) {
  const colors = useColors();
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  const segments = item.fixSegments ?? [];
  const correctLocation = item.correctAnswer.kind === "fix" ? item.correctAnswer.location : "";
  const correctReplacement = item.correctAnswer.kind === "fix" ? item.correctAnswer.replacement : "";

  // Step 1: user taps a segment to identify the error location
  function handleSegmentTap(segment: FixSegment) {
    const locationCorrect = segment.segmentId === correctLocation;
    if (!locationCorrect) {
      // Wrong segment selected — answer incorrect
      onAnswer(false, segment.segmentId);
      return;
    }
    setSelectedSegmentId(segment.segmentId);
  }

  // Step 2: user picks the correction from options
  function handleCorrectionChoice(optionId: string, isCorrect: boolean) {
    onAnswer(isCorrect, optionId);
  }

  if (selectedSegmentId !== null) {
    return (
      <View style={styles.container}>
        <Text style={[styles.instruction, { color: colors.textSoft }]}>
          Choose the correct replacement:
        </Text>
        <ArabicText size="large" style={styles.arabicPrompt}>
          {item.prompt.arabicDisplay}
        </ArabicText>
        <View style={styles.options}>
          {(item.options ?? []).map((option) => (
            <QuizOption
              key={option.id}
              label={option.displayArabic ?? option.displayText ?? ""}
              isArabic={Boolean(option.displayArabic)}
              onPress={() => handleCorrectionChoice(option.id, option.isCorrect)}
              style={styles.option}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.instruction, { color: colors.textSoft }]}>
        {item.prompt.text ?? "Tap the error in the text below:"}
      </Text>
      <View style={styles.segmentRow}>
        {segments.map((segment) => (
          <Pressable
            key={segment.segmentId}
            onPress={() => handleSegmentTap(segment)}
            style={[
              styles.segment,
              {
                backgroundColor: segment.isErrorLocation ? colors.accentLight : colors.bgCard,
                borderColor: colors.border,
                borderWidth: borderWidths.normal,
              },
            ]}
            accessibilityRole="button"
          >
            <ArabicText size="body">{segment.displayText}</ArabicText>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.hint, { color: colors.textMuted }]}>
        Tap the part that needs fixing
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
  },
  instruction: {
    ...typography.bodyLarge,
    textAlign: "center",
  },
  arabicPrompt: {
    textAlign: "center",
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
  },
  segment: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 52,
    minHeight: 52,
  },
  hint: {
    ...typography.body,
    textAlign: "center",
  },
  options: {
    width: "100%",
    gap: spacing.md,
  },
  option: {
    width: "100%",
  },
});
