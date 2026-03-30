import { View, Text, StyleSheet } from "react-native";
import { useColors } from "../../design/theme";
import { typography, spacing, fontFamilies } from "../../design/tokens";
import { Card } from "../../design/components";

export interface StatsRowProps {
  learnedCount: number;
  totalDone: number;
  totalLessons: number;
  accuracy: number;
  hasAttempts: boolean;
  currentPhase: number;
}

export default function StatsRow({
  learnedCount,
  totalDone,
  totalLessons,
  accuracy,
  hasAttempts,
  currentPhase,
}: StatsRowProps) {
  const colors = useColors();

  const stats = [
    { label: "Letters", value: String(learnedCount) },
    { label: "Lessons", value: `${totalDone}/${totalLessons}` },
    {
      label: "Accuracy",
      value: hasAttempts ? `${accuracy}%` : "\u2014",
    },
    { label: "Phase", value: String(currentPhase) },
  ];

  return (
    <View style={styles.grid}>
      {stats.map((stat) => (
        <View key={stat.label} style={styles.cellWrapper}>
          <Card style={styles.statCard}>
            <Text
              style={[
                styles.statValue,
                {
                  color:
                    stat.label === "Accuracy" &&
                    stat.value !== "\u2014" &&
                    parseInt(stat.value) > 80
                      ? colors.accent
                      : colors.primary,
                },
              ]}
              numberOfLines={1}
            >
              {stat.value}
            </Text>
            <Text
              style={[styles.statLabel, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {stat.label}
            </Text>
          </Card>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  cellWrapper: {
    width: "47%",
    flexGrow: 1,
  },
  statCard: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  statValue: {
    fontFamily: fontFamilies.headingMedium,
    fontSize: 28,
    lineHeight: 36,
  },
  statLabel: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  },
});
