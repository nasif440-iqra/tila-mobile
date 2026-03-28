import { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { fontFamilies } from "../../design/tokens";
import { useColors } from "../../design/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// 12 letters x 1 opacity value = 12 UI-thread animations.
// Budget ~23 total on Welcome (see review justification in PLAN).
// These are lightweight opacity tweens; profile on mid-range Android if frame drops occur.
// Fallback: reduce to 8 letters.
const floatingLetters = [
  { char: "\u0628", top: "3%", left: "8%", size: 30, opacity: 0.09, axis: "y" as const, range: 8, duration: 16000 },
  { char: "\u0646", top: "5%", left: "52%", size: 26, opacity: 0.07, axis: "y" as const, range: -6, duration: 18000 },
  { char: "\u0643", top: "7%", left: "86%", size: 28, opacity: 0.08, axis: "x" as const, range: 6, duration: 20000 },
  { char: "\u0639", top: "22%", left: "3%", size: 24, opacity: 0.08, axis: "y" as const, range: 7, duration: 15000 },
  { char: "\u0642", top: "19%", left: "91%", size: 28, opacity: 0.07, axis: "y" as const, range: -7, duration: 17000 },
  { char: "\u062F", top: "40%", left: "5%", size: 26, opacity: 0.07, axis: "x" as const, range: 5, duration: 19000 },
  { char: "\u0633", top: "44%", left: "89%", size: 24, opacity: 0.08, axis: "y" as const, range: 6, duration: 16000 },
  { char: "\u0631", top: "62%", left: "7%", size: 28, opacity: 0.09, axis: "y" as const, range: -6, duration: 18000 },
  { char: "\u064A", top: "58%", left: "92%", size: 26, opacity: 0.07, axis: "x" as const, range: -5, duration: 20000 },
  { char: "\u0645", top: "78%", left: "10%", size: 24, opacity: 0.08, axis: "y" as const, range: 7, duration: 17000 },
  { char: "\u0647", top: "76%", left: "50%", size: 28, opacity: 0.07, axis: "y" as const, range: -5, duration: 19000 },
  { char: "\u062A", top: "82%", left: "85%", size: 26, opacity: 0.08, axis: "x" as const, range: 6, duration: 16000 },
];

function FloatingLetter({
  char,
  top,
  left,
  size,
  opacity,
  axis,
  range,
  duration,
  color,
  index,
}: {
  char: string;
  top: string;
  left: string;
  size: number;
  opacity: number;
  axis: "x" | "y";
  range: number;
  duration: number;
  color: string;
  index: number;
}) {
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withDelay(
      index * 60,
      withRepeat(
        withSequence(
          withTiming(range, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform:
      axis === "y"
        ? [{ translateY: offset.value }]
        : [{ translateX: offset.value }],
  }));

  const topPercent = parseFloat(top) / 100;
  const leftPercent = parseFloat(left) / 100;

  return (
    <Animated.Text
      style={[
        {
          position: "absolute",
          top: topPercent * SCREEN_HEIGHT,
          left: leftPercent * SCREEN_WIDTH,
          fontFamily: fontFamilies.arabicRegular,
          fontSize: size,
          color: color,
          opacity: opacity,
          writingDirection: "rtl",
        },
        animStyle,
      ]}
    >
      {char}
    </Animated.Text>
  );
}

export function FloatingLettersLayer({
  color,
  tint,
}: {
  color: string;
  tint?: "primary" | "accent";
}) {
  const colors = useColors(); // ALWAYS call — hooks must be unconditional
  const effectiveColor = tint === "accent" ? colors.accent : color;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {floatingLetters.map((l, i) => (
        <FloatingLetter key={i} {...l} color={effectiveColor} index={i} />
      ))}
    </View>
  );
}
