import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ArabicText } from "@/src/design/components/ArabicText";
import { HearButton } from "@/src/design/components/HearButton";
import { Button } from "@/src/design/components/Button";
import { useColors } from "@/src/design/theme";
import { typography, spacing } from "@/src/design/tokens";
import { resolveAudio } from "@/src/audio/audioResolverV2";
import type { AudioResolveResult } from "@/src/audio/audioResolverV2";
import type { ExerciseItem, ExerciseOption } from "@/src/types/exercise";

interface Props {
  item: ExerciseItem;
  onContinue: () => void;
}

// ── Labeled Audio Button (for options-based audio) ──

function LabeledAudioButton({
  audioKey,
  label,
  colors,
}: {
  audioKey: string;
  label: string;
  colors: ReturnType<typeof useColors>;
}) {
  const [audio, setAudio] = useState<AudioResolveResult | null>(null);

  useEffect(() => {
    resolveAudio(audioKey).then(setAudio).catch(() => {
      setAudio({ type: "placeholder" });
    });
  }, [audioKey]);

  const handlePlay = useCallback(async () => {
    if (audio?.type === "bundled" && audio.play) {
      await audio.play();
    }
  }, [audio]);

  if (audio?.type !== "bundled") return null;

  return (
    <View style={styles.audioButton}>
      <HearButton onPlay={handlePlay} size={48} accessibilityLabel={label} />
      <Text style={[styles.audioLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

// ── Main Component ──

export function PresentExercise({ item, onContinue }: Props) {
  const colors = useColors();

  // Check if options carry labeled audio buttons (present items use options for audio, not quiz)
  const audioOptions = (item.options ?? []).filter((o) => o.audioKey);
  const hasAudioOptions = audioOptions.length > 0;

  // Fallback: primary + secondary audio from prompt fields (for single-letter screens)
  const [primaryAudio, setPrimaryAudio] = useState<AudioResolveResult | null>(null);
  const [nameAudio, setNameAudio] = useState<AudioResolveResult | null>(null);

  useEffect(() => {
    if (hasAudioOptions) return; // options handle audio instead
    const key = item.prompt.audioKey;
    if (key) {
      resolveAudio(key).then(setPrimaryAudio).catch(() => {
        setPrimaryAudio({ type: "placeholder" });
      });
    }
  }, [item.prompt.audioKey, hasAudioOptions]);

  useEffect(() => {
    if (hasAudioOptions) return;
    const hint = item.prompt.hintText;
    if (hint && hint.startsWith("audio:")) {
      const nameKey = hint.replace("audio:", "");
      resolveAudio(nameKey).then(setNameAudio).catch(() => {
        setNameAudio({ type: "placeholder" });
      });
    }
  }, [item.prompt.hintText, hasAudioOptions]);

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

  // ── Group audio options by displayText prefix for multi-letter screens ──
  // Options with displayText like "Alif Name", "Alif Sound", "Ba Name", "Ba Sound"
  // are grouped by the first word for visual clarity.

  function renderAudioOptions(options: ExerciseOption[]) {
    // Try to detect groups: options whose labels share a first word
    const groups = new Map<string, ExerciseOption[]>();
    for (const opt of options) {
      const label = opt.displayText ?? opt.id;
      const firstWord = label.split(" ")[0];
      if (!groups.has(firstWord)) groups.set(firstWord, []);
      groups.get(firstWord)!.push(opt);
    }

    const isGrouped = groups.size > 1 && [...groups.values()].every((g) => g.length > 1);

    if (isGrouped) {
      // Render as labeled groups (e.g., "Alif" group with Name + Sound buttons)
      return (
        <View style={styles.audioGroups}>
          {[...groups.entries()].map(([groupName, opts]) => (
            <View key={groupName} style={styles.audioGroup}>
              <Text style={[styles.audioGroupLabel, { color: colors.text }]}>{groupName}</Text>
              <View style={styles.audioRow}>
                {opts.map((opt) => (
                  <LabeledAudioButton
                    key={opt.id}
                    audioKey={opt.audioKey!}
                    label={opt.displayText?.split(" ").slice(1).join(" ") ?? "Play"}
                    colors={colors}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      );
    }

    // Flat layout — all buttons in a single row
    return (
      <View style={styles.audioRow}>
        {options.map((opt) => (
          <LabeledAudioButton
            key={opt.id}
            audioKey={opt.audioKey!}
            label={opt.displayText ?? "Play"}
            colors={colors}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Arabic character — large and prominent */}
      {item.prompt.arabicDisplay ? (
        <ArabicText size="quizHero" style={styles.arabicDisplay}>
          {item.prompt.arabicDisplay}
        </ArabicText>
      ) : null}

      {/* Secondary Arabic display */}
      {item.prompt.arabicDisplayAlt ? (
        <ArabicText size="large" style={[styles.altDisplay, { color: colors.textSoft }]}>
          {item.prompt.arabicDisplayAlt}
        </ArabicText>
      ) : null}

      {/* Audio buttons — either from options (multi-button) or from prompt fields (2 buttons) */}
      {hasAudioOptions ? (
        renderAudioOptions(audioOptions)
      ) : (hasNameAudio || hasSoundAudio) ? (
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

      {/* Teaching text */}
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
  audioGroups: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xxxl,
    marginVertical: spacing.sm,
  },
  audioGroup: {
    alignItems: "center",
    gap: spacing.sm,
  },
  audioGroupLabel: {
    ...typography.bodyLarge,
    fontWeight: "600",
    textAlign: "center",
  },
  audioRow: {
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
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
