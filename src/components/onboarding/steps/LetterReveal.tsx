import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useColors } from "../../../design/theme";
import { ArabicText } from "../../../design/components";
import { spacing, fontFamilies, radii, shadows } from "../../../design/tokens";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import { hapticMilestone } from "../../../design/haptics";
import {
  SPLASH_STAGGER_DURATION,
  STILLNESS_BEAT_DURATION,
  LETTER_REVEAL_HAPTIC_DELAY,
} from "../animations";

export function LetterReveal() {
  const colors = useColors();

  // Fire haptic when Alif appears (after label + stillness beat)
  useEffect(() => {
    const timer = setTimeout(() => {
      hapticMilestone();
    }, LETTER_REVEAL_HAPTIC_DELAY);
    return () => clearTimeout(timer);
  }, []);

  const cardDelay = 400;
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

      <View style={{ height: spacing.xxxl }} />

      {/* Card container — matches reference image */}
      <Animated.View
        entering={FadeIn.delay(cardDelay).duration(700)}
        style={[styles.card, { backgroundColor: colors.bgCard, ...shadows.cardLifted }]}
      >
        {/* Letter in circle with subtle glow ring */}
        <View style={styles.letterCircleOuter}>
          <View
            style={[
              styles.letterCircleGlow,
              { backgroundColor: colors.accentGlow },
            ]}
          />
          <View
            style={[
              styles.letterCircle,
              {
                backgroundColor: colors.primarySoft,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Alif appears after stillness beat */}
            <Animated.View entering={FadeIn.delay(alifDelay - cardDelay).duration(800)}>
              <ArabicText size="display" color={colors.primary}>
                {"\u0627"}
              </ArabicText>
            </Animated.View>
          </View>
        </View>

        {/* Name */}
        <Animated.Text
          entering={FadeInUp.delay(nameDelay - cardDelay).duration(500)}
          style={[styles.letterName, { color: colors.brown }]}
        >
          Alif
        </Animated.Text>
      </Animated.View>
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  firstWinLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  card: {
    borderRadius: radii.xl,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
    alignItems: "center",
    width: "85%",
  },
  letterCircleOuter: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  letterCircleGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  letterCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  letterName: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 20,
    textAlign: "center",
    letterSpacing: 0.5,
  },
});
