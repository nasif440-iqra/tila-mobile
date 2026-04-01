import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useColors } from "../src/design/theme";
import { typography, spacing, radii, fontFamilies } from "../src/design/tokens";
import { Button, Card } from "../src/design/components";
import { CrescentIcon } from "../src/design/CrescentIcon";
import { useProgress } from "../src/hooks/useProgress";
import { getTodayDateString, getDayDifference } from "../src/engine/dateUtils";
import { track } from "../src/analytics";
import { useHabit } from "../src/hooks/useHabit";

export default function ReturnWelcomeScreen() {
  const colors = useColors();
  const progress = useProgress();
  const { habit } = useHabit();

  const currentWird = habit?.currentWird ?? 0;
  const longestWird = habit?.longestWird ?? 0;
  const streakBroke = currentWird === 0 && longestWird > 0;

  useEffect(() => {
    const lastPractice = habit?.lastPracticeDate;
    const daysSince = lastPractice
      ? getDayDifference(getTodayDateString(), lastPractice)
      : 0;

    track('return_welcome_shown', {
      days_since_last_practice: daysSince,
      current_wird: currentWird,
      streak_broke: streakBroke,
      longest_wird: longestWird,
    });
  }, []);

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
          <CrescentIcon size={32} color={colors.accent} />
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

        {/* Encouragement — compassionate recovery if streak broke, otherwise normal message */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)}>
          {streakBroke ? (
            <View style={styles.recoveryWrap}>
              <Text style={[styles.encouragement, { color: colors.textSoft }]}>
                Your streak ended — but your longest streak of{" "}
                <Text style={[styles.streakHighlight, { color: colors.accent }]}>
                  {longestWird} {longestWird === 1 ? "day" : "days"}
                </Text>{" "}
                is yours forever. Every new day is a fresh start.
              </Text>
            </View>
          ) : (
            <Text style={[styles.encouragement, { color: colors.textSoft }]}>
              Every return is a step forward. Pick up right where you left off.
            </Text>
          )}
        </Animated.View>

        {/* Continue / Start new streak button */}
        <Animated.View
          entering={FadeInDown.delay(800).duration(500)}
          style={styles.buttonWrap}
        >
          <Button
            title={streakBroke ? "Start a new streak" : "Continue"}
            onPress={handleContinue}
          />
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
  recoveryWrap: {
    maxWidth: 300,
    alignItems: "center",
  },
  streakHighlight: {
    fontFamily: fontFamilies.bodySemiBold,
  },
});
