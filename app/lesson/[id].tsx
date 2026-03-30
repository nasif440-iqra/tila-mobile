import { useState, useCallback, useRef, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
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
import { track } from '../../src/analytics';
import { playLessonStart } from "../../src/audio/player";
import { durations } from "../../src/design/animations";
import { deriveMasteryState, parseEntityKey } from "../../src/engine/mastery.js";
import { getLetter } from "../../src/data/letters.js";
import { planReviewSession } from "../../src/engine/selectors";
import { getTodayDateString } from "../../src/engine/dateUtils";
import { LetterMasteryCelebration } from "../../src/components/celebrations/LetterMasteryCelebration";

// ── Types ──

type Stage = "intro" | "quiz" | "mastery-celebration" | "summary";

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
  const [masteredLetters, setMasteredLetters] = useState<Array<{ letter: string; name: string }>>([]);
  const [goalCompleted, setGoalCompleted] = useState(false);

  const completedLessonIds = progress.completedLessonIds ?? [];
  const mastery = progress.mastery ?? { entities: {}, skills: {}, confusions: {} };
  const today = getTodayDateString();

  // Capture pre-lesson state for transient screen detection
  const preCompletedRef = useRef<number[]>(completedLessonIds);
  const lessonStartedRef = useRef<number | null>(null);

  // ── Effects ──

  useEffect(() => {
    if (stage === "quiz" && lesson) {
      lessonStartedRef.current = Date.now();
      track('lesson_started', {
        lesson_id: lesson.id,
        phase: lesson.phase,
        lesson_mode: lesson.lessonMode,
        is_retry: skipIntro,
      });
    }
  }, [stage, lesson, skipIntro]);

  // ── Handlers ──

  const handleQuizComplete = useCallback(
    async (results: { correct: number; total: number; questions: QuizResultItem[] }) => {
      const accuracy = results.total > 0 ? results.correct / results.total : 0;

      // Determine pass/fail using the threshold for this lesson mode
      const threshold = getPassThreshold(lesson!.lessonMode);
      const passed = threshold === null ? true : accuracy >= threshold;

      // Snapshot pre-mastery states for comparison
      const today = new Date().toISOString().slice(0, 10);
      const currentMastery = progress.mastery ?? { entities: {}, skills: {}, confusions: {} };
      const preMasteryStates = new Map<string, string>();
      for (const [key, entity] of Object.entries(currentMastery.entities)) {
        preMasteryStates.set(key, deriveMasteryState(entity, today));
      }

      // Save to database with quizResultItems for mastery pipeline
      const attempts = mapQuizResultsToAttempts(results.questions);
      await progress.completeLesson(
        lesson!.id,
        accuracy,
        passed,
        attempts,
        results.questions  // QuizResultItem[] -- feeds mastery pipeline
      );

      // Record practice for habit/wird on pass
      if (passed) {
        await recordPractice();

        // Check if daily goal was just hit
        const dailyGoalMinutes = progress.onboardingDailyGoal ?? null;
        const goalLessons = dailyGoalMinutes ? (dailyGoalMinutes <= 3 ? 1 : dailyGoalMinutes <= 5 ? 2 : 3) : 1;
        const todayCount = (progress.habit?.todayLessonCount ?? 0) + 1; // +1 for the lesson just completed
        if (todayCount >= goalLessons && todayCount - 1 < goalLessons) {
          setGoalCompleted(true);
        }
      }

      const durationSeconds = lessonStartedRef.current
        ? Math.round((Date.now() - lessonStartedRef.current) / 1000)
        : 0;

      if (passed) {
        track('lesson_completed', {
          lesson_id: lesson!.id,
          phase: lesson!.phase,
          accuracy,
          duration_seconds: durationSeconds,
          total_questions: results.total,
          streak_peak: 0,
        });
      } else {
        track('lesson_failed', {
          lesson_id: lesson!.id,
          phase: lesson!.phase,
          accuracy,
          duration_seconds: durationSeconds,
          total_questions: results.total,
        });
      }

      // Detect newly mastered letters by comparing pre/post mastery states
      const postMastery = progress.mastery ?? { entities: {}, skills: {}, confusions: {} };
      const newlyMastered: Array<{ letter: string; name: string }> = [];

      for (const [key, entity] of Object.entries(postMastery.entities)) {
        const oldState = preMasteryStates.get(key) ?? "introduced";
        const newState = deriveMasteryState(entity as any, today);
        if (newState === "retained" && oldState !== "retained") {
          const parsed = parseEntityKey(key);
          if (parsed.type === "letter" && typeof parsed.rawId === "number") {
            const letterData = getLetter(parsed.rawId);
            if (letterData) {
              newlyMastered.push({ letter: letterData.letter, name: letterData.name });
            }
          }
        }
      }

      setQuizResults({ ...results, accuracy, passed });
      if (newlyMastered.length > 0) {
        setMasteredLetters(newlyMastered);
        setStage("mastery-celebration");
      } else {
        setStage("summary");
      }
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
        router.replace({ pathname: '/post-lesson-onboard' });
        return;
      }

      // 2. Phase just completed? Check if all lessons in this phase are now done
      const newCompletedIds = progress.completedLessonIds ?? [];
      const phaseLessons = LESSONS.filter((l: any) => l.phase === lesson.phase);
      const allPhaseDone = phaseLessons.every((l: any) => newCompletedIds.includes(l.id));
      const wasPhaseDone = phaseLessons.every((l: any) => prevIds.includes(l.id));

      if (allPhaseDone && !wasPhaseDone) {
        router.replace({ pathname: '/phase-complete', params: { phase: String(lesson.phase) } });
        return;
      }
    }

    // Default: go home
    router.replace("/(tabs)");
  }, [quizResults, lesson, progress]);

  const handleMasteryDismiss = useCallback(() => {
    setStage("summary");
  }, []);

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

  // Determine the effective stage key for animation
  const effectiveStage =
    stage === "intro" && (skipIntro || isHybrid) ? "quiz" : stage as string;

  function renderStage() {
    // Show intro unless we're skipping it (retry flow) or it's a hybrid lesson
    if (stage === "intro" && !skipIntro && !isHybrid) {
      return <LessonIntro lesson={lesson} onStart={() => { playLessonStart(); setStage("quiz"); }} onBack={() => router.back()} />;
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

    // Mastery celebration stage
    if (stage === "mastery-celebration" && masteredLetters.length > 0) {
      return (
        <LetterMasteryCelebration
          masteredLetters={masteredLetters}
          onDismiss={handleMasteryDismiss}
        />
      );
    }

    // Summary stage
    if (stage === "summary" && quizResults) {
      // Compute how many letters are due for review to show prompt (B5)
      const reviewPlan = progress.mastery ? planReviewSession(progress.mastery, today) : null;
      const reviewItemCount = reviewPlan?.hasReviewWork ? (reviewPlan.totalItems ?? 0) : 0;

      return (
        <LessonSummary
          lesson={lesson}
          results={quizResults}
          passed={quizResults.passed}
          accuracy={quizResults.accuracy}
          threshold={getPassThreshold(lesson.lessonMode)}
          goalCompleted={goalCompleted}
          reviewItemCount={reviewItemCount}
          onContinue={handleContinue}
          onRetry={handleRetry}
          onBack={() => router.replace("/(tabs)")}
          onReview={() => router.replace("/lesson/review")}
        />
      );
    }

    return null;
  }

  return (
    <Animated.View
      key={effectiveStage}
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
  errorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
});
