import { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";
import { useColors } from "../../../design/theme";
import { fontFamilies, spacing } from "../../../design/tokens";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import { hapticMilestone } from "../../../design/haptics";
import {
  SPLASH_STAGGER_DURATION,
  LETTER_REVEAL_HAPTIC_DELAY,
} from "../animations";

const GLOW_SIZE = Math.min(324, Dimensions.get("window").width - 16);

export function LetterReveal() {
  const colors = useColors();

  // Fire haptic when Alif appears (after label + stillness beat)
  useEffect(() => {
    const timer = setTimeout(() => {
      hapticMilestone();
    }, LETTER_REVEAL_HAPTIC_DELAY);
    return () => clearTimeout(timer);
  }, []);

  const alifDelay = LETTER_REVEAL_HAPTIC_DELAY;
  const nameDelay = LETTER_REVEAL_HAPTIC_DELAY + 600;

  return (
    <OnboardingStepLayout variant="splash" fadeInDuration={SPLASH_STAGGER_DURATION}>
      {/* Label */}
      <Animated.Text
        entering={FadeInDown.delay(0).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.firstWinLabel, { color: colors.accent }]}
      >
        YOUR FIRST LETTER
      </Animated.Text>

      <View style={{ height: spacing.xl }} />

      {/* Large Alif with radial glow — NO card, NO circle, matching web */}
      <View style={styles.letterContainer}>
        {/* Warm radial glow orb */}
        <Animated.View
          entering={FadeIn.delay(200).duration(1200)}
          style={styles.glowWrap}
          pointerEvents="none"
        >
          <Svg width={GLOW_SIZE} height={GLOW_SIZE} viewBox={`0 0 ${GLOW_SIZE} ${GLOW_SIZE}`}>
            <Defs>
              <RadialGradient id="revealGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#C4A464" stopOpacity={0.18} />
                <Stop offset="50%" stopColor="#C4A464" stopOpacity={0.06} />
                <Stop offset="72%" stopColor="#C4A464" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x={0} y={0} width={GLOW_SIZE} height={GLOW_SIZE} fill="url(#revealGlow)" />
          </Svg>
        </Animated.View>

        {/* Alif — large, appears after stillness beat */}
        <Animated.Text
          entering={FadeIn.delay(alifDelay).duration(1000)}
          style={[styles.letterBig, { color: colors.primary }]}
        >
          {"\u0627"}
        </Animated.Text>
      </View>

      {/* Name */}
      <Animated.Text
        entering={FadeInUp.delay(nameDelay).duration(500)}
        style={[styles.letterName, { color: colors.textMuted }]}
      >
        Alif
      </Animated.Text>
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  firstWinLabel: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 15,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    textAlign: "center",
  },
  letterContainer: {
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  glowWrap: {
    position: "absolute",
    width: GLOW_SIZE,
    height: GLOW_SIZE,
  },
  letterBig: {
    fontFamily: fontFamilies.arabicRegular,
    fontSize: 162,
    lineHeight: 216,
    textAlign: "center",
  },
  letterName: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 1.0,
  },
});
