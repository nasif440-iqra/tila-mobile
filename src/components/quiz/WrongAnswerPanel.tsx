import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useColors } from "../../design/theme";
import { typography, spacing, fontFamilies } from "../../design/tokens";
import { ArabicText, Button, HearButton } from "../../design/components";
import { WRONG_ENCOURAGEMENT, pickCopy } from "../../engine/engagement";

// ── Types ──

interface WrongAnswerPanelProps {
  explanation: string | null;
  correctLetter: { letter: string; name: string } | null;
  chosenLetter: { letter: string; name: string } | null;
  isSoundQuestion: boolean;
  onPlayCorrect: () => void | Promise<void>;
  onPlayChosen?: () => void | Promise<void>;
  onContinue: () => void;
}

// ── Component ──

export function WrongAnswerPanel({
  explanation,
  correctLetter,
  chosenLetter,
  isSoundQuestion,
  onPlayCorrect,
  onPlayChosen,
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
      : "Not quite \u2014 try again next time!";

  return (
    <Animated.View
      entering={FadeInUp.duration(350)}
      style={[
        styles.panel,
        { backgroundColor: colors.accentLight },
      ]}
    >
      {/* Explanation row */}
      <View style={styles.explanationRow}>
        <Text style={[styles.explanationText, { color: colors.brown }]}>
          {explanationText}
        </Text>
      </View>

      {/* Visual comparison: chosen (de-emphasized) → correct (emphasized) */}
      {chosenLetter && correctLetter && !isSoundQuestion && (
        <View style={styles.compareRow}>
          {/* Chosen — visually de-emphasized */}
          <View style={[styles.compareItem, { opacity: 0.5 }]}>
            <ArabicText size="large" color={colors.textMuted} style={{ fontSize: 32, lineHeight: 44 }}>
              {chosenLetter.letter}
            </ArabicText>
            <Text style={[styles.compareName, { color: colors.textMuted }]}>
              {chosenLetter.name}
            </Text>
          </View>

          <Text style={[styles.compareArrow, { color: colors.textMuted }]}>
            {"\u2192"}
          </Text>

          {/* Correct — visually emphasized */}
          <View style={styles.compareItem}>
            <ArabicText size="large" color={colors.primary} style={{ fontSize: 32, lineHeight: 44 }}>
              {correctLetter.letter}
            </ArabicText>
            <Text style={[styles.compareName, { color: colors.primary }]}>
              {correctLetter.name}
            </Text>
          </View>
        </View>
      )}

      {/* Audio buttons for sound questions */}
      {isSoundQuestion && (
        <View style={styles.hearRow}>
          <View style={styles.hearBtn}>
            <HearButton
              onPlay={onPlayCorrect}
              size={36}
              accessibilityLabel="Hear correct answer"
            />
            <Text style={[styles.hearLabel, { color: colors.primary }]}>
              Hear correct
            </Text>
          </View>
          {/* "Hear your pick" — only when chosen differs from correct */}
          {onPlayChosen && chosenLetter && correctLetter && chosenLetter.name !== correctLetter.name && (
            <View style={styles.hearBtn}>
              <HearButton
                onPlay={onPlayChosen}
                size={36}
                accessibilityLabel="Hear your pick"
              />
              <Text style={[styles.hearLabel, { color: colors.textMuted }]}>
                Hear your pick
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Continue CTA */}
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
  panel: {
    borderRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  explanationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  explanationText: {
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
    fontFamily: fontFamilies.bodySemiBold,
    marginTop: 2,
  },
  compareArrow: {
    ...typography.body,
  },
  hearRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xxl,
  },
  hearBtn: {
    alignItems: "center",
    gap: spacing.xs,
  },
  hearLabel: {
    fontSize: 11,
    fontFamily: fontFamilies.bodySemiBold,
  },
});
