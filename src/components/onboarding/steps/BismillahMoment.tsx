import { useState, useEffect } from "react";
import Animated, { FadeIn, FadeInUp, useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { useColors } from "../../../design/theme";
import { PhraseReveal, Button } from "../../../design/components";
import type { PhraseWord } from "../../../design/components";
import { fontFamilies, spacing } from "../../../design/tokens";
import { hapticSelection } from "../../../design/haptics";
import { playSacredMoment } from "../../../audio/player";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import { CTA_DELAY_OFFSET, CTA_DURATION } from "../animations";

// ── Bismillah word data ──

const BISMILLAH_WORDS: PhraseWord[] = [
  { arabic: "\u0628\u0650\u0633\u0652\u0645\u0650", transliteration: "Bismi", meaning: "In the name of" },
  { arabic: "\u0627\u0644\u0644\u0651\u0670\u0647\u0650", transliteration: "Allah", meaning: "God" },
  { arabic: "\u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u0670\u0646\u0650", transliteration: "Ar-Rahman", meaning: "The Most Gracious" },
  { arabic: "\u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650", transliteration: "Ar-Raheem", meaning: "The Most Merciful" },
];

function FooterButton({ visible, onNext }: { visible: boolean; onNext: () => void }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
      translateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[{ zIndex: 1 }, animStyle]} pointerEvents={visible ? "auto" : "none"}>
      <Button
        title="Continue"
        onPress={onNext}
        style={{ width: "100%", alignSelf: "center" as const }}
      />
    </Animated.View>
  );
}

function EnglishTranslation({ visible, colors }: { visible: boolean; colors: any }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      style={[
        {
          fontFamily: fontFamilies.headingItalic,
          fontSize: 15,
          lineHeight: 22,
          color: colors.textMuted,
          textAlign: "center",
          marginTop: spacing.xl,
          zIndex: 1,
        },
        animStyle,
      ]}
    >
      In the name of God,{"\n"}the Most Gracious, the Most Merciful
    </Animated.Text>
  );
}

export function BismillahMoment({ onNext }: { onNext: () => void }) {
  const colors = useColors();
  const [revealComplete, setRevealComplete] = useState(false);

  const handleRevealComplete = () => {
    hapticSelection();
    playSacredMoment();
    setRevealComplete(true);
  };

  // Total reveal time for CTA delay calculation
  const totalRevealTime = (BISMILLAH_WORDS.length - 1) * 800 + 1200;

  return (
    <OnboardingStepLayout
      variant="splash"
      fadeInDuration={800}
      footer={
        <FooterButton visible={revealComplete} onNext={onNext} />
      }
    >
      <PhraseReveal
        words={BISMILLAH_WORDS}
        layout="horizontal"
        arabicSize="large"
        wordDuration={1800}
        staggerDelay={1400}
        onComplete={handleRevealComplete}
        accessibilityLabel="Bismillah ir-Rahman ir-Raheem. In the name of God, the Most Gracious, the Most Merciful."
      />

      {/* English translation — always mounted to hold layout space, fades in on reveal */}
      <EnglishTranslation visible={revealComplete} colors={colors} />
    </OnboardingStepLayout>
  );
}
