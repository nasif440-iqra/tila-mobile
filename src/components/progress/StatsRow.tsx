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
    <View style={styles.statsRow}>
      {stats.map((stat) => (
        <Card key={stat.label} style={styles.statCard}>
          <Text
            style={[
              typography.heading2,
              { color: colors.primary, textAlign: "center" },
            ]}
          >
            {stat.value}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>
            {stat.label}
          </Text>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.bodySemiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
