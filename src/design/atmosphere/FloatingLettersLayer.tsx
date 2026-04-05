import { useEffect, useCallback } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,

  Easing,
  useReducedMotion,
  runOnJS,
} from "react-native-reanimated";
import { fontFamilies } from "../tokens";
import { useColors } from "../theme";
import { drift } from "../animations";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// 12 letters x 1 offset value = 12 UI-thread animations.
// Budget ~23 total on Welcome (see review justification in PLAN).
// These are lightweight opacity tweens; profile on mid-range Android if frame drops occur.
// Fallback: reduce to 8 letters.
const floatingLetters = [
  { char: "\u0628", top: "2%", left: "6%", size: 27, opacity: 0.06, axis: "y" as const, range: 18, duration: 9000 },
  { char: "\u0646", top: "6%", left: "55%", size: 24, opacity: 0.05, axis: "x" as const, range: -14, duration: 11000 },
  { char: "\u0643", top: "9%", left: "82%", size: 22, opacity: 0.05, axis: "y" as const, range: 12, duration: 13000 },
  { char: "\u0639", top: "20%", left: "2%", size: 26, opacity: 0.05, axis: "x" as const, range: 16, duration: 10000 },
  { char: "\u0642", top: "18%", left: "90%", size: 20, opacity: 0.05, axis: "y" as const, range: -20, duration: 8000 },
  { char: "\u062F", top: "38%", left: "4%", size: 24, opacity: 0.04, axis: "y" as const, range: 15, duration: 12000 },
  { char: "\u0633", top: "42%", left: "88%", size: 22, opacity: 0.05, axis: "x" as const, range: -12, duration: 9500 },
  { char: "\u0631", top: "60%", left: "8%", size: 26, opacity: 0.06, axis: "x" as const, range: 14, duration: 11000 },
  { char: "\u064A", top: "56%", left: "93%", size: 20, opacity: 0.05, axis: "y" as const, range: -16, duration: 10500 },
  { char: "\u0645", top: "75%", left: "12%", size: 22, opacity: 0.05, axis: "y" as const, range: 18, duration: 8500 },
  { char: "\u0647", top: "73%", left: "48%", size: 26, opacity: 0.05, axis: "x" as const, range: -14, duration: 12500 },
  { char: "\u062A", top: "80%", left: "84%", size: 24, opacity: 0.05, axis: "y" as const, range: 15, duration: 9000 },
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
  reduceMotion,
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
  reduceMotion: boolean;
}) {
  const offset = useSharedValue(0);

  // Restart-loop pattern: avoids infinite withRepeat Android freeze bug (D-14)
  const startDriftLoop = useCallback(() => {
    offset.value = withSequence(
      withTiming(range, {
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
      }),
      withTiming(0, {
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
      }, (finished) => {
        if (finished) {
          runOnJS(startDriftLoop)();
        }
      }),
    );
  }, [range, duration]);

  useEffect(() => {
    if (reduceMotion) {
      offset.value = 0;
      return;
    }

    // Initial stagger delay, then start the loop
    const timer = setTimeout(() => {
      startDriftLoop();
    }, index * 60);

    return () => clearTimeout(timer);
  }, [reduceMotion, startDriftLoop, index]);

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
  const colors = useColors(); // ALWAYS call -- hooks must be unconditional
  const reduceMotion = useReducedMotion() ?? false;
  const effectiveColor = tint === "accent" ? colors.accent : color;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {floatingLetters.map((l, i) => (
        <FloatingLetter key={i} {...l} color={effectiveColor} index={i} reduceMotion={reduceMotion} />
      ))}
    </View>
  );
}
