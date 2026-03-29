import { View, Text, StyleSheet } from "react-native";
import { useCallback, useEffect } from "react";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useAudioPlayer } from "expo-audio";
import { useColors } from "../design/theme";
import { typography, spacing, radii, shadows, borderWidths } from "../design/tokens";
import { ArabicText, Button, HearButton, WarmGradient } from "../design/components";
import { getLetter } from "../data/letters";
import { getLetterAsset } from "../audio/player";
import { WarmGlow } from "./onboarding/WarmGlow";
import { springs, staggers, durations, easings } from "../design/animations";

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
  index,
}: {
  letterId: number;
  audioType: "sound" | "name";
  isSmall: boolean;
  index: number;
}) {
  const colors = useColors();
  const letter = getLetter(letterId);
  const audioSource = getLetterAsset(letterId, audioType);
  const player = useAudioPlayer(audioSource);

  // Staggered scale entrance
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);
  useEffect(() => {
    const delay = 200 + index * staggers.fast.delay;
    const timer = setTimeout(() => {
      scale.value = withSpring(1, springs.bouncy);
      opacity.value = withTiming(1, { duration: durations.slow, easing: easings.contentReveal });
    }, delay);
    return () => clearTimeout(timer);
  }, []);
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePlay = useCallback(async () => {
    if (!player) return;
    player.seekTo(0);
    player.play();
  }, [player]);

  if (!letter) return null;

  return (
    <Animated.View style={[styles.letterItem, scaleStyle]}>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <WarmGlow
          size={isSmall ? 140 : 200}
          animated
          color="rgba(196,164,100,0.3)"
          pulseMin={0.12}
          pulseMax={0.35}
        />
        <View
          style={[
            styles.letterCircle,
            isSmall ? styles.letterCircleSmall : undefined,
            {
              backgroundColor: colors.primarySoft,
              borderColor: "rgba(255, 255, 255, 0.8)",
            },
          ]}
        >
          <ArabicText
            size={isSmall ? "large" : "display"}
            color={colors.primaryDark}
          >
            {letter.letter}
          </ArabicText>
        </View>
      </View>
      <Text
        style={[
          typography.bodySmall,
          { color: colors.textSoft, marginTop: spacing.sm, fontWeight: "600" },
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
    </Animated.View>
  );
}

// ── Main Component ─���

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
      {/* Warm ambient gradient */}
      <WarmGradient color={colors.bgWarm} height={280} />

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
            {letterIds.map((id: number, idx: number) => (
              <LetterCard
                key={id}
                letterId={id}
                audioType={audioType}
                isSmall={isSmall}
                index={idx}
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
          <View style={[styles.familyRuleCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text
              style={[
                typography.bodySmall,
                { color: colors.textSoft, textAlign: "center", lineHeight: 20 },
              ]}
            >
              {lesson.familyRule}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Bottom button */}
      <Animated.View
        entering={FadeIn.delay(400).duration(400)}
        style={styles.bottomArea}
      >
        <Button title="Start Quiz" onPress={onStart} />
      </Animated.View>
    </View>
  );
}

// ── Styles ─��

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
    letterSpacing: 1.5,
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
    gap: spacing.xxl,
    marginBottom: spacing.xl,
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
    borderWidth: 2,
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
  familyRuleCard: {
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    maxWidth: 320,
    ...shadows.card,
  },
  bottomArea: {
    paddingTop: spacing.lg,
  },
});
