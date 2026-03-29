import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { SlideInDown } from "react-native-reanimated";
import { useColors } from "../../design/theme";
import { typography, spacing, radii, shadows } from "../../design/tokens";
import { ArabicText, Button, HearButton } from "../../design/components";
import { WRONG_ENCOURAGEMENT, pickCopy } from "../../engine/engagement";

// ── Types ──

interface WrongAnswerPanelProps {
  explanation: string | null;
  correctLetter: { letter: string; name: string } | null;
  chosenLetter: { letter: string; name: string } | null;
  isSoundQuestion: boolean;
  onPlayCorrect: () => void | Promise<void>;
  onContinue: () => void;
}

// ── Component ──

export function WrongAnswerPanel({
  explanation,
  correctLetter,
  chosenLetter,
  isSoundQuestion,
  onPlayCorrect,
  onContinue,
}: WrongAnswerPanelProps) {
  const colors = useColors();

  const encouragement = useMemo(
    () => (pickCopy as (pool: string[]) => string)(WRONG_ENCOURAGEMENT as unknown as string[]),
    []
  );

  const explanationText = explanation
    ? `${encouragement} ${explanation}`
    : correctLetter
      ? `${encouragement} The correct answer is ${correctLetter.name} (${correctLetter.letter})`
      : "Not quite -- try again next time!";

  return (
    <Animated.View
      entering={SlideInDown.springify().stiffness(300).damping(25)}
      style={[
        styles.wrongPanel,
        { backgroundColor: colors.dangerLight },
      ]}
    >
      {/* Explanation */}
      <View style={styles.wrongExplanationRow}>
        <Text style={[styles.wrongIcon, { color: colors.danger }]}>
          {"\u2717"}
        </Text>
        <Text
          style={[styles.wrongExplanation, { color: colors.dangerDark }]}
        >
          {explanationText}
        </Text>
      </View>

      {/* Visual comparison: chosen vs correct */}
      {chosenLetter && correctLetter && !isSoundQuestion && (
        <View style={styles.compareRow}>
          <View style={styles.compareItem}>
            <ArabicText size="large" color={colors.danger}>
              {chosenLetter.letter}
            </ArabicText>
            <Text style={[styles.compareName, { color: colors.dangerDark }]}>
              {chosenLetter.name}
            </Text>
          </View>
          <Text style={[styles.compareArrow, { color: colors.textMuted }]}>
            {"\u2192"}
          </Text>
          <View style={styles.compareItem}>
            <ArabicText size="large" color={colors.primary}>
              {correctLetter.letter}
            </ArabicText>
            <Text style={[styles.compareName, { color: colors.primary }]}>
              {correctLetter.name}
            </Text>
          </View>
        </View>
      )}

      {/* Hear button for sound questions */}
      {isSoundQuestion && (
        <View style={styles.hearRow}>
          <HearButton
            onPlay={onPlayCorrect}
            size={40}
            accessibilityLabel="Hear correct answer"
          />
          <Text style={[styles.hearLabel, { color: colors.dangerDark }]}>
            Hear correct
          </Text>
        </View>
      )}

      {/* Continue button */}
      <Button
        title="Got It"
        onPress={onContinue}
        variant="primary"
      />
    </Animated.View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  wrongPanel: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  wrongExplanationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  wrongIcon: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 1,
  },
  wrongExplanation: {
    ...typography.bodySmall,
    fontWeight: "600",
    lineHeight: 20,
    flex: 1,
  },
  compareRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xl,
    paddingVertical: spacing.sm,
  },
  compareItem: {
    alignItems: "center",
  },
  compareName: {
    ...typography.caption,
    fontWeight: "700",
  },
  compareArrow: {
    ...typography.body,
  },
  hearRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  hearLabel: {
    ...typography.bodySmall,
    fontWeight: "600",
  },
});
