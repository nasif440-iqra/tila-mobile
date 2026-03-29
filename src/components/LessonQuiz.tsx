import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useColors } from "../design/theme";
import { typography, spacing } from "../design/tokens";
import {
  playCorrect,
  playWrong,
  playLetterName,
  playLetterSound,
} from "../audio/player";
import { getLetter } from "../data/letters";
import { track } from "../analytics";
import useLessonQuiz, { computeQuizProgress } from "../hooks/useLessonQuiz";
import type { Lesson } from "../types/lesson";
import type { MasteryState } from "../types/mastery";
import { QuizProgress } from "./quiz/QuizProgress";
import { QuizCelebration } from "./quiz/QuizCelebration";
import { QuizQuestion } from "./quiz/QuizQuestion";
import { WrongAnswerPanel } from "./quiz/WrongAnswerPanel";

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

  // Screen flash animations
  const wrongFlashOpacity = useSharedValue(0);
  const goldTintOpacity = useSharedValue(0);

  // Track original question count for progress display
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

  // Determine audio type for the current question's letter
  const isSoundQuestion =
    currentQuestion?.type === "audio_to_letter" ||
    currentQuestion?.type === "letter_to_sound" ||
    currentQuestion?.type === "contrast_audio";

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

  // Gold tint on streak milestones
  const prevStreakForFlash = useRef(0);
  useEffect(() => {
    if (streak > prevStreakForFlash.current && [3, 5, 7].includes(streak)) {
      goldTintOpacity.value = withSequence(
        withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 600, easing: Easing.in(Easing.cubic) })
      );
    }
    prevStreakForFlash.current = streak;
  }, [streak, goldTintOpacity]);

  // Handle option press
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

        // Auto-advance after a brief delay
        setTimeout(() => {
          handleAnswer(opt, true);
        }, 800);
      } else {
        playWrong();
        // Red flash on wrong answer
        wrongFlashOpacity.value = withSequence(
          withTiming(1, { duration: 80 }),
          withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) })
        );
      }
    },
    [answered, currentQuestion, handleAnswer, wrongFlashOpacity]
  );

  // Handle "Got it" press on wrong answer panel
  const handleContinueAfterWrong = useCallback(() => {
    if (!currentQuestion) return;
    const opt = currentQuestion.options.find(
      (o: any) => o.id === selectedId
    );
    handleAnswer(opt, false);
  }, [currentQuestion, selectedId, handleAnswer]);

  // Animated flash styles
  const wrongFlashStyle = useAnimatedStyle(() => ({
    opacity: wrongFlashOpacity.value,
  }));

  const goldTintStyle = useAnimatedStyle(() => ({
    opacity: goldTintOpacity.value,
  }));

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
    ? (getLetter(currentQuestion.targetId) ?? null)
    : null;
  const chosenLetter =
    selectedId && selectedId !== currentQuestion.targetId
      ? (getLetter(selectedId) ?? null)
      : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Wrong answer red flash overlay */}
      <Animated.View
        style={[
          styles.screenFlash,
          { backgroundColor: "rgba(189, 82, 77, 0.08)" },
          wrongFlashStyle,
        ]}
        pointerEvents="none"
      />

      {/* Streak gold tint overlay */}
      <Animated.View
        style={[
          styles.screenFlash,
          { backgroundColor: "rgba(196, 164, 100, 0.06)" },
          goldTintStyle,
        ]}
        pointerEvents="none"
      />

      {/* Mid-celebration overlay */}
      {showMidCelebrate && (
        <QuizCelebration onDismiss={dismissMidCelebrate} />
      )}

      {/* Progress bar + streak banner */}
      <QuizProgress
        questionIndex={questionIndex}
        originalQCount={originalQCount.current}
        progressPct={progressPct}
        streak={streak}
        isRecycled={!!currentQuestion._recycled}
      />

      {/* Question content + options */}
      <QuizQuestion
        question={currentQuestion}
        selectedId={selectedId}
        answered={answered}
        isCorrect={isCorrect}
        onSelect={handleSelect}
        onPlayAudio={playTargetAudio}
      />

      {/* Wrong answer panel */}
      {answered && !isCorrect && (
        <WrongAnswerPanel
          explanation={currentQuestion.explanation ?? null}
          correctLetter={correctLetter}
          chosenLetter={chosenLetter}
          isSoundQuestion={isSoundQuestion}
          onPlayCorrect={playTargetAudio}
          onContinue={handleContinueAfterWrong}
        />
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
  screenFlash: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 150,
  },
});
