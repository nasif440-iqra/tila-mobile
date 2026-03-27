import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useMemo, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { ArabicText, Button, Card } from "../../src/design/components";
import { useColors } from "../../src/design/theme";
import { typography, spacing, radii, shadows, fontFamilies } from "../../src/design/tokens";
import { useProgress } from "../../src/hooks/useProgress";
import { useHabit } from "../../src/hooks/useHabit";
import { LESSONS } from "../../src/data/lessons";
import { getLetter } from "../../src/data/letters";
import {
  getCurrentLesson,
  getLessonsCompletedCount,
  getPhaseCounts,
} from "../../src/engine/selectors";
import { isLessonUnlocked } from "../../src/engine/unlock";
import { getTodayDateString, getDayDifference } from "../../src/engine/dateUtils";
import { resetDatabase } from "../../src/db/client";
import { Alert } from "react-native";

// ── Phase metadata ──

const PHASE_LABELS: Record<number, string> = {
  1: "Letter Recognition",
  2: "Letter Sounds",
  3: "Harakat (Vowels)",
  4: "Connected Forms",
};

// ── Serpentine x-offsets that repeat every 6 nodes ──

const OFFSETS = [4, 16, 8, -4, -12, 0];

// ── Icon helpers ──

function CheckIcon({ size = 16, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockIcon({ size = 14, color = "#6B6760" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ArrowIcon({ size = 16, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 5l7 7m0 0l-7 7m7-7H3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Streak Badge ──

function StreakBadge({ count, colors: c }: { count: number; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.streakBadge, { borderColor: c.border }]}>
      <Text style={{ fontSize: 14, color: c.accent, lineHeight: 16 }}>{"☽"}</Text>
      <Text style={[styles.streakCount, { color: c.text }]}>{count}</Text>
      <Text style={[styles.streakLabel, { color: c.textMuted }]}>Wird</Text>
    </View>
  );
}

// ── Main screen ──

export default function HomeScreen() {
  const colors = useColors();
  const progress = useProgress();
  const { habit } = useHabit();
  const today = getTodayDateString();

  // Redirect to onboarding if user hasn't completed it yet
  const onboarded = progress.onboarded ?? false;
  useEffect(() => {
    if (progress.loading) return;

    if (!onboarded) {
      router.replace("/onboarding" as any);
      return;
    }

    // Check if user should see the return hadith screen
    const lastPractice = habit?.lastPracticeDate;
    const returnHadithLastShown = (progress as any).returnHadithLastShown ?? null;
    if (lastPractice) {
      const gap = getDayDifference(today, lastPractice);
      if (gap >= 1 && returnHadithLastShown !== today) {
        router.replace("/return-welcome" as any);
        return;
      }
    }
  }, [progress.loading, onboarded]);

  const completedLessonIds = progress.completedLessonIds ?? [];
  const mastery = progress.mastery;
  const lessonsCompleted = getLessonsCompletedCount(completedLessonIds);

  // Current lesson to show in hero
  const nextLesson = getCurrentLesson(completedLessonIds);
  const allDone = !nextLesson || completedLessonIds.length >= LESSONS.length;

  // Hero letter
  const heroLetters = nextLesson
    ? (nextLesson.teachIds || []).map((id: number) => getLetter(id)).filter(Boolean)
    : [];
  const heroLetter = heroLetters[0];

  // Current phase label
  const currentPhase = nextLesson?.phase ?? 1;
  const phaseLabel = `Phase ${currentPhase} — ${PHASE_LABELS[currentPhase] ?? ""}`;

  // Journey path: show current phase lessons only
  const currentPhaseLessons = useMemo(
    () => LESSONS.filter((l) => l.phase === currentPhase),
    [currentPhase]
  );

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
    router.push(`/lesson/${lessonId}` as any);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={[styles.appName, { color: colors.text }]}>tila</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {currentWird > 0 && <StreakBadge count={currentWird} colors={colors} />}
            {/* DEV ONLY — remove before shipping */}
            <Pressable
              onPress={() => {
                Alert.alert("Reset Progress", "This will erase all progress and restart onboarding.", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Reset",
                    style: "destructive",
                    onPress: async () => {
                      await resetDatabase();
                      progress.refresh();
                    },
                  },
                ]);
              }}
              style={{ backgroundColor: colors.dangerLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}
            >
              <Text style={{ color: colors.danger, fontSize: 11, fontWeight: "600" }}>DEV RESET</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Hero Card ── */}
        {!allDone && nextLesson ? (
          <Card elevated style={styles.heroCard}>
            {/* Phase label pill */}
            <View style={[styles.phasePill, { backgroundColor: colors.bg }]}>
              <Text style={[styles.phasePillText, { color: colors.accent }]}>{phaseLabel}</Text>
            </View>

            {/* Letter circle */}
            <View style={[styles.letterCircle, { backgroundColor: colors.primarySoft }]}>
              <ArabicText size="display" color={colors.text}>
                {heroLetter ? heroLetter.letter : "?"}
              </ArabicText>
            </View>

            {/* Lesson info */}
            <Text style={[styles.heroTitle, { color: colors.text }]}>{nextLesson.title}</Text>
            <Text style={[styles.heroDescription, { color: colors.textMuted }]}>
              {nextLesson.description}
            </Text>

            {/* CTA button */}
            <Button
              title={
                completedLessonIds.includes(nextLesson.id)
                  ? "Review Lesson"
                  : lessonsCompleted > 0
                    ? "Continue Lesson"
                    : "Start Lesson"
              }
              onPress={() => handleStartLesson(nextLesson.id)}
              style={styles.heroButton}
            />
          </Card>
        ) : (
          <Card elevated style={styles.heroCard}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>All lessons complete!</Text>
            <Text style={[styles.heroDescription, { color: colors.textMuted }]}>
              You have completed all available lessons. Keep reviewing to strengthen your knowledge.
            </Text>
          </Card>
        )}

        {/* ── Journey Path ── */}
        <View style={styles.journeySection}>
          <Text style={[styles.journeySectionTitle, { color: colors.textMuted }]}>
            {phaseLabel.toUpperCase()}
          </Text>

          <View style={styles.journeyPath}>
            {/* Connector line */}
            <View
              style={[
                styles.connectorLine,
                { borderColor: colors.border },
              ]}
            />

            {currentPhaseLessons.map((lesson, i) => {
              const globalIndex = LESSONS.findIndex((l) => l.id === lesson.id);
              const complete = completedLessonIds.includes(lesson.id);
              const isCurrent = lesson.id === nextLesson?.id;
              const unlocked = isLessonUnlocked(
                globalIndex,
                completedLessonIds,
                mastery?.entities || {},
                today
              );
              const locked = !complete && !isCurrent && !unlocked;
              const letters = (lesson.teachIds || []).map((id: number) => getLetter(id));
              const firstLetter = letters[0];
              const offset = OFFSETS[i % OFFSETS.length];

              return (
                <Pressable
                  key={lesson.id}
                  onPress={() => {
                    if (!locked) handleStartLesson(lesson.id);
                  }}
                  disabled={locked}
                  style={[
                    styles.nodeRow,
                    {
                      transform: [{ translateX: offset }],
                      opacity: locked ? 0.4 : complete ? 0.85 : 1,
                    },
                  ]}
                >
                  {/* Node circle */}
                  {complete ? (
                    <View
                      style={[
                        styles.nodeCircle,
                        styles.nodeComplete,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <CheckIcon size={16} color={colors.accent} />
                    </View>
                  ) : isCurrent ? (
                    <View
                      style={[
                        styles.nodeCircle,
                        styles.nodeCurrent,
                        {
                          backgroundColor: colors.bgCard,
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      <View
                        style={[styles.currentDot, { backgroundColor: colors.primary }]}
                      />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.nodeCircle,
                        styles.nodeLocked,
                        {
                          backgroundColor: colors.bg,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      {firstLetter ? (
                        <ArabicText
                          size="body"
                          color={colors.textMuted}
                          style={{ fontSize: 18, lineHeight: 24 }}
                        >
                          {firstLetter.letter}
                        </ArabicText>
                      ) : (
                        <LockIcon size={14} color={colors.textMuted} />
                      )}
                    </View>
                  )}

                  {/* Label */}
                  {isCurrent ? (
                    <View
                      style={[
                        styles.currentLabel,
                        {
                          backgroundColor: colors.bgCard,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.currentLabelTitle, { color: colors.text }]}>
                        {lesson.title}
                      </Text>
                      <View style={styles.upNextRow}>
                        <View style={[styles.upNextDot, { backgroundColor: colors.accent }]} />
                        <Text style={[styles.upNextText, { color: colors.accent }]}>Up next</Text>
                      </View>
                    </View>
                  ) : (
                    <View>
                      <Text
                        style={[
                          styles.nodeTitle,
                          { color: locked ? colors.textMuted : colors.text },
                        ]}
                      >
                        {lesson.title}
                      </Text>
                      <Text
                        style={[
                          styles.nodeSubtitle,
                          { color: locked ? colors.textMuted : colors.textSoft },
                        ]}
                      >
                        {complete ? "Completed" : locked ? "Locked" : "Available"}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

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
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  appName: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 22,
    letterSpacing: 0.8,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
  },
  streakCount: {
    fontSize: 13,
    fontFamily: fontFamilies.bodySemiBold,
  },
  streakLabel: {
    fontSize: 11,
    fontFamily: fontFamilies.bodyMedium,
  },

  // Hero card
  heroCard: {
    alignItems: "center",
    marginBottom: spacing.xxl,
    borderRadius: radii.xl,
    paddingVertical: spacing.xxl,
  },
  phasePill: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 9999,
    marginBottom: spacing.lg,
  },
  phasePillText: {
    fontSize: 10,
    fontFamily: fontFamilies.bodyBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  letterCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  heroTitle: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 22,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  heroDescription: {
    fontSize: 14,
    fontFamily: fontFamilies.bodyRegular,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.sm,
  },
  heroButton: {
    width: "100%",
  },

  // Journey section
  journeySection: {
    marginTop: spacing.lg,
  },
  journeySectionTitle: {
    fontSize: 10,
    fontFamily: fontFamilies.bodyBold,
    letterSpacing: 1.2,
    marginBottom: spacing.xl,
  },
  journeyPath: {
    position: "relative",
    paddingLeft: 32,
    paddingVertical: spacing.sm,
  },
  connectorLine: {
    position: "absolute",
    left: 50,
    top: 0,
    bottom: 0,
    width: 0,
    borderLeftWidth: 2,
    borderStyle: "dashed",
  },

  // Nodes
  nodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 44,
  },
  nodeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  nodeComplete: {
    ...shadows.soft,
  },
  nodeCurrent: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    ...shadows.card,
  },
  nodeLocked: {
    borderWidth: 2,
  },
  currentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  currentLabel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    ...shadows.card,
  },
  currentLabelTitle: {
    fontFamily: fontFamilies.headingBold,
    fontSize: 15,
  },
  upNextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  upNextDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  upNextText: {
    fontSize: 11,
    fontFamily: fontFamilies.bodySemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  nodeTitle: {
    fontSize: 15,
    fontFamily: fontFamilies.bodyMedium,
  },
  nodeSubtitle: {
    fontSize: 12,
    fontFamily: fontFamilies.bodyRegular,
    marginTop: 2,
  },
});
