import { useEffect, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useColors } from "../../design/theme";
import { spacing, fontFamilies } from "../../design/tokens";
import { durations, easings, staggers } from "../../design/animations";
import { LESSONS } from "../../data/lessons";
import { FREE_LESSON_CUTOFF } from "../../monetization/hooks";
import { JourneyNode } from "./JourneyNode";

// ── Phase labels for inline dividers ──

const PHASE_LABELS: Record<number, string> = {
  1: "Letter Recognition",
  2: "Letter Sounds",
  3: "Harakat (Vowels)",
  4: "Connected Forms",
};

// ── Serpentine x-offsets — matches web ──

const OFFSETS = [4, 16, 8, -4, -12, 0];

// ── Max locked preview ──

const MAX_LOCKED_PREVIEW = 4;

// ── Row pitch: content height (~48px) + marginBottom (44px) = 92px ──

const ROW_PITCH = 92;

// ── Connector ──
//
// Web: one S-curve in viewBox="0 0 40 100", preserveAspectRatio="none",
// vectorEffect="non-scaling-stroke", stretched to fill the journey height.
// The completed solid portion is the SAME path, clipped by container height.

const SVG_W = 40;
const SVG_H = 100;
const MOTIF = "M20 0 C 40 20, 40 30, 20 50 C 0 70, 0 80, 20 100";

function ConnectorLine({
  height,
  color,
  opacity: op,
  dashed,
}: {
  height: number;
  color: string;
  opacity?: number;
  dashed?: boolean;
}) {
  return (
    <Svg
      width={SVG_W}
      height={height}
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      preserveAspectRatio="none"
    >
      <Path
        d={MOTIF}
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
        opacity={op}
        vectorEffect="non-scaling-stroke"
        {...(dashed ? { strokeDasharray: "6 6" } : {})}
      />
    </Svg>
  );
}

function SerpentineConnector({
  totalHeight,
  completedHeight,
  colors,
}: {
  totalHeight: number;
  completedHeight: number;
  colors: any;
}) {
  if (totalHeight < 20) return null;

  return (
    <View style={[styles.svgConnector, { height: totalHeight }]}>
      {/* Layer 1: full dashed background */}
      <View style={StyleSheet.absoluteFill}>
        <ConnectorLine
          height={totalHeight}
          color={colors.border}
          dashed
        />
      </View>

      {/* Layer 2: solid completed — clipped to exact height */}
      {completedHeight > 0 && (
        <View style={[styles.completedClip, { height: completedHeight }]}>
          <ConnectorLine
            height={totalHeight}
            color={colors.primary}
            opacity={0.7}
          />
        </View>
      )}
    </View>
  );
}

// ── Props ──

export interface LessonGridProps {
  currentPhase: number;
  nextLessonId: number | null;
  completedLessonIds: number[];
  onStartLesson: (lessonId: number) => void;
  enterDelay?: number;
  isPremiumActive?: boolean;
  subscriptionLoading?: boolean;
  onLockedLessonPress?: (lessonId: number) => void;
}

// ── Component ──

export default function LessonGrid({
  nextLessonId,
  completedLessonIds,
  onStartLesson,
  enterDelay = 0,
  isPremiumActive,
  subscriptionLoading,
  onLockedLessonPress,
}: LessonGridProps) {
  const colors = useColors();

  const sectionOpacity = useSharedValue(0);

  useEffect(() => {
    sectionOpacity.value = withDelay(
      enterDelay,
      withTiming(1, { duration: durations.normal, easing: easings.contentReveal }),
    );
  }, []);

  const sectionStyle = useAnimatedStyle(() => ({
    opacity: sectionOpacity.value,
  }));

  // ── Cross-phase windowed lesson list ──
  const windowLessons = useMemo(() => {
    let lockedCount = 0;
    const result: typeof LESSONS = [];
    for (let i = 0; i < LESSONS.length; i++) {
      const l = LESSONS[i];
      const done = completedLessonIds.includes(l.id);
      const isCurrent = l.id === nextLessonId;
      if (done || isCurrent) {
        result.push(l);
        lockedCount = 0;
      } else {
        lockedCount++;
        result.push(l);
        if (lockedCount >= MAX_LOCKED_PREVIEW) break;
      }
    }
    return result;
  }, [completedLessonIds, nextLessonId]);

  const completedInWindow = windowLessons.filter((l) =>
    completedLessonIds.includes(l.id)
  ).length;

  const seenPhases = new Set<number>();

  // Connector spans from first node center to last node center
  const totalNodes = windowLessons.length;
  const connectorHeight = Math.max(0, (totalNodes - 1) * ROW_PITCH);

  // Completed solid line stops at the last completed node's center.
  // completedInWindow nodes are done; the solid line spans
  // from node 0 to node (completedInWindow - 1), which is
  // (completedInWindow - 1) gaps × ROW_PITCH pixels.
  const completedHeight = completedInWindow > 0
    ? (completedInWindow - 1) * ROW_PITCH
    : 0;

  return (
    <Animated.View style={[styles.section, sectionStyle]}>
      <View style={styles.journeyPath}>
        <SerpentineConnector
          totalHeight={connectorHeight}
          completedHeight={completedHeight}
          colors={colors}
        />

        {windowLessons.map((lesson: any, i: number) => {
          const complete = completedLessonIds.includes(lesson.id);
          const isCurrent = lesson.id === nextLessonId;
          const isProgressionLocked = !complete && !isCurrent;

          // Premium-locked: pedagogically unlocked (current or future) BUT beyond free cutoff and no subscription
          const isPremiumLocked = !isProgressionLocked && !complete && lesson.id > FREE_LESSON_CUTOFF && !isPremiumActive && !subscriptionLoading;

          const state = complete ? "complete" : (isCurrent && !isPremiumLocked) ? "current" : "locked";
          const offset = OFFSETS[i % OFFSETS.length];

          const showPhaseDivider = !seenPhases.has(lesson.phase) && i > 0;
          seenPhases.add(lesson.phase);

          return (
            <View key={lesson.id}>
              {showPhaseDivider && (
                <View style={styles.phaseDivider}>
                  <Text
                    style={[
                      styles.phaseDividerText,
                      { color: colors.textMuted, backgroundColor: colors.bg },
                    ]}
                  >
                    Phase {lesson.phase} {"\u00B7"} {PHASE_LABELS[lesson.phase] ?? ""}
                  </Text>
                </View>
              )}
              <JourneyNode
                lesson={lesson}
                state={state}
                offset={offset}
                enterDelay={enterDelay + 200 + i * staggers.fast.delay}
                onPress={isPremiumLocked && onLockedLessonPress ? onLockedLessonPress : onStartLesson}
                premiumLocked={isPremiumLocked}
              />
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
  },
  journeyPath: {
    position: "relative",
    paddingLeft: spacing.xxl,
    paddingVertical: spacing.sm,
  },
  svgConnector: {
    position: "absolute",
    // Node circle center: paddingLeft(32) + circleWrap(48)/2 = 56.
    // SVG horizontal center: left + 20. → left = 36.
    left: 36,
    // First node center: paddingVert(8) + circleWrap(48)/2 = 32.
    top: 32,
    width: SVG_W,
    zIndex: 0,
  },
  completedClip: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SVG_W,
    overflow: "hidden",
  },
  phaseDivider: {
    marginBottom: 20,
    marginLeft: -8,
  },
  phaseDividerText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    overflow: "hidden",
  },
});
