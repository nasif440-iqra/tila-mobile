import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useColors } from "../../design/theme";
import { typography, spacing, radii, fontFamilies } from "../../design/tokens";
import type { LessonInsight } from "../../engine/insights";

// ── Indicator colors by insight type ──

function getIndicatorColor(type: LessonInsight["type"], colors: any) {
  switch (type) {
    case "mastery":
      return colors.accent;       // gold — celebratory
    case "confusion":
      return colors.primaryLight; // soft green — constructive, not alarming
    case "encouragement":
      return colors.primary;      // deep green — grounding
    default:
      return colors.textMuted;
  }
}

// ── Component ──

interface LessonInsightsProps {
  insights?: LessonInsight[];
}

export function LessonInsights({ insights }: LessonInsightsProps) {
  if (!insights || insights.length === 0) return null;

  const colors = useColors();

  return (
    <Animated.View
      entering={FadeIn.duration(300).delay(200)}
      style={[
        styles.card,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[typography.sectionHeader, { color: colors.brownLight }]}>
        How You Did
      </Text>

      {insights.map((insight, index) => (
        <View key={index} style={styles.insightRow}>
          <View
            style={[
              styles.indicator,
              { backgroundColor: getIndicatorColor(insight.type, colors) },
            ]}
          />
          <Text
            style={[
              typography.body,
              styles.insightText,
              { color: colors.text },
            ]}
          >
            {insight.message}
          </Text>
        </View>
      ))}
    </Animated.View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.md,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: spacing.sm,
  },
  insightText: {
    flex: 1,
  },
});
