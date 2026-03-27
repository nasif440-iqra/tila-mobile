import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { useColors } from "../design/theme";
import { typography, spacing } from "../design/tokens";
import { getSFXAsset, getLetterAsset } from "../audio/player";
import { getLetter } from "../data/letters";
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

      const opt = currentQuestion.options.find((o: any) => o.id === optionId);
      const correct = opt?.isCorrect === true;
      setIsCorrect(correct);

      if (correct) {
        correctSFX.seekTo(0);
        correctSFX.play();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Auto-advance after a brief delay
        setTimeout(() => {
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
    ? (getLetter(currentQuestion.targetId) ?? null)
    : null;
  const chosenLetter =
    selectedId && selectedId !== currentQuestion.targetId
      ? (getLetter(selectedId) ?? null)
      : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Mid-celebration overlay */}
      {showMidCelebrate && (
        <QuizCelebration onDismiss={dismissMidCelebrate} />
      )}

      {/* Progress bar + streak banner */}
      <QuizProgress
        questionIndex={questionIndex}
        totalQuestions={totalQuestions}
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
});
