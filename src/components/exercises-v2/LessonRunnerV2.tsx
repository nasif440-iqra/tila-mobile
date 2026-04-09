import React, { useState, useCallback } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { LessonV2 } from "@/src/types/curriculum-v2";
import { useLessonQuizV2 } from "@/src/hooks/useLessonQuizV2";
import { useProgressV2 } from "@/src/hooks/useProgressV2";
import { useMasteryV2 } from "@/src/hooks/useMasteryV2";
import { useColors } from "@/src/design/theme";
import { spacing, typography } from "@/src/design/tokens";
import { ExerciseRenderer } from "./ExerciseRenderer";
import { LessonResultV2 } from "./LessonResultV2";

interface Props {
  lesson: LessonV2;
  onExit: () => void;
}

export function LessonRunnerV2({ lesson, onExit }: Props) {
  const colors = useColors();
  const [retryKey, setRetryKey] = useState(0);

  return (
    <LessonRunnerInner
      key={retryKey}
      lesson={lesson}
      onExit={onExit}
      onRetry={() => setRetryKey((k) => k + 1)}
      colors={colors}
    />
  );
}

function LessonRunnerInner({
  lesson,
  onExit,
  onRetry,
  colors,
}: Props & { onRetry: () => void; colors: ReturnType<typeof useColors> }) {
  const progress = useProgressV2();
  const mastery = useMasteryV2();
  const quiz = useLessonQuizV2(lesson, progress, mastery);

  const handleRetry = useCallback(() => {
    onRetry();
  }, [onRetry]);

  // ── Loading / generating ──
  if (quiz.phase === "generating" || quiz.phase === "scoring") {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={[styles.loadingText, { color: colors.textSoft }]}>
          {quiz.phase === "generating" ? "Preparing exercises..." : "Saving results..."}
        </Text>
      </SafeAreaView>
    );
  }

  // ── Error ──
  if (quiz.error) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.bg }]}>
        <Text style={[styles.errorText, { color: colors.danger }]}>{quiz.error}</Text>
      </SafeAreaView>
    );
  }

  // ── Complete ──
  if (quiz.isComplete && quiz.result) {
    return (
      <SafeAreaView style={[styles.fill, { backgroundColor: colors.bg }]}>
        <LessonResultV2
          result={quiz.result}
          onContinue={onExit}
          onRetry={handleRetry}
        />
      </SafeAreaView>
    );
  }

  // ── Active ──
  if (quiz.currentItem) {
    const progressPct = quiz.totalItems > 0 ? (quiz.itemIndex / quiz.totalItems) * 100 : 0;

    return (
      <SafeAreaView style={[styles.fill, { backgroundColor: colors.bg }]}>
        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.accent,
                width: `${progressPct}%` as `${number}%`,
              },
            ]}
          />
        </View>

        {/* Item counter */}
        <Text style={[styles.counter, { color: colors.textMuted }]}>
          {quiz.itemIndex + 1} / {quiz.totalItems}
        </Text>

        {/* Exercise */}
        <ExerciseRenderer
          item={quiz.currentItem}
          onAnswer={quiz.handleAnswer}
          onPresentContinue={() => quiz.handleAnswer(true, "present-continue")}
        />
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  progressTrack: {
    height: 4,
    width: "100%",
  },
  progressFill: {
    height: 4,
  },
  counter: {
    ...typography.caption,
    textAlign: "center",
    paddingTop: spacing.sm,
  },
  loadingText: {
    ...typography.body,
    textAlign: "center",
  },
  errorText: {
    ...typography.body,
    textAlign: "center",
  },
});
