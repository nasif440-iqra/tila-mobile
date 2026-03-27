import { useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "../../src/design/theme";
import { typography, spacing } from "../../src/design/tokens";
import { Button } from "../../src/design/components";
import { LESSONS } from "../../src/data/lessons";
import { LessonIntro } from "../../src/components/LessonIntro";
import { LessonQuiz } from "../../src/components/LessonQuiz";
import { LessonHybrid } from "../../src/components/LessonHybrid";
import { LessonSummary } from "../../src/components/LessonSummary";
import { useProgress } from "../../src/hooks/useProgress";
import { useHabit } from "../../src/hooks/useHabit";
import { getPassThreshold } from "../../src/engine/outcome";
import { mapQuizResultsToAttempts } from '../../src/types/quiz';
import type { QuizResultItem } from '../../src/types/quiz';

// ── Types ──

type Stage = "intro" | "quiz" | "summary";

interface QuizResults {
  correct: number;
  total: number;
  questions: QuizResultItem[];
  accuracy: number;
  passed: boolean;
}

// ── Component ──

export default function LessonScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams();
  const lessonId = parseInt(id as string, 10);
  const lesson = LESSONS.find((l: any) => l.id === lessonId);

  const progress = useProgress();
  const { recordPractice } = useHabit();

  const [stage, setStage] = useState<Stage>("intro");
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null);
  const [skipIntro, setSkipIntro] = useState(false);

  const completedLessonIds = progress.completedLessonIds ?? [];
  const mastery = progress.mastery ?? { entities: {}, skills: {}, confusions: {} };

  // Capture pre-lesson state for transient screen detection
  const preCompletedRef = useRef<number[]>(completedLessonIds);

  // ── Handlers ──

  const handleQuizComplete = useCallback(
    async (results: { correct: number; total: number; questions: QuizResultItem[] }) => {
      const accuracy = results.total > 0 ? results.correct / results.total : 0;

      // Determine pass/fail using the threshold for this lesson mode
      const threshold = getPassThreshold(lesson!.lessonMode);
      const passed = threshold === null ? true : accuracy >= threshold;

      // Capture completed IDs before saving
      const prevIds = preCompletedRef.current;

      // Save to database
      const attempts = mapQuizResultsToAttempts(results.questions);
      await progress.completeLesson(
        lesson!.id,
        accuracy,
        passed,
        attempts
      );

      // Record practice for habit/wird on pass
      if (passed) {
        await recordPractice();
      }

      setQuizResults({ ...results, accuracy, passed });
      setStage("summary");
    },
    [lesson, progress, recordPractice]
  );

  const handleContinue = useCallback(() => {
    const prevIds = preCompletedRef.current;
    const passed = quizResults?.passed ?? false;

    if (passed && lesson) {
      // 1. First ever lesson completed? -> post-lesson onboard
      const postLessonSeen = progress.postLessonOnboardSeen ?? false;
      if (prevIds.length === 0 && !postLessonSeen) {
        router.replace("/post-lesson-onboard" as any);
        return;
      }

      // 2. Phase just completed? Check if all lessons in this phase are now done
      const newCompletedIds = progress.completedLessonIds ?? [];
      const phaseLessons = LESSONS.filter((l: any) => l.phase === lesson.phase);
      const allPhaseDone = phaseLessons.every((l: any) => newCompletedIds.includes(l.id));
      const wasPhaseDone = phaseLessons.every((l: any) => prevIds.includes(l.id));

      if (allPhaseDone && !wasPhaseDone) {
        router.replace(`/phase-complete?phase=${lesson.phase}` as any);
        return;
      }
    }

    // Default: go home
    router.replace("/(tabs)");
  }, [quizResults, lesson, progress]);

  const handleRetry = useCallback(() => {
    setQuizResults(null);
    setSkipIntro(true); // skip intro on retry per spec
    setStage("quiz");
  }, []);

  // ── Error: lesson not found ──

  if (!lesson) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.errorContent}>
          <Text style={[typography.heading2, { color: colors.text, textAlign: "center" }]}>
            Lesson not found
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textMuted, textAlign: "center", marginTop: spacing.md },
            ]}
          >
            Could not find lesson with ID {id}.
          </Text>
          <View style={{ marginTop: spacing.xl }}>
            <Button title="Go Home" onPress={() => router.replace("/(tabs)")} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Stage rendering ──

  const isHybrid = lesson?.lessonType === "hybrid";

  // Show intro unless we're skipping it (retry flow) or it's a hybrid lesson
  if (stage === "intro" && !skipIntro && !isHybrid) {
    return <LessonIntro lesson={lesson} onStart={() => setStage("quiz")} />;
  }

  // Quiz stage (also entered directly when skipIntro is true or for hybrid lessons)
  if (stage === "quiz" || (stage === "intro" && (skipIntro || isHybrid))) {
    if (isHybrid) {
      return <LessonHybrid lesson={lesson} onComplete={handleQuizComplete} />;
    }
    return (
      <LessonQuiz
        lesson={lesson}
        completedLessonIds={completedLessonIds}
        mastery={mastery}
        onComplete={handleQuizComplete}
      />
    );
  }

  // Summary stage
  if (stage === "summary" && quizResults) {
    return (
      <LessonSummary
        lesson={lesson}
        results={quizResults}
        passed={quizResults.passed}
        accuracy={quizResults.accuracy}
        onContinue={handleContinue}
        onRetry={handleRetry}
      />
    );
  }

  // Fallback — should not happen
  return null;
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
});
