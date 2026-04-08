import { Pressable, Text, StyleSheet } from "react-native";
import { useColors } from "@/src/design/theme";
import { spacing, radii, fontFamilies } from "@/src/design/tokens";

interface Props {
  label: string;
  isArabic?: boolean;
  onPress: () => void;
}

export function CompactOption({ label, isArabic = false, onPress }: Props) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed ? colors.accentLight : colors.bgCard,
          borderColor: colors.border,
        },
      ]}
      accessibilityRole="button"
    >
      <Text
        style={[
          isArabic ? styles.arabicText : styles.latinText,
          { color: colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 96,
  },
  arabicText: {
    fontFamily: fontFamilies.arabicRegular,
    fontSize: 36,
    lineHeight: 48,
    textAlign: "center",
  },
  latinText: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
  },
});
