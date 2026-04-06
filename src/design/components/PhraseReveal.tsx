import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useColors } from "../theme";
import { fontFamilies, spacing } from "../tokens";
import { durations, staggers } from "../animations";

interface PhraseRevealProps {
  /** Array of text phrases to reveal one at a time */
  phrases: string[];
  /** Delay in ms before the first phrase appears */
  initialDelay?: number;
  /** Delay in ms between each phrase */
  staggerDelay?: number;
  /** Duration of each phrase's fade-in */
  fadeDuration?: number;
  /** Font style variant */
  variant?: "body" | "heading" | "arabic";
  /** Custom text color */
  color?: string;
  /** Text alignment */
  align?: "center" | "left" | "right";
}

function RevealLine({
  text,
  delay,
  duration,
  variant,
  color,
  align,
}: {
  text: string;
  delay: number;
  duration: number;
  variant: "body" | "heading" | "arabic";
  color: string;
  align: "center" | "left" | "right";
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration, easing: Easing.out(Easing.cubic) })
    );
  }, [delay, duration, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const textStyle =
    variant === "heading"
      ? styles.heading
      : variant === "arabic"
        ? styles.arabic
        : styles.body;

  return (
    <Animated.View style={animatedStyle}>
      <Text
        style={[
          textStyle,
          { color, textAlign: align },
          variant === "arabic" && { writingDirection: "rtl" as const },
        ]}
      >
        {text}
      </Text>
    </Animated.View>
  );
}

export function PhraseReveal({
  phrases,
  initialDelay = staggers.dramatic.delay,
  staggerDelay = staggers.normal.delay,
  fadeDuration = durations.slow,
  variant = "body",
  color,
  align = "center",
}: PhraseRevealProps) {
  const colors = useColors();
  const textColor = color ?? colors.text;

  return (
    <View style={styles.container}>
      {phrases.map((phrase, index) => (
        <RevealLine
          key={`${index}-${phrase}`}
          text={phrase}
          delay={initialDelay + index * staggerDelay}
          duration={fadeDuration}
          variant={variant}
          color={textColor}
          align={align}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  body: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 15,
    lineHeight: 24,
  },
  heading: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  arabic: {
    fontFamily: fontFamilies.arabicRegular,
    fontSize: 36,
    lineHeight: 72,
  },
});
