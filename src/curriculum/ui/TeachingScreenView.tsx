import { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "../../design/theme";
import { typography, spacing, radii, fontFamilies } from "../../design/tokens";
import { HearButton } from "../../design/components/HearButton";
import type { TeachingBlock, TeachingScreen } from "../types";

interface Props {
  screen: TeachingScreen;
  onAdvance: () => void;
  onPlayAudio?: (path: string) => void;
}

export function TeachingScreenView({ screen, onAdvance, onPlayAudio }: Props) {
  const colors = useColors();

  // Auto-play any audio blocks flagged for mount-time playback.
  // Constraint 3: permitted only on Teach screens, which this component is.
  useEffect(() => {
    for (const block of screen.blocks) {
      if (block.type === "audio" && block.autoPlay && onPlayAudio) {
        onPlayAudio(block.path);
        // Only one auto-play per screen — break after the first match to
        // avoid stacking sounds when an author accidentally flags two.
        break;
      }
    }
    // Intentional: only run once on mount per screen instance. Re-running
    // on screen change is handled by the parent re-mounting this component
    // when `screen.id` changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  switch (block.type) {
    case "text":
      if (block.variant === "secondary") {
        return (
          <Text style={[styles.textSecondary, { color: colors.textSoft }]}>
            {block.content}
          </Text>
        );
      }
      return <Text style={[styles.text, { color: colors.text }]}>{block.content}</Text>;

    case "heading":
      return (
        <Text style={[styles.heading, { color: colors.text }]}>{block.text}</Text>
      );

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
        <HearButton
          onPlay={() => onPlayAudio?.(block.path)}
          accessibilityLabel={block.label ?? "Play audio"}
        />
      );

    case "name-sound-pair":
      return (
        <View style={styles.pairRow}>
          <View style={styles.pairCol}>
            <Text style={[styles.arabicXL, { color: colors.text }]}>
              {block.left.glyph}
            </Text>
            {block.left.transliteration ? (
              <Text style={[styles.transliteration, { color: colors.textSoft }]}>
                {block.left.transliteration}
              </Text>
            ) : null}
            {block.left.helperText ? (
              <Text style={[styles.helperText, { color: colors.textSoft }]}>
                {block.left.helperText}
              </Text>
            ) : null}
            {block.left.label ? (
              <Text style={[styles.label, { color: colors.textSoft }]}>
                {block.left.label}
              </Text>
            ) : null}
            <HearButton
              size={36}
              onPlay={() => onPlayAudio?.(block.left.audioPath)}
              accessibilityLabel={block.left.label ?? "Play"}
            />
          </View>
          <Text style={[styles.pairArrow, { color: colors.textSoft }]}>↔</Text>
          <View style={styles.pairCol}>
            <Text style={[styles.arabicXL, { color: colors.primary }]}>
              {block.right.glyph}
            </Text>
            {block.right.transliteration ? (
              <Text style={[styles.transliteration, { color: colors.textSoft }]}>
                {block.right.transliteration}
              </Text>
            ) : null}
            {block.right.helperText ? (
              <Text style={[styles.helperText, { color: colors.textSoft }]}>
                {block.right.helperText}
              </Text>
            ) : null}
            {block.right.label ? (
              <Text style={[styles.label, { color: colors.textSoft }]}>
                {block.right.label}
              </Text>
            ) : null}
            <HearButton
              size={36}
              onPlay={() => onPlayAudio?.(block.right.audioPath)}
              accessibilityLabel={block.right.label ?? "Play"}
            />
          </View>
        </View>
      );

    case "mark-preview":
      return (
        <View style={styles.markRow}>
          {block.options.map((opt, i) => {
            const highlighted = block.highlightIndex === i;
            return (
              <View
                key={i}
                style={[
                  styles.markOption,
                  highlighted && { borderColor: colors.primary, borderWidth: 3 },
                ]}
              >
                <Text
                  style={[
                    styles.arabicMedium,
                    { color: highlighted ? colors.primary : colors.text },
                  ]}
                >
                  {opt.glyph}
                </Text>
                {opt.label ? (
                  <Text style={[styles.label, { color: colors.textSoft }]}>
                    {opt.label}
                  </Text>
                ) : null}
                <HearButton
                  size={36}
                  disabled={!opt.audioPath}
                  onPlay={() => {
                    if (opt.audioPath) onPlayAudio?.(opt.audioPath);
                  }}
                  accessibilityLabel={
                    opt.audioPath
                      ? (opt.label ?? "Play")
                      : "Audio coming soon"
                  }
                />
              </View>
            );
          })}
        </View>
      );

    default: {
      // TypeScript exhaustiveness guard — adding a new TeachingBlock variant
      // to types.ts will fail compilation here until this switch handles it.
      const _exhaustive: never = block;
      void _exhaustive;
      return null;
    }
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between", padding: spacing.md },
  blocks: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.lg },
  text: { ...typography.body, textAlign: "center" },
  textSecondary: {
    ...typography.label,
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
  },
  heading: {
    ...typography.heading2,
    fontSize: 22,
    textAlign: "center",
  },
  helperText: {
    ...typography.label,
    fontStyle: "italic",
    fontSize: 12,
  },
  rtlRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  arrow: { fontSize: 32 },
  arabicLarge: {
    fontFamily: fontFamilies.arabicRegular,
    fontSize: 56,
    lineHeight: 112,
    writingDirection: "rtl",
    overflow: "visible",
  },
  arabicMedium: {
    fontFamily: fontFamilies.arabicRegular,
    fontSize: 40,
    lineHeight: 80,
    writingDirection: "rtl",
    overflow: "visible",
  },
  arabicXL: {
    fontFamily: fontFamilies.arabicRegular,
    fontSize: 96,
    lineHeight: 192,
    writingDirection: "rtl",
    overflow: "visible",
  },
  glyphStack: { alignItems: "center" },
  glyphPair: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  glyphCol: { alignItems: "center", gap: spacing.xs },
  variantsRow: { flexDirection: "row", gap: spacing.md, justifyContent: "center" },
  variant: { alignItems: "center", gap: spacing.xs },
  label: { ...typography.label },
  transliteration: {
    ...typography.body,
    fontStyle: "italic",
  },
  nextButton: { paddingVertical: spacing.sm, borderRadius: radii.full, alignItems: "center" },
  nextText: { ...typography.body, fontWeight: "600" },
  pairRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    justifyContent: "center",
  },
  pairCol: {
    alignItems: "center",
    gap: spacing.xs,
  },
  pairArrow: {
    fontSize: 28,
  },
  markRow: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "center",
  },
  markOption: {
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#e8e2cf",
    minWidth: 72,
  },
});
