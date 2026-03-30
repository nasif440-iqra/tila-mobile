import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../design/theme";
import { typography, spacing } from "../design/tokens";
import { WarmGradient, Button } from "../design/components";
import {
  playCorrect,
  playWrong,
  playLetterName,
  playLetterSound,
  playQuizStart,
} from "../audio/player";
import { getLetter } from "../data/letters";
import { getWrongExplanation, getContrastExplanation, getHarakatWrongExplanation } from "../engine/questions/explanations.js";
import { track } from "../analytics";
// haptics now handled in StreakMilestoneOverlay
import useLessonQuiz, { computeQuizProgress } from "../hooks/useLessonQuiz";
import type { Lesson } from "../types/lesson";
import type { MasteryState } from "../types/mastery";
import { QuizProgress } from "./quiz/QuizProgress";
import { QuizCelebration } from "./quiz/QuizCelebration";
import { QuizQuestion } from "./quiz/QuizQuestion";
import { WrongAnswerPanel } from "./quiz/WrongAnswerPanel";
import { StreakMilestoneOverlay } from "./quiz/StreakMilestoneOverlay";

// ── Streak milestones ──

const STREAK_MILESTONES = [3, 5, 7] as const;

// ── Types ──

interface LessonQuizProps {
  lesson: Lesson;
  completedLessonIds: number[];
  mastery: MasteryState;
  onComplete: (results: { correct: number; total: number; questions: any[] }) => void;
}

// ── Component ──

