import { View, Text, StyleSheet } from "react-native";
import { ArabicText, Button, Card } from "../../design/components";
import { useColors } from "../../design/theme";
import { typography, spacing, radii, fontFamilies } from "../../design/tokens";
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
}

// ── Component ──

export default function HeroCard({
  lesson,
  allDone,
  completedLessonIds,
  lessonsCompleted,
  currentPhase,
  onStartLesson,
}: HeroCardProps) {
  const colors = useColors();

  if (allDone || !lesson) {
    return (
      <Card elevated style={styles.heroCard}>
        <Text style={[styles.heroTitle, { color: colors.text }]}>All lessons complete!</Text>
        <Text style={[styles.heroDescription, { color: colors.textMuted }]}>
          You have completed all available lessons. Keep reviewing to strengthen your knowledge.
        </Text>
      </Card>
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
      <Text style={[styles.heroTitle, { color: colors.text }]}>{lesson.title}</Text>
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
  );
}

// ── Styles ──

const styles = StyleSheet.create({
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
});
