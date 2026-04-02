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
import { router } from "expo-router";
import { ErrorBoundary } from "react-error-boundary";
import * as Sentry from "@sentry/react-native";
import { useColors } from "../../src/design/theme";
import { ScreenErrorFallback } from "../../src/components/feedback/ScreenErrorFallback";
import { spacing, typography, fontFamilies, radii } from "../../src/design/tokens";
import { durations, easings } from "../../src/design/animations";
import { WarmGradient } from "../../src/design/components";
import { CrescentIcon } from "../../src/design/CrescentIcon";
import { useProgress } from "../../src/hooks/useProgress";
import { useHabit } from "../../src/hooks/useHabit";
import { useSubscription, FREE_LESSON_CUTOFF, usePremiumReviewRights } from "../../src/monetization/hooks";
import { loadPremiumLessonGrants } from "../../src/engine/progress";
import { useDatabase } from "../../src/db/provider";
import { LESSONS } from "../../src/data/lessons";
import {
  getCurrentLesson,
  getLessonsCompletedCount,
  getLearnedLetterIds,
  planReviewSession,
} from "../../src/engine/selectors";
import { getTodayDateString, getDayDifference } from "../../src/engine/dateUtils";
import { AnimatedStreakBadge } from "../../src/components/home/AnimatedStreakBadge";
import { TrialCountdownBadge } from "../../src/components/monetization/TrialCountdownBadge";
import { WirdTooltip } from "../../src/components/home/WirdTooltip";
import HeroCard from "../../src/components/home/HeroCard";
import LessonGrid from "../../src/components/home/LessonGrid";
import { hapticTap } from "../../src/design/haptics";
import {
  getGreetingLine1,
  getMotivationSubtitle,
  MOTIVATION_SUBTITLES,
} from "../../src/utils/greetingHelpers";
import Svg, { Circle, Path } from "react-native-svg";

// ── Logo Mark ──

