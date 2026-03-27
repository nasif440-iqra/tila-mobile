import { useEffect } from "react";
import { Pressable, Text, type ViewStyle, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { typography, spacing, radii } from "../tokens";
import { useColors } from "../theme";
import { ArabicText } from "./ArabicText";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type QuizOptionState = "default" | "correct" | "wrong" | "dimmed";

interface QuizOptionProps {
  label: string;
  isArabic?: boolean;
  onPress: () => void;
  disabled?: boolean;
  state?: QuizOptionState;
  style?: ViewStyle;
}

export function QuizOption({
  label,
  isArabic = false,
  onPress,
  disabled = false,
  state = "default",
  style,
}: QuizOptionProps) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (state === "correct") {
      scale.value = withSequence(
        withTiming(1.04, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (state === "wrong") {
      translateX.value = withSequence(
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [state, scale, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
  }));

  function handlePressIn() {
    if (state === "default") {
      scale.value = withSpring(0.97, { stiffness: 400, damping: 25 });
    }
  }

  function handlePressOut() {
    if (state === "default") {
      scale.value = withSpring(1, { stiffness: 400, damping: 25 });
    }
  }

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  const isPressable = state === "default" && !disabled;
  const isDimmed = state === "dimmed";

  const backgroundColor =
    state === "correct"
      ? colors.primarySoft
      : state === "wrong"
        ? colors.dangerLight
        : colors.bgCard;

  const borderColor =
    state === "correct"
      ? colors.primary
      : state === "wrong"
        ? colors.danger
        : colors.border;

  const textColor =
    state === "correct"
      ? colors.primary
      : state === "wrong"
        ? colors.danger
        : colors.text;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!isPressable}
      style={[
        styles.base,
        {
          backgroundColor,
          borderColor,
          opacity: isDimmed ? 0.5 : 1,
        },
        animatedStyle,
        style,
      ]}
      accessibilityRole="button"
    >
      {isArabic ? (
        <ArabicText size="body" color={textColor}>
          {label}
        </ArabicText>
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{label}</Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    ...typography.body,
  },
});
