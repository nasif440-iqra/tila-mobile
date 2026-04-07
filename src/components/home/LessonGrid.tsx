import { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useColors } from "../../design/theme";
import { spacing, fontFamilies, radii } from "../../design/tokens";
import { durations, easings, staggers } from "../../design/animations";
import { LESSONS } from "../../data/lessons";
import { FREE_LESSON_CUTOFF } from "../../monetization/hooks";
import { JourneyNode } from "./JourneyNode";

// ── Phase labels ──

const PHASE_LABELS: Record<number, string> = {
  1: "Letter Recognition",
  2: "Letter Sounds",
  3: "Harakat (Vowels)",
  4: "Connected Forms",
};

// ── Serpentine x-offsets ──

const OFFSETS = [4, 16, 8, -4, -12, 0];

// ── Row pitch ──

const ROW_PITCH = 92;

// ── Connector ──

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
      <View style={StyleSheet.absoluteFill}>
        <ConnectorLine
          height={totalHeight}
          color={colors.border}
          dashed
        />
      </View>

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

// ── Phase section with collapsible header ──

interface PhaseGroup {
  phase: number;
  lessons: any[];
  completedCount: number;
  totalCount: number;
  hasCurrentLesson: boolean;
}

function PhaseHeader({
  phase,
  completedCount,
  totalCount,
  expanded,
  onToggle,
  colors,
}: {
  phase: number;
  completedCount: number;
  totalCount: number;
  expanded: boolean;
  onToggle: () => void;
  colors: any;
}) {
  const allDone = completedCount === totalCount;
  const label = PHASE_LABELS[phase] ?? `Phase ${phase}`;

  return (
    <Pressable onPress={onToggle} style={[styles.phaseHeader, { borderColor: colors.border }]}>
      <View style={styles.phaseHeaderLeft}>
        <View style={[
          styles.phaseIndicator,
          { backgroundColor: allDone ? colors.primary : colors.accent },
        ]}>
          {allDone ? (
            <Text style={styles.phaseCheckmark}>✓</Text>
          ) : (
            <Text style={[styles.phaseNumber, { color: "#fff" }]}>{phase}</Text>
          )}
        </View>
        <View>
          <Text style={[styles.phaseLabel, { color: colors.text }]}>{label}</Text>
          <Text style={[styles.phaseProgress, { color: colors.textMuted }]}>
            {completedCount}/{totalCount} lessons
          </Text>
        </View>
      </View>
      <Text style={[styles.chevron, { color: colors.textMuted }]}>
        {expanded ? "▲" : "▼"}
      </Text>
    </Pressable>
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

  // Memoize Set for O(1) lookups instead of repeated .includes()
  const completedSet = useMemo(() => new Set(completedLessonIds), [completedLessonIds]);

  // ── Group lessons by phase ──
  const phaseGroups = useMemo(() => {
    const groups: PhaseGroup[] = [];
    let currentGroup: PhaseGroup | null = null;

    for (const lesson of LESSONS) {
      if (!currentGroup || currentGroup.phase !== lesson.phase) {
        currentGroup = {
          phase: lesson.phase,
          lessons: [],
          completedCount: 0,
          totalCount: 0,
          hasCurrentLesson: false,
        };
        groups.push(currentGroup);
      }
      currentGroup.lessons.push(lesson);
      currentGroup.totalCount++;
      if (completedSet.has(lesson.id)) {
        currentGroup.completedCount++;
      }
      if (lesson.id === nextLessonId) {
        currentGroup.hasCurrentLesson = true;
      }
    }
    return groups;
  }, [completedSet, nextLessonId]);

  // ── Expanded state: current phase + phases with incomplete lessons ──
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    for (const group of phaseGroups) {
      // Expand the phase that has the current lesson, or phases not fully complete
      if (group.hasCurrentLesson || (group.completedCount > 0 && group.completedCount < group.totalCount)) {
        initial.add(group.phase);
      }
    }
    // If nothing is expanded (brand new user), expand phase 1
    if (initial.size === 0) initial.add(1);
    return initial;
  });

  const togglePhase = useCallback((phase: number) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phase)) {
        next.delete(phase);
      } else {
        next.add(phase);
      }
      return next;
    });
  }, []);

  return (
    <Animated.View style={[styles.section, sectionStyle]}>
      {phaseGroups.map((group) => {
        const expanded = expandedPhases.has(group.phase);
        const completedInGroup = group.completedCount;

        return (
          <View key={group.phase} style={styles.phaseSection}>
            <PhaseHeader
              phase={group.phase}
              completedCount={group.completedCount}
              totalCount={group.totalCount}
              expanded={expanded}
              onToggle={() => togglePhase(group.phase)}
              colors={colors}
            />

            {expanded && (
              <View style={styles.journeyPath}>
                <SerpentineConnector
                  totalHeight={Math.max(0, (group.lessons.length - 1) * ROW_PITCH)}
                  completedHeight={completedInGroup > 0 ? (completedInGroup - 1) * ROW_PITCH : 0}
                  colors={colors}
                />

                {group.lessons.map((lesson: any, i: number) => {
                  const complete = completedSet.has(lesson.id);
                  // Only the true next lesson gets "current" (breathing animation).
                  // Completed = "complete", everything else = "locked" (static).
                  const state = complete
                    ? "complete"
                    : lesson.id === nextLessonId
                      ? "current"
                      : "locked";
                  const offset = OFFSETS[i % OFFSETS.length];

                  return (
                    <JourneyNode
                      key={lesson.id}
                      lesson={lesson}
                      state={state}
                      offset={offset}
                      enterDelay={i < 6 ? 50 + i * staggers.fast.delay : 0}
                      onPress={onStartLesson}
                      premiumLocked={false}
                      accessible={state === "locked"}
                    />
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </Animated.View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
  },
  phaseSection: {
    marginBottom: spacing.md,
  },
  phaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  phaseHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  phaseIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  phaseNumber: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
  },
  phaseCheckmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  phaseLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
  },
  phaseProgress: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    fontSize: 10,
    marginRight: spacing.sm,
  },
  journeyPath: {
    position: "relative",
    paddingLeft: spacing.xxl,
    paddingVertical: spacing.sm,
  },
  svgConnector: {
    position: "absolute",
    left: 36,
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
});
