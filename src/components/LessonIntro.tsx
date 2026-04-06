import { View, Text, Pressable, StyleSheet } from "react-native";
import { useCallback, useEffect } from "react";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useAudioPlayer } from "expo-audio";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../design/theme";
import { typography, spacing, radii, shadows, borderWidths, fontFamilies } from "../design/tokens";
import { ArabicText, Button, HearButton, WarmGradient } from "../design/components";
import { getLetter } from "../data/letters";
import { getLetterAsset } from "../audio/player";
import { WarmGlow } from "./onboarding/WarmGlow";
import { springs, staggers, durations, easings } from "../design/animations";
import { hapticTap } from "../design/haptics";

// ── Types ──

interface LessonIntroProps {
  lesson: any;
  onStart: () => void;
  onBack?: () => void;
}

// ── Back arrow icon ──

function BackArrowIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5m0 0l7-7m-7 7l7 7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Lesson mode metadata ──

function getLessonModePill(lesson: any): { text: string; show: boolean } {
  const mode = lesson.lessonMode;
  if (mode === "sound") return { text: "\uD83D\uDD0A Listening Lesson \u2014 learn how these sound", show: true };
  if (mode === "contrast") return { text: "\uD83D\uDD0A Sound Contrast \u2014 hear the difference", show: true };
  if (mode === "checkpoint") return { text: "\uD83D\uDD0A Sound Review \u2014 tap each letter to hear it", show: true };
  return { text: "", show: false };
}

function getCtaText(lesson: any): string {
  const mode = lesson.lessonMode;
  if (mode === "contrast") return "Start comparing";
  if (mode === "sound" || mode === "checkpoint") return "Start listening";
  if (mode === "harakat-intro" || mode === "harakat" || mode === "harakat-mixed") return "Let\u2019s practice";
  return "Start Quiz";
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
          pulseMin={0.10}
          pulseMax={0.30}
        />
        <View
          style={[
            styles.letterCircle,
            isSmall ? styles.letterCircleSmall : undefined,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
          ]}
        >
          <ArabicText
            size={isSmall ? "large" : "display"}
            color={colors.primary}
          >
            {letter.letter}
          </ArabicText>
        </View>
      </View>
      <Text
        style={[
          styles.letterName,
          { color: colors.textSoft },
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

// ── Main Component ──

export function LessonIntro({ lesson, onStart, onBack }: LessonIntroProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const letterIds: number[] = lesson.teachIds ?? lesson.letterIds ?? [];
  const isSmall = letterIds.length > 2;

  // Audio type
  const isSound =
    lesson.lessonMode === "sound" ||
    lesson.lessonMode === "contrast" ||
    lesson.lessonMode === "checkpoint";
  const audioType: "sound" | "name" = isSound ? "sound" : "name";

  // Labels
  const phaseLabel = `Phase ${lesson.phase}${lesson.module ? ` \u00B7 Module ${lesson.module}` : ""}`;
  const modePill = getLessonModePill(lesson);
  const ctaText = getCtaText(lesson);

  const instruction = isSound
    ? "Tap to hear the sound, then start the quiz"
    : "Tap to hear, then start the quiz";

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top + spacing.md, paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
      <WarmGradient color={colors.bgWarm} height={280} />

      {/* Header with back button */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <View style={styles.headerTopRow}>
          {onBack ? (
            <Pressable
              onPress={() => { hapticTap(); onBack(); }}
              style={styles.backButton}
              hitSlop={12}
            >
              <BackArrowIcon color={colors.textSoft} />
            </Pressable>
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}
          <View style={styles.headerCenter}>
            <Text style={[typography.caption, styles.phaseLabel, { color: colors.textMuted }]}>
              {phaseLabel}
            </Text>
          </View>
          <View style={styles.backButtonPlaceholder} />
        </View>
        <Text style={[typography.heading1, styles.title, { color: colors.text }]}>
          {lesson.title}
        </Text>
      </Animated.View>

      {/* Center content */}
      <Animated.View
        entering={FadeIn.delay(150).duration(500)}
        style={styles.centerContent}
      >
        {/* Lesson mode contextual pill */}
        {modePill.show && (
          <View style={[styles.modePill, { backgroundColor: colors.accentLight }]}>
            <Text style={[styles.modePillText, { color: colors.accent }]}>
              {modePill.text}
            </Text>
          </View>
        )}

        {/* Letter cards */}
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

        {/* Family rule */}
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

      {/* Bottom CTA */}
      <Animated.View
        entering={FadeIn.delay(400).duration(400)}
        style={styles.bottomArea}
      >
        <Button title={ctaText} onPress={onStart} />
      </Animated.View>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    // paddingTop and paddingBottom set dynamically via safe area insets
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: spacing.sm,
  },
  backButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonPlaceholder: {
    width: 30,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  phaseLabel: {
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  title: {
    textAlign: "center",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Lesson mode pill
  modePill: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
  },
  modePillText: {
    fontSize: 12,
    fontFamily: fontFamilies.bodyBold,
  },

  // Letters
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
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  letterCircleSmall: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  letterName: {
    fontSize: 14,
    fontFamily: fontFamilies.bodySemiBold,
    marginTop: spacing.sm,
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
    shadowOpacity: 0.04,
  },
  bottomArea: {
    paddingTop: spacing.lg,
  },
});
