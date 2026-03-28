import { View, Pressable, type ViewStyle, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { spacing, radii, shadows } from "../tokens";
import { useColors } from "../theme";
import { springs, pressScale } from "../animations";
import { hapticTap } from "../haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CardProps {
  children: React.ReactNode;
  elevated?: boolean;
  interactive?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Card({
  children,
  elevated = false,
  interactive = false,
  onPress,
  style,
}: CardProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(pressScale.subtle, springs.press);
  }

  function handlePressOut() {
    scale.value = withSpring(1, springs.press);
  }

  function handlePress() {
    hapticTap();
    onPress?.();
  }

  const cardStyle = [
    styles.base,
    { backgroundColor: colors.bgCard },
    elevated ? shadows.cardLifted : shadows.card,
    style,
  ];

  if (interactive && onPress) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[cardStyle, animatedStyle]}
        accessibilityRole="button"
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View style={cardStyle}>
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