function TilaLogoMark({ size = 28, color = "#163323" }: { size?: number; color?: string }) {
  const s = size / 28; // scale factor from base 28
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

// ── Phase labels ──

const PHASE_LABELS: Record<number, string> = {
  1: "Letter Recognition",
  2: "Letter Sounds",
  3: "Harakat (Vowels)",
  4: "Connected Forms",
};

// ── Momentum copy ──

function getMomentumCopy(
  completedIds: number[],
  currentPhase: number
): { line1: string; line2: string } | null {
  const phaseLabel = PHASE_LABELS[currentPhase];
  if (!phaseLabel) return null;

  const phaseLessons = LESSONS.filter((l) => l.phase === currentPhase);
  const phaseCompleted = phaseLessons.filter((l) => completedIds.includes(l.id)).length;

  if (phaseCompleted === 0) return null;
  if (phaseCompleted >= phaseLessons.length) return null;

  const ratio = phaseCompleted / phaseLessons.length;

  if (ratio < 0.25) {
    return {
      line1: `You\u2019ve started ${phaseLabel}.`,
      line2: "Complete a few more lessons to build momentum.",
    };
  }
  if (ratio < 0.5) {
    return {
      line1: `You\u2019re making progress in ${phaseLabel}.`,
      line2: "Keep going \u2014 you\u2019re building a strong foundation.",
    };
  }
  if (ratio < 0.75) {
    return {
      line1: `Over halfway through ${phaseLabel}!`,
      line2: "The finish line is getting closer.",
    };
  }
  return {
    line1: `Almost done with ${phaseLabel}.`,
    line2: "Just a few more lessons to complete this phase.",
  };
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

// ── Review Card ──

function ReviewCard({
  totalItems,
  isUrgent,
  hasUnstable,
  colors,
  onStart,
  enterDelay = 0,
}: {
  totalItems: number;
  isUrgent: boolean;
  hasUnstable: boolean;
  colors: any;
  onStart: () => void;
  enterDelay?: number;
}) {
  const headline = isUrgent ? "Strengthen your letters" : "Review ready";
  const subtitle = hasUnstable
    ? "Some letters need more practice before you move on."
    : totalItems >= 4
      ? "Keep your letters solid \u2014 a few minutes will help."
      : `${totalItems} letter${totalItems !== 1 ? "s" : ""} to revisit.`;

  // Entrance animation — opacity only, no layout shift
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withDelay(
      enterDelay,
      withTiming(1, { duration: durations.slow, easing: easings.contentReveal }),
    );
  }, []);
  const entranceStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={entranceStyle}>
      <View
        style={[
          styles.reviewCard,
          isUrgent ? styles.reviewCardUrgent : styles.reviewCardNormal,
          {
            backgroundColor: isUrgent ? colors.accentLight : colors.bgCard,
            borderColor: isUrgent ? colors.accent : colors.border,
          },
        ]}
      >
        <View style={styles.reviewRow}>
          {/* Icon circle */}
          <View
            style={[
              styles.reviewIcon,
              { backgroundColor: isUrgent ? colors.accent : colors.primarySoft },
            ]}
          >
            <CrescentIcon size={18} color={isUrgent ? colors.white : colors.primary} />
          </View>

          {/* Text */}
          <View style={styles.reviewTextWrap}>
            <Text style={[styles.reviewHeadline, { color: colors.text }]}>{headline}</Text>
            <Text style={[styles.reviewSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          </View>

          {/* Inline button (non-urgent) */}
          {!isUrgent && (
            <Pressable
              onPress={() => { hapticTap(); onStart(); }}
              style={[styles.reviewInlineBtn, { borderColor: colors.primary }]}
            >
              <Text style={[styles.reviewInlineBtnText, { color: colors.primary }]}>Quick review</Text>
            </Pressable>
          )}
        </View>

        {/* Full-width CTA (urgent) */}
        {isUrgent && (
          <Pressable
            onPress={() => { hapticTap(); onStart(); }}
            style={[styles.reviewFullBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.reviewFullBtnText, { color: colors.white }]}>Quick review</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

// ── Momentum Banner ──

function MomentumBanner({
  momentum,
  colors,
  enterDelay = 0,
}: {
  momentum: { line1: string; line2: string };
  colors: any;
  enterDelay?: number;
}) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withDelay(
      enterDelay,
      withTiming(1, { duration: durations.slow, easing: easings.contentReveal }),
    );
  }, []);
  const entranceStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={entranceStyle}>
      <View
        style={[
          styles.momentumBanner,
          {
            backgroundColor: colors.accentLight,
            borderLeftColor: colors.accent,
          },
        ]}
      >
        <Text style={[styles.momentumLine1, { color: colors.textSoft }]}>
          <Text style={{ color: colors.accent, fontSize: 12 }}>{"\u2726"} </Text>
          {momentum.line1}
        </Text>
        <Text style={[styles.momentumLine2, { color: colors.textMuted }]}>
          {momentum.line2}
        </Text>
      </View>
    </Animated.View>
  );
}

// ── Main screen ──

export default function HomeScreen() {
  const colors = useColors();
  const db = useDatabase();
  const progress = useProgress();
  const { updateProfile } = progress;
  const { habit } = useHabit();
  const { isPremiumActive, stage, trialDaysRemaining, showPaywall, loading: subLoading } = useSubscription();
  const [today] = useState(() => getTodayDateString());

  const [grantedLessonIds, setGrantedLessonIds] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadGrants() {
      try {
        const grants = await loadPremiumLessonGrants(db);
        if (!cancelled) setGrantedLessonIds(grants);
      } catch (e) {
        console.warn("Failed to load premium grants:", e);
        if (!cancelled) setGrantedLessonIds([]);
      }
    }

    if (!progress.loading) loadGrants();

    return () => { cancelled = true; };
  }, [db, progress.loading]);

  const reviewableLetterIds = usePremiumReviewRights(grantedLessonIds);

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
  const onboarded = progress.onboarded ?? false;
  const returnHadithLastShown = progress.returnHadithLastShown ?? null;

  useEffect(() => {
    if (progress.loading) return;

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
  }, [progress.loading, onboarded, habit?.lastPracticeDate, today, returnHadithLastShown]);

  const completedLessonIds = progress.completedLessonIds ?? [];
  const mastery = progress.mastery;
  const dailyGoal = useMemo(() => goalMinutesToLessons(progress.onboardingDailyGoal ?? null), [progress.onboardingDailyGoal]);

  // Memoize expensive selector computations
  const lessonsCompleted = useMemo(() => getLessonsCompletedCount(completedLessonIds), [completedLessonIds]);
  const learnedLetterIds = useMemo(() => getLearnedLetterIds(completedLessonIds), [completedLessonIds]);
  const nextLesson = useMemo(() => getCurrentLesson(completedLessonIds), [completedLessonIds]);
  const reviewPlan = useMemo(() => {
    if (!mastery) return null;
    const plan = planReviewSession(mastery, today);

    // If user is premium, no filtering needed
    if (isPremiumActive) return plan;

    // For free/expired users, filter review items to only reviewable letters
    const filteredItems = plan.items.filter((key: string) => {
      const match = key.match(/^letter:(\d+)$/);
      if (!match) return true; // keep non-letter items (combos, etc.)
      return reviewableLetterIds.includes(parseInt(match[1], 10));
    });

    return {
      ...plan,
      items: filteredItems,
      totalItems: filteredItems.length,
      hasReviewWork: filteredItems.length > 0,
    };
  }, [mastery, today, isPremiumActive, reviewableLetterIds]);

  const allDone = !nextLesson || completedLessonIds.length >= LESSONS.length;
  const currentPhase = nextLesson?.phase ?? 1;

  // Wird streak + daily count
  const currentWird = habit?.currentWird ?? 0;
  const todayLessonCount = habit?.todayLessonCount ?? 0;

  // Review data
  const hasReview = reviewPlan?.hasReviewWork ?? false;
  const isReviewUrgent = reviewPlan?.isUrgent ?? false;

  // Momentum
  const momentum = useMemo(() => getMomentumCopy(completedLessonIds, currentPhase), [completedLessonIds, currentPhase]);

  // Personalized greeting
  const userName = progress.userName ?? null;
  const motivation = progress.onboardingMotivation ?? null;

  const greetingLine1 = useMemo(() => getGreetingLine1(userName), [userName]);
  const greetingLine2 = useMemo(
    () => getMotivationSubtitle(motivation, lessonsCompleted, learnedLetterIds.length),
    [motivation, lessonsCompleted, learnedLetterIds.length]
  );

  // Wird tooltip
  const [showWirdTooltip, setShowWirdTooltip] = useState(false);

  useEffect(() => {
    if (currentWird > 0 && !progress.wirdIntroSeen) {
      setShowWirdTooltip(true);
    }
  }, [currentWird, progress.wirdIntroSeen]);

  const handleWirdTooltipDismiss = useCallback(async () => {
    setShowWirdTooltip(false);
    await updateProfile({ wirdIntroSeen: true });
  }, [updateProfile]);

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

  function handleStartReview() {
    router.push('/lesson/review');
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
            <WirdTooltip visible={showWirdTooltip} onDismiss={handleWirdTooltipDismiss} />
          </Animated.View>
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
        {stage === "expired" && (
          <Pressable onPress={() => showPaywall("expired_card")}>
            <Text style={[styles.trialBadge, { color: colors.accent, backgroundColor: colors.accentLight }]}>
              Your trial has ended.
            </Text>
          </Pressable>
        )}

        {/* ── Upgrade Card (expired users) ── */}
        {stage === "expired" && (
          <Pressable
            onPress={() => showPaywall("expired_card")}
            style={[styles.upgradeCard, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}
          >
            <Text style={[styles.upgradeCardTitle, { color: colors.text }]}>
              Upgrade to Continue
            </Text>
            <Text style={[styles.upgradeCardSub, { color: colors.textSoft }]}>
              Pick up where you left off with Tila Premium.
            </Text>
          </Pressable>
        )}

        {/* ── Urgent Review (above hero) ── */}
        {hasReview && isReviewUrgent && (
          <View style={styles.sectionGap}>
            <ReviewCard
              totalItems={reviewPlan!.totalItems}
              isUrgent={true}
              hasUnstable={(reviewPlan!.unstable?.length ?? 0) > 0}
              colors={colors}
              onStart={handleStartReview}
              enterDelay={100}
            />
          </View>
        )}

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

        {/* ── Non-urgent Review (below hero) ── */}
        {hasReview && !isReviewUrgent && (
          <View style={styles.sectionGap}>
            <ReviewCard
              totalItems={reviewPlan!.totalItems}
              isUrgent={false}
              hasUnstable={false}
              colors={colors}
              onStart={handleStartReview}
              enterDelay={140}
            />
          </View>
        )}

        {/* ── Momentum Banner ── */}
        {momentum && (
          <View style={styles.sectionGapTight}>
            <MomentumBanner momentum={momentum} colors={colors} enterDelay={150} />
          </View>
        )}

        {/* ── Upsell Card (free users past lesson 7) ── */}
        {stage === "free" && completedLessonIds.includes(FREE_LESSON_CUTOFF) && (
          <Pressable
            onPress={() => showPaywall("home_upsell")}
            style={[styles.upsellCard, { backgroundColor: colors.primarySoft, borderColor: "rgba(22,51,35,0.1)" }]}
          >
            <Text style={[styles.upsellCardText, { color: colors.primary }]}>
              Unlock all lessons &#x2192;
            </Text>
          </Pressable>
        )}

        {/* ── Journey Path ── */}
        <LessonGrid
          currentPhase={currentPhase}
          nextLessonId={nextLesson?.id ?? null}
          completedLessonIds={completedLessonIds}
          onStartLesson={handleStartLesson}
          enterDelay={160}
          isPremiumActive={isPremiumActive}
          subscriptionLoading={subLoading}
          onLockedLessonPress={async (lessonId: number) => {
            const outcome = await showPaywall("lesson_locked");
            if (outcome.accessGranted) {
              router.push({ pathname: "/lesson/[id]", params: { id: String(lessonId) } });
            }
          }}
        />

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

  // Section gaps — consistent vertical rhythm
  sectionGap: {
    marginBottom: spacing.xl,
  },
  sectionGapTight: {
    marginBottom: spacing.lg,
  },

  // Review card
  reviewCard: {
    borderRadius: 20,
    overflow: "hidden",
  },
  reviewCardNormal: {
    padding: spacing.lg,
    borderWidth: 1,
    shadowColor: "#163323",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  reviewCardUrgent: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderWidth: 1.5,
    shadowColor: "#C4A464",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  reviewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  reviewTextWrap: {
    flex: 1,
  },
  reviewHeadline: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 15,
  },
  reviewSubtitle: {
    fontSize: 12,
    fontFamily: fontFamilies.bodyRegular,
    lineHeight: 17,
    marginTop: 3,
  },
  reviewInlineBtn: {
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1.5,
  },
  reviewInlineBtnText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
  },
  reviewFullBtn: {
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 14,
    alignItems: "center",
  },
  reviewFullBtnText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
  },

  // Upgrade card (expired)
  upgradeCard: {
    borderRadius: radii.xxl,
    borderWidth: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  upgradeCardTitle: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  upgradeCardSub: {
    fontSize: 13,
    fontFamily: fontFamilies.bodyRegular,
  },

  // Upsell card (free users past lesson 7)
  upsellCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  upsellCardText: {
    fontSize: 13,
    fontFamily: fontFamilies.bodySemiBold,
  },

  // Momentum banner
  momentumBanner: {
    borderLeftWidth: 3,
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  momentumLine1: {
    fontSize: 14,
    fontFamily: fontFamilies.bodyRegular,
    lineHeight: 21,
    marginBottom: 3,
  },
  momentumLine2: {
    fontSize: 13,
    fontFamily: fontFamilies.bodyRegular,
    lineHeight: 20,
    paddingLeft: 18,
  },
});
