import { useState, useCallback, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useColors } from "../../src/design/theme";
import { typography, spacing, radii } from "../../src/design/tokens";
import { LessonRunner, type LessonOutcome } from "../../src/curriculum/runtime/LessonRunner";
import { noopMasteryRecorder } from "../../src/curriculum/runtime/mastery-recorder";
import { asyncStorageCompletionStore } from "../../src/curriculum/runtime/completion-store";
import { resolveLessonId } from "../../src/curriculum/runtime/url-resolver";
import { lessonRegistry } from "../../src/curriculum/lessons";
import { LessonChrome } from "../../src/curriculum/ui/LessonChrome";
import { LessonCompletionView } from "../../src/curriculum/ui/LessonCompletionView";
import { TeachingScreenView } from "../../src/curriculum/ui/TeachingScreenView";
import { renderExercise } from "../../src/curriculum/ui/exercises";
import { configureAudioSession, playByPath } from "../../src/audio/player";

export default function LessonRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const lessonId = resolveLessonId(params.id);
  const lesson = lessonId ? lessonRegistry[lessonId] : undefined;

  const [outcome, setOutcome] = useState<LessonOutcome | null>(null);

  const handleComplete = useCallback(async (o: LessonOutcome) => {
    await asyncStorageCompletionStore.markCompleted(o.lessonId);
    setOutcome(o);
  }, []);

  const handleExit = useCallback(() => {
    router.replace("/(tabs)");
  }, []);

  const handleContinue = useCallback(() => {
    router.replace("/(tabs)");
  }, []);

  useEffect(() => {
    void configureAudioSession();
  }, []);

  const onPlayAudio = useCallback((path: string) => {
    playByPath(path);
  }, []);

  if (!lesson) return <LessonNotFound />;

  if (outcome) {
    return (
      <SafeAreaView style={styles.container}>
        <LessonCompletionView lesson={lesson} outcome={outcome} onContinue={handleContinue} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LessonRunner
        lesson={lesson}
        masteryRecorder={noopMasteryRecorder}
        onComplete={handleComplete}
        renderScreen={({ screen, advance, reportAttempt, goBack, canGoBack, index, total }) => (
          <LessonChrome
            screen={screen}
            index={index}
            total={total}
            canGoBack={canGoBack}
            onBack={goBack}
            onExitRequested={handleExit}
          >
            {screen.kind === "teach" ? (
              <TeachingScreenView
                key={screen.id}
                screen={screen}
                onAdvance={() => advance()}
                onPlayAudio={onPlayAudio}
              />
            ) : (
              renderExercise({
                screenId: screen.id,
                exercise: screen.exercise,
                retryMode: screen.retryMode ?? "one-shot",
                advance,
                reportAttempt,
                onPlayAudio,
              })
            )}
          </LessonChrome>
        )}
      />
    </SafeAreaView>
  );
}

function LessonNotFound() {
  const colors = useColors();
  return (
    <SafeAreaView style={[styles.container, styles.notFound, { backgroundColor: colors.bg }]}>
      <Text style={[styles.notFoundTitle, { color: colors.text }]}>Lesson not found</Text>
      <Pressable
        onPress={() => router.replace("/(tabs)")}
        style={[styles.button, { backgroundColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel="Back to home"
      >
        <Text style={[styles.buttonText, { color: colors.bg }]}>Back to home</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { alignItems: "center", justifyContent: "center", padding: spacing.lg, gap: spacing.md },
  notFoundTitle: { ...typography.heading2, textAlign: "center" },
  button: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.full },
  buttonText: { ...typography.body, fontWeight: "600" },
});
