import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "../../design/theme";
import { typography, spacing, radii, fontFamilies } from "../../design/tokens";
import type { LessonData } from "../types";
import type { LessonOutcome } from "../runtime/LessonRunner";
import { lessonRegistry } from "../lessons";

interface Props {
  lesson: LessonData;
  outcome: LessonOutcome;
  onContinue: () => void;
  maxPreviewGlyphs?: number;
}

const DEFAULT_MAX_PREVIEW_GLYPHS = 6;

function resolveGlyph(entityKey: string): string | null {
  // A0 mapping: only letters Lesson 1 introduces. Future iterations
  // pull from a real entity→display map. Returning null skips the preview
  // safely when an entity key isn't known yet.
  const letterMap: Record<string, string> = {
    "letter:alif": "ا",
    "letter:ba": "ب",
    "letter:meem": "م",
    "letter:laam": "ل",
    "letter:noon": "ن",
    "combo:ba+fatha": "بَ",
  };
  return letterMap[entityKey] ?? null;
}

export function LessonCompletionView({
  lesson,
  outcome,
  onContinue,
  maxPreviewGlyphs = DEFAULT_MAX_PREVIEW_GLYPHS,
}: Props) {
  const colors = useColors();

  // Prefer the explicit completionGlyphs override; fall back to introducedEntities
  // for lessons that don't set one.
  const entities = lesson.completionGlyphs ?? lesson.introducedEntities;
  const glyphs = entities.map(resolveGlyph).filter((g): g is string => g !== null);
  const showPreview =
    glyphs.length > 0 &&
    glyphs.length === entities.length && // every entity resolved
    entities.length <= maxPreviewGlyphs;

  const showScore = outcome.itemsTotal > 0;
  const subtitle = lesson.completionSubtitle ?? "Nice work.";

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.body}>
        <View style={[styles.check, { backgroundColor: colors.primary }]}>
          <Text style={[styles.checkIcon, { color: colors.bg }]}>✓</Text>
        </View>
        <Text style={[styles.title, { color: colors.primary }]}>{lesson.title} complete</Text>
        {showScore ? (
          <Text style={[styles.score, { color: colors.textSoft }]}>
            {outcome.itemsCorrect} of {outcome.itemsTotal} correct
          </Text>
        ) : null}
        {showPreview ? (
          <Text style={[styles.glyphPreview, { color: colors.text }]}>
            {glyphs.join(" · ")}
          </Text>
        ) : null}
        <Text style={[styles.subtitle, { color: colors.text }]}>{subtitle}</Text>
      </View>
      <Pressable
        style={[styles.continueButton, { backgroundColor: colors.primary }]}
        onPress={onContinue}
        accessibilityRole="button"
        accessibilityLabel="Continue"
      >
        <Text style={[styles.continueText, { color: colors.bg }]}>Continue</Text>
      </Pressable>
    </View>
  );
}

// Re-export not strictly needed but kept available for future per-lesson hooks.
void lessonRegistry;

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, justifyContent: "space-between" },
  body: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  check: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.md,
  },
  checkIcon: { fontSize: 36, fontWeight: "600" },
  title: { ...typography.heading2, fontSize: 22 },
  score: { ...typography.label, letterSpacing: 1 },
  glyphPreview: { fontFamily: fontFamilies.arabicRegular, fontSize: 56, lineHeight: 72, letterSpacing: 12 },
  subtitle: { ...typography.body, textAlign: "center", marginTop: spacing.sm },
  continueButton: { paddingVertical: spacing.sm, borderRadius: radii.full, alignItems: "center" },
  continueText: { ...typography.body, fontWeight: "600" },
});
