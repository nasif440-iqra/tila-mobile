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

// ── Per-letter card with its own audio player ──

function LetterCard({
  letterId,
  audioType,
  isSmall,
}: {
  letterId: number;
  audioType: "sound" | "name";
  isSmall: boolean;
}) {
  const colors = useColors();
  const letter = getLetter(letterId);
  const audioSource = getLetterAsset(letterId, audioType);
  const player = useAudioPlayer(audioSource);

  const handlePlay = useCallback(async () => {
    if (!player) return;
    player.seekTo(0);
    player.play();
  }, [player]);

  if (!letter) return null;

  return (
    <View style={styles.letterItem}>
      <View
        style={[
          styles.letterCircle,
          isSmall ? styles.letterCircleSmall : undefined,
          { backgroundColor: colors.primarySoft },
        ]}
      >
        <ArabicText
          size={isSmall ? "large" : "display"}
          color={colors.primaryDark}
        >
          {letter.letter}
        </ArabicText>
      </View>
      <Text
        style={[
          typography.bodySmall,
          { color: colors.textSoft, marginTop: spacing.xs },
        ]}
      >
        {letter.name}
      </Text>
      {audioSource && (
        <View style={{ marginTop: spacing.sm }}>
          <HearButton
            onPlay={handlePlay}
            size={36}
            accessibilityLabel={`Hear ${letter.name}`}
          />
        </View>
      )}
    </View>
  );
}

// ── Main Component ──

export function LessonIntro({ lesson, onStart }: LessonIntroProps) {
  const colors = useColors();

  const letterIds: number[] = lesson.teachIds ?? lesson.letterIds ?? [];
  const isSmall = letterIds.length > 2;

  // Determine audio type based on phase/mode
  const isSound =
    lesson.lessonMode === "sound" ||
    lesson.lessonMode === "contrast" ||
    lesson.lessonMode === "checkpoint";
  const audioType: "sound" | "name" = isSound ? "sound" : "name";

  // Phase and module label
  const phaseLabel = `Phase ${lesson.phase}${lesson.module ? ` \u00B7 Module ${lesson.module}` : ""}`;

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
        {/* Letter cards with individual audio */}
        {letterIds.length > 0 && (
          <View style={styles.lettersRow}>
            {letterIds.map((id: number) => (
              <LetterCard
                key={id}
                letterId={id}
                audioType={audioType}
                isSmall={isSmall}
              />
            ))}
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
