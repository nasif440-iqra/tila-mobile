import { useEffect, useRef } from "react";
import Animated, { FadeIn } from "react-native-reanimated";
import { useColors } from "../../../design/theme";
import { ArabicText } from "../../../design/components";
import { fontFamilies, spacing } from "../../../design/tokens";
import { durations } from "../../../design/animations";
import { hapticSelection } from "../../../design/haptics";
import { WarmGlow } from "../WarmGlow";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import { BISMILLAH_DISPLAY_DURATION } from "../animations";

export function BismillahMoment({ onNext }: { onNext: () => void }) {
  const colors = useColors();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    hapticSelection();
    timerRef.current = setTimeout(onNext, BISMILLAH_DISPLAY_DURATION);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <OnboardingStepLayout variant="splash" fadeInDuration={durations.dramatic}>
      {/* Warm gold glow */}
      <WarmGlow
        size={280}
        opacity={0.18}
        animated
        color={colors.accent}
        pulseMin={0.12}
        pulseMax={0.25}
      />

      {/* Bismillah Arabic calligraphy */}
      <Animated.View entering={FadeIn.delay(200).duration(800)}>
        <ArabicText
          size="display"
          color={colors.primaryDark}
          style={{ fontSize: 40, lineHeight: 60, textAlign: "center", zIndex: 1 }}
          accessibilityLabel="Bismillah ir-Rahman ir-Raheem. In the name of God, the Most Gracious, the Most Merciful."
        >
          {"\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u0670\u0647\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650"}
        </ArabicText>
      </Animated.View>

      {/* English translation */}
      <Animated.Text
        entering={FadeIn.delay(600).duration(600)}
        style={{
          fontFamily: fontFamilies.bodyRegular,
          fontSize: 13,
          lineHeight: 18,
          color: colors.textMuted,
          textAlign: "center",
          fontStyle: "italic",
          marginTop: spacing.lg,
          zIndex: 1,
        }}
      >
        In the name of God, the Most Gracious, the Most Merciful
      </Animated.Text>
    </OnboardingStepLayout>
  );
}
