import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useColors } from "../src/design/theme";
import { typography, spacing, radii, fontFamilies } from "../src/design/tokens";
import { Button, Card } from "../src/design/components";
import { useProgress } from "../src/hooks/useProgress";
import { getTodayDateString } from "../src/engine/dateUtils";

export default function ReturnWelcomeScreen() {
  const colors = useColors();
  const progress = useProgress();

  function handleContinue() {
    // Mark today as shown so we don't show again today
    progress.updateProfile({ returnHadithLastShown: getTodayDateString() });
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgWarm }]}>
      <View style={styles.content}>
        {/* Decorative crescent circle */}
        <Animated.View
          entering={FadeIn.duration(600)}
          style={[styles.crescentCircle, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}
        >
          <Text style={{ fontSize: 32 }}>{"\u263D"}</Text>
        </Animated.View>

        {/* Welcome back label */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Text style={[styles.label, { color: colors.accent }]}>Welcome back</Text>
        </Animated.View>

        {/* Hadith card */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={{ width: "100%" }}>
          <Card style={styles.hadithCard}>
            <Text style={[styles.hadithText, { color: colors.text }]}>
              {'"The most beloved of deeds to Allah are those that are most consistent, even if they are small."'}
            </Text>
            <Text style={[styles.attribution, { color: colors.textMuted }]}>
              {"-- Prophet Muhammad (peace be upon him)"}
            </Text>
          </Card>
        </Animated.View>

        {/* Encouragement */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)}>
          <Text style={[styles.encouragement, { color: colors.textSoft }]}>
            Every return is a step forward. Pick up right where you left off.
          </Text>
        </Animated.View>

        {/* Continue button */}
        <Animated.View
          entering={FadeInDown.delay(800).duration(500)}
          style={styles.buttonWrap}
        >
          <Button title="Continue" onPress={handleContinue} />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  crescentCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxl,
  },
  label: {
    fontSize: 11,
    fontFamily: fontFamilies.bodyBold,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },
  hadithCard: {
    maxWidth: 340,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.xl,
    marginBottom: spacing.xxl,
  },
  hadithText: {
    fontFamily: fontFamilies.headingRegular,
    fontStyle: "italic",
    fontSize: 17,
    lineHeight: 27,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  attribution: {
    fontSize: 12,
    fontFamily: fontFamilies.bodySemiBold,
    textAlign: "center",
  },
  encouragement: {
    fontSize: 15,
    fontFamily: fontFamilies.bodyRegular,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 300,
    marginBottom: spacing.xxl,
  },
  buttonWrap: {
    width: "100%",
    maxWidth: 320,
  },
});
