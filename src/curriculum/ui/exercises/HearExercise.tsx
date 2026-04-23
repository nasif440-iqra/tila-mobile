import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "../../../design/theme";
import { typography, spacing, radii, fontFamilies } from "../../../design/tokens";
import type { HearExercise as HearExerciseData } from "../../types";
import type { EntityAttempt, ScreenOutcome } from "../../runtime/LessonRunner";

interface Props {
  screenId: string;
  exercise: HearExerciseData;
  advance: (outcome?: ScreenOutcome) => void;
  reportAttempt: (attempts: EntityAttempt[]) => void;
  onPlayAudio?: (path: string) => void;
}

export function HearExercise({ screenId, exercise, advance, onPlayAudio }: Props) {
  const colors = useColors();
  const [playing, setPlaying] = useState(false);

  const handleSpeakerTap = () => {
    setPlaying(true);
    onPlayAudio?.(exercise.audioPath);
    setTimeout(() => setPlaying(false), 800);
  };

  // Lesson 1 Hear is the options-less listen-only variant.
  // Scored-Hear with options is not exercised in A0 (see spec §7.2);
  // we still render options when present so future lessons work without
  // a component rewrite.
  const hasOptions = exercise.options && exercise.options.length > 0;

  return (
    <View style={styles.container}>
      <Text style={[styles.prompt, { color: colors.text }]}>{exercise.prompt}</Text>
      <Pressable
        onPress={handleSpeakerTap}
        style={[
          styles.speaker,
          { backgroundColor: playing ? colors.accent : colors.primary },
        ]}
        accessibilityRole="button"
        accessibilityLabel={exercise.note ?? "Play audio"}
      >
        <Text style={[styles.speakerIcon, { color: colors.bg }]}>🔊</Text>
      </Pressable>
      {exercise.displayOnScreen ? (
        <Text style={[styles.glyph, { color: colors.text }]}>{exercise.displayOnScreen}</Text>
      ) : null}
      {exercise.note ? (
        <Text style={[styles.hint, { color: colors.textSoft }]}>{exercise.note}</Text>
      ) : null}
      {!hasOptions ? (
        <Pressable
          onPress={() => advance()}
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Next"
        >
          <Text style={[styles.nextText, { color: colors.bg }]}>Next</Text>
        </Pressable>
      ) : null}
      {hasOptions ? (
        <View style={styles.options}>
          {exercise.options!.map((opt, i) => (
            <Pressable
              key={i}
              onPress={() =>
                advance({
                  screenId,
                  correct: opt.correct,
                  entityAttempts: [
                    { entityKey: opt.entityKey, itemId: screenId, correct: opt.correct },
                  ],
                })
              }
              style={[styles.option, { borderColor: colors.border }]}
              accessibilityLabel={opt.display}
              accessibilityRole="button"
            >
              <Text style={[styles.glyph, { color: colors.text }]}>{opt.display}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.md, gap: spacing.md },
  prompt: { ...typography.body, textAlign: "center" },
  speaker: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: "center", justifyContent: "center",
  },
  speakerIcon: { fontSize: 32 },
  glyph: { fontFamily: fontFamilies.arabicRegular, fontSize: 72, lineHeight: 88 },
  hint: { ...typography.label, fontStyle: "italic" },
  nextButton: {
    marginTop: spacing.lg,
    alignSelf: "stretch",
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    alignItems: "center",
  },
  nextText: { ...typography.body, fontWeight: "600" },
  options: { flexDirection: "row", gap: spacing.sm, alignSelf: "stretch" },
  option: {
    flex: 1, borderWidth: 2,
    borderRadius: radii.lg, padding: spacing.md,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#ffffff",
  },
});
