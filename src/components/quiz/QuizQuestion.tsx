import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useColors } from "../../design/theme";
import { typography, spacing, radii } from "../../design/tokens";
import { QuizOption, ArabicText, HearButton } from "../../design/components";

// ── Types ──

interface QuizQuestionProps {
  question: any;
  selectedId: number | null;
  answered: boolean;
  isCorrect: boolean;
  onSelect: (optionId: number) => void;
  onPlayAudio: () => Promise<void>;
}

// ── Component ──

export function QuizQuestion({
  question,
  selectedId,
  answered,
  isCorrect,
  onSelect,
  onPlayAudio,
}: QuizQuestionProps) {
  const colors = useColors();

  // Question type detection
  const isAudioQuestion = question.hasAudio;
  const isLetterToSound = question.type === "letter_to_sound";
  const isLetterToName =
    question.type === "letter_to_name" && !question.hasAudio;
  const isVisualQuestion =
    !isAudioQuestion && !isLetterToSound && !isLetterToName;

  // Option display type
  const isArabicOption =
    question.optionMode !== "sound" && question.type !== "letter_to_name";

  return (
    <View style={styles.questionArea}>
      {/* Audio question: show hear button + prompt */}
      {isAudioQuestion && !isLetterToSound && (
        <View style={styles.promptCenter}>
          <HearButton onPlay={onPlayAudio} size={72} />
          <Text
            style={[
              styles.promptText,
              { color: colors.text, marginTop: spacing.lg },
            ]}
          >
            {question.prompt}
          </Text>
          <Pressable onPress={onPlayAudio} style={styles.replayButton}>
            <Text style={[styles.replayText, { color: colors.primary }]}>
              Replay
            </Text>
          </Pressable>
        </View>
      )}

      {/* Letter to sound: show large Arabic letter + hear button */}
      {isLetterToSound && (
        <View style={styles.promptCenter}>
          <ArabicText size="display" color={colors.text}>
            {question.prompt}
          </ArabicText>
          {question.promptSubtext && (
            <Text
              style={[styles.promptSubtext, { color: colors.textSoft }]}
            >
              {question.promptSubtext}
            </Text>
          )}
          <View style={{ marginTop: spacing.sm }}>
            <HearButton
              onPlay={onPlayAudio}
              size={44}
              accessibilityLabel="Hear this letter"
            />
          </View>
        </View>
      )}

      {/* Letter to name: show large Arabic letter + prompt */}
      {isLetterToName && (
        <View style={styles.promptCenter}>
          <ArabicText size="display" color={colors.text}>
            {question.prompt}
          </ArabicText>
          {question.promptSubtext && (
            <Text
              style={[styles.promptSubtext, { color: colors.textSoft }]}
            >
              {question.promptSubtext}
            </Text>
          )}
        </View>
      )}

      {/* Visual / default question: show prompt text */}
      {isVisualQuestion && (
        <View style={styles.promptCenter}>
          <Text
            style={[styles.promptText, { color: colors.text }]}
          >
            {question.prompt}
          </Text>
        </View>
      )}

      {/* Answer options -- 2x2 grid */}
      <View style={styles.optionsGrid}>
        {question.options.map((opt: any) => {
          let optionState: "default" | "correct" | "wrong" | "dimmed" =
            "default";
          if (answered) {
            if (opt.id === selectedId && isCorrect) {
              optionState = "correct";
            } else if (opt.id === selectedId && !isCorrect) {
              optionState = "wrong";
            } else if (opt.isCorrect && !isCorrect) {
              // Reveal the correct answer when user picked wrong
              optionState = "correct";
            } else {
              optionState = "dimmed";
            }
          }

          return (
            <QuizOption
              key={opt.id}
              label={opt.label}
              isArabic={isArabicOption}
              onPress={() => onSelect(opt.id)}
              disabled={answered}
              state={optionState}
              style={styles.optionCell}
            />
          );
        })}
      </View>

      {/* Correct feedback message */}
      {answered && isCorrect && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[
            styles.correctFeedback,
            {
              backgroundColor: colors.primarySoft,
              borderColor: colors.primary,
            },
          ]}
        >
          <Text style={[styles.correctFeedbackText, { color: colors.primary }]}>
            {"\u2713"} Correct!
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  questionArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  promptCenter: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  promptText: {
    ...typography.bodyLarge,
    fontWeight: "700",
    textAlign: "center",
  },
  promptSubtext: {
    ...typography.body,
    fontWeight: "600",
    marginTop: spacing.sm,
    textAlign: "center",
  },
  replayButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  replayText: {
    ...typography.bodySmall,
    fontWeight: "600",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.md,
    width: "100%",
    maxWidth: 340,
  },
  optionCell: {
    width: "47%",
  },
  correctFeedback: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.full,
    borderWidth: 1.5,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  correctFeedbackText: {
    ...typography.bodySmall,
    fontWeight: "700",
  },
});
