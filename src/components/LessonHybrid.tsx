import { useRef, useEffect, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { hapticTap } from "../design/haptics";
import { useColors } from "../design/theme";
import { typography, spacing, radii } from "../design/tokens";
import useLessonHybrid, { type Stage } from "../hooks/useLessonHybrid";
import { springs, durations } from "../design/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Exercise components
import { ComprehensionExercise } from "./exercises/ComprehensionExercise";
import { TapInOrder } from "./exercises/TapInOrder";
import { BuildUpReader } from "./exercises/BuildUpReader";
import { FreeReader } from "./exercises/FreeReader";
import { SpotTheBreak } from "./exercises/SpotTheBreak";
import { GuidedReveal } from "./exercises/GuidedReveal";

// ── Types ──

interface LessonHybridProps {
  lesson: any;
  onComplete: (results: {
    correct: number;
    total: number;
    questions: any[];
  }) => void;
}

// ── Stage indicator labels and colors ──

const STAGE_LABELS: Record<Stage, string> = {
  guided: "Learning",
  buildup: "Building",
  free: "Reading",
};

function StageIndicator({ stage, colors }: { stage: Stage; colors: any }) {
  const label = STAGE_LABELS[stage] ?? "Learning";

  return (
    <View style={[styles.stageBadge, { backgroundColor: colors.primarySoft }]}>
      <Text style={[styles.stageBadgeText, { color: colors.primary }]}>{label}</Text>
    </View>
  );
}

// ── Close button ──

function CloseButton({
  onPress,
  colors,
}: {
  onPress: () => void;
  colors: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="Close lesson"
      style={styles.closeButton}
      hitSlop={12}
    >
      <Text style={[styles.closeIcon, { color: colors.textSoft }]}>
        {"\u2715"}
      </Text>
    </Pressable>
  );
}

// ── Component ──

export function LessonHybrid({ lesson, onComplete }: LessonHybridProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const hybrid = useLessonHybrid(lesson);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animated progress bar width
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withSpring(hybrid.progress, springs.gentle);
  }, [hybrid.progress]);

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  // When all exercises are done, notify parent
  useEffect(() => {
    if (hybrid.isComplete) {
      onComplete(hybrid.results);
    }
  }, [hybrid.isComplete]);

  const handleExerciseComplete = useCallback(
    (result: any) => {
      const stage = hybrid.currentStage;
      const type = hybrid.currentExercise?.type;

      if (type === "comprehension") {
        // ComprehensionExercise manages its own timing (850ms auto-advance on correct,
        // "Got it" button on wrong) - advance immediately when onComplete fires
        hybrid.advance(result);
      } else if (stage === "guided" || stage === "buildup") {
        // Brief delay for guided/buildup exercises for visual feedback
        advanceTimerRef.current = setTimeout(() => hybrid.advance(result), 300);
      } else {
        hybrid.advance(result);
      }
    },
    [hybrid]
  );

  const handleBack = useCallback(() => {
    hapticTap();
    // Navigate away from lesson
    const { router } = require("expo-router");
    router.back();
  }, []);

  // ── Render exercise ──

  function renderExercise() {
    const ex = hybrid.currentExercise;
    if (!ex) return null;

    const { type } = ex;

    if (
      type === "guided_reveal" ||
      type === "form_intro" ||
      type === "letter_in_context"
    ) {
      return (
        <GuidedReveal
          exercise={ex}
          onComplete={handleExerciseComplete}
        />
      );
    }
    if (type === "tap_in_order") {
      return (
        <TapInOrder exercise={ex} onComplete={handleExerciseComplete} />
      );
    }
    if (
      type === "buildup" ||
      type === "buildup_pair" ||
      type === "buildup_word"
    ) {
      return (
        <BuildUpReader
          exercise={ex}
          onComplete={handleExerciseComplete}
        />
      );
    }
    if (type === "free_read") {
      return (
        <FreeReader exercise={ex} onComplete={handleExerciseComplete} />
      );
    }
    if (type === "spot_the_break") {
      return (
        <SpotTheBreak
          exercise={ex}
          onComplete={handleExerciseComplete}
        />
      );
    }
    if (type === "comprehension") {
      return (
        <ComprehensionExercise
          exercise={ex}
          onComplete={handleExerciseComplete}
        />
      );
    }

    // Fallback for unknown types
    return (
      <View style={styles.fallback}>
        <Text style={[typography.body, { color: colors.textSoft }]}>
          Unknown exercise type: {type}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top bar: close + progress + counter */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <CloseButton onPress={handleBack} colors={colors} />

        <View
          style={[styles.progressTrack, { backgroundColor: colors.border }]}
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.round(hybrid.progress),
          }}
        >
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary },
              progressAnimatedStyle,
            ]}
          />
        </View>

        <Text
          style={[
            typography.bodySmall,
            styles.counter,
            { color: colors.textSoft },
          ]}
        >
          {hybrid.exerciseIndex + 1}/{hybrid.totalExercises}
        </Text>
      </View>

      {/* Stage indicator */}
      <View style={styles.stageRow}>
        <StageIndicator stage={hybrid.currentStage} colors={colors} />
      </View>

      {/* Exercise content */}
      <View style={styles.exerciseArea}>
        <Animated.View
          key={hybrid.exerciseIndex}
          entering={FadeIn.duration(durations.normal)}
          exiting={FadeOut.duration(durations.fast)}
          style={styles.exerciseWrapper}
        >
          {renderExercise()}
        </Animated.View>
      </View>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: "600",
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: radii.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radii.full,
  },
  counter: {
    minWidth: 40,
    textAlign: "right",
    fontWeight: "700",
  },
  stageRow: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  stageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stageBadgeText: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  exerciseArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xxxl,
  },
  exerciseWrapper: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
});
