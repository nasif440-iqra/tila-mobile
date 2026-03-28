import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useColors } from "../../../design/theme";
import { ArabicText } from "../../../design/components";
import { spacing, fontFamilies } from "../../../design/tokens";
import { WarmGlow } from "../WarmGlow";
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

  // Choreography:
  // 0ms: "Your first letter" label fades in (duration: SPLASH_STAGGER_DURATION)
  // LETTER_REVEAL_HAPTIC_DELAY: Alif appears after stillness beat + haptic fires
  // LETTER_REVEAL_HAPTIC_DELAY + 800: "Alif" name fades in
  const alifDelay = LETTER_REVEAL_HAPTIC_DELAY;
  const nameDelay = LETTER_REVEAL_HAPTIC_DELAY + 800;

  return (
    <OnboardingStepLayout variant="splash" fadeInDuration={SPLASH_STAGGER_DURATION}>
      {/* Label */}
      <Animated.Text
        entering={FadeInDown.delay(0).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.firstWinLabel, { color: colors.textMuted }]}
      >
        Your first letter
      </Animated.Text>

      {/* Dual WarmGlow — outer gold pulsing ambient */}
      <WarmGlow size={280} opacity={0.22} animated pulseMin={0.15} pulseMax={0.25} />

      {/* Inner accent glow ring — appears WITH the Alif */}
      <Animated.View entering={FadeIn.delay(LETTER_REVEAL_HAPTIC_DELAY).duration(600)}>
        <WarmGlow size={160} animated color={colors.accent} pulseMin={0.10} pulseMax={0.20} />
      </Animated.View>

      {/* Large Alif — the sacred reveal after stillness */}
      <Animated.View entering={FadeIn.delay(alifDelay).duration(800)}>
        <ArabicText
          size="display"
          color={colors.primaryDark}
          style={{ fontSize: 120, lineHeight: 170, zIndex: 1 }}
        >
          {"\u0627"}
        </ArabicText>
      </Animated.View>

      <View style={{ height: spacing.lg }} />

      {/* Name */}
      <Animated.Text
        entering={FadeInUp.delay(nameDelay).duration(700)}
        style={[styles.letterRevealName, { color: colors.brown, zIndex: 1 }]}
      >
        Alif
      </Animated.Text>
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  firstWinLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  letterRevealName: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 22,
    textAlign: "center",
    letterSpacing: 0.5,
  },
});
