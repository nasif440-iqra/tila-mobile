import { View, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useColors } from "../../../design/theme";
import { ArabicText } from "../../../design/components";
import { spacing, fontFamilies } from "../../../design/tokens";
import { WarmGlow } from "../WarmGlow";

export function LetterReveal() {
  const colors = useColors();

  return (
    <Animated.View entering={FadeIn.duration(800)} style={styles.splashStep}>
      {/* Label */}
      <Animated.Text
        entering={FadeInDown.delay(300).duration(500)}
        style={[styles.firstWinLabel, { color: colors.textMuted }]}
      >
        Your first letter
      </Animated.Text>

      <View style={{ height: spacing.xxl }} />

      {/* Warm glow behind Alif */}
      <WarmGlow size={200} opacity={0.18} />

      {/* Large Alif */}
      <Animated.View entering={FadeIn.delay(800).duration(1000)}>
        <ArabicText
          size="display"
          color={colors.primaryDark}
          style={{ fontSize: 120, lineHeight: 170, zIndex: 1 }}
        >
          {"\u0627"}
        </ArabicText>
      </Animated.View>

      <View style={{ height: spacing.lg }} />

      {/* Name */}
      <Animated.Text
        entering={FadeInUp.delay(1800).duration(600)}
        style={[
          styles.letterRevealName,
          { color: colors.text, zIndex: 1 },
        ]}
      >
        Alif
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  splashStep: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: require("react-native").Dimensions.get("window").height * 0.15,
    paddingBottom: spacing.xxxl,
  },
  firstWinLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  letterRevealName: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 22,
    textAlign: "center",
    letterSpacing: 0.5,
  },
});
