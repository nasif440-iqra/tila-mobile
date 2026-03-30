import { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, ViewStyle } from "react-native";
import { useColors } from "../../design/theme";
import { spacing, typography, radii, shadows } from "../../design/tokens";
import { ArabicText } from "../../design/components";
import { hapticTap } from "../../design/haptics";
import { ARABIC_LETTERS, getLetter } from "../../data/letters";
import { deriveMasteryState } from "../../engine/mastery";
import { LetterDetailSheet } from "./LetterDetailSheet";
import type { EntityState } from "../../types/mastery";

export interface LetterMasteryGridProps {
  entities: Record<string, EntityState>;
  learnedIds: number[];
  today: string;
}

interface MasteryStyle {
  bg: string;
  border: string;
  textColor: string;
  nameColor: string;
  opacity: number;
  shadow?: ViewStyle;
}

function getMasteryStyle(
  state: string,
  colors: ReturnType<typeof useColors>
): MasteryStyle {
  switch (state) {
    case "retained":
      return {
        bg: colors.primaryDark,
        border: colors.primary,
        textColor: colors.primarySoft,
        nameColor: colors.primarySoft,
        opacity: 1.0,
        shadow: shadows.cardLifted,
      };
    case "accurate":
      return {
        bg: colors.primarySoft,
        border: colors.primary,
        textColor: colors.primaryDark,
        nameColor: colors.primary,
        opacity: 1.0,
      };
    case "unstable":
      return {
        bg: colors.accentLight,
        border: colors.accent,
        textColor: colors.text,
        nameColor: colors.accent,
        opacity: 1.0,
      };
    case "introduced":
      return {
        bg: colors.bgCard,
        border: colors.border,
        textColor: colors.textSoft,
        nameColor: colors.textMuted,
        opacity: 1.0,
      };
    default:
      // not_started
      return {
        bg: colors.bgCard,
        border: "transparent",
        textColor: colors.textMuted,
        nameColor: colors.textMuted,
        opacity: 0.35,
      };
  }
}

export default function LetterMasteryGrid({
  entities,
  learnedIds,
  today,
}: LetterMasteryGridProps) {
  const colors = useColors();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handlePress = useCallback((letterId: number) => {
    hapticTap();
    setSelectedId(letterId);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedId(null);
  }, []);

  const selectedLetter = selectedId ? getLetter(selectedId) : null;
  const selectedEntityKey = selectedId ? `letter:${selectedId}` : null;
  const selectedEntity = selectedEntityKey ? entities[selectedEntityKey] ?? null : null;

  return (
    <>
      <View style={styles.letterGrid}>
        {ARABIC_LETTERS.map((letter) => {
          const entityKey = `letter:${letter.id}`;
          const entity = entities[entityKey];
          const state = entity ? deriveMasteryState(entity, today) : "not_started";
          const learned = learnedIds.includes(letter.id);
          const masteryStyle = getMasteryStyle(state, colors);

          const cell = (
            <View
              style={[
                styles.letterCell,
                {
                  backgroundColor: masteryStyle.bg,
                  borderColor: masteryStyle.border,
                  borderWidth: state !== "not_started" ? 2 : 1.5,
                  opacity: masteryStyle.opacity,
                },
                masteryStyle.shadow,
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
                  : entity && entity.attempts > 0
                  ? `${entity.correct}/${entity.attempts}`
                  : "\u2014"}
              </Text>
            </View>
          );

          return (
            <View key={letter.id} style={{ width: "25%" }}>
              {learned ? (
                <Pressable
                  onPress={() => handlePress(letter.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${letter.name} letter details`}
                >
                  {cell}
                </Pressable>
              ) : (
                cell
              )}
            </View>
          );
        })}
      </View>

      <LetterDetailSheet
        letter={selectedLetter ?? null}
        entity={selectedEntity}
        today={today}
        visible={selectedId !== null && selectedLetter !== null}
        onClose={handleClose}
      />
    </>
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
    ...typography.caption,
    fontSize: 9,
    marginTop: spacing.xs,
  },
});
