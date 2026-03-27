import { View, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useColors } from "../../../design/theme";
import { Button } from "../../../design/components";
import { spacing, radii, fontFamilies } from "../../../design/tokens";
import { WarmGlow } from "../WarmGlow";

function ArchOutline({ color }: { color: string }) {
  return (
    <View style={{ position: "absolute", opacity: 0.12 }} pointerEvents="none">
      <Svg width={200} height={260} viewBox="0 0 200 260" fill="none">
        <Path
          d="M30 250 L30 100 Q30 10 100 2 Q170 10 170 100 L170 250"
          stroke={color}
          strokeWidth={1}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

export function Hadith({ onNext }: { onNext: () => void }) {
  const colors = useColors();

  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.splashStep}>
      {/* Ambient glow */}
      <WarmGlow size={340} opacity={0.12} />

      {/* Arch outline */}
      <ArchOutline color={colors.accent} />

      {/* Headline */}
      <Animated.Text
        entering={FadeInDown.delay(300).duration(800)}
        style={[
          styles.hadithHeadline,
          { color: colors.text, zIndex: 1 },
        ]}
      >
        Struggling is not failing
      </Animated.Text>

      {/* Gold diamond separator */}
      <Animated.View
        entering={FadeIn.delay(700).duration(400)}
        style={[
          styles.diamond,
          { backgroundColor: colors.accent, zIndex: 1 },
        ]}
      />

      <View style={{ height: spacing.lg }} />

      {/* Hadith quote */}
      <Animated.Text
        entering={FadeIn.delay(900).duration(800)}
        style={[
          styles.hadithQuote,
          { color: colors.textSoft, zIndex: 1 },
        ]}
      >
        {"\u201C"}The one who struggles with the Qur{"\u2019"}an receives
        a double reward.{"\u201D"}
      </Animated.Text>

      <View style={{ height: spacing.lg }} />

      {/* Divider line */}
      <Animated.View
        entering={FadeIn.delay(1600).duration(500)}
        style={[
          styles.dividerLine,
          { backgroundColor: colors.accent, zIndex: 1 },
        ]}
      />

      {/* Source */}
      <Animated.Text
        entering={FadeIn.delay(1600).duration(500)}
        style={[
          styles.hadithSource,
          { color: colors.textMuted, zIndex: 1 },
        ]}
      >
        SAHIH AL-BUKHARI 4937
      </Animated.Text>

      <View style={styles.spacerXl} />

      {/* CTA */}
      <Animated.View
        entering={FadeInUp.delay(1900).duration(500)}
        style={[styles.fullWidthBtn, { zIndex: 1 }]}
      >
        <Button title="Continue" onPress={onNext} style={styles.fullWidthBtn} />
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
  hadithHeadline: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 28,
    lineHeight: 36,
    textAlign: "center",
    letterSpacing: -0.5,
    fontStyle: "italic",
    marginBottom: 20,
  },
  diamond: {
    width: 6,
    height: 6,
    transform: [{ rotate: "45deg" }],
    opacity: 0.6,
  },
  hadithQuote: {
    fontFamily: fontFamilies.headingRegular,
    fontStyle: "italic",
    fontSize: 17,
    lineHeight: 29,
    textAlign: "center",
    maxWidth: 280,
  },
  dividerLine: {
    width: 28,
    height: 1,
    opacity: 0.4,
    marginBottom: spacing.sm,
  },
  hadithSource: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    textAlign: "center",
  },
  fullWidthBtn: {
    width: "100%",
  },
  spacerXl: { height: spacing.xxxl },
});