export function LessonQuiz({
  lesson,
  completedLessonIds,
  mastery,
  onComplete,
}: LessonQuizProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const {
    currentQuestion,
    questionIndex,
    totalQuestions,
    streak,
    showMidCelebrate,
    dismissMidCelebrate,
    handleAnswer,
    isComplete,
    error,
    results,
  } = useLessonQuiz(lesson, completedLessonIds, mastery);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Streak milestone overlay state
  const [milestoneStreak, setMilestoneStreak] = useState<number | null>(null);
  const prevStreakRef = useRef(0);

  // Screen flash animations
  const wrongFlashOpacity = useSharedValue(0);
  const goldTintOpacity = useSharedValue(0);

  // Play quiz start sound on mount
  useEffect(() => {
    playQuizStart();
  }, []);

  // Track original question count — snapshot when first available
  const originalQCount = useRef(0);
  if (totalQuestions > 0 && originalQCount.current === 0) {
    originalQCount.current = totalQuestions;
  }

  const effectiveQCount = originalQCount.current || totalQuestions;
  const progressPct = computeQuizProgress(
    questionIndex,
    totalQuestions,
    effectiveQCount
  );

  const isSoundQuestion =
    currentQuestion?.type === "audio_to_letter" ||
    currentQuestion?.type === "letter_to_sound" ||
    currentQuestion?.type === "contrast_audio";

  const lessonAudioType: "sound" | "name" =
    lesson.lessonMode === "sound" ||
    lesson.lessonMode === "contrast" ||
    lesson.lessonMode === "checkpoint"
      ? "sound"
      : "name";

  const playTargetAudio = useCallback(() => {
    if (!currentQuestion?.hasAudio || !currentQuestion?.targetId) return;
    track('letter_audio_played', {
      letter_id: typeof currentQuestion.targetId === 'number' ? currentQuestion.targetId : 0,
      audio_type: isSoundQuestion ? 'sound' as const : 'name' as const,
      context: 'quiz' as const,
    });
    if (isSoundQuestion) {
      playLetterSound(currentQuestion.targetId);
    } else {
      playLetterName(currentQuestion.targetId);
    }
  }, [currentQuestion?.hasAudio, currentQuestion?.targetId, isSoundQuestion]);

  const playChosenAudio = useCallback(() => {
    if (!selectedId) return;
    if (isSoundQuestion || lessonAudioType === "sound") {
      playLetterSound(selectedId);
    } else {
      playLetterName(selectedId);
    }
  }, [selectedId, isSoundQuestion, lessonAudioType]);

  useEffect(() => {
    if (isComplete) {
      onComplete(results);
    }
  }, [isComplete, results, onComplete]);

  useEffect(() => {
    setSelectedId(null);
    setAnswered(false);
    setIsCorrect(false);
  }, [questionIndex]);

  // ── Synchronized streak milestone ──
  useEffect(() => {
    if (
      streak > prevStreakRef.current &&
      STREAK_MILESTONES.includes(streak as 3 | 5 | 7)
    ) {
      // Full-screen milestone overlay (replaces banner for milestone streaks)
      setMilestoneStreak(streak);

      goldTintOpacity.value = withSequence(
        withTiming(1, { duration: 150, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 350, easing: Easing.in(Easing.cubic) })
      );
    }
    prevStreakRef.current = streak;
  }, [streak]);

  const handleSelect = useCallback(
    (optionId: number) => {
      if (answered || !currentQuestion) return;
      setSelectedId(optionId);
      setAnswered(true);
      const opt = currentQuestion.options.find((o: any) => o.id === optionId);
      const correct = opt?.isCorrect === true;
      setIsCorrect(correct);
      if (correct) {
        playCorrect();
        setTimeout(() => { handleAnswer(opt, true); }, 800);
      } else {
        playWrong();
        wrongFlashOpacity.value = withSequence(
          withTiming(1, { duration: 80 }),
          withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) })
        );
      }
    },
    [answered, currentQuestion, handleAnswer, wrongFlashOpacity]
  );

  const handleContinueAfterWrong = useCallback(() => {
    if (!currentQuestion) return;
    const opt = currentQuestion.options.find((o: any) => o.id === selectedId);
    handleAnswer(opt, false);
  }, [currentQuestion, selectedId, handleAnswer]);

  const wrongFlashStyle = useAnimatedStyle(() => ({
    opacity: wrongFlashOpacity.value,
  }));

  const goldTintStyle = useAnimatedStyle(() => ({
    opacity: goldTintOpacity.value,
  }));

  if (error) {
    return (
      <View style={[styles.root, styles.errorContainer, { backgroundColor: colors.bg }]}>
        <Text style={[styles.errorHeading, { color: colors.text }]}>
          Something went wrong
        </Text>
        <Text style={[styles.errorMessage, { color: colors.textSoft }]}>
          {error}
        </Text>
        <Button
          title="Go Back"
          variant="secondary"
          onPress={() => router.back()}
          style={{ marginTop: spacing.lg }}
        />
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }]}>
        <Text style={[styles.loadingText, { color: colors.textSoft }]}>
          Loading question...
        </Text>
      </View>
    );
  }

  const correctLetter = currentQuestion.targetId
    ? (getLetter(currentQuestion.targetId) ?? null)
    : null;
  const chosenLetter =
    selectedId && selectedId !== currentQuestion.targetId
      ? (getLetter(selectedId) ?? null)
      : null;

  // ── CRITICAL: banner is OUTSIDE the space-between container ──
  // Rendering it inside causes RN to briefly calculate a flex position
  // before applying absolute positioning, causing bottom-to-top travel.
  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* Quiz content — flex layout with space-between */}
      <View
        style={[
          styles.quizContainer,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: Math.max(insets.bottom, spacing.xl),
          },
        ]}
      >
        <WarmGradient color={colors.bgWarm} height={280} />

        <QuizProgress
          questionIndex={questionIndex}
          originalQCount={effectiveQCount}
          progressPct={progressPct}
          isRecycled={!!currentQuestion._recycled}
        />

        {/* Keyed question stage — scene transition on question change */}
        <Animated.View
          key={questionIndex}
          entering={FadeIn.duration(280).withInitialValues({ opacity: 0, transform: [{ translateY: 20 }, { scale: 0.96 }] })}
          exiting={FadeOut.duration(150).withInitialValues({ opacity: 1, transform: [{ translateY: 0 }] })}
          style={{ flex: 1 }}
        >
          <QuizQuestion
            question={currentQuestion}
            selectedId={selectedId}
            answered={answered}
            isCorrect={isCorrect}
            onSelect={handleSelect}
            onPlayAudio={playTargetAudio}
          />
        </Animated.View>

      </View>

      {/* ── Overlays — OUTSIDE the flex container ── */}

      {/* Wrong answer panel — absolute overlay at bottom */}
      {answered && !isCorrect && (
        <View style={[styles.wrongPanelOverlay, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
          <WrongAnswerPanel
            explanation={
              currentQuestion.explanation ??
              (selectedId && currentQuestion.targetId
                ? lesson.lessonMode === "contrast"
                  ? getContrastExplanation(selectedId, currentQuestion.targetId)
                  : lesson.lessonMode === "harakat" || lesson.lessonMode === "harakat-mixed" || lesson.lessonMode === "harakat-intro"
                    ? getHarakatWrongExplanation(currentQuestion, selectedId)
                    : getWrongExplanation(selectedId, currentQuestion.targetId, isSoundQuestion ? "sound" : "recognition")
                : null)
            }
            correctLetter={correctLetter}
            chosenLetter={chosenLetter}
            isSoundQuestion={isSoundQuestion}
            onPlayCorrect={playTargetAudio}
            onPlayChosen={isSoundQuestion && chosenLetter ? playChosenAudio : undefined}
            onContinue={handleContinueAfterWrong}
          />
        </View>
      )}

      {/* Wrong answer red flash */}
      <Animated.View
        style={[styles.screenFlash, { backgroundColor: "rgba(189, 82, 77, 0.08)" }, wrongFlashStyle]}
        pointerEvents="none"
      />

      {/* Streak gold tint */}
      <Animated.View
        style={[styles.screenFlash, { backgroundColor: "rgba(196, 164, 100, 0.06)" }, goldTintStyle]}
        pointerEvents="none"
      />

      {/* Streak milestone — full-screen overlay */}
      {milestoneStreak !== null && (
        <StreakMilestoneOverlay
          streak={milestoneStreak}
          onDismiss={() => setMilestoneStreak(null)}
        />
      )}

      {/* Mid-celebration */}
      {showMidCelebrate && (
        <QuizCelebration onDismiss={dismissMidCelebrate} />
      )}
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  quizContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: "space-between",
  },
  loadingText: {
    ...typography.body,
    textAlign: "center",
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  errorHeading: {
    ...typography.heading2,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  errorMessage: {
    ...typography.body,
    textAlign: "center",
  },
  screenFlash: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 150,
  },
  wrongPanelOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    zIndex: 100,
  },
});
