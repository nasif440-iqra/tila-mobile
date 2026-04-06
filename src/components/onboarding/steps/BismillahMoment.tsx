import { useState } from "react";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
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
        revealComplete ? (
          <Animated.View
            entering={FadeInUp.duration(CTA_DURATION)}
            style={{ zIndex: 1 }}
          >
            <Button
              title="Continue"
              onPress={onNext}
              style={{ width: "100%", alignSelf: "center" as const }}
            />
          </Animated.View>
        ) : undefined
      }
    >
      <PhraseReveal
        words={BISMILLAH_WORDS}
        layout="horizontal"
        arabicSize="large"
        wordDuration={1200}
        staggerDelay={800}
        onComplete={handleRevealComplete}
        accessibilityLabel="Bismillah ir-Rahman ir-Raheem. In the name of God, the Most Gracious, the Most Merciful."
      />

      {/* English translation — appears after reveal */}
      {revealComplete && (
        <Animated.Text
          entering={FadeIn.duration(600)}
          style={{
            fontFamily: fontFamilies.headingItalic,
            fontSize: 15,
            lineHeight: 22,
            color: colors.textMuted,
            textAlign: "center",
            marginTop: spacing.xl,
            zIndex: 1,
          }}
        >
          In the name of God,{"\n"}the Most Gracious, the Most Merciful
        </Animated.Text>
      )}
    </OnboardingStepLayout>
  );
}
