import { View, Text, StyleSheet } from "react-native";
import { useColors } from "../../design/theme";
import { typography, spacing, radii, fontFamilies } from "../../design/tokens";
import type { ReviewGroups } from "../../engine/insights";

// ── Component ──

interface ReviewScheduleSectionProps {
  reviewGroups: ReviewGroups;
}

function LetterChips({
  letters,
  bgColor,
  colors,
}: {
  letters: Array<{ entityKey: string; letterName: string; letterChar: string }>;
  bgColor: string;
  colors: any;
}) {
  return (
    <View style={styles.chipsRow}>
      {letters.map((item) => (
        <View
          key={item.entityKey}
          style={[styles.chip, { backgroundColor: bgColor }]}
        >
          <Text
            style={[
              styles.chipArabic,
              { color: colors.text, fontFamily: fontFamilies.arabicRegular },
            ]}
          >
            {item.letterChar}
          </Text>
          <Text style={[styles.chipName, { color: colors.textMuted }]}>
            {item.letterName}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function ReviewScheduleSection({ reviewGroups }: ReviewScheduleSectionProps) {
  const colors = useColors();

  const isEmpty =
    reviewGroups.today.length === 0 &&
    reviewGroups.tomorrow.length === 0 &&
    reviewGroups.thisWeek.length === 0;

  return (
    <View style={styles.container}>
      <Text style={[typography.sectionHeader, { color: colors.brownLight }]}>
        Coming Up for Review
      </Text>

      {isEmpty ? (
        <Text style={[typography.body, styles.emptyText, { color: colors.textMuted }]}>
          No reviews due -- keep learning!
        </Text>
      ) : (
        <View style={styles.groupsContainer}>
          {reviewGroups.today.length > 0 && (
            <View style={styles.group}>
              <Text style={[styles.groupLabel, { color: colors.text }]}>
                Today ({reviewGroups.today.length} {reviewGroups.today.length === 1 ? "letter" : "letters"})
              </Text>
              <LetterChips
                letters={reviewGroups.today}
                bgColor={colors.primarySoft}
                colors={colors}
              />
            </View>
          )}

          {reviewGroups.tomorrow.length > 0 && (
            <View style={styles.group}>
              <Text style={[styles.groupLabel, { color: colors.text }]}>
                Tomorrow ({reviewGroups.tomorrow.length} {reviewGroups.tomorrow.length === 1 ? "letter" : "letters"})
              </Text>
              <LetterChips
                letters={reviewGroups.tomorrow}
                bgColor={colors.bgCard}
                colors={colors}
              />
            </View>
          )}

          {reviewGroups.thisWeek.length > 0 && (
            <View style={styles.group}>
              <Text style={[styles.groupLabel, { color: colors.text }]}>
                This Week ({reviewGroups.thisWeek.length} {reviewGroups.thisWeek.length === 1 ? "letter" : "letters"})
              </Text>
              <LetterChips
                letters={reviewGroups.thisWeek}
                bgColor={colors.bgCard}
                colors={colors}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontStyle: "italic",
  },
  groupsContainer: {
    marginTop: spacing.md,
  },
  group: {
    marginBottom: spacing.lg,
  },
  groupLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radii.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    minWidth: 56,
  },
  chipArabic: {
    fontSize: 22,
    lineHeight: 32,
    writingDirection: "rtl",
  },
  chipName: {
    fontSize: 10,
    fontFamily: fontFamilies.bodyRegular,
    marginTop: 2,
  },
});
