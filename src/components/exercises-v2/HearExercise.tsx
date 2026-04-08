import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { ArabicText } from "@/src/design/components/ArabicText";
import { CompactOption } from "./CompactOption";
import { useColors } from "@/src/design/theme";
import { typography, spacing, radii } from "@/src/design/tokens";
import { resolveAudio } from "@/src/audio/audioResolverV2";
import type { AudioResolveResult } from "@/src/audio/audioResolverV2";
import type { ExerciseItem } from "@/src/types/exercise";

interface Props {
  item: ExerciseItem;
  onAnswer: (correct: boolean, answerId: string) => void;
}

export function HearExercise({ item, onAnswer }: Props) {
  const colors = useColors();
  const [audioResult, setAudioResult] = useState<AudioResolveResult | null>(null);

  useEffect(() => {
    const key = item.prompt.audioKey ?? "";
    resolveAudio(key).then(setAudioResult).catch(() => {
      setAudioResult({ type: "placeholder" });
    });
  }, [item.prompt.audioKey]);

  async function handlePlayAudio() {
    if (audioResult?.type === "bundled" && audioResult.play) {
      await audioResult.play();
    }
  }

  return (
    <View style={styles.container}>
      {item.prompt.text ? (
        <Text style={[styles.instruction, { color: colors.textSoft }]}>{item.prompt.text}</Text>
      ) : null}

      {audioResult === null ? (
        <ActivityIndicator color={colors.accent} />
      ) : audioResult.type === "bundled" ? (
        <Pressable
          style={[styles.playButton, { backgroundColor: colors.accent }]}
          onPress={handlePlayAudio}
          accessibilityRole="button"
          accessibilityLabel="Play audio"
        >
          <Text style={[styles.playIcon, { color: colors.white }]}>▶</Text>
        </Pressable>
      ) : (
        <ArabicText size="quizHero" style={styles.arabicFallback}>
          {item.prompt.arabicDisplay}
        </ArabicText>
      )}

      <View style={styles.options}>
        {(item.options ?? []).map((option) => (
          <CompactOption
            key={option.id}
            label={option.displayArabic ?? option.displayText ?? ""}
            isArabic={Boolean(option.displayArabic)}
            onPress={() => onAnswer(option.isCorrect, option.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    alignItems: "center",
    gap: spacing.md,
  },
  instruction: {
    ...typography.bodyLarge,
    textAlign: "center",
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: {
    fontSize: 28,
  },
  arabicFallback: {
    textAlign: "center",
  },
  options: {
    width: "100%",
    gap: spacing.sm,
  },
  option: {
    width: "100%",
  },
});
