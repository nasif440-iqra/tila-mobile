import { useState, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useAudioPlayer } from "expo-audio";
import { hapticTap } from "../../design/haptics";
import { useColors } from "../../design/theme";
import { typography, spacing, radii, shadows } from "../../design/tokens";
import { ArabicText, Button, HearButton } from "../../design/components";
import { getLetter } from "../../data/letters";
import { getConnectedForms } from "../../data/connectedForms";
import { getLetterAsset } from "../../audio/player";
import { WarmGlow } from "../onboarding/WarmGlow";

// ── Types ──

type Position = "isolated" | "initial" | "medial" | "final";

interface ContextWord {
  arabic: string;
  transliteration?: string;
  meaning?: string;
  surahRef?: string;
}

interface GuidedRevealExerciseData {
  type: "guided_reveal" | "form_intro" | "letter_in_context";
  letterId: number;
  revealUpTo?: Position;
  explanation?: string;
  contextWord?: ContextWord;
}

interface ExerciseResult {
  correct: boolean;
  targetId?: number;
}

interface Props {
  exercise: GuidedRevealExerciseData;
  onComplete: (result: ExerciseResult) => void;
}

// ── Constants ──

const POSITION_LABELS: Record<Position, string> = {
  isolated: "Alone",
  initial: "Start",
  medial: "Middle",
  final: "End",
};

const ALL_POSITIONS: Position[] = ["isolated", "initial", "medial", "final"];

// ── Component ──

export function GuidedReveal({ exercise, onComplete }: Props) {
  const colors = useColors();
  const { letterId, revealUpTo, explanation, contextWord } = exercise;

  const letter = getLetter(letterId);
  const connectedData = getConnectedForms(letterId);

  // Determine positions to show
  const joins = connectedData ? connectedData.joins : false;
  const positions: Position[] = joins ? ALL_POSITIONS : ["isolated", "final"];

  // Find max reveal index
  const revealUpToIndex = revealUpTo ? positions.indexOf(revealUpTo) : -1;
  const maxRevealIndex = revealUpToIndex >= 0 ? revealUpToIndex : positions.length - 1;

  const [revealedIndex, setRevealedIndex] = useState(0);

  const isFullyRevealed = revealedIndex >= maxRevealIndex;
  const showContextWord = isFullyRevealed && contextWord;

  // Audio
  const nameAsset = getLetterAsset(letterId, "name");
  const audioPlayer = useAudioPlayer(nameAsset);

  const handleHearName = useCallback(async () => {
    if (!audioPlayer) return;
    try {
      audioPlayer.seekTo(0);
      audioPlayer.play();
    } catch {
      // Audio failure is non-blocking
    }
  }, [audioPlayer]);

  const handleNext = useCallback(() => {
    hapticTap();
    if (!isFullyRevealed) {
      setRevealedIndex((i) => i + 1);
    } else {
      onComplete({ correct: true, targetId: letterId });
    }
  }, [isFullyRevealed, onComplete, letterId]);

  const forms = connectedData?.forms ?? null;

  return (
    <View style={styles.container}>
      {/* Letter name + audio button */}
      <View style={styles.letterHeader}>
        <View style={styles.letterGlowContainer}>
          <WarmGlow size={120} opacity={0.12} />
          {letter && (
            <ArabicText size="display" color={colors.primaryDark}>
              {letter.letter}
            </ArabicText>
          )}
        </View>
        <HearButton
          onPlay={handleHearName}
          accessibilityLabel={`Hear ${letter ? letter.name : "letter"}`}
        />
      </View>

      {/* Position chips row */}
      <View style={styles.chipsRow}>
        {positions.map((pos, idx) => {
          const isRevealed = idx <= revealedIndex;
          const isCurrent = idx === revealedIndex;
          const isUnrevealed = idx > revealedIndex;
          const glyph = forms ? forms[pos] : null;

          return (
            <Animated.View
              key={pos}
              entering={FadeIn.delay(idx * 100)}
              style={[
                styles.chip,
                {
                  borderColor: isCurrent || isRevealed ? colors.primary : colors.border,
                  borderStyle: isUnrevealed ? "dashed" : "solid",
                  backgroundColor: isCurrent
                    ? colors.primary
                    : isRevealed
                      ? colors.bgCard
                      : "transparent",
                  opacity: isUnrevealed ? 0.45 : 1,
                  transform: [{ scale: isCurrent ? 1.05 : isUnrevealed ? 0.95 : 1 }],
                },
                (isCurrent || isRevealed) && shadows.card,
              ]}
            >
              {isRevealed && glyph ? (
                <ArabicText
                  size="large"
                  color={isCurrent ? colors.white : colors.primaryDark}
                >
                  {glyph}
                </ArabicText>
              ) : isUnrevealed ? (
                <Text style={[styles.placeholderText, { color: colors.border }]}>?</Text>
              ) : null}

              <Text
                style={[
                  typography.caption,
                  styles.positionLabel,
                  {
                    color: isCurrent
                      ? "rgba(255,255,255,0.85)"
                      : isRevealed
                        ? colors.textMuted
                        : colors.border,
                  },
                ]}
              >
                {POSITION_LABELS[pos]}
              </Text>
            </Animated.View>
          );
        })}
      </View>

      {/* Explanation card */}
      {explanation && (
        <Animated.View
          entering={FadeInDown.delay(150).duration(300)}
          style={[styles.explanationCard, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
        >
          <Text
            style={[typography.body, { color: colors.primaryDark, textAlign: "center", lineHeight: 22 }]}
          >
            {explanation}
          </Text>
        </Animated.View>
      )}

      {/* Context word card */}
      {showContextWord && (
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={[styles.contextCard, { backgroundColor: colors.bgCard, borderColor: colors.border }, shadows.card]}
        >
          <Text style={[typography.caption, styles.contextLabel, { color: colors.accent }]}>
            {contextWord.surahRef || "Example word"}
          </Text>
          <ArabicText size="large" color={colors.primaryDark}>
            {contextWord.arabic}
          </ArabicText>
          {contextWord.transliteration && (
            <Text style={[typography.body, { color: colors.primary, fontWeight: "600" }]}>
              {contextWord.transliteration}
            </Text>
          )}
          {contextWord.meaning && (
            <Text style={[typography.bodySmall, { color: colors.textSoft }]}>
              {contextWord.meaning}
            </Text>
          )}
        </Animated.View>
      )}

      {/* Next / Continue button */}
      <Button
        title={isFullyRevealed ? "Continue" : "Next Form \u2192"}
        onPress={handleNext}
      />
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
    maxWidth: 430,
    alignSelf: "center",
    width: "100%",
  },
  letterHeader: {
    alignItems: "center",
    gap: spacing.sm,
  },
  letterGlowContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  chipsRow: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  chip: {
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 2,
    minWidth: 76,
    minHeight: 76,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 36,
  },
  positionLabel: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "700",
  },
  explanationCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    width: "100%",
  },
  contextCard: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.xl,
    width: "100%",
    alignItems: "center",
    gap: spacing.xs,
  },
  contextLabel: {
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
});
