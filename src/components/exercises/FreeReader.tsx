import { useState, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useAudioPlayer } from "expo-audio";
import { useColors } from "../../design/theme";
import { typography, spacing, radii } from "../../design/tokens";
import { ArabicText, Button } from "../../design/components";

// ── Types ──

interface ContextWord {
  transliteration?: string;
  meaning?: string;
  surahRef?: string;
}

interface FreeReadExerciseData {
  type: "free_read";
  arabic: string;
  ttsText?: string;
  targetId?: number;
  contextWord?: ContextWord;
}

interface ExerciseResult {
  correct: boolean;
  targetId?: number;
  selfAssessed?: boolean;
  selfAssessedRetry?: boolean;
}

interface Props {
  exercise: FreeReadExerciseData;
  onComplete: (result: ExerciseResult) => void;
}

// ── Flow states ──

type FlowState = "initial" | "heard" | "retry";

// ── Component ──

export function FreeReader({ exercise, onComplete }: Props) {
  const colors = useColors();
  const [flowState, setFlowState] = useState<FlowState>("initial");
  const [isLoading, setIsLoading] = useState(false);

  // For TTS audio we'd need a network request. For now, use letter audio if available.
  // In production, this would use a TTS service call.

  const playAudio = useCallback(async () => {
    setIsLoading(true);
    try {
      // TTS playback would go here
      // For now, simulate a brief delay
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch {
      // Audio failure is non-blocking
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePlayAudio = useCallback(async () => {
    await playAudio();
    if (flowState === "initial") {
      setFlowState("heard");
    }
  }, [flowState, playAudio]);

  const handleReadItRight = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete({ correct: true, targetId: exercise.targetId, selfAssessed: true });
  }, [onComplete, exercise.targetId]);

  const handleGotItNow = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete({
      correct: true,
      targetId: exercise.targetId,
      selfAssessed: true,
      selfAssessedRetry: true,
    });
  }, [onComplete, exercise.targetId]);

  const handleHearItAgain = useCallback(() => {
    setFlowState("retry");
    playAudio();
  }, [playAudio]);

  return (
    <View style={styles.container}>
      {/* Arabic word */}
      <Animated.View entering={FadeIn.delay(50).duration(350)}>
        <ArabicText size="display" color={colors.primaryDark}>
          {exercise.arabic}
        </ArabicText>
      </Animated.View>

      {/* Context word badge */}
      {exercise.contextWord && (
        <Animated.View
          entering={FadeIn.delay(150).duration(250)}
          style={[styles.contextBadge, { backgroundColor: colors.accentLight, borderColor: colors.border }]}
        >
          {exercise.contextWord.transliteration && (
            <Text style={[typography.bodySmall, { color: colors.accent, fontWeight: "700" }]}>
              {exercise.contextWord.transliteration}
            </Text>
          )}
          {exercise.contextWord.transliteration && exercise.contextWord.meaning && (
            <Text style={[typography.bodySmall, { color: colors.textMuted }]}>{"\u2014"}</Text>
          )}
          {exercise.contextWord.meaning && (
            <Text style={[typography.bodySmall, { color: colors.textSoft }]}>
              {exercise.contextWord.meaning}
            </Text>
          )}
          {exercise.contextWord.surahRef && (
            <Text style={[typography.caption, { color: colors.textMuted, marginLeft: 2 }]}>
              ({exercise.contextWord.surahRef})
            </Text>
          )}
        </Animated.View>
      )}

      {/* Instructions */}
      <Animated.View entering={FadeIn.delay(200).duration(300)}>
        <Text style={[typography.body, styles.instructions, { color: colors.textSoft }]}>
          Read the word in your head or out loud. Then tap below to hear how it sounds.
        </Text>
      </Animated.View>

      {/* Flow: initial state */}
      {flowState === "initial" && (
        <Animated.View entering={FadeInDown.delay(300).duration(250)} style={styles.actionsContainer}>
          <Button
            title={isLoading ? "Loading..." : "Hear the correct reading"}
            onPress={handlePlayAudio}
            disabled={isLoading}
          />
        </Animated.View>
      )}

      {/* Flow: heard state - self-assessment */}
      {flowState === "heard" && (
        <Animated.View entering={FadeInDown.duration(250)} style={styles.actionsContainer}>
          <Button
            title={"\u2713 I read it right"}
            onPress={handleReadItRight}
            variant="secondary"
          />
          <Button
            title={isLoading ? "Loading..." : "Hear it again"}
            onPress={handleHearItAgain}
            disabled={isLoading}
            variant="ghost"
          />
        </Animated.View>
      )}

      {/* Flow: retry state */}
      {flowState === "retry" && (
        <Animated.View entering={FadeInDown.duration(250)} style={styles.actionsContainer}>
          <Text style={[typography.bodySmall, { color: colors.textMuted, textAlign: "center" }]}>
            Listen carefully and try again.
          </Text>
          <Button
            title={isLoading ? "Loading..." : "Hear again"}
            onPress={playAudio}
            disabled={isLoading}
            variant="ghost"
          />
          <Button
            title={"\u2713 Got it now"}
            onPress={handleGotItNow}
            variant="secondary"
          />
        </Animated.View>
      )}
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  contextBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 1,
  },
  instructions: {
    textAlign: "center",
    maxWidth: 300,
    lineHeight: 22,
  },
  actionsContainer: {
    width: "100%",
    maxWidth: 340,
    gap: spacing.md,
  },
});
