import { View, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";
import { useColors } from "../../../design/theme";
import { Button } from "../../../design/components";
import { typography, spacing, fontFamilies } from "../../../design/tokens";
import { WarmGlow } from "../WarmGlow";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import {
  SPLASH_STAGGER_BASE,
  SPLASH_STAGGER_DURATION,
  CTA_DELAY_OFFSET,
  CTA_DURATION,
} from "../animations";

function LogoMark({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <Svg width={120} height={160} viewBox="0 0 120 160" fill="none">
      {/* Arch */}
      <Path
        d="M24 148 L24 68 Q24 8 60 2 Q96 8 96 68 L96 148"
        stroke={colors.primary}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.6}
      />
      <Path
        d="M34 148 L34 72 Q34 20 60 12 Q86 20 86 72 L86 148"
        stroke={colors.primary}
        strokeWidth={0.8}
        opacity={0.2}
      />
      {/* Keystone */}
      <Circle cx={60} cy={2} r={3} fill={colors.accent} opacity={0.8} />
      {/* Base dots */}
      <Circle cx={24} cy={148} r={1.5} fill={colors.primary} opacity={0.25} />
      <Circle cx={96} cy={148} r={1.5} fill={colors.primary} opacity={0.25} />
      {/* Crescent */}
      <Circle cx={60} cy={62} r={32} fill={colors.primary} />
      <Circle cx={71} cy={52} r={26} fill={colors.bgWarm} />
      {/* Stars */}
      <Circle cx={38} cy={30} r={2} fill={colors.primary} opacity={0.35} />
      <Circle cx={85} cy={36} r={1.6} fill={colors.primary} opacity={0.3} />
      <Circle cx={78} cy={22} r={1.3} fill={colors.primary} opacity={0.25} />
    </Svg>
  );
}

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
      {/* Warm ambient glow */}
      <WarmGlow size={360} opacity={0.12} />

      {/* Logo mark */}
      <Animated.View
        entering={FadeIn.delay(logoDelay).duration(SPLASH_STAGGER_DURATION)}
        style={{ marginBottom: spacing.xxl, zIndex: 1 }}
      >
        <LogoMark colors={colors} />
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
    fontSize: 44,
    letterSpacing: 5.3,
    textAlign: "center",
    lineHeight: 52,
  },
  brandMotto: {
    fontSize: 11,
    fontFamily: fontFamilies.bodySemiBold,
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  tagline: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 26,
    textAlign: "center",
    maxWidth: 300,
  },
  fullWidthBtn: {
    width: "100%",
  },
});
