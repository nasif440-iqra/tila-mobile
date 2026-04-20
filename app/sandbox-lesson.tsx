import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LessonRunner } from "../src/curriculum/runtime/LessonRunner";
import { referenceLessonScreens } from "../src/curriculum/reference/lesson";
import type { RefScreen } from "../src/curriculum/reference/types";
import { useColors } from "../src/design/theme";
import { typography, spacing, radii } from "../src/design/tokens";
import { Button } from "../src/design/components";
import { useHabit } from "../src/hooks/useHabit";

export default function SandboxLessonScreen() {
  const colors = useColors();
  const { recordPractice } = useHabit();
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const flag = process.env.EXPO_PUBLIC_DEV_REFERENCE_LESSON === "true";
    if (!flag) router.replace("/(tabs)");
    setEnabled(flag);
  }, []);

  const handleComplete = useCallback(async () => {
    await recordPractice();
    router.replace("/(tabs)");
  }, [recordPractice]);

  if (!enabled) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <LessonRunner<RefScreen>
        screens={referenceLessonScreens}
        onComplete={handleComplete}
        renderScreen={(screen, { advance, index, total }) => (
          <RefScreenRenderer
            screen={screen}
            onAdvance={advance}
            index={index}
            total={total}
            colors={colors}
          />
        )}
      />
    </SafeAreaView>
  );
}

function RefScreenRenderer({
  screen,
  onAdvance,
  index,
  total,
  colors,
}: {
  screen: RefScreen;
  onAdvance: () => void;
  index: number;
  total: number;
  colors: ReturnType<typeof useColors>;
}) {
  if (screen.type === "teach") {
    return (
      <View style={styles.content}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {index + 1} / {total}
        </Text>
        {screen.arabicDisplay && (
          <Text style={[styles.arabic, { color: colors.text }]}>
            {screen.arabicDisplay}
          </Text>
        )}
        <Text style={[typography.heading2, { color: colors.text, marginTop: spacing.lg }]}>
          {screen.title}
        </Text>
        <Text style={[typography.body, { color: colors.text, marginTop: spacing.md, textAlign: "center" }]}>
          {screen.body}
        </Text>
        <View style={{ marginTop: spacing.xxl }}>
          <Button title="Continue" onPress={onAdvance} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.content}>
      <Text style={[typography.caption, { color: colors.textMuted }]}>
        {index + 1} / {total}
      </Text>
      <Text style={[typography.heading2, { color: colors.text, marginTop: spacing.lg, textAlign: "center" }]}>
        {screen.prompt}
      </Text>
      <View style={styles.options}>
        {screen.options.map((opt, i) => (
          <Pressable
            key={i}
            onPress={onAdvance}
            style={[
              styles.option,
              { backgroundColor: colors.bg, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.optionText, { color: colors.text }]}>{opt}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  arabic: { fontSize: 120, fontFamily: "Amiri_400Regular" },
  options: { marginTop: spacing.xl, width: "100%", maxWidth: 320 },
  option: { padding: spacing.lg, borderRadius: radii.md, borderWidth: 1, marginBottom: spacing.md, alignItems: "center" },
  optionText: { fontSize: 32, fontFamily: "Amiri_400Regular" },
});
