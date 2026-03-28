import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useColors } from "../../design/theme";
import { spacing, typography, borderWidths } from "../../design/tokens";
import { durations, easings, staggers } from "../../design/animations";
import { LESSONS } from "../../data/lessons";
import { JourneyNode } from "./JourneyNode";
import type { MasteryState } from "../../types/mastery";

// ── Phase metadata ──

const PHASE_LABELS: Record<number, string> = {
  1: "Letter Recognition",
  2: "Letter Sounds",
  3: "Harakat (Vowels)",
  4: "Connected Forms",
};

// ── Serpentine x-offsets that repeat every 6 nodes ──

const OFFSETS = [4, 16, 8, -4, -12, 0];

// ── Props ──

export interface LessonGridProps {
  currentPhase: number;
  nextLessonId: number | null;
  completedLessonIds: number[];
  mastery: MasteryState | undefined;
  today: string;
  onStartLesson: (lessonId: number) => void;
  enterDelay?: number;
}

// ── Component ──

export default function LessonGrid({
  currentPhase,
  nextLessonId,
  completedLessonIds,
  mastery,
  today,
  onStartLesson,
  enterDelay = 0,
}: LessonGridProps) {
  const colors = useColors();

  // Section header entrance animation
  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withDelay(
      enterDelay,
      withTiming(1, { duration: durations.normal, easing: easings.contentReveal }),
    );
  }, []);

  const headerEntranceStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const currentPhaseLessons = LESSONS.filter((l) => l.phase === currentPhase);
  const phaseLabel = `Phase ${currentPhase} — ${PHASE_LABELS[currentPhase] ?? ""}`;

  return (
    <View style={styles.journeySection}>
      <Animated.View style={headerEntranceStyle}>
        <Text style={[styles.journeySectionTitle, { color: colors.brownLight }]}>
          {phaseLabel.toUpperCase()}
        </Text>
      </Animated.View>

      <View style={styles.journeyPath}>
        {/* Connector line */}
        <View
          style={[
            styles.connectorLine,
            { borderColor: colors.border },
          ]}
        />

        {currentPhaseLessons.map((lesson, i) => {
          const complete = completedLessonIds.includes(lesson.id);
          const isCurrent = lesson.id === nextLessonId;
          const state = complete ? "complete" : isCurrent ? "current" : "locked";
          const offset = OFFSETS[i % OFFSETS.length];

          return (
            <JourneyNode
              key={lesson.id}
              lesson={lesson}
              state={state}
              offset={offset}
              enterDelay={enterDelay + 200 + i * staggers.fast.delay}
              onPress={onStartLesson}
            />
          );
        })}
      </View>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  journeySection: {
    marginTop: spacing.lg,
  },
  journeySectionTitle: {
    ...typography.label,
    marginBottom: spacing.xl,
  },
  journeyPath: {
    position: "relative",
    paddingLeft: spacing.xxl,
    paddingVertical: spacing.sm,
  },
  connectorLine: {
    position: "absolute",
    left: 50,
    top: 0,
    bottom: 0,
    width: 0,
    borderLeftWidth: borderWidths.thick,
    borderStyle: "dashed",
  },
});
