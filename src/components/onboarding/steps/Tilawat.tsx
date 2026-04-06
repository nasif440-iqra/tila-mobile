import { View, Text, StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useColors } from "../../../design/theme";
import { Button, PhraseReveal } from "../../../design/components";
import type { PhraseWord } from "../../../design/components";
import { spacing, fontFamilies } from "../../../design/tokens";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import {
  SPLASH_STAGGER_BASE,
  SPLASH_STAGGER_DURATION,
  CTA_DELAY_OFFSET,
  CTA_DURATION,
} from "../animations";

// ── Tilawah word data ──

const TILAWAH_WORDS: PhraseWord[] = [
  { arabic: "\u062A\u0650\u0644\u0627\u0648\u064E\u0629", transliteration: "Tilawah" },
];

export function Tilawat({ onNext }: { onNext: () => void }) {
  const colors = useColors();

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
          <Button title="Begin" onPress={onNext} style={styles.ctaBtn} />
        </Animated.View>
      }
    >
      {/* Arabic calligraphy via PhraseReveal */}
      <Animated.View entering={FadeInDown.delay(calligraphyDelay).duration(SPLASH_STAGGER_DURATION)}>
        <PhraseReveal
          words={TILAWAH_WORDS}
          layout="vertical"
          arabicSize="display"
          arabicStyle={{ fontSize: 56, lineHeight: 78 }}
          wordDuration={700}
          accessibilityLabel="Tilawah - to recite the Quran beautifully"
        />
      </Animated.View>

      <View style={{ height: spacing.lg }} />

      {/* Headline */}
      <Animated.View
        entering={FadeInDown.delay(headlineDelay).duration(SPLASH_STAGGER_DURATION)}
        style={{ alignItems: "center", zIndex: 1 }}
      >
        <Text style={[styles.headlineBody, { color: colors.brown }]}>
          To recite the Quran
        </Text>
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          <Text style={[styles.headlineBody, { color: colors.brown }]}>
            beautifully is{" "}
          </Text>
          <Text style={[styles.tilawatWord, { color: colors.accent }]}>
            Tilawah
          </Text>
        </View>
      </Animated.View>

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
  headlineBody: {
    fontFamily: fontFamilies.headingRegular,
    fontSize: 21,
    lineHeight: 32,
    textAlign: "center",
    maxWidth: 300,
  },
  tilawatWord: {
    fontFamily: fontFamilies.headingItalic,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: 0.5,
  },
  sacredMotto: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    letterSpacing: 1.8,
    textAlign: "center",
  },
  ctaBtn: {
    maxWidth: 280,
    width: "100%",
    alignSelf: "center" as const,
    paddingVertical: 14,
  },
});
