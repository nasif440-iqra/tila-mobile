import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useColors } from "../../../design/theme";
import { ArabicText, Button } from "../../../design/components";
import { spacing, radii, fontFamilies } from "../../../design/tokens";

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

  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.splashStep}>
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
        entering={FadeIn.delay(300).duration(400)}
        style={[
          styles.checkCircle,
          {
            backgroundColor: colors.accentLight,
            borderColor: "rgba(196,164,100,0.40)",
          },
        ]}
      >
        <Svg
          width={32}
          height={32}
          viewBox="0 0 24 24"
          fill="none"
        >
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
        entering={FadeInDown.delay(800).duration(400)}
        style={[
          styles.finishHeadline,
          { color: colors.text, zIndex: 1 },
        ]}
      >
        You{"\u2019"}ve already begun
      </Animated.Text>

      <View style={{ height: spacing.md }} />

      {/* Subtext */}
      <Animated.Text
        entering={FadeIn.delay(1350).duration(400)}
        style={[
          styles.finishBody,
          { color: colors.textSoft, zIndex: 1 },
        ]}
      >
        Now let{"\u2019"}s take your first real lesson.
      </Animated.Text>

      <View style={styles.spacerXl} />

      {finishError && (
        <View style={{ backgroundColor: colors.dangerLight, padding: spacing.md, borderRadius: radii.md, marginBottom: spacing.md, width: "100%" }}>
          <Text style={{ color: colors.danger, fontSize: 14, fontFamily: fontFamilies.bodyMedium, textAlign: "center" }}>
            Something went wrong saving your progress. Please try again.
          </Text>
        </View>
      )}

      {/* CTA */}
      <Animated.View
        entering={FadeIn.delay(1750).duration(400)}
        style={[styles.fullWidthBtn, { zIndex: 1 }]}
      >
        <Button
          title={finishError ? "Try Again" : "Start Lesson 1"}
          onPress={onFinish}
          style={styles.fullWidthBtn}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  splashStep: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: SCREEN_HEIGHT * 0.15,
    paddingBottom: spacing.xxxl,
  },
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
    maxWidth: 280,
  },
  fullWidthBtn: {
    width: "100%",
  },
  spacerXl: { height: spacing.xxxl },
});
