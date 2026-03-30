import { useState, useCallback, useMemo, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
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
import type { QuizResultItem } from '../../src/types/quiz';
import { durations } from "../../src/design/animations";
import { useSubscription, usePremiumReviewRights, FREE_LESSON_CUTOFF } from "../../src/monetization/hooks";
import { loadPremiumLessonGrants } from "../../src/engine/progress";
import { useDatabase } from "../../src/db/provider";

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
  const db = useDatabase();
  const progress = useProgress();
  const { recordPractice } = useHabit();
  const { isPremiumActive } = useSubscription();

  const [stage, setStage] = useState<Stage>("quiz");
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null);
  const [grantedLessonIds, setGrantedLessonIds] = useState<number[]>([]);

  useEffect(() => {
    loadPremiumLessonGrants(db).then(setGrantedLessonIds);
  }, [db]);

  const reviewableLetterIds = usePremiumReviewRights(grantedLessonIds);

  const completedLessonIds = progress.completedLessonIds ?? [];
  const mastery = progress.mastery ?? { entities: {}, skills: {}, confusions: {} };
  const today = getTodayDateString();

  // Build pseudo-lesson from SRS review planner, filtered by premium rights
  const reviewLesson = useMemo(() => {
    const payload = buildReviewLessonPayload(mastery, completedLessonIds, today);
    if (!payload) return null;

    // If user is premium, no filtering needed
    if (isPremiumActive) return payload;

    // For free/expired users, filter to only reviewable letters
    const filteredTeachIds = (payload.teachIds || []).filter(
      (id: number) => reviewableLetterIds.includes(id)
    );

    if (filteredTeachIds.length === 0) return null;

    return { ...payload, teachIds: filteredTeachIds };
  }, [mastery, completedLessonIds, today, isPremiumActive, reviewableLetterIds]);

  // ── Handlers ──

  const handleQuizComplete = useCallback(
    async (results: { correct: number; total: number; questions: QuizResultItem[] }) => {
      const accuracy = results.total > 0 ? results.correct / results.total : 0;
      const passed = true;

      // Review sessions save mastery updates only — no lesson_attempts row.
      await progress.saveMasteryOnly(results.questions);
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

  // ── Stage rendering ──

  function renderStage() {
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

    return null;
  }

  return (
    <Animated.View
      key={stage}
      entering={FadeIn.duration(durations.normal)}
      exiting={FadeOut.duration(durations.micro)}
      style={{ flex: 1 }}
    >
      {renderStage()}
    </Animated.View>
  );
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
