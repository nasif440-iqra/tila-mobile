import { useEffect } from "react";
import { Pressable, Text, View, type ViewStyle, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { typography, spacing, radii, borderWidths, shadows } from "../tokens";
import { useColors } from "../theme";
import { springs, pressScale, durations } from "../animations";
import { hapticTap, hapticSuccess, hapticError } from "../haptics";
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
  const glowOpacity = useSharedValue(0);
  const plusOneOpacity = useSharedValue(0);
  const plusOneY = useSharedValue(0);
  const plusOneScale = useSharedValue(0.8);

  useEffect(() => {
    if (state === "correct") {
      // Scale pulse
      scale.value = withSequence(
        withTiming(1.04, { duration: durations.fast }),
        withTiming(1, { duration: durations.fast })
      );
      // Green glow pulse
      glowOpacity.value = withSequence(
        withTiming(0.4, { duration: 200 }),
        withTiming(0.15, { duration: 400 }),
        withTiming(0, { duration: 300 })
      );
      // Floating "+1"
      plusOneOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(200, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }))
      );
      plusOneY.value = withTiming(-56, { duration: 650, easing: Easing.bezierFn(0.2, 0.8, 0.4, 1) });
      plusOneScale.value = withSequence(
        withTiming(1.3, { duration: 300 }),
        withTiming(1.3, { duration: 350 })
      );
      hapticSuccess();
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
      hapticError();
    } else {
      // Reset glow and +1 when state resets
      glowOpacity.value = 0;
      plusOneOpacity.value = 0;
      plusOneY.value = 0;
      plusOneScale.value = 0.8;
    }
  }, [state, scale, translateX, glowOpacity, plusOneOpacity, plusOneY, plusOneScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const plusOneStyle = useAnimatedStyle(() => ({
    opacity: plusOneOpacity.value,
    transform: [
      { translateY: plusOneY.value },
      { scale: plusOneScale.value },
    ],
  }));

  function handlePressIn() {
    if (state === "default") {
      scale.value = withSpring(pressScale.normal, springs.press);
    }
  }

  function handlePressOut() {
    if (state === "default") {
      scale.value = withSpring(1, springs.press);
    }
  }

  function handlePress() {
    hapticTap();
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
    <View style={[{ position: "relative" }, style]}>
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!isPressable}
        style={[
          styles.base,
          shadows.card,
          {
            backgroundColor,
            borderColor,
            borderWidth: state === "correct" || state === "wrong" ? borderWidths.thick : borderWidths.normal,
            opacity: isDimmed ? 0.5 : 1,
          },
          animatedStyle,
        ]}
        accessibilityRole="button"
      >
        {/* Correct glow overlay */}
        {state === "correct" && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: radii.xl,
                backgroundColor: colors.primary,
              },
              glowStyle,
            ]}
            pointerEvents="none"
          />
        )}

        {isArabic ? (
          <ArabicText size="large" color={textColor}>
            {label}
          </ArabicText>
        ) : (
          <Text style={[styles.text, { color: textColor }]}>{label}</Text>
        )}
      </AnimatedPressable>

      {/* Floating "+1" indicator */}
      {state === "correct" && (
        <Animated.View style={[styles.plusOneContainer, plusOneStyle]} pointerEvents="none">
          <Text style={[styles.plusOneText, { color: colors.accent }]}>+1</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 88,
    overflow: "hidden",
  },
  text: {
    ...typography.heading3,
  },
  plusOneContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  plusOneText: {
    fontSize: 18,
    fontWeight: "700",
  },
});
