import { useState, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useAudioPlayer } from "expo-audio";
import { useColors } from "../../design/theme";
import { typography, spacing, radii, shadows } from "../../design/tokens";
import { ArabicText, Button, HearButton } from "../../design/components";
import { getLetterAsset } from "../../audio/player";

// ── Types ──

interface Segment {
  arabic: string;
  sound: string;
  letterId?: number;
}

interface FullWord {
  arabic: string;
  transliteration?: string;
  ttsText?: string;
}

interface ContextWord {
  arabic: string;
  transliteration?: string;
  meaning?: string;
  surahRef?: string;
}

interface BuildUpExerciseData {
  type: "buildup" | "buildup_pair" | "buildup_word";
  segments: Segment[];
  fullWord?: FullWord;
  contextWord?: ContextWord;
  explanation?: string;
}

interface ExerciseResult {
  correct: boolean;
  targetId?: number;
}

interface Props {
  exercise: BuildUpExerciseData;
  onComplete: (result: ExerciseResult) => void;
}

// ── Component ──

export function BuildUpReader({ exercise, onComplete }: Props) {
  const colors = useColors();
  const { segments = [], fullWord, contextWord, explanation } = exercise;

  const [step, setStep] = useState(0);

  const totalSteps = segments.length;
  const isFullWord = step === segments.length - 1 && segments.length > 0;

  // Visible segments: reveal right-to-left (reading order)
  const visibleCount = step + 1;
  const visibleSegments = segments.slice(segments.length - visibleCount);

  // Current segment being revealed
  const currentSegment = segments[segments.length - visibleCount];

  // Arabic text for current step
  const currentArabic =
    isFullWord && fullWord ? fullWord.arabic : visibleSegments.map((s) => s.arabic).join("");

  // Audio for current segment
  const letterAsset =
    currentSegment?.letterId != null ? getLetterAsset(currentSegment.letterId, "sound") : null;
  const audioPlayer = useAudioPlayer(letterAsset);

  const handleHear = useCallback(async () => {
    if (!audioPlayer) return;
    try {
      audioPlayer.seekTo(0);
      audioPlayer.play();
    } catch {
      // Audio failure is non-blocking
    }
  }, [audioPlayer]);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isFullWord) {
      onComplete({ correct: true, targetId: segments[segments.length - 1]?.letterId });
    } else {
      setStep((s) => s + 1);
    }
  }, [isFullWord, onComplete, segments]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[typography.caption, styles.headerLabel, { color: colors.textMuted }]}>
          BUILD UP
        </Text>
        {/* Step dots */}
        <View style={styles.dotsRow}>
          {segments.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i <= step ? colors.primary : colors.border },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Main content area */}
      <View style={styles.mainContent}>
        {/* Previous steps dimmed */}
        {visibleSegments.length > 1 && (
          <View style={styles.previousSteps}>
            {visibleSegments.slice(0, -1).map((seg, idx) => (
              <ArabicText key={idx} size="body" color={colors.text} style={{ opacity: 0.35 }}>
                {seg.arabic}
              </ArabicText>
            ))}
          </View>
        )}

        {/* Current arabic display */}
        <Animated.View key={step} entering={FadeInDown.springify()}>
          <ArabicText
            size={isFullWord ? "display" : "large"}
            color={colors.primaryDark}
          >
            {currentArabic}
          </ArabicText>
        </Animated.View>

        {/* Sound labels */}
        <View style={styles.soundLabelsRow}>
          {visibleSegments.map((seg, idx) => {
            const isNew = idx === visibleSegments.length - 1;
            return (
              <View
                key={idx}
                style={[
                  styles.soundLabel,
                  isNew && { backgroundColor: colors.primarySoft },
                ]}
              >
                <Text
                  style={[
                    typography.bodySmall,
                    {
                      color: isNew ? colors.primary : colors.textMuted,
                      fontWeight: isNew ? "700" : "500",
                    },
                  ]}
                >
                  {seg.sound}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Transliteration for full word */}
        {isFullWord && fullWord?.transliteration && (
          <Animated.View entering={FadeIn.delay(150)}>
            <Text style={[typography.body, { color: colors.textSoft, fontWeight: "600" }]}>
              {fullWord.transliteration}
            </Text>
          </Animated.View>
        )}

        {/* Explanation card */}
        {isFullWord && explanation && (
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={[styles.explanationCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          >
            <Text style={[typography.bodySmall, { color: colors.textSoft, textAlign: "center", lineHeight: 20 }]}>
              {explanation}
            </Text>
          </Animated.View>
        )}

        {/* Context word card */}
        {isFullWord && contextWord && (
          <Animated.View
            entering={FadeInDown.delay(350).springify()}
            style={[styles.contextCard, { backgroundColor: colors.accentLight, borderColor: colors.border }]}
          >
            <ArabicText size="large" color={colors.primaryDark}>
              {contextWord.arabic}
            </ArabicText>
            {contextWord.transliteration && (
              <Text style={[typography.bodySmall, { color: colors.textSoft, fontWeight: "600" }]}>
                {contextWord.transliteration}
              </Text>
            )}
            {contextWord.meaning && (
              <Text style={[typography.bodySmall, { color: colors.textMuted }]}>
                {contextWord.meaning}
              </Text>
            )}
            {contextWord.surahRef && (
              <Text
                style={[
                  typography.caption,
                  { color: colors.accent, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
                ]}
              >
                {contextWord.surahRef}
              </Text>
            )}
          </Animated.View>
        )}
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomActions}>
        <HearButton
          onPlay={handleHear}
          accessibilityLabel={
            isFullWord && fullWord
              ? `Hear: ${fullWord.transliteration}`
              : "Hear this step"
          }
        />
        <Button
          title={isFullWord ? "I can read it \u2192" : "Next \u2192"}
          onPress={handleNext}
        />
      </View>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: "center",
    gap: spacing.sm,
  },
  headerLabel: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  previousSteps: {
    alignItems: "center",
    gap: spacing.xs,
  },
  soundLabelsRow: {
    flexDirection: "row-reverse",
    gap: spacing.sm,
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: spacing.xs,
  },
  soundLabel: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  explanationCard: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 340,
    marginTop: spacing.sm,
  },
  contextCard: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  bottomActions: {
    gap: spacing.md,
    alignItems: "center",
    paddingTop: spacing.lg,
  },
});
