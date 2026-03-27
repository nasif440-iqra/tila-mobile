import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "../../src/design/theme";
import { typography, spacing } from "../../src/design/tokens";
import { useProgress } from "../../src/hooks/useProgress";
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

// ── Phase metadata ──

const PHASES = [
  { key: 1, label: "Letter Recognition", total: "p1Total", done: "p1Done" },
  { key: 2, label: "Letter Sounds", total: "p2Total", done: "p2Done" },
  { key: 3, label: "Harakat (Vowels)", total: "p3Total", done: "p3Done" },
  { key: 4, label: "Connected Forms", total: "p4Total", done: "p4Done" },
] as const;

export default function ProgressScreen() {
  const colors = useColors();
  const progress = useProgress();

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

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Text style={[typography.heading1, { color: colors.text, marginBottom: spacing.xl }]}>
          Your Progress
        </Text>

        {/* ── Stats Row ── */}
        <StatsRow
          learnedCount={learnedIds.length}
          totalDone={totalDone}
          totalLessons={totalLessons}
          accuracy={stats.accuracy}
          hasAttempts={stats.totalAttempts > 0}
          currentPhase={currentLesson.phase}
        />

        {/* ── Phase Progress ── */}
        <Text
          style={[
            typography.heading3,
            { color: colors.text, marginBottom: spacing.md },
          ]}
        >
          Phase Progress
        </Text>

        {PHASES.map((phase) => (
          <PhasePanel
            key={phase.key}
            label={phase.label}
            done={phaseCounts[phase.done] as number}
            total={phaseCounts[phase.total] as number}
          />
        ))}

        {/* ── Letter Mastery Grid ── */}
        <Text
          style={[
            typography.heading3,
            {
              color: colors.text,
              marginTop: spacing.lg,
              marginBottom: spacing.md,
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
});
