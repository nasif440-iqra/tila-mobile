import { useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { hapticSuccess, hapticError } from "../../design/haptics";
import { playCorrect, playWrong } from "../../audio/player";
import { useColors } from "../../design/theme";
import { typography, spacing, radii } from "../../design/tokens";
import { ArabicText, Button, QuizOption } from "../../design/components";
import { getLetter } from "../../data/letters";

// ── Types ──

interface ComprehensionOption {
  id: number;
  label: string;
  isCorrect?: boolean;
}

interface ComprehensionExerciseData {
  type: "comprehension";
  prompt: string;
  displayArabic?: string;
  options: ComprehensionOption[];
  targetId?: number;
}

interface ExerciseResult {
  correct: boolean;
  selectedOption?: ComprehensionOption;
  targetId?: number;
}

interface Props {
  exercise: ComprehensionExerciseData;
  onComplete: (result: ExerciseResult) => void;
}

// ── Helpers ──

function isArabicText(text: string): boolean {
  return /[\u0600-\u06FF\uFE70-\uFEFF]/.test(text);
}

// ── Component ──

export function ComprehensionExercise({ exercise, onComplete }: Props) {
  const colors = useColors();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { prompt, displayArabic, options = [], targetId } = exercise;

  // Use 2x2 grid when all options are Arabic glyphs (e.g. connected form positions)
  const allArabic = options.length > 0 && options.every((o) => isArabicText(o.label));
  const useGrid = allArabic && options.length >= 3;

  // Clean up timer on unmount handled by caller (exercises are unmounted on advance)

  const handleSelect = useCallback(
    (option: ComprehensionOption) => {
      if (answered) return;
      const correct = option.isCorrect === true;
      setSelectedId(option.id);
      setAnswered(true);
      setIsCorrect(correct);

      if (correct) {
        playCorrect();
        hapticSuccess();
        timerRef.current = setTimeout(
          () => onComplete({ correct: true, selectedOption: option, targetId }),
          850
        );
      } else {
        playWrong();
        hapticError();
        // Wait for "Got it" button press
      }
    },
    [answered, onComplete, targetId]
  );

  const handleGotIt = useCallback(() => {
    const option = options.find((o) => o.id === selectedId);
    onComplete({ correct: false, selectedOption: option, targetId });
  }, [options, selectedId, onComplete, targetId]);

  // Build wrong-answer explanation
  const wrongExplanation = (() => {
    if (!answered || isCorrect) return null;
    if (typeof selectedId !== "number" || typeof targetId !== "number") return null;
    const chosenLetter = getLetter(selectedId);
    const correctLetter = getLetter(targetId);
    if (!chosenLetter || !correctLetter) return null;
    const chosenPart = chosenLetter.visualRule
      ? `${chosenLetter.name} \u2014 ${chosenLetter.visualRule}`
      : chosenLetter.name;
    const correctPart = correctLetter.visualRule
      ? `${correctLetter.name} \u2014 ${correctLetter.visualRule}`
      : correctLetter.name;
    return `That's ${chosenPart}. The correct answer is ${correctPart}.`;
  })();

  function getOptionState(option: ComprehensionOption) {
    if (!answered) return "default" as const;
    if (option.id === selectedId && isCorrect) return "selectedCorrect" as const;
    if (option.id === selectedId && !isCorrect) return "selectedWrong" as const;
    if (option.isCorrect && !isCorrect) return "revealedCorrect" as const;
    return "dimmed" as const;
  }

  return (
    <View style={styles.container}>
      {displayArabic && (
        <ArabicText size="display" color={colors.primaryDark}>
          {displayArabic}
        </ArabicText>
      )}

      <Text style={[typography.bodyLarge, styles.prompt, { color: colors.text }]}>
        {prompt}
      </Text>

      <View style={[styles.optionsGrid, useGrid && styles.optionsGridArabic]}>
        {options.map((option, index) => {
          const optionIsArabic = isArabicText(option.label);
          return (
            <Animated.View
              key={option.id}
              entering={FadeInDown.delay(index * 70).springify()}
              style={[styles.optionWrapper, useGrid && styles.optionWrapperGrid]}
            >
              <QuizOption
                label={option.label}
                isArabic={optionIsArabic}
                onPress={() => handleSelect(option)}
                disabled={answered}
                state={getOptionState(option)}
              />
            </Animated.View>
          );
        })}
      </View>

      {/* Wrong answer feedback panel */}
      {answered && !isCorrect && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.feedbackPanel, { backgroundColor: colors.dangerLight }]}
        >
          <Text style={[typography.bodySmall, { color: colors.dangerDark, lineHeight: 20 }]}>
            {wrongExplanation || "Not quite \u2014 the correct answer is highlighted above."}
          </Text>
          <Button title="Got It" onPress={handleGotIt} />
        </Animated.View>
      )}
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  prompt: {
    textAlign: "center",
    fontWeight: "600",
  },
  optionsGrid: {
    width: "100%",
    gap: spacing.md,
  },
  optionsGridArabic: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  optionWrapper: {
    width: "100%",
  },
  optionWrapperGrid: {
    width: "47%",
  },
  feedbackPanel: {
    width: "100%",
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
