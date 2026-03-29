import { View, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useColors } from "../../../design/theme";
import { Button } from "../../../design/components";
import { typography, spacing, fontFamilies } from "../../../design/tokens";
import { BrandedLogo } from "../BrandedLogo";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import {
  SPLASH_STAGGER_BASE,
  SPLASH_STAGGER_DURATION,
  CTA_DELAY_OFFSET,
  CTA_DURATION,
} from "../animations";

export function Welcome({ onNext }: { onNext: () => void }) {
  const colors = useColors();

  // Splash stagger: element 0 = logo, 1 = app name, 2 = motto, 3 = tagline
  const logoDelay = 0;
  const nameDelay = SPLASH_STAGGER_BASE;
  const mottoDelay = SPLASH_STAGGER_BASE * 2;
  const taglineDelay = SPLASH_STAGGER_BASE * 3;
  const ctaDelay = SPLASH_STAGGER_BASE * 4 + CTA_DELAY_OFFSET;

  return (
    <OnboardingStepLayout
      variant="splash"
      fadeInDuration={SPLASH_STAGGER_DURATION}
      footer={
        <Animated.View
          entering={FadeInUp.delay(ctaDelay).duration(CTA_DURATION)}
          style={{ zIndex: 1 }}
        >
          <Button title="Get Started" onPress={onNext} style={styles.fullWidthBtn} />
        </Animated.View>
      }
    >
      {/* Branded logo mark — larger for impact */}
      <Animated.View
        entering={FadeIn.delay(logoDelay).duration(SPLASH_STAGGER_DURATION)}
        style={{ marginBottom: 20, zIndex: 1 }}
      >
        <BrandedLogo width={140} height={186} />
      </Animated.View>

      {/* App name */}
      <Animated.Text
        entering={FadeInDown.delay(nameDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[
          styles.appName,
          {
            color: colors.brown,
            fontFamily: fontFamilies.headingRegular,
            zIndex: 1,
          },
        ]}
      >
        tila
      </Animated.Text>

      {/* Brand motto */}
      <Animated.Text
        entering={FadeIn.delay(mottoDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.brandMotto, { color: colors.accent, zIndex: 1 }]}
      >
        READ BEAUTIFULLY
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text
        entering={FadeIn.delay(taglineDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.tagline, { color: colors.textSoft, zIndex: 1 }]}
      >
        Learn to read the Quran,{"\n"}one letter at a time.
      </Animated.Text>
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  appName: {
    fontSize: 36,
    letterSpacing: 4,
    textAlign: "center",
    lineHeight: 44,
  },
  brandMotto: {
    fontSize: 10,
    fontFamily: fontFamilies.bodySemiBold,
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  tagline: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 300,
  },
  fullWidthBtn: {
    maxWidth: 280,
    width: "100%",
    alignSelf: "center" as const,
    paddingVertical: 14,
  },
});
