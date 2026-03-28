import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useColors } from "../../design/theme";
import { ArabicText } from "../../design/components";
import { fontFamilies, spacing } from "../../design/tokens";
import { WarmGlow } from "../onboarding/WarmGlow";
import { hapticSelection } from "../../design/haptics";
import { BISMILLAH_DISPLAY_DURATION } from "../onboarding/animations";

// Note: Fast Refresh during development will reinitialize this module,
// causing Bismillah to show again. This is dev-only behavior — in production,
// the variable persists for the app session and resets only on process kill.
let bismillahShownThisSession = false;

export function shouldShowBismillah(): boolean {
  return !bismillahShownThisSession;
}

export function markBismillahShown(): void {
  bismillahShownThisSession = true;
}

export function BismillahOverlay({ onComplete }: { onComplete: () => void }) {
  const colors = useColors();
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    markBismillahShown();
    hapticSelection();

    // After display duration, trigger fade-out with deterministic completion callback
    const timer = setTimeout(() => {
      overlayOpacity.value = withTiming(0, { duration: 500 }, (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      });
    }, BISMILLAH_DISPLAY_DURATION);

    return () => clearTimeout(timer);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: "rgba(242, 234, 222, 0.97)",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 100,
        },
        animStyle,
      ]}
    >
      <WarmGlow size={280} animated color={colors.accent} pulseMin={0.12} pulseMax={0.25} />

      <Animated.View entering={FadeIn.delay(200).duration(800)}>
        <ArabicText
          size="display"
          color={colors.primaryDark}
          style={{ fontSize: 40, lineHeight: 60, textAlign: "center", zIndex: 1 }}
          accessibilityLabel="Bismillah ir-Rahman ir-Raheem - In the name of God, the Most Gracious, the Most Merciful"
        >
          {"\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u0670\u0647\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650"}
        </ArabicText>
      </Animated.View>

      <Animated.Text
        entering={FadeIn.delay(600).duration(600)}
        style={{
          fontFamily: fontFamilies.bodyRegular,
          fontSize: 13,
          lineHeight: 18,
          color: colors.textMuted,
          textAlign: "center",
          fontStyle: "italic",
          marginTop: spacing.lg,
          zIndex: 1,
        }}
      >
        In the name of God, the Most Gracious, the Most Merciful
      </Animated.Text>
    </Animated.View>
  );
}
