import { View, Text, StyleSheet } from "react-native";
import { useColors } from "../../design/theme";
import { typography, spacing, radii, fontFamilies } from "../../design/tokens";
import type { ConfusionPairDisplay } from "../../engine/insights";

// ── Component ──

interface ConfusionPairsSectionProps {
  confusionPairs: ConfusionPairDisplay[];
}

export function ConfusionPairsSection({ confusionPairs }: ConfusionPairsSectionProps) {
  if (confusionPairs.length === 0) return null;

  const colors = useColors();

  return (
    <View style={styles.container}>
      <Text style={[typography.sectionHeader, { color: colors.brownLight }]}>
        Letters You Mix Up
      </Text>
      <Text style={[typography.bodySmall, styles.subtitle, { color: colors.textMuted }]}>
        Tila is tracking these for you
      </Text>

      {confusionPairs.map((pair, index) => (
        <View
          key={`${pair.letter1Name}-${pair.letter2Name}`}
          style={[
            styles.pairCard,
            { backgroundColor: colors.bgCard, borderColor: colors.border },
          ]}
        >
          <View style={styles.pairLetters}>
            <Text
              style={[
                styles.arabicChar,
                { color: colors.text, fontFamily: fontFamilies.arabicRegular },
              ]}
            >
              {pair.letter1Char}
            </Text>
            <Text style={[styles.andText, { color: colors.textMuted }]}>and</Text>
            <Text
              style={[
                styles.arabicChar,
                { color: colors.text, fontFamily: fontFamilies.arabicRegular },
              ]}
            >
              {pair.letter2Char}
            </Text>
          </View>
          <Text style={[typography.bodySmall, { color: colors.textSoft }]}>
            {pair.letter1Name} and {pair.letter2Name}
          </Text>
          <Text style={[styles.countText, { color: colors.textMuted }]}>
            mixed up {pair.count} {pair.count === 1 ? "time" : "times"}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  pairCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    alignItems: "center",
  },
  pairLetters: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  arabicChar: {
    fontSize: 28,
    lineHeight: 40,
    writingDirection: "rtl",
  },
  andText: {
    fontSize: 13,
    fontFamily: fontFamilies.bodyRegular,
  },
  countText: {
    fontSize: 12,
    fontFamily: fontFamilies.bodyRegular,
    marginTop: spacing.xs,
  },
});
