import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions } from "react-native";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  useDerivedValue,
  runOnJS,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useAudioPlayer } from "expo-audio";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../design/theme";
import { typography, spacing, radii, fontFamilies } from "../design/tokens";
import { Button, ArabicText, WarmGradient } from "../design/components";
import { getSFXAsset } from "../audio/player";
import {
  getCompletionTier,
  getSummaryMessaging,
  COMPLETION_HEADLINES,
  COMPLETION_SUBLINES,
  CLOSING_QUOTES,
  pickCopy,
} from "../engine/engagement";
import { WarmGlow } from "./onboarding/WarmGlow";
import { hapticMilestone, hapticSuccess, hapticTap } from "../design/haptics";
import { getLetter } from "../data/letters";
import { LESSONS } from "../data/lessons";

// ── Confetti burst — lightweight particle overlay ──

const CONFETTI_COLORS = ["#163323", "#C4A464", "#255038", "#F5EDDB", "#EBE6DC"];
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ConfettiParticle {
  x: number;
  targetX: number;
  targetY: number;
  color: string;
  size: number;
  delay: number;
}

function generateParticles(count: number, originY: number): ConfettiParticle[] {
  const cx = SCREEN_WIDTH / 2;
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const distance = 80 + Math.random() * 120;
    return {
      x: cx,
      targetX: Math.cos(angle) * distance,
      targetY: Math.sin(angle) * distance + 60 + Math.random() * 80, // gravity bias
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 4 + Math.random() * 4,
      delay: Math.random() * 150,
    };
  });
}

function ConfettiDot({ particle }: { particle: ConfettiParticle }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateX.value = withDelay(
      particle.delay,
      withTiming(particle.targetX, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
    translateY.value = withDelay(
      particle.delay,
      withTiming(particle.targetY, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
    opacity.value = withDelay(
      particle.delay + 400,
      withTiming(0, { duration: 300 })
    );
    scale.value = withDelay(
      particle.delay + 300,
      withTiming(0, { duration: 400, easing: Easing.in(Easing.cubic) })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          backgroundColor: particle.color,
        },
        style,
      ]}
    />
  );
}

function ConfettiBurst({ isPerfect }: { isPerfect: boolean }) {
  const particles = useMemo(
    () => generateParticles(isPerfect ? 24 : 14, SCREEN_HEIGHT * 0.35),
    [isPerfect]
  );

  return (
    <View style={confettiStyles.container} pointerEvents="none">
      {particles.map((p, i) => (
        <ConfettiDot key={i} particle={p} />
      ))}
    </View>
  );
}

const confettiStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
});

// ── Types ──

interface LessonSummaryProps {
  lesson: any;
  results: { correct: number; total: number; questions: any[] };
  passed: boolean;
  accuracy: number; // 0-1
  threshold?: number | null; // pass threshold (0-1), null = no gating
  goalCompleted?: boolean;
  onContinue: () => void;
  onRetry: () => void;
  onBack?: () => void;
}

// ── Icons ──

function CheckIcon({ size, color }: { size: number; color: string }) {
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

// ── Encouragement quotes for failed lessons (from web) ──

const ENCOURAGEMENT_QUOTES = [
  "The one who struggles with the Quran receives a double reward.",
  "Every attempt is a seed planted.",
  "Patience is the companion of wisdom.",
  "Difficulty is the path to understanding.",
  "Return to it gently \u2014 that is the way.",
];

// ── Mastery breakdown for checkpoint/review summaries ──

function computeLetterStats(questions: any[]): {
  strong: Array<{ id: number; letter: string; name: string }>;
  needsPractice: Array<{ id: number; letter: string; name: string }>;
} {
  const stats: Record<string, { correct: number; total: number }> = {};
  for (const q of questions) {
    const id = String(q.targetId);
    if (!stats[id]) stats[id] = { correct: 0, total: 0 };
    stats[id].total++;
    if (q.correct) stats[id].correct++;
  }

  const strong: Array<{ id: number; letter: string; name: string }> = [];
  const needsPractice: Array<{ id: number; letter: string; name: string }> = [];

  for (const [id, s] of Object.entries(stats)) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) continue;
    const letter = getLetter(numId);
    if (!letter) continue;

    const accuracy = s.total > 0 ? (s.correct / s.total) * 100 : 0;
    const entry = { id: numId, letter: letter.letter, name: letter.name };

    if (accuracy >= 80) {
      strong.push(entry);
    } else {
      needsPractice.push(entry);
    }
  }

  return { strong, needsPractice };
}

