import { View, type ViewStyle, StyleSheet } from "react-native";
import { spacing, radii, shadows } from "../tokens";
import { useColors } from "../theme";

interface CardProps {
  children: React.ReactNode;
  elevated?: boolean;
  style?: ViewStyle;
}

export function Card({ children, elevated = false, style }: CardProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: colors.bgCard },
        elevated ? shadows.cardLifted : shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    padding: spacing.xl,
  },
});
