import { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "../../src/design/theme";
import { typography, spacing } from "../../src/design/tokens";
import { Button } from "../../src/design/components";
import { LessonQuiz } from "../../src/components/LessonQuiz";
import { LessonSummary } from "../../src/components/LessonSummary";
import { useProgress } from "../../src/hooks/useProgress";
import { useHabit } from "../../src/hooks/useHabit";
import { buildReviewLessonPayload } from "../../src/engine/selectors";
import { getTodayDateString } from "../../src/engine/dateUtils";
import { mapQuizResultsToAttempts } from '../../src/types/quiz';
import type { QuizResultItem } from '../../src/types/quiz';

// ── Types ──

type Stage = "quiz" | "summary";

interface QuizResults {
  correct: number;
  total: number;
  questions: QuizResultItem[];
  accuracy: number;
  passed: boolean;
}

// ── Component ──

export default function ReviewScreen() {
  const colors = useColors();
  const progress = useProgress();
  const { recordPractice } = useHabit();

  const [stage, setStage] = useState<Stage>("quiz");
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null);

  const completedLessonIds = progress.completedLessonIds ?? [];
  const mastery = progress.mastery ?? { entities: {}, skills: {}, confusions: {} };
  const today = getTodayDateString();

  // Build pseudo-lesson from SRS review planner
  const reviewLesson = useMemo(
    () => buildReviewLessonPayload(mastery, completedLessonIds, today),
    [mastery, completedLessonIds, today]
  );

  // ── Handlers ──

  const handleQuizComplete = useCallback(
    async (results: { correct: number; total: number; questions: QuizResultItem[] }) => {
      const accuracy = results.total > 0 ? results.correct / results.total : 0;

      // Review sessions always pass
      const passed = true;

      // Save to database — review uses id "review" but completeLesson expects a number,
      // so we pass 0 as a sentinel for review sessions
      const attempts = mapQuizResultsToAttempts(results.questions);
      await progress.completeLesson(
        0, // review session sentinel
        accuracy,
        passed,
        attempts
      );

      // Record practice for habit/wird
      await recordPractice();

      setQuizResults({ ...results, accuracy, passed });
      setStage("summary");
    },
    [progress, recordPractice]
  );

  const handleContinue = useCallback(() => {
    router.replace("/(tabs)");
  }, []);

  // ── Loading state ──

  if (progress.loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.centerContent}>
          <Text style={[typography.body, { color: colors.textMuted }]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Nothing to review ──

  if (!reviewLesson) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.centerContent}>
          <Text style={[typography.heading2, { color: colors.text, textAlign: "center" }]}>
            Nothing to review!
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.textMuted, textAlign: "center", marginTop: spacing.md },
            ]}
          >
            You're all caught up. Keep learning new lessons and come back later.
          </Text>
          <View style={{ marginTop: spacing.xl }}>
            <Button title="Go Home" onPress={() => router.replace("/(tabs)")} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Quiz stage ──

  if (stage === "quiz") {
    return (
      <LessonQuiz
        lesson={reviewLesson}
        completedLessonIds={completedLessonIds}
        mastery={mastery}
        onComplete={handleQuizComplete}
      />
    );
  }

  // ── Summary stage (always passed) ──

  if (stage === "summary" && quizResults) {
    return (
      <LessonSummary
        lesson={reviewLesson}
        results={quizResults}
        passed={quizResults.passed}
        accuracy={quizResults.accuracy}
        onContinue={handleContinue}
        onRetry={() => {}} // Review sessions don't retry — always pass
      />
    );
  }

  // Fallback
  return null;
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
});
