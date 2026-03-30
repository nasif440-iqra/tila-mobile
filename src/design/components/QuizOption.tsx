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
import { springs, pressScale } from "../animations";
import { hapticTap, hapticSuccess, hapticError } from "../haptics";
import { ArabicText } from "./ArabicText";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ── 5-state option model ──
// selectedCorrect: user picked this AND it's correct → celebrate
// selectedWrong:   user picked this AND it's wrong → shake
// revealedCorrect: user picked something else wrong, this IS the correct one → calm reveal only
// dimmed:          answered, this is neither selected nor correct → fade out
// default:         unanswered
type QuizOptionState = "default" | "selectedCorrect" | "selectedWrong" | "revealedCorrect" | "dimmed";

interface QuizOptionProps {
  label: string;
  sublabel?: string;
  isArabic?: boolean;
  isSound?: boolean;
  onPress: () => void;
  disabled?: boolean;
  state?: QuizOptionState;
  style?: ViewStyle;
}

export function QuizOption({
  label,
  sublabel,
  isArabic = false,
  isSound = false,
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
    if (state === "selectedCorrect") {
      // Quick confident pulse
      scale.value = withSequence(
        withTiming(1.04, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
      // Subtle glow
      glowOpacity.value = withSequence(
        withTiming(0.3, { duration: 180 }),
        withTiming(0.1, { duration: 300 }),
        withTiming(0, { duration: 200 })
      );
      // Floating "+1"
      plusOneOpacity.value = withSequence(
        withTiming(1, { duration: 80 }),
        withDelay(200, withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) }))
      );
      plusOneY.value = withTiming(-56, { duration: 650, easing: Easing.bezierFn(0.2, 0.8, 0.4, 1) });
      plusOneScale.value = withSequence(
        withTiming(1.3, { duration: 250 }),
        withTiming(1.3, { duration: 400 })
      );
      hapticSuccess();
    } else if (state === "selectedWrong") {
      // Snappy shake — fewer oscillations, quicker settle
      translateX.value = withSequence(
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 60 }),
        withTiming(-4, { duration: 60 }),
        withTiming(4, { duration: 60 }),
        withTiming(0, { duration: 70 })
      );
      hapticError();
    } else if (state === "revealedCorrect") {
      // NO celebration, NO haptic, NO pulse, NO +1
      // Just calm visual state — handled by colors below
    } else {
      // Reset all animation state cleanly
      translateX.value = 0;
      scale.value = 1;
      glowOpacity.value = 0;
      plusOneOpacity.value = 0;
      plusOneY.value = 0;
      plusOneScale.value = 0.8;
    }
  }, [state]);

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

  // Color mapping for all 5 states
  const backgroundColor =
    state === "selectedCorrect" ? colors.primarySoft
    : state === "selectedWrong" ? colors.dangerLight
    : state === "revealedCorrect" ? colors.primarySoft
    : colors.bgCard;

  const borderColor =
    state === "selectedCorrect" ? colors.primary
    : state === "selectedWrong" ? colors.danger
    : state === "revealedCorrect" ? colors.primary
    : colors.border;

  const borderW =
    state === "selectedCorrect" || state === "selectedWrong" || state === "revealedCorrect"
      ? borderWidths.thick
      : borderWidths.normal;

  const textColor =
    state === "selectedCorrect" ? colors.primaryDark
    : state === "selectedWrong" ? colors.danger
    : state === "revealedCorrect" ? colors.primaryDark
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
            borderWidth: borderW,
            opacity: isDimmed ? 0.45 : 1,
          },
          animatedStyle,
        ]}
        accessibilityRole="button"
      >
        {/* Correct glow overlay — only on selectedCorrect */}
        {state === "selectedCorrect" && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: radii.xl, backgroundColor: colors.primary },
              glowStyle,
            ]}
            pointerEvents="none"
          />
        )}

        {isArabic ? (
          <ArabicText size="large" color={textColor}>
            {label}
          </ArabicText>
        ) : isSound ? (
          <View style={styles.soundContent}>
            <Text style={[styles.soundText, { color: textColor }]}>{label}</Text>
            {sublabel && (
              <Text style={[styles.soundSublabel, { color: colors.textMuted }]}>{sublabel}</Text>
            )}
          </View>
        ) : (
          <Text style={[styles.text, { color: textColor }]}>{label}</Text>
        )}
      </AnimatedPressable>

      {/* Floating "+1" — only on selectedCorrect */}
      {state === "selectedCorrect" && (
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
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
    overflow: "hidden",
  },
  text: {
    ...typography.heading3,
  },
  soundContent: {
    alignItems: "center",
    gap: 2,
  },
  soundText: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 24,
  },
  soundSublabel: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
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
