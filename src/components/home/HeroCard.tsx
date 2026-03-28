import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { ArabicText, Button, Card } from "../../design/components";
import { useColors } from "../../design/theme";
import { typography, spacing, radii } from "../../design/tokens";
import { durations, easings, springs } from "../../design/animations";
import { WarmGlow } from "../onboarding/WarmGlow";
import { getLetter } from "../../data/letters";
import type { Lesson } from "../../types/lesson";

// ── Phase metadata ──

const PHASE_LABELS: Record<number, string> = {
  1: "Letter Recognition",
  2: "Letter Sounds",
  3: "Harakat (Vowels)",
  4: "Connected Forms",
};

// ── Props ──

export interface HeroCardProps {
  lesson: Lesson | null;
  allDone: boolean;
  completedLessonIds: number[];
  lessonsCompleted: number;
  currentPhase: number;
  onStartLesson: (lessonId: number) => void;
  enterDelay?: number;
}

// ── Component ──

export default function HeroCard({
  lesson,
  allDone,
  completedLessonIds,
  lessonsCompleted,
  currentPhase,
  onStartLesson,
  enterDelay = 0,
}: HeroCardProps) {
  const colors = useColors();

  // Card entrance animation: FadeIn + translateY from 12px
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(12);

  useEffect(() => {
    cardOpacity.value = withDelay(
      enterDelay,
      withTiming(1, { duration: durations.slow, easing: easings.contentReveal }),
    );
    cardTranslateY.value = withDelay(
      enterDelay,
      withTiming(0, { duration: durations.slow, easing: easings.contentReveal }),
    );
  }, []);

  const cardEntranceStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  // Letter circle entrance animation: scale from 0.8 to 1.0
  const circleScale = useSharedValue(0.8);

  useEffect(() => {
    circleScale.value = withDelay(
      enterDelay + 100,
      withSpring(1, springs.gentle),
    );
  }, []);

  const circleEntranceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  if (allDone || !lesson) {
    return (
      <Animated.View style={cardEntranceStyle}>
        <Card elevated style={styles.heroCard}>
          <Text style={[styles.heroTitle, { color: colors.brown }]}>All lessons complete!</Text>
          <Text style={[styles.heroDescription, { color: colors.textMuted }]}>
            You have completed all available lessons. Keep reviewing to strengthen your knowledge.
          </Text>
        </Card>
      </Animated.View>
    );
  }

  const heroLetters = (lesson.teachIds || []).map((id: number) => getLetter(id)).filter(Boolean);
  const heroLetter = heroLetters[0];
  const phaseLabel = `Phase ${currentPhase} — ${PHASE_LABELS[currentPhase] ?? ""}`;

  const ctaTitle = completedLessonIds.includes(lesson.id)
    ? "Review Lesson"
    : lessonsCompleted > 0
      ? "Continue Lesson"
      : "Start Lesson";

  return (
    <Animated.View style={cardEntranceStyle}>
      <Card elevated style={styles.heroCard}>
        {/* Phase label pill */}
        <View style={[styles.phasePill, { backgroundColor: colors.bg }]}>
          <Text style={[styles.phasePillText, { color: colors.accent }]}>{phaseLabel}</Text>
        </View>

        {/* Letter circle with WarmGlow behind it */}
        <Animated.View style={[styles.letterCircleWrapper, circleEntranceStyle]}>
          <WarmGlow
            animated={true}
            size={160}
            color={colors.accentGlow}
            pulseMin={0.06}
            pulseMax={0.18}
          />
          <View style={[styles.letterCircle, { backgroundColor: colors.primarySoft }]}>
            <ArabicText size="display" color={colors.text}>
              {heroLetter ? heroLetter.letter : "?"}
            </ArabicText>
          </View>
        </Animated.View>

        {/* Lesson info */}
        <Text style={[styles.heroTitle, { color: colors.brown }]}>{lesson.title}</Text>
        <Text style={[styles.heroDescription, { color: colors.textMuted }]}>
          {lesson.description}
        </Text>

        {/* CTA button */}
        <Button
          title={ctaTitle}
          onPress={() => onStartLesson(lesson.id)}
          style={styles.heroButton}
        />
      </Card>
    </Animated.View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  heroCard: {
    alignItems: "center",
    marginBottom: spacing.xxxxl,
    borderRadius: radii.xl,
    paddingVertical: spacing.xxl,
  },
  phasePill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    marginBottom: spacing.lg,
  },
  phasePillText: {
    ...typography.label,
  },
  letterCircleWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  letterCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    ...typography.cardHeadline,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  heroDescription: {
    ...typography.body,
    textAlign: "center",
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.sm,
  },
  heroButton: {
    width: "100%",
  },
});
