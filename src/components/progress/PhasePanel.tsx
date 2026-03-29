import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useEffect } from "react";
import { useColors } from "../../design/theme";
import { typography, spacing, fontFamilies } from "../../design/tokens";
import { springs } from "../../design/animations";
import { Card } from "../../design/components";

export interface PhasePanelProps {
  label: string;
  done: number;
  total: number;
}

export default function PhasePanel({ label, done, total }: PhasePanelProps) {
  const colors = useColors();

  const pct = total > 0 ? (done / total) * 100 : 0;
  const isComplete = done === total && total > 0;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(pct / 100, springs.gentle);
  }, [done, total]);

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <Card style={{ padding: spacing.lg }}>
      <View style={styles.phaseHeader}>
        <View style={styles.phaseHeaderLeft}>
          {/* Status dot */}
          <View
            style={[
              styles.phaseDot,
              {
                backgroundColor: isComplete
                  ? colors.primary
                  : done > 0
                  ? colors.primarySoft
                  : colors.bgCard,
                borderColor: done > 0 ? colors.primary : colors.border,
                borderWidth: isComplete ? 0 : 2,
              },
            ]}
          >
            {isComplete && (
              <Text style={{ color: colors.white, fontSize: 12 }}>
                {"\u2713"}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                typography.bodyLarge,
                {
                  color: colors.text,
                  fontFamily: fontFamilies.headingMedium,
                },
              ]}
            >
              {label}
            </Text>
          </View>
        </View>
        <Text
          style={[
            styles.phaseCount,
            {
              color: isComplete ? colors.primary : colors.textMuted,
            },
          ]}
        >
          {done}/{total}
        </Text>
      </View>

      {/* Progress bar */}
      {total > 0 && (
        <View
          style={[styles.progressTrack, { backgroundColor: colors.border }]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary },
              animatedFillStyle,
            ]}
          />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  phaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  phaseHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  phaseDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  phaseCount: {
    ...typography.bodySmall,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
});
