import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useColors } from "../../../design/theme";
import { ArabicText, Button } from "../../../design/components";
import { spacing, fontFamilies } from "../../../design/tokens";
import { WarmGlow } from "../WarmGlow";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import {
  SPLASH_STAGGER_BASE,
  SPLASH_STAGGER_DURATION,
  CTA_DELAY_OFFSET,
  CTA_DURATION,
} from "../animations";

export function Tilawat({ onNext }: { onNext: () => void }) {
  const colors = useColors();

  // Splash stagger: 0 = calligraphy, 1 = headline, 2 = motto
  const calligraphyDelay = 0;
  const headlineDelay = SPLASH_STAGGER_BASE;
  const mottoDelay = SPLASH_STAGGER_BASE * 2;
  const ctaDelay = SPLASH_STAGGER_BASE * 3 + CTA_DELAY_OFFSET;

  return (
    <OnboardingStepLayout
      variant="splash"
      fadeInDuration={SPLASH_STAGGER_DURATION}
      footer={
        <Animated.View
          entering={FadeInUp.delay(ctaDelay).duration(CTA_DURATION)}
          style={{ zIndex: 1 }}
        >
          <Button title="Begin" onPress={onNext} style={styles.fullWidthBtn} />
        </Animated.View>
      }
    >
      {/* Warm glow */}
      <WarmGlow size={300} opacity={0.15} />

      {/* Arabic calligraphy */}
      <Animated.View entering={FadeInDown.delay(calligraphyDelay).duration(SPLASH_STAGGER_DURATION)}>
        <ArabicText
          size="display"
          color={colors.primaryDark}
          style={{ fontSize: 72, lineHeight: 100, zIndex: 1 }}
        >
          {"\u062A\u0650\u0644\u0627\u0648\u064E\u0629"}
        </ArabicText>
      </Animated.View>

      <View style={{ height: spacing.xxl }} />

      {/* Headline */}
      <Animated.Text
        entering={FadeInDown.delay(headlineDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.sacredHeadline, { color: colors.text, zIndex: 1 }]}
      >
        To recite the Quran beautifully is{" "}
        <Text
          style={{
            fontFamily: fontFamilies.headingItalic,
            color: colors.accent,
          }}
        >
          Tilawat
        </Text>
      </Animated.Text>

      <View style={{ height: spacing.md }} />

      {/* Motto */}
      <Animated.Text
        entering={FadeIn.delay(mottoDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.sacredMotto, { color: colors.textMuted, zIndex: 1 }]}
      >
        Recite. Reflect. Return.
      </Animated.Text>
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  sacredHeadline: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 22,
    lineHeight: 31,
    textAlign: "center",
    maxWidth: 300,
    letterSpacing: -0.2,
  },
  sacredMotto: {
    fontSize: 13,
    letterSpacing: 1,
    textAlign: "center",
  },
  fullWidthBtn: {
    width: "100%",
  },
});
