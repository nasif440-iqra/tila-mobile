import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  AccessibilityInfo,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { useColors } from "../../design/theme";
import { typography, spacing, radii } from "../../design/tokens";
import type { LessonCell } from "../../curriculum/runtime/grid-state";

interface LessonGridProps {
  cells: LessonCell[];
  titles: Record<string, string>;
  onPress: (lessonId: string) => void;
}

function cellStatus(state: LessonCell["state"]): string {
  switch (state) {
    case "completed":
      return "completed";
    case "current":
      return "next up";
    case "locked":
      return "locked";
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

function cellBadgeText(state: LessonCell["state"]): string {
  switch (state) {
    case "completed":
      return "Done";
    case "current":
      return "Start";
    case "locked":
      return "Locked";
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

function cellAccessibilityLabel(cell: LessonCell, title: string): string {
  return `${title}, ${cellStatus(cell.state)}`;
}

export function LessonGrid({ cells, titles, onPress }: LessonGridProps) {
  const colors = useColors();
  const hasCurrent = useMemo(
    () => cells.some((c) => c.state === "current"),
    [cells]
  );
  const [reduceMotion, setReduceMotion] = useState(false);
  const glow = useSharedValue(0);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (alive) setReduceMotion(value);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion
    );
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion || !hasCurrent) {
      cancelAnimation(glow);
      glow.value = 0;
      return;
    }
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400 }),
        withTiming(0, { duration: 1400 })
      ),
      -1,
      false
    );
    return () => cancelAnimation(glow);
  }, [reduceMotion, hasCurrent, glow]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + glow.value * 0.5,
  }));

  return (
    <View style={styles.column}>
      {cells.map((cell) => {
        const title = titles[cell.lessonId] ?? cell.lessonId;
        const interactive =
          cell.state === "completed" || cell.state === "current";
        const isCurrent = cell.state === "current";
        return (
          <Pressable
            key={cell.lessonId}
            onPress={interactive ? () => onPress(cell.lessonId) : undefined}
            disabled={!interactive}
            accessibilityRole={interactive ? "button" : "text"}
            accessibilityLabel={cellAccessibilityLabel(cell, title)}
            style={[
              styles.cell,
              {
                backgroundColor: colors.bgCard,
                borderColor: isCurrent ? colors.accent : colors.border,
                opacity: cell.state === "locked" ? 0.45 : 1,
              },
            ]}
          >
            {isCurrent && !reduceMotion && (
              <Animated.View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    borderRadius: radii.lg,
                    borderWidth: 2,
                    borderColor: colors.accent,
                  },
                  glowStyle,
                ]}
              />
            )}
            <View style={styles.row}>
              <Text style={[styles.title, { color: colors.text }]}>
                {title}
              </Text>
              <Text style={[styles.badge, { color: colors.textSoft }]}>
                {cellBadgeText(cell.state)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: spacing.md, paddingHorizontal: spacing.md },
  cell: {
    minHeight: 72,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: "center",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { ...typography.heading3 },
  badge: { ...typography.caption },
});
