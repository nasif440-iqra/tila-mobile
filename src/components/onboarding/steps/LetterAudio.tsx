import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useColors } from "../../../design/theme";
import { ArabicText, Button, HearButton } from "../../../design/components";
import { typography, spacing, fontFamilies } from "../../../design/tokens";

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

  return (
    <Animated.View entering={FadeIn.duration(700)} style={styles.centeredStep}>
      {/* Label */}
      <Animated.Text
        entering={FadeInDown.delay(100).duration(500)}
        style={[styles.firstWinLabel, { color: colors.textMuted }]}
      >
        Your first letter
      </Animated.Text>

      <View style={{ height: spacing.xxl }} />

      {/* Letter in circle with glow */}
      <Animated.View
        entering={FadeIn.delay(200).duration(500)}
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
        <Text
          style={[
            styles.letterCircleName,
            { color: colors.text },
          ]}
        >
          Alif
        </Text>
      </Animated.View>

      <View style={{ height: spacing.xxl }} />

      {/* Play button */}
      <Animated.View
        entering={FadeIn.delay(400).duration(500)}
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

      <View style={styles.spacerXl} />

      {/* CTA */}
      <Animated.View
        entering={FadeInUp.delay(550).duration(500)}
        style={styles.fullWidthBtn}
      >
        <Button title="Continue" onPress={onNext} style={styles.fullWidthBtn} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  centeredStep: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
  },
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
  spacerXl: { height: spacing.xxxl },
});
