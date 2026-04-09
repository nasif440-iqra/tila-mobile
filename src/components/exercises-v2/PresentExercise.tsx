import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ArabicText } from "@/src/design/components/ArabicText";
import { Button } from "@/src/design/components/Button";
import { useColors } from "@/src/design/theme";
import { typography, spacing } from "@/src/design/tokens";
import { resolveAudio } from "@/src/audio/audioResolverV2";
import type { AudioResolveResult } from "@/src/audio/audioResolverV2";
import type { ExerciseItem } from "@/src/types/exercise";

interface Props {
  item: ExerciseItem;
  onContinue: () => void;
}

export function PresentExercise({ item, onContinue }: Props) {
  const colors = useColors();
  const [audioResult, setAudioResult] = useState<AudioResolveResult | null>(null);

  useEffect(() => {
    const key = item.prompt.audioKey;
    if (key) {
      resolveAudio(key).then(setAudioResult).catch(() => {
        setAudioResult({ type: "placeholder" });
      });
    }
  }, [item.prompt.audioKey]);

  useEffect(() => {
    // Auto-play audio when it becomes available
    if (audioResult?.type === "bundled" && audioResult.play) {
      audioResult.play();
    }
  }, [audioResult]);

  return (
    <View style={styles.container}>
      <ArabicText size="quizHero" style={styles.arabicDisplay}>
        {item.prompt.arabicDisplay}
      </ArabicText>

      {item.prompt.arabicDisplayAlt ? (
        <ArabicText size="large" style={[styles.altDisplay, { color: colors.textSoft }]}>
          {item.prompt.arabicDisplayAlt}
        </ArabicText>
      ) : null}

      {item.prompt.text ? (
        <Text style={[styles.meaning, { color: colors.textSoft }]}>
          {item.prompt.text}
        </Text>
      ) : null}

      <Button title="Continue" onPress={onContinue} style={styles.continueButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  arabicDisplay: {
    textAlign: "center",
  },
  altDisplay: {
    textAlign: "center",
  },
  meaning: {
    ...typography.bodyLarge,
    textAlign: "center",
    maxWidth: 280,
  },
  continueButton: {
    width: "100%",
    marginTop: spacing.xl,
  },
});
