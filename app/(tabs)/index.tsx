import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useMemo, useCallback } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import { ErrorBoundary } from "react-error-boundary";
import * as Sentry from "@sentry/react-native";
import { useColors } from "../../src/design/theme";
import { ScreenErrorFallback } from "../../src/components/feedback/ScreenErrorFallback";
import { spacing, typography, fontFamilies, radii } from "../../src/design/tokens";
import { durations, easings } from "../../src/design/animations";
import { WarmGradient } from "../../src/design/components";
import { useAppState } from "../../src/state/hooks";
import { useSubscription } from "../../src/monetization/hooks";
import { getTodayDateString, getDayDifference } from "../../src/engine/dateUtils";
import { LessonGrid } from "../../src/components/home/LessonGrid";
import { lessonRegistry } from "../../src/curriculum/lessons";
import { progressStore } from "../../src/curriculum/runtime/progress-store";
import {
  deriveLessonGridState,
  type LessonCell,
} from "../../src/curriculum/runtime/grid-state";
import { AnimatedStreakBadge } from "../../src/components/home/AnimatedStreakBadge";
import { TrialCountdownBadge } from "../../src/components/monetization/TrialCountdownBadge";
import { WirdTooltip } from "../../src/components/home/WirdTooltip";
import {
  getGreetingLine1,
  getMotivationSubtitle,
} from "../../src/utils/greetingHelpers";
import Svg, { Circle, Path } from "react-native-svg";

// ── Logo Mark ──

function TilaLogoMark({ size = 28, color = "#163323" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* Crescent */}
      <Circle cx="14" cy="12" r="8" fill={color} />
      <Circle cx="17" cy="10" r="6.5" fill="#F8F6F0" />
      {/* Arch */}
      <Path
        d="M6 26 L6 14 Q6 2 14 1 Q22 2 22 14 L22 26"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        fill="none"
        opacity={0.5}
      />
      {/* Keystone */}
      <Circle cx="14" cy="1" r="1.2" fill={color} opacity={0.6} />
    </Svg>
  );
}

// ── Constants ──

const SCROLL_BOTTOM_INSET = 96;
const DEFAULT_DAILY_GOAL = 1;
// Convert minutes → lesson count (avg ~3 min/lesson)
function goalMinutesToLessons(minutes: number | null): number {
  if (!minutes) return DEFAULT_DAILY_GOAL;
  if (minutes <= 3) return 1;
  if (minutes <= 5) return 2;
  return 3; // 10 min
}

// ── Daily Goal Pill ──

function DailyGoalPill({
  todayCount,
  goal,
  colors,
}: {
  todayCount: number;
  goal: number;
  colors: any;
}) {
  const done = Math.min(todayCount, goal);
  return (
    <View style={[styles.dailyPill, { borderColor: colors.border }]}>
      <Text style={[styles.dailyPillLabel, { color: colors.textMuted }]}>Today</Text>
      <Text style={[styles.dailyPillCount, { color: colors.text }]}>
        {done}/{goal}
      </Text>
    </View>
  );
}

// ── Module-level constants ──

const LESSON_IDS = [
  "lesson-01",
  "lesson-02",
  "lesson-03",
  "lesson-04",
  "lesson-05",
  "lesson-06",
  "lesson-07",
  "lesson-08",
];

// ── Main screen ──

