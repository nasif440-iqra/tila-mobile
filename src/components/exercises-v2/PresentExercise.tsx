import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ArabicText } from "@/src/design/components/ArabicText";
import { HearButton } from "@/src/design/components/HearButton";
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

  // Primary audio (letter sound or combo sound)
  const [primaryAudio, setPrimaryAudio] = useState<AudioResolveResult | null>(null);
  // Secondary audio (letter name — only when prompt has a second audioKey in hintText)
  const [nameAudio, setNameAudio] = useState<AudioResolveResult | null>(null);

  useEffect(() => {
    const key = item.prompt.audioKey;
    if (key) {
      resolveAudio(key).then(setPrimaryAudio).catch(() => {
        setPrimaryAudio({ type: "placeholder" });
      });
    }
  }, [item.prompt.audioKey]);

  // Use hintText field to carry a second audio key (e.g., "audio:letter_name_2")
  useEffect(() => {
    const hint = item.prompt.hintText;
    if (hint && hint.startsWith("audio:")) {
      const nameKey = hint.replace("audio:", "");
      resolveAudio(nameKey).then(setNameAudio).catch(() => {
        setNameAudio({ type: "placeholder" });
      });
    }
  }, [item.prompt.hintText]);

  const handlePlaySound = useCallback(async () => {
    if (primaryAudio?.type === "bundled" && primaryAudio.play) {
      await primaryAudio.play();
    }
  }, [primaryAudio]);

  const handlePlayName = useCallback(async () => {
    if (nameAudio?.type === "bundled" && nameAudio.play) {
      await nameAudio.play();
    }
  }, [nameAudio]);

  const hasNameAudio = nameAudio?.type === "bundled";
  const hasSoundAudio = primaryAudio?.type === "bundled";

  return (
    <View style={styles.container}>
      {/* Arabic character — large and prominent */}
      {item.prompt.arabicDisplay ? (
        <ArabicText size="quizHero" style={styles.arabicDisplay}>
          {item.prompt.arabicDisplay}
        </ArabicText>
      ) : null}

      {/* Secondary Arabic display (e.g., spaced isolated vs connected comparison) */}
      {item.prompt.arabicDisplayAlt ? (
        <ArabicText size="large" style={[styles.altDisplay, { color: colors.textSoft }]}>
          {item.prompt.arabicDisplayAlt}
        </ArabicText>
      ) : null}

      {/* Audio buttons — name and/or sound */}
      {(hasNameAudio || hasSoundAudio) ? (
        <View style={styles.audioRow}>
          {hasNameAudio ? (
            <View style={styles.audioButton}>
              <HearButton onPlay={handlePlayName} size={56} accessibilityLabel="Hear the name" />
              <Text style={[styles.audioLabel, { color: colors.textMuted }]}>Name</Text>
            </View>
          ) : null}
          {hasSoundAudio ? (
            <View style={styles.audioButton}>
              <HearButton onPlay={handlePlaySound} size={56} accessibilityLabel="Hear the sound" />
              <Text style={[styles.audioLabel, { color: colors.textMuted }]}>Sound</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Teaching text — can be multiple lines */}
      {item.prompt.text ? (
        <Text style={[styles.teachingText, { color: colors.text }]}>
          {item.prompt.text}
        </Text>
      ) : null}

      <View style={styles.bottomArea}>
        <Button title="Continue" onPress={onContinue} style={styles.continueButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    alignItems: "center",
    gap: spacing.md,
  },
  arabicDisplay: {
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  altDisplay: {
    textAlign: "center",
  },
  audioRow: {
    flexDirection: "row",
    gap: spacing.xl,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: spacing.sm,
  },
  audioButton: {
    alignItems: "center",
    gap: spacing.xs,
  },
  audioLabel: {
    ...typography.caption,
    textAlign: "center",
  },
  teachingText: {
    ...typography.bodyLarge,
    textAlign: "center",
    lineHeight: 26,
    maxWidth: 320,
    paddingHorizontal: spacing.sm,
  },
  bottomArea: {
    flex: 1,
    justifyContent: "flex-end",
    width: "100%",
    paddingBottom: spacing.xl,
  },
  continueButton: {
    width: "100%",
  },
});
