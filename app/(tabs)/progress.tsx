import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable,
  Linking,
} from "react-native";
import { useState, useEffect, useMemo, useCallback } from "react";
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
import Purchases from "react-native-purchases";
import { useProgress } from "../../src/hooks/useProgress";
import { useDatabase } from "../../src/db/provider";
import { useSubscription } from "../../src/monetization/hooks";
import { trackRestoreCompleted, trackRestoreFailed } from "../../src/monetization/analytics";
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
import { PhaseDetailSheet } from "../../src/components/progress/PhaseDetailSheet";
import { EmptyState } from "../../src/components/feedback/EmptyState";
import { groupReviewsByDay, parseConfusionPairs } from "../../src/engine/insights";
import { ConfusionPairsSection } from "../../src/components/insights/ConfusionPairsSection";
import { ReviewScheduleSection } from "../../src/components/insights/ReviewScheduleSection";
import { FriendsList } from "../../src/components/social/FriendsList";
import { InviteCard } from "../../src/components/social/InviteCard";
import { useAuth } from "../../src/auth/hooks";

// ── Privacy policy URL ──
// Replace this with the hosted URL before App Store submission
const PRIVACY_POLICY_URL = "https://tila-app.github.io/privacy/";

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
  const { isAnonymous } = useAuth();

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

  const [restoring, setRestoring] = useState(false);
  const { stage, refresh } = useSubscription();

  const handleRestorePurchases = useCallback(async () => {
    setRestoring(true);
    try {
      const info = await Purchases.restorePurchases();
      const activeCount = Object.keys(info.entitlements.active).length;
      trackRestoreCompleted({ success: true, entitlements_restored: activeCount });
      await refresh();
      Alert.alert(
        activeCount > 0 ? "Purchases Restored" : "No Purchases Found",
        activeCount > 0
          ? "Your subscription has been restored."
          : "We couldn't find any previous purchases for this account.",
        [{ text: "OK" }]
      );
    } catch {
      trackRestoreFailed({});
      Alert.alert(
        "Restore Failed",
        "Please check your internet connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setRestoring(false);
    }
  }, [refresh]);

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

  // Phase detail sheet state
  const [selectedPhase, setSelectedPhase] = useState<{
    key: number;
    label: string;
  } | null>(null);

  const handlePhasePress = useCallback(
    (key: number, label: string) => {
      setSelectedPhase({ key, label });
    },
    []
  );

  const handlePhaseClose = useCallback(() => {
    setSelectedPhase(null);
  }, []);

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

  // ── Insight data ──
  const confusionPairs = useMemo(
    () => parseConfusionPairs(mastery.confusions ?? {}, 5),
    [mastery.confusions]
  );

  const reviewGroups = useMemo(
    () => groupReviewsByDay(mastery.entities ?? {}, today),
    [mastery.entities, today]
  );

  // ── Staggered entrance animations ──
  const statsOpacity = useSharedValue(0);
  const statsTranslateY = useSharedValue(12);
  const insightsOpacity = useSharedValue(0);
  const insightsTranslateY = useSharedValue(12);
  const phasesOpacity = useSharedValue(0);
  const phasesTranslateY = useSharedValue(12);
  const masteryOpacity = useSharedValue(0);
  const masteryTranslateY = useSharedValue(12);

  useEffect(() => {
    const timingConfig = { duration: durations.normal, easing: easings.contentReveal };

    // Stats section (immediate)
    statsOpacity.value = withTiming(1, timingConfig);
    statsTranslateY.value = withTiming(0, timingConfig);

    // Insights section (staggered after stats)
    insightsOpacity.value = withDelay(staggers.normal.delay, withTiming(1, timingConfig));
    insightsTranslateY.value = withDelay(staggers.normal.delay, withTiming(0, timingConfig));

    // Phases section (staggered after insights)
    phasesOpacity.value = withDelay(staggers.normal.delay * 2, withTiming(1, timingConfig));
    phasesTranslateY.value = withDelay(staggers.normal.delay * 2, withTiming(0, timingConfig));

    // Mastery section (more stagger)
    masteryOpacity.value = withDelay(staggers.normal.delay * 3, withTiming(1, timingConfig));
    masteryTranslateY.value = withDelay(staggers.normal.delay * 3, withTiming(0, timingConfig));
  }, []);

  const statsAnimStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
    transform: [{ translateY: statsTranslateY.value }],
  }));

  const insightsAnimStyle = useAnimatedStyle(() => ({
    opacity: insightsOpacity.value,
    transform: [{ translateY: insightsTranslateY.value }],
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

        {/* ── Insight Sections (value communication) ── */}
        <Animated.View style={insightsAnimStyle}>
          <View style={{ marginTop: spacing.xl }}>
            <ConfusionPairsSection confusionPairs={confusionPairs} />
            <ReviewScheduleSection reviewGroups={reviewGroups} />
          </View>
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
                onPress={() => handlePhasePress(phase.key, phase.label)}
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

        {/* ── Friends Section (authenticated users only) ── */}
        {!isAnonymous && (
          <View style={{ marginTop: spacing.xxxxl }}>
            <Text
              style={[
                typography.sectionHeader,
                { color: colors.brownLight, marginBottom: spacing.sm },
              ]}
            >
              Friends
            </Text>
            <InviteCard />
            <FriendsList />
          </View>
        )}

        {/* Restore purchases — shown for non-premium users */}
        {stage !== "trial" && stage !== "paid" && (
          <Pressable
            onPress={handleRestorePurchases}
            disabled={restoring}
            style={[styles.restoreButton, { borderColor: colors.border }]}
          >
            {restoring ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[typography.bodySmall, { color: colors.primary }]}>
                Restore Purchases
              </Text>
            )}
          </Pressable>
        )}

        {/* Privacy Policy */}
        <Pressable
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          style={styles.privacyLink}
        >
          <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
            Privacy Policy
          </Text>
        </Pressable>

        {/* Contact Support */}
        <Pressable
          onPress={() => Linking.openURL('mailto:nasif.c7@gmail.com')}
          style={styles.privacyLink}
        >
          <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
            Contact Support
          </Text>
        </Pressable>

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

      {/* Phase detail sheet */}
      <PhaseDetailSheet
        phaseKey={selectedPhase?.key ?? null}
        phaseLabel={selectedPhase?.label ?? ""}
        completedLessonIds={completedLessonIds}
        currentLessonId={currentLesson.id}
        visible={selectedPhase !== null}
        onClose={handlePhaseClose}
      />
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
  restoreButton: {
    alignSelf: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: spacing.xxxl,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  privacyLink: {
    alignSelf: "center",
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
  },
  resetButton: {
    marginTop: spacing.xxxxl,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderTopWidth: 1,
  },
});
