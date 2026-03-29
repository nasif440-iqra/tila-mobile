import { useEffect, useRef } from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useColors } from "../../../design/theme";
import { ArabicText } from "../../../design/components";
import { fontFamilies, spacing } from "../../../design/tokens";
import { hapticSelection } from "../../../design/haptics";
import { OnboardingStepLayout } from "../OnboardingStepLayout";

const BISMILLAH_HOLD = 4000; // longer hold — let it breathe

export function BismillahMoment({ onNext }: { onNext: () => void }) {
  const colors = useColors();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    hapticSelection();
    timerRef.current = setTimeout(onNext, BISMILLAH_HOLD);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <OnboardingStepLayout variant="splash" fadeInDuration={800}>
      {/* Bismillah Arabic calligraphy — large and centered */}
      <Animated.View entering={FadeIn.delay(300).duration(1000)}>
        <ArabicText
          size="display"
          color={colors.primaryDark}
          style={{ fontSize: 64, lineHeight: 96, textAlign: "center", zIndex: 1 }}
          accessibilityLabel="Bismillah ir-Rahman ir-Raheem. In the name of God, the Most Gracious, the Most Merciful."
        >
          {"\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u0670\u0647\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650"}
        </ArabicText>
      </Animated.View>

      {/* English translation */}
      <Animated.Text
        entering={FadeIn.delay(1000).duration(800)}
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
    </OnboardingStepLayout>
  );
}
