import { Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { useState, useCallback } from "react";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { useColors } from "../theme";

interface HearButtonProps {
  onPlay: () => Promise<void>;
  size?: number;
  accessibilityLabel?: string;
}

export function HearButton({
  onPlay,
  size = 48,
  accessibilityLabel = "Play audio",
}: HearButtonProps) {
  const colors = useColors();
  const [loading, setLoading] = useState(false);

  const handlePress = useCallback(async () => {
    if (loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      await onPlay();
    } finally {
      setLoading(false);
    }
  }, [onPlay, loading]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primarySoft,
          opacity: loading ? 0.6 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none">
          <Path
            d="M11 5L6 9H2v6h4l5 4V5z"
            fill={colors.primary}
          />
          <Path
            d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"
            stroke={colors.primary}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
});
