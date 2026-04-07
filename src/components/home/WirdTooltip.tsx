import { Pressable, Text, View, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useColors } from "../../design/theme";
import { spacing, fontFamilies, radii, shadows } from "../../design/tokens";

// ── Props ──

export interface WirdTooltipProps {
  visible: boolean;
  onDismiss: () => void;
}

// ── Component ──

export function WirdTooltip({ visible, onDismiss }: WirdTooltipProps) {
  if (!visible) return null;

  const colors = useColors();

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[
        styles.container,
        {
          backgroundColor: colors.bgWarm,
          borderColor: colors.border,
          ...shadows.card,
        },
      ]}
    >
      <Pressable onPress={onDismiss} style={styles.pressable}>
        <Text style={[styles.body, { color: colors.primary }]}>
          In Islamic tradition, a wird is a daily practice — a small, consistent
          effort. Your learning wird builds day by day.
        </Text>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Tap to dismiss
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 40,
    right: 0,
    width: 240,
    borderRadius: radii.md,
    borderWidth: 1,
    zIndex: 10,
  },
  pressable: {
    padding: spacing.md,
  },
  body: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  hint: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 11,
    textAlign: "right",
  },
});
