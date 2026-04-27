import { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "../../design/theme";
import { typography, spacing, radii, fontFamilies } from "../../design/tokens";
import type { TeachingBlock, TeachingScreen } from "../types";

interface Props {
  screen: TeachingScreen;
  onAdvance: () => void;
  onPlayAudio?: (path: string) => void;
}

export function TeachingScreenView({ screen, onAdvance, onPlayAudio }: Props) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={styles.blocks}>
        {screen.blocks.map((block, i) => (
          <TeachingBlockView key={i} block={block} onPlayAudio={onPlayAudio} />
        ))}
      </View>
      <Pressable
        style={[styles.nextButton, { backgroundColor: colors.primary }]}
        onPress={onAdvance}
        accessibilityRole="button"
        accessibilityLabel="Next"
      >
        <Text style={[styles.nextText, { color: colors.bg }]}>Next</Text>
      </Pressable>
    </View>
  );
}

function TeachingBlockView({
  block,
  onPlayAudio,
}: {
  block: TeachingBlock;
  onPlayAudio?: (path: string) => void;
}) {
  const colors = useColors();
  const [audioTapped, setAudioTapped] = useState(false);

  const handleAudioTap = useCallback(
    (path: string) => {
      setAudioTapped(true);
      onPlayAudio?.(path);
      setTimeout(() => setAudioTapped(false), 600);
    },
    [onPlayAudio]
  );

  switch (block.type) {
    case "text":
      return <Text style={[styles.text, { color: colors.text }]}>{block.content}</Text>;

    case "reading-direction":
      return (
        <View style={styles.rtlRow}>
          <Text style={[styles.arrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.arabicLarge, { color: colors.text }]}>{block.word}</Text>
        </View>
      );

    case "glyph-display":
      return (
        <View style={styles.glyphPair}>
          <View style={styles.glyphCol}>
            <Text style={[styles.arabicXL, { color: colors.text }]}>{block.letter}</Text>
            <Text style={[styles.label, { color: colors.textSoft }]}>letter</Text>
          </View>
          {block.withMark ? (
            <>
              <Text style={[styles.arrow, { color: colors.textSoft }]}>→</Text>
              <View style={styles.glyphCol}>
                <Text style={[styles.arabicXL, { color: colors.primary }]}>{block.withMark}</Text>
                <Text style={[styles.label, { color: colors.textSoft }]}>letter + mark</Text>
              </View>
            </>
          ) : null}
        </View>
      );

    case "shape-variants":
      return (
        <View style={styles.variantsRow}>
          {block.variants.map((v) => (
            <View key={v.position} style={styles.variant}>
              <Text style={[styles.arabicMedium, { color: colors.text }]}>{v.rendered}</Text>
              <Text style={[styles.label, { color: colors.textSoft }]}>{v.position}</Text>
            </View>
          ))}
        </View>
      );

    case "audio":
      return (
        <Pressable
          onPress={() => handleAudioTap(block.path)}
          style={[
            styles.audioBubble,
            { backgroundColor: audioTapped ? colors.accent : colors.primary },
          ]}
          accessibilityRole="button"
          accessibilityLabel={block.label ?? "Play audio"}
        >
          <Text style={[styles.audioIcon, { color: colors.bg }]}>🔊</Text>
        </Pressable>
      );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between", padding: spacing.md },
  blocks: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.lg },
  text: { ...typography.body, textAlign: "center" },
  rtlRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  arrow: { fontSize: 32 },
  arabicLarge: { fontFamily: fontFamilies.arabicRegular, fontSize: 56, lineHeight: 72 },
  arabicMedium: { fontFamily: fontFamilies.arabicRegular, fontSize: 40, lineHeight: 56 },
  arabicXL: { fontFamily: fontFamilies.arabicRegular, fontSize: 96, lineHeight: 120 },
  glyphStack: { alignItems: "center" },
  glyphPair: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  glyphCol: { alignItems: "center", gap: spacing.xs },
  variantsRow: { flexDirection: "row", gap: spacing.md, justifyContent: "center" },
  variant: { alignItems: "center", gap: spacing.xs },
  label: { ...typography.label },
  audioBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  audioIcon: { fontSize: 28 },
  nextButton: { paddingVertical: spacing.sm, borderRadius: radii.full, alignItems: "center" },
  nextText: { ...typography.body, fontWeight: "600" },
});
