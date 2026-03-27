import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutUp,
} from "react-native-reanimated";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { useColors } from "../design/theme";
import { typography, spacing, radii } from "../design/tokens";
import { QuizOption, ArabicText, Button, HearButton } from "../design/components";
import { getSFXAsset, getLetterAsset } from "../audio/player";
import { getLetter } from "../data/letters";
import useLessonQuiz, { computeQuizProgress } from "../hooks/useLessonQuiz";

// ── Types ──

interface LessonQuizProps {
  lesson: any;
  completedLessonIds: number[];
  mastery: any;
  onComplete: (results: { correct: number; total: number; questions: any[] }) => void;
}

// ── Streak thresholds ──

const STREAK_MILESTONES = [3, 5, 7] as const;

function getStreakMessage(streak: number): string {
  if (streak >= 7) return "Unstoppable! \uD83D\uDD25";
  if (streak >= 5) return "On fire! \u2B50";
  return "Nice streak! \u2728";
}

// ── Component ──

export function LessonQuiz({
  lesson,
  completedLessonIds,
  mastery,
  onComplete,
}: LessonQuizProps) {
  const colors = useColors();

  // Quiz state from hook
  const {
    currentQuestion,
    questionIndex,
    totalQuestions,
    streak,
    showMidCelebrate,
    dismissMidCelebrate,
    handleAnswer,
    isComplete,
    results,
  } = useLessonQuiz(lesson, completedLessonIds, mastery);

  // Local UI state
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [bannerStreak, setBannerStreak] = useState<number | null>(null);
  const prevStreakRef = useRef(0);

  // Progress bar animation
  const originalQCount = useRef(totalQuestions);
  useEffect(() => {
    if (totalQuestions > 0 && originalQCount.current === 0) {
      originalQCount.current = totalQuestions;
    }
  }, [totalQuestions]);

  const progressPct = computeQuizProgress(
    questionIndex,
    totalQuestions,
    originalQCount.current
  );
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withSpring(progressPct, {
      stiffness: 120,
      damping: 20,
    });
  }, [progressPct, progressWidth]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // Audio players for SFX
  const correctSFX = useAudioPlayer(getSFXAsset("correct"));
  const wrongSFX = useAudioPlayer(getSFXAsset("wrong"));

  // Determine audio type for the current question's letter
  const isSoundQuestion =
    currentQuestion?.type === "audio_to_letter" ||
    currentQuestion?.type === "letter_to_sound" ||
    currentQuestion?.type === "contrast_audio";

  const audioType: "sound" | "name" = isSoundQuestion ? "sound" : "name";

  // Audio player for target letter (for audio-type questions)
  const targetAudioSource =
    currentQuestion?.hasAudio && currentQuestion?.targetId
      ? getLetterAsset(currentQuestion.targetId, audioType)
      : null;
  const targetPlayer = useAudioPlayer(targetAudioSource);

  const playTargetAudio = useCallback(async () => {
    if (targetPlayer) {
      await targetPlayer.seekTo(0);
      targetPlayer.play();
    }
  }, [targetPlayer]);

  // Streak banner detection
  useEffect(() => {
    if (
      streak > prevStreakRef.current &&
      STREAK_MILESTONES.includes(streak as 3 | 5 | 7)
    ) {
      setBannerStreak(streak);
      const timer = setTimeout(() => setBannerStreak(null), 1500);
      return () => clearTimeout(timer);
    }
    prevStreakRef.current = streak;
  }, [streak]);

  // Notify parent when quiz completes
  useEffect(() => {
    if (isComplete) {
      onComplete(results);
    }
  }, [isComplete, results, onComplete]);

  // Reset selection state when question changes
  useEffect(() => {
    setSelectedId(null);
    setAnswered(false);
    setIsCorrect(false);
  }, [questionIndex]);

  // Handle option press
  const handleSelect = useCallback(
    (optionId: number) => {
      if (answered || !currentQuestion) return;

      setSelectedId(optionId);
      setAnswered(true);

      const correct = optionId === currentQuestion.correctId;
      setIsCorrect(correct);

      if (correct) {
        correctSFX.seekTo(0);
        correctSFX.play();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Auto-advance after a brief delay
        setTimeout(() => {
          const opt = currentQuestion.options.find(
            (o: any) => o.id === optionId
          );
          handleAnswer(opt, true);
        }, 800);
      } else {
        wrongSFX.seekTo(0);
        wrongSFX.play();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [answered, currentQuestion, correctSFX, wrongSFX, handleAnswer]
  );

  // Handle "Got it" press on wrong answer panel
  const handleContinueAfterWrong = useCallback(() => {
    if (!currentQuestion) return;
    const opt = currentQuestion.options.find(
      (o: any) => o.id === selectedId
    );
    handleAnswer(opt, false);
  }, [currentQuestion, selectedId, handleAnswer]);

  // Loading state
  if (!currentQuestion) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={[styles.loadingText, { color: colors.textSoft }]}>
          Loading question...
        </Text>
      </View>
    );
  }

  // Resolve correct letter info for wrong-answer panel
  const correctLetter = currentQuestion.targetId
    ? getLetter(currentQuestion.targetId)
    : null;
  const chosenLetter =
    selectedId && selectedId !== currentQuestion.targetId
      ? getLetter(selectedId)
      : null;

  // Determine question display type
  const isAudioQuestion = currentQuestion.hasAudio;
  const isLetterToSound = currentQuestion.type === "letter_to_sound";
  const isLetterToName =
    currentQuestion.type === "letter_to_name" && !currentQuestion.hasAudio;
  const isVisualQuestion =
    !isAudioQuestion && !isLetterToSound && !isLetterToName;

  // Determine option display type
  const isArabicOption =
    currentQuestion.optionMode !== "sound" &&
    currentQuestion.type !== "letter_to_name";

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Streak banner overlay */}
      {bannerStreak !== null && (
        <Animated.View
          entering={SlideInDown.springify().stiffness(300).damping(20)}
          exiting={SlideOutUp.duration(300)}
          style={[
            styles.streakBanner,
            { backgroundColor: colors.accentLight, borderColor: colors.accent },
          ]}
        >
          <Text
            style={[
              styles.streakText,
              { color: colors.accent },
            ]}
          >
            {bannerStreak} in a row! {getStreakMessage(bannerStreak)}
          </Text>
        </Animated.View>
      )}

      {/* Mid-celebration overlay */}
      {showMidCelebrate && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={[styles.midCelebOverlay, { backgroundColor: `${colors.bg}E6` }]}
        >
          <Pressable onPress={dismissMidCelebrate} style={styles.midCelebContent}>
            <Text style={[styles.midCelebEmoji]}>
              {"\uD83C\uDF1F"}
            </Text>
            <Text style={[styles.midCelebTitle, { color: colors.primary }]}>
              Keep going!
            </Text>
            <Text style={[styles.midCelebSubtitle, { color: colors.textSoft }]}>
              You're halfway there
            </Text>
            <Text style={[styles.midCelebTap, { color: colors.textMuted }]}>
              Tap to continue
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <View
          style={[styles.progressTrack, { backgroundColor: colors.border }]}
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.round(progressPct),
          }}
        >
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary },
              progressBarStyle,
            ]}
          />
        </View>
        <Text style={[styles.progressCounter, { color: colors.textSoft }]}>
          {Math.min(questionIndex + 1, originalQCount.current)}/
          {originalQCount.current}
        </Text>
      </View>

      {/* Recycled question hint */}
      {currentQuestion._recycled && (
        <Text style={[styles.recycledHint, { color: colors.textMuted }]}>
          Review -- missed questions come back once
        </Text>
      )}

      {/* Question content area */}
      <View style={styles.questionArea}>
        {/* Audio question: show hear button + prompt */}
        {isAudioQuestion && !isLetterToSound && (
          <View style={styles.promptCenter}>
            <HearButton onPlay={playTargetAudio} size={72} />
            <Text
              style={[
                styles.promptText,
                { color: colors.text, marginTop: spacing.lg },
              ]}
            >
              {currentQuestion.prompt}
            </Text>
            <Pressable onPress={playTargetAudio} style={styles.replayButton}>
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
              {currentQuestion.prompt}
            </ArabicText>
            {currentQuestion.promptSubtext && (
              <Text
                style={[styles.promptSubtext, { color: colors.textSoft }]}
              >
                {currentQuestion.promptSubtext}
              </Text>
            )}
            <View style={{ marginTop: spacing.sm }}>
              <HearButton
                onPlay={playTargetAudio}
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
              {currentQuestion.prompt}
            </ArabicText>
            {currentQuestion.promptSubtext && (
              <Text
                style={[styles.promptSubtext, { color: colors.textSoft }]}
              >
                {currentQuestion.promptSubtext}
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
              {currentQuestion.prompt}
            </Text>
          </View>
        )}

        {/* Answer options -- 2x2 grid */}
        <View style={styles.optionsGrid}>
          {currentQuestion.options.map((opt: any) => {
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
                onPress={() => handleSelect(opt.id)}
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

      {/* Wrong answer panel */}
      {answered && !isCorrect && (
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
              {currentQuestion.explanation ??
                (correctLetter
                  ? `The correct answer is ${correctLetter.name} (${correctLetter.letter})`
                  : "Not quite -- try again next time!")}
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

          {/* Hear buttons for sound questions */}
          {isSoundQuestion && (
            <View style={styles.hearRow}>
              <HearButton
                onPlay={playTargetAudio}
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
            onPress={handleContinueAfterWrong}
            variant="primary"
          />
        </Animated.View>
      )}
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    justifyContent: "space-between",
  },
  loadingText: {
    ...typography.body,
    textAlign: "center",
  },
  // Progress
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressCounter: {
    ...typography.caption,
    fontWeight: "700",
    minWidth: 40,
    textAlign: "right",
  },
  recycledHint: {
    ...typography.caption,
    textAlign: "center",
    fontStyle: "italic",
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  // Question area
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
  // Options grid
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
  // Correct feedback
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
  // Wrong answer panel
  wrongPanel: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
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
  // Streak banner
  streakBanner: {
    position: "absolute",
    top: spacing.xxxl,
    left: spacing.xl,
    right: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 2,
    alignItems: "center",
    zIndex: 100,
  },
  streakText: {
    ...typography.bodyLarge,
    fontWeight: "700",
  },
  // Mid-celebration
  midCelebOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
  },
  midCelebContent: {
    alignItems: "center",
    padding: spacing.xxl,
  },
  midCelebEmoji: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
  midCelebTitle: {
    ...typography.heading1,
    marginBottom: spacing.sm,
  },
  midCelebSubtitle: {
    ...typography.body,
    marginBottom: spacing.xl,
  },
  midCelebTap: {
    ...typography.caption,
  },
});
