import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ArabicText } from "@/src/design/components/ArabicText";
import { QuizOption } from "@/src/design/components/QuizOption";
import { useColors } from "@/src/design/theme";
import { typography, spacing } from "@/src/design/tokens";
import type { ExerciseItem } from "@/src/types/exercise";

interface Props {
  item: ExerciseItem;
  onAnswer: (correct: boolean, answerId: string) => void;
}

export function ChooseExercise({ item, onAnswer }: Props) {
  const colors = useColors();
  const instruction = item.prompt.text ?? "Which one is correct?";

  return (
    <View style={styles.container}>
      <Text style={[styles.instruction, { color: colors.textSoft }]}>{instruction}</Text>
      <ArabicText size="display" style={styles.arabicPrompt}>
        {item.prompt.arabicDisplay}
      </ArabicText>
      <View style={styles.options}>
        {(item.options ?? []).map((option) => (
          <QuizOption
            key={option.id}
            label={option.displayArabic ?? option.displayText ?? ""}
            isArabic={Boolean(option.displayArabic)}
            onPress={() => onAnswer(option.isCorrect, option.id)}
            style={styles.option}
          />
        ))}
      </View>
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
  options: {
    width: "100%",
    gap: spacing.md,
  },
  option: {
    width: "100%",
  },
});