export default function HomeScreen() {
  const colors = useColors();
  const appState = useAppState();
  const { updateProfile } = appState;
  const progress = appState.progress;
  const habit = appState.habit;
  const loading = appState.loading;
  const { stage, trialDaysRemaining, showPaywall } = useSubscription();
  const [today] = useState(() => getTodayDateString());

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

  // Greeting entrance
  const greetingOpacity = useSharedValue(0);
  const greetingY = useSharedValue(8);

  useEffect(() => {
    greetingOpacity.value = withDelay(60, withTiming(1, { duration: durations.slow, easing: easings.contentReveal }));
    greetingY.value = withDelay(60, withTiming(0, { duration: durations.slow, easing: easings.contentReveal }));
  }, []);

  const greetingEntranceStyle = useAnimatedStyle(() => ({
    opacity: greetingOpacity.value,
    transform: [{ translateY: greetingY.value }],
  }));

  // Redirect to onboarding if user hasn't completed it yet
  const onboarded = progress?.onboarded ?? false;
  const returnHadithLastShown = progress?.returnHadithLastShown ?? null;

  useEffect(() => {
    if (loading) return;

    if (!onboarded) {
      router.replace("/onboarding");
      return;
    }

    const lastPractice = habit?.lastPracticeDate;
    if (lastPractice) {
      const gap = getDayDifference(today, lastPractice);
      if (gap >= 1 && returnHadithLastShown !== today) {
        router.replace("/return-welcome");
        return;
      }
    }
  }, [loading, onboarded, habit?.lastPracticeDate, today, returnHadithLastShown]);

  const dailyGoal = useMemo(() => goalMinutesToLessons(progress?.onboardingDailyGoal ?? null), [progress?.onboardingDailyGoal]);

  // Wird streak + daily count
  const currentWird = habit?.currentWird ?? 0;
  const todayLessonCount = habit?.todayLessonCount ?? 0;

  // Personalized greeting
  const userName = progress?.userName ?? null;
  const motivation = progress?.onboardingMotivation ?? null;

  const greetingLine1 = useMemo(() => getGreetingLine1(userName), [userName]);
  const greetingLine2 = useMemo(
    () => getMotivationSubtitle(motivation, 0, 0),
    [motivation]
  );

  // Lesson grid state
  const [cells, setCells] = useState<LessonCell[]>(() =>
    LESSON_IDS.map((id, idx) => ({
      lessonId: id,
      state: idx === 0 ? "current" : "locked",
    }))
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      progressStore.getProgress().then((progress) => {
        if (!cancelled) setCells(deriveLessonGridState(LESSON_IDS, progress));
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const lessonTitles = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const id of LESSON_IDS) {
      map[id] = lessonRegistry[id]?.title ?? `Lesson ${parseInt(id.split("-")[1] ?? "0", 10)}`;
    }
    return map;
  }, []);

  const handleLessonPress = (lessonId: string) => {
    if (!lessonRegistry[lessonId]) return; // not yet authored — guard
    const num = parseInt(lessonId.split("-")[1] ?? "0", 10);
    router.push({ pathname: "/lesson/[id]", params: { id: String(num) } });
  };

  // Wird tooltip
  const [showWirdTooltip, setShowWirdTooltip] = useState(false);

  useEffect(() => {
    if (currentWird > 0 && !progress?.wirdIntroSeen) {
      setShowWirdTooltip(true);
    }
  }, [currentWird, progress?.wirdIntroSeen]);

  const handleWirdTooltipDismiss = useCallback(async () => {
    setShowWirdTooltip(false);
    await updateProfile({ wirdIntroSeen: true });
  }, [updateProfile]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary
      onError={(error, info) => {
        Sentry.captureException(error, {
          extra: { componentStack: info.componentStack },
        });
      }}
      FallbackComponent={ScreenErrorFallback}
    >
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      <WarmGradient color={colors.bgWarm} height={300} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Animated.View style={[styles.headerBrand, headerEntranceStyle]}>
            <TilaLogoMark size={28} color={colors.primary} />
            <Text style={[styles.appName, { color: colors.brown }]}>tila</Text>
          </Animated.View>
          <Animated.View style={[styles.headerRight, headerEntranceStyle]}>
            {dailyGoal > 0 && (
              <DailyGoalPill todayCount={todayLessonCount} goal={dailyGoal} colors={colors} />
            )}
            {stage === "trial" && trialDaysRemaining !== null && (
              <TrialCountdownBadge daysLeft={trialDaysRemaining} />
            )}
            {currentWird > 0 && <AnimatedStreakBadge count={currentWird} enterDelay={200} />}
          </Animated.View>
          <WirdTooltip visible={showWirdTooltip} onDismiss={handleWirdTooltipDismiss} />
        </View>

        {/* ── Greeting ── */}
        <Animated.View style={[styles.greeting, greetingEntranceStyle]}>
          <Text style={[styles.greetingLabel, { color: colors.textMuted }]}>
            {greetingLine1}
          </Text>
          <Text style={[styles.greetingTitle, { color: colors.text }]}>
            {greetingLine2}
          </Text>
        </Animated.View>

        {/* Trial badge — progressive urgency */}
        {stage === "trial" && trialDaysRemaining != null && (
          <Pressable onPress={() => showPaywall("home_upsell")}>
            <Text style={[
              styles.trialBadge,
              {
                color: trialDaysRemaining <= 2 ? colors.accent : colors.textMuted,
                backgroundColor: trialDaysRemaining <= 2 ? colors.accentLight : "transparent",
              }
            ]}>
              {trialDaysRemaining <= 2
                ? `Your trial ends in ${trialDaysRemaining} day${trialDaysRemaining !== 1 ? "s" : ""}. Subscribe to keep learning.`
                : `Trial \u00B7 ${trialDaysRemaining} days left`}
            </Text>
          </Pressable>
        )}

        {/* ── Lesson grid (8 cells, sequential unlock) ── */}
        <LessonGrid cells={cells} titles={lessonTitles} onPress={handleLessonPress} />

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
    </ErrorBoundary>
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
    marginBottom: spacing.md,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  appName: {
    ...typography.pageTitle,
  },

  // Daily goal pill
  dailyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: spacing.xs,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  dailyPillLabel: {
    fontSize: 11,
    fontFamily: fontFamilies.bodyMedium,
  },
  dailyPillCount: {
    fontSize: 12,
    fontFamily: fontFamilies.bodySemiBold,
  },

  // Greeting
  greeting: {
    marginBottom: spacing.xl,
  },
  greetingLabel: {
    fontSize: 11,
    fontFamily: fontFamilies.bodySemiBold,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  greetingTitle: {
    fontFamily: fontFamilies.headingRegular,
    fontSize: 28,
    lineHeight: 33,
  },

  // Trial badge
  trialBadge: {
    fontSize: 12,
    fontFamily: fontFamilies.bodyMedium,
    textAlign: "center" as const,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    overflow: "hidden" as const,
    marginBottom: spacing.sm,
  },

});
