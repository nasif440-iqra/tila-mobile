import { Pressable, Text, type ViewStyle, type TextStyle, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { typography, spacing, radii } from "../tokens";
import { useColors } from "../theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  style,
}: ButtonProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.97, { stiffness: 400, damping: 25 });
  }

  function handlePressOut() {
    scale.value = withSpring(1, { stiffness: 400, damping: 25 });
  }

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  const variantStyles = getVariantStyles(variant, colors, disabled);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[styles.base, variantStyles.container, animatedStyle, style]}
      accessibilityRole="button"
    >
      <Text style={[styles.text, variantStyles.text]}>{title}</Text>
    </AnimatedPressable>
  );
}

function getVariantStyles(
  variant: ButtonVariant,
  colors: ReturnType<typeof useColors>,
  disabled: boolean
): { container: ViewStyle; text: TextStyle } {
  const opacity = disabled ? 0.5 : 1;

  switch (variant) {
    case "primary":
      return {
        container: { backgroundColor: colors.primary, opacity },
        text: { color: colors.white },
      };
    case "secondary":
      return {
        container: { backgroundColor: colors.primarySoft, opacity },
        text: { color: colors.primary },
      };
    case "ghost":
      return {
        container: { backgroundColor: "transparent", opacity },
        text: { color: colors.primary },
      };
  }
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    ...typography.bodyLarge,
    fontWeight: "600",
  },
});
