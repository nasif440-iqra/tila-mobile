import { View, Text, StyleSheet } from "react-native";
import { useCallback } from "react";
import Animated, { FadeIn } from "react-native-reanimated";
import { useAudioPlayer } from "expo-audio";
import { useColors } from "../design/theme";
import { typography, spacing, radii } from "../design/tokens";
import { ArabicText, Button, HearButton } from "../design/components";
import { getLetter } from "../data/letters";
import { getLetterAsset } from "../audio/player";

// ── Types ──

interface LessonIntroProps {
  lesson: any;
  onStart: () => void;
}

// ── Component ──

export function LessonIntro({ lesson, onStart }: LessonIntroProps) {
  const colors = useColors();

  // Resolve all target letters for display
  const letterIds: number[] = lesson.teachIds ?? lesson.letterIds ?? [];
  const letters = letterIds.map(id => getLetter(id)).filter(Boolean);
  const primaryId = letterIds[0];
  const letter = letters[0];

  // Determine audio type based on phase/mode
  const isSound =
    lesson.lessonMode === "sound" ||
    lesson.lessonMode === "contrast" ||
    lesson.lessonMode === "checkpoint";
  const audioType: "sound" | "name" = isSound ? "sound" : "name";

  // Set up audio player for the primary letter
  const audioSource = primaryId ? getLetterAsset(primaryId, audioType) : null;
  const player = useAudioPlayer(audioSource);

  const handlePlay = useCallback(async () => {
    if (!player) return;
    player.seekTo(0);
    player.play();
  }, [player]);

  // Phase and module label
  const phaseLabel = `Phase ${lesson.phase}${lesson.module ? ` \u00B7 Module ${lesson.module}` : ""}`;

  // Instruction text
  const instruction = isSound
    ? "Tap to hear the sound, then start the quiz"
    : "Tap to hear, then start the quiz";

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header area */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <Text style={[typography.caption, styles.phaseLabel, { color: colors.textMuted }]}>
          {phaseLabel}
        </Text>
        <Text style={[typography.heading1, styles.title, { color: colors.text }]}>
          {lesson.title}
        </Text>
      </Animated.View>

      {/* Center content */}
      <Animated.View
        entering={FadeIn.delay(150).duration(500)}
        style={styles.centerContent}
      >
        {/* Letter circles */}
        {letters.length > 0 && (
          <View style={styles.lettersRow}>
            {letters.map((l: any) => (
              <View key={l.id} style={styles.letterItem}>
                <View
                  style={[
                    styles.letterCircle,
                    letters.length > 2
                      ? styles.letterCircleSmall
                      : undefined,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <ArabicText
                    size={letters.length > 2 ? "large" : "display"}
                    color={colors.primaryDark}
                  >
                    {l.letter}
                  </ArabicText>
                </View>
                <Text
                  style={[
                    typography.bodySmall,
                    { color: colors.textSoft, marginTop: spacing.xs },
                  ]}
                >
                  {l.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Hear button */}
        {letter && audioSource && (
          <View style={styles.hearButtonWrapper}>
            <HearButton
              onPlay={handlePlay}
              accessibilityLabel={`Hear ${letter.name}`}
            />
          </View>
        )}

        {/* Instruction */}
        <Text
          style={[
            typography.body,
            styles.instruction,
            { color: colors.textMuted },
          ]}
        >
          {instruction}
        </Text>

        {/* Family rule / description */}
        {lesson.familyRule && (
          <Text
            style={[
              typography.bodySmall,
              styles.familyRule,
              { color: colors.textSoft },
            ]}
          >
            {lesson.familyRule}
          </Text>
        )}
      </Animated.View>

      {/* Bottom button */}
      <Animated.View
        entering={FadeIn.delay(300).duration(400)}
        style={styles.bottomArea}
      >
        <Button title="Start Quiz" onPress={onStart} />
      </Animated.View>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  phaseLabel: {
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  title: {
    textAlign: "center",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lettersRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  letterItem: {
    alignItems: "center",
  },
  letterCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  letterCircleSmall: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  hearButtonWrapper: {
    marginBottom: spacing.xl,
  },
  instruction: {
    textAlign: "center",
    marginBottom: spacing.md,
  },
  familyRule: {
    textAlign: "center",
    maxWidth: 300,
    lineHeight: 20,
  },
  bottomArea: {
    paddingTop: spacing.lg,
  },
});
