import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "../../src/design/theme";
import {
  typography,
  spacing,
  radii,
  shadows,
  fontFamilies,
} from "../../src/design/tokens";
import { Card, ArabicText } from "../../src/design/components";
import { useProgress } from "../../src/hooks/useProgress";
import { ARABIC_LETTERS, getLetter } from "../../src/data/letters";
import { LESSONS } from "../../src/data/lessons";
import {
  getPhaseCounts,
  getLearnedLetterIds,
  getCurrentLesson,
  getLessonsCompletedCount,
} from "../../src/engine/selectors";
import { deriveMasteryState } from "../../src/engine/mastery";
import { getTodayDateString } from "../../src/engine/dateUtils";

// ── Phase metadata ──

const PHASES = [
  { key: 1, label: "Letter Recognition", total: "p1Total", done: "p1Done" },
  { key: 2, label: "Letter Sounds", total: "p2Total", done: "p2Done" },
  { key: 3, label: "Harakat (Vowels)", total: "p3Total", done: "p3Done" },
  { key: 4, label: "Connected Forms", total: "p4Total", done: "p4Done" },
] as const;

// ── Mastery color mapping ──

function getMasteryStyle(
  state: string,
  colors: ReturnType<typeof useColors>
): { bg: string; border: string; textColor: string; nameColor: string } {
  switch (state) {
    case "retained":
      return {
        bg: colors.primarySoft,
        border: colors.primary,
        textColor: colors.primaryDark,
        nameColor: colors.primary,
      };
    case "accurate":
      return {
        bg: colors.primarySoft,
        border: colors.primary,
        textColor: colors.primaryDark,
        nameColor: colors.primary,
      };
    case "unstable":
      return {
        bg: colors.accentLight,
        border: colors.accent,
        textColor: colors.text,
        nameColor: colors.accent,
      };
    case "introduced":
      return {
        bg: colors.bgCard,
        border: colors.border,
        textColor: colors.textSoft,
        nameColor: colors.textMuted,
      };
    default:
      // not started
      return {
        bg: colors.bgCard,
        border: "transparent",
        textColor: colors.textMuted,
        nameColor: colors.textMuted,
      };
  }
}

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
        totalCorrect += (e as any).correct || 0;
        totalAttempts += (e as any).attempts || 0;
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
        <View style={styles.statsRow}>
          {[
            { label: "Letters", value: String(learnedIds.length) },
            { label: "Lessons", value: `${totalDone}/${totalLessons}` },
            {
              label: "Accuracy",
              value: stats.totalAttempts > 0 ? `${stats.accuracy}%` : "\u2014",
            },
            { label: "Phase", value: String(currentLesson.phase) },
          ].map((stat) => (
            <Card key={stat.label} style={styles.statCard}>
              <Text
                style={[
                  typography.heading2,
                  { color: colors.primary, textAlign: "center" },
                ]}
              >
                {stat.value}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: colors.textMuted },
                ]}
              >
                {stat.label}
              </Text>
            </Card>
          ))}
        </View>

        {/* ── Phase Progress ── */}
        <Text
          style={[
            typography.heading3,
            { color: colors.text, marginBottom: spacing.md },
          ]}
        >
          Phase Progress
        </Text>

        {PHASES.map((phase) => {
          const done = phaseCounts[phase.done] as number;
          const total = phaseCounts[phase.total] as number;
          const pct = total > 0 ? (done / total) * 100 : 0;
          const isComplete = done === total && total > 0;

          return (
            <Card
              key={phase.key}
              style={{ marginBottom: spacing.md, padding: spacing.lg }}
            >
              <View style={styles.phaseHeader}>
                <View style={styles.phaseHeaderLeft}>
                  {/* Status dot */}
                  <View
                    style={[
                      styles.phaseDot,
                      {
                        backgroundColor: isComplete
                          ? colors.primary
                          : done > 0
                          ? colors.primarySoft
                          : colors.bgCard,
                        borderColor:
                          done > 0 ? colors.primary : colors.border,
                        borderWidth: isComplete ? 0 : 2,
                      },
                    ]}
                  >
                    {isComplete && (
                      <Text style={{ color: colors.white, fontSize: 12 }}>
                        {"\u2713"}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        typography.bodyLarge,
                        {
                          color: colors.text,
                          fontFamily: fontFamilies.headingSemiBold,
                        },
                      ]}
                    >
                      {phase.label}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.phaseCount,
                    {
                      color: isComplete ? colors.primary : colors.textMuted,
                    },
                  ]}
                >
                  {done}/{total}
                </Text>
              </View>

              {/* Progress bar */}
              {total > 0 && (
                <View
                  style={[
                    styles.progressTrack,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: colors.primary,
                        width: `${pct}%` as any,
                      },
                    ]}
                  />
                </View>
              )}
            </Card>
          );
        })}

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

        <View style={styles.letterGrid}>
          {ARABIC_LETTERS.map((letter) => {
            const entityKey = `letter:${letter.id}`;
            const entity = mastery.entities?.[entityKey];
            const state = entity
              ? deriveMasteryState(entity, today)
              : "not_started";
            const learned = learnedIds.includes(letter.id);
            const started = entity && (entity as any).attempts > 0;
            const masteryStyle = getMasteryStyle(state, colors);

            return (
              <Pressable key={letter.id} style={{ width: "25%" }}>
                <View
                  style={[
                    styles.letterCell,
                    {
                      backgroundColor: masteryStyle.bg,
                      borderColor: masteryStyle.border,
                      borderWidth: state !== "not_started" ? 2 : 1.5,
                      opacity: started || learned ? 1 : 0.35,
                    },
                  ]}
                >
                  <ArabicText
                    size="body"
                    color={masteryStyle.textColor}
                    style={{ textAlign: "center" }}
                  >
                    {letter.letter}
                  </ArabicText>
                  <Text
                    style={[
                      styles.letterName,
                      { color: masteryStyle.nameColor },
                    ]}
                    numberOfLines={1}
                  >
                    {learned
                      ? letter.name
                      : started
                      ? `${(entity as any).correct}/${(entity as any).attempts}`
                      : "\u2014"}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* ── Your Data ── */}
        <Text
          style={[
            typography.heading3,
            {
              color: colors.text,
              marginTop: spacing.xxl,
              marginBottom: spacing.md,
            },
          ]}
        >
          Your Data
        </Text>

        <Pressable
          style={[
            styles.dataButton,
            { borderColor: colors.primary },
          ]}
        >
          <Text
            style={[
              styles.dataButtonText,
              { color: colors.primary },
            ]}
          >
            Export Backup
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.dataButton,
            { borderColor: colors.border, marginTop: spacing.sm },
          ]}
        >
          <Text
            style={[
              styles.dataButtonText,
              { color: colors.textMuted },
            ]}
          >
            Import Backup
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
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.bodySemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  phaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  phaseHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  phaseDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  phaseCount: {
    fontSize: 12,
    fontFamily: fontFamilies.bodyBold,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  letterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  letterCell: {
    aspectRatio: 1,
    margin: 4,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xs,
  },
  letterName: {
    fontSize: 9,
    fontFamily: fontFamilies.bodySemiBold,
    marginTop: 2,
  },
  dataButton: {
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  dataButtonText: {
    fontSize: 13,
    fontFamily: fontFamilies.headingSemiBold,
  },
});
