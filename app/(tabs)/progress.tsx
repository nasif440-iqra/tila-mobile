import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { useEffect, useMemo, useCallback } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "../../src/design/theme";
import { typography, spacing } from "../../src/design/tokens";
import { durations, easings, staggers } from "../../src/design/animations";
import { WarmGradient } from "../../src/design/components";
import { useProgress } from "../../src/hooks/useProgress";
import { useDatabase } from "../../src/db/provider";
import { resetProgress } from "../../src/engine/progress";
import { LESSONS } from "../../src/data/lessons";
import {
  getPhaseCounts,
  getLearnedLetterIds,
  getCurrentLesson,
} from "../../src/engine/selectors";
import { getTodayDateString } from "../../src/engine/dateUtils";
import StatsRow from "../../src/components/progress/StatsRow";
import PhasePanel from "../../src/components/progress/PhasePanel";
import LetterMasteryGrid from "../../src/components/progress/LetterMasteryGrid";
import { EmptyState } from "../../src/components/feedback/EmptyState";

// ── Phase metadata ──

const PHASES = [
  { key: 1, label: "Letter Recognition", total: "p1Total", done: "p1Done" },
  { key: 2, label: "Letter Sounds", total: "p2Total", done: "p2Done" },
  { key: 3, label: "Harakat (Vowels)", total: "p3Total", done: "p3Done" },
  { key: 4, label: "Connected Forms", total: "p4Total", done: "p4Done" },
] as const;

export default function ProgressScreen() {
  const colors = useColors();
  const router = useRouter();
  const db = useDatabase();
  const progress = useProgress();

  const handleResetProgress = useCallback(() => {
    Alert.alert(
      "Reset All Progress?",
      "This will erase all lessons, mastery, and streaks. You'll go through onboarding again. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Everything",
          style: "destructive",
          onPress: async () => {
            await resetProgress(db);
            router.replace("/onboarding");
          },
        },
      ]
    );
  }, [db, router]);

  const completedLessonIds = progress.completedLessonIds ?? [];
  const mastery = progress.mastery ?? { entities: {}, skills: {}, confusions: {} };
  const today = getTodayDateString();

  // Derived data
  const phaseCounts = useMemo(
    () => getPhaseCounts(completedLessonIds),
    [completedLessonIds]
  );

  const learnedIds = useMemo(
    () => getLearnedLetterIds(completedLessonIds),
    [completedLessonIds]
  );

  const currentLesson = useMemo(
    () => getCurrentLesson(completedLessonIds),
    [completedLessonIds]
  );

  const totalDone = completedLessonIds.length;
  const totalLessons = LESSONS.length;

  // Stats
  const stats = useMemo(() => {
    const entities = mastery.entities ?? {};
    let totalCorrect = 0;
    let totalAttempts = 0;
    for (const e of Object.values(entities)) {
      if (e && typeof e === "object") {
        totalCorrect += e.correct || 0;
        totalAttempts += e.attempts || 0;
      }
    }
    const accuracy =
      totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    return { totalCorrect, totalAttempts, accuracy };
  }, [mastery.entities]);

  // ── Staggered entrance animations ──
  const statsOpacity = useSharedValue(0);
  const statsTranslateY = useSharedValue(12);
  const phasesOpacity = useSharedValue(0);
  const phasesTranslateY = useSharedValue(12);
  const masteryOpacity = useSharedValue(0);
  const masteryTranslateY = useSharedValue(12);

  useEffect(() => {
    const timingConfig = { duration: durations.normal, easing: easings.contentReveal };

    // Stats section (immediate)
    statsOpacity.value = withTiming(1, timingConfig);
    statsTranslateY.value = withTiming(0, timingConfig);

    // Phases section (staggered)
    phasesOpacity.value = withDelay(staggers.normal.delay, withTiming(1, timingConfig));
    phasesTranslateY.value = withDelay(staggers.normal.delay, withTiming(0, timingConfig));

    // Mastery section (more stagger)
    masteryOpacity.value = withDelay(staggers.normal.delay * 2, withTiming(1, timingConfig));
    masteryTranslateY.value = withDelay(staggers.normal.delay * 2, withTiming(0, timingConfig));
  }, []);

  const statsAnimStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
    transform: [{ translateY: statsTranslateY.value }],
  }));

  const phasesAnimStyle = useAnimatedStyle(() => ({
    opacity: phasesOpacity.value,
    transform: [{ translateY: phasesTranslateY.value }],
  }));

  const masteryAnimStyle = useAnimatedStyle(() => ({
    opacity: masteryOpacity.value,
    transform: [{ translateY: masteryTranslateY.value }],
  }));

  if (progress.loading) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={[styles.container, { backgroundColor: colors.bg }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (completedLessonIds.length === 0) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={[styles.container, { backgroundColor: colors.bg }]}
      >
        <Text
          style={[
            typography.pageTitle,
            { color: colors.brown, paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
          ]}
        >
          Your Progress
        </Text>
        <View style={{ flex: 1, justifyContent: "center" }}>
          <EmptyState
            title="Your Journey Begins"
            subtitle="Bismillah -- complete your first lesson and watch your progress grow here."
            actionLabel="Start Learning"
            onAction={() => router.replace("/(tabs)")}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      {/* Warm gradient ambient layer */}
      <WarmGradient color={colors.bgWarm} height={300} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header + Stats ── */}
        <Animated.View style={statsAnimStyle}>
          <Text style={[typography.pageTitle, { color: colors.brown, marginBottom: spacing.xl }]}>
            Your Progress
          </Text>

          <StatsRow
            learnedCount={learnedIds.length}
            totalDone={totalDone}
            totalLessons={totalLessons}
            accuracy={stats.accuracy}
            hasAttempts={stats.totalAttempts > 0}
            currentPhase={currentLesson.phase}
          />
        </Animated.View>

        {/* ── Phase Progress ── */}
        <Animated.View style={phasesAnimStyle}>
          <Text
            style={[
              typography.sectionHeader,
              { color: colors.brownLight, marginTop: spacing.xxxxl, marginBottom: spacing.lg },
            ]}
          >
            Phase Progress
          </Text>

          {PHASES.map((phase) => (
            <View key={phase.key} style={{ marginBottom: spacing.md }}>
              <PhasePanel
                label={phase.label}
                done={phaseCounts[phase.done] as number}
                total={phaseCounts[phase.total] as number}
              />
            </View>
          ))}
        </Animated.View>

        {/* ── Letter Mastery Grid ── */}
        <Animated.View style={masteryAnimStyle}>
          <Text
            style={[
              typography.sectionHeader,
              {
                color: colors.brownLight,
                marginTop: spacing.xxxxl,
                marginBottom: spacing.lg,
              },
            ]}
          >
            Letter Mastery
          </Text>

          <LetterMasteryGrid
            entities={mastery.entities ?? {}}
            learnedIds={learnedIds}
            today={today}
          />
        </Animated.View>

        {/* Reset progress */}
        <Pressable
          onPress={handleResetProgress}
          style={[styles.resetButton, { borderColor: colors.border }]}
        >
          <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
            Reset All Progress
          </Text>
        </Pressable>

        {/* Bottom padding for tab bar */}
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  resetButton: {
    marginTop: spacing.xxxxl,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderTopWidth: 1,
  },
});
