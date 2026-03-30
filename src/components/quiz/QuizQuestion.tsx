import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "../../design/theme";
import { typography, spacing } from "../../design/tokens";
import { QuizOption, ArabicText, HearButton } from "../../design/components";
import { WarmGlow } from "../onboarding/WarmGlow";

const OPTIONS_MAX_WIDTH = 360;

// ── Stagger spring for option entrances ──
const OPTION_SPRING = { stiffness: 300, damping: 28, mass: 1 };
const STAGGER_MS = 60;

// ── Types ──

interface QuizQuestionProps {
  question: any;
  selectedId: number | null;
  answered: boolean;
  isCorrect: boolean;
  onSelect: (optionId: number) => void;
  onPlayAudio: () => void | Promise<void>;
}

// ── Staggered option wrapper ──

function StaggeredOption({
  children,
  index,
  questionKey,
  style,
}: {
  children: React.ReactNode;
  index: number;
  questionKey: number;
  style?: any;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);
  const entranceRan = useRef<number>(-1);

  useEffect(() => {
    // Only run entrance on question change, not on answer-state changes
    if (entranceRan.current === questionKey) return;
    entranceRan.current = questionKey;

    opacity.value = 0;
    translateY.value = 14;
    opacity.value = withDelay(index * STAGGER_MS, withTiming(1, { duration: 200 }));
    translateY.value = withDelay(index * STAGGER_MS, withSpring(0, OPTION_SPRING));
  }, [questionKey]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

// ── Letter circle prompt ──

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
              backgroundColor: "#F2F5F3",
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
  const isLetterToName = question.type === "letter_to_name" && !question.hasAudio;
  const isVisualQuestion = !isAudioQuestion && !isLetterToSound && !isLetterToName;

  // Option display modes
  const isSoundOption = question.optionMode === "sound";
  const isArabicOption = !isSoundOption && question.type !== "letter_to_name";

  // Adaptive layout based on option count
  const optCount = question.options.length;
  const isCompact = optCount <= 2;   // vertical stack
  const isTriple = optCount === 3;   // wrapped centered

  // Stable key for entrance animations
  const questionKey = question._qIndex ?? question.targetId ?? 0;

  return (
    <View style={styles.questionArea}>
      {/* ── Prompt area ── */}

      {isAudioQuestion && !isLetterToSound && (
        <View style={styles.promptCenter}>
          <HearButton onPlay={onPlayAudio} size={72} />
          <Text
            style={[styles.promptText, { color: colors.brown, marginTop: spacing.lg }]}
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

      {isLetterToSound && (
        <LetterPrompt prompt={question.prompt} subtext={question.promptSubtext}>
          <View style={{ marginTop: spacing.sm }}>
            <HearButton onPlay={onPlayAudio} size={44} accessibilityLabel="Hear this letter" />
          </View>
        </LetterPrompt>
      )}

      {isLetterToName && (
        <LetterPrompt prompt={question.prompt} subtext={question.promptSubtext} />
      )}

      {isVisualQuestion && (
        <View style={styles.promptCenter}>
          <Text style={[styles.promptText, { color: colors.brown }]}>
            {question.prompt}
          </Text>
        </View>
      )}

      {/* ── Options grid — adaptive layout ── */}
      <View
        style={[
          styles.optionsGrid,
          isCompact && styles.optionsCompact,
          isTriple && styles.optionsTriple,
        ]}
      >
        {question.options.map((opt: any, idx: number) => {
          // ── 5-state mapping ──
          let optionState: "default" | "selectedCorrect" | "selectedWrong" | "revealedCorrect" | "dimmed" = "default";
          if (answered) {
            if (opt.id === selectedId && isCorrect) {
              optionState = "selectedCorrect";
            } else if (opt.id === selectedId && !isCorrect) {
              optionState = "selectedWrong";
            } else if (opt.isCorrect && !isCorrect) {
              optionState = "revealedCorrect"; // NOT selectedCorrect — no celebration
            } else {
              optionState = "dimmed";
            }
          }

          return (
            <StaggeredOption
              key={opt.id}
              index={idx}
              questionKey={questionKey}
              style={isCompact ? styles.optionCompact : isTriple ? styles.optionTriple : styles.optionGrid}
            >
              <QuizOption
                label={opt.label}
                sublabel={opt.sublabel}
                isArabic={isArabicOption}
                isSound={isSoundOption}
                onPress={() => onSelect(opt.id)}
                disabled={answered}
                state={optionState}
              />
            </StaggeredOption>
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  // ── Options layouts ──

  // Default: 2x2 grid
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 14,
    width: "100%",
    maxWidth: OPTIONS_MAX_WIDTH,
  },
  optionGrid: {
    width: "47%",
  },

  // Compact: ≤2 options, vertical stack
  optionsCompact: {
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    gap: 16,
  },
  optionCompact: {
    width: "100%",
  },

  // Triple: 3 options, wrapped centered
  optionsTriple: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 14,
  },
  optionTriple: {
    width: "47%",
  },
});
