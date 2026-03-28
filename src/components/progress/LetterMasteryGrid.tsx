import { View, Text, StyleSheet } from "react-native";
import { useColors } from "../../design/theme";
import { spacing, radii, fontFamilies } from "../../design/tokens";
import { ArabicText } from "../../design/components";
import { ARABIC_LETTERS } from "../../data/letters";
import { deriveMasteryState } from "../../engine/mastery";
import type { EntityState } from "../../types/mastery";

export interface LetterMasteryGridProps {
  entities: Record<string, EntityState>;
  learnedIds: number[];
  today: string;
}

function getMasteryStyle(
  state: string,
  colors: ReturnType<typeof useColors>
): { bg: string; border: string; textColor: string; nameColor: string } {
  switch (state) {
    case "retained":
      return {
        bg: colors.primarySoft,
        border: colors.primary,
        textColor: colors.primaryDark,
        nameColor: colors.primary,
      };
    case "accurate":
      return {
        bg: colors.primarySoft,
        border: colors.primary,
        textColor: colors.primaryDark,
        nameColor: colors.primary,
      };
    case "unstable":
      return {
        bg: colors.accentLight,
        border: colors.accent,
        textColor: colors.text,
        nameColor: colors.accent,
      };
    case "introduced":
      return {
        bg: colors.bgCard,
        border: colors.border,
        textColor: colors.textSoft,
        nameColor: colors.textMuted,
      };
    default:
      // not started
      return {
        bg: colors.bgCard,
        border: "transparent",
        textColor: colors.textMuted,
        nameColor: colors.textMuted,
      };
  }
}

export default function LetterMasteryGrid({
  entities,
  learnedIds,
  today,
}: LetterMasteryGridProps) {
  const colors = useColors();

  return (
    <View style={styles.letterGrid}>
      {ARABIC_LETTERS.map((letter) => {
        const entityKey = `letter:${letter.id}`;
        const entity = entities[entityKey];
        const state = entity ? deriveMasteryState(entity, today) : "not_started";
        const learned = learnedIds.includes(letter.id);
        const started = entity && entity.attempts > 0;
        const masteryStyle = getMasteryStyle(state, colors);

        return (
          <View key={letter.id} style={{ width: "25%" }}>
            <View
              style={[
                styles.letterCell,
                {
                  backgroundColor: masteryStyle.bg,
                  borderColor: masteryStyle.border,
                  borderWidth: state !== "not_started" ? 2 : 1.5,
                  opacity: started || learned ? 1 : 0.35,
                },
              ]}
            >
              <ArabicText
                size="body"
                color={masteryStyle.textColor}
                style={{ textAlign: "center" }}
              >
                {letter.letter}
              </ArabicText>
              <Text
                style={[styles.letterName, { color: masteryStyle.nameColor }]}
                numberOfLines={1}
              >
                {learned
                  ? letter.name
                  : started
                  ? `${entity.correct}/${entity.attempts}`
                  : "\u2014"}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  letterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  letterCell: {
    aspectRatio: 1,
    margin: spacing.xs,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xs,
  },
  letterName: {
    fontSize: 9,
    fontFamily: fontFamilies.bodySemiBold,
    marginTop: 2,
  },
});
