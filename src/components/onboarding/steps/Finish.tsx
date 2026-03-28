import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useColors } from "../../../design/theme";
import { ArabicText, Button } from "../../../design/components";
import { spacing, radii, fontFamilies } from "../../../design/tokens";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import {
  SPLASH_STAGGER_BASE,
  SPLASH_STAGGER_DURATION,
  CTA_DELAY_OFFSET,
  CTA_DURATION,
} from "../animations";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export function Finish({
  onFinish,
  finishing,
  finishError,
}: {
  onFinish: () => void;
  finishing: boolean;
  finishError: boolean;
}) {
  const colors = useColors();

  // Splash stagger: 0 = checkmark, 1 = headline, 2 = subtext
  const checkDelay = 0;
  const headlineDelay = SPLASH_STAGGER_BASE;
  const subtextDelay = SPLASH_STAGGER_BASE * 2;
  const ctaDelay = SPLASH_STAGGER_BASE * 3 + CTA_DELAY_OFFSET;

  return (
    <OnboardingStepLayout
      variant="splash"
      fadeInDuration={SPLASH_STAGGER_DURATION}
      footer={
        <View>
          {finishError && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerLight, borderRadius: radii.md }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>
                Something went wrong saving your progress. Please try again.
              </Text>
            </View>
          )}
          <Animated.View
            entering={FadeIn.delay(ctaDelay).duration(CTA_DURATION)}
            style={{ zIndex: 1 }}
          >
            <Button
              title={finishError ? "Try Again" : "Start Lesson 1"}
              onPress={onFinish}
              style={styles.fullWidthBtn}
            />
          </Animated.View>
        </View>
      }
    >
      {/* Ambient Alif watermark */}
      <Animated.View
        entering={FadeIn.duration(1500)}
        style={{
          position: "absolute",
          top: -SCREEN_HEIGHT * 0.05,
        }}
      >
        <ArabicText
          size="display"
          color={colors.text}
          style={{ fontSize: 200, lineHeight: 260, opacity: 0.06 }}
        >
          {"\u0627"}
        </ArabicText>
      </Animated.View>

      {/* Checkmark circle */}
      <Animated.View
        entering={FadeIn.delay(checkDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[
          styles.checkCircle,
          {
            backgroundColor: colors.accentLight,
            borderColor: "rgba(196,164,100,0.40)",
          },
        ]}
      >
        <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
          <Path
            d="M20 6L9 17L4 12"
            stroke={colors.accent}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>

      <View style={{ height: spacing.xl }} />

      {/* Headline */}
      <Animated.Text
        entering={FadeInDown.delay(headlineDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.finishHeadline, { color: colors.text, zIndex: 1 }]}
      >
        You{"\u2019"}ve already begun
      </Animated.Text>

      <View style={{ height: spacing.md }} />

      {/* Subtext */}
      <Animated.Text
        entering={FadeIn.delay(subtextDelay).duration(SPLASH_STAGGER_DURATION)}
        style={[styles.finishBody, { color: colors.textSoft, zIndex: 1 }]}
      >
        Now let{"\u2019"}s take your first real lesson.
      </Animated.Text>
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  finishHeadline: {
    fontFamily: fontFamilies.headingBold,
    fontSize: 28,
    lineHeight: 36,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  finishBody: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 300,
  },
  errorBox: {
    padding: spacing.md,
    marginBottom: spacing.md,
    width: "100%",
  },
  errorText: {
    fontSize: 14,
    fontFamily: fontFamilies.bodyMedium,
    textAlign: "center",
  },
  fullWidthBtn: {
    width: "100%",
  },
});