function MasteryBreakdown({
  strong,
  needsPractice,
  colors,
}: {
  strong: Array<{ id: number; letter: string }>;
  needsPractice: Array<{ id: number; letter: string }>;
  colors: any;
}) {
  if (strong.length === 0 && needsPractice.length === 0) return null;

  return (
    <View style={[styles.masteryCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      {strong.length > 0 && (
        <View style={needsPractice.length > 0 ? styles.masterySection : undefined}>
          <Text style={[styles.masteryLabel, { color: colors.primary }]}>STRONG</Text>
          <View style={styles.masteryChips}>
            {strong.map((l) => (
              <View
                key={l.id}
                style={[styles.masteryChip, { backgroundColor: colors.primarySoft }]}
              >
                <Text style={[styles.masteryChipArabic, { color: colors.primary }]}>
                  {l.letter}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
      {needsPractice.length > 0 && (
        <View>
          <Text style={[styles.masteryLabel, { color: colors.accent }]}>NEEDS PRACTICE</Text>
          <View style={styles.masteryChips}>
            {needsPractice.map((l) => (
              <View
                key={l.id}
                style={[styles.masteryChip, { backgroundColor: "rgba(196,164,100,0.1)" }]}
              >
                <Text style={[styles.masteryChipArabic, { color: colors.accent }]}>
                  {l.letter}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ── Component ──

export function LessonSummary({
  lesson,
  results,
  passed,
  accuracy,
  threshold,
  goalCompleted,
  onContinue,
  onRetry,
  onBack,
}: LessonSummaryProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const percentage = Math.round(accuracy * 100);
  const isPerfect = percentage === 100;
  const isCheckpointOrReview =
    lesson.lessonMode === "checkpoint" || lesson.lessonMode === "review";

  // Derive teach letters from lesson
  const teachLetters = useMemo(
    () => (lesson.teachIds || []).map((id: number) => getLetter(id)).filter(Boolean),
    [lesson.teachIds]
  );
  const lessonCombos = lesson.teachCombos || [];

  // Next lesson
  const nextLesson = useMemo(
    () => LESSONS.find((l: any) => l.id === lesson.id + 1) ?? null,
    [lesson.id]
  );
  const nextLetters = useMemo(
    () => nextLesson
      ? (nextLesson.teachIds || []).map((id: number) => getLetter(id)).filter(Boolean)
      : [],
    [nextLesson]
  );

  // Summary messaging (recap section — only for normal lessons)
  const { sectionHeading, recap } = useMemo(
    () => getSummaryMessaging(lesson, teachLetters, lessonCombos, percentage),
    [lesson, teachLetters, lessonCombos, percentage]
  );

  // Per-letter mastery breakdown (checkpoint/review only)
  const letterBreakdown = useMemo(
    () => isCheckpointOrReview ? computeLetterStats(results.questions) : null,
    [isCheckpointOrReview, results.questions]
  );
  const masteryFollowUp = letterBreakdown && letterBreakdown.needsPractice.length > 0
    ? "Keep revisiting the gold ones \u2014 they\u2019ll click with practice."
    : letterBreakdown
      ? "All letters looking strong \u2014 great work."
      : null;

  // Animated count-up for accuracy
  const animatedPct = useSharedValue(0);
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    animatedPct.value = withDelay(
      300,
      withTiming(percentage, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
  }, [percentage]);

  useDerivedValue(() => {
    runOnJS(setDisplayPct)(Math.round(animatedPct.value));
  });

  // Perfect score: breathing glow ring on the score circle
  const perfectRingScale = useSharedValue(1);
  const perfectRingOpacity = useSharedValue(0);

  useEffect(() => {
    if (isPerfect) {
      perfectRingOpacity.value = withDelay(600, withTiming(0.25, { duration: 400 }));
      perfectRingScale.value = withDelay(
        600,
        withRepeat(
          withSequence(
            withTiming(1.12, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          false
        )
      );
    }
  }, [isPerfect]);

  const perfectRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: perfectRingScale.value }],
    opacity: perfectRingOpacity.value,
  }));

  // Haptic on mount
  useEffect(() => {
    if (goalCompleted) hapticMilestone();
    else if (percentage >= 80) hapticMilestone();
    else if (percentage >= 50) hapticSuccess();
    else hapticTap();
  }, []);

  // Score circle styling — varies by score tier
  const circleColor = isPerfect ? colors.primary
    : percentage >= 70 ? colors.accent
    : colors.border;

  const circleBg = isPerfect ? colors.primarySoft
    : percentage >= 70 ? "rgba(196,164,100,0.08)"
    : colors.bg;

  const pctColor = isPerfect ? colors.primary
    : percentage >= 70 ? colors.accent
    : colors.textSoft;

  // Audio
  const sfxAsset = passed
    ? isPerfect
      ? getSFXAsset("lesson_complete_perfect")
      : getSFXAsset("lesson_complete")
    : null;
  const player = useAudioPlayer(sfxAsset);

  useEffect(() => {
    if (passed && player) {
      player.play();
    }
  }, [passed, player]);

  // Stable quotes
  const closingQuote = useMemo(() => pickCopy(CLOSING_QUOTES), []);
  const encourageQuote = useMemo(() => pickCopy(ENCOURAGEMENT_QUOTES), []);

  // Performance messaging
  const tier = getCompletionTier(percentage, false, false);
  const headline = isCheckpointOrReview && passed
    ? lesson.lessonMode === "checkpoint" ? "Checkpoint Complete" : "Review Complete"
    : (COMPLETION_HEADLINES as Record<string, string>)[tier] ?? "Lesson complete.";
  const subline = isCheckpointOrReview && passed
    ? ""
    : (COMPLETION_SUBLINES as Record<string, string>)[tier] ?? "";

  // Score detail text
  const letterNames = teachLetters.map((l: any) => l.name).join(" \u00B7 ");
  const scoreDetail = `${letterNames} \u2014 ${results.correct}/${results.total} correct`;

  // Next lesson hint
  const nextHint = useMemo(() => {
    if (!nextLesson) return "";
    if (nextLesson.lessonMode === "sound") return "Listen and learn how it sounds";
    if (nextLesson.lessonMode === "contrast") return "Same shape, different details";
    if ((nextLesson.teachIds?.length ?? 0) >= 2) return "Compare and distinguish";
    return "A new letter to discover";
  }, [nextLesson]);

  // ── FAILED STATE ──
  if (!passed) {
    return (
      <View style={[styles.outerContainer, { backgroundColor: colors.bg }]}>
        <WarmGradient color={colors.bgWarm} height={300} />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingTop: insets.top + spacing.xxl, paddingBottom: Math.max(insets.bottom, spacing.xl) + spacing.md },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Arabic letter anchors — reminds user what they're learning */}
          <Animated.View
            entering={FadeIn.delay(50).duration(600)}
            style={styles.failedLettersRow}
          >
            {teachLetters.slice(0, 3).map((l: any, i: number) => (
              <Animated.View
                key={l.id}
                entering={FadeIn.delay(150 + i * 100).duration(400)}
                style={[
                  styles.failedLetterChip,
                  {
                    backgroundColor: colors.accentLight,
                    borderColor: "rgba(196,164,100,0.3)",
                  },
                ]}
              >
                <ArabicText
                  size="large"
                  color={colors.accent}
                  style={{ fontSize: 32, lineHeight: 42, marginTop: 2 }}
                >
                  {l.letter}
                </ArabicText>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Score circle */}
          <Animated.View
            entering={FadeIn.delay(200).duration(500)}
            style={styles.scoreCircleWrap}
          >
            <View
              style={[
                styles.scoreCircle,
                { backgroundColor: circleBg, borderColor: circleColor },
              ]}
            >
              <Text style={[styles.scoreCircleText, { color: pctColor }]}>
                {displayPct}%
              </Text>
            </View>
          </Animated.View>

          {/* Headline + subline */}
          <Animated.View
            entering={FadeIn.delay(350).duration(400)}
            style={styles.messagingBlock}
          >
            <Text style={[styles.headline, { color: colors.text }]}>{headline}</Text>
            <Text style={[styles.subline, { color: colors.textSoft }]}>{subline}</Text>
            <Text style={[styles.scoreDetail, { color: colors.textMuted }]}>{scoreDetail}</Text>
            {threshold != null && threshold > 0 && (
              <Text style={[styles.thresholdCopy, { color: colors.textMuted }]}>
                You need {Math.round(threshold * 100)}% to continue.
              </Text>
            )}
          </Animated.View>

          {/* Mastery breakdown (checkpoint/review) OR encouragement (normal) */}
          {isCheckpointOrReview && letterBreakdown ? (
            <Animated.View entering={FadeIn.delay(500).duration(400)}>
              <MasteryBreakdown
                strong={letterBreakdown.strong}
                needsPractice={letterBreakdown.needsPractice}
                colors={colors}
              />
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeIn.delay(500).duration(400)}
              style={[
                styles.encourageCard,
                {
                  backgroundColor: colors.accentLight,
                  borderColor: "rgba(196,164,100,0.2)",
                },
              ]}
            >
              <Text
                style={[
                  styles.encourageText,
                  { color: colors.textSoft, fontFamily: fontFamilies.headingItalic },
                ]}
              >
                {"\u201C"}{encourageQuote}{"\u201D"}
              </Text>
            </Animated.View>
          )}

          {/* Actions */}
          <Animated.View entering={FadeIn.delay(650).duration(400)} style={styles.actions}>
            <Button title="Try Again" onPress={onRetry} />
            {onBack && (
              <Pressable
                onPress={() => { hapticTap(); onBack(); }}
                style={styles.backToHome}
              >
                <Text style={[styles.backToHomeText, { color: colors.textMuted }]}>
                  Back to Home
                </Text>
              </Pressable>
            )}
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // ── PASSED STATE ──
  return (
    <View style={[styles.outerContainer, { backgroundColor: colors.bg }]}>
      <WarmGradient color={colors.bgWarm} height={300} />

      {/* Confetti burst for strong completions */}
      {percentage >= 70 && <ConfettiBurst isPerfect={isPerfect} />}

      {/* Glow positioned in outer container — outside ScrollView to avoid clipping */}
      <View style={styles.glowWrap} pointerEvents="none">
        <WarmGlow
          size={isPerfect ? 220 : percentage >= 70 ? 160 : 120}
          animated
          color="rgba(196,164,100,0.3)"
          pulseMin={isPerfect ? 0.12 : 0.06}
          pulseMax={isPerfect ? 0.35 : 0.18}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: insets.top + spacing.xxl, paddingBottom: Math.max(insets.bottom, spacing.xl) + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Score circle ── */}
        <Animated.View
          entering={FadeIn.delay(100).duration(500)}
          style={styles.scoreCircleWrap}
        >
          {/* Perfect score: breathing gold ring */}
          {isPerfect && (
            <Animated.View
              style={[
                styles.perfectRing,
                { borderColor: colors.primary },
                perfectRingStyle,
              ]}
            />
          )}
          <View
            style={[
              styles.scoreCircle,
              { backgroundColor: circleBg, borderColor: circleColor },
            ]}
          >
            {isPerfect ? (
              // Perfect: show checkmark instead of percentage
              <CheckIcon size={32} color={colors.primary} />
            ) : (
              <Text style={[styles.scoreCircleText, { color: pctColor }]}>
                {displayPct}%
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Perfect: show percentage separately below circle */}
        {isPerfect && (
          <Animated.View entering={FadeIn.delay(200).duration(400)}>
            <Text style={[styles.perfectPctText, { color: colors.primary }]}>
              {displayPct}%
            </Text>
          </Animated.View>
        )}

        {/* ── 2. Headline + subline ── */}
        <Animated.View
          entering={FadeIn.delay(250).duration(400)}
          style={styles.messagingBlock}
        >
          <Text style={[styles.headline, { color: colors.text }]}>{headline}</Text>
          <Text style={[styles.subline, { color: colors.textSoft }]}>{subline}</Text>
          <Text style={[styles.scoreDetail, { color: colors.textMuted }]}>{scoreDetail}</Text>
        </Animated.View>

        {/* ── Goal Completion Banner ── */}
        {goalCompleted && passed && (
          <Animated.View
            entering={FadeIn.delay(300).duration(400)}
            style={[
              styles.goalBanner,
              { backgroundColor: "rgba(196,164,100,0.12)", borderColor: colors.accent },
            ]}
          >
            <Text style={[styles.goalBannerText, { color: colors.accent }]}>
              You hit your daily goal!
            </Text>
          </Animated.View>
        )}

        {/* ── 3. Recap OR Mastery breakdown ── */}
        {isCheckpointOrReview && letterBreakdown ? (
          <Animated.View entering={FadeIn.delay(400).duration(400)}>
            <MasteryBreakdown
              strong={letterBreakdown.strong}
              needsPractice={letterBreakdown.needsPractice}
              colors={colors}
            />
            {masteryFollowUp && (
              <Text style={[styles.masteryFollowUp, { color: colors.textSoft }]}>
                {masteryFollowUp}
              </Text>
            )}
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeIn.delay(400).duration(400)}
            style={[
              styles.recapBanner,
              {
                backgroundColor: colors.primarySoft,
                borderColor: "rgba(22,51,35,0.08)",
              },
            ]}
          >
            <Text style={[styles.recapHeading, { color: colors.primary }]}>
              {sectionHeading.toUpperCase()}
            </Text>
            <Text style={[styles.recapText, { color: colors.primaryDark }]}>
              {recap}
            </Text>
          </Animated.View>
        )}

        {/* ── 4. "Up Next" card ── */}
        {nextLesson && (
          <Animated.View
            entering={FadeIn.delay(550).duration(400)}
            style={[
              styles.upNextCard,
              {
                backgroundColor: colors.bgWarm,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.upNextLabel, { color: colors.textMuted }]}>
              UP NEXT
            </Text>
            <View style={styles.upNextLetters}>
              {nextLetters.slice(0, 3).map((l: any) => (
                <Text
                  key={l.id}
                  style={[
                    styles.upNextArabic,
                    { color: colors.primaryDark, fontFamily: fontFamilies.arabicRegular },
                  ]}
                >
                  {l.letter}
                </Text>
              ))}
            </View>
            <Text style={[styles.upNextTitle, { color: colors.text }]}>
              {nextLesson.title}
            </Text>
            <Text style={[styles.upNextHint, { color: colors.primary }]}>
              {nextHint}
            </Text>
          </Animated.View>
        )}

        {/* ── 5. Closing quote ── */}
        <Animated.View
          entering={FadeIn.delay(700).duration(400)}
          style={styles.quoteBlock}
        >
          <Text
            style={[
              styles.quoteText,
              { color: colors.textSoft, fontFamily: fontFamilies.headingItalic },
            ]}
          >
            {"\u201C"}{closingQuote}{"\u201D"}
          </Text>
        </Animated.View>

        {/* ── 6. Action buttons ── */}
        <Animated.View entering={FadeIn.delay(850).duration(400)} style={styles.actions}>
          <Button title="Continue" onPress={onContinue} />
          {onBack && (
            <Pressable
              onPress={() => { hapticTap(); onBack(); }}
              style={styles.backToHome}
            >
              <Text style={[styles.backToHomeText, { color: colors.textMuted }]}>
                Back to Home
              </Text>
            </Pressable>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  glowWrap: {
    position: "absolute",
    top: "20%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 0,
  },

  // Score circle
  scoreCircleWrap: {
    marginBottom: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreCircleText: {
    fontFamily: fontFamilies.headingBold,
    fontSize: 24,
  },
  perfectRing: {
    position: "absolute",
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1.5,
  },
  perfectPctText: {
    fontFamily: fontFamilies.headingBold,
    fontSize: 28,
    textAlign: "center",
    marginBottom: spacing.sm,
  },

  // Failed state: letter chips
  failedLettersRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: spacing.xl,
  },
  failedLetterChip: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  // Encouragement card (failed state)
  encourageCard: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  encourageText: {
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
    fontStyle: "italic",
    maxWidth: 280,
  },

  // Messaging
  messagingBlock: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  headline: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 24,
    textAlign: "center",
    marginBottom: 6,
  },
  subline: {
    ...typography.body,
    textAlign: "center",
    maxWidth: 280,
    marginBottom: 8,
    lineHeight: 22,
  },
  scoreDetail: {
    fontSize: 13,
    fontFamily: fontFamilies.bodyRegular,
    textAlign: "center",
  },
  thresholdCopy: {
    fontSize: 13,
    fontFamily: fontFamilies.bodyRegular,
    textAlign: "center",
    marginTop: 4,
  },

  // Goal completion banner
  goalBanner: {
    width: "100%",
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center" as const,
    marginBottom: spacing.lg,
  },
  goalBannerText: {
    fontFamily: fontFamilies.headingMedium,
    fontSize: 15,
    fontWeight: "600" as const,
  },

  // Recap banner ("What you practiced")
  recapBanner: {
    width: "100%",
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  recapHeading: {
    fontSize: 12,
    fontFamily: fontFamilies.bodyBold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  recapText: {
    fontSize: 13,
    fontFamily: fontFamilies.bodyRegular,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 300,
  },

  // Up Next card
  upNextCard: {
    width: "100%",
    borderRadius: radii.xxl,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  upNextLabel: {
    fontSize: 11,
    fontFamily: fontFamilies.bodyBold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  upNextLetters: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginBottom: 4,
  },
  upNextArabic: {
    fontSize: 28,
    lineHeight: 40,
    opacity: 0.7,
    writingDirection: "rtl",
  },
  upNextTitle: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 14,
    textAlign: "center",
  },
  upNextHint: {
    fontSize: 12,
    fontFamily: fontFamilies.bodySemiBold,
    marginTop: 4,
    textAlign: "center",
  },

  // Quote
  quoteBlock: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
    maxWidth: 300,
  },
  quoteText: {
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
    fontStyle: "italic",
  },

  // Actions
  actions: {
    width: "100%",
  },
  ghostButtonSpacer: {
    height: spacing.sm,
  },
  backToHome: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    marginTop: spacing.xs,
  },
  backToHomeText: {
    fontSize: 14,
    fontFamily: fontFamilies.bodyMedium,
  },

  // Mastery breakdown (checkpoint/review)
  masteryCard: {
    width: "100%",
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  masterySection: {
    marginBottom: spacing.lg,
  },
  masteryLabel: {
    fontSize: 11,
    fontFamily: fontFamilies.bodyBold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  masteryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  masteryChip: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  masteryChipArabic: {
    fontFamily: fontFamilies.arabicRegular,
    fontSize: 24,
    lineHeight: 32,
    writingDirection: "rtl",
    marginTop: 2,
  },
  masteryFollowUp: {
    fontSize: 13,
    fontFamily: fontFamilies.bodyRegular,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: spacing.lg,
    maxWidth: 280,
    alignSelf: "center",
  },
});
