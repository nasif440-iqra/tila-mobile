import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Button } from "@/src/design/components/Button";
import { useColors } from "@/src/design/theme";
import { typography, spacing } from "@/src/design/tokens";
import type { LessonResult, LessonFailureReason } from "@/src/engine/v2/scoring";

interface Props {
  result: LessonResult;
  onContinue: () => void;
  onRetry: () => void;
}

export function LessonResultV2({ result, onContinue, onRetry }: Props) {
  const colors = useColors();

  if (result.passed) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={[styles.title, { color: colors.primary }]}>Lesson Complete!</Text>
        <Text style={[styles.score, { color: colors.accent }]}>
          {Math.round(result.overallPercent * 100)}%
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSoft }]}>
          {result.correctItems} / {result.totalItems} correct
        </Text>
        <Button title="Continue" onPress={onContinue} style={styles.button} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.primary }]}>Keep Practicing</Text>
      <Text style={[styles.score, { color: colors.textSoft }]}>
        {Math.round(result.overallPercent * 100)}%
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSoft }]}>
        {result.correctItems} / {result.totalItems} correct
      </Text>
      <View style={styles.reasons}>
        {result.failureReasons.map((reason, i) => (
          <Text key={i} style={[styles.reason, { color: colors.danger }]}>
            {formatFailureReason(reason)}
          </Text>
        ))}
      </View>
      <Button title="Try Again" onPress={onRetry} style={styles.button} />
      <Button title="Exit" onPress={onContinue} variant="ghost" style={styles.button} />
    </ScrollView>
  );
}

function formatFailureReason(reason: LessonFailureReason): string {
  switch (reason.reason) {
    case "below-pass-threshold":
      return `Score: ${Math.round(reason.actual * 100)}% (need ${Math.round(reason.required * 100)}%)`;
    case "decode-streak-broken":
      return `Final reading streak: ${reason.achieved} correct (need ${reason.required})`;
    case "decode-percent-low":
      return `Reading score: ${Math.round(reason.actual * 100)}% (need ${Math.round(reason.required * 100)}%)`;
    case "bucket-weakness":
      return `Weak area: ${reason.bucket} (${Math.round(reason.score * 100)}%)`;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  title: {
    ...typography.heading1,
    textAlign: "center",
  },
  score: {
    fontSize: 56,
    fontFamily: "Lora_400Regular_Italic",
    lineHeight: 64,
  },
  subtitle: {
    ...typography.body,
    textAlign: "center",
  },
  reasons: {
    gap: spacing.sm,
    width: "100%",
  },
  reason: {
    ...typography.body,
    textAlign: "center",
  },
  button: {
    width: "100%",
  },
});
