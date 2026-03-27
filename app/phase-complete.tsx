import { View, Text, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useColors } from "../src/design/theme";
import { typography, spacing, radii, fontFamilies } from "../src/design/tokens";
import { ArabicText, Button } from "../src/design/components";
import { useHabit } from "../src/hooks/useHabit";

// ── Phase metadata ──

const PHASE_INFO: Record<number, { title: string; affirmation: string }> = {
  1: {
    title: "Phase 1 -- Letter Recognition",
    affirmation: "You now recognize the foundations of the Arabic alphabet.",
  },
  2: {
    title: "Phase 2 -- Letter Sounds",
    affirmation: "You can hear and distinguish the sounds of every letter.",
  },
  3: {
    title: "Phase 3 -- Harakat (Vowels)",
    affirmation: "You've learned how vowel marks shape Arabic words.",
  },
  4: {
    title: "Phase 4 -- Connected Forms",
    affirmation: "You can read Arabic letters in their connected forms.",
  },
};

const NEXT_PHASE: Record<number, string> = {
  1: "Phase 2 -- Letter Sounds",
  2: "Phase 3 -- Harakat (Vowels)",
  3: "Phase 4 -- Connected Forms",
};

export default function PhaseCompleteScreen() {
  const colors = useColors();
  const { phase } = useLocalSearchParams();
  const phaseNum = parseInt(phase as string, 10) || 1;
  const { habit } = useHabit();

  const info = PHASE_INFO[phaseNum] ?? PHASE_INFO[1];
  const nextPhaseTitle = NEXT_PHASE[phaseNum];
  const currentWird = habit?.currentWird ?? 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={styles.content}>
        {/* Arabic centerpiece */}
        <Animated.View entering={FadeIn.duration(800)} style={styles.arabicWrap}>
          <ArabicText size="display" color={colors.accent} style={{ fontSize: 72 }}>
            {"\u0627\u0644\u062D\u0645\u062F \u0644\u0644\u0647"}
          </ArabicText>
        </Animated.View>

        {/* Phase Complete label */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Text style={[styles.label, { color: colors.accent }]}>Phase Complete</Text>
        </Animated.View>

        {/* Phase title */}
        <Animated.View entering={FadeInDown.delay(350).duration(500)}>
          <Text style={[styles.title, { color: colors.white }]}>{info.title}</Text>
        </Animated.View>

        {/* Affirmation */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <Text style={[styles.affirmation, { color: "rgba(255,255,255,0.7)" }]}>
            {info.affirmation}
          </Text>
        </Animated.View>

        {/* Wird badge */}
        {currentWird > 0 && (
          <Animated.View
            entering={FadeInDown.delay(650).duration(500)}
            style={[styles.wirdBadge, { borderColor: "rgba(255,255,255,0.12)" }]}
          >
            <Text style={{ fontSize: 13, color: colors.accent }}>{"☽"}</Text>
            <Text style={[styles.wirdCount, { color: "rgba(255,255,255,0.85)" }]}>
              {currentWird} {currentWird === 1 ? "day" : "days"}
            </Text>
            <Text style={[styles.wirdLabel, { color: "rgba(255,255,255,0.5)" }]}>Wird</Text>
          </Animated.View>
        )}

        {/* Next phase unlock card */}
        {nextPhaseTitle ? (
          <Animated.View
            entering={FadeInDown.delay(800).duration(600)}
            style={styles.unlockCard}
          >
            <Text style={[styles.unlockLabel, { color: colors.accent }]}>Unlocked</Text>
            <Text style={[styles.unlockTitle, { color: colors.white }]}>{nextPhaseTitle}</Text>
            <Text style={styles.unlockSub}>Your next chapter awaits.</Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(800).duration(600)}>
            <Text style={styles.completionNote}>
              You have completed every phase. May this knowledge stay with you.
            </Text>
          </Animated.View>
        )}

        {/* Continue button */}
        <Animated.View
          entering={FadeInDown.delay(1000).duration(500)}
          style={styles.buttonWrap}
        >
          <Button
            title="Continue"
            onPress={() => router.replace("/(tabs)")}
            style={{ backgroundColor: colors.accent }}
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
  arabicWrap: {
    marginBottom: 40,
  },
  label: {
    fontSize: 11,
    fontFamily: fontFamilies.bodyBold,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 26,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  affirmation: {
    fontSize: 15,
    fontFamily: fontFamilies.bodyRegular,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 280,
    marginBottom: spacing.xxl,
  },
  wirdBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: spacing.xxl,
  },
  wirdCount: {
    fontSize: 13,
    fontFamily: fontFamilies.bodySemiBold,
  },
  wirdLabel: {
    fontSize: 11,
    fontFamily: fontFamilies.bodyMedium,
  },
  unlockCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: radii.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  unlockLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.bodyBold,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  unlockTitle: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 20,
    marginBottom: 6,
  },
  unlockSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontFamily: fontFamilies.bodyRegular,
  },
  completionNote: {
    fontSize: 15,
    fontFamily: fontFamilies.headingRegular,
    fontStyle: "italic",
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  buttonWrap: {
    width: "100%",
    maxWidth: 320,
  },
});
