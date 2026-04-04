import { useState, useEffect, useCallback, useRef } from "react";
import {
  generateLessonQuestions,
  shuffle,
} from "../engine/questions/index.js";
import type { Lesson } from '../types/lesson';
import type { ProgressState } from '../engine/progress';
import type { Question, QuestionOption } from '../types/question';
import type { QuizResultItem } from '../types/quiz';

/**
 * Honest quiz progress: uses the live queue length.
 * Progress may dip when missed questions are recycled — this is intentional.
 */
export function computeQuizProgress(
  qIndex: number,
  totalQuestions: number,
  originalQCount: number
): number {
  const effectiveTotal = Math.max(totalQuestions, originalQCount, 1);
  return Math.min(100, Math.max(0, (qIndex / effectiveTotal) * 100));
}

export default function useLessonQuiz(
  lesson: Lesson,
  completedLessonIds: number[],
  mastery: ProgressState["mastery"]
): {
  currentQuestion: Question | null;
  questionIndex: number;
  totalQuestions: number;
  streak: number;
  showMidCelebrate: boolean;
  dismissMidCelebrate: () => void;
  handleAnswer: (selectedOption: QuestionOption, correct: boolean) => void;
  isComplete: boolean;
  error: string | null;
  results: { correct: number; total: number; questions: QuizResultItem[] };
} {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [quizResults, setQuizResults] = useState<QuizResultItem[]>([]);
  const [streak, setStreak] = useState(0);
  const [originalQCount, setOriginalQCount] = useState(0);
  const [midPoint, setMidPoint] = useState(-1);
  const [showMidCelebrate, setShowMidCelebrate] = useState(false);
  const [midShown, setMidShown] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generatedRef = useRef(false);
  const questionStartRef = useRef<number>(Date.now());

  // Generate questions on mount
  useEffect(() => {
    if (generatedRef.current) return;
    generatedRef.current = true;

    const progress = { completedLessonIds, mastery };
    const qs = generateLessonQuestions(lesson, progress);
    if (!qs || qs.length === 0) {
      setError('No questions could be generated for this lesson. Please try a different lesson or contact support.');
      return;
    }
    setQuestions(qs);
    questionStartRef.current = Date.now();
    setOriginalQCount(qs.length);
    if (qs.length >= 8) setMidPoint(Math.floor(qs.length * 0.45));
  }, [lesson, completedLessonIds, mastery]);

  const dismissMidCelebrate = useCallback(() => {
    setShowMidCelebrate(false);
    setMidShown(true);
  }, []);

  const handleAnswer = useCallback(
    (selectedOption: QuestionOption, correct: boolean) => {
      const currentQ = questions[qIndex];
      if (!currentQ) return;

      // Record result
      const correctOption = currentQ.options?.find((o: QuestionOption) => o.isCorrect);
      const elapsed = Date.now() - questionStartRef.current;
      questionStartRef.current = Date.now();

      setQuizResults((prev) => [
        ...prev,
        {
          targetId: currentQ.targetId,
          correct,
          selectedId: selectedOption?.id != null ? String(selectedOption.id) : String(selectedOption),
          questionType: currentQ.type || null,
          correctId: correctOption?.id != null ? String(correctOption.id) : '',
          isHarakat: !!currentQ.isHarakat,
          hasAudio: !!currentQ.hasAudio,
          responseTimeMs: elapsed,
        },
      ]);

      if (correct) {
        setStreak((s) => s + 1);
      } else {
        setStreak(0);

        // Recycle wrong answer once: copy with shuffled options appended to end
        const recycleCount = currentQ._recycleCount || 0;
        if (recycleCount < 1) {
          setQuestions((prev) => [
            ...prev,
            {
              ...currentQ,
              options: shuffle([...currentQ.options]),
              _recycled: true,
              _recycleCount: recycleCount + 1,
            },
          ]);
        }
      }

      // Advance to next question
      const nextIdx = qIndex + 1;
      // Use a function to read the latest questions length (accounts for recycled additions)
      setQuestions((currentQuestions) => {
        if (nextIdx < currentQuestions.length) {
          // Check for mid-celebration trigger
          if (midPoint > 0 && nextIdx === midPoint && !midShown) {
            setShowMidCelebrate(true);
          }
          setQIndex(nextIdx);
        } else {
          setIsComplete(true);
        }
        return currentQuestions;
      });
    },
    [questions, qIndex, midPoint, midShown]
  );

  const currentQuestion = questions[qIndex] || null;
  const correctCount = quizResults.filter((r) => r.correct).length;

  return {
    currentQuestion,
    questionIndex: qIndex,
    totalQuestions: questions.length,
    streak,
    showMidCelebrate,
    dismissMidCelebrate,
    handleAnswer,
    isComplete,
    error,
    results: {
      correct: correctCount,
      total: quizResults.length,
      questions: quizResults,
    },
  };
}
