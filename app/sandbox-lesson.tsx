import { useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Redirect } from "expo-router";
import { LessonRunner } from "../src/curriculum/runtime/LessonRunner";
import { noopMasteryRecorder } from "../src/curriculum/runtime/mastery-recorder";
import type { LessonData } from "../src/curriculum/types";
import { useColors } from "../src/design/theme";
import { typography, spacing, radii } from "../src/design/tokens";

const DEV_FLAG = process.env.EXPO_PUBLIC_DEV_REFERENCE_LESSON === "true";

const sandboxLesson: LessonData = {
  id: "lesson-sandbox",
  phase: 0,
  module: "sandbox",
  title: "Runtime smoke test",
  outcome: "Advance through three screens and call onComplete.",
  durationTargetSeconds: 60,
  introducedEntities: [],
  reviewEntities: [],
  passCriteria: { threshold: 0, requireCorrectLastTwoDecoding: false },
  screens: [
    { kind: "teach", id: "t-1", blocks: [{ type: "text", content: "Screen 1 — tap next." }] },
    { kind: "teach", id: "t-2", blocks: [{ type: "text", content: "Screen 2 — tap next." }] },
    { kind: "teach", id: "t-3", blocks: [{ type: "text", content: "Screen 3 — last one." }] },
  ],
};

export default function SandboxLessonScreen() {
  if (!DEV_FLAG) return <Redirect href="/(tabs)" />;

  const colors = useColors();

  const handleComplete = useCallback(() => {
    router.replace("/(tabs)");
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <LessonRunner
        lesson={sandboxLesson}
        masteryRecorder={noopMasteryRecorder}
        onComplete={handleComplete}
        renderScreen={({ screen, advance, canGoBack, goBack, index, total }) => {
          if (screen.kind !== "teach") return null;
          const firstTextBlock = screen.blocks.find((b) => b.type === "text");
          const body = firstTextBlock && firstTextBlock.type === "text" ? firstTextBlock.content : "";
          return (
            <View style={styles.body}>
              <Text style={[styles.progress, { color: colors.textSoft }]}>
                {index + 1} of {total}
              </Text>
              <Text style={[styles.content, { color: colors.text }]}>{body}</Text>
              <View style={styles.actions}>
                {canGoBack ? (
                  <Pressable onPress={goBack} style={styles.backBtn}>
                    <Text style={{ color: colors.textSoft }}>Back</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => advance()} style={[styles.next, { backgroundColor: colors.primary }]}>
                  <Text style={{ color: colors.bg, fontWeight: "600" }}>Next</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, justifyContent: "center", padding: spacing.lg },
  progress: { ...typography.label, textAlign: "center", marginBottom: spacing.sm },
  content: { ...typography.body, textAlign: "center", marginBottom: spacing.xl },
  actions: { flexDirection: "row", justifyContent: "center", gap: spacing.sm },
  backBtn: { padding: spacing.sm, borderRadius: radii.full },
  next: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.full },
});
