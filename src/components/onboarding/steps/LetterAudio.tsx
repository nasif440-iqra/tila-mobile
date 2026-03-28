import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useColors } from "../../../design/theme";
import { ArabicText, Button, HearButton } from "../../../design/components";
import { typography, spacing, fontFamilies } from "../../../design/tokens";
import { OnboardingStepLayout } from "../OnboardingStepLayout";
import {
  STAGGER_BASE,
  STAGGER_DURATION,
  CTA_DELAY_OFFSET,
  CTA_DURATION,
} from "../animations";

export function LetterAudio({
  onNext,
  onPlayAudio,
  hasPlayedAudio,
}: {
  onNext: () => void;
  onPlayAudio: () => Promise<void>;
  hasPlayedAudio: boolean;
}) {
  const colors = useColors();

  // Standard stagger: 0 = label, 1 = letter circle, 2 = play button
  const labelDelay = 0;
  const circleDelay = STAGGER_BASE;
  const playDelay = STAGGER_BASE * 2;
  const ctaDelay = STAGGER_BASE * 3 + CTA_DELAY_OFFSET;

  return (
    <OnboardingStepLayout
      variant="centered"
      fadeInDuration={STAGGER_DURATION}
      footer={
        <Animated.View entering={FadeInUp.delay(ctaDelay).duration(CTA_DURATION)}>
          <Button title="Continue" onPress={onNext} style={styles.fullWidthBtn} />
        </Animated.View>
      }
    >
      {/* Label */}
      <Animated.Text
        entering={FadeInDown.delay(labelDelay).duration(STAGGER_DURATION)}
        style={[styles.firstWinLabel, { color: colors.textMuted }]}
      >
        Your first letter
      </Animated.Text>

      <View style={{ height: spacing.xxl }} />

      {/* Letter in circle with glow */}
      <Animated.View
        entering={FadeIn.delay(circleDelay).duration(STAGGER_DURATION)}
        style={styles.letterCircleOuter}
      >
        {/* Soft glow behind circle */}
        <View
          style={[
            styles.letterCircleGlow,
            { backgroundColor: colors.accentGlow },
          ]}
        />
        {/* Circle */}
        <View
          style={[
            styles.letterCircle,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <ArabicText size="display" color={colors.primary}>
            {"\u0627"}
          </ArabicText>
        </View>
        {/* Name */}
        <Text style={[styles.letterCircleName, { color: colors.brown }]}>
          Alif
        </Text>
      </Animated.View>

      <View style={{ height: spacing.xxl }} />

      {/* Play button */}
      <Animated.View
        entering={FadeIn.delay(playDelay).duration(STAGGER_DURATION)}
        style={{ alignItems: "center" }}
      >
        <HearButton
          onPlay={onPlayAudio}
          size={56}
          accessibilityLabel="Hear Alif"
        />
        <Text
          style={[
            styles.hearLabel,
            { color: colors.textSoft, marginTop: spacing.sm },
          ]}
        >
          {hasPlayedAudio ? "Hear again" : "Hear it"}
        </Text>
      </Animated.View>
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  firstWinLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  letterCircleOuter: {
    alignItems: "center",
  },
  letterCircleGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -10,
  },
  letterCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  letterCircleName: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 17,
    marginTop: spacing.md,
    textAlign: "center",
  },
  hearLabel: {
    ...typography.bodySmall,
    textAlign: "center",
  },
  fullWidthBtn: {
    width: "100%",
  },
});
