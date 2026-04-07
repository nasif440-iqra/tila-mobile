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
  radii,
  shadows,
  fontFamilies,
} from "../../design/tokens";
import { LockIcon } from "../monetization/LockIcon";
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
  premiumLocked?: boolean;
  /** When true, a "locked" node is still tappable (e.g. beta / all-unlocked). */
  accessible?: boolean;
}

// ── Icons ──

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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ── Sizes matching web: completed/locked 40, current 44 ──

const NODE_SIZE = 40;
const CURRENT_NODE_SIZE = 44;
const OUTLINE_W = 4; // outline: 4px solid bg — matches web

// ── Component ──

export function JourneyNode({
  lesson,
  state,
  offset,
  enterDelay = 0,
  onPress,
  premiumLocked = false,
  accessible = false,
}: JourneyNodeProps) {
  const colors = useColors();

  // Entrance
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

  // Press
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

  // Breathing ring — current node
  const breatheScale = useSharedValue(1);
  const breatheOpacity = useSharedValue(0.25);

  useEffect(() => {
    if (state === "current") {
      breatheScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
      breatheOpacity.value = withRepeat(
        withSequence(
          withTiming(0.35, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    }
  }, [state]);

  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value }],
    opacity: breatheOpacity.value,
  }));

  // Letter preview
  const firstLetter = lesson.teachIds?.length ? getLetter(lesson.teachIds[0]) : undefined;

  // ── Circle ──

  function renderCircle() {
    if (state === "complete") {
      return (
        <View style={styles.circleWrap}>
          {/* Outline ring — web: outline: 4px solid bg */}
          <View style={[styles.outlineRing, { backgroundColor: colors.bg }]} />
          <View
            style={[
              styles.circle,
              { backgroundColor: colors.primary },
              shadows.card,
            ]}
          >
            <CheckIcon size={16} color={colors.accent} />
          </View>
        </View>
      );
    }

    if (state === "current") {
      return (
        <View style={styles.currentCircleWrap}>
          {/* Breathing ring */}
          <Animated.View
            style={[
              styles.breathingRing,
              { borderColor: colors.primary },
              breatheStyle,
            ]}
          />
          {/* Outline ring */}
          <View style={[styles.currentOutlineRing, { backgroundColor: colors.bg }]} />
          <View
            style={[
              styles.currentCircle,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.primary,
              },
              shadows.card,
            ]}
          >
            <View style={[styles.currentDot, { backgroundColor: colors.primary }]} />
          </View>
        </View>
      );
    }

    // Locked
    return (
      <View style={styles.circleWrap}>
        <View style={[styles.outlineRing, { backgroundColor: colors.bg }]} />
        <View
          style={[
            styles.circle,
            styles.circleLocked,
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
            <View style={[styles.lockedDash, { backgroundColor: colors.border }]} />
          )}
        </View>
      </View>
    );
  }

  // ── Label ──

  function renderLabel() {
    if (state === "current") {
      // Compact frosted card — matches web's padding: 10px 16px, borderRadius: 16
      return (
        <View
          style={[
            styles.currentCard,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.currentTitle, { color: colors.text }]}>
            {lesson.title}
          </Text>
          <View style={styles.upNextRow}>
            <View style={[styles.upNextDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.upNextText, { color: colors.accent }]}>Up next</Text>
          </View>
        </View>
      );
    }

    if (state === "complete") {
      return (
        <View>
          <Text style={[styles.nodeTitle, { color: colors.text }]}>
            {lesson.title}
          </Text>
          <View style={styles.completedRow}>
            <CheckIcon size={10} color={colors.primary} />
            <Text style={[styles.nodeSubtitle, { color: colors.textSoft }]}>
              Completed
            </Text>
          </View>
        </View>
      );
    }

    // Locked
    return (
      <View>
        <Text style={[styles.nodeTitle, { color: colors.textMuted }]}>
          {lesson.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          {premiumLocked && <LockIcon size={12} color={colors.accent} />}
          <Text style={[styles.nodeSubtitle, { color: premiumLocked ? colors.accent : colors.textMuted }]}>
            {premiumLocked ? "Unlock with Tila Premium" : "Locked"}
          </Text>
        </View>
      </View>
    );
  }

  // ── Render ──

  const rowOpacity = state === "locked" ? 0.4 : state === "complete" ? 0.85 : 1;

  const rowStyle = [
    styles.nodeRow,
    { transform: [{ translateX: offset }], opacity: rowOpacity },
  ];

  if (state === "locked" && !premiumLocked && !accessible) {
    return (
      <Animated.View style={entranceStyle}>
        <View style={rowStyle}>
          {renderCircle()}
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
        {renderCircle()}
        {renderLabel()}
      </AnimatedPressable>
    </Animated.View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  // Row — web gap: 20, marginBottom via gap: 44
  nodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 44,
  },

  // ── Completed / Locked circle (40px + 4px outline) ──
  circleWrap: {
    width: NODE_SIZE + OUTLINE_W * 2,
    height: NODE_SIZE + OUTLINE_W * 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  outlineRing: {
    position: "absolute",
    width: NODE_SIZE + OUTLINE_W * 2,
    height: NODE_SIZE + OUTLINE_W * 2,
    borderRadius: (NODE_SIZE + OUTLINE_W * 2) / 2,
    zIndex: 1,
  },
  circle: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  circleLocked: {
    borderWidth: 2,
  },
  lockedDash: {
    width: 12,
    height: 2,
    borderRadius: 1,
  },

  // ── Current circle (44px + outline + breathing ring) ──
  currentCircleWrap: {
    width: CURRENT_NODE_SIZE + OUTLINE_W * 2 + 8,
    height: CURRENT_NODE_SIZE + OUTLINE_W * 2 + 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  breathingRing: {
    position: "absolute",
    width: CURRENT_NODE_SIZE + 8,
    height: CURRENT_NODE_SIZE + 8,
    borderRadius: (CURRENT_NODE_SIZE + 8) / 2,
    borderWidth: 1.5,
    zIndex: 0,
  },
  currentOutlineRing: {
    position: "absolute",
    width: CURRENT_NODE_SIZE + OUTLINE_W * 2,
    height: CURRENT_NODE_SIZE + OUTLINE_W * 2,
    borderRadius: (CURRENT_NODE_SIZE + OUTLINE_W * 2) / 2,
    zIndex: 1,
  },
  currentCircle: {
    width: CURRENT_NODE_SIZE,
    height: CURRENT_NODE_SIZE,
    borderRadius: CURRENT_NODE_SIZE / 2,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  currentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // ── Current label — compact card (web: padding 10px 16px, borderRadius 16) ──
  currentCard: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  currentTitle: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  upNextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  upNextDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  upNextText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // ── Completed / Locked labels ──
  nodeTitle: {
    fontSize: 15,
    fontFamily: fontFamilies.bodyMedium,
  },
  nodeSubtitle: {
    fontSize: 12,
    fontFamily: fontFamilies.bodyRegular,
    marginTop: 2,
  },
  completedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
});
