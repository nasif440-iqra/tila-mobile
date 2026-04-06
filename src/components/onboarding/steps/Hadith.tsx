import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useColors } from "../../../design/theme";
import { Button, PhraseReveal } from "../../../design/components";
import type { PhraseWord } from "../../../design/components";
import { spacing, fontFamilies } from "../../../design/tokens";
import { WarmGlow } from "../WarmGlow";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import {
  SPLASH_STAGGER_BASE,
  SPLASH_STAGGER_DURATION,
  CTA_DELAY_OFFSET,
  CTA_DURATION,
} from "../animations";

// ── Hadith Arabic word data ──

const HADITH_WORDS: PhraseWord[] = [
  { arabic: "\u0627\u0644\u0651\u064E\u0630\u0650\u064A", transliteration: "Alladhi" },
  { arabic: "\u064A\u064E\u0642\u0652\u0631\u064E\u0623\u064F", transliteration: "Yaqra'u" },
  { arabic: "\u0627\u0644\u0652\u0642\u064F\u0631\u0652\u0622\u0646\u064E", transliteration: "Al-Qur'ana" },
  { arabic: "\u0648\u064E\u064A\u064E\u062A\u064E\u062A\u064E\u0639\u0652\u062A\u064E\u0639\u064F", transliteration: "wa yatata'ta'u" },
  { arabic: "\u0641\u0650\u064A\u0647\u0650", transliteration: "fihi" },
];

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
  const [revealComplete, setRevealComplete] = useState(false);

  // Splash stagger: 0 = arabic reveal, 1 = headline, 2 = diamond, 3 = quote, 4 = source
  const headlineDelay = 0;
  const diamondDelay = SPLASH_STAGGER_BASE;
  const ctaDelay = SPLASH_STAGGER_BASE * 4 + CTA_DELAY_OFFSET;

  const handleRevealComplete = () => {
    setRevealComplete(true);
  };

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

      {/* Arabic hadith text via PhraseReveal — horizontal RTL */}
      <PhraseReveal
        words={HADITH_WORDS}
        layout="horizontal"
        arabicSize="large"
        arabicStyle={{ fontSize: 28, lineHeight: 56 }}
        wordDuration={600}
        staggerDelay={300}
        onComplete={handleRevealComplete}
        accessibilityLabel="The one who struggles with the Quran receives a double reward"
      />

      <View style={{ height: spacing.lg }} />

      {/* English translation — appears after Arabic reveal */}
      {revealComplete && (
        <Animated.Text
          entering={FadeIn.duration(600)}
          style={[styles.hadithQuote, { color: colors.textSoft, zIndex: 1 }]}
        >
          {"\u201C"}The one who struggles with the Qur{"\u2019"}an receives
          a double reward.{"\u201D"}
        </Animated.Text>
      )}

      <View style={{ height: spacing.lg }} />

      {/* Divider line */}
      {revealComplete && (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[styles.dividerLine, { backgroundColor: colors.accent, zIndex: 1 }]}
        />
      )}

      {/* Source */}
      {revealComplete && (
        <Animated.Text
          entering={FadeIn.duration(400)}
          style={[styles.hadithSource, { color: colors.textMuted, zIndex: 1 }]}
        >
          SAHIH AL-BUKHARI 4937
        </Animated.Text>
      )}
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
