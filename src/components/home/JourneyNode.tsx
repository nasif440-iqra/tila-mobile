import { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { ArabicText } from "../../design/components";
import { useColors } from "../../design/theme";
import {
  spacing,
  typography,
  radii,
  shadows,
  borderWidths,
  fontFamilies,
} from "../../design/tokens";
import { springs, staggers, easings, pressScale } from "../../design/animations";
import { hapticTap } from "../../design/haptics";
import { getLetter } from "../../data/letters.js";

// ── Props ──

export interface JourneyNodeProps {
  lesson: { id: number; title: string; teachIds?: number[] };
  state: "complete" | "current" | "locked";
  offset: number;
  enterDelay?: number;
  onPress: (lessonId: number) => void;
}

// ── Icon helpers (extracted from LessonGrid.tsx) ──

function CheckIcon({ size = 16, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockIcon({ size = 14, color = "#6B6760" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Animated Pressable ──

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ── Component ──

export function JourneyNode({
  lesson,
  state,
  offset,
  enterDelay = 0,
  onPress,
}: JourneyNodeProps) {
  const colors = useColors();

  // Entrance animation
  const enterOpacity = useSharedValue(0);
  const enterTranslateY = useSharedValue(8);

  useEffect(() => {
    enterOpacity.value = withDelay(
      enterDelay,
      withTiming(1, { duration: staggers.fast.duration, easing: easings.contentReveal }),
    );
    enterTranslateY.value = withDelay(
      enterDelay,
      withTiming(0, { duration: staggers.fast.duration, easing: easings.contentReveal }),
    );
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: enterOpacity.value,
    transform: [{ translateY: enterTranslateY.value }],
  }));

  // Press feedback
  const pressScaleValue = useSharedValue(1);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScaleValue.value }],
  }));

  function handlePressIn() {
    pressScaleValue.value = withSpring(pressScale.subtle, springs.press);
  }

  function handlePressOut() {
    pressScaleValue.value = withSpring(1, springs.press);
  }

  function handlePress() {
    hapticTap();
    onPress(lesson.id);
  }

  // Current node glow ring animation
  const glowOpacity = useSharedValue(0.08);

  useEffect(() => {
    if (state === "current") {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.08, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    }
  }, [state]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Letter preview for locked state
  const firstLetter = lesson.teachIds?.length
    ? getLetter(lesson.teachIds[0])
    : undefined;

  // Row opacity per state
  const stateOpacity = state === "locked" ? 0.4 : state === "complete" ? 0.85 : 1;

  // ── Render node circle ──

  function renderNodeCircle() {
    if (state === "complete") {
      return (
        <View
          style={[
            styles.nodeCircle,
            styles.nodeComplete,
            { backgroundColor: colors.primary },
          ]}
        >
          <CheckIcon size={16} color={colors.accent} />
        </View>
      );
    }

    if (state === "current") {
      return (
        <View style={styles.currentNodeWrapper}>
          {/* Subtle glow ring */}
          <Animated.View
            style={[
              styles.glowRing,
              { backgroundColor: colors.accentGlow },
              glowStyle,
            ]}
          />
          <View
            style={[
              styles.nodeCircle,
              styles.nodeCurrent,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.primary,
              },
            ]}
          >
            <View style={[styles.currentDot, { backgroundColor: colors.primary }]} />
          </View>
        </View>
      );
    }

    // Locked
    return (
      <View
        style={[
          styles.nodeCircle,
          styles.nodeLocked,
          {
            backgroundColor: colors.bg,
            borderColor: colors.border,
          },
        ]}
      >
        {firstLetter ? (
          <ArabicText
            size="body"
            color={colors.textMuted}
            style={{ fontSize: 18, lineHeight: 24 }}
          >
            {firstLetter.letter}
          </ArabicText>
        ) : (
          <LockIcon size={14} color={colors.textMuted} />
        )}
      </View>
    );
  }

  // ── Render label ──

  function renderLabel() {
    if (state === "current") {
      return (
        <View
          style={[
            styles.currentLabel,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.currentLabelTitle, { color: colors.brown }]}>
            {lesson.title}
          </Text>
          <View style={styles.upNextRow}>
            <View style={[styles.upNextDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.upNextText, { color: colors.accent }]}>Up next</Text>
          </View>
        </View>
      );
    }

    return (
      <View>
        <Text
          style={[
            styles.nodeTitle,
            { color: state === "locked" ? colors.textMuted : colors.text },
          ]}
        >
          {lesson.title}
        </Text>
        <Text
          style={[
            styles.nodeSubtitle,
            { color: state === "locked" ? colors.textMuted : colors.textSoft },
          ]}
        >
          {state === "complete" ? "Completed" : "Locked"}
        </Text>
      </View>
    );
  }

  // ── Render ──

  const rowStyle = [
    styles.nodeRow,
    { transform: [{ translateX: offset }], opacity: stateOpacity },
  ];

  if (state === "locked") {
    return (
      <Animated.View style={entranceStyle}>
        <View style={rowStyle}>
          {renderNodeCircle()}
          {renderLabel()}
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={entranceStyle}>
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[rowStyle, pressStyle]}
      >
        {renderNodeCircle()}
        {renderLabel()}
      </AnimatedPressable>
    </Animated.View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  nodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
    marginBottom: spacing.xxxl,
  },
  nodeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  nodeComplete: {
    ...shadows.card,
  },
  nodeCurrent: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: borderWidths.thick,
    ...shadows.card,
  },
  nodeLocked: {
    borderWidth: borderWidths.thick,
  },
  currentNodeWrapper: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  glowRing: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  currentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  currentLabel: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
    ...shadows.card,
  },
  currentLabelTitle: {
    ...typography.cardHeadline,
    fontSize: 15,
  },
  upNextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  upNextDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  upNextText: {
    ...typography.label,
  },
  nodeTitle: {
    fontSize: 15,
    fontFamily: fontFamilies.bodyMedium,
  },
  nodeSubtitle: {
    fontSize: 12,
    fontFamily: fontFamilies.bodyRegular,
    marginTop: spacing.xs,
  },
});
