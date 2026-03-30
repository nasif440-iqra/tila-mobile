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
import { typography, spacing, radii, borderWidths, fontFamilies } from "../../design/tokens";
import { durations, easings, springs } from "../../design/animations";
import { WarmGlow } from "../onboarding/WarmGlow";
import { getLetter } from "../../data/letters";
import type { Lesson } from "../../types/lesson";

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

  // Card entrance animation
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

  // Letter circle entrance animation
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

  const ctaTitle = completedLessonIds.includes(lesson.id)
    ? "Review Lesson"
    : lessonsCompleted > 0
      ? "Continue Lesson"
      : "Start Lesson";

  return (
    <Animated.View style={[cardEntranceStyle, styles.heroWrap]}>
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Decorative corner blobs */}
        <View style={[styles.cornerBlobTopRight, { backgroundColor: colors.bg }]} />
        <View style={[styles.cornerBlobBottomLeft, { backgroundColor: "rgba(196, 164, 100, 0.05)" }]} />

        {/* Letter circle with WarmGlow */}
        <Animated.View style={[styles.letterCircleWrapper, circleEntranceStyle]}>
          <WarmGlow
            animated={true}
            size={180}
            color={colors.accentGlow}
            pulseMin={0.12}
            pulseMax={0.35}
          />
          <View style={styles.letterCircle}>
            <ArabicText size="display" color={colors.text} style={{ marginTop: 6 }}>
              {heroLetter ? heroLetter.letter : "?"}
            </ArabicText>
          </View>
        </Animated.View>

        {/* Lesson pill */}
        <View style={[styles.lessonPill, { backgroundColor: colors.bg }]}>
          <Text style={[styles.lessonPillText, { color: colors.accent }]}>
            Lesson {lesson.id}
          </Text>
        </View>

        {/* Lesson info */}
        <Text style={[styles.heroTitle, { color: colors.text }]}>{lesson.title}</Text>
        <Text style={[styles.heroDescription, { color: colors.textMuted }]}>
          {lesson.description}
        </Text>

        {/* CTA button */}
        <View style={styles.ctaRow}>
          <Button
            title={ctaTitle}
            onPress={() => onStartLesson(lesson.id)}
            style={styles.heroButton}
          />
        </View>
      </View>
    </Animated.View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  heroWrap: {
    marginBottom: spacing.xxl + spacing.sm,
  },
  heroCard: {
    alignItems: "center",
    borderRadius: 32,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    borderWidth: borderWidths.thin,
    overflow: "hidden",
    shadowColor: "#163323",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 40,
    elevation: 6,
  },
  cornerBlobTopRight: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 128,
    height: 128,
    borderBottomLeftRadius: 128,
    opacity: 0.5,
  },
  cornerBlobBottomLeft: {
    position: "absolute",
    bottom: -32,
    left: -32,
    width: 96,
    height: 96,
    borderTopRightRadius: 96,
  },
  letterCircleWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  letterCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F5F3",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.8)",
    // Subtle inner shadow effect
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  lessonPill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    marginBottom: spacing.md,
  },
  lessonPillText: {
    fontSize: 10,
    fontFamily: fontFamilies.bodyBold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 22,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  heroDescription: {
    ...typography.body,
    textAlign: "center",
    lineHeight: 23,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  ctaRow: {
    width: "100%",
    // Stronger CTA shadow matching web's 0 4px 16px rgba(22,51,35,0.20)
    shadowColor: "#163323",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 5,
  },
  heroButton: {
    width: "100%",
  },
});
