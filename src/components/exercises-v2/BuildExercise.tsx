import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ArabicText } from "@/src/design/components/ArabicText";
import { Button } from "@/src/design/components/Button";
import { useColors } from "@/src/design/theme";
import { typography, spacing, radii, borderWidths } from "@/src/design/tokens";
import type { ExerciseItem, BuildTile } from "@/src/types/exercise";

interface Props {
  item: ExerciseItem;
  onAnswer: (correct: boolean, answerId: string) => void;
}

export function BuildExercise({ item, onAnswer }: Props) {
  const colors = useColors();
  const [selectedTileIds, setSelectedTileIds] = useState<string[]>([]);

  const tiles = item.tiles ?? [];
  const correctValues = item.correctAnswer.kind === "sequence" ? item.correctAnswer.values : [];

  function handleTileTap(tile: BuildTile) {
    if (selectedTileIds.includes(tile.id)) {
      setSelectedTileIds((prev) => prev.filter((id) => id !== tile.id));
    } else {
      setSelectedTileIds((prev) => [...prev, tile.id]);
    }
  }

  function handleCheck() {
    const selectedTiles = selectedTileIds.map((id) => tiles.find((t) => t.id === id)).filter(Boolean) as BuildTile[];
    const selectedEntityIds = selectedTiles.map((t) => t.entityId);
    const correct =
      selectedEntityIds.length === correctValues.length &&
      selectedEntityIds.every((id, i) => id === correctValues[i]);
    onAnswer(correct, "build-result");
  }

  return (
    <View style={styles.container}>
      {item.prompt.text ? (
        <Text style={[styles.instruction, { color: colors.textSoft }]}>{item.prompt.text}</Text>
      ) : null}
      <ArabicText size="large" style={styles.arabicPrompt}>
        {item.prompt.arabicDisplay}
      </ArabicText>

      {/* Answer slots */}
      <View style={styles.slots}>
        {correctValues.map((_, i) => {
          const tile = selectedTileIds[i] ? tiles.find((t) => t.id === selectedTileIds[i]) : null;
          return (
            <View key={i} style={[styles.slot, { borderColor: colors.accent, backgroundColor: colors.bgCard }]}>
              {tile ? (
                <ArabicText size="body">{tile.displayArabic}</ArabicText>
              ) : (
                <Text style={[styles.slotPlaceholder, { color: colors.textMuted }]}>_</Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Tile bank */}
      <View style={styles.tileBank}>
        {tiles.map((tile) => {
          const selected = selectedTileIds.includes(tile.id);
          return (
            <Pressable
              key={tile.id}
              onPress={() => handleTileTap(tile)}
              style={[
                styles.tile,
                {
                  backgroundColor: selected ? colors.primarySoft : colors.bgCard,
                  borderColor: selected ? colors.primary : colors.border,
                  borderWidth: selected ? borderWidths.thick : borderWidths.normal,
                  opacity: selected ? 0.5 : 1,
                },
              ]}
              accessibilityRole="button"
            >
              <ArabicText size="body">{tile.displayArabic}</ArabicText>
            </Pressable>
          );
        })}
      </View>

      <Button
        title="Check Answer"
        onPress={handleCheck}
        disabled={selectedTileIds.length === 0}
        style={styles.checkButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  instruction: {
    ...typography.bodyLarge,
    textAlign: "center",
  },
  arabicPrompt: {
    textAlign: "center",
  },
  slots: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  slot: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    borderWidth: borderWidths.normal,
    alignItems: "center",
    justifyContent: "center",
  },
  slotPlaceholder: {
    fontSize: 24,
  },
  tileBank: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
  },
  tile: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 52,
    minHeight: 52,
  },
  checkButton: {
    width: "100%",
  },
});
