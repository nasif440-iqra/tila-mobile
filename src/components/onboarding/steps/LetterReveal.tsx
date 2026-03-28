import { View, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useColors } from "../../../design/theme";
import { ArabicText } from "../../../design/components";
import { spacing, fontFamilies } from "../../../design/tokens";
import { WarmGlow } from "../WarmGlow";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import {
  SPLASH_STAGGER_BASE,
  SPLASH_STAGGER_DURATION,
} from "../animations";

export function LetterReveal() {
  const colors = useColors();

  // Splash stagger: 0 = label, 1 = alif, 2 = name
  const labelDelay = 0;
  const alifDelay = SPLASH_STAGGER_BASE;
  const nameDelay = SPLASH_STAGGER_BASE * 2;

  return (
    <OnboardingStepLayout variant="splash" fadeInDuration={SPLASH_STAGGER_DURATION}>
      {/* Label */}
      <Animated.Text
        entering={FadeInDown.delay(labelDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.firstWinLabel, { color: colors.textMuted }]}
      >
        Your first letter
      </Animated.Text>

      <View style={{ height: spacing.xxl }} />

      {/* Warm glow behind Alif */}
      <WarmGlow size={200} opacity={0.18} />

      {/* Large Alif */}
      <Animated.View entering={FadeIn.delay(alifDelay).duration(SPLASH_STAGGER_DURATION)}>
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
        entering={FadeInUp.delay(nameDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.letterRevealName, { color: colors.text, zIndex: 1 }]}
      >
        Alif
      </Animated.Text>
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  firstWinLabel: {
    fontFamily: fontFamilies.bodyMedium,
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
