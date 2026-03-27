import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useColors } from "../../../design/theme";
import { ArabicText, Button } from "../../../design/components";
import { spacing, fontFamilies } from "../../../design/tokens";
import { WarmGlow } from "../WarmGlow";

export function Tilawat({ onNext }: { onNext: () => void }) {
  const colors = useColors();

  return (
    <Animated.View entering={FadeIn.duration(700)} style={styles.splashStep}>
      {/* Warm glow */}
      <WarmGlow size={300} opacity={0.15} />

      {/* Arabic calligraphy */}
      <Animated.View entering={FadeInDown.delay(150).duration(550)}>
        <ArabicText
          size="display"
          color={colors.primaryDark}
          style={{ fontSize: 72, lineHeight: 100, zIndex: 1 }}
        >
          {"\u062A\u0650\u0644\u0627\u0648\u064E\u0629"}
        </ArabicText>
      </Animated.View>

      <View style={{ height: 28 }} />

      {/* Headline */}
      <Animated.Text
        entering={FadeInDown.delay(350).duration(550)}
        style={[
          styles.sacredHeadline,
          { color: colors.text, zIndex: 1 },
        ]}
      >
        To recite the Quran beautifully is{" "}
        <Text
          style={{
            fontFamily: fontFamilies.headingItalic,
            color: colors.accent,
          }}
        >
          Tilawat
        </Text>
      </Animated.Text>

      <View style={{ height: 10 }} />

      {/* Motto */}
      <Animated.Text
        entering={FadeIn.delay(750).duration(500)}
        style={[styles.sacredMotto, { color: colors.textMuted, zIndex: 1 }]}
      >
        Recite. Reflect. Return.
      </Animated.Text>

      <View style={styles.spacerXl} />

      {/* CTA */}
      <Animated.View
        entering={FadeInUp.delay(900).duration(500)}
        style={[styles.fullWidthBtn, { zIndex: 1 }]}
      >
        <Button title="Begin" onPress={onNext} style={styles.fullWidthBtn} />
      </Animated.View>
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
  sacredHeadline: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 22,
    lineHeight: 31,
    textAlign: "center",
    maxWidth: 300,
    letterSpacing: -0.2,
  },
  sacredMotto: {
    fontSize: 13,
    letterSpacing: 1,
    textAlign: "center",
  },
  fullWidthBtn: {
    width: "100%",
  },
  spacerXl: { height: spacing.xxxl },
});
