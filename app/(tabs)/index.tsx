import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useColors } from "../../src/design/theme";
import { spacing, typography } from "../../src/design/tokens";
import { durations, easings } from "../../src/design/animations";
import { WarmGradient } from "../../src/design/components";
import { useProgress } from "../../src/hooks/useProgress";
import { useHabit } from "../../src/hooks/useHabit";
import { LESSONS } from "../../src/data/lessons";
import {
  getCurrentLesson,
  getLessonsCompletedCount,
} from "../../src/engine/selectors";
import { getTodayDateString, getDayDifference } from "../../src/engine/dateUtils";
import { AnimatedStreakBadge } from "../../src/components/home/AnimatedStreakBadge";
import HeroCard from "../../src/components/home/HeroCard";
import LessonGrid from "../../src/components/home/LessonGrid";

// ── Constants ──

const SCROLL_BOTTOM_INSET = 96;

// ── Main screen ──

export default function HomeScreen() {
  const colors = useColors();
  const progress = useProgress();
  const { habit } = useHabit();
  const today = getTodayDateString();

  // Header entrance animation
  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, {
      duration: durations.normal,
      easing: easings.contentReveal,
    });
  }, []);

  const headerEntranceStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  // Redirect to onboarding if user hasn't completed it yet
  const onboarded = progress.onboarded ?? false;
  const returnHadithLastShown = progress.returnHadithLastShown ?? null;

  useEffect(() => {
    if (progress.loading) return;

    if (!onboarded) {
      router.replace("/onboarding");
      return;
    }

    // Check if user should see the return hadith screen
    const lastPractice = habit?.lastPracticeDate;
    if (lastPractice) {
      const gap = getDayDifference(today, lastPractice);
      if (gap >= 1 && returnHadithLastShown !== today) {
        router.replace("/return-welcome");
        return;
      }
    }
  }, [progress.loading, onboarded, habit?.lastPracticeDate, today, returnHadithLastShown]);

  const completedLessonIds = progress.completedLessonIds ?? [];
  const mastery = progress.mastery;
  const lessonsCompleted = getLessonsCompletedCount(completedLessonIds);

  const nextLesson = getCurrentLesson(completedLessonIds);
  const allDone = !nextLesson || completedLessonIds.length >= LESSONS.length;
  const currentPhase = nextLesson?.phase ?? 1;

  // Wird streak
  const currentWird = habit?.currentWird ?? 0;

  // Loading state
  if (progress.loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  function handleStartLesson(lessonId: number) {
    router.push({ pathname: '/lesson/[id]', params: { id: String(lessonId) } });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      {/* Warm gradient ambient layer */}
      <WarmGradient color={colors.bgWarm} height={300} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Animated.View style={headerEntranceStyle}>
            <Text style={[styles.appName, { color: colors.brown }]}>tila</Text>
          </Animated.View>
          {currentWird > 0 && <AnimatedStreakBadge count={currentWird} enterDelay={200} />}
        </View>

        {/* ── Hero Card ── */}
        <HeroCard
          lesson={nextLesson ?? null}
          allDone={allDone}
          completedLessonIds={completedLessonIds}
          lessonsCompleted={lessonsCompleted}
          currentPhase={currentPhase}
          onStartLesson={handleStartLesson}
          enterDelay={80}
        />

        {/* ── Journey Path ── */}
        <LessonGrid
          currentPhase={currentPhase}
          nextLessonId={nextLesson?.id ?? null}
          completedLessonIds={completedLessonIds}
          mastery={mastery}
          today={today}
          onStartLesson={handleStartLesson}
          enterDelay={160}
        />

        {/* Bottom spacer for tab bar */}
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: SCROLL_BOTTOM_INSET,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  appName: {
    ...typography.pageTitle,
  },
});
