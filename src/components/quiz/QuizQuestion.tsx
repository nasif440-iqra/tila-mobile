import { View, Text, StyleSheet, Pressable } from "react-native";
import { useColors } from "../../design/theme";
import { typography, spacing, radii } from "../../design/tokens";
import { QuizOption, ArabicText, HearButton } from "../../design/components";
import { WarmGlow } from "../onboarding/WarmGlow";

const OPTIONS_GRID_MAX_WIDTH = 400;

// ── Types ──

interface QuizQuestionProps {
  question: any;
  selectedId: number | null;
  answered: boolean;
  isCorrect: boolean;
  onSelect: (optionId: number) => void;
  onPlayAudio: () => void | Promise<void>;
}

// ── Letter circle prompt (shared between letter-to-sound and letter-to-name) ──

function LetterPrompt({
  prompt,
  subtext,
  children,
}: {
  prompt: string;
  subtext?: string;
  children?: React.ReactNode;
}) {
  const colors = useColors();

  return (
    <View style={styles.promptCenter}>
      {/* Glow + circle container */}
      <View style={styles.letterCircleWrapper}>
        <WarmGlow
          size={180}
          animated
          color="rgba(196,164,100,0.3)"
          pulseMin={0.1}
          pulseMax={0.3}
        />
        <View
          style={[
            styles.letterCircle,
            {
              backgroundColor: colors.primarySoft,
              borderColor: "rgba(255, 255, 255, 0.8)",
            },
          ]}
        >
          <ArabicText size="display" color={colors.primaryDark}>
            {prompt}
          </ArabicText>
        </View>
      </View>
      {subtext && (
        <Text style={[styles.promptSubtext, { color: colors.textSoft }]}>
          {subtext}
        </Text>
      )}
      {children}
    </View>
  );
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
              { color: colors.brown, marginTop: spacing.lg },
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

      {/* Letter to sound: show large Arabic letter in circle + hear button */}
      {isLetterToSound && (
        <LetterPrompt
          prompt={question.prompt}
          subtext={question.promptSubtext}
        >
          <View style={{ marginTop: spacing.sm }}>
            <HearButton
              onPlay={onPlayAudio}
              size={44}
              accessibilityLabel="Hear this letter"
            />
          </View>
        </LetterPrompt>
      )}

      {/* Letter to name: show large Arabic letter in circle + prompt */}
      {isLetterToName && (
        <LetterPrompt
          prompt={question.prompt}
          subtext={question.promptSubtext}
        />
      )}

      {/* Visual / default question: show prompt text */}
      {isVisualQuestion && (
        <View style={styles.promptCenter}>
          <Text
            style={[styles.promptText, { color: colors.brown }]}
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
    ...typography.heading2,
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
  letterCircleWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  letterCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.md,
    width: "100%",
    maxWidth: OPTIONS_GRID_MAX_WIDTH,
  },
  optionCell: {
    width: "47%",
  },
});
