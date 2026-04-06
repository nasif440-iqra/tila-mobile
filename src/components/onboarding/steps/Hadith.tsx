import { View, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useColors } from "../../../design/theme";
import { Button } from "../../../design/components";
import { spacing, fontFamilies } from "../../../design/tokens";
import { WarmGlow } from "../WarmGlow";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import {
  SPLASH_STAGGER_BASE,
  SPLASH_STAGGER_DURATION,
  CTA_DELAY_OFFSET,
  CTA_DURATION,
} from "../animations";

function ArchOutline({ color }: { color: string }) {
  return (
    <View style={{ position: "absolute", opacity: 0.12 }} pointerEvents="none">
      <Svg width={200} height={260} viewBox="0 0 200 260" fill="none">
        <Path
          d="M30 250 L30 100 Q30 10 100 2 Q170 10 170 100 L170 250"
          stroke={color}
          strokeWidth={1}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

export function Hadith({ onNext }: { onNext: () => void }) {
  const colors = useColors();

  const headlineDelay = 0;
  const diamondDelay = SPLASH_STAGGER_BASE;
  const quoteDelay = SPLASH_STAGGER_BASE * 2;
  const sourceDelay = SPLASH_STAGGER_BASE * 3;
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
          <Button title="Continue Journey" onPress={onNext} style={styles.fullWidthBtn} />
        </Animated.View>
      }
    >
      {/* Ambient glow */}
      <WarmGlow size={340} animated pulseMin={0.08} pulseMax={0.18} />

      {/* Arch outline */}
      <ArchOutline color={colors.accent} />

      {/* Headline */}
      <Animated.Text
        entering={FadeInDown.delay(headlineDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.hadithHeadline, { color: colors.brown, zIndex: 1 }]}
      >
        Struggling is not failing
      </Animated.Text>

      {/* Gold diamond separator */}
      <Animated.View
        entering={FadeIn.delay(diamondDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.diamond, { backgroundColor: colors.accent, zIndex: 1 }]}
      />

      <View style={{ height: spacing.lg }} />

      {/* Hadith quote */}
      <Animated.Text
        entering={FadeIn.delay(quoteDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.hadithQuote, { color: colors.textSoft, zIndex: 1 }]}
      >
        {"\u201C"}The one who struggles with the Qur{"\u2019"}an receives
        a double reward.{"\u201D"}
      </Animated.Text>

      <View style={{ height: spacing.lg }} />

      {/* Divider line */}
      <Animated.View
        entering={FadeIn.delay(sourceDelay).duration(400)}
        style={[styles.dividerLine, { backgroundColor: colors.accent, zIndex: 1 }]}
      />

      {/* Source */}
      <Animated.Text
        entering={FadeIn.delay(sourceDelay).duration(400)}
        style={[styles.hadithSource, { color: colors.textMuted, zIndex: 1 }]}
      >
        SAHIH AL-BUKHARI 4937
      </Animated.Text>
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  hadithHeadline: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 28,
    lineHeight: 36,
    textAlign: "center",
    letterSpacing: -0.5,
    fontStyle: "italic",
    marginBottom: spacing.xl,
  },
  diamond: {
    width: 6,
    height: 6,
    transform: [{ rotate: "45deg" }],
    opacity: 0.6,
  },
  hadithQuote: {
    fontFamily: fontFamilies.headingRegular,
    fontStyle: "italic",
    fontSize: 17,
    lineHeight: 29,
    textAlign: "center",
    maxWidth: 300,
  },
  dividerLine: {
    width: 28,
    height: 1,
    opacity: 0.4,
    marginBottom: spacing.sm,
  },
  hadithSource: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    textAlign: "center",
  },
  fullWidthBtn: {
    width: "100%",
  },
});
