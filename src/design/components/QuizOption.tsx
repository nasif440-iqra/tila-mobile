import { useEffect } from "react";
import { Pressable, Text, View, type ViewStyle, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";
import { typography, spacing, radii, borderWidths, shadows, fontFamilies } from "../tokens";
import { useColors } from "../theme";
import { springs, pressScale } from "../animations";
import { hapticTap, hapticSuccess } from "../haptics";
import { ArabicText } from "./ArabicText";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ── 5-state option model ──
// selectedCorrect: user picked this AND it's correct -> celebrate with gold glow
// selectedWrong:   user picked this AND it's wrong -> gentle opacity dim
// revealedCorrect: user picked something else wrong, this IS the correct one -> warm glow reveal
// dimmed:          answered, this is neither selected nor correct -> fade out
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
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const wrongOpacity = useSharedValue(1);

  useEffect(() => {
    if (state === "selectedCorrect") {
      if (reducedMotion) {
        // Skip animations, apply final states instantly
        scale.value = 1;
        glowOpacity.value = 0;
      } else {
        // Quick confident pulse
        scale.value = withSequence(
          withTiming(1.04, { duration: 150 }),
          withTiming(1, { duration: 150 })
        );
        // Gold glow flash
        glowOpacity.value = withSequence(
          withTiming(0.15, { duration: 200, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 300, easing: Easing.in(Easing.cubic) })
        );
      }
      hapticSuccess();
    } else if (state === "selectedWrong") {
      if (reducedMotion) {
        wrongOpacity.value = 0.7;
      } else {
        // Gentle opacity dip -- no shake, no buzz
        wrongOpacity.value = withSequence(
          withTiming(0.5, { duration: 200, easing: Easing.out(Easing.cubic) }),
          withTiming(0.7, { duration: 200, easing: Easing.in(Easing.cubic) })
        );
      }
      hapticTap();
    } else if (state === "revealedCorrect") {
      // Warm glow to illuminate correct answer (D-08: 0.20 opacity)
      if (reducedMotion) {
        glowOpacity.value = 0.20;
      } else {
        glowOpacity.value = withTiming(0.20, { duration: 400, easing: Easing.inOut(Easing.ease) });
      }
    } else {
      // Reset all animation state cleanly
      translateX.value = 0;
      scale.value = 1;
      glowOpacity.value = 0;
      wrongOpacity.value = 1;
    }
  }, [state]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
    opacity: wrongOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
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
  const isWrong = state === "selectedWrong";

  // Color mapping for all 5 states
  const backgroundColor =
    state === "selectedCorrect" ? colors.primarySoft
    : state === "selectedWrong" ? colors.accentLight
    : state === "revealedCorrect" ? colors.primarySoft
    : colors.bgCard;

  const borderColor =
    state === "selectedCorrect" ? colors.accent
    : state === "selectedWrong" ? colors.border
    : state === "revealedCorrect" ? colors.primary
    : colors.border;

  const borderW =
    state === "selectedCorrect" || state === "selectedWrong" || state === "revealedCorrect"
      ? borderWidths.thick
      : borderWidths.normal;

  const textColor =
    state === "selectedCorrect" ? colors.primaryDark
    : state === "selectedWrong" ? colors.brown
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
            opacity: isDimmed ? 0.35 : 1,
          },
          animatedStyle,
        ]}
        accessibilityRole="button"
      >
        {/* Gold glow overlay -- on selectedCorrect and revealedCorrect */}
        {(state === "selectedCorrect" || state === "revealedCorrect") && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: radii.xl, backgroundColor: colors.accent },
              glowStyle,
            ]}
            pointerEvents="none"
          />
        )}

        {isArabic ? (
          <ArabicText size="quizOption" color={textColor}>
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
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 20,
    lineHeight: 28,
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
});
